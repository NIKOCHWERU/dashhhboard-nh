import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const dateStr = searchParams.get("date"); // format YYYY-MM-DD

    let whereClause: any = {};

    // Role-based access control
    if (user.role === "admin") {
      if (userId) {
        whereClause.userId = userId;
      }
    } else {
      // Regular user can only view their own reports
      whereClause.userId = user.id;
    }

    // Filter by specific date
    if (dateStr) {
      const targetDate = new Date(dateStr);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      whereClause.tanggal = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const data = await prisma.laporanHarian.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: { tanggal: "desc" }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET laporan-harian error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch reports" }, { status: 500 });
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
    const { prioritas, rincianKegiatan, hasilKerja, tugasEsok, refleksi, documents, date } = body;

    // Check if report already exists for this user on the selected day to prevent duplicates
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const existing = await prisma.laporanHarian.findFirst({
      where: {
        userId: user.id,
        tanggal: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (existing) {
      // Overwrite / Update the existing report for today
      const updated = await prisma.laporanHarian.update({
        where: { id: existing.id },
        data: {
          prioritas: typeof prioritas === "string" ? prioritas : JSON.stringify(prioritas),
          rincianKegiatan: typeof rincianKegiatan === "string" ? rincianKegiatan : JSON.stringify(rincianKegiatan),
          hasilKerja: typeof hasilKerja === "string" ? hasilKerja : JSON.stringify(hasilKerja),
          tugasEsok: typeof tugasEsok === "string" ? tugasEsok : JSON.stringify(tugasEsok),
          refleksi: typeof refleksi === "string" ? refleksi : JSON.stringify(refleksi),
          documents: typeof documents === "string" ? documents : JSON.stringify(documents || []),
          tanggal: date ? new Date(date) : undefined
        }
      });
      return NextResponse.json(updated);
    }

    const data = await prisma.laporanHarian.create({
      data: {
        userId: user.id,
        prioritas: typeof prioritas === "string" ? prioritas : JSON.stringify(prioritas),
        rincianKegiatan: typeof rincianKegiatan === "string" ? rincianKegiatan : JSON.stringify(rincianKegiatan),
        hasilKerja: typeof hasilKerja === "string" ? hasilKerja : JSON.stringify(hasilKerja),
        tugasEsok: typeof tugasEsok === "string" ? tugasEsok : JSON.stringify(tugasEsok),
        refleksi: typeof refleksi === "string" ? refleksi : JSON.stringify(refleksi),
        documents: typeof documents === "string" ? documents : JSON.stringify(documents || []),
        tanggal: date ? new Date(date) : undefined
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST laporan-harian error:", error);
    return NextResponse.json({ error: error.message || "Failed to save report" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { id, prioritas, rincianKegiatan, hasilKerja, tugasEsok, refleksi, documents } = body;

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    // Fetch existing report
    const existing = await prisma.laporanHarian.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Security check: Only the owner or an admin can update
    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data = await prisma.laporanHarian.update({
      where: { id },
      data: {
        prioritas: prioritas !== undefined ? (typeof prioritas === "string" ? prioritas : JSON.stringify(prioritas)) : undefined,
        rincianKegiatan: rincianKegiatan !== undefined ? (typeof rincianKegiatan === "string" ? rincianKegiatan : JSON.stringify(rincianKegiatan)) : undefined,
        hasilKerja: hasilKerja !== undefined ? (typeof hasilKerja === "string" ? hasilKerja : JSON.stringify(hasilKerja)) : undefined,
        tugasEsok: tugasEsok !== undefined ? (typeof tugasEsok === "string" ? tugasEsok : JSON.stringify(tugasEsok)) : undefined,
        refleksi: refleksi !== undefined ? (typeof refleksi === "string" ? refleksi : JSON.stringify(refleksi)) : undefined,
        documents: documents !== undefined ? (typeof documents === "string" ? documents : JSON.stringify(documents)) : undefined
      }
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT laporan-harian error:", error);
    return NextResponse.json({ error: error.message || "Failed to update report" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Report ID is required" }, { status: 400 });
    }

    const existing = await prisma.laporanHarian.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Security check: Only the owner or an admin can delete
    if (existing.userId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.laporanHarian.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE laporan-harian error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete report" }, { status: 500 });
  }
}
