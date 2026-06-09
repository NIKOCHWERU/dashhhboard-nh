import { getAccessToken } from "@/lib/googleDrive";

export interface GDriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{
    displayName: string;
    emailAddress?: string;
    photoLink?: string;
  }>;
}

export class GoogleDriveService {
  private static async fetchFromDrive(endpoint: string, options: RequestInit = {}): Promise<any> {
    const accessToken = await getAccessToken();
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    };

    const res = await fetch(`https://www.googleapis.com/drive/v3/${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive API error: ${res.status} - ${errText}`);
    }

    return res.json();
  }

  /**
   * List all folders inside a parent folder
   */
  public static async listFolders(parentId: string): Promise<GDriveItem[]> {
    try {
      const query = `mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`;
      const fields = "files(id,name,mimeType,createdTime,modifiedTime,owners)";
      const data = await this.fetchFromDrive(
        `files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=name`
      );
      return data.files || [];
    } catch (error) {
      console.error(`Failed to list folders for parent ${parentId}:`, error);
      throw error;
    }
  }

  /**
   * List all files and subfolders inside a parent folder
   */
  public static async listFilesAndFolders(parentId: string): Promise<GDriveItem[]> {
    try {
      const query = `'${parentId}' in parents and trashed=false`;
      const fields = "files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners)";
      const data = await this.fetchFromDrive(
        `files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=folder,name`
      );
      return data.files || [];
    } catch (error) {
      console.error(`Failed to list files and folders for parent ${parentId}:`, error);
      throw error;
    }
  }

  /**
   * Search files and folders under a parent folder
   */
  public static async search(queryText: string, rootId: string): Promise<GDriveItem[]> {
    try {
      // Find all files/folders containing the queryText and not trashed.
      // In a real application we would restrict recursively, but a name search is standard.
      // To keep it safe, we restrict to files that have 'rootId' in their parents or we search generally
      // and do some post-filtering, or we search drive-wide if access is limited.
      // Standard search query matching name:
      const cleanQuery = queryText.replace(/'/g, "\\'");
      const query = `(name contains '${cleanQuery}') and trashed=false`;
      const fields = "files(id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners)";
      const data = await this.fetchFromDrive(
        `files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&pageSize=50`
      );
      return data.files || [];
    } catch (error) {
      console.error(`Failed to search drive for '${queryText}':`, error);
      throw error;
    }
  }

  /**
   * Get recently modified files across the Drive (excluding folders)
   */
  public static async getRecentFiles(limit: number = 5): Promise<GDriveItem[]> {
    try {
      const query = "mimeType != 'application/vnd.google-apps.folder' and trashed=false";
      const fields = "files(id,name,mimeType,size,webViewLink,createdTime,modifiedTime,owners)";
      const data = await this.fetchFromDrive(
        `files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=modifiedTime desc&pageSize=${limit}`
      );
      return data.files || [];
    } catch (error) {
      console.error("Failed to get recent files:", error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  public static async getMetadata(fileId: string): Promise<GDriveItem> {
    try {
      const fields = "id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,owners";
      return await this.fetchFromDrive(`files/${fileId}?fields=${encodeURIComponent(fields)}`);
    } catch (error) {
      console.error(`Failed to get metadata for file ${fileId}:`, error);
      throw error;
    }
  }
}
