import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.kontenInteraksi.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await prisma.kontenInteraksi.create({
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : null,
        topik: body.topik || null,
        judul: body.judul,
        pembahasan: body.pembahasan || null,
        asalMateri: body.asalMateri || null,
        isiKonten: body.isiKonten || null,
        targetAudien: body.targetAudien || null,
        tipe: body.tipe || null,
        statusPengerjaan: body.statusPengerjaan || null,
        kataKunci: body.kataKunci || null,
        bentukKonten: body.bentukKonten || null,
        saluranDistribusi: body.saluranDistribusi || null,
        catatan: body.catatan || null,
        keteranganPublis: body.keteranganPublis || null,
        createdBy: body.createdBy || null,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data = await prisma.kontenInteraksi.update({
      where: { id: body.id },
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : null,
        topik: body.topik || null,
        judul: body.judul,
        pembahasan: body.pembahasan || null,
        asalMateri: body.asalMateri || null,
        isiKonten: body.isiKonten || null,
        targetAudien: body.targetAudien || null,
        tipe: body.tipe || null,
        statusPengerjaan: body.statusPengerjaan || null,
        kataKunci: body.kataKunci || null,
        bentukKonten: body.bentukKonten || null,
        saluranDistribusi: body.saluranDistribusi || null,
        catatan: body.catatan || null,
        keteranganPublis: body.keteranganPublis || null,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await prisma.kontenInteraksi.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
