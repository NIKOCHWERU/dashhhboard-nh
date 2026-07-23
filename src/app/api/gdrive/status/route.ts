import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getAccessToken, getStoredRefreshToken } from "@/lib/googleDrive";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshToken = await getStoredRefreshToken();
    if (!refreshToken) {
      return NextResponse.json({
        connected: false,
        message: "Refresh token tidak ditemukan.",
      });
    }

    const token = await getAccessToken();
    return NextResponse.json({
      connected: true,
      message: "Google Drive terhubung.",
      hasAccessToken: !!token,
    });
  } catch (error: any) {
    return NextResponse.json({
      connected: false,
      message: error.message || "Gagal menghubungkan Google Drive.",
    });
  }
}
