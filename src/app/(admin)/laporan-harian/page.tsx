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

  // Helper: Format Date Indon Lowercase
  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const daysIndo = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
    const months = [
      "januari", "februari", "maret", "april", "mei", "juni",
      "juli", "agustus", "september", "oktober", "november", "desember"
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
    msg: string
  ) => {
    let text = `*LAPORAN AKTIFITAS HARIAN*\n\n`;
    text += `Nama: ${name || "Staf"}\n`;
    text += `Hari/tanggal: ${formatDateIndo(date)}\n\n`;

    text += `I. *Skala Prioritas (_On Duty_)*\n\n`;
    text += `*Q1:*\n`;
    if (q1T.length === 0) text += `- Nihil\n`;
    else q1T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q2:*\n`;
    if (q2T.length === 0) text += `- Nihil\n`;
    else q2T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q3:*\n`;
    if (q3T.length === 0) text += `- Nihil\n`;
    else q3T.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

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
    else q1Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q2:*\n`;
    if (q2Tom.length === 0) text += `- Nihil\n`;
    else q2Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\n*Q3:*\n`;
    if (q3Tom.length === 0) text += `- Nihil\n`;
    else q3Tom.forEach((t, i) => { text += `${i + 1}. ${t.task} (${t.duration} menit, ${t.desc || "-"})${t.attachment ? ` [Lampiran: ${t.attachment.url}]` : ""}\n`; });

    text += `\nV. *Refleksi & Evaluasi Hari ini*\n\n`;
    text += `1. Hal baru yang dipelajari : ${learn || "-"}\n`;
    text += `2. Hambatan yang ditemui : ${ob || "-"}\n`;
    text += `3. Pesan/kesan/catatan lainnya : ${msg || "-"}\n`;

    return text;
  };

  const handleCopyText = () => {
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
      notes
    );
    navigator.clipboard.writeText(rawText);
    alert("Laporan berhasil disalin ke clipboard!");
  };

  // Submit / Save Laporan
  const handleSaveReport = async () => {
    if (!confirm("Apakah Anda yakin ingin mengirim laporan harian ini ke database?")) return;

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
        alert("Laporan Aktivitas Harian berhasil disimpan ke database!");
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
                <div key={q} className="space-y-3">
                  <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                  {list.length > 0 && (
                    <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      {list.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                          <span className="font-semibold text-gray-750 dark:text-gray-300">
                            {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "Nihil"}</span>
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
                          <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0">
                            <TrashBinIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama Tugas..."
                      value={temp.task}
                      onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                      className="sm:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Menit..."
                      value={temp.duration || ""}
                      onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                      className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={temp.desc}
                      onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                      className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
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
                        className={`w-full text-center border border-dashed border-gray-300 dark:border-gray-700 py-1.5 rounded-xl text-[10px] font-bold text-gray-500 hover:border-brand-500 cursor-pointer truncate ${
                          uploadingItem[uploadKey] ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingItem[uploadKey] ? "..." : temp.attachment ? `✓ ${temp.attachment.name}` : "Berkas (Opsional)"}
                      </label>
                    </div>

                    <button
                      onClick={() => addTask(q, "today")}
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
                <div key={q} className="space-y-3">
                  <span className="text-xs font-black text-brand-500 uppercase tracking-wide block">{label}</span>
                  {list.length > 0 && (
                    <div className="space-y-2 bg-gray-50/50 dark:bg-white/[0.01] p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      {list.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start gap-4 text-xs">
                          <span className="font-semibold text-gray-750 dark:text-gray-300">
                            {idx + 1}. {item.task} ({item.duration}m) - <span className="italic text-gray-400">{item.desc || "Nihil"}</span>
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
                          <button onClick={() => removeTask(idx)} className="text-rose-500 hover:text-rose-600 flex-shrink-0">
                            <TrashBinIcon />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nama Tugas..."
                      value={temp.task}
                      onChange={(e) => setTemp({ ...temp, task: e.target.value })}
                      className="sm:col-span-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="number"
                      placeholder="Menit..."
                      value={temp.duration || ""}
                      onChange={(e) => setTemp({ ...temp, duration: parseInt(e.target.value) || 0 })}
                      className="sm:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Keterangan..."
                      value={temp.desc}
                      onChange={(e) => setTemp({ ...temp, desc: e.target.value })}
                      className="sm:col-span-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl text-xs outline-none focus:border-brand-500 font-semibold"
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
                        className={`w-full text-center border border-dashed border-gray-300 dark:border-gray-700 py-1.5 rounded-xl text-[10px] font-bold text-gray-500 hover:border-brand-500 cursor-pointer truncate ${
                          uploadingItem[uploadKey] ? "pointer-events-none opacity-50" : ""
                        }`}
                      >
                        {uploadingItem[uploadKey] ? "..." : temp.attachment ? `✓ ${temp.attachment.name}` : "Berkas (Opsional)"}
                      </label>
                    </div>

                    <button
                      onClick={() => addTask(q, "tomorrow")}
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

          {/* Form Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              type="button"
              onClick={handleCopyText}
              className="w-full bg-gray-100 dark:bg-white/10 text-black dark:text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Salin Laporan
            </button>
            <button
              type="button"
              onClick={handleSaveReport}
              className="w-full bg-brand-500 text-white py-3.5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all cursor-pointer shadow-sm active:scale-98"
            >
              Kirimkan
            </button>
          </div>
        </div>
      ) : (
        /* --- Riwayat Tab Panel (Admins Only) --- */
        isAdmin && (
          <div className="space-y-6">
            {/* History Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
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

            {/* Reports List */}
            {historyLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800/40 rounded-2xl"></div>
                ))}
              </div>
            ) : historyList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-sm hover:border-brand-500 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2 mb-3">
                        <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                          <UserCircleIcon />
                          {item.user.name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 capitalize">
                          {formatDateIndo(item.tanggal)}
                        </span>
                      </div>
                      
                      {/* Snippet outputs */}
                      <div className="space-y-2 mt-2">
                        <div>
                          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Output Hari Ini:</span>
                          <ul className="list-disc list-inside text-xs font-bold text-gray-700 dark:text-gray-300 mt-1 pl-1 line-clamp-2">
                            {(() => {
                              try {
                                const outs = JSON.parse(item.hasilKerja) || [];
                                return outs.length > 0 ? outs.map((o: string, idx: number) => (
                                  <li key={idx} className="truncate">{o}</li>
                                )) : <span className="italic text-gray-400 font-semibold">-</span>;
                              } catch (e) {
                                return <span className="italic text-gray-400 font-semibold">-</span>;
                              }
                            })()}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReport(item.id);
                        }}
                        className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-wider"
                      >
                        Hapus
                      </button>
                      <button
                        type="button"
                        className="text-[9px] font-black text-brand-500 uppercase tracking-wider pl-2"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                ))}
              </div>
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
                                <span className="text-[10px] italic text-gray-400 pl-3">Nihil</span>
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
                          ) : <span className="italic text-gray-400 pl-3">Nihil</span>;
                        } catch (e) {
                          return <span className="italic text-gray-400 pl-3">Nihil</span>;
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
                          ) : <span className="italic text-gray-400 pl-3">Nihil</span>;
                        } catch (e) {
                          return <span className="italic text-gray-400 pl-3">Nihil</span>;
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
                                <span className="text-[10px] italic text-gray-400 pl-3">Nihil</span>
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
                          return <span className="italic text-gray-400 pl-3">Nihil</span>;
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
