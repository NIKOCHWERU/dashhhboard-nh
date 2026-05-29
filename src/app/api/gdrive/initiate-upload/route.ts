import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/googleDrive";

export async function POST(req: Request) {
  try {
    const { fileName, fileType, fileSize, folderId, description = "" } = await req.json();

    if (!fileName || !fileType || fileSize === undefined || !folderId) {
      return NextResponse.json(
        { error: "fileName, fileType, fileSize, and folderId are required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // Initiate Google Drive Resumable Upload
    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": fileType,
          "X-Upload-Content-Length": String(fileSize),
        },
        body: JSON.stringify({
          name: fileName,
          parents: [folderId],
          description: description,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API returned error: ${errorText}`);
    }

    const uploadUrl = response.headers.get("Location");
    if (!uploadUrl) {
      throw new Error("Google API did not return Location header for resumable upload");
    }

    return NextResponse.json({ uploadUrl });
  } catch (error: any) {
    console.error("Initiate upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate resumable upload" },
      { status: 500 }
    );
  }
}
