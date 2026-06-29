import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const now = new Date();
    const data = await prisma.pengumuman.findMany({
      where: {
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } }
        ]
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch pengumuman" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const priority = formData.get("priority") as string;
    const displayDays = formData.get("displayDays") as string;
    const image = formData.get("image") as File | null;

    let imagePath = null;
    if (image && image.size > 0) {
      const buffer = Buffer.from(await image.arrayBuffer());
      const fileName = `${Date.now()}-${image.name}`;
      const dirPath = path.join(process.cwd(), "public/uploads/announcements");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);
      imagePath = `/uploads/announcements/${fileName}`;
    }

    let expiresAt = null;
    if (displayDays && !isNaN(parseInt(displayDays))) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(displayDays));
    }

    const data = await prisma.pengumuman.create({
      data: {
        title,
        content,
        priority: priority || "Normal",
        image: imagePath,
        expiresAt,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Create pengumuman error:", error);
    return NextResponse.json({ error: "Failed to create pengumuman" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await prisma.pengumuman.findUnique({ where: { id } });
    if (existing && existing.image) {
      try {
        const filePath = path.join(process.cwd(), "public", existing.image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    }

    await prisma.pengumuman.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
