import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  createClientStructuredFolder,
  renameFolder,
  deleteFolder,
} from "@/lib/googleDrive";
import { logActivity } from "@/lib/activityLog";
import { sendNotificationByEmail } from "@/lib/notification";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    let data;

    if (user.role === "admin") {
      // Admin sees everything
      data = await prisma.perorangan.findMany({
        orderBy: { startDate: "desc" },
      });
    } else {
      // User only sees cases where they are the PIC
      data = await prisma.perorangan.findMany({
        where: { picEmail: user.email },
        orderBy: { startDate: "desc" },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch perorangan cases" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const body = await req.json();

    // 1. Create Google Drive structured folder hierarchy for Perorangan Client
    let googleFolderId: string | null = null;
    try {
      googleFolderId = await createClientStructuredFolder(
        "Perorangan",
        body.clientName
      );
    } catch (gErr) {
      console.error("Google Drive Perorangan folder creation failed:", gErr);
    }

    // 2. Create in DB
    const data = await prisma.perorangan.create({
      data: {
        clientName: body.clientName,
        caseType: body.caseType,
        startDate: new Date(body.startDate),
        status: body.status,
        picEmail: body.picEmail || null,
        googleFolderId,
      },
    });

    // 3. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "CREATE",
      "Perorangan",
      `Membuat kasus perorangan baru: ${data.clientName} (Kasus: ${data.caseType})`
    );

    // 4. Send notification if PIC assigned
    if (data.picEmail) {
      await sendNotificationByEmail(
        data.picEmail,
        "Penugasan PIC Kasus Baru",
        `Anda telah ditambahkan sebagai PIC untuk Klien Perorangan: ${data.clientName}`,
        "/perorangan"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST perorangan error:", error);
    return NextResponse.json({ error: "Failed to create perorangan case" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const body = await req.json();

    // Fetch existing
    const existing = await prisma.perorangan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    let googleFolderId = existing.googleFolderId;

    try {
      if (googleFolderId) {
        if (existing.clientName !== body.clientName) {
          await renameFolder(googleFolderId, body.clientName);
        }
      } else {
        googleFolderId = await createClientStructuredFolder(
          "Perorangan",
          body.clientName
        );
      }
    } catch (gErr) {
      console.error("Google Drive folder rename/create failed:", gErr);
    }

    const data = await prisma.perorangan.update({
      where: { id },
      data: {
        clientName: body.clientName,
        caseType: body.caseType,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        status: body.status,
        picEmail: body.picEmail || null,
        googleFolderId,
      },
    });

    // Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPDATE",
      "Perorangan",
      `Memperbarui kasus perorangan: ${data.clientName}`
    );

    // Send notification if PIC assigned or changed
    if (data.picEmail && data.picEmail !== existing.picEmail) {
      await sendNotificationByEmail(
        data.picEmail,
        "Perubahan PIC Kasus",
        `Anda ditugaskan sebagai PIC baru untuk Klien Perorangan: ${data.clientName}`,
        "/perorangan"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT perorangan error:", error);
    return NextResponse.json({ error: "Failed to update perorangan case" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const existing = await prisma.perorangan.findUnique({ where: { id } });
    if (existing) {
      if (existing.googleFolderId) {
        try {
          await deleteFolder(existing.googleFolderId);
        } catch (gErr) {
          console.error("Google Drive folder deletion failed:", gErr);
        }
      }
      await prisma.perorangan.delete({ where: { id } });

      // Log CRUD activity
      await logActivity(
        user.id,
        user.name || user.email,
        "DELETE",
        "Perorangan",
        `Menghapus kasus perorangan: ${existing.clientName}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE perorangan error:", error);
    return NextResponse.json({ error: "Failed to delete perorangan case" }, { status: 500 });
  }
}
