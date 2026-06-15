import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Helper to get access token of any user from Account table
async function getUserAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  });

  if (!account) return null;

  // Check if token is not expired (less than 1 minute remaining)
  const expiresAt = account.expires_at;
  if (expiresAt && Date.now() < expiresAt * 1000 - 60000) {
    return account.access_token;
  }

  // Refresh token
  if (!account.refresh_token) return null;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: account.refresh_token,
      }),
      method: "POST",
    });

    const tokens = await response.json();
    if (!response.ok) throw tokens;

    const newAccessToken = tokens.access_token;
    const newExpiresAt = Math.floor(Date.now() / 1000 + tokens.expires_in);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: newAccessToken,
        expires_at: newExpiresAt,
        refresh_token: tokens.refresh_token ?? account.refresh_token
      }
    });

    return newAccessToken;
  } catch (error) {
    console.error(`Error refreshing access token for user ${userId}:`, error);
    return null;
  }
}

// Helper to resolve PIC names to emails and userIds
async function resolvePICs(picString: string) {
  const names = picString.split(",").map(n => n.trim()).filter(Boolean);
  const resolved = [];

  for (const name of names) {
    // 1. Check User table
    const dbUser = await prisma.user.findFirst({
      where: { name }
    });
    if (dbUser) {
      resolved.push({
        name,
        email: dbUser.email,
        userId: dbUser.id
      });
      continue;
    }

    // 2. Check Karyawan table
    const karyawan = await prisma.karyawan.findFirst({
      where: { name }
    });
    if (karyawan) {
      resolved.push({
        name,
        email: karyawan.email,
        userId: null
      });
      continue;
    }

    resolved.push({
      name,
      email: null,
      userId: null
    });
  }
  return resolved;
}

function calculateReminderMinutes(startDateStr: string, pengingatHari: string, pengingatWaktu: string) {
  const eventDate = new Date(startDateStr);
  const daysBefore = parseInt(pengingatHari) || 0;
  const reminderDate = new Date(eventDate);
  reminderDate.setDate(reminderDate.getDate() - daysBefore);

  const [hours, minutes] = (pengingatWaktu || "09:00").split(":").map(Number);
  reminderDate.setHours(hours, minutes, 0, 0);

  const diffMs = eventDate.getTime() - reminderDate.getTime();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  return diffMinutes > 0 ? diffMinutes : 0;
}

function mapRecurrence(pengingatPengulangan: string): string[] | undefined {
  if (pengingatPengulangan === "weekly") return ["RRULE:FREQ=WEEKLY"];
  if (pengingatPengulangan === "monthly") return ["RRULE:FREQ=MONTHLY"];
  if (pengingatPengulangan === "yearly") return ["RRULE:FREQ=YEARLY"];
  if (pengingatPengulangan === "tanggal7") return ["RRULE:FREQ=MONTHLY;BYMONTHDAY=7"];
  return undefined;
}

function buildGoogleCalendarDescription(pic: string, description: string, notes: string) {
  let displayNotes = notes;
  let displayKategori = "";
  let displayLokasi = "";
  let displayReminder = "";
  let displayFileLink = "";

  try {
    if (notes && notes.startsWith("{") && notes.endsWith("}")) {
      const parsed = JSON.parse(notes);
      displayNotes = parsed.realNotes || "";
      displayKategori = parsed.kategori === "Lainnya" ? parsed.kategoriLainnya : parsed.kategori;
      displayLokasi = parsed.lokasi || "";
      if (parsed.reminderEnabled) {
        let reminderText = `Waktu: ${parsed.pengingatWaktu || "09:00"}`;
        
        let hariLabel = "Hari H";
        if (parsed.pengingatHari === "1") hariLabel = "1 Hari Sebelumnya";
        else if (parsed.pengingatHari === "2") hariLabel = "2 Hari Sebelumnya";
        else if (parsed.pengingatHari === "3") hariLabel = "3 Hari Sebelumnya";
        else if (parsed.pengingatHari === "7") hariLabel = "1 Minggu Sebelumnya";

        let pengulanganLabel = "Tidak Ada Pengulangan";
        if (parsed.pengingatPengulangan === "tanggal7") pengulanganLabel = "Per Tanggal 7";
        else if (parsed.pengingatPengulangan === "weekly") pengulanganLabel = "1 Minggu Sekali";
        else if (parsed.pengingatPengulangan === "monthly") pengulanganLabel = "1 Bulan Sekali";
        else if (parsed.pengingatPengulangan === "yearly") pengulanganLabel = "1 Tahun Sekali";

        reminderText += ` (Hari: ${hariLabel}, Ulang: ${pengulanganLabel})`;
        displayReminder = reminderText;
      }
      displayFileLink = parsed.fileLink || "";
    }
  } catch (e) {
    // Fail-safe
  }

  let desc = `Peserta: ${pic || "-"}\n`;
  if (displayKategori) desc += `Kategori: ${displayKategori}\n`;
  if (displayLokasi) desc += `Lokasi: ${displayLokasi}\n`;
  if (displayReminder) desc += `Pengingat: ${displayReminder}\n`;
  if (displayFileLink) desc += `Berkas/Tautan: ${displayFileLink}\n`;
  desc += `\nKeterangan: ${description || "-"}\n`;
  desc += `Catatan: ${displayNotes || "-"}`;

  return desc;
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "admin" && !user.canCreateAgenda) {
    return NextResponse.json({ error: "Forbidden: You don't have permission to manage schedules" }, { status: 403 });
  }

  const accessToken = (session as any).accessToken;

  try {
    const body = await req.json();
    const { title, startDate, endDate, pic, scale, description, notes } = body;

    // Parse reminder settings
    let reminderEnabled = false;
    let pengingatHari = "0";
    let pengingatWaktu = "09:00";
    let pengingatPengulangan = "none";
    try {
      if (notes && notes.startsWith("{") && notes.endsWith("}")) {
        const parsed = JSON.parse(notes);
        reminderEnabled = !!parsed.reminderEnabled;
        pengingatHari = parsed.pengingatHari || "0";
        pengingatWaktu = parsed.pengingatWaktu || "09:00";
        pengingatPengulangan = parsed.pengingatPengulangan || "none";
      }
    } catch (e) {}

    // Resolve PICs to find attendee emails and userIds
    const picsResolved = await resolvePICs(pic || "");
    const attendees = picsResolved
      .map((p) => (p.email ? { email: p.email } : null))
      .filter(Boolean) as { email: string }[];

    // Calculate alarm overrides
    const reminderMinutes = calculateReminderMinutes(startDate, pengingatHari, pengingatWaktu);
    let googleReminders = { useDefault: true } as any;
    if (reminderEnabled && reminderMinutes > 0) {
      googleReminders = {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: reminderMinutes },
          { method: "email", minutes: reminderMinutes }
        ]
      };
    }

    // Map recurrence
    const recurrence = mapRecurrence(pengingatPengulangan);

    let googleEventId = null;

    // 1. Sync to Google Calendar first to get ID
    if (accessToken) {
      try {
        const googleRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `[${scale}] ${title}`,
            description: buildGoogleCalendarDescription(pic, description, notes),
            start: { dateTime: new Date(startDate).toISOString() },
            end: { dateTime: new Date(endDate).toISOString() },
            attendees,
            reminders: googleReminders,
            recurrence
          }),
        });
        const resData = await googleRes.json();
        if (googleRes.ok) {
          googleEventId = resData.id;

          // 1b. Set notifications specifically on each attendee's copy of the event if they have connected Google Accounts
          for (const attendee of picsResolved) {
            if (attendee.userId && attendee.userId !== user.id) {
              const attendeeAccessToken = await getUserAccessToken(attendee.userId);
              if (attendeeAccessToken) {
                try {
                  await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${attendeeAccessToken}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reminders: googleReminders
                    })
                  });
                } catch (patchErr) {
                  console.error(`Failed to patch reminder for attendee ${attendee.name}:`, patchErr);
                }
              }
            }
          }
        } else {
          console.error("Google Sync Failed. Response:", resData);
        }
      } catch (e) { console.error("Google Sync Error:", e); }
    }

    // 2. Save to Local DB
    const agenda = await prisma.agenda.create({
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        pic,
        scale,
        description,
        notes,
        googleEventId,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(agenda);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "admin" && !user.canCreateAgenda) {
    return NextResponse.json({ error: "Forbidden: You don't have permission to manage schedules" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const accessToken = (session as any).accessToken;

  try {
    const body = await req.json();
    const { title, startDate, endDate, pic, scale, description, notes } = body;

    // 1. Get existing agenda to find googleEventId
    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parse reminder settings
    let reminderEnabled = false;
    let pengingatHari = "0";
    let pengingatWaktu = "09:00";
    let pengingatPengulangan = "none";
    try {
      if (notes && notes.startsWith("{") && notes.endsWith("}")) {
        const parsed = JSON.parse(notes);
        reminderEnabled = !!parsed.reminderEnabled;
        pengingatHari = parsed.pengingatHari || "0";
        pengingatWaktu = parsed.pengingatWaktu || "09:00";
        pengingatPengulangan = parsed.pengingatPengulangan || "none";
      }
    } catch (e) {}

    // Resolve PICs to find attendee emails and userIds
    const picsResolved = await resolvePICs(pic || "");
    const attendees = picsResolved
      .map((p) => (p.email ? { email: p.email } : null))
      .filter(Boolean) as { email: string }[];

    // Calculate alarm overrides
    const reminderMinutes = calculateReminderMinutes(startDate, pengingatHari, pengingatWaktu);
    let googleReminders = { useDefault: true } as any;
    if (reminderEnabled && reminderMinutes > 0) {
      googleReminders = {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: reminderMinutes },
          { method: "email", minutes: reminderMinutes }
        ]
      };
    }

    // Map recurrence
    const recurrence = mapRecurrence(pengingatPengulangan);

    // 2. Update or Create Google Calendar event
    let newGoogleEventId = existing.googleEventId;

    if (accessToken) {
      try {
        const method = existing.googleEventId ? "PUT" : "POST";
        const url = existing.googleEventId 
          ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}?sendUpdates=all`
          : "https://www.googleapis.com/calendar/v3/calendars/primary/events?sendUpdates=all";

        const googleRes = await fetch(url, {
          method: method,
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `[${scale}] ${title}`,
            description: buildGoogleCalendarDescription(pic, description, notes),
            start: { dateTime: new Date(startDate).toISOString() },
            end: { dateTime: new Date(endDate).toISOString() },
            attendees,
            reminders: googleReminders,
            recurrence
          }),
        });

        if (googleRes.ok) {
          if (!existing.googleEventId) {
            const resData = await googleRes.json();
            newGoogleEventId = resData.id;
          }

          // 2b. Set notifications specifically on each attendee's copy of the event if they have connected Google Accounts
          const activeEventId = newGoogleEventId;
          if (activeEventId) {
            for (const attendee of picsResolved) {
              if (attendee.userId && attendee.userId !== user.id) {
                const attendeeAccessToken = await getUserAccessToken(attendee.userId);
                if (attendeeAccessToken) {
                  try {
                    await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${activeEventId}`, {
                      method: "PATCH",
                      headers: { Authorization: `Bearer ${attendeeAccessToken}`, "Content-Type": "application/json" },
                      body: JSON.stringify({
                        reminders: googleReminders
                      })
                    });
                  } catch (patchErr) {
                    console.error(`Failed to patch reminder for attendee ${attendee.name}:`, patchErr);
                  }
                }
              }
            }
          }
        } else {
          const resData = await googleRes.json();
          console.error("Google Sync PUT/POST Failed. Response:", resData);
        }
      } catch (e) { console.error("Google Update Error:", e); }
    }

    // 3. Update Local DB
    const updated = await prisma.agenda.update({
      where: { id },
      data: {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        pic,
        scale,
        description,
        notes,
        googleEventId: newGoogleEventId,
      },
    });


    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;
  if (user.role !== "admin" && !user.canCreateAgenda) {
    return NextResponse.json({ error: "Forbidden: You don't have permission to manage schedules" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const accessToken = (session as any).accessToken;

  try {
    const existing = await prisma.agenda.findUnique({ where: { id } });
    if (existing && accessToken && existing.googleEventId) {
      try {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}?sendUpdates=all`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) { console.error("Google Delete Error:", e); }
    }

    await prisma.agenda.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as any;

  try {
    let agendas;
    if (user.role === "admin" || user.canCreateAgenda) {
      agendas = await prisma.agenda.findMany({
        orderBy: { startDate: "asc" },
      });
    } else {
      // Read-only: only return schedules created by admins
      agendas = await prisma.agenda.findMany({
        where: {
          user: {
            role: "admin",
          },
        },
        orderBy: { startDate: "asc" },
      });
    }
    return NextResponse.json(agendas);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
