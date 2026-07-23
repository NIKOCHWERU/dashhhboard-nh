import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { uploaderName: { contains: search } },
        { fileName: { contains: search } },
      ];
    }
    if (category && category !== "Semua") {
      where.category = category;
    }

    const templates = await prisma.wordTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(templates);
  } catch (err: any) {
    console.error("GET /api/word-templates error:", err);
    return NextResponse.json({ error: "Gagal mengambil templat." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const uploaderName = session?.user?.name || "Pengguna";
    const uploaderId = (session?.user as any)?.id || null;

    const body = await req.json();
    const { title, description, category, fileUrl, fileName, placeholders } = body;

    if (!title || !fileUrl || !fileName) {
      return NextResponse.json(
        { error: "Judul, nama berkas, dan isi berkas wajib diisi." },
        { status: 400 }
      );
    }

    const newTemplate = await prisma.wordTemplate.create({
      data: {
        title,
        description: description || "",
        category: category || "Umum",
        fileUrl,
        fileName,
        placeholders: JSON.stringify(placeholders || []),
        uploaderName,
        uploaderId,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/word-templates error:", err);
    return NextResponse.json({ error: "Gagal menyimpan templat." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID templat diperlukan." }, { status: 400 });
    }

    await prisma.wordTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/word-templates error:", err);
    return NextResponse.json({ error: "Gagal menghapus templat." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, title, description, category } = body;

    if (!id || !title) {
      return NextResponse.json({ error: "ID dan judul diperlukan." }, { status: 400 });
    }

    const updated = await prisma.wordTemplate.update({
      where: { id },
      data: {
        title,
        description,
        category,
      },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("PUT /api/word-templates error:", err);
    return NextResponse.json({ error: "Gagal memperbarui templat." }, { status: 500 });
  }
}
