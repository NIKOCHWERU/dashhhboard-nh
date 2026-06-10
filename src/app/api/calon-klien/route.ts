import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.calonKlien.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await prisma.calonKlien.create({
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : null,
        namaProspek: body.namaProspek,
        potensiPekerjaan: body.potensiPekerjaan || null,
        domisili: body.domisili || null,
        email: body.email || null,
        mediaSosial: body.mediaSosial || null,
        telephone: body.telephone || null,
        kategoriManit: body.kategoriManit || null,
        kegiatanDilakukan: body.kegiatanDilakukan || null,
        tantangan: body.tantangan || null,
        informasiPenting: body.informasiPenting || null,
        keterangan: body.keterangan || null,
        catatan: body.catatan || null,
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
    const data = await prisma.calonKlien.update({
      where: { id: body.id },
      data: {
        tanggal: body.tanggal ? new Date(body.tanggal) : null,
        namaProspek: body.namaProspek,
        potensiPekerjaan: body.potensiPekerjaan || null,
        domisili: body.domisili || null,
        email: body.email || null,
        mediaSosial: body.mediaSosial || null,
        telephone: body.telephone || null,
        kategoriManit: body.kategoriManit || null,
        kegiatanDilakukan: body.kegiatanDilakukan || null,
        tantangan: body.tantangan || null,
        informasiPenting: body.informasiPenting || null,
        keterangan: body.keterangan || null,
        catatan: body.catatan || null,
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
    await prisma.calonKlien.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
