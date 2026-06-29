"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlusIcon, UserCircleIcon, TrashBinIcon } from "@/icons";

interface TaskItem {
  task: string;
  duration: number; // in minutes
  desc: string;
}

interface TimeLog {
  start: string; // HH:MM
  end: string;   // HH:MM
  activity: string;
}

interface SavedReport {
  id: string;
  userId: string;
  tanggal: string;
  prioritas: string; // JSON parsed
  rincianKegiatan: string; // JSON parsed
  hasilKerja: string; // JSON parsed
  tugasEsok: string; // JSON parsed
  refleksi: string; // JSON parsed
  documents: string; // JSON parsed
  createdAt: string;
  user: {
    name: string;
    email: string;
    image?: string;
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

  // Section VI: Attached Documents
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Temporary inputs
  const [tempQ1Today, setTempQ1Today] = useState({ task: "", duration: 120, desc: "" });
  const [tempQ2Today, setTempQ2Today] = useState({ task: "", duration: 60, desc: "" });
  const [tempQ3Today, setTempQ3Today] = useState({ task: "", duration: 30, desc: "" });
  const [tempTimeLog, setTempTimeLog] = useState({ start: "09:00", end: "10:00", activity: "" });
  const [tempOutput, setTempOutput] = useState("");
  const [tempQ1Tomorrow, setTempQ1Tomorrow] = useState({ task: "", duration: 120, desc: "" });
  const [tempQ2Tomorrow, setTempQ2Tomorrow] = useState({ task: "", duration: 60, desc: "" });
  const [tempQ3Tomorrow, setTempQ3Tomorrow] = useState({ task: "", duration: 30, desc: "" });

  // --- Riwayat States ---
  const [historyList, setHistoryList] = useState<SavedReport[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterUser, setFilterUser] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [usersList, setUsersList] = useState<{ id: string; name: string }[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SavedReport | null>(null);

  // Set default date to today in Jakarta time
  useEffect(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
    setReportDate(localISOTime);
    fetchUsers();
  }, []);

  useEffect(() => {
    if (activeTab === "riwayat") {
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

  // Helper: Format Date Indon
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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

  // Google Drive File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?category=Laporan Harian", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setAttachments([...attachments, { name: file.name, url: data.url }]);
      } else {
        alert(data.error || "Gagal mengunggah berkas");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah berkas.");
    } finally {
      setIsUploading(false);
    }
  };

  // Add Item Helpers
  const addTask = (q: "q1" | "q2" | "q3", day: "today" | "tomorrow") => {
    let temp = q === "q1" ? (day === "today" ? tempQ1Today : tempQ1Tomorrow) : q === "q2" ? (day === "today" ? tempQ2Today : tempQ2Tomorrow) : (day === "today" ? tempQ3Today : tempQ3Tomorrow);
    if (!temp.task) {
      alert("Isi nama tugas.");
      return;
    }
    const item: TaskItem = { task: temp.task, duration: temp.duration, desc: temp.desc };
    if (day === "today") {
      if (q === "q1") { setQ1Today([...q1Today, item]); setTempQ1Today({ task: "", duration: 120, desc: "" }); }
      else if (q === "q2") { setQ2Today([...q2Today, item]); setTempQ2Today({ task: "", duration: 60, desc: "" }); }
      else { setQ3Today([...q3Today, item]); setTempQ3Today({ task: "", duration: 30, desc: "" }); }
    } else {
      if (q === "q1") { setQ1Tomorrow([...q1Tomorrow, item]); setTempQ1Tomorrow({ task: "", duration: 120, desc: "" }); }
      else if (q === "q2") { setQ2Tomorrow([...q2Tomorrow, item]); setTempQ2Tomorrow({ task: "", duration: 60, desc: "" }); }
      else { setQ3Tomorrow([...q3Tomorrow, item]); setTempQ3Tomorrow({ task: "", duration: 30, desc: "" }); }
    }
  };

  const addTimeLog = () => {
    if (!tempTimeLog.activity) {
      alert("Isi aktivitas.");
      return;
    }
    setTimeLogs([...timeLogs, { ...tempTimeLog }]);
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
    msg: string
  ) => {
    let text = `*LAPORAN AKTIFITAS HARIAN*\n\n`;
    text += `Nama: ${name || "Staf"}\n`;
    text += `Hari/tanggal: ${formatDateIndo(date)}\n\n`;

    text += `I. *Skala Prioritas (_On Duty_)*\n\n`;
    text += `*Q1:*\n`;
    if (q1T.length === 0) text += `- Nihil\n`;
    else q1T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\n*Q2:*\n`;
    if (q2T.length === 0) text += `- Nihil\n`;
    else q2T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\n*Q3:*\n`;
    if (q3T.length === 0) text += `- Nihil\n`;
    else q3T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\nII. *Rincian Kegiatan (Log Waktu)*\n\n`;
    if (logs.length === 0) text += `- Nihil\n`;
    else {
      logs.forEach((log, i) => {
        text += `${i + 1}. ${log.start} WIB - ${log.end} WIB _${getDurationStr(log.start, log.end)}_ = ${log.activity}\n`;
      });
    }

    text += `\nIII. *Hasil Kerja (Output hari ini)*\n\n`;
    if (outs.length === 0) text += `- Nihil\n`;
    else outs.forEach((out, i) => { text += `${i + 1}. ${out}\n`; });

    text += `\nIV. *Tugas Esok Hari (_Planning_)*\n\n`;
    text += `*Q1:*\n`;
    if (q1Tom.length === 0) text += `- Nihil\n`;
    else q1Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\n*Q2:*\n`;
    if (q2Tom.length === 0) text += `- Nihil\n`;
    else q2Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\n*Q3:*\n`;
    if (q3Tom.length === 0) text += `- Nihil\n`;
    else q3Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})\n`; });

    text += `\nV. *Refleksi & Evaluasi Hari ini*\n\n`;
    text += `1. Hal baru yang dipelajari : ${learn || "-"}\n`;
    text += `2. Hambatan yang ditemui : ${ob || "-"}\n`;
    text += `3. Pesan/kesan/catatan lainnya : ${msg || "-"}\n`;

    return text;
  };

  const handleCopyText = (rawText: string) => {
    navigator.clipboard.writeText(rawText);
    alert("Laporan berhasil disalin ke clipboard!");
  };

  // Submit / Save Laporan
  const handleSaveReport = async () => {
    const payload = {
      date: reportDate,
      prioritas: { q1: q1Today, q2: q2Today, q3: q3Today },
      rincianKegiatan: timeLogs,
      hasilKerja: outputs,
      tugasEsok: { q1: q1Tomorrow, q2: q2Tomorrow, q3: q3Tomorrow },
      refleksi: { learning, obstacles, notes },
      documents: attachments,
    };

    try {
      const res = await fetch("/api/laporan-harian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Laporan Aktivitas Harian berhasil disimpan ke database!");
        setActiveTab("riwayat");
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

  const activeFormattedText = generateFormattedText(
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
    notes
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-wider">Laporan Aktivitas Harian</h1>
          <p className="text-xs text-gray-500">Tulis, salin, dan simpan laporan log aktivitas harian Anda.</p>
        </div>

        {/* Tab Headers */}
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
      </div>

      {activeTab === "buat" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left panel: Form editor */}
          <div className="lg:col-span-7 space-y-6">
            
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
                    className="w-full bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tanggal Laporan</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl text-xs font-bold text-black dark:text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section I: Skala Prioritas Today */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-5">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">I. Skala Prioritas (Hari Ini)</h2>
                {q1Tomorrow.length > 0 && (
                  <button
                    onClick={copyTomorrowToToday}
                    className="text-[10px] font-black text-brand-500 hover:underline uppercase"
                  >
                    Salin Plan Kemarin
                  </button>
                )}
              </div>

              {/* Add Q1/Q2/Q3 Forms */}
              {["q1", "q2", "q3"].map((q) => {
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

                return (
                  <div key={q} className="space-y-3">
                    <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                    {list.length > 0 && (
                      <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {list.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "Nihil"}</span>
                            </span>
                            <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0">
                              <TrashBinIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Tugas..."
                        value={temp.task}
                        onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                        className="sm:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Durasi (Menit)..."
                        value={temp.duration || ""}
                        onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                        className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Detail..."
                        value={temp.desc}
                        onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                        className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <button
                        onClick={() => addTask(q as any, "today")}
                        className="sm:col-span-1 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl p-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
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
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
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
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
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
                  onClick={copyPlanToTomorrow}
                  className="text-[10px] font-black text-brand-500 hover:underline uppercase"
                >
                  Salin Plan Hari Ini
                </button>
              </div>

              {/* Add Q1/Q2/Q3 Forms */}
              {["q1", "q2", "q3"].map((q) => {
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

                return (
                  <div key={q} className="space-y-3">
                    <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                    {list.length > 0 && (
                      <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        {list.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                              {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "Nihil"}</span>
                            </span>
                            <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0">
                              <TrashBinIcon />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <input
                        type="text"
                        placeholder="Nama Tugas..."
                        value={temp.task}
                        onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                        className="sm:col-span-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <input
                        type="number"
                        placeholder="Durasi (Menit)..."
                        value={temp.duration || ""}
                        onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                        className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <input
                        type="text"
                        placeholder="Detail..."
                        value={temp.desc}
                        onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                        className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                      />
                      <button
                        onClick={() => addTask(q as any, "tomorrow")}
                        className="sm:col-span-1 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 flex items-center justify-center rounded-xl p-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
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

            {/* Section VI: Attachments */}
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-wider border-b border-gray-100 dark:border-gray-800 pb-2">Dokumen Pendukung</h2>
              
              {attachments.length > 0 && (
                <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-brand-500 hover:underline truncate max-w-[80%]"
                      >
                        {file.name}
                      </a>
                      <button
                        onClick={() => {
                          const copy = [...attachments];
                          copy.splice(idx, 1);
                          setAttachments(copy);
                        }}
                        className="text-rose-500 hover:text-rose-600 flex-shrink-0"
                      >
                        <TrashBinIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="laporan-file-upload"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="laporan-file-upload"
                  className={`px-4 py-2.5 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:border-brand-500 cursor-pointer flex items-center gap-2 ${
                    isUploading ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  {isUploading ? "Mengunggah..." : "Upload Berkas Ke Drive"}
                </label>
              </div>
            </div>

          </div>

          {/* Right panel: Whatsapp Preview + Action Button */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="bg-[#E5DDD5] dark:bg-gray-900 border border-[#dad3ca] dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-[#075E54] dark:bg-gray-850 px-5 py-3 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm text-white">
                    {user?.name?.substring(0, 2).toUpperCase() || "NH"}
                  </div>
                  <div>
                    <h4 className="text-xs font-black truncate max-w-[150px]">{user?.name || "Karyawan"}</h4>
                    <span className="text-[9px] font-semibold text-white/70">Laporan Aktivitas Harian</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded">Preview WA</span>
              </div>

              {/* Message Content */}
              <div className="p-4 overflow-y-auto max-h-[350px] no-scrollbar space-y-4 flex flex-col justify-end">
                <div className="bg-white dark:bg-boxdark p-3.5 rounded-2xl text-[11px] font-mono leading-relaxed shadow-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-w-[90%] border border-gray-100 dark:border-gray-800 relative after:content-[''] after:absolute after:top-0 after:left-[-6px] after:w-3 after:h-3 after:bg-white dark:after:bg-boxdark after:rotate-45 after:border-l after:border-t after:border-gray-100 dark:after:border-gray-800 after:rounded-tl-sm">
                  {activeFormattedText}
                </div>
              </div>
            </div>

            {/* Submit & Copy Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleCopyText(activeFormattedText)}
                className="w-full bg-gray-100 dark:bg-white/10 text-black dark:text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                Salin Laporan
              </button>
              <button
                onClick={handleSaveReport}
                className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-600 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                Simpan Ke Database
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- Riwayat Tab Panel --- */
        <div className="space-y-6">
          
          {/* History Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              
              {/* User filter for Admins */}
              {isAdmin && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Karyawan:</span>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="">Semua Karyawan</option>
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Tanggal:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold rounded-xl focus:outline-none focus:border-brand-500 outline-none"
                />
                {filterDate && (
                  <button
                    onClick={() => setFilterDate("")}
                    className="text-gray-400 hover:text-brand-500 font-bold text-xs leading-none"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <span className="text-[10px] font-black text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {historyList.length} Laporan Ditemukan
            </span>
          </div>

          {/* History List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* List */}
            <div className="space-y-4">
              {historyLoading ? (
                <>
                  <div className="h-28 bg-gray-100 dark:bg-white/[0.01] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
                  <div className="h-28 bg-gray-100 dark:bg-white/[0.01] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
                </>
              ) : historyList.length > 0 ? (
                historyList.map((item) => {
                  const isSelected = selectedHistoryItem?.id === item.id;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedHistoryItem(item)}
                      className={`p-4 border rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-brand-500/5 border-brand-500 shadow-md scale-101"
                          : "bg-white dark:bg-white/[0.02] border-gray-200 dark:border-gray-800 hover:border-brand-500/50"
                      }`}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center font-black text-xs">
                            {item.user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-black text-xs text-black dark:text-white uppercase tracking-wide">
                              {item.user.name}
                            </h3>
                            <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
                              {formatDateIndo(item.tanggal)}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDeleteReport(item.id)}
                            className="text-rose-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Hapus Laporan"
                          >
                            <TrashBinIcon />
                          </button>
                        </div>
                      </div>

                      {/* Display brief preview */}
                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-[10px] text-gray-500 font-semibold">
                        <span>Dibuat: {new Date(item.createdAt).toLocaleDateString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                        <span className="text-brand-500 font-black hover:underline uppercase tracking-wider">
                          Lihat Detail &copy;
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-16 text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl text-xs">
                  Belum ada riwayat laporan yang tersimpan.
                </div>
              )}
            </div>

            {/* Detail View */}
            {selectedHistoryItem ? (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
                  <div>
                    <h3 className="font-black text-xs text-black dark:text-white uppercase tracking-wider">Rincian Laporan</h3>
                    <span className="text-[10px] font-bold text-gray-400">{selectedHistoryItem.user.name} - {formatDateIndo(selectedHistoryItem.tanggal)}</span>
                  </div>
                  <button
                    onClick={() => {
                      const text = generateFormattedText(
                        selectedHistoryItem.user.name,
                        selectedHistoryItem.tanggal,
                        JSON.parse(selectedHistoryItem.prioritas).q1 || [],
                        JSON.parse(selectedHistoryItem.prioritas).q2 || [],
                        JSON.parse(selectedHistoryItem.prioritas).q3 || [],
                        JSON.parse(selectedHistoryItem.rincianKegiatan) || [],
                        JSON.parse(selectedHistoryItem.hasilKerja) || [],
                        JSON.parse(selectedHistoryItem.tugasEsok).q1 || [],
                        JSON.parse(selectedHistoryItem.tugasEsok).q2 || [],
                        JSON.parse(selectedHistoryItem.tugasEsok).q3 || [],
                        JSON.parse(selectedHistoryItem.refleksi).learning,
                        JSON.parse(selectedHistoryItem.refleksi).obstacles,
                        JSON.parse(selectedHistoryItem.refleksi).notes
                      );
                      handleCopyText(text);
                    }}
                    className="px-3 py-1.5 bg-brand-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg hover:bg-brand-600 transition"
                  >
                    Salin Laporan
                  </button>
                </div>

                {/* Display Attachments */}
                {(() => {
                  let files: { name: string; url: string }[] = [];
                  try {
                    if (selectedHistoryItem.documents) {
                      files = JSON.parse(selectedHistoryItem.documents);
                    }
                  } catch (e) {}

                  if (files.length === 0) return null;

                  return (
                    <div className="bg-gray-50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-150 dark:border-gray-800">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Dokumen Terlampir</span>
                      <div className="space-y-1.5">
                        {files.map((file, i) => (
                          <a
                            key={i}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-brand-500 hover:underline block truncate"
                          >
                            &bull; {file.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Styled Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-[10px] font-mono leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-gray-150 dark:border-gray-800 max-h-[350px] overflow-y-auto">
                  {generateFormattedText(
                    selectedHistoryItem.user.name,
                    selectedHistoryItem.tanggal,
                    JSON.parse(selectedHistoryItem.prioritas).q1 || [],
                    JSON.parse(selectedHistoryItem.prioritas).q2 || [],
                    JSON.parse(selectedHistoryItem.prioritas).q3 || [],
                    JSON.parse(selectedHistoryItem.rincianKegiatan) || [],
                    JSON.parse(selectedHistoryItem.hasilKerja) || [],
                    JSON.parse(selectedHistoryItem.tugasEsok).q1 || [],
                    JSON.parse(selectedHistoryItem.tugasEsok).q2 || [],
                    JSON.parse(selectedHistoryItem.tugasEsok).q3 || [],
                    JSON.parse(selectedHistoryItem.refleksi).learning,
                    JSON.parse(selectedHistoryItem.refleksi).obstacles,
                    JSON.parse(selectedHistoryItem.refleksi).notes
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-gray-400 italic bg-gray-50/50 dark:bg-white/[0.01] border border-gray-250 dark:border-gray-800 rounded-2xl text-xs flex flex-col items-center justify-center">
                Pilih salah satu riwayat laporan di kiri untuk melihat rincian lengkapnya.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
