import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  try {
    let tasks = await prisma.personalTask.findMany({
      where: { userId },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;

  try {
    const body = await req.json();
    const { title, type, startDate, endDate, status, priority, description, notes, imageUrl } = body;

    let googleEventId = null;

    // 1. Sync to Google Calendar if type is AGENDA and accessToken is available
    if (type === "AGENDA" && accessToken) {
      try {
        const googleRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            summary: `[Pribadi] ${title}`,
            description: `${description || ""}\n\nCatatan: ${notes || ""}`,
            start: { dateTime: new Date(startDate).toISOString() },
            end: { dateTime: new Date(endDate || startDate).toISOString() },
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
      } catch (e) {
        console.error("Google Personal Agenda Sync Error:", e);
      }
    }

    const task = await prisma.personalTask.create({
      data: {
        title,
        type: type || "CATATAN",
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        status: status || "PENDING",
        priority: priority || "Q2",
        description,
        notes,
        googleEventId,
        imageUrl,
        userId: (session.user as any).id,
      },
    });

    return NextResponse.json(task);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const accessToken = (session as any).accessToken;

  try {
    const body = await req.json();
    const { title, type, startDate, endDate, status, priority, description, notes, imageUrl } = body;

    // Verify ownership
    const existing = await prisma.personalTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let newGoogleEventId = existing.googleEventId;

    if (accessToken) {
      if (type === "AGENDA") {
        // Sync or update in Google Calendar
        try {
          const method = existing.googleEventId ? "PUT" : "POST";
          const url = existing.googleEventId
            ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}`
            : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

          const googleRes = await fetch(url, {
            method,
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              summary: `[Pribadi] ${title}`,
              description: `${description || ""}\n\nCatatan: ${notes || ""}`,
              start: { dateTime: new Date(startDate).toISOString() },
              end: { dateTime: new Date(endDate || startDate).toISOString() },
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
        } catch (e) {
          console.error("Google Personal Agenda Update Error:", e);
        }
      } else if (type === "CATATAN" && existing.googleEventId) {
        // Changed back to Catatan, delete from Google Calendar
        try {
          await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          newGoogleEventId = null;
        } catch (e) {
          console.error("Google Personal Agenda Delete on downgrade error:", e);
        }
      }
    }

    const updated = await prisma.personalTask.update({
      where: { id },
      data: {
        title,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate || startDate),
        status,
        priority,
        description,
        notes,
        googleEventId: newGoogleEventId,
        imageUrl,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const accessToken = (session as any).accessToken;

  try {
    // Verify ownership
    const existing = await prisma.personalTask.findUnique({ where: { id } });
    if (!existing || existing.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete Google Calendar Event if exists
    if (existing.googleEventId && accessToken) {
      try {
        await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${existing.googleEventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch (e) {
        console.error("Google Personal Agenda Delete Error:", e);
      }
    }

    await prisma.personalTask.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
