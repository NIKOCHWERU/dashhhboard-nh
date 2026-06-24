import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getAccessToken,
  getOrCreateFolder,
  getGlobalFolderId,
  uploadFile,
  listFiles,
  deleteFolder,
  renameFolder,
} from "@/lib/googleDrive";

// Auto-initialization of default categories and PT folders
async function initializeNarasumberHukumFolders() {
  const accessToken = await getAccessToken();
  const nhFolderId = "1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq";

  // 1. Create default category folders
  const categories = ["Drafting Kontrak", "Legal Opinion", "Somasi / Peringatan", "Arsip Umum"];
  for (const cat of categories) {
    await getOrCreateFolder(accessToken, cat, nhFolderId);
  }

  // 1b. Create Dokumentasi Internal folder and its subfolders
  const docInternalId = await getOrCreateFolder(accessToken, "Dokumentasi Internal", nhFolderId);
  await getOrCreateFolder(accessToken, "Foto", docInternalId);
  await getOrCreateFolder(accessToken, "Video", docInternalId);
  await getOrCreateFolder(accessToken, "Dokumen", docInternalId);

  // 2. Create folders for each registered PT
  const retainers = await prisma.retainer.findMany({
    select: { clientName: true },
    distinct: ["clientName"],
  });

  for (const ret of retainers) {
    if (ret.clientName) {
      await getOrCreateFolder(accessToken, ret.clientName, nhFolderId);
    }
  }

  return nhFolderId;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const search = searchParams.get("search");

    let gdriveItems = [];
    let targetFolderId = folderId;
    let dbFiles = [];

    if (search) {
      const accessToken = await getAccessToken();
      const cleanSearch = search.replace(/'/g, "\\'");
      const query = encodeURIComponent(`(name contains '${cleanSearch}') and trashed=false`);
      const fields = encodeURIComponent("files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners,description)");
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&pageSize=100`;
      const gdriveRes = await fetch(searchUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const gdriveData = await gdriveRes.json();
      gdriveItems = gdriveData.files || [];

      const fileIds = gdriveItems.map((item: any) => item.id);
      dbFiles = await prisma.narasumberHukum.findMany({
        where: { googleFileId: { in: fileIds } },
      });
    } else {
      if (!targetFolderId) {
        try {
          targetFolderId = await initializeNarasumberHukumFolders();
        } catch (initErr) {
          console.error("Failed to initialize folders, using fallback:", initErr);
          targetFolderId = "1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq";
        }
      }
      gdriveItems = await listFiles(targetFolderId!);
      dbFiles = await prisma.narasumberHukum.findMany({
        where: { googleFolderId: targetFolderId! },
      });
    }

    const user = session.user as any;
    const userEmail = user.email?.toLowerCase();
    const isAdmin = user.role === "admin";

    // 3. Merge items and apply PIC viewing restrictions
    const filteredItems = gdriveItems
      .map((item: any) => {
        // If it's a folder, anyone can browse it
        if (item.mimeType === "application/vnd.google-apps.folder") {
          return { ...item, isFolder: true };
        }

        // Find metadata in DB
        const meta = dbFiles.find((db) => db.googleFileId === item.id);
        
        // Check PIC access
        if (meta && meta.pic) {
          const allowedPICs = meta.pic.split(",").map((p) => p.trim().toLowerCase());
          const hasAccess = allowedPICs.includes(userEmail) || isAdmin;
          if (!hasAccess) {
            return null; // Restricted
          }
        }

        return {
          ...item,
          isFolder: false,
          customName: meta?.fileName || item.name,
          description: meta?.description || "",
          pic: meta?.pic || "",
          pt: meta?.pt || "",
          dbId: meta?.id || null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      folderId: targetFolderId,
      items: filteredItems,
    });
  } catch (error: any) {
    console.error("Narasumber Hukum GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to load files" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    // Case 1: Create a new custom subfolder (JSON payload)
    if (contentType.includes("application/json")) {
      const { action, folderName, parentFolderId } = await req.json();
      if (action === "createFolder") {
        if (!folderName || !parentFolderId) {
          return NextResponse.json({ error: "folderName and parentFolderId are required" }, { status: 400 });
        }
        const accessToken = await getAccessToken();
        const newFolderId = await getOrCreateFolder(accessToken, folderName, parentFolderId);
        return NextResponse.json({ success: true, id: newFolderId });
      }
    }

    // Case 2: Upload new files (Multipart FormData)
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const folderId = formData.get("folderId") as string;
    const customName = formData.get("fileName") as string; // Optional custom name
    const description = formData.get("description") as string; // Optional description
    const pic = formData.get("pic") as string; // Comma-separated PIC emails
    const pt = formData.get("pt") as string; // Associated PT name

    if (!files || files.length === 0 || !folderId) {
      return NextResponse.json({ error: "files and folderId are required" }, { status: 400 });
    }

    const uploadedRecords = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // If multi-uploading, only use customName for the first file, or append an index
      const finalFileName = files.length === 1 && customName ? customName : `${file.name}`;

      // Upload file directly to G-Drive
      const gResult = await uploadFile(folderId, finalFileName, file.type, buffer);

      // Create record in DB with metadata
      const record = await prisma.narasumberHukum.create({
        data: {
          fileName: finalFileName,
          description: description || "",
          pic: pic || "",
          googleFileId: gResult.id,
          googleFolderId: folderId,
          pt: pt || "",
          mimeType: file.type,
          size: file.size,
          webViewLink: gResult.webViewLink || "",
        },
      });

      uploadedRecords.push(record);
    }

    return NextResponse.json({ success: true, records: uploadedRecords });
  } catch (error: any) {
    console.error("Narasumber Hukum POST error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    // 1. Delete from Google Drive
    try {
      await deleteFolder(fileId);
    } catch (gErr) {
      console.error("G-Drive file delete failed:", gErr);
    }

    // 2. Delete from DB
    await prisma.narasumberHukum.deleteMany({
      where: { googleFileId: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Narasumber Hukum DELETE error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId, newName, description, pic, pt } = await req.json();
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    // 1. Rename in G-Drive if newName is provided
    if (newName) {
      try {
        await renameFolder(fileId, newName);
      } catch (gErr) {
        console.error("G-Drive file rename failed:", gErr);
      }
    }

    // 2. Update DB record
    const updateData: any = {};
    if (newName) updateData.fileName = newName;
    if (description !== undefined) updateData.description = description;
    if (pic !== undefined) updateData.pic = pic;
    if (pt !== undefined) updateData.pt = pt;

    await prisma.narasumberHukum.updateMany({
      where: { googleFileId: fileId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Narasumber Hukum PUT error:", error);
    return NextResponse.json({ error: error.message || "Failed to update file" }, { status: 500 });
  }
}
