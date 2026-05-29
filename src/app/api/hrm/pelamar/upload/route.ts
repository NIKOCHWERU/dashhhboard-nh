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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const formData = await req.formData();
    const pelamarId = formData.get("pelamarId") as string;
    const documentType = formData.get("documentType") as string;
    const file = formData.get("file") as File;

    if (!pelamarId || !file) {
      return NextResponse.json({ error: "Pelamar ID and File are required" }, { status: 400 });
    }

    // 1. Fetch pelamar candidate
    const existing = await prisma.hRMTalent.findUnique({
      where: { id: pelamarId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // 2. Identify destination Google Drive Folder ID
    let uploadFolderId: string | null = null;
    let folderTargetName = "Dokumen Pelamar Umum";

    try {
      if (existing.pt) {
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
        const normalizedPt = normalizeName(existing.pt);

        const matchedRetainer = retainers.find((r) => {
          const normClient = normalizeName(r.clientName);
          return (
            normClient === normalizedPt ||
            normClient.includes(normalizedPt) ||
            normalizedPt.includes(normClient)
          );
        });

        if (matchedRetainer && matchedRetainer.googleFolderId) {
          // Folder exists for client, upload to 'Dokumen Pelamar' subfolder instead of 'Data Karyawan'
          const parentFolderId = await getSubfolderId(matchedRetainer.googleFolderId, "Dokumen Pelamar");
          if (parentFolderId) {
            uploadFolderId = await getSubfolderId(parentFolderId, existing.namaKandidat);
            folderTargetName = `Dokumen Pelamar (${matchedRetainer.clientName}) / ${existing.namaKandidat}`;
          }
        }
      }

      if (!uploadFolderId) {
        // Fallback to global general candidates documents folder, inside a specific candidate subfolder
        const parentFolderId = await getGlobalFolderId("Dokumen Pelamar Umum");
        if (parentFolderId) {
          uploadFolderId = await getSubfolderId(parentFolderId, existing.namaKandidat);
          folderTargetName = `Dokumen Pelamar Umum / ${existing.namaKandidat}`;
        }
      }
    } catch (gErr) {
      console.error("G-Drive folder resolution error, falling back to global:", gErr);
      const parentFolderId = await getGlobalFolderId("Dokumen Pelamar Umum");
      if (parentFolderId) {
        uploadFolderId = await getSubfolderId(parentFolderId, existing.namaKandidat);
      }
    }

    if (!uploadFolderId) {
      return NextResponse.json({ error: "Failed to resolve G-Drive target folder" }, { status: 500 });
    }

    // 3. Convert file to buffer and upload
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);
    
    // Prefix file name to avoid overwrite conflict, e.g. "CV_Budi_Budi_Santoso.pdf"
    const finalFileName = `${documentType.replace(/\s+/g, "_")}_${existing.namaKandidat.replace(/\s+/g, "_")}_${file.name}`;
    
    await uploadFile(uploadFolderId, finalFileName, file.type, fileBuffer);

    // 4. Append filename to candidate's documents list
    const updatedDocsList = existing.documents
      ? `${existing.documents},${finalFileName}`
      : finalFileName;

    const data = await prisma.hRMTalent.update({
      where: { id: pelamarId },
      data: {
        documents: updatedDocsList,
      },
    });

    // 5. Log activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPLOAD",
      "HRMTalent",
      `Mengunggah berkas [${documentType}] ${file.name} untuk Pelamar ${existing.namaKandidat} ke folder G-Drive: ${folderTargetName}`
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Upload pelamar doc error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
