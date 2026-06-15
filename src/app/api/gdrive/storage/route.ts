import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/googleDrive";

export async function GET() {
  try {
    const accessToken = await getAccessToken();
    const res = await fetch("https://www.googleapis.com/drive/v3/about?fields=storageQuota,user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || "Failed to fetch storage info");
    }

    return NextResponse.json({
      connected: true,
      user: data.user,
      storageQuota: data.storageQuota
    });
  } catch (error: any) {
    console.error("GDrive storage check error:", error);
    return NextResponse.json({
      connected: false,
      error: error.message || "Google Drive client account not connected or credentials expired"
    });
  }
}
