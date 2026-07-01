"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import * as xlsx from "xlsx";
import { useAnimeSlideInLeft, useAnimeSlideInRight } from "@/hooks/useAnime";
import PicSelect from "@/components/common/PicSelect";

type ActiveTab = "RETAINER" | "NON_RETAINER" | "INTERNAL" | "LAPORAN_BERKALA";

interface ProgressRow {
  id: string;
  type: string;
  no: string | null;
  tanggal: string | null;
  waktu: string | null;
  namaKlien: string | null;
  quadran: string | null;
  kategori: string | null;
  deskripsi: string | null;
  tugas: string | null;
  area: string | null;
  status: string; // SELESAI, KONFIRMASI INTERNAL, KONFIRMASI PERUSAHAAN, ON PROGRESS, PENDING, CANCEL
  keterangan: string | null;
  catatan: string | null;
  penanggungJawab: string | null;
  attachments: string | null; // JSON array of { name, url, fileId }
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

// Standardised status list with metadata for styling
const STATUS_METADATA = [
  { key: "SELESAI", label: "SELESAI", bg: "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400", hover: "hover:bg-green-500/20", color: "#10B981" },
  { key: "KONFIRMASI INTERNAL", label: "KONFIRMASI INTERNAL", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400", hover: "hover:bg-blue-500/20", color: "#3B82F6" },
  { key: "KONFIRMASI PERUSAHAAN", label: "KONFIRMASI PERUSAHAAN", bg: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400", hover: "hover:bg-purple-500/20", color: "#8B5CF6" },
  { key: "ON PROGRESS", label: "ON PROGRESS", bg: "bg-sky-500/10 text-sky-600 border-sky-500/20 dark:bg-sky-500/20 dark:text-sky-400", hover: "hover:bg-sky-500/20", color: "#0EA5E9" },
  { key: "PENDING", label: "PENDING", bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400", hover: "hover:bg-amber-500/20", color: "#F59E0B" },
  { key: "CANCEL", label: "CANCEL", bg: "bg-red-500/10 text-red-650 border-red-500/20 dark:bg-red-500/20 dark:text-red-400", hover: "hover:bg-red-500/20", color: "#EF4444" },
];

export default function ProgressPekerjaanPage() {
  const { data: session } = useSession();
  
  // Tabs & general state
  const [activeTab, setActiveTab] = useState<ActiveTab>("RETAINER");

  const user = session?.user as any;
  const isAdminOrPIC = user?.role === "admin" || 
    (activeTab === "RETAINER" && user?.canManageRetainer) || 
    (activeTab === "NON_RETAINER" && user?.canManagePerorangan);
  const [data, setData] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(null);
  
  // Selections for form updates
  const [users, setUsers] = useState<User[]>([]);

  const animTrigger = !loading;
  const statsRef = useAnimeSlideInLeft(1000, 1000, animTrigger);
  const contentRef = useAnimeSlideInRight(1500, 1000, animTrigger);
  
  // Status summary counts
  const [summary, setSummary] = useState<any>(null);

  // Password authorization state for the Laporan Berkala tab
  const [isPeriodicUnlocked, setIsPeriodicUnlocked] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Sorting
  const [sortState, setSortState] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "no", dir: "asc" });

  // Column Filtering (Google Sheets style)
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string[] }>({});
  const [activeFilterPopover, setActiveFilterPopover] = useState<string | null>(null);
  const [colSearchQuery, setColSearchQuery] = useState("");
  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Modals state
  const [detailRow, setDetailRow] = useState<ProgressRow | null>(null);
  const [formRow, setFormRow] = useState<Partial<ProgressRow> | null>(null);
  const [uploadRow, setUploadRow] = useState<ProgressRow | null>(null);
  
  // File upload state
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchSummary();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        if (upper === "RETAINER" || upper === "NON_RETAINER" || upper === "INTERNAL" || upper === "LAPORAN_BERKALA") {
          setActiveTab(upper as ActiveTab);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);


  // Handle clicking outside column filter popover to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(event.target as Node)) {
        setActiveFilterPopover(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const list = await res.json();
        setUsers(list);
      }
    } catch (e) {
      console.error("Failed to fetch users list:", e);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/progress-pekerjaan?summary=true");
      if (res.ok) {
        const counts = await res.json();
        setSummary(counts);
      }
    } catch (e) {
      console.error("Failed to fetch summary stats:", e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/progress-pekerjaan?type=${activeTab}`);
      if (res.ok) {
        const list = await res.json();
        setData(list);
      }
    } catch (e) {
      console.error("Failed to fetch jobs progress:", e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to standardise date display
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Password Lock Enforcement Helper
  const executeWithAuth = (action: () => void) => {
    if (activeTab === "LAPORAN_BERKALA" && !isPeriodicUnlocked) {
      setPasswordInput("");
      setPendingAction(() => action);
      setShowPasswordModal(true);
    } else {
      action();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Rahasia") {
      setIsPeriodicUnlocked(true);
      setShowPasswordModal(false);
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
    } else {
      alert("Password salah! Akses ditolak.");
    }
  };

  // CRUD Operations
  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRow) return;

    setIsSaving(true);
    try {
      const isEdit = !!formRow.id;
      const url = "/api/progress-pekerjaan";
      const method = isEdit ? "PUT" : "POST";
      
      const payload = {
        ...formRow,
        type: activeTab,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFormRow(null);
        fetchData();
        fetchSummary();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan data.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRow = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus baris pekerjaan ini?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/progress-pekerjaan?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchData();
        fetchSummary();
      } else {
        alert("Gagal menghapus baris pekerjaan.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menghapus data.");
    } finally {
      setIsSaving(false);
    }
  };

  // Google Drive upload handling
  const handleUploadFiles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadRow || uploadFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStatusMsg("Menyiapkan berkas untuk diunggah...");

    try {
      const formData = new FormData();
      formData.append("rowId", uploadRow.id);
      
      uploadFiles.forEach((file) => {
        formData.append("files", file);
      });

      setUploadProgress(30);
      setUploadStatusMsg("Menghubungkan ke Google Drive & Membuat folder...");

      const res = await fetch("/api/progress-pekerjaan/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);
      setUploadStatusMsg("Mengunggah berkas...");

      if (res.ok) {
        setUploadProgress(100);
        setUploadStatusMsg("Selesai! Berkas berhasil diunggah.");
        setTimeout(() => {
          setUploadRow(null);
          setUploadFiles([]);
          setIsUploading(false);
          fetchData();
        }, 1500);
      } else {
        const err = await res.json();
        throw new Error(err.error || "Gagal mengunggah berkas");
      }
    } catch (error: any) {
      console.error(error);
      setUploadStatusMsg(`Error: ${error.message || "Gagal mengunggah berkas"}`);
      setIsUploading(false);
    }
  };

  // Google Sheets column filtering logic
  const getUniqueValues = (key: keyof ProgressRow) => {
    const vals = data.map((r) => {
      if (key === "tanggal") return formatDateString(r.tanggal);
      return String(r[key] || "—").trim();
    });
    return Array.from(new Set(vals)).filter(Boolean);
  };

  const handleToggleColumnFilterValue = (columnKey: string, value: string) => {
    setColumnFilters((prev) => {
      const current = prev[columnKey] || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      
      return {
        ...prev,
        [columnKey]: updated,
      };
    });
  };

  const handleClearColumnFilter = (columnKey: string) => {
    setColumnFilters((prev) => {
      const copy = { ...prev };
      delete copy[columnKey];
      return copy;
    });
    setActiveFilterPopover(null);
  };

  // Filter & Search active tab data
  let filteredData = data.filter((row) => {
    // 1. Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        (row.namaKlien && row.namaKlien.toLowerCase().includes(q)) ||
        (row.deskripsi && row.deskripsi.toLowerCase().includes(q)) ||
        (row.tugas && row.tugas.toLowerCase().includes(q)) ||
        (row.penanggungJawab && row.penanggungJawab.toLowerCase().includes(q)) ||
        (row.kategori && row.kategori.toLowerCase().includes(q)) ||
        (row.area && row.area.toLowerCase().includes(q)) ||
        (row.keterangan && row.keterangan.toLowerCase().includes(q)) ||
        (row.catatan && row.catatan.toLowerCase().includes(q));

      if (!matchesSearch) return false;
    }

    // 2. Clickable Top Summary Cards Filter
    if (selectedStatusFilter) {
      if (row.status.toUpperCase() !== selectedStatusFilter.toUpperCase()) {
        return false;
      }
    }

    // 3. Google Sheets Column Filters
    for (const [colKey, filterValues] of Object.entries(columnFilters)) {
      if (filterValues && filterValues.length > 0) {
        let cellVal = "";
        if (colKey === "tanggal") {
          cellVal = formatDateString(row.tanggal);
        } else {
          cellVal = String(row[colKey as keyof ProgressRow] || "—").trim();
        }

        if (!filterValues.includes(cellVal)) {
          return false;
        }
      }
    }

    return true;
  });

  // Apply sorting
  if (sortState.key) {
    const { key, dir } = sortState;
    filteredData = [...filteredData].sort((a: any, b: any) => {
      let valA = a[key] ?? "";
      let valB = b[key] ?? "";

      if (key === "tanggal") {
        const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
        return dir === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        const cmp = valA.localeCompare(valB, "id", { numeric: true });
        return dir === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }

  // Import / Export features
  const handleExportExcel = () => {
    try {
      const exportList = filteredData.map((item, index) => {
        const row: any = {
          "No": item.no || index + 1,
          "Hari / Tanggal": formatDateString(item.tanggal),
        };
        if (item.waktu !== null) row["Waktu"] = item.waktu || "—";
        if (item.namaKlien !== null) row["Nama Klien / Perusahaan"] = item.namaKlien || "—";
        if (item.quadran !== null) row["Quadran"] = item.quadran || "—";
        if (item.kategori !== null) row["Kategori"] = item.kategori || "—";
        row["Deskripsi"] = item.deskripsi || "—";
        row["Tugas"] = item.tugas || "—";
        row["Area"] = item.area || "—";
        row["Status"] = item.status || "—";
        row["Keterangan"] = item.keterangan || "—";
        row["Catatan"] = item.catatan || "—";
        row["Penanggung Jawab"] = item.penanggungJawab || "—";
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(exportList);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, activeTab.substring(0, 30));
      xlsx.writeFile(workbook, `Progress_${activeTab}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      alert("Ekspor ke Excel gagal.");
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    executeWithAuth(() => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const ab = evt.target?.result;
          const workbook = xlsx.read(ab, { type: "array" });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

          if (rows.length < 2) {
            alert("Format Excel kosong atau tidak sesuai.");
            return;
          }

          // We'll iterate starting from the second row (index 1) assuming first row is header
          const importedRows: any[] = [];
          
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length === 0) continue;

            const no = r[0] ? String(r[0]).trim() : String(i);
            // Try parsing Excel date
            let tanggal: string | null = null;
            if (r[1]) {
              const num = Number(r[1]);
              if (!isNaN(num)) {
                tanggal = new Date((num - 25569) * 86400 * 1000).toISOString().split("T")[0];
              } else {
                tanggal = String(r[1]).trim();
              }
            }

            // Map columns according to active tab structure
            let rowObj: any = {
              type: activeTab,
              no,
              tanggal,
              status: "ON PROGRESS"
            };

            if (activeTab === "RETAINER") {
              rowObj.waktu = r[2] ? String(r[2]).trim() : "";
              rowObj.namaKlien = r[3] ? String(r[3]).trim() : "";
              rowObj.quadran = r[4] ? String(r[4]).trim() : "";
              rowObj.deskripsi = r[5] ? String(r[5]).trim() : "";
              rowObj.tugas = r[6] ? String(r[6]).trim() : "";
              rowObj.area = r[7] ? String(r[7]).trim() : "";
              rowObj.status = mapExcelStatus(r[8] ? String(r[8]).trim() : "");
              rowObj.keterangan = r[9] ? String(r[9]).trim() : "";
              rowObj.catatan = r[10] ? String(r[10]).trim() : "";
              rowObj.penanggungJawab = r[11] ? String(r[11]).trim() : "";
            } else if (activeTab === "NON_RETAINER") {
              rowObj.quadran = r[2] ? String(r[2]).trim() : "";
              rowObj.status = mapExcelStatus(r[3] ? String(r[3]).trim() : "");
              rowObj.kategori = r[4] ? String(r[4]).trim() : "";
              rowObj.deskripsi = r[5] ? String(r[5]).trim() : "";
              rowObj.area = r[6] ? String(r[6]).trim() : "";
              rowObj.tugas = r[7] ? String(r[7]).trim() : "";
              rowObj.keterangan = r[8] ? String(r[8]).trim() : "";
              rowObj.catatan = r[9] ? String(r[9]).trim() : "";
              rowObj.penanggungJawab = r[10] ? String(r[10]).trim() : "";
            } else if (activeTab === "INTERNAL") {
              rowObj.quadran = r[2] ? String(r[2]).trim() : "";
              rowObj.status = mapExcelStatus(r[3] ? String(r[3]).trim() : "");
              rowObj.deskripsi = r[4] ? String(r[4]).trim() : "";
              rowObj.area = r[5] ? String(r[5]).trim() : "";
              rowObj.tugas = r[6] ? String(r[6]).trim() : "";
              rowObj.keterangan = r[7] ? String(r[7]).trim() : "";
              rowObj.catatan = r[8] ? String(r[8]).trim() : "";
              rowObj.penanggungJawab = r[9] ? String(r[9]).trim() : "";
            } else if (activeTab === "LAPORAN_BERKALA") {
              rowObj.waktu = r[2] ? String(r[2]).trim() : "";
              rowObj.namaKlien = r[3] ? String(r[3]).trim() : "";
              rowObj.deskripsi = r[4] ? String(r[4]).trim() : "";
              rowObj.tugas = r[5] ? String(r[5]).trim() : "";
              rowObj.area = r[6] ? String(r[6]).trim() : "";
              rowObj.status = mapExcelStatus(r[7] ? String(r[7]).trim() : "");
              rowObj.keterangan = r[8] ? String(r[8]).trim() : "";
              rowObj.catatan = r[9] ? String(r[9]).trim() : "";
              rowObj.penanggungJawab = r[10] ? String(r[10]).trim() : "";
            }

            importedRows.push(rowObj);
          }

          if (importedRows.length === 0) {
            alert("Tidak ada baris yang valid untuk diimpor.");
            return;
          }

          // Bulk insert in consecutive API calls or backend handler
          setLoading(true);
          let successCount = 0;
          for (const item of importedRows) {
            const res = await fetch("/api/progress-pekerjaan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(item)
            });
            if (res.ok) successCount++;
          }

          alert(`Berhasil mengimpor ${successCount} baris pekerjaan.`);
          fetchData();
          fetchSummary();
        } catch (err) {
          console.error(err);
          alert("Gagal membaca file Excel.");
        } finally {
          setLoading(false);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleExportPDF = () => {
    window.print();
  };

  // Helper inside loop to map string to standardized status
  const mapExcelStatus = (statusStr: string): string => {
    if (!statusStr) return "ON PROGRESS";
    const s = statusStr.trim().toUpperCase();
    if (s === "SELESAI") return "SELESAI";
    if (s === "AKTIF" || s === "ON PROGRESS" || s === "IN PROGRESS" || s === "ON-PROGRESS") return "ON PROGRESS";
    if (s === "PENDING") return "PENDING";
    if (s === "CANCEL" || s === "BATAL") return "CANCEL";
    if (s === "KONFIRMASI INTERNAL" || s === "CONFIRM INTERNAL") return "KONFIRMASI INTERNAL";
    if (s === "KONFIRMASI PERUSAHAAN" || s === "CONFIRM PERUSAHAAN") return "KONFIRMASI PERUSAHAAN";
    return s;
  };

  // Styling helper classes
  const getStatusBadge = (status: string) => {
    const meta = STATUS_METADATA.find((m) => m.key === status.toUpperCase());
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border whitespace-nowrap shadow-sm ${meta ? meta.bg : "bg-gray-100 text-gray-700 border-gray-200"}`}>
        {status}
      </span>
    );
  };

  // Form Fields Setup based on Active Tab
  const getFormFields = () => {
    const list: { key: string; label: string; type: string; options?: string[] }[] = [
      { key: "no", label: "No / Urutan", type: "text" },
      { key: "tanggal", label: "Tanggal Pekerjaan", type: "date" },
    ];
    if (activeTab === "RETAINER" || activeTab === "LAPORAN_BERKALA") {
      list.push({ key: "waktu", label: "Waktu (Jam)", type: "text" });
      list.push({ key: "namaKlien", label: "Nama Perusahaan / Klien", type: "text" });
    }
    if (activeTab === "RETAINER" || activeTab === "NON_RETAINER" || activeTab === "INTERNAL") {
      list.push({ key: "quadran", label: "Quadran (Q1 / Q2 / Q3)", type: "select", options: ["Q1", "Q2", "Q3"] });
    }
    if (activeTab === "NON_RETAINER") {
      list.push({ key: "kategori", label: "Kategori Pekerjaan", type: "text" });
    }
    list.push({ key: "deskripsi", label: "Deskripsi Pekerjaan", type: "textarea" });
    list.push({ key: "tugas", label: "Tugas / Instruksi", type: "textarea" });
    list.push({ key: "area", label: "Area / Wilayah", type: "text" });
    list.push({ key: "status", label: "Status Kerja", type: "select", options: STATUS_METADATA.map(s => s.key) });
    list.push({ key: "keterangan", label: "Keterangan (Fakta Objektif)", type: "textarea" });
    list.push({ key: "catatan", label: "Catatan (Tambahan / Review)", type: "textarea" });
    return list;
  };

  // Active Tab summary stats getter
  const getActiveTabStats = () => {
    if (!summary || !summary[activeTab]) {
      return { total: 0, selesai: 0, internalConf: 0, companyConf: 0, progress: 0, pending: 0, cancel: 0 };
    }
    return summary[activeTab];
  };

  const activeStats = getActiveTabStats();

  // Column definitions for spreadsheet headers mapping
  const getColumns = (): { key: keyof ProgressRow; label: string; width: string }[] => {
    switch (activeTab) {
      case "RETAINER":
        return [
          { key: "no", label: "NO", width: "50px" },
          { key: "tanggal", label: "HARI / TANGGAL", width: "140px" },
          { key: "waktu", label: "WAKTU", width: "70px" },
          { key: "namaKlien", label: "NAMA PERUSAHAAN / KLIEN", width: "180px" },
          { key: "quadran", label: "QUADRAN", width: "80px" },
          { key: "deskripsi", label: "DESKRIPSI PEKERJAAN", width: "260px" },
          { key: "tugas", label: "TUGAS / INSTRUKSI", width: "260px" },
          { key: "area", label: "AREA", width: "100px" },
          { key: "status", label: "STATUS", width: "135px" },
          { key: "keterangan", label: "KETERANGAN", width: "220px" },
          { key: "catatan", label: "CATATAN", width: "220px" },
          { key: "penanggungJawab", label: "PENANGGUNG JAWAB", width: "160px" },
        ];
      case "NON_RETAINER":
        return [
          { key: "no", label: "NO", width: "50px" },
          { key: "tanggal", label: "TANGGAL", width: "140px" },
          { key: "quadran", label: "QUADRAN", width: "80px" },
          { key: "status", label: "STATUS", width: "135px" },
          { key: "kategori", label: "KATEGORI", width: "130px" },
          { key: "deskripsi", label: "DESKRIPSI PEKERJAAN", width: "300px" },
          { key: "area", label: "AREA", width: "100px" },
          { key: "tugas", label: "TUGAS / INSTRUKSI", width: "300px" },
          { key: "keterangan", label: "KETERANGAN", width: "220px" },
          { key: "catatan", label: "CATATAN", width: "220px" },
          { key: "penanggungJawab", label: "PENANGGUNG JAWAB", width: "160px" },
        ];
      case "INTERNAL":
        return [
          { key: "no", label: "NO", width: "50px" },
          { key: "tanggal", label: "TANGGAL", width: "140px" },
          { key: "quadran", label: "QUADRAN", width: "80px" },
          { key: "status", label: "STATUS", width: "135px" },
          { key: "deskripsi", label: "DESKRIPSI PEKERJAAN", width: "350px" },
          { key: "area", label: "AREA", width: "100px" },
          { key: "tugas", label: "TUGAS / INSTRUKSI", width: "350px" },
          { key: "keterangan", label: "KETERANGAN", width: "220px" },
          { key: "catatan", label: "CATATAN", width: "220px" },
          { key: "penanggungJawab", label: "PENANGGUNG JAWAB", width: "160px" },
        ];
      case "LAPORAN_BERKALA":
        return [
          { key: "no", label: "NO", width: "50px" },
          { key: "tanggal", label: "HARI / TANGGAL", width: "140px" },
          { key: "waktu", label: "WAKTU", width: "70px" },
          { key: "namaKlien", label: "NAMA PERUSAHAAN / KLIEN", width: "180px" },
          { key: "deskripsi", label: "DESKRIPSI PEKERJAAN", width: "300px" },
          { key: "tugas", label: "TUGAS / INSTRUKSI", width: "300px" },
          { key: "area", label: "AREA", width: "100px" },
          { key: "status", label: "STATUS", width: "135px" },
          { key: "keterangan", label: "KETERANGAN", width: "220px" },
          { key: "catatan", label: "CATATAN", width: "220px" },
          { key: "penanggungJawab", label: "PENANGGUNG JAWAB", width: "160px" },
        ];
    }
  };

  const columns = getColumns();

  return (
    <div className="space-y-6 print:space-y-0 print:p-0">
      {/* ─── KOP SURAT RESMI (PRINT ONLY) ─────────────────────────────────── */}
      <div className="hidden print:flex items-center gap-6 pb-4 border-b-4 border-double border-black mb-6 w-full text-black">
        <img
          src="/images/logo/logo-law.png"
          alt="Logo Kantor Hukum"
          className="h-20 w-auto object-contain flex-shrink-0"
        />
        <div className="flex-1 text-center pr-20">
          <h1 className="text-xl font-black tracking-wide leading-tight uppercase">
            KANTOR HUKUM NARASUMBER HUKUM
          </h1>
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-widest mt-0.5">
            Advokat, Konsultan Hukum & Penasihat Hukum
          </p>
          <p className="text-[9px] text-gray-500 font-medium mt-1">
            Jl. Braga No. 123, Bandung, Jawa Barat
          </p>
          <p className="text-[8px] text-gray-400 font-medium mt-0.5">
            Telp: +62 811-2345-6789 &bull; Email: info@narasumberhukum.online &bull; Website: narasumberhukum.online
          </p>
        </div>
      </div>
      <div className="hidden print:block text-center mb-6 text-black">
        <h2 className="text-sm font-black uppercase tracking-wider">
          Laporan Pekerjaan Aktif ({activeTab.replace("_", " ")})
        </h2>
        <p className="text-[9px] text-gray-555 uppercase font-bold tracking-widest mt-1">
          Tanggal Rekap: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* ─── STATS SUMMARY PANELS ────────────────────────────────────────────── */}
      <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 print:hidden animate-stagger">
        {STATUS_METADATA.map((meta) => {
          let count = 0;
          if (activeStats) {
            if (meta.key === "SELESAI") count = activeStats.selesai;
            else if (meta.key === "KONFIRMASI INTERNAL") count = activeStats.internalConf;
            else if (meta.key === "KONFIRASI PERUSAHAAN" || meta.key === "KONFIRMASI PERUSAHAAN") count = activeStats.companyConf;
            else if (meta.key === "ON PROGRESS") count = activeStats.progress;
            else if (meta.key === "PENDING") count = activeStats.pending;
            else if (meta.key === "CANCEL") count = activeStats.cancel;
          }

          const isActiveFilter = selectedStatusFilter === meta.key;

          return (
            <div
              key={meta.key}
              onClick={() => setSelectedStatusFilter(isActiveFilter ? null : meta.key)}
              className={`p-4 border rounded-2xl shadow-sm transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActiveFilter
                  ? "bg-brand-500 text-white border-brand-500 shadow-md ring-2 ring-brand-500/20 scale-102"
                  : "bg-white dark:bg-white/[0.03] border-gray-200 dark:border-gray-800 hover:border-brand-500/50"
              }`}
            >
              <div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isActiveFilter ? "text-white/80" : "text-gray-400"}`}>
                  {meta.label}
                </span>
                <h2 className="text-xl font-black mt-1.5">{count}</h2>
              </div>
              <div className="flex justify-end mt-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                ></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── TAB NAVIGATION ─────────────────────────────────────────────────── */}
      <div ref={contentRef} className="animate-stagger">
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-1 overflow-x-auto pb-px print:hidden mt-2">
        {(["RETAINER", "NON_RETAINER", "INTERNAL", "LAPORAN_BERKALA"] as ActiveTab[]).map((tab) => {
          const isActive = activeTab === tab;
          let label = "";
          let icon = null;

          switch (tab) {
            case "RETAINER":
              label = "Retainer";
              break;
            case "NON_RETAINER":
              label = "Non-Retainer";
              break;
            case "INTERNAL":
              label = "Internal";
              break;
            case "LAPORAN_BERKALA":
              label = "Lainnya";
              icon = null;
              break;
          }

          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedStatusFilter(null);
                setColumnFilters({});
                setSearchQuery("");
              }}
              className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest border-b-2 whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                isActive
                  ? "border-brand-500 text-brand-500 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* ─── FILTERS & DATA ACTIONS ────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm print:hidden">
        {/* Search */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Cari deskripsi, klien, tugas, area..."
              className="w-full pl-9 pr-8 py-2.5 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors text-xs font-semibold placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 font-black cursor-pointer text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Reset Filters Option if filters active */}
          {(selectedStatusFilter || Object.keys(columnFilters).length > 0) && (
            <button
              onClick={() => {
                setSelectedStatusFilter(null);
                setColumnFilters({});
              }}
              className="px-3 py-2 border border-dashed border-red-500/30 text-red-500 hover:bg-red-500/5 transition-all text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Actions (Import / Export / Add) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Entry */}
          {isAdminOrPIC && (
            <button
              onClick={() => executeWithAuth(() => setFormRow({}))}
              className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors hover:bg-brand-600 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pekerjaan
            </button>
          )}

          {/* Import */}
          {isAdminOrPIC && (
            <>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                id="import-excel-file"
                onChange={handleImportExcel}
              />
              <label
                htmlFor="import-excel-file"
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import Excel/CSV
              </label>
            </>
          )}

          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Excel
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <svg className="w-4 h-4 text-red-650" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* ─── DATA TABLE ─────────────────────────────────────────────────────── */}
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        {loading ? (
          <div className="p-6 space-y-4 print:hidden">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-6 h-6 rounded bg-gray-150 dark:bg-gray-800 flex-shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-150 dark:bg-gray-800 rounded w-1/4"></div>
                  <div className="h-2.5 bg-gray-150 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-24 text-xs text-gray-400 italic">
            Belum ada data pekerjaan aktif yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto text-[13px] relative max-h-[70vh] no-scrollbar rounded-2xl border border-gray-250 dark:border-gray-800 print:max-h-none print:overflow-visible print:border-none">
            <table className="w-full text-left border-collapse table-fixed min-w-[1900px] print:min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-450 uppercase tracking-wider bg-gray-50/20 dark:bg-white/[0.01]">
                  {/* Dynamic Columns with Google Sheets Filters */}
                  {columns.map((col) => {
                    const isFiltered = (columnFilters[col.key] || []).length > 0;
                    
                    return (
                      <th
                        key={col.key}
                        className="p-4 relative whitespace-nowrap"
                        style={{ width: col.width }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{col.label}</span>
                          
                          {/* Column Filter Icon */}
                          <button
                            onClick={() => {
                              setColSearchQuery("");
                              setActiveFilterPopover(activeFilterPopover === col.key ? null : col.key);
                            }}
                            className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer print:hidden ${isFiltered ? "text-brand-500 font-bold" : "text-gray-400"}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>

                        {/* Google Sheets Style Filter Popover Dropdown */}
                        {activeFilterPopover === col.key && (
                          <div
                            ref={filterPopoverRef}
                            className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#1a1d27] border border-gray-200 dark:border-white/[0.08] shadow-2xl rounded-2xl p-4 z-50 text-xs font-semibold text-gray-700 dark:text-gray-200 normal-case space-y-3 animate-in fade-in duration-100"
                          >
                            {/* Sort Actions */}
                            <div className="space-y-1.5 pb-2.5 border-b border-gray-100 dark:border-white/[0.05]">
                              <button
                                onClick={() => {
                                  setSortState({ key: col.key, dir: "asc" });
                                  setActiveFilterPopover(null);
                                }}
                                className="w-full text-left py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>↓</span> Urutkan A-Z (Kecil ke Besar)
                              </button>
                              <button
                                onClick={() => {
                                  setSortState({ key: col.key, dir: "desc" });
                                  setActiveFilterPopover(null);
                                }}
                                className="w-full text-left py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                              >
                                <span>↑</span> Urutkan Z-A (Besar ke Kecil)
                              </button>
                            </div>

                            {/* Search inside Popover values */}
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Cari nilai..."
                                className="w-full pl-7 pr-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-lg bg-transparent text-[11px] outline-none focus:border-brand-500 transition-colors"
                                value={colSearchQuery}
                                onChange={(e) => setColSearchQuery(e.target.value)}
                              />
                              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>

                            {/* Unique checkbox values list */}
                            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
                              {getUniqueValues(col.key)
                                .filter(val => val.toLowerCase().includes(colSearchQuery.toLowerCase()))
                                .map((val) => {
                                  const isChecked = (columnFilters[col.key] || []).includes(val);
                                  return (
                                    <label
                                      key={val}
                                      className="flex items-center gap-2 py-1 px-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors select-none text-[11px]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggleColumnFilterValue(col.key, val)}
                                        className="rounded text-brand-500 focus:ring-brand-500/20 w-3.5 h-3.5 cursor-pointer"
                                      />
                                      <span className="truncate max-w-[180px]">{val}</span>
                                    </label>
                                  );
                                })}
                            </div>

                            {/* Clear Filter button */}
                            <div className="pt-2 border-t border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
                              <button
                                onClick={() => handleClearColumnFilter(col.key)}
                                className="text-[10px] text-red-500 hover:underline cursor-pointer"
                              >
                                Bersihkan Filter
                              </button>
                              <button
                                onClick={() => setActiveFilterPopover(null)}
                                className="px-2.5 py-1 bg-brand-500 text-white rounded text-[10px] uppercase font-bold hover:bg-brand-600 transition-colors cursor-pointer"
                              >
                                Tutup
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                    );
                  })}
                  
                  {/* Sticky right AKSI */}
                  <th
                    className="p-4 text-right sticky right-0 z-30 bg-gray-50 dark:bg-[#151722] border-l border-gray-100 dark:border-gray-800 print:hidden w-40"
                    style={{ width: "160px" }}
                  >
                    AKSI
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                {filteredData.map((item, index) => {
                  const rowBgClass = index % 2 === 0 ? "bg-white dark:bg-[#0c0d14]" : "bg-gray-50 dark:bg-[#0f1118]";
                  
                  return (
                    <tr
                      key={item.id}
                      className={`group ${rowBgClass} hover:bg-brand-500/[0.02] transition-colors`}
                    >
                      {/* Dynamic Columns cells */}
                      {columns.map((col) => {
                        let content: React.ReactNode = "—";
                        
                        if (col.key === "no") {
                          content = (
                            <span className="font-bold text-black dark:text-white">
                              {item.no || index + 1}
                            </span>
                          );
                        } else if (col.key === "tanggal") {
                          content = formatDateString(item.tanggal);
                        } else if (col.key === "status") {
                          content = getStatusBadge(item.status);
                        } else if (col.key === "penanggungJawab") {
                          content = (
                            <div className="font-bold uppercase text-[10px] text-gray-500 dark:text-gray-400 break-words leading-tight" style={{ whiteSpace: "normal" }}>
                              {item.penanggungJawab || "—"}
                            </div>
                          );
                        } else if (col.key === "namaKlien") {
                          content = (
                            <div className="font-black uppercase text-[10px] text-brand-600 dark:text-brand-400 break-words leading-tight" style={{ whiteSpace: "normal" }}>
                              {item.namaKlien || "—"}
                            </div>
                          );
                        } else if (col.key === "quadran") {
                          content = item.quadran ? (
                            <span className={`px-2 py-0.5 font-bold text-[9px] rounded border ${
                              item.quadran === "Q1"
                                ? "bg-red-500/10 text-red-600 border-red-500/20"
                                : item.quadran === "Q2"
                                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                            }`}>
                              {item.quadran}
                            </span>
                          ) : "—";
                        } else if (col.key === "deskripsi" || col.key === "tugas" || col.key === "keterangan" || col.key === "catatan") {
                          const val = item[col.key];
                          content = val ? (
                            <div className="truncate" title={val}>
                              {val}
                            </div>
                          ) : "—";
                        } else {
                          content = item[col.key] || "—";
                        }

                        return (
                          <td key={col.key} className="p-4 print:whitespace-normal print:max-w-none print:text-black print:text-xs" style={{ width: col.width }}>
                            {content}
                          </td>
                        );
                      })}

                      {/* Sticky right Actions cell */}
                      <td className={`p-4 text-right sticky right-0 z-20 border-l border-gray-100 dark:border-gray-800 print:hidden ${rowBgClass} group-hover:bg-gray-100 dark:group-hover:bg-[#13151f]`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Detail */}
                          <button
                            onClick={() => setDetailRow(item)}
                            className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors cursor-pointer"
                            title="Detail / Lampiran Berkas"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          {/* Update */}
                          {isAdminOrPIC && (
                            <button
                              onClick={() => executeWithAuth(() => setFormRow(item))}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                          )}

                          {/* Upload */}
                          <button
                            onClick={() => executeWithAuth(() => setUploadRow(item))}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Unggah Dokumen"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </button>

                          {/* Hapus */}
                          {isAdminOrPIC && (
                            <button
                              onClick={() => executeWithAuth(() => handleDeleteRow(item.id))}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
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

      {/* ─── MODAL: DETIL PEKERJAAN & LAMPIRAN ────────────────────────────────── */}
      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#0f1117] border border-gray-250 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-150 dark:border-white/[0.05]">
              <div>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Detail Pekerjaan</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{activeTab.replace("_", " ")} &bull; No: {detailRow.no || "—"}</p>
              </div>
              <button
                onClick={() => setDetailRow(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Hari / Tanggal</span>
                  <p className="font-semibold text-black dark:text-white mt-1">{formatDateString(detailRow.tanggal)}</p>
                </div>
                {detailRow.waktu && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Waktu</span>
                    <p className="font-semibold text-black dark:text-white mt-1">{detailRow.waktu}</p>
                  </div>
                )}
                {detailRow.namaKlien && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Klien / Perusahaan</span>
                    <p className="font-semibold text-brand-500 mt-1 uppercase">{detailRow.namaKlien}</p>
                  </div>
                )}
                {detailRow.quadran && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Quadran</span>
                    <p className="mt-1">
                      <span className="px-2.5 py-0.5 rounded text-[9px] font-bold bg-brand-500/10 text-brand-600 border border-brand-500/20">{detailRow.quadran}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Deskripsi Pekerjaan</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{detailRow.deskripsi || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tugas / Instruksi</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{detailRow.tugas || "—"}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Keterangan Objektif</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{detailRow.keterangan || "—"}</p>
                </div>
                {detailRow.catatan && (
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Catatan Review</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl leading-relaxed whitespace-pre-wrap">{detailRow.catatan || "—"}</p>
                  </div>
                )}
              </div>

              {/* Attachments Section */}
              <div className="pt-4 border-t border-gray-100 dark:border-white/[0.05] space-y-3">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Lampiran Dokumen Google Drive</span>
                
                {(() => {
                  let files: any[] = [];
                  if (detailRow.attachments) {
                    try {
                      files = JSON.parse(detailRow.attachments);
                    } catch (e) {
                      files = [];
                    }
                  }

                  if (!Array.isArray(files) || files.length === 0) {
                    return <p className="text-xs text-gray-400 italic">Belum ada berkas lampiran.</p>;
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {files.map((f: any, idx: number) => (
                        <a
                          key={f.fileId || idx}
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 border border-gray-150 dark:border-white/[0.05] rounded-xl flex items-center justify-between hover:border-brand-500 transition-colors bg-white dark:bg-[#1a1d27]"
                        >
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="truncate font-semibold text-gray-700 dark:text-gray-200">{f.name}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase text-brand-500 whitespace-nowrap">Lihat File</span>
                        </a>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-white/[0.05] flex justify-end">
              <button
                onClick={() => setDetailRow(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: TAMBAH / UPDATE ─────────────────────────────────────────── */}
      {formRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-200">
          <form
            onSubmit={handleSaveRow}
            className="relative w-full max-w-2xl bg-white dark:bg-[#0f1117] border border-gray-250 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-150 dark:border-white/[0.05]">
              <div>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  {formRow.id ? "Edit Pekerjaan" : "Tambah Pekerjaan Baru"}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{activeTab.replace("_", " ")}</p>
              </div>
              <button
                type="button"
                onClick={() => setFormRow(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs no-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {getFormFields().map((field) => {
                  if (field.type === "select") {
                    return (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{field.label}</label>
                        <select
                          className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1a1d27] rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-xs font-bold uppercase text-gray-700 dark:text-gray-300 cursor-pointer"
                          value={(formRow as any)[field.key] || ""}
                          onChange={(e) => setFormRow(p => ({ ...p, [field.key]: e.target.value }))}
                        >
                          <option value="">Pilih</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  if (field.type === "textarea") {
                    return (
                      <div key={field.key} className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{field.label}</label>
                        <textarea
                          rows={3}
                          className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1a1d27] rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-xs font-semibold text-gray-700 dark:text-gray-300 placeholder-gray-400"
                          value={(formRow as any)[field.key] || ""}
                          onChange={(e) => setFormRow(p => ({ ...p, [field.key]: e.target.value }))}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={field.key}>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">{field.label}</label>
                      <input
                        type={field.type}
                        className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-850 bg-white dark:bg-[#1a1d27] rounded-xl outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/25 transition-all text-xs font-semibold text-gray-700 dark:text-gray-300 placeholder-gray-400"
                        value={
                          field.type === "date" && (formRow as any)[field.key]
                            ? new Date((formRow as any)[field.key]).toISOString().split("T")[0]
                            : (formRow as any)[field.key] || ""
                        }
                        onChange={(e) => setFormRow(p => ({ ...p, [field.key]: e.target.value }))}
                      />
                    </div>
                  );
                })}

                {/* Penanggung Jawab selection using unified PicSelect */}
                <div className="sm:col-span-2 border-t border-gray-100 dark:border-white/[0.05] pt-4">
                  <PicSelect
                    label="Penanggung Jawab (Pilih Karyawan)"
                    users={users.map(u => ({ id: u.id, name: u.name, email: u.email, image: u.image }))}
                    selectedValues={(formRow.penanggungJawab || "").split(",").map(s => s.trim()).filter(Boolean)}
                    onChange={(selected) => setFormRow(p => ({ ...p, penanggungJawab: selected.join(", ") }))}
                    placeholder="Pilih Karyawan PIC..."
                    valueKey="name"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-white/[0.05] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setFormRow(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: UNGGAH DOKUMEN GOOGLE DRIVE ────────────────────────────────── */}
      {uploadRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-205">
          <form
            onSubmit={handleUploadFiles}
            className="relative w-full max-w-md bg-white dark:bg-[#0f1117] border border-gray-250 dark:border-white/[0.08] rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-4 duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-150 dark:border-white/[0.05]">
              <div>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Unggah Berkas</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Ke Google Drive utama (Daftar Pekerjaan)</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploading) setUploadRow(null);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                disabled={isUploading}
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-brand-500/5 border border-brand-500/10 p-3.5 rounded-xl">
                <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest">Detail Baris Target</span>
                <h4 className="font-bold text-gray-800 dark:text-gray-250 mt-1 uppercase truncate">
                  Klien: {uploadRow.namaKlien || "—"}
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold mt-0.5 truncate">
                  Tugas: {uploadRow.tugas || uploadRow.deskripsi || "—"}
                </p>
              </div>

              {/* File Input Selection Area */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Pilih Berkas (Max 100 files, 1GB per file)</label>
                <input
                  type="file"
                  multiple
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 file:cursor-pointer cursor-pointer border border-gray-250 dark:border-white/[0.05] rounded-xl p-2 bg-transparent"
                />
              </div>

              {/* List Selected Files */}
              {uploadFiles.length > 0 && (
                <div className="max-h-32 overflow-y-auto space-y-1.5 no-scrollbar border border-gray-150 dark:border-white/[0.05] p-2.5 rounded-xl">
                  {uploadFiles.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] text-gray-600 dark:text-gray-300 font-semibold">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <span className="text-gray-400 font-bold">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Progress Indicator */}
              {(isUploading || uploadProgress > 0) && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-brand-600">
                    <span className="animate-pulse">{uploadStatusMsg}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-150 dark:border-white/[0.05] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUploadRow(null)}
                disabled={isUploading}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isUploading || uploadFiles.length === 0}
                className="px-4 py-2 bg-brand-500 text-white hover:bg-brand-600 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isUploading && <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></span>}
                Unggah
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── MODAL: PASSWORD AUTHORIZATION LOCK FOR PERIODIC REPORT ──────────── */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[12px] animate-in fade-in duration-200">
          <form
            onSubmit={handlePasswordSubmit}
            className="relative w-full max-w-sm bg-white dark:bg-[#0f1117] border border-red-500/20 rounded-2xl shadow-2xl p-6 flex flex-col space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500 rounded-t-2xl"></div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Otorisasi Diperlukan</h3>
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold">
                Menu Laporan Berkala diproteksi sandi. Masukkan password otorisasi untuk melakukan tindakan ini.
              </p>
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="Masukkan Password..."
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1d27] rounded-xl outline-none focus:border-red-500 text-center text-xs font-bold"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPendingAction(null);
                }}
                className="w-1/2 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 bg-red-500 text-white hover:bg-red-600 transition-colors text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Konfirmasi
              </button>
            </div>
          </form>
        </div>
      )}
      {isSaving && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xs font-black uppercase tracking-widest animate-pulse">Sedang memproses perubahan, mohon tunggu...</p>
        </div>
      )}
    </div>
  );
}
