import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch events");
    }

    const events = data.items.map((item: any) => ({
      id: item.id,
      title: item.summary,
      start: item.start.dateTime || item.start.date,
      end: item.end.dateTime || item.end.date,
      extendedProps: {
        calendar: "Primary",
        description: item.description,
        location: item.location,
      },
    }));

    return NextResponse.json(events);
  } catch (error: any) {
    console.error("Calendar fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error?.message || "Failed to delete event");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Calendar delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, start, end, description, location, reminderMinutes } = body;

    if (!title || !start || !end) {
      return NextResponse.json({ error: "Title, start, and end are required" }, { status: 400 });
    }

    const eventData: any = {
      summary: title,
      description,
      location,
      start: {
        dateTime: new Date(start).toISOString(),
      },
      end: {
        dateTime: new Date(end).toISOString(),
      },
    };

    // If a reminder is specified, override defaults
    if (reminderMinutes !== undefined && reminderMinutes !== null) {
      eventData.reminders = {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: parseInt(reminderMinutes) },
        ],
      };
    }

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(session as any).accessToken}`,
        },
        body: JSON.stringify(eventData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to create event");
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Calendar create error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
