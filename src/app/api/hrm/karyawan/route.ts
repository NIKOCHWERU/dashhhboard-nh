import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  uploadFile,
  getSubfolderId,
  getGlobalFolderId,
} from "@/lib/googleDrive";
import { logActivity } from "@/lib/activityLog";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pt = searchParams.get("pt");

    const filter = pt && pt !== "Semua PT" ? { pt } : {};

    const data = await prisma.karyawan.findMany({
      where: filter,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET karyawan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const nik = formData.get("nik") as string;
    const divisi = formData.get("divisi") as string;
    const jabatan = formData.get("jabatan") as string;
    const atasanLangsung = formData.get("atasanLangsung") as string;
    const statusKerja = formData.get("statusKerja") as string;
    const tanggalMasuk = formData.get("tanggalMasuk") as string;
    const tanggalKeluar = formData.get("tanggalKeluar") as string;
    const masaKontrak = formData.get("masaKontrak") as string;
    const lokasiKerja = formData.get("lokasiKerja") as string;
    const bpjsKesehatan = formData.get("bpjsKesehatan") as string;
    const bpjsKetenagakerjaan = formData.get("bpjsKetenagakerjaan") as string;
    const pt = formData.get("pt") as string;
    const status = formData.get("status") as string || "Active";
    const sim = formData.get("sim") as string || null;
    
    const file = formData.get("file") as File;

    if (!name) {
      return NextResponse.json({ error: "Nama Karyawan wajib diisi." }, { status: 400 });
    }

    // 1. Google Drive Folder Target Resolution
    let googleFolderId: string | null = null;
    let fileNameUploaded = "";

    if (file) {
      try {
        let parentFolderId: string | null = null;

        if (pt) {
          // Normalize name helper for robust matching
          const normalizeName = (name: string): string => {
            return name
              .toLowerCase()
              .replace(/\b(pt|cv|tbk|persero|ltd)\b/gi, "")
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          };

          const retainers = await prisma.retainer.findMany();
          const normalizedPt = normalizeName(pt);

          const matchedRetainer = retainers.find((r) => {
            const normClient = normalizeName(r.clientName);
            return (
              normClient === normalizedPt ||
              normClient.includes(normalizedPt) ||
              normalizedPt.includes(normClient)
            );
          });

          if (matchedRetainer && matchedRetainer.googleFolderId) {
            parentFolderId = await getSubfolderId(matchedRetainer.googleFolderId, "Data Karyawan");
          }
        }

        if (!parentFolderId) {
          parentFolderId = await getGlobalFolderId("Dokumen Karyawan Umum");
        }

        if (parentFolderId) {
          const fileBytes = await file.arrayBuffer();
          const fileBuffer = Buffer.from(fileBytes);
          fileNameUploaded = `Karyawan_${name.replace(/\s+/g, "_")}_${file.name}`;
          await uploadFile(parentFolderId, fileNameUploaded, file.type, fileBuffer);
        }
      } catch (gErr) {
        console.error("G-Drive file upload for karyawan failed:", gErr);
      }
    }

    // 2. Create in DB
    const data = await prisma.karyawan.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        position: position || "",
        nik: nik || null,
        divisi: divisi || null,
        jabatan: jabatan || null,
        atasanLangsung: atasanLangsung || null,
        statusKerja: statusKerja || null,
        tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
        tanggalKeluar: tanggalKeluar ? new Date(tanggalKeluar) : null,
        masaKontrak: masaKontrak || null,
        lokasiKerja: lokasiKerja || null,
        bpjsKesehatan: bpjsKesehatan || null,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan || null,
        pt: pt || null,
        status,
        sim,
        documents: fileNameUploaded,
      },
    });

    // 3. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "CREATE",
      "Karyawan",
      `Mendaftarkan karyawan baru: ${data.name} (${data.position}) di perusahaan ${pt || "Umum"}`
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST Karyawan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const position = formData.get("position") as string;
    const nik = formData.get("nik") as string;
    const divisi = formData.get("divisi") as string;
    const jabatan = formData.get("jabatan") as string;
    const atasanLangsung = formData.get("atasanLangsung") as string;
    const statusKerja = formData.get("statusKerja") as string;
    const tanggalMasuk = formData.get("tanggalMasuk") as string;
    const tanggalKeluar = formData.get("tanggalKeluar") as string;
    const masaKontrak = formData.get("masaKontrak") as string;
    const lokasiKerja = formData.get("lokasiKerja") as string;
    const bpjsKesehatan = formData.get("bpjsKesehatan") as string;
    const bpjsKetenagakerjaan = formData.get("bpjsKetenagakerjaan") as string;
    const pt = formData.get("pt") as string;
    const status = formData.get("status") as string;
    const sim = formData.get("sim") as string || null;
    
    const file = formData.get("file") as File;

    const existing = await prisma.karyawan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    // 1. Google Drive File target resolution on update
    let updatedDocsList = existing.documents;

    if (file) {
      try {
        let parentFolderId: string | null = null;

        const resolvedPt = pt || existing.pt;
        if (resolvedPt) {
          // Normalize name helper for robust matching
          const normalizeName = (name: string): string => {
            return name
              .toLowerCase()
              .replace(/\b(pt|cv|tbk|persero|ltd)\b/gi, "")
              .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
              .replace(/\s+/g, " ")
              .trim();
          };

          const retainers = await prisma.retainer.findMany();
          const normalizedPt = normalizeName(resolvedPt);

          const matchedRetainer = retainers.find((r) => {
            const normClient = normalizeName(r.clientName);
            return (
              normClient === normalizedPt ||
              normClient.includes(normalizedPt) ||
              normalizedPt.includes(normClient)
            );
          });

          if (matchedRetainer && matchedRetainer.googleFolderId) {
            parentFolderId = await getSubfolderId(matchedRetainer.googleFolderId, "Data Karyawan");
          }
        }

        if (!parentFolderId) {
          parentFolderId = await getGlobalFolderId("Dokumen Karyawan Umum");
        }

        if (parentFolderId) {
          const fileBytes = await file.arrayBuffer();
          const fileBuffer = Buffer.from(fileBytes);
          const finalFileName = `Karyawan_${(name || existing.name).replace(/\s+/g, "_")}_${file.name}`;
          await uploadFile(parentFolderId, finalFileName, file.type, fileBuffer);
          
          updatedDocsList = existing.documents
            ? `${existing.documents},${finalFileName}`
            : finalFileName;
        }
      } catch (gErr) {
        console.error("G-Drive file upload on update failed:", gErr);
      }
    }

    // 2. Update in DB
    const data = await prisma.karyawan.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        email: email !== undefined ? (email || null) : undefined,
        phone: phone !== undefined ? (phone || null) : undefined,
        position: position !== undefined ? position : undefined,
        nik: nik !== undefined ? (nik || null) : undefined,
        divisi: divisi !== undefined ? (divisi || null) : undefined,
        jabatan: jabatan !== undefined ? (jabatan || null) : undefined,
        atasanLangsung: atasanLangsung !== undefined ? (atasanLangsung || null) : undefined,
        statusKerja: statusKerja !== undefined ? (statusKerja || null) : undefined,
        tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : undefined,
        tanggalKeluar: tanggalKeluar ? new Date(tanggalKeluar) : null,
        masaKontrak: masaKontrak !== undefined ? (masaKontrak || null) : undefined,
        lokasiKerja: lokasiKerja !== undefined ? (lokasiKerja || null) : undefined,
        bpjsKesehatan: bpjsKesehatan !== undefined ? (bpjsKesehatan || null) : undefined,
        bpjsKetenagakerjaan: bpjsKetenagakerjaan !== undefined ? (bpjsKetenagakerjaan || null) : undefined,
        pt: pt !== undefined ? (pt || null) : undefined,
        status: status !== undefined ? status : undefined,
        sim: sim !== undefined ? sim : undefined,
        documents: updatedDocsList,
      },
    });

    // 3. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPDATE",
      "Karyawan",
      `Memperbarui profil karyawan: ${data.name}`
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT Karyawan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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

    const existing = await prisma.karyawan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    await prisma.karyawan.delete({ where: { id } });

    // Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "DELETE",
      "Karyawan",
      `Menghapus karyawan: ${existing.name}`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Karyawan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
