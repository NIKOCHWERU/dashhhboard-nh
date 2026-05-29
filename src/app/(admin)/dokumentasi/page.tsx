"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { useUpload } from "@/context/UploadContext";

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
  description?: string;
}

export default function DokumentasiPage() {
  const [retainers, setRetainers] = useState<ClientData[]>([]);
  const [perorangan, setPerorangan] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  // Gallery view state
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [activeTab, setActiveTab] = useState<"Foto" | "Video">("Foto");
  const [items, setItems] = useState<GDriveFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFolderName, setActiveFolderName] = useState<string>("");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);

  // Folder creation modal state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaDescription, setMediaDescription] = useState("");
  const [previewItem, setPreviewItem] = useState<GDriveFile | null>(null);

  const { uploadFiles, activeUploadsCount } = useUpload();

  // Poll folder contents while there are active background uploads to auto-refresh
  useEffect(() => {
    if (activeUploadsCount === 0 || !activeFolderId) return;

    const interval = setInterval(() => {
      browseFolder(activeFolderId, activeFolderName, false);
    }, 5000); // refresh every 5 seconds

    return () => clearInterval(interval);
  }, [activeUploadsCount, activeFolderId]);

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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Browse specific folder path with self-healing support
  const browseFolder = async (folderId: string | null, folderName: string, pushHistory = true) => {
    try {
      setLoadingMedia(true);
      if (!folderId) return;
      setActiveFolderId(folderId);
      setActiveFolderName(folderName);

      if (pushHistory) {
        setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
      }

      // Fetch folder contents
      const res = await fetch(`/api/gdrive?folderId=${folderId}`);
      if (!res.ok) throw new Error("Failed to load folder");
      const files: GDriveFile[] = await res.json();
      setItems(files);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat isi folder dari Google Drive.");
    } finally {
      setLoadingMedia(false);
    }
  };

  // Initialize client root Dokumentasi -> Foto or Video
  const loadClientRoot = async (client: ClientData, tab: "Foto" | "Video") => {
    try {
      setLoadingMedia(true);
      setActiveTab(tab);
      setItems([]);
      setFolderHistory([]);

      if (!client.googleFolderId) return;

      // 1. Fetch main client folder contents to find "Dokumentasi" folder
      let resMain = await fetch(`/api/gdrive?folderId=${client.googleFolderId}`);
      
      // Self-healing: Recreate if deleted/missing
      if (!resMain.ok) {
        const cType = client.projectName ? "Retainer" : "Perorangan";
        const resRecreate = await fetch("/api/gdrive/recreate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: client.id, clientName: client.clientName, type: cType })
        });
        if (!resRecreate.ok) throw new Error("Failed to auto-repair client folder");
        const jsonRecreate = await resRecreate.json();
        client.googleFolderId = jsonRecreate.googleFolderId;
        
        // Refetch main
        resMain = await fetch(`/api/gdrive?folderId=${client.googleFolderId}`);
        if (!resMain.ok) throw new Error("Auto-recreated folder but failed to load");
      }

      const mainContents: GDriveFile[] = await resMain.json();
      let dokumentasiFolder = mainContents.find((f) => f.name === "Dokumentasi");

      if (!dokumentasiFolder) {
        // Automatically create Dokumentasi folder!
        const resCreate = await fetch("/api/gdrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: client.googleFolderId, folderName: "Dokumentasi" })
        });
        if (!resCreate.ok) throw new Error("Failed to create missing Dokumentasi folder");
        const newFolder = await resCreate.json();
        dokumentasiFolder = { id: newFolder.id, name: "Dokumentasi", mimeType: "application/vnd.google-apps.folder" };
      }

      // 2. Fetch "Dokumentasi" folder contents to find "Foto" or "Video" folder
      const resDok = await fetch(`/api/gdrive?folderId=${dokumentasiFolder.id}`);
      if (!resDok.ok) throw new Error("Failed to load Dokumentasi folder");
      const dokContents: GDriveFile[] = await resDok.json();
      let targetFolder = dokContents.find((f) => f.name === tab);

      if (!targetFolder) {
        // Automatically create Foto/Video folder!
        const resCreateSub = await fetch("/api/gdrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: dokumentasiFolder.id, folderName: tab })
        });
        if (!resCreateSub.ok) throw new Error(`Failed to create missing ${tab} folder`);
        const newSubFolder = await resCreateSub.json();
        targetFolder = { id: newSubFolder.id, name: tab, mimeType: "application/vnd.google-apps.folder" };
      }

      // 3. Set breadcrumbs history and browse files
      setFolderHistory([
        { id: dokumentasiFolder.id, name: "Dokumentasi" },
        { id: targetFolder.id, name: tab }
      ]);
      await browseFolder(targetFolder.id, tab, false);
    } catch (error) {
      console.error(error);
      alert("Gagal memuat galeri media. Silakan coba lagi.");
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleClientSelect = (client: ClientData) => {
    if (!client.googleFolderId) {
      alert("Klien ini belum memiliki folder Google Drive.");
      return;
    }
    setSelectedClient(client);
    loadClientRoot(client, "Foto");
  };

  const handleBack = () => {
    if (folderHistory.length <= 2) {
      // Go back to main client grid
      setSelectedClient(null);
      setActiveFolderId(null);
      setFolderHistory([]);
      setItems([]);
    } else {
      const newHistory = [...folderHistory];
      newHistory.pop(); // Remove current folder
      const parentFolder = newHistory[newHistory.length - 1];
      setFolderHistory(newHistory);
      browseFolder(parentFolder.id, parentFolder.name, false);
    }
  };

  // Create subfolder inside documentation
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !activeFolderId) return;

    try {
      setFolderSubmitting(true);
      const res = await fetch("/api/gdrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: activeFolderId,
          folderName: newFolderName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Folder creation failed");
      
      setFolderModalOpen(false);
      setNewFolderName("");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal membuat subfolder baru.");
    } finally {
      setFolderSubmitting(false);
    }
  };

  // Upload files with description via background queue
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !activeFolderId || !selectedClient) return;

    try {
      uploadFiles(selectedFiles, activeFolderId, mediaDescription.trim());
      setUploadModalOpen(false);
      setSelectedFiles([]);
      setMediaDescription("");
      
      // Notify user that it is starting
      alert(`Berhasil menambahkan ${selectedFiles.length} berkas ke antrean unggahan latar belakang! Anda dapat memantau progresnya di menu header.`);
      
      // Instantly do a quick browse to refresh if any fast uploads finish
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal memproses unggahan.");
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Hapus dokumentasi ini?")) return;
    try {
      setLoadingMedia(true);
      const res = await fetch(`/api/gdrive/delete?fileId=${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal menghapus.");
    } finally {
      setLoadingMedia(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Dokumentasi Proyek</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Unggah dan kelola foto & video dokumentasi kegiatan proyek klien ke Google Drive dengan sistem folder interaktif.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : !selectedClient ? (
        // Grid View of Clients
        <div className="space-y-8">
          <div>
            <div className="border-l-4 border-brand-500 pl-3 mb-4">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Klien Retainer (PT)</h2>
            </div>
            {retainers.length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada klien retainer terdaftar.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {retainers.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all group flex flex-col justify-between h-36"
                  >
                    <div>
                      <svg className="w-8 h-8 text-brand-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">Project: {client.projectName || "-"}</p>
                    </div>
                    <div className="text-[10px] font-bold text-brand-500 flex items-center gap-1 mt-2">
                      Lihat Dokumentasi →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                    className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all group flex flex-col justify-between h-36"
                  >
                    <div>
                      <svg className="w-8 h-8 text-brand-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">Kasus: {client.caseType || "-"}</p>
                    </div>
                    <div className="text-[10px] font-bold text-brand-500 flex items-center gap-1 mt-2">
                      Lihat Dokumentasi →
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Gallery View for selected client
        <div className="space-y-6">
          {/* NAVIGATION BAR AND BREADCRUMBS */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-stroke dark:border-strokedark p-4 bg-white dark:bg-gray-900 rounded-none shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 border border-stroke dark:border-strokedark rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">Media Gallery Manager</span>
                <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{selectedClient.clientName}</h2>
              </div>
            </div>

            {/* Path Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-1 text-[11px] font-black text-gray-400 uppercase tracking-wider">
              <span className="cursor-pointer hover:text-brand-500" onClick={() => loadClientRoot(selectedClient, activeTab)}>HOME</span>
              {folderHistory.map((hist, i) => {
                if (i === 0) return null; // Skip root Dokumentasi name
                return (
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
                );
              })}
            </div>
          </div>

          {/* ACTIONS AND TAB SELECTOR ROW */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark p-4 rounded-none shadow-sm">
            {/* Tab switchers - Only active if we are at root Foto/Video */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 border border-stroke dark:border-strokedark rounded-none">
              <button
                onClick={() => loadClientRoot(selectedClient, "Foto")}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors rounded-none ${activeTab === "Foto" ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              >
                Koleksi Foto
              </button>
              <button
                onClick={() => loadClientRoot(selectedClient, "Video")}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-colors rounded-none ${activeTab === "Video" ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              >
                Koleksi Video
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFolderModalOpen(true)}
                className="px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 hover:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
              >
                + Buat Subfolder
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 outline-none transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
              >
                + Unggah {activeTab}
              </button>
            </div>
          </div>

          {/* MEDIA LISTING */}
          {loadingMedia ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark">
              <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="border border-stroke dark:border-strokedark p-16 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-none shadow-sm">
              Folder ini kosong. Silakan buat folder baru atau unggah media.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {items.map((file) => {
                const isFolder = file.mimeType === "application/vnd.google-apps.folder";

                if (isFolder) {
                  return (
                    <div
                      key={file.id}
                      onClick={() => browseFolder(file.id, file.name)}
                      className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all group flex items-center gap-4"
                    >
                      <svg className="w-10 h-10 text-amber-500 fill-amber-500 flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                      </svg>
                      <div className="overflow-hidden">
                        <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                          {file.name}
                        </h3>
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Subfolder</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={file.id}
                    className="border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none overflow-hidden group hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    {/* PREVIEW CONTAINER */}
                    <div
                      onClick={() => setPreviewItem(file)}
                      className="relative h-44 w-full bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center border-b border-stroke dark:border-strokedark cursor-pointer overflow-hidden group/preview"
                    >
                      {file.thumbnailLink ? (
                        <div className="w-full h-full relative">
                          <img
                            src={file.thumbnailLink.replace(/=s\d+$/, "=s600")}
                            alt={file.name}
                            className="w-full h-full object-cover transition-transform group-hover/preview:scale-110 duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity duration-200">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/60 px-3 py-1.5 border border-white/25">
                              Buka Preview
                            </span>
                          </div>
                        </div>
                      ) : activeTab === "Foto" ? (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Image File</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <svg className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Video File</span>
                        </div>
                      )}
                    </div>

                    {/* INFO PANEL */}
                    <div className="p-4 flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-black dark:text-white truncate" title={file.name}>
                          {file.name}
                        </h4>
                        {file.description && (
                          <p className="text-[10px] text-gray-500 mt-1 line-clamp-2 leading-tight">
                            {file.description}
                          </p>
                        )}
                        <p className="text-[9px] text-gray-400 font-bold uppercase mt-2">
                          {file.createdTime ? new Date(file.createdTime).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }) : "-"}
                        </p>
                      </div>

                      <div className="flex justify-between items-center gap-2 mt-4 pt-3 border-t border-stroke dark:border-strokedark">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-[10px] font-black rounded-none uppercase transition-colors"
                          >
                            Buka Media
                          </a>
                        )}
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-black rounded-none uppercase transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CREATE SUBFOLDER MODAL */}
      <FeatureModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="Buat Subfolder Dokumentasi"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Subfolder</label>
            <input
              type="text"
              required
              placeholder="Contoh: Liputan Hari Ke-1"
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFolderModalOpen(false)}
              className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={folderSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50"
            >
              {folderSubmitting ? "Memproses..." : "Buat Folder"}
            </button>
          </div>
        </form>
      </FeatureModal>

      {/* UPLOAD FILE WITH DESCRIPTION MODAL */}
      <FeatureModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={`Unggah ${activeTab} ke Google Drive`}
      >
        <form onSubmit={handleFileUpload} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih Berkas {activeTab} (Mendukung hingga 1000 Berkas)</label>
            <input
              type="file"
              required
              multiple
              accept={activeTab === "Foto" ? "image/*" : "video/*"}
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-stroke dark:file:border-strokedark file:text-xs file:font-black file:uppercase file:bg-white dark:file:bg-gray-900 dark:file:text-white hover:file:bg-gray-50 file:cursor-pointer"
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setSelectedFiles(files);
              }}
            />
            <p className="text-[9px] text-gray-400 font-semibold mt-1 uppercase tracking-wider">
              Maksimum ukuran tiap berkas: 2GB. Mendukung multi-select unggahan sekaligus.
            </p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Keterangan Berkas</label>
            <textarea
              placeholder="Masukkan keterangan foto atau video dokumentasi ini..."
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold h-24 resize-none"
              value={mediaDescription}
              onChange={(e) => setMediaDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={selectedFiles.length === 0}
              className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors"
            >
              Mulai Unggah ({selectedFiles.length} Berkas)
            </button>
          </div>
        </form>
      </FeatureModal>

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
            className="max-w-4xl max-h-[85vh] w-full flex flex-col bg-gray-900 border border-white/10 p-6 rounded-none relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 flex items-center justify-center overflow-hidden max-h-[60vh] bg-black/40 border border-white/5">
              {previewItem.thumbnailLink ? (
                <img
                  src={previewItem.thumbnailLink.replace(/=s\d+$/, "=s1200")}
                  alt={previewItem.name}
                  className="max-w-full max-h-[58vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-white text-center">
                  <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest text-gray-400">Berkas Tanpa Preview Gambar</span>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/10 pt-4">
              <div className="overflow-hidden">
                <h4 className="text-sm font-black text-white uppercase tracking-wider truncate">{previewItem.name}</h4>
                {previewItem.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{previewItem.description}</p>
                )}
              </div>
              <div className="flex gap-3 flex-shrink-0">
                {previewItem.webViewLink && (
                  <a
                    href={previewItem.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-black text-xs uppercase tracking-wider rounded-none transition-all flex items-center gap-2"
                  >
                    Buka Asli (Drive)
                  </a>
                )}
                <button
                  onClick={() => setPreviewItem(null)}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-black text-xs uppercase tracking-wider rounded-none transition-all"
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
