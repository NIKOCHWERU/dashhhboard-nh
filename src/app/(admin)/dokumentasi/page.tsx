"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { useUpload } from "@/context/UploadContext";

interface ClientData {
  id: string;
  clientName: string;
  projectName?: string;
  caseType?: string;
  googleFolderId: string | null;
  isRetainer?: boolean;
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
  const { data: session } = useSession();
  const [retainers, setRetainers] = useState<ClientData[]>([]);
  const [perorangan, setPerorangan] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for the requested feature
  const [category, setCategory] = useState<"Retainer" | "Non Retainer" | "Internal">("Retainer");
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [activeTab, setActiveTab] = useState<"Dokumen" | "Foto" | "Video">("Dokumen");
  const [viewMode, setViewMode] = useState<"Grid" | "List">("Grid");

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
  const [selectedUploads, setSelectedUploads] = useState<{ file: File; name: string; category: string; description: string; }[]>([]);
  const [previewItem, setPreviewItem] = useState<GDriveFile | null>(null);

  const { uploadFiles, activeUploadsCount } = useUpload();

  const prevUploadsCount = useRef(0);

  useEffect(() => {
    if (activeUploadsCount === 0) {
      if (prevUploadsCount.current > 0 && activeFolderId) {
        browseFolder(activeFolderId, activeFolderName, false);
      }
      prevUploadsCount.current = 0;
      return;
    }
    prevUploadsCount.current = activeUploadsCount;
    const interval = setInterval(() => {
      browseFolder(activeFolderId, activeFolderName, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeUploadsCount, activeFolderId]);

  useEffect(() => {
    fetchClients();
  }, []);

  // When category changes, reset selected client and items
  useEffect(() => {
    setSelectedClient(null);
    setItems([]);
    setFolderHistory([]);
    if (category === "Internal") {
      // Create a dummy client for internal to load its root
      const internalClient: ClientData = {
        id: "internal-root",
        clientName: "Dokumentasi Internal",
        googleFolderId: "internal-placeholder" // will be intercepted by loadClientRoot
      };
      setSelectedClient(internalClient);
      loadClientRoot(internalClient, activeTab);
    }
  }, [category]);

  // When active tab changes and we have a client, load the root for that tab
  useEffect(() => {
    if (selectedClient && folderHistory.length <= 2) {
      loadClientRoot(selectedClient, activeTab);
    }
  }, [activeTab]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const [resRet, resPer] = await Promise.all([
        fetch("/api/retainer"),
        fetch("/api/perorangan"),
      ]);
      const retData = await resRet.json();
      const perData = await resPer.json();
      
      const formattedRet = (Array.isArray(retData) ? retData : []).map((r: any) => ({
        ...r,
        isRetainer: true,
      }));
      const formattedPer = (Array.isArray(perData) ? perData : []).map((p: any) => ({
        ...p,
        isRetainer: false,
      }));

      setRetainers(formattedRet);
      setPerorangan(formattedPer);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const browseFolder = async (folderId: string | null, folderName: string, pushHistory = true) => {
    try {
      setLoadingMedia(true);
      if (!folderId) return;
      setActiveFolderId(folderId);
      setActiveFolderName(folderName);

      if (pushHistory) {
        setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
      }

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

  const loadClientRoot = async (client: ClientData, tab: "Dokumen" | "Foto" | "Video") => {
    try {
      setLoadingMedia(true);
      setItems([]);
      setFolderHistory([]);

      let baseFolderId = client.googleFolderId;

      // Special handling for internal
      if (client.id === "internal-root") {
        // Find or create 'Internal_NH' in root
        const resRoot = await fetch("/api/gdrive?folderId=root");
        if (resRoot.ok) {
          const rootFiles: GDriveFile[] = await resRoot.json();
          let intFolder = rootFiles.find(f => f.name === "Internal_NH_Dokumentasi");
          if (!intFolder) {
            const resCreate = await fetch("/api/gdrive", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ folderId: "root", folderName: "Internal_NH_Dokumentasi" })
            });
            const newFolder = await resCreate.json();
            intFolder = { id: newFolder.id, name: "Internal_NH_Dokumentasi", mimeType: "application/vnd.google-apps.folder" };
          }
          baseFolderId = intFolder.id;
        }
      }

      if (!baseFolderId) {
        setLoadingMedia(false);
        return;
      }

      let resMain = await fetch(`/api/gdrive?folderId=${baseFolderId}`);
      
      if (!resMain.ok && client.id !== "internal-root") {
        const cType = (client as any).isRetainer ? "Retainer" : "Perorangan";
        const resRecreate = await fetch("/api/gdrive/recreate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: client.id, clientName: client.clientName, type: cType })
        });
        if (!resRecreate.ok) throw new Error("Failed to auto-repair client folder");
        const jsonRecreate = await resRecreate.json();
        baseFolderId = jsonRecreate.googleFolderId;
        
        resMain = await fetch(`/api/gdrive?folderId=${baseFolderId}`);
        if (!resMain.ok) throw new Error("Auto-recreated folder but failed to load");
      }

      const mainContents: GDriveFile[] = await resMain.json();
      let dokumentasiFolder = mainContents.find((f) => f.name === "Dokumentasi");

      if (!dokumentasiFolder) {
        const resCreate = await fetch("/api/gdrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: baseFolderId, folderName: "Dokumentasi" })
        });
        if (!resCreate.ok) throw new Error("Failed to create missing Dokumentasi folder");
        const newFolder = await resCreate.json();
        dokumentasiFolder = { id: newFolder.id, name: "Dokumentasi", mimeType: "application/vnd.google-apps.folder" };
      }

      const resDok = await fetch(`/api/gdrive?folderId=${dokumentasiFolder.id}`);
      if (!resDok.ok) throw new Error("Failed to load Dokumentasi folder");
      const dokContents: GDriveFile[] = await resDok.json();
      let targetFolder = dokContents.find((f) => f.name === tab);

      if (!targetFolder) {
        const resCreateSub = await fetch("/api/gdrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: dokumentasiFolder.id, folderName: tab })
        });
        if (!resCreateSub.ok) throw new Error(`Failed to create missing ${tab} folder`);
        const newSubFolder = await resCreateSub.json();
        targetFolder = { id: newSubFolder.id, name: tab, mimeType: "application/vnd.google-apps.folder" };
      }

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

  const handleBack = () => {
    if (folderHistory.length <= 2) {
      if (category !== "Internal") {
        setSelectedClient(null);
        setActiveFolderId(null);
        setFolderHistory([]);
        setItems([]);
      }
    } else {
      const newHistory = [...folderHistory];
      newHistory.pop();
      const parentFolder = newHistory[newHistory.length - 1];
      setFolderHistory(newHistory);
      browseFolder(parentFolder.id, parentFolder.name, false);
    }
  };

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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUploads.length === 0 || !activeFolderId || !selectedClient) return;

    try {
      const files = selectedUploads.map((up) => up.file);
      const customMetadata = selectedUploads.map((up) => {
        const descJson = {
          text: up.description.trim() || "",
          category: up.category.trim(),
        };
        return {
          fileName: up.name.trim(),
          description: JSON.stringify(descJson),
        };
      });

      uploadFiles(files, activeFolderId, "", customMetadata);
      setUploadModalOpen(false);
      setSelectedUploads([]);
      
      alert(`Berhasil menambahkan ${selectedUploads.length} berkas ke antrean unggahan latar belakang!`);
      
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal memproses unggahan.");
    }
  };

  const handleFileDelete = async (file: GDriveFile) => {
    let isAllowedToDelete = false;
    const sessionUser = session?.user as any;
    if (sessionUser?.role === "admin") {
      isAllowedToDelete = true;
    } else if (file.description) {
      try {
        const parsed = JSON.parse(file.description);
        if (parsed.uploaderId === sessionUser?.id) {
          isAllowedToDelete = true;
        }
      } catch (e) {
        // legacy file
      }
    }

    if (!isAllowedToDelete) {
      alert("Anda hanya diizinkan menghapus berkas yang Anda unggah sendiri!");
      return;
    }

    if (!confirm("Hapus dokumentasi ini?")) return;
    try {
      setLoadingMedia(true);
      const res = await fetch(`/api/gdrive/delete?fileId=${file.id}`, {
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
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Dokumentasi Pekerjaan</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Kelola arsip dokumen, foto & video dokumentasi dengan tampilan galeri.
          </p>
        </div>
        
        {/* LIST PICK & TABS CONFIG */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-none text-xs font-black uppercase tracking-wider text-brand-500 outline-none focus:border-brand-500 transition-colors cursor-pointer"
          >
            <option value="Retainer">Retainer</option>
            <option value="Non Retainer">Non Retainer</option>
            <option value="Internal">Internal</option>
          </select>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 border border-stroke dark:border-strokedark rounded-none">
            {(["Dokumen", "Video", "Foto"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors rounded-none ${activeTab === tab ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 border border-stroke dark:border-strokedark rounded-none">
            <button
              onClick={() => setViewMode("Grid")}
              className={`p-1.5 transition-colors rounded-none ${viewMode === "Grid" ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              title="Grid View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            </button>
            <button
              onClick={() => setViewMode("List")}
              className={`p-1.5 transition-colors rounded-none ${viewMode === "List" ? "bg-brand-500 text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}
              title="List View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : !selectedClient && category !== "Internal" ? (
        // Client Selection
        <div className="space-y-4">
          <div className="border-l-4 border-brand-500 pl-3 mb-4">
            <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Pilih Klien {category}</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {(category === "Retainer" ? retainers : perorangan).length === 0 ? (
              <p className="text-xs text-gray-400 italic">Belum ada klien di kategori ini.</p>
            ) : (
              (category === "Retainer" ? retainers : perorangan).map((client) => (
                <div
                  key={client.id}
                  onClick={() => {
                    if (!client.googleFolderId) {
                      alert("Klien ini belum memiliki folder Google Drive.");
                      return;
                    }
                    setSelectedClient(client);
                    loadClientRoot(client, activeTab);
                  }}
                  className="p-5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none cursor-pointer hover:border-brand-500 hover:shadow-lg transition-all group flex flex-col justify-between h-36"
                >
                  <div>
                    <svg className="w-8 h-8 text-brand-500 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      {category === "Retainer" ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      )}
                    </svg>
                    <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                      {client.clientName}
                    </h3>
                  </div>
                  <div className="text-[10px] font-bold text-brand-500 flex items-center gap-1 mt-2">
                    Buka Folder →
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // Gallery View for selected client
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-stroke dark:border-strokedark p-4 bg-white dark:bg-gray-900 rounded-none shadow-sm">
            <div className="flex items-center gap-3">
              {category !== "Internal" && folderHistory.length <= 2 && (
                <button
                  onClick={() => { setSelectedClient(null); setItems([]); setFolderHistory([]); }}
                  className="p-2 border border-stroke dark:border-strokedark rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              {folderHistory.length > 2 && (
                <button
                  onClick={handleBack}
                  className="p-2 border border-stroke dark:border-strokedark rounded-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div>
                <span className="text-[9px] font-bold text-brand-500 uppercase tracking-widest">{activeTab}</span>
                <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{selectedClient?.clientName}</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-[11px] font-black text-gray-400 uppercase tracking-wider">
              <span className="cursor-pointer hover:text-brand-500" onClick={() => loadClientRoot(selectedClient!, activeTab)}>HOME</span>
              {folderHistory.map((hist, i) => {
                if (i === 0) return null;
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
            
            <div className="flex gap-2">
              <button
                onClick={() => setFolderModalOpen(true)}
                className="px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 hover:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider"
              >
                + Buat Subfolder
              </button>
              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 outline-none transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider"
              >
                + Unggah {activeTab}
              </button>
            </div>
          </div>

          {loadingMedia ? (
            <div className="flex justify-center items-center py-20 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark">
              <div className="animate-spin rounded-none h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="border border-stroke dark:border-strokedark p-16 text-center text-xs text-gray-400 italic bg-white dark:bg-gray-900 rounded-none shadow-sm">
              Folder ini kosong.
            </div>
          ) : (
            viewMode === "Grid" ? (
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
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-10 h-10 text-gray-400 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Berkas {activeTab}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-black text-black dark:text-white truncate" title={file.name}>
                            {file.name}
                          </h4>
                        </div>
                        <div className="flex justify-between items-center gap-2 mt-4 pt-3 border-t border-stroke dark:border-strokedark">
                          {file.webViewLink && (
                            <a href={file.webViewLink} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-brand-50 text-brand-700 hover:bg-brand-100 text-[10px] font-black rounded-none uppercase transition-colors">Buka</a>
                          )}
                          <button onClick={() => handleFileDelete(file)} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-black rounded-none uppercase transition-colors">Hapus</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b border-stroke dark:border-strokedark font-black uppercase tracking-wider">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Tipe</th>
                      <th className="px-4 py-3">Tanggal</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    {items.map((file) => {
                      const isFolder = file.mimeType === "application/vnd.google-apps.folder";
                      return (
                        <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="px-4 py-3 font-bold text-black dark:text-white flex items-center gap-3">
                            {isFolder ? (
                              <svg className="w-5 h-5 text-amber-500 fill-amber-500 flex-shrink-0 cursor-pointer" viewBox="0 0 24 24" onClick={() => browseFolder(file.id, file.name)}>
                                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" onClick={() => setPreviewItem(file)}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            )}
                            <span className="truncate max-w-[200px] cursor-pointer" onClick={() => isFolder ? browseFolder(file.id, file.name) : setPreviewItem(file)}>{file.name}</span>
                          </td>
                          <td className="px-4 py-3 text-[10px] uppercase font-bold text-gray-500">{isFolder ? "Folder" : "Berkas"}</td>
                          <td className="px-4 py-3 text-[10px] text-gray-500 font-bold uppercase">{file.createdTime ? new Date(file.createdTime).toLocaleDateString("id-ID") : "-"}</td>
                          <td className="px-4 py-3 text-right">
                            {!isFolder && file.webViewLink && (
                              <a href={file.webViewLink} target="_blank" rel="noreferrer" className="text-brand-500 font-bold text-[10px] uppercase tracking-wider hover:underline mr-3">Buka</a>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); handleFileDelete(file); }} className="text-red-500 font-bold text-[10px] uppercase tracking-wider hover:underline">Hapus</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* CREATE SUBFOLDER MODAL */}
      <FeatureModal isOpen={folderModalOpen} onClose={() => setFolderModalOpen(false)} title="Buat Subfolder Dokumentasi">
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Subfolder</label>
            <input
              type="text"
              required
              placeholder="Contoh: Dokumen Bukti"
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setFolderModalOpen(false)} className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800">Batal</button>
            <button type="submit" disabled={folderSubmitting} className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase disabled:opacity-50">Buat Folder</button>
          </div>
        </form>
      </FeatureModal>

      {/* UPLOAD FILE MODAL */}
      <FeatureModal isOpen={uploadModalOpen} onClose={() => { setUploadModalOpen(false); setSelectedUploads([]); }} title={`Unggah ${activeTab}`}>
        <form onSubmit={handleFileUpload} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih Berkas {activeTab}</label>
            <input
              type="file"
              required
              multiple
              accept={activeTab === "Foto" ? "image/*" : activeTab === "Video" ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx"}
              className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-stroke file:text-xs file:font-black file:uppercase file:bg-white hover:file:bg-gray-50 file:cursor-pointer"
              onChange={(e) => {
                if (!e.target.files) return;
                const files = Array.from(e.target.files);
                setSelectedUploads(
                  files.map((file) => ({
                    file,
                    name: file.name,
                    category: "",
                    description: "",
                  }))
                );
              }}
            />
          </div>

          {selectedUploads.length > 0 && (
            <div className="max-h-72 overflow-y-auto border border-stroke dark:border-strokedark p-3 bg-gray-50 dark:bg-gray-900/50 space-y-4 rounded-none custom-scrollbar">
              <span className="block text-[10px] font-black uppercase text-gray-400 tracking-wider">Sesuaikan Detail Berkas ({selectedUploads.length})</span>
              {selectedUploads.map((up, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-[#1a1d27] border border-stroke dark:border-strokedark space-y-2 rounded-none">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-1.5 mb-1.5">
                    <span className="text-[10px] font-bold text-gray-500 truncate max-w-[200px]">{up.file.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedUploads(prev => prev.filter((_, i) => i !== idx))}
                      className="text-[9px] font-bold text-red-500 hover:underline uppercase cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-450 mb-1">Nama Berkas</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-gray-50 dark:bg-gray-805 border border-stroke dark:border-strokedark rounded-none px-3 py-1.5 text-xs focus:border-brand-500 outline-none font-semibold text-black dark:text-white"
                        value={up.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedUploads(prev => prev.map((item, i) => i === idx ? { ...item, name: val } : item));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-black uppercase text-gray-450 mb-1">Kategori / Tag</label>
                      <input
                        type="text"
                        placeholder="Contoh: Laporan, Somasi, Kontrak"
                        className="w-full bg-gray-50 dark:bg-gray-805 border border-stroke dark:border-strokedark rounded-none px-3 py-1.5 text-xs focus:border-brand-500 outline-none font-semibold text-black dark:text-white"
                        value={up.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedUploads(prev => prev.map((item, i) => i === idx ? { ...item, category: val } : item));
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black uppercase text-gray-450 mb-1">Keterangan / Deskripsi</label>
                    <input
                      type="text"
                      placeholder="Tambahkan keterangan berkas..."
                      className="w-full bg-gray-50 dark:bg-gray-805 border border-stroke dark:border-strokedark rounded-none px-3 py-1.5 text-xs focus:border-brand-500 outline-none font-semibold text-black dark:text-white"
                      value={up.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedUploads(prev => prev.map((item, i) => i === idx ? { ...item, description: val } : item));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => { setUploadModalOpen(false); setSelectedUploads([]); }} className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-850">Batal</button>
            <button type="submit" disabled={selectedUploads.length === 0} className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase disabled:opacity-50">Mulai Unggah</button>
          </div>
        </form>
      </FeatureModal>

      {/* FULLSCREEN PREVIEW */}
      {previewItem && (() => {
        let uploaderName = "Tenaga Kerja (Sistem)";
        let uploaderImage = "";
        let descriptionText = "Tidak ada keterangan.";
        let categoryText = "";

        if (previewItem.description) {
          try {
            const parsed = JSON.parse(previewItem.description);
            uploaderName = parsed.uploaderName || "Tenaga Kerja (Sistem)";
            uploaderImage = parsed.uploaderImage || "";
            descriptionText = parsed.text || "Tidak ada keterangan.";
            categoryText = parsed.category || "";
          } catch (e) {
            descriptionText = previewItem.description;
          }
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setPreviewItem(null)}>
            <button className="absolute top-6 right-6 text-white text-4xl font-light hover:text-red-500 transition-colors">&times;</button>
            <div className="max-w-4xl w-full flex flex-col bg-gray-900 border border-white/10 p-6 rounded-none relative" onClick={(e) => e.stopPropagation()}>
              
              {/* Clickable Large Thumbnail Container */}
              <div className="flex-1 flex items-center justify-center overflow-hidden max-h-[60vh] bg-black/40 relative group/link">
                {previewItem.webViewLink ? (
                  <a href={previewItem.webViewLink} target="_blank" rel="noreferrer" className="block w-full text-center" title="Klik untuk membuka file viewer Google Drive">
                    {previewItem.thumbnailLink ? (
                      <div className="relative inline-block">
                        <img 
                          src={previewItem.thumbnailLink.replace(/=s\d+$/, "=s1200")} 
                          alt={previewItem.name} 
                          className="max-w-full max-h-[55vh] object-contain mx-auto transition-opacity group-hover/link:opacity-80 duration-200" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/link:opacity-100 transition-opacity bg-black/30">
                          <span className="bg-brand-500 text-white px-4 py-2 text-xs font-black uppercase tracking-widest shadow-lg">📂 Buka File Viewer</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-white py-20 flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-xs uppercase font-bold tracking-widest text-brand-400 underline">Buka di Google Drive</span>
                      </div>
                    )}
                  </a>
                ) : (
                  previewItem.thumbnailLink ? (
                    <img src={previewItem.thumbnailLink.replace(/=s\d+$/, "=s1200")} alt={previewItem.name} className="max-w-full max-h-[55vh] object-contain" />
                  ) : (
                    <div className="text-white py-12">Berkas tidak memiliki preview</div>
                  )
                )}
              </div>

              {/* Detail Info Panel */}
              <div className="mt-6 border-t border-white/10 pt-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider">
                      {previewItem.name}
                      {categoryText && (
                        <span className="ml-2.5 inline-block px-2.5 py-0.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 text-[9px] font-black uppercase tracking-widest rounded-none">
                          {categoryText}
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-400 font-semibold">TIPE: {previewItem.mimeType.split("/")[1]?.toUpperCase() || "UNKNOWN"}</p>
                  </div>
                  
                  {/* Uploader Details */}
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-3 rounded-lg min-w-[250px]">
                    {uploaderImage ? (
                      <img src={uploaderImage} alt={uploaderName} className="w-8 h-8 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 font-black flex items-center justify-center text-[10px] uppercase border border-brand-500/30">
                        {uploaderName.substring(0, 2)}
                      </div>
                    )}
                    <div>
                      <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest">Pengunggah berkas</span>
                      <span className="block text-xs font-bold text-gray-300">{uploaderName}</span>
                    </div>
                  </div>
                </div>

                {/* Description Text */}
                <div className="bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                  <span className="block text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Keterangan / Deskripsi</span>
                  <p className="text-xs text-gray-300 font-medium leading-relaxed">{descriptionText}</p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {previewItem.webViewLink && (
                    <a href={previewItem.webViewLink} target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-brand-500 text-white font-black text-xs uppercase tracking-wider hover:bg-brand-600 transition-colors">Buka di Drive</a>
                  )}
                  <button onClick={() => setPreviewItem(null)} className="px-5 py-2.5 bg-gray-800 text-gray-300 font-black text-xs uppercase tracking-wider hover:bg-gray-700 transition-colors">Tutup</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
