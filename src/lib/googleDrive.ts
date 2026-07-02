import fs from "fs";
import path from "path";
import { Readable } from "stream";
import { google, drive_v3 } from "googleapis";
import { prisma } from "./prisma";

const TOKEN_FILE_PATH = path.join(process.cwd(), "src/data/gdrive-token.json");
const AUTH_PROVIDER = "company_gdrive";
const AUTH_PROVIDER_ACCOUNT_ID = "company_gdrive_account";
const SYSTEM_USER_ID = "system_company_gdrive";
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

let refreshTokenCache: string | null | undefined;
let oauthClient: any = null;
let driveClient: drive_v3.Drive | null = null;

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName?: string; emailAddress?: string }>;
  description?: string;
}

interface RefreshTokenFile {
  refreshToken?: string;
}

function logError(message: string, error: unknown): void {
  console.error("[GoogleDrive]", message, error);
}

function escapeQueryValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function isRetryableStatus(status?: number): boolean {
  return status !== undefined && RETRYABLE_STATUS_CODES.has(status);
}

function getGoogleErrorStatus(error: unknown): number | undefined {
  const err = error as { code?: number; response?: { status?: number } };
  if (typeof err.code === "number") {
    return err.code;
  }
  return err.response?.status;
}

function getGoogleErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  const err = error as { message?: string };
  return err?.message || fallback;
}

async function getDatabaseRefreshToken(): Promise<string | null> {
  const account = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: AUTH_PROVIDER,
        providerAccountId: AUTH_PROVIDER_ACCOUNT_ID,
      },
    },
    select: {
      refresh_token: true,
    },
  });
  return account?.refresh_token ?? null;
}

async function getFileRefreshToken(): Promise<string | null> {
  if (!fs.existsSync(TOKEN_FILE_PATH)) {
    return null;
  }

  const content = await fs.promises.readFile(TOKEN_FILE_PATH, "utf8");
  const parsed = JSON.parse(content) as RefreshTokenFile;
  return parsed.refreshToken ?? null;
}

async function writeRefreshTokenFile(token: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(TOKEN_FILE_PATH), { recursive: true });
  await fs.promises.writeFile(TOKEN_FILE_PATH, JSON.stringify({ refreshToken: token }), "utf8");
}

export async function getStoredRefreshToken(): Promise<string | null> {
  if (refreshTokenCache !== undefined) {
    return refreshTokenCache;
  }

  try {
    const dbToken = await getDatabaseRefreshToken();
    if (dbToken) {
      refreshTokenCache = dbToken;
      return dbToken;
    }
  } catch (error) {
    logError("Failed to read refresh token from database:", error);
  }

  try {
    const fileToken = await getFileRefreshToken();
    if (fileToken) {
      refreshTokenCache = fileToken;
      return fileToken;
    }
  } catch (error) {
    logError("Failed to read refresh token from file:", error);
  }

  refreshTokenCache = process.env.GOOGLE_DRIVE_REFRESH_TOKEN ?? null;
  return refreshTokenCache;
}

export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await prisma.user.upsert({
      where: { id: SYSTEM_USER_ID },
      update: {},
      create: {
        id: SYSTEM_USER_ID,
        name: "Company Google Drive",
        email: "company-gdrive@narasumberhukum.online",
        role: "admin",
      },
    });

    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: AUTH_PROVIDER,
          providerAccountId: AUTH_PROVIDER_ACCOUNT_ID,
        },
      },
      update: {
        refresh_token: token,
      },
      create: {
        userId: SYSTEM_USER_ID,
        type: "oauth",
        provider: AUTH_PROVIDER,
        providerAccountId: AUTH_PROVIDER_ACCOUNT_ID,
        refresh_token: token,
      },
    });

    await writeRefreshTokenFile(token);
    refreshTokenCache = token;

    if (oauthClient) {
      oauthClient.setCredentials({ refresh_token: token });
    }
  } catch (error) {
    logError("Failed to store refresh token in database/file:", error);
    throw new Error("Google Drive refresh token storage failed.");
  }
}

function getOAuthClient(): any {
  if (oauthClient) {
    return oauthClient;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Drive authentication failed. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET."
    );
  }

  // @ts-ignore - google namespace types are imported from googleapis
  oauthClient = new google.auth.OAuth2(clientId, clientSecret);
  return oauthClient;
}

async function getAuthorizedOAuthClient(): Promise<any> {
  const client = getOAuthClient();
  const refreshToken = await getStoredRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Google Drive authentication failed. Refresh token is missing. Store it in Prisma, src/data/gdrive-token.json, or GOOGLE_DRIVE_REFRESH_TOKEN."
    );
  }

  client.setCredentials({ refresh_token: refreshToken });

  try {
    const response = await client.getAccessToken();
    if (!response || !response.token) {
      throw new Error("Google Drive authentication failed. Access token was not returned.");
    }
    return client;
  } catch (error) {
    const message = getGoogleErrorMessage(
      error,
      "Google Drive authentication failed. Refresh token has been revoked or is invalid."
    );
    logError("Google Drive authentication failed.", error);
    throw new Error(message);
  }
}

async function getDriveClient(): Promise<drive_v3.Drive> {
  if (!driveClient) {
    const auth = await getAuthorizedOAuthClient();
    // @ts-ignore - google namespace types are imported from googleapis
    driveClient = google.drive({ version: "v3", auth });
  }

  return driveClient;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeDriveRequest<T>(operation: (drive: drive_v3.Drive) => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < 2) {
    try {
      const drive = await getDriveClient();
      return await operation(drive);
    } catch (error) {
      lastError = error;
      const status = getGoogleErrorStatus(error);
      if (attempt === 0 && isRetryableStatus(status)) {
        attempt += 1;
        await delay(500);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export async function getAccessToken(): Promise<string> {
  const client = await getAuthorizedOAuthClient();
  const tokenResponse = await client.getAccessToken();

  if (!tokenResponse || !tokenResponse.token) {
    throw new Error("Google Drive authentication failed. Access token missing.");
  }

  return tokenResponse.token;
}

async function findFolderIdByName(
  drive: drive_v3.Drive,
  name: string,
  parentId?: string
): Promise<string | null> {
  const escapedName = escapeQueryValue(name);
  const parentClause = parentId ? `'${parentId}' in parents` : `'root' in parents`;
  const query = `mimeType='application/vnd.google-apps.folder' and trashed=false and name='${escapedName}' and ${parentClause}`;

  const response = await drive.files.list({
    q: query,
    fields: "files(id,name)",
    spaces: "drive",
    pageSize: 1,
  });

  return response.data.files?.[0]?.id ?? null;
}

export async function getOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  try {
    const folderId = await executeDriveRequest((drive) => findFolderIdByName(drive, name, parentId));
    if (folderId) {
      await shareFolderWithAnyone(accessToken, folderId);
      return folderId;
    }

    const response = await executeDriveRequest((drive) =>
      drive.files.create({
        requestBody: {
          name,
          mimeType: "application/vnd.google-apps.folder",
          parents: parentId ? [parentId] : undefined,
        },
        fields: "id",
      })
    );

    const createdFolderId = response.data.id;
    if (!createdFolderId) {
      throw new Error(`Folder creation failed for '${name}'.`);
    }

    await shareFolderWithAnyone(accessToken, createdFolderId);
    return createdFolderId;
  } catch (error) {
    logError(`Error in getOrCreateFolder for '${name}':`, error);
    throw error;
  }
}

export async function shareFolderWithAnyone(accessToken: string, fileId: string): Promise<void> {
  try {
    await executeDriveRequest((drive) =>
      drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
        supportsAllDrives: true,
      })
    );
  } catch (error) {
    const status = getGoogleErrorStatus(error);
    if (status === 409) {
      return;
    }

    const message = getGoogleErrorMessage(error, "Google Drive permission update failed.");
    logError(`Failed to share file or folder ${fileId} with anyone:`, error);
    throw new Error(message);
  }
}

export async function createClientStructuredFolder(
  featureType: "Retainer" | "Perorangan",
  clientName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
    const featureFolderId = await getOrCreateFolder(accessToken, featureType, mainFolderId);
    const clientFolderId = await getOrCreateFolder(accessToken, clientName, featureFolderId);

    await getOrCreateFolder(accessToken, "Dokumen", clientFolderId);
    await getOrCreateFolder(accessToken, "Data Karyawan", clientFolderId);
    await getOrCreateFolder(accessToken, "Dokumen Pelamar", clientFolderId);
    const dokumentasiId = await getOrCreateFolder(accessToken, "Dokumentasi", clientFolderId);
    await getOrCreateFolder(accessToken, "Foto", dokumentasiId);
    await getOrCreateFolder(accessToken, "Video", dokumentasiId);

    return clientFolderId;
  } catch (error) {
    logError(`Failed to create structured folders for '${clientName}':`, error);
    return null;
  }
}

export async function createInternalDocumentFolder(
  documentType: string,
  documentNumber: string,
  recipientName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
    const internalFolderId = await getOrCreateFolder(accessToken, "Berkas Internal", mainFolderId);
    const folderName = `${documentType} - ${documentNumber.replace(/\//g, "-")} - ${recipientName}`;
    const docFolderId = await getOrCreateFolder(accessToken, folderName, internalFolderId);
    return docFolderId;
  } catch (error) {
    logError("Failed to create internal folders for document:", error);
    return null;
  }
}

export async function renameFolder(folderId: string, newFolderName: string): Promise<void> {
  try {
    await executeDriveRequest((drive) =>
      drive.files.update({
        fileId: folderId,
        requestBody: {
          name: newFolderName.toUpperCase(),
        },
        fields: "id",
      })
    );
  } catch (error) {
    logError(`Failed to rename folder '${folderId}':`, error);
    throw new Error(getGoogleErrorMessage(error, "Google Drive folder rename failed."));
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  try {
    await executeDriveRequest((drive) => drive.files.delete({ fileId: folderId }));
  } catch (error) {
    logError(`Failed to delete folder/file '${folderId}':`, error);
    throw new Error(getGoogleErrorMessage(error, "Google Drive delete failed."));
  }
}

export async function listFiles(parentId: string): Promise<GoogleDriveFile[]> {
  try {
    const response = await executeDriveRequest((drive) =>
      drive.files.list({
        q: `'${escapeQueryValue(parentId)}' in parents and trashed=false`,
        fields: "files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners,description)",
        orderBy: "folder,name",
        spaces: "drive",
      })
    );

    const files = (response.data.files ?? []) as GoogleDriveFile[];
    return files.filter((file): file is GoogleDriveFile => !!file.id);
  } catch (error) {
    logError(`Failed to list files in '${parentId}':`, error);
    return [];
  }
}

function getNextUniqueFileName(existingNames: string[], fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
  const extension = dotIndex !== -1 ? fileName.substring(dotIndex) : "";

  if (!existingNames.includes(fileName)) {
    return fileName;
  }

  let counter = 1;
  while (true) {
    const candidate = `${baseName} (${counter})${extension}`;
    if (!existingNames.includes(candidate)) {
      return candidate;
    }
    counter += 1;
  }
}

async function findDuplicateFileNames(parentId: string, baseName: string): Promise<string[]> {
  const response = await executeDriveRequest((drive) =>
    drive.files.list({
      q: `'${escapeQueryValue(parentId)}' in parents and trashed=false`,
      fields: "files(name)",
      spaces: "drive",
      pageSize: 1000,
    })
  );

  return response.data.files?.map((file) => file.name || "") ?? [];
}

export async function uploadFile(
  parentId: string,
  fileName: string,
  mimeType: string,
  fileBuffer: Buffer,
  description?: string
): Promise<GoogleDriveFile> {
  try {
    const existingNames = await findDuplicateFileNames(parentId, fileName);
    const finalFileName = getNextUniqueFileName(existingNames, fileName);

    const response = await executeDriveRequest((drive) =>
      drive.files.create({
        requestBody: {
          name: finalFileName,
          parents: [parentId],
          description: description ?? "",
        },
        media: {
          mimeType,
          body: Readable.from([fileBuffer]),
        },
        fields: "id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners,description",
      })
    );

    const result = response.data as drive_v3.Schema$File;
    if (!result.id) {
      throw new Error("Google Drive upload failed. File did not return an ID.");
    }

    await shareFolderWithAnyone("", result.id);
    return result as GoogleDriveFile;
  } catch (error) {
    logError(`Failed to upload file '${fileName}' to folder '${parentId}':`, error);
    throw new Error(getGoogleErrorMessage(error, "Google Drive upload failed."));
  }
}

export async function getSubfolderId(
  parentFolderId: string,
  subfolderName: string
): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    return await getOrCreateFolder(accessToken, subfolderName, parentFolderId);
  } catch (error) {
    logError("Failed to get subfolder:", error);
    return null;
  }
}

export async function getGlobalFolderId(folderName: string): Promise<string | null> {
  try {
    const accessToken = await getAccessToken();
    const mainFolderId = await getOrCreateFolder(accessToken, "Dashboard Office");
    return await getOrCreateFolder(accessToken, folderName, mainFolderId);
  } catch (error) {
    logError("Failed to get global folder:", error);
    return null;
  }
}
