import { NextResponse } from "next/server";
import { deleteFolder } from "@/lib/googleDrive";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    await deleteFolder(fileId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("GDrive delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete file" }, { status: 500 });
  }
}
