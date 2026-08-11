"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { useUpload } from "@/context/UploadContext";
import { 
  FolderIcon, 
  ImageIcon, 
  VideoIcon, 
  PlusIcon, 
  SearchIcon, 
  ArrowLeftIcon, 
  ExternalLinkIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  BoxIconLine
} from "@/icons";

interface ClientData {
  id: string;
  clientName: string;
  projectName?: string;
  caseType?: string;
  categories?: string;
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

type MainTab = "RETAINER" | "NON_RETAINER";

export default function DokumentasiPage() {
  const [retainers, setRetainers] = useState<ClientData[]>([]);
  const [nonRetainers, setNonRetainers] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);

  // Main Category Tab & Search
  const [mainTab, setMainTab] = useState<MainTab>("RETAINER");
  const [searchQuery, setSearchQuery] = useState("");

  // Gallery view state
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [mediaTypeTab, setMediaTypeTab] = useState<"Foto" | "Video">("Foto");
  const [items, setItems] = useState<GDriveFile[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFolderName, setActiveFolderName] = useState<string>("");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);

  // Modal states
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaDescription, setMediaDescription] = useState("");
  const [previewItem, setPreviewItem] = useState<GDriveFile | null>(null);

  const { uploadFiles, activeUploadsCount } = useUpload();

  // Auto refresh folder items when uploads complete
  useEffect(() => {
    if (activeUploadsCount === 0 || !activeFolderId) return;
    const interval = setInterval(() => {
      browseFolder(activeFolderId, activeFolderName, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeUploadsCount, activeFolderId]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const [resRet, resNon] = await Promise.all([
        fetch("/api/retainer"),
        fetch("/api/perorangan"),
      ]);
      const retData = await resRet.json();
      const nonData = await resNon.json();
      setRetainers(Array.isArray(retData) ? retData : []);
      setNonRetainers(Array.isArray(nonData) ? nonData : []);
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

  const loadClientRoot = async (client: ClientData, tab: "Foto" | "Video") => {
    try {
      setLoadingMedia(true);
      setMediaTypeTab(tab);
      setItems([]);
      setFolderHistory([]);

      if (!client.googleFolderId) return;

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
        
        resMain = await fetch(`/api/gdrive?folderId=${client.googleFolderId}`);
        if (!resMain.ok) throw new Error("Auto-recreated folder but failed to load");
      }

      const mainContents: GDriveFile[] = await resMain.json();
      let dokumentasiFolder = mainContents.find((f) => f.name === "Dokumentasi");

      if (!dokumentasiFolder) {
        const resCreate = await fetch("/api/gdrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folderId: client.googleFolderId, folderName: "Dokumentasi" })
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

  const handleClientSelect = (client: ClientData) => {
    if (!client.googleFolderId) {
      alert("Klien ini belum memiliki folder Google Drive terhubung.");
      return;
    }
    setSelectedClient(client);
    loadClientRoot(client, "Foto");
  };

  const handleBack = () => {
    if (folderHistory.length <= 2) {
      setSelectedClient(null);
      setActiveFolderId(null);
      setFolderHistory([]);
      setItems([]);
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
    if (selectedFiles.length === 0 || !activeFolderId || !selectedClient) return;

    try {
      uploadFiles(selectedFiles, activeFolderId, mediaDescription.trim());
      setUploadModalOpen(false);
      setSelectedFiles([]);
      setMediaDescription("");
      
      alert(`Berhasil menambahkan ${selectedFiles.length} berkas ke antrean unggahan latar belakang.`);
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal memproses unggahan.");
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("Hapus dokumentasi ini dari Google Drive?")) return;
    try {
      setLoadingMedia(true);
      const res = await fetch(`/api/gdrive/delete?fileId=${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal menghapus media.");
    } finally {
      setLoadingMedia(false);
    }
  };

  // Filter clients based on search query
  const currentClientList = mainTab === "RETAINER" ? retainers : nonRetainers;
  const filteredClients = currentClientList.filter((c) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = c.clientName.toLowerCase().includes(q);
    const subMatch = (c.projectName || c.caseType || "").toLowerCase().includes(q);
    return nameMatch || subMatch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">
            Galeri Dokumentasi Pekerjaan
          </h1>
          <p className="text-xs text-gray-500">
            Arsip visual foto & video kegiatan klien langsung terintegrasi dengan Google Drive.
          </p>
        </div>
        {selectedClient && (
          <button
            onClick={() => setSelectedClient(null)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-xs font-bold text-gray-700 dark:text-gray-200 hover:border-brand-500 transition-all flex items-center gap-2 self-start md:self-auto"
          >
            ← Kembali ke Pilih Klien
          </button>
        )}
      </div>

      {!selectedClient ? (
        /* ─── CLIENT CATEGORY GALLERY SELECTION ─────────────────────────────────────── */
        <div className="space-y-6">
          {/* Top Tabs Switcher & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            {/* Category Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700/50">
              <button
                onClick={() => setMainTab("RETAINER")}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  mainTab === "RETAINER"
                    ? "bg-brand-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Retainer ({retainers.length})
              </button>
              <button
                onClick={() => setMainTab("NON_RETAINER")}
                className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  mainTab === "NON_RETAINER"
                    ? "bg-brand-500 text-white shadow-md"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                Non-Retainer ({nonRetainers.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Cari nama klien / pekerjaan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 text-xs font-semibold"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Client Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-44 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl">
              Belum ada data klien terdaftar pada kategori ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredClients.map((client) => {
                const subTitle = client.projectName || client.caseType || "—";
                return (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="group bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 hover:border-brand-500/80 p-5 rounded-2xl transition-all cursor-pointer shadow-sm hover:shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-black text-sm border border-brand-500/20">
                          📁
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          GDrive
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-black dark:text-white uppercase tracking-wide group-hover:text-brand-500 transition-colors line-clamp-1">
                        {client.clientName}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 line-clamp-1">
                        {subTitle}
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] font-bold text-brand-500 uppercase tracking-wider">
                      <span>Buka Galeri Foto / Video</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── CLIENT GALLERY MEDIA VIEW ─────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Client Header Info & Breadcrumb Bar */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-2 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                  title="Kembali"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <div>
                  <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">
                    {mainTab === "RETAINER" ? "KLIEN RETAINER" : "KLIEN NON-RETAINER"}
                  </span>
                  <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-wide">
                    {selectedClient.clientName}
                  </h2>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFolderModalOpen(true)}
                  className="px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Subfolder
                </button>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  + Unggah {mediaTypeTab}
                </button>
              </div>
            </div>

            {/* Folder Path Breadcrumb */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider pt-2 border-t border-gray-100 dark:border-gray-800">
              <span className="cursor-pointer hover:text-brand-500" onClick={() => loadClientRoot(selectedClient, mediaTypeTab)}>
                {selectedClient.clientName}
              </span>
              {folderHistory.map((hist, i) => {
                if (i === 0) return null;
                const isLast = i === folderHistory.length - 1;
                return (
                  <React.Fragment key={hist.id}>
                    <span>/</span>
                    <span
                      className={`cursor-pointer hover:text-brand-500 ${isLast ? "text-brand-500 font-black" : ""}`}
                      onClick={() => {
                        if (isLast) return;
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

          {/* Media Type Tabs (Foto vs Video) */}
          <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2">
            <button
              onClick={() => loadClientRoot(selectedClient, "Foto")}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 cursor-pointer transition-colors ${
                mediaTypeTab === "Foto"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              📷 Koleksi Foto
            </button>
            <button
              onClick={() => loadClientRoot(selectedClient, "Video")}
              className={`px-5 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 cursor-pointer transition-colors ${
                mediaTypeTab === "Video"
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              🎥 Koleksi Video
            </button>
          </div>

          {/* Gallery Media Grid */}
          {loadingMedia ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-xs text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl">
              Folder ini belum memiliki media. Klik "+ Unggah {mediaTypeTab}" untuk menambahkan.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((file) => {
                const isFolder = file.mimeType === "application/vnd.google-apps.folder";

                if (isFolder) {
                  return (
                    <div
                      key={file.id}
                      onClick={() => browseFolder(file.id, file.name)}
                      className="p-4 border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] hover:border-brand-500 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-40 group shadow-sm hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg">
                        📁
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-black dark:text-white uppercase tracking-wide truncate group-hover:text-brand-500 transition-colors">
                          {file.name}
                        </h4>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Subfolder</span>
                      </div>
                    </div>
                  );
                }

                const hasThumb = !!file.thumbnailLink;
                const thumbUrl = hasThumb ? file.thumbnailLink!.replace(/=s\d+$/, "=s600") : null;

                return (
                  <div
                    key={file.id}
                    className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    {/* Thumbnail Preview Area */}
                    <div
                      onClick={() => setPreviewItem(file)}
                      className="relative h-40 w-full bg-gray-100 dark:bg-gray-850 cursor-pointer overflow-hidden flex items-center justify-center"
                    >
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={file.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                          <span className="text-2xl">{mediaTypeTab === "Foto" ? "🖼️" : "🎬"}</span>
                          <span className="text-[9px] font-bold uppercase">{file.mimeType.split("/")[1] || "Media"}</span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="px-3 py-1 bg-white/90 text-black text-[10px] font-black uppercase tracking-wider rounded-lg shadow">
                          Preview
                        </span>
                      </div>
                    </div>

                    {/* File Title & Actions */}
                    <div className="p-3 flex flex-col justify-between flex-1">
                      <div>
                        <h4 className="text-xs font-bold text-black dark:text-white truncate" title={file.name}>
                          {file.name}
                        </h4>
                        {file.description && (
                          <p className="text-[9px] text-gray-400 line-clamp-1 mt-0.5">{file.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-black text-brand-500 hover:underline uppercase tracking-wider"
                          >
                            Drive ↗
                          </a>
                        )}
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="text-[9px] font-black text-red-500 hover:underline uppercase tracking-wider cursor-pointer"
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

      {/* ─── CREATE SUBFOLDER MODAL ────────────────────────────────────────── */}
      <FeatureModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="Buat Subfolder Baru"
        subtitle="Kelola kelompok dokumentasi secara rapi"
        icon={<BoxIconLine />}
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Subfolder</label>
            <input
              type="text"
              required
              placeholder="Contoh: Dokumen Kunjungan Lapangan"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={folderSubmitting}
            className="w-full bg-brand-500 text-white py-3.5 font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all disabled:opacity-50"
          >
            {folderSubmitting ? "Membuat Subfolder..." : "Simpan Subfolder"}
          </button>
        </form>
      </FeatureModal>

      {/* ─── UPLOAD MEDIA MODAL ───────────────────────────────────────────── */}
      <FeatureModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={`Unggah ${mediaTypeTab}`}
        subtitle={`Upload berkas ${mediaTypeTab.toLowerCase()} ke Google Drive`}
        icon={<BoxIconLine />}
      >
        <form onSubmit={handleFileUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">
              Pilih Berkas {mediaTypeTab}
            </label>
            <input
              type="file"
              required
              multiple
              accept={mediaTypeTab === "Foto" ? "image/*" : "video/*"}
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-xs file:font-black file:uppercase file:bg-brand-500 file:text-white hover:file:bg-brand-600 file:cursor-pointer"
              onChange={(e) => {
                const files = e.target.files ? Array.from(e.target.files) : [];
                setSelectedFiles(files);
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan Media</label>
            <textarea
              placeholder="Keterangan singkat berkas..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark px-4 py-3 text-sm focus:border-brand-500 outline-none font-medium h-20 resize-none"
              value={mediaDescription}
              onChange={(e) => setMediaDescription(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={selectedFiles.length === 0}
            className="w-full bg-brand-500 text-white py-3.5 font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all disabled:opacity-50"
          >
            Mulai Unggah ({selectedFiles.length} Berkas)
          </button>
        </form>
      </FeatureModal>

      {/* ─── MEDIA PREVIEW LIGHTBOX MODAL ─────────────────────────────────── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-black text-black dark:text-white uppercase truncate max-w-md">
                {previewItem.name}
              </h3>
              <button
                onClick={() => setPreviewItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Lightbox Media Body */}
            <div className="p-6 flex-1 flex items-center justify-center bg-black/40 overflow-hidden">
              {previewItem.thumbnailLink ? (
                <img
                  src={previewItem.thumbnailLink.replace(/=s\d+$/, "=s1200")}
                  alt={previewItem.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : (
                <div className="py-20 text-center text-gray-400 font-bold uppercase text-xs">
                  Pratinjau tidak tersedia
                </div>
              )}
            </div>

            {/* Lightbox Footer Actions */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium truncate max-w-md">
                {previewItem.description || "Tanpa deskripsi tambahan"}
              </p>
              {previewItem.webViewLink && (
                <a
                  href={previewItem.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-brand-600 transition-colors"
                >
                  Buka Berkas Asli di Google Drive ↗
                </a>
              )}
            </div>
        </div>
      )}
    </div>
  );
}
