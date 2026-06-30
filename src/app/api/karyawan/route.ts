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
    const { searchParams } = new URL(req.url);
    const pt = searchParams.get("pt");

    const filter: any = {};
    if (pt && pt !== "Semua PT") {
      filter.pt = pt;
    }

    const karyawanList = await prisma.karyawan.findMany({
      where: filter,
      orderBy: { name: "asc" },
    });

    // Map profile photos from corresponding users by email match
    const emails = karyawanList.map((k) => k.email).filter(Boolean) as string[];
    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { email: true, image: true },
    });

    const userImageMap = new Map(users.map((u) => [u.email, u.image]));

    const data = karyawanList.map((k) => ({
      ...k,
      image: k.email ? userImageMap.get(k.email) || null : null,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("GET karyawan error:", error);
    return NextResponse.json({ error: "Failed to fetch karyawan" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    let fileKtp: File | null = null;
    let fileCv: File | null = null;
    let fileContract: File | null = null;
    let fileBpjsKes: File | null = null;
    let fileBpjsTk: File | null = null;
    let fileSim: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        name: formData.get("name") as string,
        position: formData.get("position") as string || "Staff",
        email: formData.get("email") as string || null,
        phone: formData.get("phone") as string || null,
        status: formData.get("status") as string || "Active",
        nik: formData.get("nik") as string || null,
        divisi: formData.get("divisi") as string || null,
        jabatan: formData.get("jabatan") as string || null,
        atasanLangsung: formData.get("atasanLangsung") as string || null,
        statusKerja: formData.get("statusKerja") as string || null,
        tanggalMasuk: formData.get("tanggalMasuk") as string || null,
        tanggalKeluar: formData.get("tanggalKeluar") as string || null,
        masaKontrak: formData.get("masaKontrak") as string || null,
        lokasiKerja: formData.get("lokasiKerja") as string || null,
        bpjsKesehatan: formData.get("bpjsKesehatan") as string || null,
        bpjsKetenagakerjaan: formData.get("bpjsKetenagakerjaan") as string || null,
        pt: formData.get("pt") as string || null,
      };

      fileKtp = formData.get("file_ktp") as File | null;
      fileCv = formData.get("file_cv") as File | null;
      fileContract = formData.get("file_contract") as File | null;
      fileBpjsKes = formData.get("file_bpjs_kes") as File | null;
      fileBpjsTk = formData.get("file_bpjs_tk") as File | null;
      fileSim = formData.get("file_sim") as File | null;
    } else {
      body = await req.json();
    }

    if (!body.name) {
      return NextResponse.json({ error: "Nama karyawan wajib diisi." }, { status: 400 });
    }

    // 1. Resolve target Google Drive Folder ID
    let uploadFolderId: string | null = null;
    let folderTargetName = "Dokumen Karyawan Umum";

    try {
      let rootParentId: string | null = null;
      if (body.pt) {
        const retainer = await prisma.retainer.findFirst({
          where: { clientName: body.pt },
        });

        if (retainer && retainer.googleFolderId) {
          rootParentId = await getSubfolderId(retainer.googleFolderId, "Data Karyawan");
          folderTargetName = `Data Karyawan (${body.pt})`;
        }
      }

      if (!rootParentId) {
        rootParentId = await getGlobalFolderId("Dokumen Karyawan Umum");
        folderTargetName = "Dokumen Karyawan Umum";
      }

      if (rootParentId) {
        // Separate contract vs permanent
        const isPermanent = body.statusKerja === "PKWTT";
        const statusFolderName = isPermanent ? "Karyawan Tetap" : "Karyawan Kontrak";
        const statusFolderId = await getSubfolderId(rootParentId, statusFolderName);

        if (statusFolderId) {
          // Create specific folder for the employee
          uploadFolderId = await getSubfolderId(statusFolderId, body.name);
          folderTargetName += ` / ${statusFolderName} / ${body.name}`;
        } else {
          uploadFolderId = rootParentId;
        }
      }
    } catch (gErr) {
      console.error("G-Drive folder resolution error, falling back to global:", gErr);
      uploadFolderId = await getGlobalFolderId("Dokumen Karyawan Umum");
    }

    // 2. Upload files if present
    const uploadedDocs: Record<string, string> = {};
    let simFilename: string | null = null;

    const uploadDoc = async (file: File, docName: string) => {
      const fileBytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileBytes);
      const cleanEmpName = body.name.replace(/\s+/g, "_");
      const cleanFileName = file.name.replace(/\s+/g, "_");
      const finalName = `${docName}_${cleanEmpName}_${cleanFileName}`;

      if (uploadFolderId) {
        try {
          await uploadFile(uploadFolderId, finalName, file.type, fileBuffer);
        } catch (uploadErr) {
          console.error(`G-Drive upload failed for ${docName}:`, uploadErr);
        }
      }
      return finalName;
    };

    if (fileKtp) uploadedDocs["ktp"] = await uploadDoc(fileKtp, "KTP");
    if (fileCv) uploadedDocs["cv"] = await uploadDoc(fileCv, "CV");
    if (fileContract) uploadedDocs["contract"] = await uploadDoc(fileContract, "Contract");
    if (fileBpjsKes) uploadedDocs["bpjs_kes"] = await uploadDoc(fileBpjsKes, "BPJS_Kesehatan");
    if (fileBpjsTk) uploadedDocs["bpjs_tk"] = await uploadDoc(fileBpjsTk, "BPJS_Ketenagakerjaan");
    if (fileSim) {
      simFilename = await uploadDoc(fileSim, "SIM");
    }

    // 3. Create employee in DB
    const data = await prisma.karyawan.create({
      data: {
        name: body.name,
        position: body.position,
        email: body.email,
        phone: body.phone,
        status: body.status,
        nik: body.nik,
        divisi: body.divisi,
        jabatan: body.jabatan,
        atasanLangsung: body.atasanLangsung,
        statusKerja: body.statusKerja,
        tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : null,
        tanggalKeluar: body.tanggalKeluar ? new Date(body.tanggalKeluar) : null,
        masaKontrak: body.masaKontrak,
        lokasiKerja: body.lokasiKerja,
        bpjsKesehatan: body.bpjsKesehatan,
        bpjsKetenagakerjaan: body.bpjsKetenagakerjaan,
        pt: body.pt,
        sim: simFilename,
        documents: JSON.stringify(uploadedDocs),
      },
    });

    // 4. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "CREATE",
      "Karyawan",
      `Mendaftarkan karyawan baru: ${data.name} (${data.pt || "No PT"})`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST karyawan error:", error);
    return NextResponse.json({ error: "Failed to create karyawan" }, { status: 500 });
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

    const existing = await prisma.karyawan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    let fileKtp: File | null = null;
    let fileCv: File | null = null;
    let fileContract: File | null = null;
    let fileBpjsKes: File | null = null;
    let fileBpjsTk: File | null = null;
    let fileSim: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        name: formData.get("name") as string,
        position: formData.get("position") as string || "Staff",
        email: formData.get("email") as string || null,
        phone: formData.get("phone") as string || null,
        status: formData.get("status") as string || "Active",
        nik: formData.get("nik") as string || null,
        divisi: formData.get("divisi") as string || null,
        jabatan: formData.get("jabatan") as string || null,
        atasanLangsung: formData.get("atasanLangsung") as string || null,
        statusKerja: formData.get("statusKerja") as string || null,
        tanggalMasuk: formData.get("tanggalMasuk") as string || null,
        tanggalKeluar: formData.get("tanggalKeluar") as string || null,
        masaKontrak: formData.get("masaKontrak") as string || null,
        lokasiKerja: formData.get("lokasiKerja") as string || null,
        bpjsKesehatan: formData.get("bpjsKesehatan") as string || null,
        bpjsKetenagakerjaan: formData.get("bpjsKetenagakerjaan") as string || null,
        pt: formData.get("pt") as string || null,
      };

      fileKtp = formData.get("file_ktp") as File | null;
      fileCv = formData.get("file_cv") as File | null;
      fileContract = formData.get("file_contract") as File | null;
      fileBpjsKes = formData.get("file_bpjs_kes") as File | null;
      fileBpjsTk = formData.get("file_bpjs_tk") as File | null;
      fileSim = formData.get("file_sim") as File | null;
    } else {
      body = await req.json();
    }

    if (!body.name) {
      return NextResponse.json({ error: "Nama karyawan wajib diisi." }, { status: 400 });
    }

    // 1. Resolve target Google Drive Folder ID
    let uploadFolderId: string | null = null;
    let folderTargetName = "Dokumen Karyawan Umum";

    try {
      const resolvedPt = body.pt || existing.pt;
      const resolvedStatusKerja = body.statusKerja || existing.statusKerja;
      const resolvedName = body.name || existing.name;

      let rootParentId: string | null = null;
      if (resolvedPt) {
        const retainer = await prisma.retainer.findFirst({
          where: { clientName: resolvedPt },
        });

        if (retainer && retainer.googleFolderId) {
          rootParentId = await getSubfolderId(retainer.googleFolderId, "Data Karyawan");
          folderTargetName = `Data Karyawan (${resolvedPt})`;
        }
      }

      if (!rootParentId) {
        rootParentId = await getGlobalFolderId("Dokumen Karyawan Umum");
        folderTargetName = "Dokumen Karyawan Umum";
      }

      if (rootParentId) {
        // Separate contract vs permanent
        const isPermanent = resolvedStatusKerja === "PKWTT";
        const statusFolderName = isPermanent ? "Karyawan Tetap" : "Karyawan Kontrak";
        const statusFolderId = await getSubfolderId(rootParentId, statusFolderName);

        if (statusFolderId) {
          // Create specific folder for the employee
          uploadFolderId = await getSubfolderId(statusFolderId, resolvedName);
          folderTargetName += ` / ${statusFolderName} / ${resolvedName}`;
        } else {
          uploadFolderId = rootParentId;
        }
      }
    } catch (gErr) {
      console.error("G-Drive folder resolution error, falling back to global:", gErr);
      uploadFolderId = await getGlobalFolderId("Dokumen Karyawan Umum");
    }

    // 2. Upload files if present
    const uploadedDocs: Record<string, string> = {};
    let simFilename = existing.sim;

    const uploadDoc = async (file: File, docName: string) => {
      const fileBytes = await file.arrayBuffer();
      const fileBuffer = Buffer.from(fileBytes);
      const cleanEmpName = body.name.replace(/\s+/g, "_");
      const cleanFileName = file.name.replace(/\s+/g, "_");
      const finalName = `${docName}_${cleanEmpName}_${cleanFileName}`;

      if (uploadFolderId) {
        try {
          await uploadFile(uploadFolderId, finalName, file.type, fileBuffer);
        } catch (uploadErr) {
          console.error(`G-Drive upload failed for ${docName}:`, uploadErr);
        }
      }
      return finalName;
    };

    if (fileKtp) uploadedDocs["ktp"] = await uploadDoc(fileKtp, "KTP");
    if (fileCv) uploadedDocs["cv"] = await uploadDoc(fileCv, "CV");
    if (fileContract) uploadedDocs["contract"] = await uploadDoc(fileContract, "Contract");
    if (fileBpjsKes) uploadedDocs["bpjs_kes"] = await uploadDoc(fileBpjsKes, "BPJS_Kesehatan");
    if (fileBpjsTk) uploadedDocs["bpjs_tk"] = await uploadDoc(fileBpjsTk, "BPJS_Ketenagakerjaan");
    if (fileSim) {
      simFilename = await uploadDoc(fileSim, "SIM");
    }

    // Parse existing docs
    let existingDocs: Record<string, string> = {};
    try {
      if (existing.documents) {
        existingDocs = JSON.parse(existing.documents);
      }
    } catch (e) {
      // Fallback
    }

    const finalDocs = { ...existingDocs, ...uploadedDocs };

    // 3. Update employee in DB
    const data = await prisma.karyawan.update({
      where: { id },
      data: {
        name: body.name,
        position: body.position,
        email: body.email,
        phone: body.phone,
        status: body.status,
        nik: body.nik,
        divisi: body.divisi,
        jabatan: body.jabatan,
        atasanLangsung: body.atasanLangsung,
        statusKerja: body.statusKerja,
        tanggalMasuk: body.tanggalMasuk ? new Date(body.tanggalMasuk) : null,
        tanggalKeluar: body.tanggalKeluar ? new Date(body.tanggalKeluar) : null,
        masaKontrak: body.masaKontrak,
        lokasiKerja: body.lokasiKerja,
        bpjsKesehatan: body.bpjsKesehatan,
        bpjsKetenagakerjaan: body.bpjsKetenagakerjaan,
        pt: body.pt,
        sim: simFilename,
        documents: JSON.stringify(finalDocs),
      },
    });

    // 4. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPDATE",
      "Karyawan",
      `Memperbarui data karyawan: ${data.name} (${data.pt || "No PT"})`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT karyawan error:", error);
    return NextResponse.json({ error: "Failed to update karyawan" }, { status: 500 });
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
      `Menghapus data karyawan: ${existing.name}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE karyawan error:", error);
    return NextResponse.json({ error: "Failed to delete karyawan" }, { status: 500 });
  }
}
