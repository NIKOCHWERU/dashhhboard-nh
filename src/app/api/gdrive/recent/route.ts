import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveService } from "@/services/GoogleDriveService";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "5");

    const files = await GoogleDriveService.getRecentFiles(limit);
    return NextResponse.json(files);
  } catch (error: any) {
    console.error("API GDrive Recent error:", error);
    // Return a user-friendly formal Indonesian error message
    return NextResponse.json(
      { error: "Koneksi Google Drive gagal terhubung. Silakan periksa kredensial akses sistem." },
      { status: 500 }
    );
  }
}
