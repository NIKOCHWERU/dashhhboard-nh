import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

    let googleEventId = null;

    // 1. Sync to Google Calendar first to get ID
    if (accessToken) {
      try {
        const googleRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `[${scale}] ${title}`,
            description: buildGoogleCalendarDescription(pic, description, notes),
            start: { dateTime: new Date(startDate).toISOString() },
            end: { dateTime: new Date(endDate).toISOString() },
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 1440 },
                { method: "popup", minutes: 300 },
                { method: "email", minutes: 1440 },
              ],
            },
          }),
        });
        const resData = await googleRes.json();
        if (googleRes.ok) googleEventId = resData.id;
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

    // 2. Update or Create Google Calendar event
    let newGoogleEventId = existing.googleEventId;

    if (accessToken) {
      try {
        const method = existing.googleEventId ? "PUT" : "POST";
        const url = existing.googleEventId 
          ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}`
          : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

        const googleRes = await fetch(url, {
          method: method,
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `[${scale}] ${title}`,
            description: buildGoogleCalendarDescription(pic, description, notes),
            start: { dateTime: new Date(startDate).toISOString() },
            end: { dateTime: new Date(endDate).toISOString() },
            reminders: {
              useDefault: false,
              overrides: [
                { method: "popup", minutes: 1440 },
                { method: "popup", minutes: 300 },
                { method: "email", minutes: 1440 },
              ],
            },
          }),
        });

        if (googleRes.ok && !existing.googleEventId) {
          const resData = await googleRes.json();
          newGoogleEventId = resData.id;
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
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}`, {
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
