import { NextResponse } from "next/server";
import { getAccessToken, getOrCreateFolder, uploadFile } from "@/lib/googleDrive";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Parse category from URL query parameters, default to "Berkas Agenda"
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "Berkas Agenda";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Google Drive Integration
    const accessToken = await getAccessToken();
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
    const internalFolderId = await getOrCreateFolder(accessToken, "Berkas Internal", mainFolderId);
    const categoryFolderId = await getOrCreateFolder(accessToken, category, internalFolderId);

    const result = await uploadFile(categoryFolderId, file.name, file.type, buffer);

    if (!result || !result.webViewLink) {
      throw new Error("Failed to get Google Drive view link");
    }

    return NextResponse.json({ url: result.webViewLink });
  } catch (error: any) {
    console.error("Upload to Google Drive error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
