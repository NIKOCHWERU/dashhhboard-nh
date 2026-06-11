import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadFile, getOrCreateFolder, getAccessToken } from "@/lib/googleDrive";

const SI_FOLDER_NAME = "Surat Introduksi";

export async function GET() {
  try {
    const data = await prisma.suratIntroduksi.findMany({
      include: { klien: { select: { id: true, namaKlien: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const klienId = formData.get("klienId") as string;
    const keterangan = formData.get("keterangan") as string || "";
    const createdBy = formData.get("createdBy") as string || "";
    const file = formData.get("file") as File | null;

    if (!klienId) return NextResponse.json({ error: "klienId required" }, { status: 400 });

    let googleFileId: string | null = null;
    let googleFolderId: string | null = null;
    let webViewLink: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const accessToken = await getAccessToken();
      const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
      const internalFolderId = await getOrCreateFolder(accessToken, "Berkas Internal", mainFolderId);
      const folderId = await getOrCreateFolder(accessToken, SI_FOLDER_NAME, internalFolderId);
      const buffer = Buffer.from(await file.arrayBuffer());
      const result = await uploadFile(folderId, file.name, file.type, buffer, keterangan);
      googleFileId = result.id || null;
      googleFolderId = folderId;
      webViewLink = result.webViewLink || null;
      fileName = file.name;
    }

    const data = await prisma.suratIntroduksi.create({
      data: { klienId, keterangan, googleFileId, googleFolderId, webViewLink, fileName, createdBy },
      include: { klien: { select: { id: true, namaKlien: true } } },
    });
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("SI POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const data = await prisma.suratIntroduksi.update({
      where: { id: body.id },
      data: { klienId: body.klienId, keterangan: body.keterangan || null },
      include: { klien: { select: { id: true, namaKlien: true } } },
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
    await prisma.suratIntroduksi.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
