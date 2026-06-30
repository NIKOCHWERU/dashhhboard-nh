"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon, UserCircleIcon, TrashBinIcon } from "@/icons";

interface TaskItem {
  task: string;
  duration: number;
  desc: string;
  attachment?: { name: string; url: string } | null;
}

interface TimeLog {
  start: string;
  end: string;
  duration: string;
  activity: string;
}

interface SavedReport {
  id: string;
  userId: string;
  tanggal: string;
  prioritas: string; // JSON string
  rincianKegiatan: string; // JSON string
  hasilKerja: string; // JSON string
  tugasEsok: string; // JSON string
  refleksi: string; // JSON string
  documents: string; // JSON string
  user: {
    name: string;
    email: string;
  };
}

export default function LaporanHarianPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"buat" | "riwayat">("buat");

  // --- Form States for "Buat Laporan Baru" ---
  const [reportDate, setReportDate] = useState("");
  
  // Section I: Skala Prioritas (Today)
  const [q1Today, setQ1Today] = useState<TaskItem[]>([]);
  const [q2Today, setQ2Today] = useState<TaskItem[]>([]);
  const [q3Today, setQ3Today] = useState<TaskItem[]>([]);

  // Section II: Rincian Kegiatan (Time Log)
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);

  // Section III: Hasil Kerja (Output)
  const [outputs, setOutputs] = useState<string[]>([]);

  // Section IV: Tugas Esok Hari (Planning)
  const [q1Tomorrow, setQ1Tomorrow] = useState<TaskItem[]>([]);
  const [q2Tomorrow, setQ2Tomorrow] = useState<TaskItem[]>([]);
  const [q3Tomorrow, setQ3Tomorrow] = useState<TaskItem[]>([]);

  // Section V: Refleksi & Evaluasi
  const [learning, setLearning] = useState("");
  const [obstacles, setObstacles] = useState("");
  const [notes, setNotes] = useState("");

  // Temporary inputs
  const [tempQ1Today, setTempQ1Today] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 120, desc: "", attachment: null });
  const [tempQ2Today, setTempQ2Today] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 60, desc: "", attachment: null });
  const [tempQ3Today, setTempQ3Today] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 30, desc: "", attachment: null });
  
  const [tempTimeLog, setTempTimeLog] = useState({ start: "09:00", end: "10:00", activity: "" });
  const [tempOutput, setTempOutput] = useState("");
  
  const [tempQ1Tomorrow, setTempQ1Tomorrow] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 120, desc: "", attachment: null });
  const [tempQ2Tomorrow, setTempQ2Tomorrow] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 60, desc: "", attachment: null });
  const [tempQ3Tomorrow, setTempQ3Tomorrow] = useState<{ task: string; duration: number; desc: string; attachment?: { name: string; url: string } | null }>({ task: "", duration: 30, desc: "", attachment: null });

  // Upload States for items
  const [uploadingItem, setUploadingItem] = useState<{ [key: string]: boolean }>({});

  // --- Drag & Drop, Editing, Bulk addition, and Dual actions States ---
  const [draggedItem, setDraggedItem] = useState<{ index: number; sourceCategory: "q1" | "q2" | "q3"; type: "today" | "tomorrow" } | null>(null);
  const [editingItem, setEditingItem] = useState<{ index: number; category: "q1" | "q2" | "q3"; type: "today" | "tomorrow"; task: string; duration: number; desc: string } | null>(null);
  const [bulkAddList, setBulkAddList] = useState<{ category: "q1" | "q2" | "q3"; type: "today" | "tomorrow"; items: { task: string; duration: number; desc: string }[] } | null>(null);
  const [historySubTab, setHistorySubTab] = useState<"skala" | "laporan">("skala");

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number, sourceCategory: "q1" | "q2" | "q3", type: "today" | "tomorrow") => {
    setDraggedItem({ index, sourceCategory, type });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetCategory: "q1" | "q2" | "q3", type: "today" | "tomorrow") => {
    e.preventDefault();
    if (!draggedItem || draggedItem.type !== type) return;

    const { index, sourceCategory } = draggedItem;
    if (sourceCategory === targetCategory) return;

    let sourceList = sourceCategory === "q1" 
      ? (type === "today" ? q1Today : q1Tomorrow) 
      : sourceCategory === "q2" 
        ? (type === "today" ? q2Today : q2Tomorrow) 
        : (type === "today" ? q3Today : q3Tomorrow);

    const itemToMove = sourceList[index];
    const newSourceList = [...sourceList];
    newSourceList.splice(index, 1);

    let targetList = targetCategory === "q1" 
      ? (type === "today" ? q1Today : q1Tomorrow) 
      : targetCategory === "q2" 
        ? (type === "today" ? q2Today : q2Tomorrow) 
        : (type === "today" ? q3Today : q3Tomorrow);

    const newTargetList = [...targetList, itemToMove];

    if (type === "today") {
      if (sourceCategory === "q1") setQ1Today(newSourceList);
      else if (sourceCategory === "q2") setQ2Today(newSourceList);
      else setQ3Today(newSourceList);

      if (targetCategory === "q1") setQ1Today(newTargetList);
      else if (targetCategory === "q2") setQ2Today(newTargetList);
      else setQ3Today(newTargetList);
    } else {
      if (sourceCategory === "q1") setQ1Tomorrow(newSourceList);
      else if (sourceCategory === "q2") setQ2Tomorrow(newSourceList);
      else setQ3Tomorrow(newSourceList);

      if (targetCategory === "q1") setQ1Tomorrow(newTargetList);
      else if (targetCategory === "q2") setQ2Tomorrow(newTargetList);
      else setQ3Tomorrow(newTargetList);
    }

    setDraggedItem(null);
  };

  // Edit handlers
  const startEditTask = (index: number, category: "q1" | "q2" | "q3", type: "today" | "tomorrow", item: TaskItem) => {
    setEditingItem({ index, category, type, task: item.task, duration: item.duration, desc: item.desc });
  };

  const saveEditTask = () => {
    if (!editingItem) return;
    const { index, category, type, task, duration, desc } = editingItem;

    let list = category === "q1" 
      ? (type === "today" ? q1Today : q1Tomorrow) 
      : category === "q2" 
        ? (type === "today" ? q2Today : q2Tomorrow) 
        : (type === "today" ? q3Today : q3Tomorrow);

    const updatedList = [...list];
    updatedList[index] = { ...updatedList[index], task, duration, desc };

    if (type === "today") {
      if (category === "q1") setQ1Today(updatedList);
      else if (category === "q2") setQ2Today(updatedList);
      else setQ3Today(updatedList);
    } else {
      if (category === "q1") setQ1Tomorrow(updatedList);
      else if (category === "q2") setQ2Tomorrow(updatedList);
      else setQ3Tomorrow(updatedList);
    }

    setEditingItem(null);
  };

  // Bulk add handlers
  const handleBulkAddSave = () => {
    if (!bulkAddList) return;
    const { category, type, items } = bulkAddList;
    
    // Filter out empty tasks
    const newTasks: TaskItem[] = items.filter(item => item.task.trim() !== "").map(item => ({
      task: item.task,
      duration: item.duration || (category === "q1" ? 120 : category === "q2" ? 60 : 30),
      desc: item.desc,
      attachment: null,
    }));

    let list = category === "q1" 
      ? (type === "today" ? q1Today : q1Tomorrow) 
      : category === "q2" 
        ? (type === "today" ? q2Today : q2Tomorrow) 
        : (type === "today" ? q3Today : q3Tomorrow);

    const updatedList = [...list, ...newTasks];

    if (type === "today") {
      if (category === "q1") setQ1Today(updatedList);
      else if (category === "q2") setQ2Today(updatedList);
      else setQ3Today(updatedList);
    } else {
      if (category === "q1") setQ1Tomorrow(updatedList);
      else if (category === "q2") setQ2Tomorrow(updatedList);
      else setQ3Tomorrow(updatedList);
    }

    setBulkAddList(null);
  };

  // --- Riwayat States ---
  const [historyList, setHistoryList] = useState<SavedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedReport | null>(null);

  // Set default date to today in Jakarta time
  useEffect(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
    setReportDate(localISOTime);
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "riwayat" && isAdmin) {
      fetchHistory();
    }
  }, [activeTab, filterUser, filterDate]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsersList(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      let url = "/api/laporan-harian";
      const params = new URLSearchParams();
      if (filterUser) params.append("userId", filterUser);
      if (filterDate) params.append("date", filterDate);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        setHistoryList(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch reports history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper: Format Date Indon Capitalized
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${daysIndo[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Helper: Time Duration log calculation
  const getDurationStr = (start: string, end: string) => {
    if (!start || !end) return "";
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight fallback
    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return `durasi ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;
  };

  // Item Upload Helper
  const handleItemFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, inputKey: string, setTemp: any, currentTemp: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingItem(prev => ({ ...prev, [inputKey]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?category=Laporan Harian", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setTemp({ ...currentTemp, attachment: { name: file.name, url: data.url } });
      } else {
        alert(data.error || "Gagal mengunggah berkas");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah berkas.");
    } finally {
      setUploadingItem(prev => ({ ...prev, [inputKey]: false }));
    }
  };

  // Add Item Helpers
  const addTask = (q: "q1" | "q2" | "q3", day: "today" | "tomorrow") => {
    let temp = q === "q1" ? (day === "today" ? tempQ1Today : tempQ1Tomorrow) : q === "q2" ? (day === "today" ? tempQ2Today : tempQ2Tomorrow) : (day === "today" ? tempQ3Today : tempQ3Tomorrow);
    let setTemp = q === "q1" ? (day === "today" ? setTempQ1Today : setTempQ1Tomorrow) : q === "q2" ? (day === "today" ? setTempQ2Today : setTempQ2Tomorrow) : (day === "today" ? setTempQ3Today : setTempQ3Tomorrow);

    if (!temp.task) {
      alert("Isi nama tugas.");
      return;
    }
    const item: TaskItem = { task: temp.task, duration: temp.duration, desc: temp.desc, attachment: temp.attachment };
    if (day === "today") {
      if (q === "q1") { setQ1Today([...q1Today, item]); setTempQ1Today({ task: "", duration: 120, desc: "", attachment: null }); }
      else if (q === "q2") { setQ2Today([...q2Today, item]); setTempQ2Today({ task: "", duration: 60, desc: "", attachment: null }); }
      else { setQ3Today([...q3Today, item]); setTempQ3Today({ task: "", duration: 30, desc: "", attachment: null }); }
    } else {
      if (q === "q1") { setQ1Tomorrow([...q1Tomorrow, item]); setTempQ1Tomorrow({ task: "", duration: 120, desc: "", attachment: null }); }
      else if (q === "q2") { setQ2Tomorrow([...q2Tomorrow, item]); setTempQ2Tomorrow({ task: "", duration: 60, desc: "", attachment: null }); }
      else { setQ3Tomorrow([...q3Tomorrow, item]); setTempQ3Tomorrow({ task: "", duration: 30, desc: "", attachment: null }); }
    }
  };

  const addTimeLog = () => {
    if (!tempTimeLog.activity) {
      alert("Isi aktivitas.");
      return;
    }
    setTimeLogs([...timeLogs, { start: tempTimeLog.start, end: tempTimeLog.end, duration: getDurationStr(tempTimeLog.start, tempTimeLog.end), activity: tempTimeLog.activity }]);
    setTempTimeLog({ start: tempTimeLog.end, end: tempTimeLog.end, activity: "" });
  };

  const addOutput = () => {
    if (!tempOutput) return;
    setOutputs([...outputs, tempOutput]);
    setTempOutput("");
  };

  // Copy today's plan to tomorrow
  const copyPlanToTomorrow = () => {
    setQ1Tomorrow([...q1Today]);
    setQ2Tomorrow([...q2Today]);
    setQ3Tomorrow([...q3Today]);
  };

  // Copy tomorrow's plan to today (in case of consecutive entries)
  const copyTomorrowToToday = () => {
    setQ1Today([...q1Tomorrow]);
    setQ2Today([...q2Tomorrow]);
    setQ3Today([...q3Tomorrow]);
  };

  // Format Whatsapp Block Output
  const generateFormattedText = (
    name: string,
    date: string,
    q1T: TaskItem[],
    q2T: TaskItem[],
    q3T: TaskItem[],
    logs: TimeLog[],
    outs: string[],
    q1Tom: TaskItem[],
    q2Tom: TaskItem[],
    q3Tom: TaskItem[],
    learn: string,
    ob: string,
    msg: string,
    onlyScale = false
  ) => {
    let text = `*LAPORAN AKTIFITAS HARIAN*\n\n`;
    text += `Nama: ${name || "Staf"}\n`;
    text += `Hari/tanggal: ${formatDateIndo(date)}\n\n`;

    text += `I. *Skala Prioritas (_On Duty_)*\n\n`;
    text += `*Q1:*\n`;
    if (q1T.length === 0) text += `- -\n`;
    else q1T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q2:*\n`;
    if (q2T.length === 0) text += `- -\n`;
    else q2T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q3:*\n`;
    if (q3T.length === 0) text += `- -\n`;
    else q3T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    if (onlyScale) {
      return text;
    }

    text += `\nII. *Rincian Kegiatan (Log Waktu)*\n\n`;
    if (logs.length === 0) text += `- -\n`;
    else {
      logs.forEach((log, i) => {
        text += `${i + 1}. ${log.start} WIB - ${log.end} WIB _${getDurationStr(log.start, log.end)}_ = ${log.activity}\n`;
      });
    }

    text += `\nIII. *Hasil Kerja (Output hari ini)*\n\n`;
    if (outs.length === 0) text += `- -\n`;
    else outs.forEach((out, i) => { text += `${i + 1}. ${out}\n`; });

    text += `\nIV. *Tugas Esok Hari (_Planning_)*\n\n`;
    text += `*Q1:*\n`;
    if (q1Tom.length === 0) text += `- -\n`;
    else q1Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q2:*\n`;
    if (q2Tom.length === 0) text += `- -\n`;
    else q2Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q3:*\n`;
    if (q3Tom.length === 0) text += `- -\n`;
    else q3Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\nV. *Refleksi & Evaluasi Hari ini*\n\n`;
    text += `1. Hal baru yang dipelajari : ${learn || "-"}\n`;
    text += `2. Hambatan yang ditemui : ${ob || "-"}\n`;
    text += `3. Pesan/kesan/catatan lainnya : ${msg || "-"}\n`;

    return text;
  };

  const handleCopyText = (onlyScale = false) => {
    const rawText = generateFormattedText(
      user?.name || "Staf",
      reportDate,
      q1Today,
      q2Today,
      q3Today,
      timeLogs,
      outputs,
      q1Tomorrow,
      q2Tomorrow,
      q3Tomorrow,
      learning,
      obstacles,
      notes,
      onlyScale
    );
    navigator.clipboard.writeText(rawText);
    alert(onlyScale ? "Teks Skala Prioritas berhasil disalin ke clipboard!" : "Teks Laporan Lengkap berhasil disalin ke clipboard!");
  };

  // Submit / Save Laporan
  const handleSaveReport = async (onlyScale = false) => {
    const reportType = onlyScale ? "Skala Prioritas" : "Laporan Lengkap";
    if (!confirm(`Apakah Anda yakin ingin mengirim ${reportType} ini ke database?`)) return;

    // Collect all documents/attachments uploaded per priority task
    const allDocs: { name: string; url: string }[] = [];
    const collectDocs = (list: TaskItem[]) => {
      list.forEach(item => {
        if (item.attachment) {
          allDocs.push(item.attachment);
        }
      });
    };
    collectDocs(q1Today);
    collectDocs(q2Today);
    collectDocs(q3Today);
    collectDocs(q1Tomorrow);
    collectDocs(q2Tomorrow);
    collectDocs(q3Tomorrow);

    const payload = {
      date: reportDate,
      prioritas: { q1: q1Today, q2: q2Today, q3: q3Today },
      rincianKegiatan: timeLogs,
      hasilKerja: outputs,
      tugasEsok: { q1: q1Tomorrow, q2: q2Tomorrow, q3: q3Tomorrow },
      refleksi: { learning, obstacles, notes },
      documents: allDocs,
    };

    try {
      const res = await fetch("/api/laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        // Copy the clipboard text in the selected format
        const rawText = generateFormattedText(
          user?.name || "Staf",
          reportDate,
          q1Today,
          q2Today,
          q3Today,
          timeLogs,
          outputs,
          q1Tomorrow,
          q2Tomorrow,
          q3Tomorrow,
          learning,
          obstacles,
          notes,
          onlyScale
        );
        navigator.clipboard.writeText(rawText);

        alert(`Laporan Aktivitas Harian berhasil disimpan ke database dan teks ${reportType} telah disalin ke clipboard!`);
        if (isAdmin) {
          setActiveTab("riwayat");
        } else {
          // Reset Form
          setQ1Today([]); setQ2Today([]); setQ3Today([]);
          setTimeLogs([]); setOutputs([]);
          setQ1Tomorrow([]); setQ2Tomorrow([]); setQ3Tomorrow([]);
          setLearning(""); setObstacles(""); setNotes("");
        }
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan laporan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat menyimpan laporan.");
    }
  };

  // Delete DB Report
  const handleDeleteReport = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) return;
    try {
      const res = await fetch(`/api/laporan-harian?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchHistory();
        if (selectedHistoryItem?.id === id) {
          setSelectedHistoryItem(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-wider">Laporan Aktivitas Harian</h1>
          <p className="text-xs text-gray-500">Tulis, salin, dan simpan laporan log aktivitas harian Anda.</p>
        </div>

        {/* Tab Headers (Only Admin sees the Riwayat tab) */}
        {isAdmin && (
          <div className="flex border border-gray-200 dark:border-gray-800 rounded-xl p-1 bg-gray-50 dark:bg-white/[0.02]">
            <button
              onClick={() => setActiveTab("buat")}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === "buat"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Buat Laporan
            </button>
            <button
              onClick={() => setActiveTab("riwayat")}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition ${
                activeTab === "riwayat"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-gray-500 hover:text-black dark:hover:text-white"
              }`}
            >
              Riwayat
            </button>
          </div>
        )}
      </div>

      {activeTab === "buat" ? (
        <div className="space-y-6">
          {/* General Data Card */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">Informasi Umum</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nama Karyawan</label>
                <input
                  type="text"
                  disabled
                  value={user?.name || ""}
                  className="w-full bg-gray-55 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tanggal Laporan (Hari Ini)</label>
                <div className="w-full bg-gray-55 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-black text-gray-600 dark:text-gray-400 capitalize">
                  {formatDateIndo(reportDate) || "Memuat..."}
                </div>
              </div>
            </div>
          </div>

          {/* Section I: Skala Prioritas Today */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">I. Skala Prioritas (Hari Ini)</h2>
              {q1Tomorrow.length > 0 && (
                <button
                  type="button"
                  onClick={copyTomorrowToToday}
                  className="text-[10px] font-black text-brand-500 hover:underline uppercase"
                >
                  Salin Plan Kemarin
                </button>
              )}
            </div>

            {/* Q1/Q2/Q3 Forms */}
            {(["q1", "q2", "q3"] as const).map((q) => {
              const label = q === "q1" ? "Q1 (Tinggi / Mendesak)" : q === "q2" ? "Q2 (Sedang / Penting)" : "Q3 (Rendah / Rutinitas)";
              const list = q === "q1" ? q1Today : q === "q2" ? q2Today : q3Today;
              const temp = q === "q1" ? tempQ1Today : q === "q2" ? tempQ2Today : tempQ3Today;
              const setTemp = q === "q1" ? setTempQ1Today : q === "q2" ? setTempQ2Today : setTempQ3Today;
              
              const removeTask = (idx: number) => {
                const copy = [...list];
                copy.splice(idx, 1);
                if (q === "q1") setQ1Today(copy);
                else if (q === "q2") setQ2Today(copy);
                else setQ3Today(copy);
              };

              const uploadKey = `today-${q}`;

              return (
                <div 
                  key={q} 
                  className="space-y-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, q, "today")}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                    <button
                      type="button"
                      onClick={() => setBulkAddList({ category: q, type: "today", items: [{ task: "", duration: q === "q1" ? 120 : q === "q2" ? 60 : 30, desc: "" }] })}
                      className="text-[10px] font-black text-brand-500 hover:underline uppercase cursor-pointer"
                    >
                      + Tambah Beberapa
                    </button>
                  </div>

                  <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-dashed border-gray-250 dark:border-gray-800 min-h-[60px] transition-colors">
                    {list.length > 0 ? (
                      list.map((item, idx) => {
                        const isEditing = editingItem?.index === idx && editingItem?.category === q && editingItem?.type === "today";
                        return (
                          <div 
                            key={idx}
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, idx, q, "today")}
                            className={`flex justify-between items-start gap-4 text-xs bg-white dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-500 transition-all ${
                              draggedItem?.index === idx && draggedItem?.sourceCategory === q && draggedItem?.type === "today" ? "opacity-40" : ""
                            }`}
                          >
                            {isEditing ? (
                              <div className="w-full space-y-3">
                                <input
                                  type="text"
                                  value={editingItem.task}
                                  onChange={(e) => setEditingItem({ ...editingItem, task: e.target.value })}
                                  className="w-full bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                  placeholder="Nama tugas..."
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={editingItem.duration || ""}
                                    onChange={(e) => setEditingItem({ ...editingItem, duration: parseInt(e.target.value) || 0 })}
                                    className="w-24 bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                    placeholder="Menit"
                                  />
                                  <input
                                    type="text"
                                    value={editingItem.desc}
                                    onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                                    className="flex-1 bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                    placeholder="Keterangan..."
                                  />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={saveEditTask}
                                    className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-750 dark:text-gray-300">
                                  {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "-"}</span>
                                  {item.attachment && (
                                    <a
                                      href={item.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-1.5 py-0.5 bg-brand-500/10 text-brand-650 hover:underline border border-brand-500/20 text-[9px] font-bold rounded ml-2"
                                    >
                                      Berkas: {item.attachment.name}
                                    </a>
                                  )}
                                </span>
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  <button
                                    onClick={() => startEditTask(idx, q, "today", item)}
                                    className="text-amber-500 hover:text-amber-600 cursor-pointer"
                                    title="Ubah Tugas"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                  </button>
                                  <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0 cursor-pointer">
                                    <TrashBinIcon />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] italic text-gray-400 block text-center py-4">
                        Belum ada tugas. Geser tugas ke sini atau gunakan input di bawah.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Nama Tugas..."
                      value={temp.task}
                      onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                      className="sm:col-span-4 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Menit..."
                      value={temp.duration || ""}
                      onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                      className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={temp.desc}
                      onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                      className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    
                    {/* Item Document Upload */}
                    <div className="sm:col-span-2 relative flex items-center justify-center">
                      <input
                        type="file"
                        id={`file-upload-${uploadKey}`}
                        onChange={(e) => handleItemFileUpload(e, uploadKey, setTemp, temp)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`file-upload-${uploadKey}`}
                        className={`w-full text-center border border-dashed border-gray-300 dark:border-gray-700 py-3 rounded-xl text-xs font-bold text-gray-500 hover:border-brand-500 cursor-pointer truncate ${
                          uploadingItem[uploadKey] ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingItem[uploadKey] ? "..." : temp.attachment ? `✓ ${temp.attachment.name}` : "Berkas (Opsional)"}
                      </label>
                    </div>

                    <button
                      onClick={() => addTask(q, "today")}
                      className="sm:col-span-1 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl p-3 cursor-pointer shadow-sm active:scale-95 transition-transform"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section II: Time Log */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">II. Rincian Kegiatan (Log Waktu)</h2>
            
            {timeLogs.length > 0 && (
              <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {timeLogs.map((log, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-750 dark:text-gray-300">
                      {idx + 1}. {log.start} - {log.end} ({getDurationStr(log.start, log.end)}) = {log.activity}
                    </span>
                    <button
                      onClick={() => {
                        const copy = [...timeLogs];
                        copy.splice(idx, 1);
                        setTimeLogs(copy);
                      }}
                      className="text-rose-500 hover:text-rose-600 flex-shrink-0"
                    >
                      <TrashBinIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="time"
                value={tempTimeLog.start}
                onChange={(e) => setTempTimeLog({ ...tempTimeLog, start: e.target.value })}
                className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
              />
              <span className="sm:col-span-1 flex items-center justify-center text-gray-400 text-xs">s/d</span>
              <input
                type="time"
                value={tempTimeLog.end}
                onChange={(e) => setTempTimeLog({ ...tempTimeLog, end: e.target.value })}
                className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
              />
              <input
                type="text"
                placeholder="Detail kegiatan..."
                value={tempTimeLog.activity}
                onChange={(e) => setTempTimeLog({ ...tempTimeLog, activity: e.target.value })}
                className="sm:col-span-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
              />
              <button
                onClick={addTimeLog}
                className="sm:col-span-1 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl p-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          {/* Section III: Hasil Kerja */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">III. Hasil Kerja (Output Hari Ini)</h2>
            
            {outputs.length > 0 && (
              <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                {outputs.map((out, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-750 dark:text-gray-300">
                      {idx + 1}. {out}
                    </span>
                    <button
                      onClick={() => {
                        const copy = [...outputs];
                        copy.splice(idx, 1);
                        setOutputs(copy);
                      }}
                      className="text-rose-500 hover:text-rose-600 flex-shrink-0"
                    >
                      <TrashBinIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Hasil kerja/output..."
                value={tempOutput}
                onChange={(e) => setTempOutput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addOutput(); }}
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
              />
              <button
                onClick={addOutput}
                className="bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl px-4 py-2 cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                <PlusIcon />
              </button>
            </div>
          </div>

          {/* Section IV: Tugas Esok Hari */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">IV. Tugas Esok Hari (Planning)</h2>
              <button
                type="button"
                onClick={copyPlanToTomorrow}
                className="text-[10px] font-black text-brand-500 hover:underline uppercase"
              >
                Salin Plan Hari Ini
              </button>
            </div>

            {/* Q1/Q2/Q3 Forms */}
            {(["q1", "q2", "q3"] as const).map((q) => {
              const label = q === "q1" ? "Q1 (Tinggi / Mendesak)" : q === "q2" ? "Q2 (Sedang / Penting)" : "Q3 (Rendah / Rutinitas)";
              const list = q === "q1" ? q1Tomorrow : q === "q2" ? q2Tomorrow : q3Tomorrow;
              const temp = q === "q1" ? tempQ1Tomorrow : q === "q2" ? tempQ2Tomorrow : tempQ3Tomorrow;
              const setTemp = q === "q1" ? setTempQ1Tomorrow : q === "q2" ? setTempQ2Tomorrow : setTempQ3Tomorrow;
              
              const removeTask = (idx: number) => {
                const copy = [...list];
                copy.splice(idx, 1);
                if (q === "q1") setQ1Tomorrow(copy);
                else if (q === "q2") setQ2Tomorrow(copy);
                else setQ3Tomorrow(copy);
              };

              const uploadKey = `tomorrow-${q}`;

              return (
                <div 
                  key={q} 
                  className="space-y-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, q, "tomorrow")}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                    <button
                      type="button"
                      onClick={() => setBulkAddList({ category: q, type: "tomorrow", items: [{ task: "", duration: q === "q1" ? 120 : q === "q2" ? 60 : 30, desc: "" }] })}
                      className="text-[10px] font-black text-brand-500 hover:underline uppercase cursor-pointer"
                    >
                      + Tambah Beberapa
                    </button>
                  </div>

                  <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-dashed border-gray-250 dark:border-gray-800 min-h-[60px] transition-colors">
                    {list.length > 0 ? (
                      list.map((item, idx) => {
                        const isEditing = editingItem?.index === idx && editingItem?.category === q && editingItem?.type === "tomorrow";
                        return (
                          <div 
                            key={idx}
                            draggable={!isEditing}
                            onDragStart={(e) => handleDragStart(e, idx, q, "tomorrow")}
                            className={`flex justify-between items-start gap-4 text-xs bg-white dark:bg-gray-900/60 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-500 transition-all ${
                              draggedItem?.index === idx && draggedItem?.sourceCategory === q && draggedItem?.type === "tomorrow" ? "opacity-40" : ""
                            }`}
                          >
                            {isEditing ? (
                              <div className="w-full space-y-3">
                                <input
                                  type="text"
                                  value={editingItem.task}
                                  onChange={(e) => setEditingItem({ ...editingItem, task: e.target.value })}
                                  className="w-full bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                  placeholder="Nama tugas..."
                                />
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    value={editingItem.duration || ""}
                                    onChange={(e) => setEditingItem({ ...editingItem, duration: parseInt(e.target.value) || 0 })}
                                    className="w-24 bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                    placeholder="Menit"
                                  />
                                  <input
                                    type="text"
                                    value={editingItem.desc}
                                    onChange={(e) => setEditingItem({ ...editingItem, desc: e.target.value })}
                                    className="flex-1 bg-gray-55 dark:bg-gray-850 border border-gray-200 dark:border-gray-800 px-4 py-2 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold text-black dark:text-white"
                                    placeholder="Keterangan..."
                                  />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                  <button
                                    onClick={saveEditTask}
                                    className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-[10px] font-black uppercase cursor-pointer"
                                  >
                                    Simpan
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="font-semibold text-gray-750 dark:text-gray-300">
                                  {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "-"}</span>
                                  {item.attachment && (
                                    <a
                                      href={item.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-1.5 py-0.5 bg-brand-500/10 text-brand-650 hover:underline border border-brand-500/20 text-[9px] font-bold rounded ml-2"
                                    >
                                      Berkas: {item.attachment.name}
                                    </a>
                                  )}
                                </span>
                                <div className="flex items-center gap-2.5 flex-shrink-0">
                                  <button
                                    onClick={() => startEditTask(idx, q, "tomorrow", item)}
                                    className="text-amber-500 hover:text-amber-600 cursor-pointer"
                                    title="Ubah Tugas"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                    </svg>
                                  </button>
                                  <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0 cursor-pointer">
                                    <TrashBinIcon />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] italic text-gray-400 block text-center py-4">
                        Belum ada tugas. Geser tugas ke sini atau gunakan input di bawah.
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Nama Tugas..."
                      value={temp.task}
                      onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                      className="sm:col-span-4 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Menit..."
                      value={temp.duration || ""}
                      onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                      className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={temp.desc}
                      onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                      className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 px-4 py-3 rounded-xl text-sm outline-none focus:border-brand-500 font-semibold"
                    />
                    
                    {/* Item Document Upload */}
                    <div className="sm:col-span-2 relative flex items-center justify-center">
                      <input
                        type="file"
                        id={`file-upload-${uploadKey}`}
                        onChange={(e) => handleItemFileUpload(e, uploadKey, setTemp, temp)}
                        className="hidden"
                      />
                      <label
                        htmlFor={`file-upload-${uploadKey}`}
                        className={`w-full text-center border border-dashed border-gray-300 dark:border-gray-700 py-3 rounded-xl text-xs font-bold text-gray-500 hover:border-brand-500 cursor-pointer truncate ${
                          uploadingItem[uploadKey] ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingItem[uploadKey] ? "..." : temp.attachment ? `✓ ${temp.attachment.name}` : "Berkas (Opsional)"}
                      </label>
                    </div>

                    <button
                      onClick={() => addTask(q, "tomorrow")}
                      className="sm:col-span-1 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl p-3 cursor-pointer shadow-sm active:scale-95 transition-transform"
                    >
                      <PlusIcon />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section V: Refleksi */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
            <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">V. Refleksi & Evaluasi</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hal baru yang dipelajari</label>
                <textarea
                  rows={2}
                  value={learning}
                  onChange={(e) => setLearning(e.target.value)}
                  placeholder="Apa hal baru hari ini?..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-black dark:text-white focus:border-brand-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Hambatan yang ditemui</label>
                <textarea
                  rows={2}
                  value={obstacles}
                  onChange={(e) => setObstacles(e.target.value)}
                  placeholder="Kendala/hambatan kerja hari ini?..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-black dark:text-white focus:border-brand-500 outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Pesan/Kesan/Catatan lainnya</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-semibold text-black dark:text-white focus:border-brand-500 outline-none resize-none"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <button
              type="button"
              onClick={() => handleCopyText(true)}
              className="w-full bg-gray-100 dark:bg-white/10 text-black dark:text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Salin Skala
            </button>
            <button
              type="button"
              onClick={() => handleCopyText(false)}
              className="w-full bg-gray-100 dark:bg-white/10 text-black dark:text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Salin Laporan
            </button>
            <button
              type="button"
              onClick={() => handleSaveReport(true)}
              className="w-full bg-amber-500 text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-amber-600 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Kirim Skala
            </button>
            <button
              type="button"
              onClick={() => handleSaveReport(false)}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-[10px] hover:bg-brand-650 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Kirim Laporan
            </button>
          </div>

          {/* Bulk Add Modal with Dynamic Inputs */}
          {bulkAddList && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-3xl w-full p-6 space-y-4 animate-in zoom-in-95 duration-250 my-auto">
                <div>
                  <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                    Tambah Beberapa Tugas ({bulkAddList.category.toUpperCase()} - {bulkAddList.type === "today" ? "Hari Ini" : "Esok Hari"})
                  </h3>
                  <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                    Masukkan detail tugas untuk setiap baris
                  </p>
                </div>
                
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                  {bulkAddList.items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nama Tugas..."
                        value={item.task}
                        onChange={(e) => {
                          const newItems = [...bulkAddList.items];
                          newItems[idx].task = e.target.value;
                          setBulkAddList({ ...bulkAddList, items: newItems });
                        }}
                        className="sm:col-span-5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-brand-500 outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Menit"
                        value={item.duration || ""}
                        onChange={(e) => {
                          const newItems = [...bulkAddList.items];
                          newItems[idx].duration = parseInt(e.target.value) || 0;
                          setBulkAddList({ ...bulkAddList, items: newItems });
                        }}
                        className="sm:col-span-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-brand-500 outline-none"
                      />
                      <div className="sm:col-span-5 flex gap-2">
                        <input
                          type="text"
                          placeholder="Keterangan..."
                          value={item.desc}
                          onChange={(e) => {
                            const newItems = [...bulkAddList.items];
                            newItems[idx].desc = e.target.value;
                            setBulkAddList({ ...bulkAddList, items: newItems });
                          }}
                          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-brand-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newItems = bulkAddList.items.filter((_, i) => i !== idx);
                            setBulkAddList({ ...bulkAddList, items: newItems });
                          }}
                          className="text-rose-500 hover:text-rose-600 px-2 cursor-pointer transition-colors"
                          title="Hapus Baris"
                        >
                          <TrashBinIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulkAddList({
                        ...bulkAddList,
                        items: [...bulkAddList.items, { task: "", duration: bulkAddList.category === "q1" ? 120 : bulkAddList.category === "q2" ? 60 : 30, desc: "" }]
                      });
                    }}
                    className="text-[10px] font-black text-brand-500 uppercase tracking-wider hover:text-brand-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <PlusIcon /> Tambah Baris
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkAddList(null)}
                      className="bg-gray-150 dark:bg-white/10 text-black dark:text-white px-4 py-2 font-bold uppercase tracking-widest text-[9px] rounded-xl hover:bg-gray-250 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkAddSave}
                      className="bg-brand-500 text-white px-4 py-2 font-bold uppercase tracking-widest text-[9px] rounded-xl hover:bg-brand-600 cursor-pointer"
                    >
                      Simpan Tugas
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- Riwayat Tab Panel (Admins Only) --- */
        isAdmin && (
          <div className="space-y-6">
            {/* History Filters & Sub-Tabs */}
            <div className="flex flex-col gap-4 bg-white dark:bg-white/[0.02] p-5 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
              <div className="flex border-b border-gray-150 dark:border-gray-800 mb-2">
                <button
                  type="button"
                  onClick={() => setHistorySubTab("skala")}
                  className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    historySubTab === "skala"
                      ? "border-brand-500 text-brand-500 font-bold"
                      : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Skala Prioritas
                </button>
                <button
                  type="button"
                  onClick={() => setHistorySubTab("laporan")}
                  className={`pb-2.5 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    historySubTab === "laporan"
                      ? "border-brand-500 text-brand-500 font-bold"
                      : "border-transparent text-gray-500 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Laporan Harian
                </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                  {/* User filter for Admins */}
                  <div className="flex items-center gap-2 border border-gray-250 dark:border-gray-800 px-3 py-2 rounded-xl bg-white dark:bg-transparent">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Karyawan:</span>
                    <select
                      value={filterUser}
                      onChange={(e) => setFilterUser(e.target.value)}
                      className="bg-transparent text-xs font-bold text-black dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">Semua</option>
                      {usersList.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Filter */}
                  <div className="flex items-center gap-2 border border-gray-250 dark:border-gray-800 px-3 py-2 rounded-xl bg-white dark:bg-transparent">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tanggal:</span>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="bg-transparent text-xs font-bold text-black dark:text-white outline-none cursor-pointer"
                    />
                    {filterDate && (
                      <button onClick={() => setFilterDate("")} className="text-xs text-gray-400 font-bold hover:text-brand-500">×</button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reports List */}
            {historyLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800/40 rounded-2xl"></div>
                ))}
              </div>
            ) : historyList.length > 0 ? (
              historySubTab === "skala" ? (
                /* SKALA PRIORITAS VIEW */
                <div className="grid grid-cols-1 gap-6">
                  {historyList.map((item) => {
                    let q1List: TaskItem[] = [];
                    let q2List: TaskItem[] = [];
                    let q3List: TaskItem[] = [];
                    try {
                      const prio = JSON.parse(item.prioritas);
                      q1List = prio.q1 || [];
                      q2List = prio.q2 || [];
                      q3List = prio.q3 || [];
                    } catch (e) {}

                    return (
                      <div key={item.id} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-150 dark:border-gray-800 pb-2">
                          <span className="text-[11px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                            <UserCircleIcon />
                            {item.user.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-450 capitalize">
                            {formatDateIndo(item.tanggal)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          {/* Q1 */}
                          <div className="space-y-2 bg-red-500/[0.03] dark:bg-red-500/[0.01] p-3 rounded-xl border border-red-500/10">
                            <span className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider block border-b border-red-500/10 pb-1">Q1 (Tinggi / Mendesak)</span>
                            {q1List.length > 0 ? (
                              <ol className="list-decimal pl-4 space-y-1.5 mt-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                {q1List.map((t, idx) => (
                                  <li key={idx}>
                                    {t.task} ({t.duration}m) - <span className="italic text-gray-400 font-medium">{t.desc || "-"}</span>
                                    {t.attachment && <a href={t.attachment.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand-500">📎</a>}
                                  </li>
                                ))}
                              </ol>
                            ) : <span className="text-[10px] text-gray-400 italic pl-1 block py-1">-</span>}
                          </div>

                          {/* Q2 */}
                          <div className="space-y-2 bg-blue-500/[0.03] dark:bg-blue-500/[0.01] p-3 rounded-xl border border-blue-500/10">
                            <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block border-b border-blue-500/10 pb-1">Q2 (Sedang / Penting)</span>
                            {q2List.length > 0 ? (
                              <ol className="list-decimal pl-4 space-y-1.5 mt-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                {q2List.map((t, idx) => (
                                  <li key={idx}>
                                    {t.task} ({t.duration}m) - <span className="italic text-gray-400 font-medium">{t.desc || "-"}</span>
                                    {t.attachment && <a href={t.attachment.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand-500">📎</a>}
                                  </li>
                                ))}
                              </ol>
                            ) : <span className="text-[10px] text-gray-400 italic pl-1 block py-1">-</span>}
                          </div>

                          {/* Q3 */}
                          <div className="space-y-2 bg-gray-50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                            <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider block border-b border-gray-200 dark:border-gray-800 pb-1">Q3 (Rendah / Rutinitas)</span>
                            {q3List.length > 0 ? (
                              <ol className="list-decimal pl-4 space-y-1.5 mt-1.5 font-semibold text-gray-700 dark:text-gray-300">
                                {q3List.map((t, idx) => (
                                  <li key={idx}>
                                    {t.task} ({t.duration}m) - <span className="italic text-gray-400 font-medium">{t.desc || "-"}</span>
                                    {t.attachment && <a href={t.attachment.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand-500">📎</a>}
                                  </li>
                                ))}
                              </ol>
                            ) : <span className="text-[10px] text-gray-400 italic pl-1 block py-1">-</span>}
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/60">
                          <button
                            onClick={() => handleDeleteReport(item.id)}
                            className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase cursor-pointer"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={() => setSelectedHistoryItem(item)}
                            className="text-[10px] font-black text-brand-500 hover:text-brand-600 uppercase cursor-pointer"
                          >
                            Rincian
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* LAPORAN HARIAN VIEW (SEMI-CARD TABLE) */
                <div className="flex flex-col gap-3">
                  <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-gray-800">
                    <div className="col-span-3">Karyawan</div>
                    <div className="col-span-3">Tanggal</div>
                    <div className="col-span-4">Ringkasan Output</div>
                    <div className="col-span-2 text-right">Aksi</div>
                  </div>
                  {historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 md:px-5 md:py-4 rounded-xl shadow-sm hover:border-brand-500 transition-all cursor-pointer"
                    >
                      <div className="md:col-span-3 flex items-center gap-2">
                        <UserCircleIcon />
                        <span className="text-[11px] font-black text-brand-500 uppercase tracking-widest truncate">
                          {item.user.name}
                        </span>
                      </div>
                      
                      <div className="md:col-span-3">
                        <span className="text-[10px] font-bold text-gray-500 capitalize">
                          {formatDateIndo(item.tanggal)}
                        </span>
                      </div>
                      
                      <div className="md:col-span-4">
                        {(() => {
                          try {
                            const outs = JSON.parse(item.hasilKerja) || [];
                            return outs.length > 0 ? (
                              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate block">
                                {outs[0]} {outs.length > 1 && `(+${outs.length - 1} lainnya)`}
                              </span>
                            ) : <span className="italic text-gray-400 text-[10px] font-semibold">-</span>;
                          } catch (e) {
                            return <span className="italic text-gray-400 text-[10px] font-semibold">-</span>;
                          }
                        })()}
                      </div>
                      
                      <div className="md:col-span-2 flex justify-end items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(item.id);
                          }}
                          className="text-[10px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider cursor-pointer"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          className="text-[10px] font-black text-brand-500 uppercase tracking-wider cursor-pointer"
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-20 text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl">
                Belum ada riwayat laporan harian terekam.
              </div>
            )}

            {/* History Details Modal */}
            {selectedHistoryItem && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-boxdark rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-gray-150 dark:border-gray-800 flex justify-between items-center">
                    <div>
                      <h3 className="text-base font-black text-black dark:text-white uppercase tracking-wider">Detail Laporan Harian</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                        {selectedHistoryItem.user.name} — <span className="capitalize">{formatDateIndo(selectedHistoryItem.tanggal)}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedHistoryItem(null)}
                      className="text-gray-400 hover:text-black dark:hover:text-white text-lg font-bold"
                    >
                      ×
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                    
                    {/* Skala Prioritas */}
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">I. Skala Prioritas</h4>
                      <div className="space-y-2">
                        {["q1", "q2", "q3"].map((q) => {
                          let list: TaskItem[] = [];
                          try {
                            const prio = JSON.parse(selectedHistoryItem.prioritas);
                            list = prio[q] || [];
                          } catch (e) {}

                          return (
                            <div key={q}>
                              <span className="text-[10px] font-black text-brand-500 uppercase tracking-wide block mb-1 capitalize">{q}</span>
                              {list.length > 0 ? (
                                <div className="space-y-1.5 pl-3">
                                  {list.map((item, idx) => (
                                    <div key={idx} className="font-semibold text-gray-750 dark:text-gray-300">
                                      {idx + 1}. {item.task} ({item.duration}m) {item.desc ? ` - ${item.desc}` : ""}
                                      {item.attachment && (
                                        <a href={item.attachment.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-brand-500 hover:underline">
                                          [Lampiran: {item.attachment.name}]
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] italic text-gray-400 pl-3">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Logs */}
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">II. Rincian Kegiatan</h4>
                      {(() => {
                        try {
                          const logs = JSON.parse(selectedHistoryItem.rincianKegiatan) || [];
                          return logs.length > 0 ? (
                            <div className="space-y-1.5 pl-3">
                              {logs.map((log: TimeLog, idx: number) => (
                                <div key={idx} className="font-semibold text-gray-750 dark:text-gray-300">
                                  {idx + 1}. {log.start} - {log.end} ({log.duration}) = {log.activity}
                                </div>
                              ))}
                            </div>
                          ) : <span className="italic text-gray-400 pl-3">-</span>;
                        } catch (e) {
                          return <span className="italic text-gray-400 pl-3">-</span>;
                        }
                      })()}
                    </div>

                    {/* Output */}
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">III. Hasil Kerja</h4>
                      {(() => {
                        try {
                          const outs = JSON.parse(selectedHistoryItem.hasilKerja) || [];
                          return outs.length > 0 ? (
                            <div className="space-y-1.5 pl-3">
                              {outs.map((o: string, idx: number) => (
                                <div key={idx} className="font-semibold text-gray-750 dark:text-gray-300">
                                  {idx + 1}. {o}
                                </div>
                              ))}
                            </div>
                          ) : <span className="italic text-gray-400 pl-3">-</span>;
                        } catch (e) {
                          return <span className="italic text-gray-400 pl-3">-</span>;
                        }
                      })()}
                    </div>

                    {/* Planning */}
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">IV. Tugas Esok Hari</h4>
                      <div className="space-y-2">
                        {["q1", "q2", "q3"].map((q) => {
                          let list: TaskItem[] = [];
                          try {
                            const plan = JSON.parse(selectedHistoryItem.tugasEsok);
                            list = plan[q] || [];
                          } catch (e) {}

                          return (
                            <div key={q}>
                              <span className="text-[10px] font-black text-brand-500 uppercase tracking-wide block mb-1 capitalize">{q}</span>
                              {list.length > 0 ? (
                                <div className="space-y-1.5 pl-3">
                                  {list.map((item, idx) => (
                                    <div key={idx} className="font-semibold text-gray-750 dark:text-gray-300">
                                      {idx + 1}. {item.task} ({item.duration}m) {item.desc ? ` - ${item.desc}` : ""}
                                      {item.attachment && (
                                        <a href={item.attachment.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-brand-500 hover:underline">
                                          [Lampiran: {item.attachment.name}]
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] italic text-gray-400 pl-3">-</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reflection */}
                    <div>
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">V. Refleksi & Evaluasi</h4>
                      {(() => {
                        try {
                          const ref = JSON.parse(selectedHistoryItem.refleksi);
                          return (
                            <div className="space-y-2 pl-3 font-semibold text-gray-750 dark:text-gray-300">
                              <div><strong>Hal baru:</strong> {ref.learning || "-"}</div>
                              <div><strong>Hambatan:</strong> {ref.obstacles || "-"}</div>
                              <div><strong>Catatan:</strong> {ref.notes || "-"}</div>
                            </div>
                          );
                        } catch (e) {
                          return <span className="italic text-gray-400 pl-3">-</span>;
                        }
                      })()}
                    </div>

                    {/* Attachments */}
                    {(() => {
                      try {
                        const docs = JSON.parse(selectedHistoryItem.documents) || [];
                        if (docs.length === 0) return null;
                        return (
                          <div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 border-b pb-1 dark:border-gray-800">Lampiran Dokumen</h4>
                            <div className="flex flex-wrap gap-2 pl-3">
                              {docs.map((doc: { name: string; url: string }, idx: number) => (
                                <a
                                  key={idx}
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-white/10 text-brand-500 hover:text-brand-600 border border-gray-200 dark:border-gray-800 text-[10px] font-bold rounded"
                                >
                                  {doc.name}
                                </a>
                              ))}
                            </div>
                          </div>
                        );
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 border-t border-gray-150 dark:border-gray-800 flex justify-end gap-2 bg-gray-50/50 dark:bg-transparent">
                    <button
                      onClick={() => {
                        const rawText = generateFormattedText(
                          selectedHistoryItem.user.name,
                          selectedHistoryItem.tanggal,
                          (() => { try { return JSON.parse(selectedHistoryItem.prioritas).q1 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.prioritas).q2 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.prioritas).q3 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.rincianKegiatan) || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.hasilKerja) || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.tugasEsok).q1 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.tugasEsok).q2 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.tugasEsok).q3 || []; } catch (e) { return []; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.refleksi).learning; } catch (e) { return ""; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.refleksi).obstacles; } catch (e) { return ""; } })(),
                          (() => { try { return JSON.parse(selectedHistoryItem.refleksi).notes; } catch (e) { return ""; } })()
                        );
                        navigator.clipboard.writeText(rawText);
                        alert("Laporan berhasil disalin ke clipboard!");
                      }}
                      className="bg-brand-500 text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-brand-600"
                    >
                      Salin Teks Laporan
                    </button>
                    <button
                      onClick={() => setSelectedHistoryItem(null)}
                      className="bg-gray-150 dark:bg-white/10 text-black dark:text-white px-4 py-2 font-bold uppercase tracking-widest text-[10px] rounded-xl hover:bg-gray-250"
                    >
                      Tutup
                    </button>
                  </div>

                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
