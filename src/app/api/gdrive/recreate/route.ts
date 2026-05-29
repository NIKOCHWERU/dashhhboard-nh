import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientStructuredFolder } from "@/lib/googleDrive";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, clientName, type } = await req.json();
    if (!id || !clientName || !type) {
      return NextResponse.json({ error: "id, clientName, and type are required" }, { status: 400 });
    }

    // Create new structured folder
    const googleFolderId = await createClientStructuredFolder(type, clientName);
    if (!googleFolderId) {
      return NextResponse.json({ error: "Failed to create folder in Google Drive" }, { status: 500 });
    }

    // Update DB
    if (type === "Retainer") {
      await prisma.retainer.update({ where: { id }, data: { googleFolderId } });
    } else {
      await prisma.perorangan.update({ where: { id }, data: { googleFolderId } });
    }

    return NextResponse.json({ googleFolderId });
  } catch (error: any) {
    console.error("GDrive recreate error:", error);
    return NextResponse.json({ error: error.message || "Failed to recreate folder" }, { status: 500 });
  }
}
