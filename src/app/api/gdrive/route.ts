import { NextResponse } from "next/server";
import { listFiles, getAccessToken, getOrCreateFolder, renameFolder } from "@/lib/googleDrive";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return NextResponse.json({ error: "folderId is required" }, { status: 400 });
    }

    const files = await listFiles(folderId);
    return NextResponse.json(files);
  } catch (error: any) {
    console.error("GDrive list error:", error);
    return NextResponse.json({ error: error.message || "Failed to list files" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { folderId, folderName } = await req.json();
    if (!folderId || !folderName) {
      return NextResponse.json({ error: "folderId and folderName are required" }, { status: 400 });
    }

    const accessToken = await getAccessToken();
    const newFolderId = await getOrCreateFolder(accessToken, folderName, folderId);

    return NextResponse.json({ id: newFolderId });
  } catch (error: any) {
    console.error("GDrive create folder error:", error);
    return NextResponse.json({ error: error.message || "Failed to create folder" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { fileId, newName } = await req.json();
    if (!fileId || !newName) {
      return NextResponse.json({ error: "fileId and newName are required" }, { status: 400 });
    }

    await renameFolder(fileId, newName);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("GDrive rename error:", error);
    return NextResponse.json({ error: error.message || "Failed to rename" }, { status: 500 });
  }
}
