import fs from "fs";
import path from "path";
import { prisma } from "./prisma";

const TOKEN_FILE_PATH = path.join(process.cwd(), "src/data/gdrive-token.json");

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "company_gdrive",
          providerAccountId: "company_gdrive_account",
        },
      },
    });
    if (account?.refresh_token) {
      return account.refresh_token;
    }
  } catch (e) {
    console.error("Error reading stored refresh token from database:", e);
  }

  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(TOKEN_FILE_PATH, "utf8"));
      return data.refreshToken || null;
    }
  } catch (e) {
    console.error("Error reading stored refresh token from file:", e);
  }
  return process.env.GOOGLE_DRIVE_REFRESH_TOKEN || null;
}

export async function storeRefreshToken(token: string): Promise<void> {
  try {
    const systemUserId = "system_company_gdrive";
    await prisma.user.upsert({
      where: { id: systemUserId },
      update: {},
      create: {
        id: systemUserId,
        name: "Company Google Drive",
        email: "company-gdrive@narasumberhukum.online",
        role: "admin",
      },
    });

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: "company_gdrive",
          providerAccountId: "company_gdrive_account",
        },
      },
      update: {
        refresh_token: token,
      },
      create: {
        userId: systemUserId,
        type: "oauth",
        provider: "company_gdrive",
        providerAccountId: "company_gdrive_account",
        refresh_token: token,
      },
    });

    const dir = path.dirname(TOKEN_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKEN_FILE_PATH, JSON.stringify({ refreshToken: token }), "utf8");
  } catch (e) {
    console.error("Error storing refresh token in database/file:", e);
  }
}

export async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = await getStoredRefreshToken();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_DRIVE_REFRESH_TOKEN) in .env"
    );
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to refresh access token: ${errText}`);
    }

    const data = await res.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to get Google access token:", error);
    throw error;
  }
}

export async function getOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const upperName = name.toUpperCase();
  let query = `mimeType='application/vnd.google-apps.folder' and name='${upperName}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else {
    query += ` and 'root' in parents`;
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id)`;

  try {
    const res = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to search folder '${upperName}': ${errText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      shareFolderWithAnyone(accessToken, folderId).catch(() => {});
      return folderId;
    }

    // Create the folder
    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const body: any = {
      name: upperName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentId) {
      body.parents = [parentId];
    }

    const createRes = await fetch(createUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create folder '${name}': ${errText}`);
    }

    const createData = await createRes.json();
    await shareFolderWithAnyone(accessToken, createData.id);
    return createData.id;
  } catch (error) {
    console.error(`Error in getOrCreateFolder for '${name}':`, error);
    throw error;
  }
}

export async function shareFolderWithAnyone(accessToken: string, fileId: string): Promise<void> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: "reader",
        type: "anyone",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Failed to share file/folder ${fileId} with anyone: ${errText}`);
    }
  } catch (error) {
    console.error(`Error in shareFolderWithAnyone for ${fileId}:`, error);
  }
}

/**
 * Creates structured client folders inside `/Dashboard Office/[featureType]`
 * Structure:
 * Dashboard Office
 * └── [featureType] ("Retainer" or "Perorangan")
 *     └── [clientName]
 *         ├── Dokumen
 *         ├── Data Karyawan
 *         └── Dokumentasi
 *             ├── Foto
 *             └── Video
 */
export async function createClientStructuredFolder(
  featureType: "Retainer" | "Perorangan",
  clientName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();

    // 1. Get or Create Main Office Folder
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");

    // 2. Get or Create Feature Folder (e.g. "Retainer" or "Perorangan")
    const featureFolderId = await getOrCreateFolder(accessToken, featureType, mainFolderId);

    // 3. Create Main Client Folder inside Feature Folder
    const clientFolderId = await getOrCreateFolder(accessToken, clientName, featureFolderId);

    // 4. Create Subfolders inside Client Folder
    await getOrCreateFolder(accessToken, "Dokumen", clientFolderId);
    await getOrCreateFolder(accessToken, "Data Karyawan", clientFolderId);
    await getOrCreateFolder(accessToken, "Dokumen Pelamar", clientFolderId);
    const dokumentasiId = await getOrCreateFolder(accessToken, "Dokumentasi", clientFolderId);

    // 5. Create Foto and Video subfolders inside Dokumentasi
    await getOrCreateFolder(accessToken, "Foto", dokumentasiId);
    await getOrCreateFolder(accessToken, "Video", dokumentasiId);

    return clientFolderId;
  } catch (error) {
    console.error(`Failed to create structured folders for '${clientName}':`, error);
    return null;
  }
}

/**
 * Creates structured internal folder inside `/Dashboard Office/Internal Documents`
 */
export async function createInternalDocumentFolder(
  documentType: string,
  documentNumber: string,
  recipientName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();

    // 1. Get or Create Main Office Folder
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");

    // 2. Get or Create Internal Folder
    const internalFolderId = await getOrCreateFolder(accessToken, "Berkas Internal", mainFolderId);

    // 3. Create Specific subfolder for this document
    const folderName = `${documentType} - ${documentNumber.replace(/\//g, "-")} - ${recipientName}`;
    const docFolderId = await getOrCreateFolder(accessToken, folderName, internalFolderId);

    return docFolderId;
  } catch (error) {
    console.error(`Failed to create internal folders for document:`, error);
    return null;
  }
}

/**
 * Renames any folder by ID
 */
export async function renameFolder(folderId: string, newFolderName: string): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const updateUrl = `https://www.googleapis.com/drive/v3/files/${folderId}`;

    const res = await fetch(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newFolderName.toUpperCase(),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to rename folder: ${errText}`);
    }
  } catch (error) {
    console.error(`Failed to rename folder '${folderId}':`, error);
  }
}

/**
 * Deletes any folder/file by ID
 */
export async function deleteFolder(folderId: string): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    const deleteUrl = `https://www.googleapis.com/drive/v3/files/${folderId}`;
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to delete folder/file: ${errText}`);
    }
  } catch (error) {
    console.error(`Failed to delete folder/file '${folderId}':`, error);
  }
}

/**
 * Lists all files and subfolders inside a parent folder ID
 */
export async function listFiles(parentId: string): Promise<any[]> {
  try {
    const accessToken = await getAccessToken();
    const query = encodeURIComponent(`'${parentId}' in parents and trashed=false`);
    const fields = encodeURIComponent("files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners,description)");
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=folder,name`;

    const res = await fetch(searchUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to list files: ${errText}`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error(`Failed to list files in '${parentId}':`, error);
    return [];
  }
}

/**
 * Uploads a file buffer directly to a parent folder in Google Drive with optional description
 */
export async function uploadFile(
  parentId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  description?: string
): Promise<any> {
  try {
    const accessToken = await getAccessToken();
    const boundary = "foo_bar_boundary";
    const upperFileName = fileName.toUpperCase();
    const metadata = JSON.stringify({
      name: upperFileName,
      parents: [parentId],
      description: description || "",
    });

    const part1 = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`;
    const part2 = `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`;
    const part3 = `\r\n--${boundary}--`;

    const payload = Buffer.concat([
      Buffer.from(part1, "utf8"),
      Buffer.from(part2, "utf8"),
      fileBuffer,
      Buffer.from(part3, "utf8"),
    ]);

    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: payload,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to upload file to Google Drive: ${errText}`);
    }

    const result = await res.json();
    await shareFolderWithAnyone(accessToken, result.id);
    return result;
  } catch (error) {
    console.error(`Failed to upload file '${fileName}' to parent '${parentId}':`, error);
    throw error;
  }
}

/**
 * Gets or creates a subfolder by name inside a parent folder ID
 */
export async function getSubfolderId(
  parentFolderId: string,
  subfolderName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    return await getOrCreateFolder(accessToken, subfolderName, parentFolderId);
  } catch (error) {
    console.error("Failed to get subfolder:", error);
    return null;
  }
}

/**
 * Gets or creates a global folder inside 'Dashboard Office'
 */
export async function getGlobalFolderId(folderName: string): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
    return await getOrCreateFolder(accessToken, folderName, mainFolderId);
  } catch (error) {
    console.error("Failed to get global folder:", error);
    return null;
  }
}
