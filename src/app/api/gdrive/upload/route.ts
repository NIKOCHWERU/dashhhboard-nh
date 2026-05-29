import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/googleDrive";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folderId = formData.get("folderId") as string;
    const description = formData.get("description") as string || "";

    if (!file || !folderId) {
      return NextResponse.json({ error: "file and folderId are required" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFile(folderId, file.name, file.type, buffer, description);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GDrive upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
