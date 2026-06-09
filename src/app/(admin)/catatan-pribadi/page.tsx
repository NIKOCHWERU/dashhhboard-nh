"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

interface PersonalNote {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  status: "PENDING" | "ONGOING" | "COMPLETED";
  priority: "Q1" | "Q2" | "Q3";
  description?: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PersonalNotesPage() {
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const { data: session } = useSession();
  const [notesList, setNotesList] = useState<PersonalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Modal control states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Toggle View / Edit

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ONGOING" | "COMPLETED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<"ALL" | "Q1" | "Q2" | "Q3">("ALL");
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());

  // Form States
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [priority, setPriority] = useState<"Q1" | "Q2" | "Q3">("Q2"); // Q1 (Tinggi), Q2 (Sedang), Q3 (Rendah)
  const [status, setStatus] = useState<"PENDING" | "ONGOING" | "COMPLETED">("PENDING");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/personal-tasks");
      if (res.ok) {
        const data = await res.json();
        // Keep only personal notes (or tasks)
        setNotesList(data);
      }
    } catch (err) {
      console.error("Failed to load personal notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchNotes();
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-gray-900 animate-pulse rounded-none"></div>
    );
  }

  const loadNoteIntoForm = (note: PersonalNote, editMode: boolean) => {
    setSelectedNoteId(note.id);
    setTitle(note.title);
    
    const startObj = new Date(note.startDate);
    setStartDate(startObj.toISOString().split("T")[0]);
    setStartTime(startObj.toTimeString().slice(0, 5));

    if (note.endDate) {
      const endObj = new Date(note.endDate);
      setEndDate(endObj.toISOString().split("T")[0]);
      setEndTime(endObj.toTimeString().slice(0, 5));
    } else {
      setEndDate("");
      setEndTime("10:00");
    }

    setPriority(note.priority || "Q2");
    setStatus(note.status || "PENDING");
    setDescription(note.description || "");
    setNotes(note.notes || "");
    setImageUrl(note.imageUrl || "");
    
    setIsEditing(editMode);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;

    try {
      setUploadingImage(true);
      const file = filesList[0];
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/personal-tasks/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();

      if (data.webViewLink) {
        setImageUrl(data.webViewLink);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah foto ke Google Drive.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !startDate || !startTime) {
      alert("Harap isi Judul Catatan dan Tanggal Mulai.");
      return;
    }

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${endDate || startDate}T${endTime}:00`;

    try {
      const url = selectedNoteId ? `/api/personal-tasks?id=${selectedNoteId}` : "/api/personal-tasks";
      const method = selectedNoteId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: "CATATAN",
          startDate: startDateTime,
          endDate: endDateTime,
          priority,
          status,
          description,
          notes,
          imageUrl,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNotes();
        resetForm();
      } else {
        alert("Gagal menyimpan catatan.");
      }
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  const handleDelete = async () => {
    if (!selectedNoteId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus catatan pribadi ini?")) return;

    try {
      const res = await fetch(`/api/personal-tasks?id=${selectedNoteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchNotes();
        resetForm();
      } else {
        alert("Gagal menghapus catatan.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleDeleteDirect = async (idToDelete: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus catatan pribadi ini?")) return;

    try {
      const res = await fetch(`/api/personal-tasks?id=${idToDelete}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchNotes();
      } else {
        alert("Gagal menghapus catatan.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleNoteStatus = async (note: PersonalNote, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = note.status === "COMPLETED" ? "PENDING" : "COMPLETED";

    let updatedEndDate = note.endDate;
    if (newStatus === "COMPLETED") {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      updatedEndDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } else {
      updatedEndDate = "";
    }

    try {
      const res = await fetch(`/api/personal-tasks?id=${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...note,
          status: newStatus,
          endDate: updatedEndDate,
        }),
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to toggle note status:", err);
    }
  };

  const resetForm = (defaultDate?: string) => {
    setTitle("");
    setStartDate(defaultDate || getTodayDateString());
    
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, "0");
    const currentMinutes = String(now.getMinutes()).padStart(2, "0");
    setStartTime(`${currentHours}:${currentMinutes}`);
    
    setEndDate("");
    setEndTime("");
    setPriority("Q2");
    setStatus("PENDING");
    setDescription("");
    setNotes("");
    setImageUrl("");
    setSelectedNoteId(null);
  };

  const formatDateIndo = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const renderNotesBoard = (notesGroup: PersonalNote[]) => {
    return (
      <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1 no-scrollbar">
        {notesGroup.map((note) => {
          const isCompleted = note.status === "COMPLETED";
          return (
            <div
              key={note.id}
              onClick={() => loadNoteIntoForm(note, false)}
              className={`p-3.5 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all duration-300 relative group cursor-pointer ${
                isCompleted 
                  ? "border-green-200 dark:border-green-950 opacity-60" 
                  : note.priority === "Q1"
                  ? "border-red-200 dark:border-red-950/20 hover:border-red-300"
                  : note.priority === "Q2"
                  ? "border-amber-200 dark:border-amber-950/20 hover:border-amber-300"
                  : "border-gray-200 dark:border-gray-800 hover:border-brand-500/30"
              }`}
            >
              {/* Card Header: Checkbox & Date */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {note.startDate ? new Date(note.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ""}
                </span>
                
                {/* Checkbox */}
                <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                  <button
                    onClick={(e) => toggleNoteStatus(note, e)}
                    className={`w-4.5 h-4.5 border-2 flex items-center justify-center transition-colors rounded ${
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-amber-500"
                    }`}
                  >
                    {isCompleted && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Title */}
              <h4 className={`text-xs font-bold text-gray-900 dark:text-white leading-snug mb-1.5 ${isCompleted ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
                {note.title}
              </h4>

              {/* Description & Checklist */}
              {note.description && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                  {note.description}
                </p>
              )}

              {note.notes && (
                <div className="text-[10px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 p-2 rounded-lg border border-gray-100 dark:border-gray-800 mb-2 truncate">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-brand-500 block mb-0.5">Checklist</span>
                  {note.notes}
                </div>
              )}

              {/* Card Footer: Metadata & Actions */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800/80">
                <span className="text-[9px] font-bold text-gray-400 font-mono">
                  {note.startDate ? note.startDate.split("T")[1]?.slice(0, 5) : "09:00"}
                </span>
                
                <div className="flex items-center gap-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => loadNoteIntoForm(note, false)}
                    className="text-gray-500 hover:text-black dark:hover:text-white hover:underline font-bold"
                  >
                    Buka
                  </button>
                  <button
                    onClick={() => loadNoteIntoForm(note, true)}
                    className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:underline font-bold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteDirect(note.id)}
                    className="text-red-500 hover:text-red-700 hover:underline font-bold"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const filteredNotes = notesList.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.description && note.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (note.notes && note.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || note.status === statusFilter;

    const matchesPriority =
      priorityFilter === "ALL" || note.priority === priorityFilter;

    const matchesDate =
      !selectedDate || note.startDate.split("T")[0] === selectedDate;

    return matchesSearch && matchesStatus && matchesPriority && matchesDate;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-wider">
            Catatan Pribadi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Kelola ide, tugas, draf berkas hukum, dan catatan kerja harian Anda dalam satu dashboard terpadu.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm(selectedDate);
            setIsEditing(true);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-none bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-widest cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          + Buat Catatan Baru
        </button>
      </div>

      {/* FILTER & SEARCH PANEL */}
      <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-6 shadow-xl space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <input
              type="text"
              placeholder="Cari kata kunci di judul atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-none border border-gray-200 bg-gray-50/50 text-xs text-black outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Status Filters */}
          <div className="lg:col-span-3">
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-3 rounded-none border border-gray-200 bg-gray-50/50 text-xs text-black outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Tunda (Pending)</option>
              <option value="ONGOING">Sedang Berjalan</option>
              <option value="COMPLETED">Selesai</option>
            </select>
          </div>

          {/* Priority Filters */}
          <div className="lg:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e: any) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-3 rounded-none border border-gray-200 bg-gray-50/50 text-xs text-black outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="ALL">Semua Prioritas</option>
              <option value="Q1">Prioritas Tinggi (Q1)</option>
              <option value="Q2">Prioritas Sedang (Q2)</option>
              <option value="Q3">Prioritas Rendah (Q3)</option>
            </select>
          </div>

          {/* Date Picker */}
          <div className="lg:col-span-2 relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-3 rounded-none border border-gray-200 bg-gray-50/50 text-xs text-black outline-none transition focus:border-amber-500 dark:border-gray-800 dark:bg-gray-900/50 dark:text-white"
            />
          </div>
        </div>

        {/* Date filter reset label if active */}
        {selectedDate && (
          <div className="flex justify-start">
            <button
              onClick={() => setSelectedDate("")}
              className="text-[11px] font-black text-amber-600 uppercase tracking-wider hover:underline"
            >
              Hapus Filter Tanggal &times;
            </button>
          </div>
        )}
      </div>

      {/* NOTES GRID AREA */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 border border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.01] animate-pulse rounded-none"></div>
          ))}
        </div>
      ) : notesList.length === 0 ? (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Main Empty State Banner */}
          <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-gray-250 dark:border-gray-850 bg-white dark:bg-white/[0.01] p-6 shadow-md">
            <svg className="w-16 h-16 text-amber-500 mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Belum Ada Catatan Pribadi</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              Halaman ini digunakan untuk mengelola ide, draf berkas hukum, dan catatan kerja harian Anda. Silakan ikuti panduan di bawah ini untuk memulai.
            </p>
          </div>

          {/* Guide Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-850 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                  1
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Membuat Catatan Baru</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Klik tombol <span className="font-bold text-amber-600 dark:text-amber-500">+ Buat Catatan Baru</span> di sudut kanan atas halaman. Isi judul catatan, tanggal mulai kegiatan, serta keterangan pengerjaan atau list sub-kegiatan internal.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-850 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center font-black text-sm">
                  2
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Mengatur Skala Prioritas</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Tentukan urgensi catatan menggunakan matriks prioritas kerja:
                </p>
                <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1 pl-4 list-disc">
                  <li><span className="font-bold text-red-600">Q1 (Tinggi)</span>: Tugas mendesak & penting.</li>
                  <li><span className="font-bold text-amber-500">Q2 (Sedang)</span>: Tugas penting jangka menengah.</li>
                  <li><span className="font-bold text-green-600">Q3 (Rendah)</span>: Tugas rutin harian biasa.</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-850 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-sm">
                  3
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Menandai Checklist & Selesai</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Gunakan kotak ceklist pada tabel untuk menandai catatan atau tugas yang telah **Selesai (Completed)**. Sistem akan otomatis mencatat waktu selesai pengerjaan Anda untuk memantau produktivitas.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-850 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center font-black text-sm">
                  4
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Pencarian & Filter Instan</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Cari kata kunci secara real-time pada kolom pencarian. Anda juga bisa mempersempit daftar catatan berdasarkan Status pengerjaan, Prioritas urgensi, atau mencocokkannya dengan tanggal tertentu.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-850 p-6 shadow-md flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-600 flex items-center justify-center font-black text-sm">
                  5
                </div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Unggah Gambar Pendukung</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Unggah lampiran bukti foto atau gambar referensi langsung dari formulir catatan pribadi. Lampiran berkas ini akan otomatis tersimpan dalam folder arsip Google Drive dashboard Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-gray-250 dark:border-gray-850 bg-white dark:bg-white/[0.01]">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Tidak ada catatan yang ditemukan</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Cobalah mengubah filter pencarian Anda atau buat catatan baru dengan menekan tombol di kanan atas.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Q1 Column */}
          <div className="bg-white dark:bg-white/[0.02] border border-red-200/50 dark:border-red-950/20 p-4 shadow-sm space-y-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-red-650 dark:text-red-400">Tinggi (Q1)</h2>
              </div>
              <span className="text-[10px] font-black text-red-650 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-lg">
                {filteredNotes.filter(n => n.priority === "Q1").length}
              </span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q1").length === 0 ? (
              <p className="text-[11px] text-gray-400 italic py-8 text-center font-medium">Tidak ada catatan prioritas Q1.</p>
            ) : (
              renderNotesBoard(filteredNotes.filter(n => n.priority === "Q1"))
            )}
          </div>

          {/* Q2 Column */}
          <div className="bg-white dark:bg-white/[0.02] border border-amber-200/50 dark:border-amber-950/20 p-4 shadow-sm space-y-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/20"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-650 dark:text-amber-400">Sedang (Q2)</h2>
              </div>
              <span className="text-[10px] font-black text-amber-650 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-lg">
                {filteredNotes.filter(n => n.priority === "Q2").length}
              </span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q2").length === 0 ? (
              <p className="text-[11px] text-gray-400 italic py-8 text-center font-medium">Tidak ada catatan prioritas Q2.</p>
            ) : (
              renderNotesBoard(filteredNotes.filter(n => n.priority === "Q2"))
            )}
          </div>

          {/* Q3 Column */}
          <div className="bg-white dark:bg-white/[0.02] border border-green-200/50 dark:border-green-950/20 p-4 shadow-sm space-y-4 rounded-2xl min-h-[400px]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-green-655 dark:text-green-400">Rendah (Q3)</h2>
              </div>
              <span className="text-[10px] font-black text-green-655 bg-green-50 dark:bg-green-950/20 px-2.5 py-0.5 rounded-lg">
                {filteredNotes.filter(n => n.priority === "Q3").length}
              </span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q3").length === 0 ? (
              <p className="text-[11px] text-gray-400 italic py-8 text-center font-medium">Tidak ada catatan prioritas Q3.</p>
            ) : (
              renderNotesBoard(filteredNotes.filter(n => n.priority === "Q3"))
            )}
          </div>
        </div>
      )}

      {/* CORE SEPARATED MODAL: VIEW & WRITE NOTE */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-white dark:bg-boxdark rounded-none overflow-hidden shadow-2xl border border-stroke dark:border-strokedark max-w-2xl w-full mx-auto animate-in zoom-in duration-300">
          
          {/* Modal Header */}
          <div className="px-8 py-6 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 text-amber-500 flex items-center justify-center rounded-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-wider">
                  {selectedNoteId ? (isEditing ? "Ubah Catatan Pribadi" : "Detail Catatan Pribadi") : "Buat Catatan Baru"}
                </h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wide">
                  {isEditing ? "Rincikan informasi checklist dan draf tugas Anda" : "Informasi detail beserta lampiran berkas berkas"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400 hover:text-black dark:hover:text-white text-xl font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            {!isEditing ? (
              /* VIEW / READ ONLY MODE */
              <div className="space-y-6">
                <div>
                  <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-0.5 tracking-wider">
                    Catatan Kerja
                  </span>
                  <h2 className="text-xl font-black text-black dark:text-white uppercase tracking-wide mt-2">{title}</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-stroke dark:border-strokedark py-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Mulai Kegiatan</p>
                    <p className="mt-1 font-bold text-black dark:text-white">{formatDateIndo(startDate)} - {startTime}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Waktu Selesai</p>
                    <p className="mt-1 font-bold text-emerald-600">
                      {status === "COMPLETED" && endDate ? `${formatDateIndo(endDate)} - ${endDate.split("T")[1]?.slice(0, 5) || "09:00"}` : "Belum Selesai (Aktif)"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Skala Prioritas</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-black text-white ${priority === "Q1" ? "bg-red-500" : priority === "Q2" ? "bg-amber-500" : "bg-green-500"}`}>
                      {priority === "Q1" ? "Q1 (Tinggi)" : priority === "Q2" ? "Q2 (Sedang)" : "Q3 (Rendah)"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Status Pengerjaan</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-black text-white ${status === "COMPLETED" ? "bg-green-500" : status === "ONGOING" ? "bg-blue-500" : "bg-gray-400"}`}>
                      {status === "COMPLETED" ? "Selesai" : status === "ONGOING" ? "Dalam Proses" : "Tunda (Pending)"}
                    </span>
                  </div>
                </div>

                {description && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-1">Rincian Deskripsi</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-4 border border-stroke dark:border-strokedark rounded-none whitespace-pre-line leading-relaxed">
                      {description}
                    </p>
                  </div>
                )}

                {notes && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-1">Checklist internal / Catatan Kecil</h4>
                    <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-4 border border-stroke dark:border-strokedark rounded-none whitespace-pre-line leading-relaxed">
                      {notes}
                    </p>
                  </div>
                )}

                {imageUrl && (
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase mb-2">Lampiran Gambar (Google Drive)</h4>
                    <div className="w-full max-h-72 border border-stroke overflow-hidden rounded-none bg-gray-50 flex items-center justify-center">
                      <img
                        src={imageUrl}
                        alt="Task Attachment"
                        className="max-h-72 max-w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* WRITE / EDIT MODE */
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Judul Catatan</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Menyiapkan Lampiran Berkas Perkara PT. XYZ"
                    className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-500">Tanggal Kegiatan</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-500">Jam Mulai</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Prioritas</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "Q1", label: "Tinggi (Q1)" },
                        { key: "Q2", label: "Sedang (Q2)" },
                        { key: "Q3", label: "Rendah (Q3)" },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setPriority(p.key as any)}
                          className={`py-2 rounded-none border font-black text-[10px] uppercase transition-colors ${
                            priority === p.key
                              ? p.key === "Q1" ? "border-red-500 bg-red-500 text-white" : p.key === "Q2" ? "border-amber-500 bg-amber-500 text-white" : "border-green-500 bg-green-500 text-white"
                              : "border-stroke text-gray-400 hover:border-amber-500"
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-gray-500 mb-2">Status Catatan</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: "PENDING", label: "Tunda" },
                        { key: "ONGOING", label: "Proses" },
                        { key: "COMPLETED", label: "Selesai" },
                      ].map((s) => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setStatus(s.key as any)}
                          className={`py-2 rounded-none border font-black text-[10px] uppercase transition-colors ${
                            status === s.key
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-stroke text-gray-400 hover:border-amber-500"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Google Drive Upload */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Unggah Lampiran Gambar / Foto</label>
                  <div className="flex flex-col gap-3">
                    <label className={`px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-black dark:text-white border border-dashed border-stroke dark:border-strokedark text-center text-xs font-black uppercase tracking-wider cursor-pointer rounded-none inline-flex items-center justify-center gap-2 ${uploadingImage ? "opacity-50 pointer-events-none" : ""}`}>
                      {uploadingImage ? "Mengunggah..." : "Pilih File Foto"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    
                    {imageUrl && (
                      <div className="relative w-32 h-24 border border-stroke overflow-hidden rounded-none mt-2">
                        <img
                          src={imageUrl}
                          alt="Attachment Uploaded"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl("")}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[11px] font-bold"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Deskripsi Kegiatan</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tulis deskripsi draf pengerjaan berkas, janji temu klien, dsb..."
                    className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  ></textarea>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-black uppercase text-gray-500 mb-2">Internal Checklist / Catatan</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Sub-checklist atau instruksi spesifik tambahan..."
                    className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-8 py-6 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark flex justify-between items-center">
            <div>
              {selectedNoteId && isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-none text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 uppercase tracking-widest cursor-pointer"
                >
                  Hapus Catatan
                </button>
              )}
            </div>
            <div className="flex gap-4">
              {!isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-none text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 uppercase tracking-widest cursor-pointer"
                  >
                    Tutup
                  </button>
                  {selectedNoteId && (
                    status === "COMPLETED" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const note = notesList.find(n => n.id === selectedNoteId);
                          if (note) {
                            await fetch(`/api/personal-tasks?id=${note.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ...note, status: "PENDING", endDate: "" }),
                            });
                            setIsModalOpen(false);
                            fetchNotes();
                          }
                        }}
                        className="px-6 py-2.5 rounded-none text-xs font-black bg-amber-500 text-white uppercase tracking-widest hover:bg-amber-600 cursor-pointer"
                      >
                        Tandai Pending
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          const note = notesList.find(n => n.id === selectedNoteId);
                          if (note) {
                            const now = new Date();
                            const year = now.getFullYear();
                            const month = String(now.getMonth() + 1).padStart(2, "0");
                            const day = String(now.getDate()).padStart(2, "0");
                            const hours = String(now.getHours()).padStart(2, "0");
                            const minutes = String(now.getMinutes()).padStart(2, "0");
                            const seconds = String(now.getSeconds()).padStart(2, "0");
                            const updatedEndDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

                            await fetch(`/api/personal-tasks?id=${note.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ ...note, status: "COMPLETED", endDate: updatedEndDate }),
                            });
                            setIsModalOpen(false);
                            fetchNotes();
                          }
                        }}
                        className="px-6 py-2.5 rounded-none text-xs font-black bg-emerald-600 text-white uppercase tracking-widest hover:bg-emerald-700 cursor-pointer"
                      >
                        Tugas Selesai
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-8 py-2.5 rounded-none text-xs font-black bg-amber-500 text-white uppercase tracking-widest shadow-lg hover:bg-amber-600 cursor-pointer"
                  >
                    Ubah Catatan
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedNoteId) {
                        setIsEditing(false); // Go back to view mode
                      } else {
                        setIsModalOpen(false); // Close completely
                      }
                    }}
                    className="px-6 py-2.5 rounded-none text-xs font-black text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 uppercase tracking-widest cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="px-8 py-2.5 rounded-none text-xs font-black bg-amber-500 text-white uppercase tracking-widest shadow-lg hover:bg-amber-600 cursor-pointer"
                  >
                    Simpan Catatan
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
