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
      // Admin can see all retainers
      data = await prisma.retainer.findMany({
        orderBy: { startDate: "desc" },
      });
    } else {
      // Non-admin can only see retainers where they are the PIC
      data = await prisma.retainer.findMany({
        where: { picEmail: user.email },
        orderBy: { startDate: "desc" },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch retainer" }, { status: 500 });
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

    // 1. Create Google Drive structured folder hierarchy for PT
    let googleFolderId: string | null = null;
    try {
      googleFolderId = await createClientStructuredFolder(
        "Retainer",
        body.clientName
      );
    } catch (gErr) {
      console.error("Google Drive folder creation failed:", gErr);
    }

    // 2. Create record in DB
    const data = await prisma.retainer.create({
      data: {
        clientName: body.clientName,
        projectName: body.projectName,
        categories: Array.isArray(body.categories) ? body.categories.join(',') : (body.categories || ''),
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status,
        contractValue: body.contractValue ? parseFloat(body.contractValue) : null,
        picEmail: body.picEmail || null,
        googleFolderId,
      },
    });

    // 3. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "CREATE",
      "Retainer",
      `Membuat klien retainer baru: ${data.clientName} (Project: ${data.projectName})`
    );

    // 4. Send notification if PIC assigned
    if (data.picEmail) {
      await sendNotificationByEmail(
        data.picEmail,
        "Penugasan PIC Retainer Baru",
        `Anda telah ditambahkan sebagai PIC untuk Klien Retainer: ${data.clientName}`,
        "/retainer"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST retainer error:", error);
    return NextResponse.json({ error: "Failed to create retainer" }, { status: 500 });
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

    // Fetch existing retainer first to get current folder status
    const existing = await prisma.retainer.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Retainer not found" }, { status: 404 });

    let googleFolderId = existing.googleFolderId;

    try {
      if (googleFolderId) {
        // Folder exists: Rename it if clientName changed
        if (existing.clientName !== body.clientName) {
          await renameFolder(googleFolderId, body.clientName);
        }
      } else {
        // Folder does not exist yet: Create it dynamically
        googleFolderId = await createClientStructuredFolder(
          "Retainer",
          body.clientName
        );
      }
    } catch (gErr) {
      console.error("Google Drive folder rename/create failed:", gErr);
    }

    const data = await prisma.retainer.update({
      where: { id },
      data: {
        clientName: body.clientName,
        projectName: body.projectName,
        categories: Array.isArray(body.categories) ? body.categories.join(',') : (body.categories || ''),
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status,
        contractValue: body.contractValue ? parseFloat(body.contractValue) : null,
        picEmail: body.picEmail || null,
        googleFolderId,
      },
    });

    // Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPDATE",
      "Retainer",
      `Memperbarui klien retainer: ${data.clientName}`
    );

    // Send notification if PIC newly assigned or changed
    if (data.picEmail && data.picEmail !== existing.picEmail) {
      await sendNotificationByEmail(
        data.picEmail,
        "Perubahan PIC Retainer",
        `Anda ditugaskan sebagai PIC baru untuk Klien Retainer: ${data.clientName}`,
        "/retainer"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT retainer error:", error);
    return NextResponse.json({ error: "Failed to update retainer" }, { status: 500 });
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

    const existing = await prisma.retainer.findUnique({ where: { id } });
    if (existing) {
      // Delete Google Drive Folder if it exists
      if (existing.googleFolderId) {
        try {
          await deleteFolder(existing.googleFolderId);
        } catch (gErr) {
          console.error("Google Drive folder deletion failed:", gErr);
        }
      }
      await prisma.retainer.delete({ where: { id } });

      // Log CRUD activity
      await logActivity(
        user.id,
        user.name || user.email,
        "DELETE",
        "Retainer",
        `Menghapus klien retainer: ${existing.clientName}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE retainer error:", error);
    return NextResponse.json({ error: "Failed to delete retainer" }, { status: 500 });
  }
}
