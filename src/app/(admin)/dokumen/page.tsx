"use client";
import React, { useState, useEffect } from "react";

interface ClientData {
  id: string;
  clientName: string;
  projectName?: string;
  caseType?: string;
  googleFolderId: string | null;
}

interface GDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
}

export default function DokumenPage() {
  const [retainers, setRetainers] = useState<ClientData[]>([]);
  const [perorangan, setPerorangan] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  // GDrive state
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFolderName, setActiveFolderName] = useState<string>("");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  const [files, setFiles] = useState<GDriveFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Uploading state
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<GDriveFile | null>(null);
  const [repairing, setRepairing] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const [resRet, resPer] = await Promise.all([
        fetch("/api/retainer"),
        fetch("/api/perorangan"),
      ]);

      const retData = await resRet.json();
      const perData = await resPer.json();

      setRetainers(Array.isArray(retData) ? retData : []);
      setPerorangan(Array.isArray(perData) ? perData : []);
    } catch (e) {
      console.error("Failed to fetch clients:", e);
    } finally {
      setLoading(false);
    }
  };

  const browseFolder = async (folderId: string, folderName: string, pushHistory = true) => {
    try {
      setLoadingFiles(true);
      setActiveFolderId(folderId);
      setActiveFolderName(folderName);
      
      if (pushHistory) {
        setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
      }

      let res = await fetch(`/api/gdrive?folderId=${folderId}`);
      
      // Auto-heal if main client folder fails to load
      if (!res.ok && selectedClient && folderId === selectedClient.googleFolderId) {
        console.log("Folder not found or failed, attempting auto-repair...");
        const cType = selectedClient.projectName ? "Retainer" : "Perorangan";
        const resRecreate = await fetch("/api/gdrive/recreate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: selectedClient.id,
            clientName: selectedClient.clientName,
            type: cType,
          }),
        });
        
        if (resRecreate.ok) {
          const jsonRecreate = await resRecreate.json();
          selectedClient.googleFolderId = jsonRecreate.googleFolderId;
          // Retry browse
          res = await fetch(`/api/gdrive?folderId=${jsonRecreate.googleFolderId}`);
        }
      }

      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data);
    } catch (error) {
      console.error("Error browsing folder:", error);
      alert("Gagal memuat berkas dari Google Drive. Pastikan kredensial Google Drive Anda sudah dikonfigurasi.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleClientSelect = (client: ClientData) => {
    if (!client.googleFolderId) {
      alert("Klien ini belum memiliki folder Google Drive. Silakan edit atau buat baru untuk men-generate foldernya.");
      return;
    }
    setSelectedClient(client);
    setFolderHistory([]);
    browseFolder(client.googleFolderId, client.clientName, true);
  };

  const handleRecreateFolder = async () => {
    if (!selectedClient) return;
    if (!confirm("Apakah Anda yakin ingin mensinkronisasi dan memperbaiki struktur folder Google Drive untuk klien ini? Tindakan ini akan memastikan seluruh subfolder standard (Dokumen, Data Karyawan, Dokumentasi) terbuat secara benar di Google Drive.")) return;

    try {
      setRepairing(true);
      const cType = selectedClient.projectName ? "Retainer" : "Perorangan";
      const res = await fetch("/api/gdrive/recreate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedClient.id,
          clientName: selectedClient.clientName,
          type: cType,
        }),
      });

      if (!res.ok) throw new Error("Gagal memperbaiki folder");
      const data = await res.json();
      
      // Update local state
      const updatedClient = { ...selectedClient, googleFolderId: data.googleFolderId };
      setSelectedClient(updatedClient);
      
      // Refresh the client list
      await fetchClients();
      
      alert("Struktur folder berhasil diperbaiki dan disinkronkan di Google Drive!");
      
      // Reload current folder view
      setFolderHistory([]);
      browseFolder(data.googleFolderId, selectedClient.clientName, true);
    } catch (err: any) {
      alert(`Gagal memperbaiki folder: ${err.message}`);
    } finally {
      setRepairing(false);
    }
  };

  const handleBack = () => {
    if (folderHistory.length <= 1) {
      // Go back to main client grid
      setSelectedClient(null);
      setActiveFolderId(null);
      setFolderHistory([]);
      setFiles([]);
    } else {
      const newHistory = [...folderHistory];
      newHistory.pop(); // Remove current folder
      const parentFolder = newHistory[newHistory.length - 1];
      setFolderHistory(newHistory);
      browseFolder(parentFolder.id, parentFolder.name, false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !activeFolderId) return;

    try {
      setUploading(true);
      const file = fileList[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folderId", activeFolderId);

      const res = await fetch("/api/gdrive/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload file");
      }

      // Refresh list
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error: any) {
      alert(`Gagal mengunggah berkas: ${error.message}`);
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset file input
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas ini dari Google Drive?")) return;

    try {
      setLoadingFiles(true);
      const res = await fetch(`/api/gdrive/delete?fileId=${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete file");

      // Refresh list
      if (activeFolderId) {
        await browseFolder(activeFolderId, activeFolderName, false);
      }
    } catch (error) {
      alert("Gagal menghapus berkas.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const formatSize = (bytesStr?: string) => {
    if (!bytesStr) return "-";
    const bytes = parseInt(bytesStr);
    if (isNaN(bytes)) return "-";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (file: GDriveFile) => {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      return (
        <svg className="w-8 h-8 text-amber-500 fill-amber-500 flex-shrink-0" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      );
    }
    if ((file as any).thumbnailLink) {
      return (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setPreviewItem(file);
          }}
          className="w-10 h-10 border border-stroke dark:border-strokedark overflow-hidden rounded-lg flex-shrink-0 cursor-pointer relative group/thumb"
        >
          <img
            src={(file as any).thumbnailLink.replace(/=s\d+$/, "=s120")}
            alt={file.name}
            className="w-full h-full object-cover transition-transform group-hover/thumb:scale-120 duration-200"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      );
    }
    if (file.mimeType.includes("pdf")) {
      return (
        <svg className="w-8 h-8 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1v1H9V9zm0 4h6m-6 4h6" />
        </svg>
      );
    }
    if (file.mimeType.includes("image")) {
      return (
        <svg className="w-8 h-8 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (file.mimeType.includes("video")) {
      return (
        <svg className="w-8 h-8 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Manajemen Arsip</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Akses langsung berkas dan arsip perusahaan Anda terintegrasi penuh ke Google Drive.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div>
            <div className="border-l-4 border-brand-500 pl-3 mb-4">
              <div className="h-4 bg-gray-150 dark:bg-gray-800 rounded w-24 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-2xl h-36 flex flex-col justify-between animate-pulse"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-150 dark:bg-gray-800"></div>
                      <div className="w-20 h-3.5 bg-gray-150 dark:bg-gray-800 rounded"></div>
                    </div>
                    <div className="h-3 bg-gray-150 dark:bg-gray-800 rounded w-3/4 mt-2"></div>
                    <div className="h-2 bg-gray-150 dark:bg-gray-800 rounded w-1/2 mt-1"></div>
                  </div>
                  <div className="h-3 bg-gray-150 dark:bg-gray-800 rounded w-1/3 mt-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : !selectedClient ? (
        // Grid View of Clients
        <div className="space-y-8">
          {/* RETAINER SECTION */}
          <div>
            <div className="border-l-4 border-brand-500 pl-3 mb-4">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Klien Retainer</h2>
            </div>
            {retainers.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada klien retainer terdaftar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {retainers.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-2xl cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-lg transition-all group flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {client.googleFolderId && (
                          <span className="text-[9px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-md dark:bg-green-500/10 dark:text-green-400 uppercase">G-Drive Connected</span>
                        )}
                      </div>
                      <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">Project: {client.projectName || "-"}</p>
                    </div>
                    <div className="text-[10px] font-bold text-brand-500 flex items-center gap-1 mt-2">
                      Lihat Berkas 
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PERORANGAN SECTION */}
          <div>
            <div className="border-l-4 border-brand-500 pl-3 mb-4">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Klien Perorangan</h2>
            </div>
            {perorangan.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada klien perorangan terdaftar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {perorangan.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-2xl cursor-pointer hover:border-brand-500 dark:hover:border-brand-500 hover:shadow-lg transition-all group flex flex-col justify-between h-36"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {client.googleFolderId && (
                          <span className="text-[9px] bg-green-50 text-green-600 font-bold px-1.5 py-0.5 rounded-md dark:bg-green-500/10 dark:text-green-400 uppercase">G-Drive Connected</span>
                        )}
                      </div>
                      <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">Kasus: {client.caseType || "-"}</p>
                    </div>
                    <div className="text-[10px] font-bold text-brand-500 flex items-center gap-1 mt-2">
                      Lihat Berkas 
                      <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // File Manager View for Selected Client
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-stroke dark:border-strokedark p-4 bg-white dark:bg-gray-900 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 border border-stroke dark:border-strokedark rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Client File Manager</span>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{selectedClient.clientName}</h2>
                  <button
                    onClick={handleRecreateFolder}
                    disabled={repairing}
                    className="px-2 py-0.5 border border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-[9px] font-black rounded-lg uppercase transition-colors disabled:opacity-50 flex items-center gap-1"
                    title="Perbaiki & Sinkronisasi Folder Google Drive"
                  >
                    {repairing ? (
                      <>
                        <div className="animate-spin rounded-full h-2 w-2 border-b border-amber-500"></div>
                        Syncing...
                      </>
                    ) : (
                      "Sync Folder"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Path Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-bold text-gray-400 uppercase">
              <span className="cursor-pointer hover:text-brand-500" onClick={() => handleClientSelect(selectedClient)}>HOME</span>
              {folderHistory.map((hist, i) => (
                <React.Fragment key={hist.id}>
                  <span>/</span>
                  <span
                    className={`cursor-pointer hover:text-brand-500 ${i === folderHistory.length - 1 ? "text-brand-500" : ""}`}
                    onClick={() => {
                      if (i === folderHistory.length - 1) return;
                      const newHist = folderHistory.slice(0, i + 1);
                      setFolderHistory(newHist);
                      browseFolder(hist.id, hist.name, false);
                    }}
                  >
                    {hist.name}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* FILE LIST OR LOADING */}
          <div className="border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-stroke dark:border-strokedark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gray-50 dark:bg-gray-900/50">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-500 fill-brand-500" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
                {activeFolderName}
              </h3>

              {/* UPLOAD BUTTON */}
              {activeFolderId && activeFolderId !== selectedClient.googleFolderId && (
                <div>
                  <label className={`px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-sm cursor-pointer inline-flex items-center gap-2 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    {uploading ? "Mengunggah..." : "Unggah Berkas"}
                    <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
              )}
            </div>

            {loadingFiles ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-gray-150 dark:bg-gray-800 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-150 dark:bg-gray-800 rounded w-1/4"></div>
                      <div className="h-2.5 bg-gray-150 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-16 text-xs text-gray-400 italic">
                Folder ini kosong. Silakan unggah berkas baru menggunakan tombol di atas.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-stroke dark:border-strokedark text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Nama File</th>
                      <th className="p-4">Jenis File</th>
                      <th className="p-4">Ukuran</th>
                      <th className="p-4">Dibuat Pada</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark text-xs text-gray-700 dark:text-gray-300">
                    {files.map((file) => {
                      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                      return (
                        <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                          <td className="p-4 pl-6">
                            <div
                              onClick={() => isFolder && browseFolder(file.id, file.name)}
                              className={`flex items-center gap-3 font-semibold text-black dark:text-white ${isFolder ? "cursor-pointer hover:text-brand-500" : ""}`}
                            >
                              {getFileIcon(file)}
                              <span className="hover:underline line-clamp-1">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-4 font-medium uppercase text-[10px] text-gray-400">
                            {isFolder ? "Folder" : file.mimeType.split("/")[1] || "Berkas"}
                          </td>
                          <td className="p-4 font-semibold text-gray-500">{formatSize(file.size)}</td>
                          <td className="p-4 text-gray-400 font-medium">
                            {file.createdTime ? new Date(file.createdTime).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }) : "-"}
                          </td>
                          <td className="p-4 pr-6 text-right space-x-2">
                            {isFolder ? (
                              <button
                                onClick={() => browseFolder(file.id, file.name)}
                                className="px-3 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 text-[10px] font-black rounded-lg uppercase transition-colors"
                              >
                                Buka
                              </button>
                            ) : (
                              <>
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3 py-1 bg-brand-50 text-brand-700 hover:bg-brand-100 text-[10px] font-black rounded-lg uppercase transition-colors inline-block"
                                  >
                                    Lihat
                                  </a>
                                )}
                                <button
                                  onClick={() => handleFileDelete(file.id)}
                                  className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-black rounded-lg uppercase transition-colors"
                                >
                                  Hapus
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX MODAL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-99999 flex items-center justify-center bg-black/95 p-4 transition-all animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <button
            className="absolute top-6 right-6 text-white text-4xl font-light hover:text-gray-300 transition-colors cursor-pointer"
            onClick={() => setPreviewItem(null)}
          >
            &times;
          </button>
          
          <div
            className="max-w-4xl max-h-[85vh] w-full flex flex-col bg-gray-900 border border-white/10 p-6 rounded-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center overflow-hidden max-h-[60vh] bg-black/40 border border-white/5 rounded-xl">
              {previewItem.thumbnailLink ? (
                <img
                  src={previewItem.thumbnailLink.replace(/=s\d+$/, "=s1200")}
                  alt={previewItem.name}
                  className="max-w-full max-h-[58vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-white text-center">
                  <svg className="w-16 h-16 text-gray-500 mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Berkas Tanpa Preview Gambar</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="overflow-hidden">
                <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{previewItem.name}</h4>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                {previewItem.webViewLink && (
                  <a
                    href={previewItem.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2"
                  >
                    Buka di Google Drive
                  </a>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-xs uppercase tracking-wider rounded-xl transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
