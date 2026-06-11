export async function getAccessToken(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

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
  let query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
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
      throw new Error(`Failed to search folder '${name}': ${errText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }

    // Create the folder
    const createUrl = "https://www.googleapis.com/drive/v3/files";
    const body: any = {
      name: name,
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
    return createData.id;
  } catch (error) {
    console.error(`Error in getOrCreateFolder for '${name}':`, error);
    throw error;
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
        name: newFolderName,
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
    const metadata = JSON.stringify({
      name: fileName,
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

    return await res.json();
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
