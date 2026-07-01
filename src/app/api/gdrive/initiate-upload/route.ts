import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/googleDrive";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    const { fileName, fileType, fileSize, folderId, description = "" } = await req.json();

    let finalDescription = description;
    if (user) {
      let clientText = description;
      let clientCategory = "";
      try {
        if (description.startsWith("{") && description.endsWith("}")) {
          const parsedDesc = JSON.parse(description);
          clientText = parsedDesc.text || "";
          clientCategory = parsedDesc.category || "";
        }
      } catch (e) {}

      finalDescription = JSON.stringify({
        uploaderId: user.id,
        uploaderName: user.name || user.email || "Tenaga Kerja",
        uploaderImage: user.image || "",
        text: clientText || "",
        category: clientCategory || "",
      });
    }

    if (!fileName || !fileType || fileSize === undefined || !folderId) {
      return NextResponse.json(
        { error: "fileName, fileType, fileSize, and folderId are required" },
        { status: 400 }
      );
    }

    const accessToken = await getAccessToken();

    // Check if filename already exists in the destination folder
    let finalFileName = fileName;
    try {
      const q = `name = '${fileName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          const dotIdx = fileName.lastIndexOf(".");
          const baseName = dotIdx !== -1 ? fileName.substring(0, dotIdx) : fileName;
          const ext = dotIdx !== -1 ? fileName.substring(dotIdx) : "";
          
          let counter = 1;
          let nameExists = true;
          while (nameExists) {
            const checkName = `${baseName} (${counter})${ext}`;
            const checkQ = `name = '${checkName.replace(/'/g, "\\'")}' and '${folderId}' in parents and trashed = false`;
            const checkUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(checkQ)}&fields=files(id)`;
            const checkRes = await fetch(checkUrl, {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (checkRes.ok) {
              const checkData = await checkRes.json();
              if (!checkData.files || checkData.files.length === 0) {
                finalFileName = checkName;
                nameExists = false;
              } else {
                counter++;
              }
            } else {
              break;
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to check duplicate file name:", e);
    }

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
          name: finalFileName,
          parents: [folderId],
          description: finalDescription,
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

    return NextResponse.json({ uploadUrl, fileName: finalFileName });
  } catch (error: any) {
    console.error("Initiate upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate resumable upload" },
      { status: 500 }
    );
  }
}
