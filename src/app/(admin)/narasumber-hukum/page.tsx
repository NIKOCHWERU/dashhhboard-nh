"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { APP_LABELS } from "@/config/app-labels";
import PicSelect from "@/components/common/PicSelect";

interface GDriveItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
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
  const [activeFolderName, setActiveFolderName] = useState<string>("Arsip");
  const [folderHistory, setFolderHistory] = useState<{ id: string; name: string }[]>([]);
  
  const [items, setItems] = useState<GDriveItem[]>([]);
  const [ptList, setPtList] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // GDrive storage state
  const [storageInfo, setStorageInfo] = useState<{
    connected: boolean;
    user?: { displayName: string; emailAddress: string };
    storageQuota?: { limit: string; usage: string };
    error?: string;
  } | null>(null);
  const [checkingStorage, setCheckingStorage] = useState(false);

  // Active Dropdown menu for grid items
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const [users, setUsers] = useState<any[]>([]);

  const usersForPicSelect = employees.map(emp => {
    const userMatch = users.find(u => u.email === emp.email);
    return {
      id: emp.id,
      name: emp.name,
      email: emp.email,
      image: userMatch?.image || null,
      position: emp.position
    };
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GDriveItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GDriveItem | null>(null);

  // Subfolder tree & activity states
  const [treeData, setTreeData] = useState<Record<string, GDriveItem[]>>({});
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [recentDrafts, setRecentDrafts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Right sidebar layout states
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<"activity" | "details">("activity");

  // Fetch initial data
  useEffect(() => {
    fetchPTs();
    fetchEmployees();
    fetchUsers();
    browseFolder(null, "Arsip", true);
    fetchStorageInfo();
    fetchRecentDrafts();
    fetchRecentActivities();
  }, []);

  // Handle click outside PIC dropdown and Grid Item options menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (picDropdownRef.current && !picDropdownRef.current.contains(event.target as Node)) {
        setPicDropdownOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchStorageInfo = async () => {
    try {
      setCheckingStorage(true);
      const res = await fetch("/api/gdrive/storage");
      if (res.ok) {
        const data = await res.json();
        setStorageInfo(data);
      }
    } catch (err) {
      console.error("Failed to check storage status:", err);
    } finally {
      setCheckingStorage(false);
    }
  };

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

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentDrafts = async () => {
    try {
      const res = await fetch("/api/narasumber-hukum?recent=true");
      if (res.ok) {
        const data = await res.json();
        setRecentDrafts(data || []);
      }
    } catch (e) {
      console.error("Failed to fetch recent drafts:", e);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      const res = await fetch("/api/admin/activities");
      if (res.ok) {
        const data = await res.json();
        setRecentActivities(data.slice(0, 5) || []);
      }
    } catch (e) {
      console.error("Failed to fetch recent activities:", e);
    }
  };

  const toggleFolderNode = async (folderId: string, folderName: string) => {
    const isExpanded = expandedFolders[folderId];
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !isExpanded }));

    if (!isExpanded && !treeData[folderId]) {
      try {
        const res = await fetch(`/api/narasumber-hukum?folderId=${folderId}`);
        if (res.ok) {
          const data = await res.json();
          const subfolders = (data.items || []).filter((item: GDriveItem) => item.isFolder);
          setTreeData((prev) => ({ ...prev, [folderId]: subfolders }));
        }
      } catch (e) {
        console.error("Failed to load subfolder nodes:", e);
      }
    }
  };

  const renderFolderTree = (parentId: string, level: number = 0) => {
    const subfolders = treeData[parentId] || [];
    return (
      <div className={`space-y-1 ${level > 0 ? "ml-4 pl-2 border-l border-gray-150 dark:border-gray-800" : ""}`}>
        {subfolders.map((folder) => {
          const isExpanded = expandedFolders[folder.id];
          const isActive = activeFolderId === folder.id;

          return (
            <div key={folder.id} className="space-y-1">
              <div 
                className={`group/node flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold select-none transition-all cursor-pointer ${
                  isActive 
                    ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 font-bold" 
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
                onClick={() => {
                  browseFolder(folder.id, folder.name);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Expand/Collapse Chevron */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderNode(folder.id, folder.name);
                    }}
                    className="p-1 -ml-1 text-gray-400 hover:text-gray-600 rounded-md transition-transform"
                  >
                    <svg 
                      className={`w-3 h-3 transform transition-transform ${isExpanded ? "rotate-90" : ""}`} 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>

                  {/* Folder Icon */}
                  <svg className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-brand-500" : "text-gray-400 dark:text-gray-500"}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.382l-.528-1.056A3 3 0 0 0 8.418 3H4.5A3 3 0 0 0 1.5 6v12a3 3 0 0 0 3 3h15z" />
                  </svg>

                  {/* Folder Name */}
                  <span className="truncate">{folder.name}</span>
                </div>

                {/* Inline Action Buttons (visible on hover) */}
                {isAdmin && storageInfo?.connected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewFolderName("");
                      setActiveFolderId(folder.id);
                      setFolderModalOpen(true);
                    }}
                    className="opacity-0 group-hover/node:opacity-100 p-0.5 text-gray-400 hover:text-brand-500 hover:bg-white dark:hover:bg-gray-800 rounded transition-all cursor-pointer"
                    title="Tambah Subfolder"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Subfolders container */}
              {isExpanded && renderFolderTree(folder.id, level + 1)}
            </div>
          );
        })}
      </div>
    );
  };

  const browseFolder = async (folderId: string | null, folderName: string, pushHistory = true) => {
    try {
      setLoading(true);
      setActiveMenuId(null);
      setSelectedItem(null);
      
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

      if (data.folderId) {
        const subfolders = (data.items || []).filter((item: GDriveItem) => item.isFolder);
        setTreeData((prev) => ({ ...prev, [data.folderId]: subfolders }));
      }

      if (pushHistory) {
        if (folderId === null) {
          setFolderHistory([{ id: data.folderId, name: "Arsip" }]);
        } else {
          setFolderHistory((prev) => [...prev, { id: folderId, name: folderName }]);
        }
      }
    } catch (error) {
      console.error(error);
      alert(APP_LABELS.narasumberHukum.alerts.gdriveConnectFailed);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(APP_LABELS.narasumberHukum.alerts.clipboardSuccess);
    setActiveMenuId(null);
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
    newHistory.pop();
    const parentFolder = newHistory[newHistory.length - 1];
    setFolderHistory(newHistory);
    if (newHistory.length === 1) {
      browseFolder(null, "Arsip", false);
    } else {
      browseFolder(parentFolder.id, parentFolder.name, false);
    }
  };

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
      alert(APP_LABELS.narasumberHukum.alerts.createFolderFailed);
    } finally {
      setFolderSubmitting(false);
    }
  };

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
      fetchStorageInfo();
    } catch (error) {
      alert(APP_LABELS.narasumberHukum.alerts.uploadFailed);
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm(APP_LABELS.narasumberHukum.alerts.deleteFolderConfirm)) return;

    try {
      setLoading(true);
      setActiveMenuId(null);
      const res = await fetch(`/api/gdrive/delete?fileId=${folderId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
      fetchStorageInfo();
    } catch (error) {
      alert(APP_LABELS.narasumberHukum.alerts.deleteFolderFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm(APP_LABELS.narasumberHukum.alerts.deleteFileConfirm)) return;

    try {
      setLoading(true);
      setActiveMenuId(null);
      const res = await fetch(`/api/narasumber-hukum?fileId=${fileId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");
      await browseFolder(activeFolderId, activeFolderName, false);
      fetchStorageInfo();
    } catch (error) {
      alert(APP_LABELS.narasumberHukum.alerts.deleteFileFailed);
    } finally {
      setLoading(false);
    }
  };

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
      alert(APP_LABELS.narasumberHukum.alerts.editFolderFailed);
    } finally {
      setEditFolderSubmitting(false);
    }
  };

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
      alert(APP_LABELS.narasumberHukum.alerts.editFileFailed);
    } finally {
      setEditFileSubmitting(false);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/vnd.google-apps.folder") {
      return (
        <svg className="w-10 h-10 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
          <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      );
    }
    if (mimeType.includes("pdf")) {
      return (
        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes("image")) {
      return (
        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
      return (
        <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    if (mimeType.includes("word") || mimeType.includes("document")) {
      return (
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

  const folders = items.filter(item => item.isFolder);
  const files = items.filter(item => !item.isFolder);

  const filteredFolders = folders.filter(item => {
    const q = searchTerm.toLowerCase();
    return item.name.toLowerCase().includes(q) || (item.pt && item.pt.toLowerCase().includes(q));
  });

  const filteredFiles = files.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) || 
      (item.customName && item.customName.toLowerCase().includes(q)) || 
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.pt && item.pt.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Manajemen Arsip</h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Dokumentasi berkas hukum, somasi, dan surat kontrak diatur secara dinamis dan aman.
          </p>
        </div>
      </div>

      {/* THREE COLUMN EXPLORER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Subfolder Hierarchy & Storage Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* STORAGE INFO CARD */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-450 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.382l-.528-1.056A3 3 0 0 0 8.418 3H4.5A3 3 0 0 0 1.5 6v12a3 3 0 0 0 3 3h15z" />
                </svg>
                Google Drive
              </span>
              {checkingStorage ? (
                <span className="animate-pulse text-[8px] text-gray-400 font-bold uppercase">Memeriksa...</span>
              ) : storageInfo?.connected ? (
                <span className="text-[8px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 py-0.5 rounded dark:text-emerald-400 uppercase tracking-wider">Terhubung</span>
              ) : (
                <span className="text-[8px] bg-red-500/10 text-red-600 font-bold px-1.5 py-0.5 rounded dark:text-red-400 uppercase tracking-wider">Terputus</span>
              )}
            </div>

            {storageInfo?.connected && storageInfo.storageQuota ? (() => {
              const limit = parseInt(storageInfo.storageQuota.limit);
              const usage = parseInt(storageInfo.storageQuota.usage);
              const remaining = limit - usage;
              const percent = Math.min(100, Math.round((usage / limit) * 100)) || 0;
              
              const formatSizeLocal = (bytes: number) => {
                if (bytes === 0) return "0 B";
                const k = 1024;
                const sizes = ["B", "KB", "MB", "GB", "TB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
              };

              return (
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-gray-150 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                       className={`h-full rounded-full transition-all duration-500 ${
                        percent > 85 ? "bg-red-500" : percent > 60 ? "bg-amber-500" : "bg-brand-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>{percent}% Terpakai</span>
                    <span>Sisa {formatSizeLocal(remaining)}</span>
                  </div>
                  {storageInfo.user && (
                    <p className="text-[9px] text-gray-400 truncate border-t border-gray-100 dark:border-gray-800/60 pt-1.5 mt-1 font-semibold" title={storageInfo.user.emailAddress}>
                      Akun: {storageInfo.user.emailAddress}
                    </p>
                  )}
                </div>
              );
            })() : (
              <a
                href="/api/gdrive/auth"
                className="px-3 py-2 bg-brand-500 hover:bg-brand-600 text-white text-[9px] font-black uppercase rounded-lg tracking-widest transition-all text-center w-full block cursor-pointer"
              >
                Hubungkan Drive
              </a>
            )}
          </div>

          {/* FOLDER TREE CARD */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-150 dark:border-gray-800">
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider font-bold">Subfolder Hierarki</h3>
              {isAdmin && storageInfo?.connected && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderName("");
                    setActiveFolderId("1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq"); // Create folder at root
                    setFolderModalOpen(true);
                  }}
                  className="p-1 text-gray-400 hover:text-brand-500 rounded-md transition-colors cursor-pointer"
                  title="Create New Folder"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* FOLDER TREE HEADER BANNER (Clickable to go back to root) */}
            <div 
              onClick={() => browseFolder(null, "Arsip")}
              className={`px-3 py-2.5 bg-gray-100 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700/50 rounded-xl text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all ${
                activeFolderId === null || activeFolderId === "1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq"
                  ? "border border-brand-500/30 text-brand-600 dark:text-brand-400"
                  : ""
              }`}
            >
              <svg className="w-3.5 h-3.5 text-brand-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V9a3 3 0 0 0-3-3h-3.382l-.528-1.056A3 3 0 0 0 8.418 3H4.5A3 3 0 0 0 1.5 6v12a3 3 0 0 0 3 3h15z" />
              </svg>
              <span>Folder Tree</span>
            </div>

            <div className="max-h-[500px] overflow-y-auto custom-scrollbar pt-2">
              {storageInfo?.connected ? (
                <div className="space-y-1">
                  {/* Render root folders tree recursively */}
                  {renderFolderTree("1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq")}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 italic">Google Drive terputus.</p>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: Main Explorer (Dynamic grid span) */}
        <div className={`${isRightPanelOpen ? "lg:col-span-6" : "lg:col-span-9"} space-y-6`}>
          {/* SEARCH AND TOOLBAR SECTION */}
          <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm space-y-4">
            {/* Navigation Breadcrumbs & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/60 pb-3">
              {/* Navigation Breadcrumbs */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-black text-gray-450 dark:text-gray-400 uppercase tracking-wider">
                {folderHistory.length > 1 && (
                  <button
                    onClick={handleBack}
                    className="mr-2 p-1.5 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-605 dark:text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                )}
                <span
                  className="cursor-pointer hover:text-brand-500 text-gray-500"
                  onClick={() => browseFolder(null, "Arsip", true)}
                >
                  Arsip
                </span>
                {folderHistory.map((hist, idx) => {
                  if (idx === 0) return null; // Skip HOME
                  return (
                    <React.Fragment key={hist.id}>
                      <span className="text-gray-300 dark:text-gray-700">/</span>
                      <span
                        className={`cursor-pointer hover:text-brand-500 truncate max-w-[150px] ${idx === folderHistory.length - 1 ? "text-brand-500 font-bold" : "text-gray-500"}`}
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

              {/* Control Buttons */}
              <div className="flex items-center gap-2">
                {/* Toggle Right Panel Button */}
                <button
                  onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                  className={`p-2 border rounded-xl transition-all cursor-pointer ${
                    isRightPanelOpen 
                      ? "border-brand-500/30 bg-brand-500/10 text-brand-500 shadow-sm" 
                      : "border-gray-250 dark:border-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                  title={isRightPanelOpen ? "Tutup Panel Rincian & Aktivitas" : "Buka Panel Rincian & Aktivitas"}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.854l-.018.04A2.25 2.25 0 0012 17h.25m-2.25-3H12m0-6.75H12.008v.008H12V7.25zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {/* Toggle View Mode */}
                <div className="flex border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden p-0.5 bg-gray-50 dark:bg-gray-950 flex-shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 transition-colors cursor-pointer rounded-lg ${viewMode === "grid" ? "bg-white dark:bg-gray-800 text-brand-500 shadow-sm" : "text-gray-400 hover:text-gray-650"}`}
                    title="Grid View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 transition-colors cursor-pointer rounded-lg ${viewMode === "list" ? "bg-white dark:bg-gray-800 text-brand-500 shadow-sm" : "text-gray-400 hover:text-gray-650"}`}
                    title="List View"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input and Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="relative w-full sm:flex-1">
                <input
                  type="text"
                  placeholder="Cari nama, keterangan, PT..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors text-xs font-semibold"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="flex w-full sm:w-auto gap-2">
                <button
                  onClick={() => {
                    if (!storageInfo?.connected) {
                      alert("Google Drive terputus. Silakan hubungkan kembali akun Google Drive Anda terlebih dahulu.");
                      return;
                    }
                    setFolderModalOpen(true);
                  }}
                  disabled={!storageInfo?.connected}
                  className={`flex-1 sm:flex-none px-4 py-2 border border-gray-250 dark:border-gray-850 bg-white text-gray-700 hover:border-brand-500 outline-none dark:bg-gray-900 dark:text-white transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider rounded-xl shadow-sm ${
                    !storageInfo?.connected ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  + Folder
                </button>
                <button
                  onClick={() => {
                    if (!storageInfo?.connected) {
                      alert("Google Drive terputus. Silakan hubungkan kembali akun Google Drive Anda terlebih dahulu.");
                      return;
                    }
                    setSelectedPICs([]);
                    setUploadModalOpen(true);
                  }}
                  disabled={!storageInfo?.connected}
                  className={`flex-1 sm:flex-none px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 outline-none transition-colors cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-500/10 ${
                    !storageInfo?.connected ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  + Berkas
                </button>
              </div>
            </div>
          </div>

          {/* QUICK ACCESS / RECENT DRAFTS SECTION */}
          {recentDrafts.length > 0 && (activeFolderId === null || activeFolderId === "1mIfFQSMviTEO8wCm8YXWAMKLMjA1jRoq") && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">AKSES CEPAT (DRAFTS TERBARU)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {recentDrafts.map((draft) => (
                  <div 
                    key={draft.id} 
                    className="group flex items-center justify-between p-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] hover:border-brand-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      if (draft.webViewLink) {
                        window.open(draft.webViewLink, "_blank");
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0">
                        {getFileIcon(draft.mimeType || "application/pdf")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate" title={draft.fileName || draft.name}>
                          {draft.fileName || draft.name}
                        </p>
                        <p className="text-[9px] text-gray-450 font-medium mt-0.5">
                          {draft.size ? formatSize(draft.size) : "0 B"} • {draft.createdTime ? new Date(draft.createdTime).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                        </p>
                      </div>
                    </div>
                    <div className="p-1.5 rounded-xl bg-gray-55 dark:bg-gray-800/40 text-gray-450 hover:text-brand-500 group-hover:bg-brand-500/10 group-hover:text-brand-500 transition-colors ml-2 flex-shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXPLORER AREA */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-4 rounded-2xl flex flex-col justify-between h-36 animate-pulse">
              <div className="w-10 h-10 rounded bg-gray-150 dark:bg-gray-800"></div>
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-150 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-2 bg-gray-150 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : !storageInfo?.connected ? (
        <div className="text-center py-16 px-6 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-2xl">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="max-w-md">
            <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Koneksi Google Drive Terputus</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Sistem tidak dapat terhubung ke Google Drive Anda. Silakan hubungkan kembali akun Google Drive perusahaan terlebih dahulu menggunakan tombol di atas untuk mengakses dan mengelola berkas arsip.
            </p>
          </div>
          <a
            href="/api/gdrive/auth"
            className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-[10px] font-black uppercase rounded-xl tracking-widest transition-all shadow-sm shadow-brand-500/10 cursor-pointer"
          >
            Hubungkan Google Drive Sekarang
          </a>
        </div>
      ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
        <div className="text-center py-24 text-xs text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl">
          Folder ini kosong. Gunakan tombol diatas untuk membuat subfolder atau mengunggah berkas baru.
        </div>
      ) : viewMode === "grid" ? (
        <div className="space-y-6">
          {/* FOLDERS GRID */}
          {filteredFolders.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">SUBFOLDER ({filteredFolders.length})</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFolders.map((folder) => (
                  <div
                    key={folder.id}
                    onClick={() => browseFolder(folder.id, folder.name)}
                    className="group border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] p-4 rounded-2xl hover:border-brand-500 hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(folder.mimeType)}
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-gray-900 dark:text-white truncate" title={folder.name}>
                          {folder.name}
                        </h5>
                        {folder.pt && (
                          <span className="text-[8px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                            {folder.pt}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Folder dropdown menu */}
                    {isAdmin && (
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === folder.id ? null : folder.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          ⋮
                        </button>
                        {activeMenuId === folder.id && (
                          <div ref={menuRef} className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 z-50 text-[11px] font-bold">
                            <button
                              onClick={() => {
                                setEditingFolderItem(folder);
                                setEditFolderName(folder.name);
                                setEditFolderModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 text-amber-600 cursor-pointer"
                            >
                              Ubah Nama
                            </button>
                            <button
                              onClick={() => handleDeleteFolder(folder.id)}
                              className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 text-red-600 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILES GRID */}
          {filteredFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">BERKAS ({filteredFiles.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map((file) => {
                  const hasThumb = !!file.thumbnailLink;
                  const thumbSrc = file.thumbnailLink?.replace(/=s\d+$/, "=s320");
                  
                  return (
                    <div
                      key={file.id}
                      onClick={() => {
                        setSelectedItem(file);
                        setPreviewItem(file);
                      }}
                      className={`group border bg-white dark:bg-white/[0.02] rounded-2xl hover:border-brand-500 hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden cursor-pointer select-none ${
                        selectedItem?.id === file.id ? "border-brand-500 shadow-md ring-2 ring-brand-500/10" : "border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {/* Image Thumbnail or File Icon */}
                      <div className="flex-1 min-h-[110px] flex items-center justify-center bg-gray-50/50 dark:bg-white/[0.01] border-b border-gray-100 dark:border-gray-800/60 p-4 relative">
                        {hasThumb ? (
                          <img
                            src={thumbSrc}
                            alt={file.name}
                            className="max-h-[90px] max-w-full object-contain rounded transition-transform group-hover:scale-105 duration-300"
                            loading="lazy"
                          />
                        ) : (
                          getFileIcon(file.mimeType)
                        )}

                        {/* Restricted / Public tag indicator */}
                        <div className="absolute top-2 left-2">
                          {file.pic ? (
                            <span className="p-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-md block" title="Akses Terbatas">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="p-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-md block" title="Akses Publik">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content Info */}
                      <div className="p-3 space-y-1 bg-white dark:bg-transparent relative">
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <h5 className="text-[11px] font-bold text-gray-900 dark:text-white truncate" title={file.customName || file.name}>
                              {file.customName || file.name}
                            </h5>
                            <p className="text-[9px] text-gray-400 font-semibold">
                              {formatSize(file.size)}
                            </p>
                          </div>

                          {/* Options menu */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === file.id ? null : file.id)}
                              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                            >
                              ⋮
                            </button>
                            {activeMenuId === file.id && (
                              <div ref={menuRef} className="absolute right-0 bottom-full mb-1 w-32 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl py-1 z-50 text-[10px] font-bold">
                                <button
                                  onClick={() => {
                                    setSelectedItem(file);
                                    setRightPanelTab("details");
                                    setIsRightPanelOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                                >
                                  Metadata Detail
                                </button>
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 block cursor-pointer"
                                  >
                                    Buka G-Drive
                                  </a>
                                )}
                                {file.webContentLink && (
                                  <a
                                    href={file.webContentLink}
                                    download
                                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 block cursor-pointer text-emerald-600"
                                  >
                                    Unduh File
                                  </a>
                                )}
                                {file.webViewLink && (
                                  <button
                                    onClick={() => copyToClipboard(file.webViewLink!)}
                                    className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 text-blue-600 cursor-pointer"
                                  >
                                    Salin Link
                                  </button>
                                )}
                                {isAdmin && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingFileItem(file);
                                        setEditFileName(file.customName || file.name);
                                        setEditDescription(file.description || "");
                                        setEditPT(file.pt || "");
                                        setSelectedPICs(file.pic ? file.pic.split(",").map((p) => p.trim()).filter(Boolean) : []);
                                        setEditFileModalOpen(true);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 text-amber-600 cursor-pointer"
                                    >
                                      Edit Metadata
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(file.id)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-900 text-red-650 cursor-pointer"
                                    >
                                      Hapus
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* PT Indicator */}
                        {file.pt && (
                          <span className="text-[7.5px] bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold px-1 py-0.5 rounded uppercase inline-block">
                            {file.pt}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW TABLE */
        <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/20 dark:bg-white/[0.01]">
                  <th className="p-4 pl-6">Nama</th>
                  <th className="p-4">PT Asosiasi</th>
                  <th className="p-4">Akses PIC</th>
                  <th className="p-4">Ukuran</th>
                  <th className="p-4">Tanggal Diunggah</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                {/* Folders first */}
                {filteredFolders.map((folder) => (
                  <tr key={folder.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <div
                        onClick={() => browseFolder(folder.id, folder.name)}
                        className="flex items-center gap-3 font-semibold text-black dark:text-white cursor-pointer hover:text-brand-500"
                      >
                        {getFileIcon(folder.mimeType)}
                        <span className="hover:underline truncate max-w-[250px]">{folder.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {folder.pt ? (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 font-bold uppercase text-[9px] tracking-wider rounded border border-gray-200 dark:border-gray-800">
                          {folder.pt}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase text-[9px] tracking-wider rounded">Publik</span>
                    </td>
                    <td className="p-4 font-semibold text-gray-400">Folder</td>
                    <td className="p-4 text-gray-400 font-medium">-</td>
                    <td className="p-4 pr-6 text-right space-x-2">
                      <button
                        onClick={() => browseFolder(folder.id, folder.name)}
                        className="px-2.5 py-1 bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                      >
                        Buka
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingFolderItem(folder);
                              setEditFolderName(folder.name);
                              setEditFolderModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => handleDeleteFolder(folder.id)}
                            className="px-2.5 py-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {/* Files next */}
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 pl-6">
                      <div
                        onClick={() => {
                          setSelectedItem(file);
                          setPreviewItem(file);
                        }}
                        className="flex items-center gap-3 font-semibold text-black dark:text-white cursor-pointer hover:text-brand-500"
                      >
                        {getFileIcon(file.mimeType)}
                        <div className="flex flex-col min-w-0">
                          <span className="hover:underline truncate max-w-[250px]">{file.customName || file.name}</span>
                          {file.description && (
                            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]" title={file.description}>
                              {file.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {file.pt ? (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-850 text-gray-600 dark:text-gray-400 font-bold uppercase text-[9px] tracking-wider rounded border border-gray-200 dark:border-gray-800">
                          {file.pt}
                        </span>
                      ) : "-"}
                    </td>
                    <td className="p-4">
                      {file.pic ? (
                        <span className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 font-bold uppercase text-[9px] tracking-wider rounded border border-red-500/20">Dibatasi</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 font-bold uppercase text-[9px] tracking-wider rounded border border-green-500/20">Publik</span>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-gray-400">{formatSize(file.size)}</td>
                    <td className="p-4 text-gray-400 font-medium">
                      {file.createdTime ? new Date(file.createdTime).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : "-"}
                    </td>
                    <td className="p-4 pr-6 text-right space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedItem(file);
                          setRightPanelTab("details");
                          setIsRightPanelOpen(true);
                        }}
                        className="px-2.5 py-1 bg-brand-500/10 text-brand-700 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                      >
                        Detail
                      </button>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 text-[10px] font-black rounded-lg uppercase transition-colors inline-block"
                        >
                          Drive
                        </a>
                      )}
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => {
                              setEditingFileItem(file);
                              setEditFileName(file.customName || file.name);
                              setEditDescription(file.description || "");
                              setEditPT(file.pt || "");
                              setSelectedPICs(file.pic ? file.pic.split(",").map((p) => p.trim()).filter(Boolean) : []);
                              setEditFileModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="px-2.5 py-1 bg-red-500/10 text-red-700 hover:bg-red-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>

        {/* RIGHT SIDEBAR: Info & Activity Pane */}
        {isRightPanelOpen && (
          <div className="lg:col-span-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] space-y-4">
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-2">
              <div className="flex border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden p-0.5 bg-gray-50 dark:bg-gray-950">
                <button
                  onClick={() => setRightPanelTab("activity")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                    rightPanelTab === "activity"
                      ? "bg-white dark:bg-gray-800 text-brand-500 shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-305"
                  }`}
                >
                  Aktivitas
                </button>
                <button
                  onClick={() => setRightPanelTab("details")}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg tracking-wider transition-all cursor-pointer ${
                    rightPanelTab === "details"
                      ? "bg-white dark:bg-gray-800 text-brand-500 shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-305"
                  }`}
                >
                  Rincian
                </button>
              </div>
              
              <button
                onClick={() => setIsRightPanelOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-650 dark:hover:text-gray-300 rounded-lg hover:bg-gray-55 dark:hover:bg-gray-800 cursor-pointer"
                title="Tutup Panel"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="space-y-4">
              {rightPanelTab === "activity" ? (
                /* Recent Activities List */
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest pb-1 border-b border-gray-100 dark:border-gray-800/40">Log Aktivitas Terbaru</h4>
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act, idx) => (
                      <div key={act.id || idx} className="flex gap-2.5 text-xs">
                        <div className="w-6.5 h-6.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center flex-shrink-0 font-bold uppercase text-[8px] border border-brand-500/20">
                          {act.userName ? act.userName.substring(0, 2) : "US"}
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-bold text-gray-900 dark:text-white truncate">
                            {act.userName || "Sistem"}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                            {act.action} <span className="font-semibold text-gray-750 dark:text-gray-300">{act.target}</span>
                          </p>
                          <p className="text-[8px] text-gray-450 font-medium">
                            {act.createdAt ? new Date(act.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-gray-400 italic text-center py-6">Tidak ada aktivitas tercatat.</p>
                  )}
                </div>
              ) : (
                /* Metadata Details Panel */
                <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
                  {selectedItem ? (
                    <div className="space-y-4">
                      {/* Big Icon & Info */}
                      <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 dark:bg-white/[0.01] border border-gray-100 dark:border-gray-800/60 rounded-2xl relative overflow-hidden">
                        {selectedItem.thumbnailLink ? (
                          <img
                            src={selectedItem.thumbnailLink.replace(/=s\d+$/, "=s320")}
                            alt={selectedItem.name}
                            className="max-h-[100px] object-contain rounded shadow-sm border border-gray-150 dark:border-gray-800 mb-3"
                          />
                        ) : (
                          <div className="mb-2">{getFileIcon(selectedItem.mimeType)}</div>
                        )}
                        <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider truncate max-w-full px-2" title={selectedItem.customName || selectedItem.name}>
                          {selectedItem.customName || selectedItem.name}
                        </h4>
                        <span className="text-[8px] text-gray-450 font-bold uppercase tracking-wider mt-1 bg-gray-150 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {selectedItem.mimeType.split("/")[1] || "Format Lain"}
                        </span>
                      </div>

                      {/* Detail list */}
                      <div className="space-y-3.5 text-xs">
                        <div>
                          <span className="block text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Keterangan</span>
                          <p className="font-semibold text-gray-700 dark:text-gray-200 mt-1 break-words">
                            {selectedItem.description || "Tidak ada keterangan."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <span className="block text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ukuran</span>
                            <span className="block font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                              {selectedItem.isFolder ? "Folder" : formatSize(selectedItem.size)}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Tanggal</span>
                            <span className="block font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                              {selectedItem.createdTime ? new Date(selectedItem.createdTime).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }) : "-"}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">PT / Klien Asosiasi</span>
                          <span className="block mt-1">
                            {selectedItem.pt ? (
                              <span className="px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold uppercase text-[9px] tracking-wider rounded border border-brand-500/20">
                                {selectedItem.pt}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">Tidak terikat PT</span>
                            )}
                          </span>
                        </div>

                        <div>
                          <span className="block text-[8.5px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Keamanan PIC</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {selectedItem.pic ? (
                              selectedItem.pic.split(",").map((pId) => {
                                const cleaned = pId.trim();
                                const empObj = employees.find((e) => e.email === cleaned || e.name === cleaned);
                                return (
                                  <span key={cleaned} className="px-2 py-0.5 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[9px] rounded border border-red-500/25">
                                    {empObj ? empObj.name : cleaned}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-700 dark:text-green-400 font-bold uppercase text-[9px] tracking-wider rounded border border-green-500/25">
                                Publik (Semua Staf)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons list */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-gray-150 dark:border-gray-800">
                        {selectedItem.webViewLink && (
                          <a
                            href={selectedItem.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase text-center cursor-pointer transition-all"
                          >
                            Buka di Google Drive
                          </a>
                        )}
                        {selectedItem.webContentLink && !selectedItem.isFolder && (
                          <a
                            href={selectedItem.webContentLink}
                            download
                            className="w-full py-2 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/10 text-xs font-black uppercase text-center cursor-pointer transition-all"
                          >
                            Unduh Berkas
                          </a>
                        )}
                        {isAdmin && (
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <button
                              onClick={() => {
                                if (selectedItem.isFolder) {
                                  setEditingFolderItem(selectedItem);
                                  setEditFolderName(selectedItem.name);
                                  setEditFolderModalOpen(true);
                                } else {
                                  setEditingFileItem(selectedItem);
                                  setEditFileName(selectedItem.customName || selectedItem.name);
                                  setEditDescription(selectedItem.description || "");
                                  setEditPT(selectedItem.pt || "");
                                  setSelectedPICs(selectedItem.pic ? selectedItem.pic.split(",").map((p) => p.trim()).filter(Boolean) : []);
                                  setEditFileModalOpen(true);
                                }
                              }}
                              className="py-2 border border-amber-500/30 hover:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer"
                            >
                              Ubah Detail
                            </button>
                            <button
                              onClick={() => {
                                if (selectedItem.isFolder) {
                                  handleDeleteFolder(selectedItem.id);
                                } else {
                                  handleDeleteFile(selectedItem.id);
                                }
                              }}
                              className="py-2 border border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-500 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer"
                            >
                              Hapus Berkas
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Blank state */
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-full text-gray-405 border border-gray-150 dark:border-gray-850">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-6H15m-4.5 3H15m-9-3.847V16.5a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25V7.5L13.5 3H6.75A2.25 2.25 0 004.5 5.25v10.5h.001z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">Pilih Berkas</p>
                        <p className="text-[10px] text-gray-400 font-semibold mt-1 max-w-[150px] mx-auto leading-normal">
                          Klik menu rincian di berkas atau folder untuk melihat metadata lengkapnya.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
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
              placeholder="Contoh: Dokumen Hukum PT A"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFolderModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={folderSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50 cursor-pointer"
            >
              {folderSubmitting ? "Membuat..." : "Buat Folder"}
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
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold"
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditFolderModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-855 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editFolderSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50 cursor-pointer"
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
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Pilih Berkas (Multi-upload didukung)</label>
            <input
              type="file"
              required
              multiple
              className="w-full text-xs text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-gray-200 dark:file:border-gray-800 file:text-xs file:font-black file:uppercase file:bg-white dark:file:bg-gray-900 dark:file:text-white hover:file:bg-gray-50 file:cursor-pointer p-2 border border-gray-250 dark:border-gray-850 rounded-xl bg-transparent"
              onChange={(e) => setSelectedFiles(e.target.files)}
            />
          </div>

          {selectedFiles && selectedFiles.length === 1 && (
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Berkas Kustom (Opsional)</label>
              <input
                type="text"
                placeholder="Kosongkan untuk menggunakan nama asli file"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Ringkasan</label>
            <textarea
              placeholder="Deskripsi singkat mengenai isi dokumen"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold h-20 resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">PT / Klien Asosiasi (Opsional)</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-black uppercase cursor-pointer"
              value={selectedPT}
              onChange={(e) => setSelectedPT(e.target.value)}
            >
              <option value="">-- Pilih PT Asosiasi --</option>
              {ptList.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <PicSelect
              label="Pilih PIC Keamanan Akses (Opsional)"
              users={usersForPicSelect}
              selectedValues={selectedPICs}
              onChange={setSelectedPICs}
              placeholder="Pilih Karyawan PIC..."
              valueKey="email"
            />
            <p className="text-[9px] text-gray-405 mt-1.5 font-bold uppercase tracking-wider leading-relaxed">
              {APP_LABELS.narasumberHukum.modals.picAccessNote}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setUploadModalOpen(false)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={uploadSubmitting}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50 cursor-pointer"
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
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Berkas</label>
            <input
              type="text"
              required
              placeholder="Masukkan nama berkas baru..."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold"
              value={editFileName}
              onChange={(e) => setEditFileName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Ringkasan</label>
            <textarea
              placeholder="Deskripsi singkat mengenai isi dokumen"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-semibold h-20 resize-none"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">PT / Klien Asosiasi (Opsional)</label>
            <select
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:text-white text-xs font-black uppercase cursor-pointer"
              value={editPT}
              onChange={(e) => setEditPT(e.target.value)}
            >
              <option value="">-- Pilih PT Asosiasi --</option>
              {ptList.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <PicSelect
              label="Pilih PIC Keamanan Akses (Opsional)"
              users={usersForPicSelect}
              selectedValues={selectedPICs}
              onChange={setSelectedPICs}
              placeholder="Pilih Karyawan PIC..."
              valueKey="email"
            />
            <p className="text-[9px] text-gray-405 mt-1.5 font-bold uppercase tracking-wider leading-relaxed">
              {APP_LABELS.narasumberHukum.modals.picAccessNoteEdit}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditFileModalOpen(false)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={editFileSubmitting}
              className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors disabled:opacity-50 cursor-pointer"
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
            <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-800">
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
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Keterangan / Ringkasan</span>
                <span className="block font-bold text-gray-700 dark:text-gray-200 mt-1">
                  {selectedItem.description || "Tidak ada keterangan."}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">PT Klien Asosiasi</span>
                <span className="block font-bold mt-1">
                  {selectedItem.pt ? (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-black uppercase text-[9px] tracking-wider rounded border border-gray-200 dark:border-gray-800">
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
                        <span key={cleaned} className="px-2.5 py-1 bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-[10px] rounded-lg border border-red-500/20 w-max block">
                          {empObj ? empObj.name : cleaned}
                        </span>
                      );
                    })
                  ) : (
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-700 dark:text-green-400 font-black uppercase text-[9px] tracking-wider rounded border border-green-500/20">
                      Publik (Semua Staf)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Diunggah Pada</span>
                <span className="block font-bold text-gray-700 dark:text-gray-200 mt-1">
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

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-850 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              {selectedItem.webViewLink && (
                <a
                  href={selectedItem.webViewLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 text-xs font-black uppercase transition-colors inline-block cursor-pointer text-center"
                >
                  Buka di Google Drive
                </a>
              )}
            </div>
          </div>
        )}
      </FeatureModal>

      {/* FULLSCREEN PREVIEW LIGHTBOX MODAL */}
      {previewItem && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 transition-all animate-in fade-in"
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
              {previewItem.mimeType.includes("pdf") || 
               previewItem.mimeType.includes("image") || 
               previewItem.mimeType.includes("video") ? (
                <iframe
                  src={`https://drive.google.com/file/d/${previewItem.id}/preview`}
                  className="w-full h-[500px] border-none rounded-xl"
                  allow="autoplay"
                ></iframe>
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
