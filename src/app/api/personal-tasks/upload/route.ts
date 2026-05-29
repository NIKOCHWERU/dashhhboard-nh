import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAccessToken, getOrCreateFolder, uploadFile } from "@/lib/googleDrive";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const accessToken = await getAccessToken();

    // 1. Get or create root 'Dashboard Office' folder
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");

    // 2. Get or create 'Catatan Kalender Pribadi' folder inside Dashboard Office
    const folderId = await getOrCreateFolder(accessToken, "Catatan Kalender Pribadi", mainFolderId);

    // 3. Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload file to Google Drive
    const result = await uploadFile(
      folderId,
      `catatan_${Date.now()}_${file.name}`,
      file.type,
      buffer,
      `Catatan Pribadi - ${session.user.name || "Karyawan"}`
    );

    // Return GDrive file details
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Personal task image upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload image to Google Drive" }, { status: 500 });
  }
}
