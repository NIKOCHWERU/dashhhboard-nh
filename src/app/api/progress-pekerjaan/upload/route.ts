import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAccessToken, getOrCreateFolder, uploadFile } from "@/lib/googleDrive";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    const formData = await req.formData();
    const rowId = formData.get("rowId") as string;
    const files = formData.getAll("files") as File[];

    if (!rowId) {
      return NextResponse.json({ error: "rowId is required" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // 1. Fetch job row from database
    const row = await prisma.progressPekerjaan.findUnique({
      where: { id: rowId },
    });

    if (!row) {
      return NextResponse.json({ error: "Job row not found" }, { status: 404 });
    }

    // 2. Authenticate Google Drive
    const accessToken = await getAccessToken();

    // 3. Resolve GDrive folder hierarchy:
    // Daftar Pekerjaan -> [RETAINER | Non Retainer | Internal | Laporan Berkala Retainer] -> [ClientName | RowFolderName]
    const rootFolderId = await getOrCreateFolder(accessToken, "Daftar Pekerjaan");

    let groupName = "Internal";
    if (row.type === "RETAINER") groupName = "RETAINER";
    else if (row.type === "NON_RETAINER") groupName = "Non Retainer";
    else if (row.type === "LAPORAN_BERKALA") groupName = "Laporan Berkala Retainer";

    const groupFolderId = await getOrCreateFolder(accessToken, groupName, rootFolderId);

    const clientName = row.namaKlien?.trim();
    const rowFolderName = clientName
      ? clientName
      : `Pekerjaan No ${row.no || "Unspecified"} - ${row.deskripsi ? row.deskripsi.replace(/[/\\?%*:|"<>\s]+/g, " ").slice(0, 30).trim() : "Detail"}`;

    const rowFolderId = await getOrCreateFolder(accessToken, rowFolderName, groupFolderId);

    // 4. Parse current attachments list
    let attachmentsList: any[] = [];
    if (row.attachments) {
      try {
        attachmentsList = JSON.parse(row.attachments);
        if (!Array.isArray(attachmentsList)) {
          attachmentsList = [];
        }
      } catch (e) {
        attachmentsList = [];
      }
    }

    const uploadResults: any[] = [];

    // 5. Upload files in loop
    for (const file of files) {
      if (file.size === 0) continue;
      
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaderDesc = user ? JSON.stringify({
        uploaderId: user.id,
        uploaderName: user.name || user.email || "Tenaga Kerja",
        uploaderImage: user.image || "",
        text: "Lampiran Pekerjaan",
      }) : "";

      console.log(`Uploading file '${file.name}' (${file.size} bytes) to Google Drive folder '${rowFolderName}'...`);
      const result = await uploadFile(rowFolderId, file.name, file.type, buffer, uploaderDesc);
      
      const fileInfo = {
        fileId: result.id,
        name: file.name,
        url: result.webViewLink,
        size: file.size,
      };

      attachmentsList.push(fileInfo);
      uploadResults.push(fileInfo);
    }

    // 6. Update database row with new attachments list
    await prisma.progressPekerjaan.update({
      where: { id: rowId },
      data: {
        attachments: JSON.stringify(attachmentsList),
      },
    });

    return NextResponse.json({
      success: true,
      folderId: rowFolderId,
      uploaded: uploadResults,
    });
  } catch (error: any) {
    console.error("Progress Pekerjaan Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file(s)" }, { status: 500 });
  }
}
