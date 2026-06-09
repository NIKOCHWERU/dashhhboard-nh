"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { DokumenIcon } from "@/icons/MenuIcons";
import { FeatureModal } from "@/components/common/FeatureModal";

interface GDriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  owners?: Array<{ displayName: string }>;
  isFolder: boolean;
  customName?: string;
  description?: string;
  pic?: string;
  pt?: string;
  dbId?: string;
}

interface Employee {
  id: string;
  name: string;
  email: string | null;
  position: string;
}

export default function NarasumberHukumPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(true);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeFolderName, setActiveFolderName] = useState<string>("NARASUMBER HUKUM");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  
  const [items, setItems] = useState<GDriveItem[]>([]);
  const [ptList, setPtList] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<Record<string, GDriveItem[]>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Modals state
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [customName, setCustomName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPT, setSelectedPT] = useState("");
  const [uploadSubmitting, setUploadSubmitting] = useState(false);

  // Edit modals state
  const [editFolderModalOpen, setEditFolderModalOpen] = useState(false);
  const [editingFolderItem, setEditingFolderItem] = useState<GDriveItem | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [editFolderSubmitting, setEditFolderSubmitting] = useState(false);

  const [editFileModalOpen, setEditFileModalOpen] = useState(false);
  const [editingFileItem, setEditingFileItem] = useState<GDriveItem | null>(null);
  const [editFileName, setEditFileName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPT, setEditPT] = useState("");
  const [editFileSubmitting, setEditFileSubmitting] = useState(false);

  // PIC interactive dropdown search
  const [selectedPICs, setSelectedPICs] = useState<string[]>([]);
  const [picSearch, setPicSearch] = useState("");
  const [picDropdownOpen, setPicDropdownOpen] = useState(false);
  const picDropdownRef = useRef<HTMLDivElement>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GDriveItem | null>(null);

  const [recentFilesList, setRecentFilesList] = useState<GDriveItem[]>([]);
  const [previewItem, setPreviewItem] = useState<GDriveItem | null>(null);

  // Fetch initial data
  useEffect(() => {
    fetchPTs();
    fetchEmployees();
    browseFolder(null, "Arsip Utama", true);
    fetchRecentFiles();
  }, []);

  // Handle click outside PIC dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
        setPicDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPTs = async () => {
    try {
      const res = await fetch("/api/retainer");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const names = Array.from(new Set(data.map((r) => r.clientName).filter(Boolean))) as string[];
          setPtList(names.sort());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/karyawan");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const browseFolder = async (folderId: string | null, folderName: string, pushHistory = true) => {
    try {
      setLoading(true);
      
      let url = "/api/narasumber-hukum";
      if (folderId) {
        url += `?folderId=${folderId}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load folder items");
      const data = await res.json();

      setActiveFolderId(data.folderId);
      setActiveFolderName(folderName);
      setItems(data.items || []);

      // Update tree navigation data
      const subfolders = (data.items || []).filter((item: GDriveItem) => item.isFolder);
      setTreeData(prev => ({
        ...prev,
        [data.folderId]: subfolders
      }));

      if (folderId === null) {
        setRootFolderId(data.folderId);
        // Automatically expand the root folder
        setExpandedFolders(prev => ({ ...prev, [data.folderId]: true }));
      }

      if (pushHistory) {
        if (folderId === null) {
          setFolderHistory([{ id: data.folderId, name: "Arsip Utama" }]);
        } else {
          setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Sistem gagal terhubung ke Google Drive. Pastikan konfigurasi jaringan atau izin akses Anda telah aktif.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentFiles = async () => {
    try {
      const res = await fetch("/api/gdrive/recent");
      if (res.ok) {
        const data = await res.json();
        setRecentFilesList(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch recent files:", e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Tautan berhasil disalin ke papan klip!");
  };

  const handleSearch = async (query: string) => {
    setSearchTerm(query);
    if (!query.trim()) {
      browseFolder(activeFolderId, activeFolderName, false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/narasumber-hukum?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (folderHistory.length <= 1) return;
    const newHistory = [...folderHistory];
    newHistory.pop(); // Remove current folder
    const parentFolder = newHistory[newHistory.length - 1];
    setFolderHistory(newHistory);
    // If going back to root
    if (newHistory.length === 1) {
      browseFolder(null, "Arsip Utama", false);
    } else {
      browseFolder(parentFolder.id, parentFolder.name, false);
    }
  };

  const fetchSubfolders = async (folderId: string) => {
    if (treeData[folderId]) return;
    try {
      const res = await fetch(`/api/narasumber-hukum?folderId=${folderId}`);
      if (res.ok) {
        const data = await res.json();
        const subfolders = (data.items || []).filter((item: GDriveItem) => item.isFolder);
        setTreeData(prev => ({
          ...prev,
          [folderId]: subfolders
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderFolderTree = (folderId: string, depth = 0) => {
    const subfolders = treeData[folderId] || [];
    const isExpanded = !!expandedFolders[folderId];
    const isActive = activeFolderId === folderId;

    const folderName = folderId === rootFolderId ? "Root Drive" : 
                       (Object.values(treeData).flat().find(f => f.id === folderId)?.name || 
                        folderHistory.find(h => h.id === folderId)?.name || "Folder");

    return (
      <div key={folderId} className="select-none">
        <div
          className={`flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer transition-all group ${
            isActive
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-150/50 dark:hover:bg-white/[0.03]"
          }`}
          onClick={() => browseFolder(folderId, folderName)}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Caret button */}
            <button
              type="button"
              onClick={async (e) => {
                e.stopPropagation();
                const newExpanded = !isExpanded;
                setExpandedFolders(prev => ({ ...prev, [folderId]: newExpanded }));
                if (newExpanded) {
                  await fetchSubfolders(folderId);
                }
              }}
              className="p-1 hover:bg-gray-250 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <svg
                className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Folder Icon */}
            <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-500 fill-brand-500" : "text-amber-500 fill-amber-500"}`} viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            </svg>

            {/* Name */}
            <span className="text-xs truncate font-medium">
              {folderName}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-1 border-l border-gray-150/60 dark:border-gray-800/60 ml-4.5 pl-1.5 space-y-0.5">
            {subfolders.length === 0 ? (
              <div className="pl-6 py-1 text-[10px] text-gray-450 dark:text-gray-500 italic">
                Kosong
              </div>
            ) : (
              subfolders.map(sub => renderFolderTree(sub.id, depth + 1))
            )}
          </div>
        )}
      </div>
    );
  };

  // Create folder action
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim() || !activeFolderId) return;

    try {
      setFolderSubmitting(true);
      const res = await fetch("/api/narasumber-hukum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createFolder",
          folderName: newFolderName.trim(),
          parentFolderId: activeFolderId,
        }),
      });

      if (!res.ok) throw new Error("Folder creation failed");
      
      setFolderModalOpen(false);
      setNewFolderName("");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal membuat folder baru.");
    } finally {
      setFolderSubmitting(false);
    }
  };

  // Multi-upload file action
  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0 || !activeFolderId) return;

    try {
      setUploadSubmitting(true);
      const formData = new FormData();
      for (let i = 0; i < selectedFiles.length; i++) {
        formData.append("files", selectedFiles[i]);
      }
      formData.append("folderId", activeFolderId);
      formData.append("fileName", customName.trim());
      formData.append("description", description.trim());
      formData.append("pic", selectedPICs.join(", "));
      formData.append("pt", selectedPT);

      const res = await fetch("/api/narasumber-hukum", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload files failed");

      setUploadModalOpen(false);
      setSelectedFiles(null);
      setCustomName("");
      setDescription("");
      setSelectedPICs([]);
      setSelectedPT("");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal mengunggah berkas.");
    } finally {
      setUploadSubmitting(false);
    }
  };

  // Delete folder from Google Drive
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus folder ini beserta seluruh isinya secara permanen dari Google Drive?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/gdrive/delete?fileId=${folderId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal menghapus folder.");
    } finally {
      setLoading(false);
    }
  };

  // Delete file action
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus berkas ini secara permanen dari database dan Google Drive?")) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/narasumber-hukum?fileId=${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal menghapus berkas.");
    } finally {
      setLoading(false);
    }
  };

  // Edit folder action
  const handleEditFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolderItem || !editFolderName.trim()) return;

    try {
      setEditFolderSubmitting(true);
      const res = await fetch("/api/gdrive", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: editingFolderItem.id,
          newName: editFolderName.trim(),
        }),
      });

      if (!res.ok) throw new Error("Rename failed");
      
      setEditFolderModalOpen(false);
      setEditingFolderItem(null);
      setEditFolderName("");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal mengubah nama folder.");
    } finally {
      setEditFolderSubmitting(false);
    }
  };

  // Edit file action
  const handleEditFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFileItem || !editFileName.trim()) return;

    try {
      setEditFileSubmitting(true);
      const res = await fetch("/api/narasumber-hukum", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: editingFileItem.id,
          newName: editFileName.trim(),
          description: editDescription.trim(),
          pic: selectedPICs.join(", "),
          pt: editPT,
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      
      setEditFileModalOpen(false);
      setEditingFileItem(null);
      setEditFileName("");
      setEditDescription("");
      setSelectedPICs([]);
      setEditPT("");
      await browseFolder(activeFolderId, activeFolderName, false);
    } catch (error) {
      alert("Gagal mengubah berkas.");
    } finally {
      setEditFileSubmitting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return (
        <svg className="w-8 h-8 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      );
    }
    if (mimeType.includes("pdf")) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h1v1H9V9zm0 4h6m-6 4h6" />
        </svg>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes("video")) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    );
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

  const togglePICSelection = (val: string) => {
    if (selectedPICs.includes(val)) {
      setSelectedPICs((prev) => prev.filter((p) => p !== val));
    } else {
      setSelectedPICs((prev) => [...prev, val]);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const searchString = `${emp.name} ${emp.email || ""} ${emp.position}`.toLowerCase();
    return searchString.includes(picSearch.toLowerCase());
  });

  // Filter items by search bar
  const filteredItems = items.filter((item) => {
    const searchString = `${item.name} ${item.customName || ""} ${item.description || ""} ${item.pt || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const recentFiles = (items || [])
    .filter(item => !item.isFolder)
    .sort((a, b) => {
      const timeA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
      const timeB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-stroke dark:border-strokedark">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Manajemen Arsip</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Dokumentasi berkas hukum, legal opinion, somasi, dan surat kontrak diatur secara dinamis per perusahaan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFolderModalOpen(true)}
            className="px-4 py-2 border border-stroke rounded-lg bg-white text-gray-700 hover:border-brand-500 outline-none dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
          >
            + Buat Folder
          </button>
          <button
            onClick={() => {
              setSelectedPICs([]);
              setUploadModalOpen(true);
            }}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 outline-none transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
          >
            + Unggah Berkas
          </button>
        </div>
      </div>

      {/* Main Grid Layout: Left Explorer Tree / Right Files List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Side: Folder Tree Sidebar */}
        <div className="xl:col-span-3 flex flex-col space-y-6">
          {/* Folder Tree Card */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xl p-4 flex flex-col h-[400px]">
            <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500 fill-brand-500" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
              Navigasi Folder
            </h3>
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-1">
              {rootFolderId ? (
                renderFolderTree(rootFolderId)
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-brand-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Files Widget */}
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-xl p-4 flex flex-col h-[280px]">
            <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-gray-800/80 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Dokumen Terbaru
            </h3>
            <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-2.5">
              {recentFilesList.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-gray-450 dark:text-gray-500 text-[10px] italic">
                  Belum ada dokumen terbaru.
                </div>
              ) : (
                recentFilesList.map(file => (
                  <div 
                    key={file.id} 
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => {
                      setSelectedItem(file);
                      setDetailModalOpen(true);
                    }}
                  >
                    <div className="flex-shrink-0">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-black dark:text-white truncate group-hover:text-brand-500 transition-colors">
                        {file.customName || file.name}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium">
                        {formatSize(file.size)} • {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Explorer Content Area */}
        <div className="xl:col-span-9 flex flex-col space-y-6">
          
          {/* SEARCH AND BREADCRUMBS ROW */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
            {/* Navigation Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-gray-450 dark:text-gray-400 uppercase tracking-wider">
              {folderHistory.length > 1 && (
                <button
                  onClick={handleBack}
                  className="mr-2 p-1.5 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <span
                className="cursor-pointer hover:text-brand-500 text-gray-500"
                onClick={() => browseFolder(null, "Arsip Utama", true)}
              >
                DRIVE
              </span>
              {folderHistory.map((hist, idx) => {
                if (idx === 0) return null; // Skip HOME
                return (
                  <React.Fragment key={hist.id}>
                    <span className="text-gray-300 dark:text-gray-700">/</span>
                    <span
                      className={`cursor-pointer hover:text-brand-500 truncate max-w-[120px] ${idx === folderHistory.length - 1 ? "text-brand-500 font-bold" : "text-gray-500"}`}
                      onClick={() => {
                        if (idx === folderHistory.length - 1) return;
                        const newHist = folderHistory.slice(0, idx + 1);
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

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Cari Folder atau Dokumen..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 transition-colors text-xs font-semibold"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* ITEMS LISTING TABLE */}
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-500 fill-brand-500" viewBox="0 0 24 24">
                  <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                </svg>
                {activeFolderName}
              </h3>
              <span className="text-[10px] bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {filteredItems.length} Item
              </span>
            </div>

            {loading ? (
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
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 text-xs text-gray-400 italic bg-white dark:bg-transparent">
                Belum ada berkas atau subfolder di sini. Gunakan tombol diatas untuk mengisi.
              </div>
            ) : (
              <div className="overflow-x-auto text-[13px]">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-405 uppercase tracking-widest bg-gray-50/20 dark:bg-white/[0.01]">
                      <th className="p-4 pl-6">Nama</th>
                      <th className="p-4">PT Asosiasi</th>
                      <th className="p-4">Akses PIC</th>
                      <th className="p-4">Ukuran</th>
                      <th className="p-4">Diunggah</th>
                      <th className="p-4">Terakhir Diubah</th>
                      <th className="p-4">Pemilik</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    {filteredItems.map((item) => {
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                          {/* Name Col */}
                          <td className="p-4 pl-6">
                            <div
                              onClick={() => item.isFolder && browseFolder(item.id, item.name)}
                              className={`flex items-center gap-3 font-semibold text-black dark:text-white ${item.isFolder ? "cursor-pointer hover:text-brand-500" : ""}`}
                            >
                              {getFileIcon(item.mimeType)}
                              <div className="flex flex-col min-w-0">
                                <span className="hover:underline line-clamp-1 text-xs">
                                  {item.customName || item.name}
                                </span>
                                {item.description && (
                                  <span className="text-[10px] text-gray-405 font-medium line-clamp-1 mt-0.5">
                                    {item.description}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* PT Col */}
                          <td className="p-4">
                            {item.pt ? (
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold uppercase text-[9px] tracking-wider rounded-md border border-gray-200/50 dark:border-gray-700/50">
                                {item.pt}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-[10px] font-bold">-</span>
                            )}
                          </td>

                          {/* PIC Access Constraints */}
                          <td className="p-4">
                            {item.pic ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 font-bold uppercase text-[9px] tracking-wider rounded-md border border-red-200/20 dark:border-red-800/20">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Dibatasi
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase text-[9px] tracking-wider rounded-md border border-green-200/20 dark:border-green-800/20">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Publik
                              </span>
                            )}
                          </td>

                          {/* Size Col */}
                          <td className="p-4 font-semibold text-gray-400">
                            {item.isFolder ? "Folder" : formatSize(item.size)}
                          </td>

                          {/* Created At Col */}
                          <td className="p-4 text-gray-400 font-medium">
                            {item.createdTime ? new Date(item.createdTime).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            }) : "-"}
                          </td>

                          {/* Modified At Col */}
                          <td className="p-4 text-gray-400 font-medium">
                            {item.modifiedTime ? new Date(item.modifiedTime).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            }) : "-"}
                          </td>

                          {/* Owner Col */}
                          <td className="p-4 text-gray-400 font-medium truncate max-w-[120px]">
                            {item.owners && item.owners[0] ? item.owners[0].displayName : "-"}
                          </td>

                          {/* Action buttons */}
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {item.isFolder ? (
                                <>
                                  <button
                                    onClick={() => browseFolder(item.id, item.name)}
                                    className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                  >
                                    Buka
                                  </button>
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingFolderItem(item);
                                          setEditFolderName(item.name);
                                          setEditFolderModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                      >
                                        Ubah
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFolder(item.id)}
                                        className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                      >
                                        Hapus
                                      </button>
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => setPreviewItem(item)}
                                    className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                  >
                                    Lihat
                                  </button>
                                  {item.webContentLink && (
                                    <a
                                      href={item.webContentLink}
                                      download
                                      className="px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20 text-[10px] font-black rounded-lg uppercase transition-colors inline-block text-center"
                                    >
                                      Unduh
                                    </a>
                                  )}
                                  {item.webViewLink && (
                                    <button
                                      onClick={() => copyToClipboard(item.webViewLink!)}
                                      className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                    >
                                      Salin Link
                                    </button>
                                  )}
                                  {item.webViewLink && (
                                    <a
                                      href={item.webViewLink}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 text-[10px] font-black rounded-lg uppercase transition-colors inline-block text-center"
                                    >
                                      G-Drive
                                    </a>
                                  )}
                                  {isAdmin && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingFileItem(item);
                                          setEditFileName(item.customName || item.name);
                                          setEditDescription(item.description || "");
                                          setEditPT(item.pt || "");
                                          setSelectedPICs(item.pic ? item.pic.split(",").map((p) => p.trim()).filter(Boolean) : []);
                                          setEditFileModalOpen(true);
                                        }}
                                        className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteFile(item.id)}
                                        className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                                      >
                                        Hapus
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
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
      </div>

      {/* CREATE FOLDER MODAL */}
      <FeatureModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        title="Buat Subfolder Baru"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Folder</label>
            <input
              type="text"
              required
              placeholder="Contoh: Legal Opinion PT A"
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

      {/* EDIT FOLDER MODAL */}
      <FeatureModal
        isOpen={editFolderModalOpen}
        onClose={() => setEditFolderModalOpen(false)}
        title="Ubah Nama Folder"
      >
        <form onSubmit={handleEditFolder} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Folder Baru</label>
            <input
              type="text"
              required
              placeholder="Masukkan nama folder baru..."
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditFolderModalOpen(false)}
              className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editFolderSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50"
            >
              {editFolderSubmitting ? "Menyimpan..." : "Simpan Nama"}
            </button>
          </div>
        </form>
      </FeatureModal>

      {/* UPLOAD FILE MODAL */}
      <FeatureModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Unggah Berkas Baru ke Google Drive"
      >
        <form onSubmit={handleUploadFiles} className="space-y-4 pt-2">
          {/* File input (multi-upload!) */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih Berkas (Multi-upload didukung)</label>
            <input
              type="file"
              required
              multiple
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-stroke dark:file:border-strokedark file:text-xs file:font-black file:uppercase file:bg-white dark:file:bg-gray-900 dark:file:text-white hover:file:bg-gray-50 file:cursor-pointer"
              onChange={(e) => setSelectedFiles(e.target.files)}
            />
          </div>

          {/* Custom Name (only active if single file) */}
          {selectedFiles && selectedFiles.length === 1 && (
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Berkas Kustom (Opsional)</label>
              <input
                type="text"
                placeholder="Kosongkan untuk menggunakan nama asli file"
                className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Ringkasan</label>
            <textarea
              placeholder="Deskripsi singkat mengenai isi dokumen"
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* PT/Company Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">PT / Klien Asosiasi (Opsional)</label>
            <select
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-black uppercase"
              value={selectedPT}
              onChange={(e) => setSelectedPT(e.target.value)}
            >
              <option value="">-- Pilih PT Asosiasi --</option>
              {ptList.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          {/* Interactive Karyawan PIC Dropdown Selector */}
          <div className="relative" ref={picDropdownRef}>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih PIC Keamanan Akses (Opsional)</label>
            
            {/* selected tags list */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedPICs.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic">Bersifat publik (dapat dilihat oleh semua staf)</span>
              ) : (
                selectedPICs.map((picEmail) => {
                  const empObj = employees.find((e) => e.email === picEmail || e.name === picEmail);
                  return (
                    <span key={picEmail} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 font-bold text-[10px] rounded-none">
                      {empObj ? `${empObj.name}` : picEmail}
                      <button
                        type="button"
                        onClick={() => togglePICSelection(picEmail)}
                        className="text-red-500 hover:text-red-700 font-black cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setPicDropdownOpen(!picDropdownOpen)}
              className="w-full px-4 py-2 text-left border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 outline-none transition-colors text-xs font-black uppercase tracking-wider flex justify-between items-center cursor-pointer"
            >
              <span>{picDropdownOpen ? "Tutup Menu PIC" : "Pilih Karyawan PIC..."}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {picDropdownOpen && (
              <div className="absolute z-[999] left-0 right-0 mt-1 bg-white dark:bg-gray-950 border border-stroke dark:border-strokedark shadow-xl max-h-56 overflow-y-auto p-2 space-y-2 rounded-none">
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  className="w-full px-3 py-1.5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-gray-700 dark:text-white outline-none focus:border-brand-500 text-xs font-semibold"
                  value={picSearch}
                  onChange={(e) => setPicSearch(e.target.value)}
                />
                <div className="divide-y divide-stroke dark:divide-strokedark max-h-40 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-gray-400 italic">Tidak ada karyawan ditemukan</div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const identifier = emp.email || emp.name;
                      const isSelected = selectedPICs.includes(identifier);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => togglePICSelection(identifier)}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-black dark:text-white uppercase">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{emp.position} | {emp.email || "No Email"}</span>
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-brand-500 fill-brand-500" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5 italic leading-tight">
              * Jika dibatasi, hanya karyawan terpilih dan Administrator yang memiliki hak akses untuk membuka berkas ini.
            </p>
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
              disabled={uploadSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50"
            >
              {uploadSubmitting ? "Mengunggah..." : "Unggah Berkas"}
            </button>
          </div>
        </form>
      </FeatureModal>

      {/* EDIT FILE MODAL */}
      <FeatureModal
        isOpen={editFileModalOpen}
        onClose={() => setEditFileModalOpen(false)}
        title="Ubah Berkas Hukum & Akses Keamanan"
      >
        <form onSubmit={handleEditFile} className="space-y-4 pt-2">
          {/* File Name */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Berkas</label>
            <input
              type="text"
              required
              placeholder="Masukkan nama berkas baru..."
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold"
              value={editFileName}
              onChange={(e) => setEditFileName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Ringkasan</label>
            <textarea
              placeholder="Deskripsi singkat mengenai isi dokumen..."
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-semibold h-20 resize-none"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          {/* PT/Company Selection */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">PT / Klien Asosiasi (Opsional)</label>
            <select
              className="w-full px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer text-xs font-black uppercase"
              value={editPT}
              onChange={(e) => setEditPT(e.target.value)}
            >
              <option value="">-- Pilih PT Asosiasi --</option>
              {ptList.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          {/* Interactive Karyawan PIC Dropdown Selector */}
          <div className="relative" ref={picDropdownRef}>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih PIC Keamanan Akses (Opsional)</label>
            
            {/* selected tags list */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedPICs.length === 0 ? (
                <span className="text-[11px] text-gray-400 italic">Bersifat publik (dapat dilihat oleh semua staf)</span>
              ) : (
                selectedPICs.map((picEmail) => {
                  const empObj = employees.find((e) => e.email === picEmail || e.name === picEmail);
                  return (
                    <span key={picEmail} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 font-bold text-[10px] rounded-none">
                      {empObj ? `${empObj.name}` : picEmail}
                      <button
                        type="button"
                        onClick={() => togglePICSelection(picEmail)}
                        className="text-red-500 hover:text-red-700 font-black cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => setPicDropdownOpen(!picDropdownOpen)}
              className="w-full px-4 py-2 text-left border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 outline-none transition-colors text-xs font-black uppercase tracking-wider flex justify-between items-center cursor-pointer"
            >
              <span>{picDropdownOpen ? "Tutup Menu PIC" : "Pilih Karyawan PIC..."}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {picDropdownOpen && (
              <div className="absolute z-[999] left-0 right-0 mt-1 bg-white dark:bg-gray-955 border border-stroke dark:border-strokedark shadow-xl max-h-56 overflow-y-auto p-2 space-y-2 rounded-none">
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  className="w-full px-3 py-1.5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-gray-700 dark:text-white outline-none focus:border-brand-500 text-xs font-semibold"
                  value={picSearch}
                  onChange={(e) => setPicSearch(e.target.value)}
                />
                <div className="divide-y divide-stroke dark:divide-strokedark max-h-40 overflow-y-auto">
                  {filteredEmployees.length === 0 ? (
                    <div className="text-center py-4 text-[11px] text-gray-400 italic">Tidak ada karyawan ditemukan</div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const identifier = emp.email || emp.name;
                      const isSelected = selectedPICs.includes(identifier);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => togglePICSelection(identifier)}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-900/50 cursor-pointer transition-colors"
                        >
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-black dark:text-white uppercase">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">{emp.position} | {emp.email || "No Email"}</span>
                          </div>
                          {isSelected && (
                            <svg className="w-4 h-4 text-brand-500 fill-brand-500" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-1.5 italic leading-tight">
              * Perubahan hak akses keamanan PIC akan langsung aktif untuk semua staf setelah disimpan.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditFileModalOpen(false)}
              className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editFileSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50"
            >
              {editFileSubmitting ? "Menyimpan..." : "Simpan Berkas"}
            </button>
          </div>
        </form>
      </FeatureModal>

      {/* DETAIL MODAL */}
      <FeatureModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Rincian Berkas Hukum"
      >
        {selectedItem && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3 pb-3 border-b border-stroke dark:border-strokedark">
              {getFileIcon(selectedItem.mimeType)}
              <div>
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                  {selectedItem.customName || selectedItem.name}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                  Format: {selectedItem.mimeType.split("/")[1] || "Berkas"} | Ukuran: {formatSize(selectedItem.size)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan / Deskripsi</span>
                <span className="block font-semibold text-black dark:text-white mt-1">
                  {selectedItem.description || "Tidak ada keterangan."}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">PT Klien Asosiasi</span>
                <span className="block font-semibold mt-1">
                  {selectedItem.pt ? (
                    <span className="px-2 py-0.5 bg-gray-150 dark:bg-gray-800 text-black dark:text-white font-black uppercase text-[9px] tracking-wider rounded-none">
                      {selectedItem.pt}
                    </span>
                  ) : (
                    "Tidak terikat PT."
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Hak Akses PIC</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedItem.pic ? (
                    selectedItem.pic.split(",").map((pId) => {
                      const cleaned = pId.trim();
                      const empObj = employees.find((e) => e.email === cleaned || e.name === cleaned);
                      return (
                        <span key={cleaned} className="px-2 py-0.5 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 font-bold text-[10px] rounded-none w-max block">
                          {empObj ? empObj.name : cleaned}
                        </span>
                      );
                    })
                  ) : (
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 font-black uppercase text-[9px] tracking-wider rounded-none">
                      Publik (Semua Staf)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Tanggal Diunggah</span>
                <span className="block font-semibold text-black dark:text-white mt-1">
                  {selectedItem.createdTime ? new Date(selectedItem.createdTime).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "-"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-stroke rounded-none text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {selectedItem.webViewLink && (
                <a
                  href={selectedItem.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-500 text-white rounded-none hover:bg-brand-600 text-xs font-black uppercase transition-colors inline-block cursor-pointer text-center"
                >
                  Buka Berkas Google Drive
                </a>
              )}
            </div>
          </div>
        )}
      </FeatureModal>

      {/* GDRIVE PREVIEW MODAL */}
      {previewItem && (
        <FeatureModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={`Pratinjau Berkas: ${previewItem.customName || previewItem.name}`}
        >
          <div className="space-y-4 pt-2">
            <div className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center min-h-[300px]">
              {previewItem.mimeType.includes("pdf") || 
               previewItem.mimeType.includes("image") || 
               previewItem.mimeType.includes("video") ? (
                <iframe
                  src={`https://drive.google.com/file/d/${previewItem.id}/preview`}
                  className="w-full h-[500px] border-none rounded-xl"
                  allow="autoplay"
                ></iframe>
              ) : (
                <div className="p-8 text-center space-y-4">
                  <svg className="w-16 h-16 text-brand-500 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{previewItem.customName || previewItem.name}</h4>
                    <p className="text-xs text-gray-400 mt-1">Ekstensi/Jenis file ini memerlukan aplikasi eksternal untuk dibuka secara interaktif. Berikut rincian metadatanya:</p>
                  </div>
                  <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-xl p-4 text-left grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-450 font-bold uppercase tracking-widest">Ukuran</span>
                      <span className="block font-bold text-black dark:text-white mt-0.5">{formatSize(previewItem.size)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-455 font-bold uppercase tracking-widest">Jenis Berkas</span>
                      <span className="block font-bold text-black dark:text-white mt-0.5 uppercase">{previewItem.mimeType.split("/")[1] || "Dokumen"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-450 font-bold uppercase tracking-widest">Dibuat Pada</span>
                      <span className="block font-bold text-black dark:text-white mt-0.5">{previewItem.createdTime ? new Date(previewItem.createdTime).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-450 font-bold uppercase tracking-widest">Terakhir Diubah</span>
                      <span className="block font-bold text-black dark:text-white mt-0.5">{previewItem.modifiedTime ? new Date(previewItem.modifiedTime).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}</span>
                    </div>
                    {previewItem.owners && previewItem.owners[0] && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-gray-450 font-bold uppercase tracking-widest">Pemilik</span>
                        <span className="block font-bold text-black dark:text-white mt-0.5">{previewItem.owners[0].displayName}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-stroke dark:border-strokedark">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 border border-stroke rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:border-strokedark dark:text-gray-300 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {previewItem.webViewLink && (
                <a
                  href={previewItem.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors inline-block cursor-pointer text-center"
                >
                  Buka di Google Drive
                </a>
              )}
            </div>
          </div>
        </FeatureModal>
      )}
    </div>
  );
}
