"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/modal";

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
  const [selectedDate, setSelectedDate] = useState<string>("");

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
    try {
      const res = await fetch(`/api/personal-tasks?id=${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...note,
          status: newStatus,
        }),
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to toggle note status:", err);
    }
  };

  const resetForm = () => {
    setTitle("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setStartTime("09:00");
    setEndDate("");
    setEndTime("10:00");
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

  const renderNotesTable = (notesGroup: PersonalNote[]) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400 tracking-wider">
              <th className="py-3 px-4 w-12 text-center">No</th>
              <th className="py-3 px-4">Judul</th>
              <th className="py-3 px-4">Keterangan</th>
              <th className="py-3 px-4">Catatan</th>
              <th className="py-3 px-4">Waktu Pengerjaan</th>
              <th className="py-3 px-4 w-20 text-center">Ceklist</th>
              <th className="py-3 px-4 w-28 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 text-xs">
            {notesGroup.map((note, index) => {
              const isCompleted = note.status === "COMPLETED";
              return (
                <tr 
                  key={note.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors cursor-pointer group"
                  onClick={() => loadNoteIntoForm(note, false)}
                >
                  <td className="py-4 px-4 text-center font-bold text-gray-400">{index + 1}</td>
                  <td className="py-4 px-4 font-bold text-gray-900 dark:text-white max-w-xs truncate">
                    <span className={isCompleted ? "line-through text-gray-400 dark:text-gray-500" : ""}>{note.title}</span>
                  </td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{note.description || "-"}</td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate">{note.notes || "-"}</td>
                  <td className="py-4 px-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {new Date(note.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - {note.startDate.split("T")[1]?.slice(0,5) || "09:00"}
                  </td>
                  <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center">
                      <button
                        onClick={(e) => toggleNoteStatus(note, e)}
                        className={`w-5 h-5 border-2 flex items-center justify-center transition-colors rounded-none ${
                          isCompleted 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-amber-500"
                        }`}
                      >
                        {isCompleted && (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => loadNoteIntoForm(note, false)}
                        className="text-gray-500 hover:text-black dark:hover:text-white hover:underline transition"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => loadNoteIntoForm(note, true)}
                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 hover:underline transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDirect(note.id)}
                        className="text-red-500 hover:text-red-700 hover:underline transition"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
            resetForm();
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
      ) : filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-gray-250 dark:border-gray-800 bg-white dark:bg-white/[0.01]">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">Tidak ada catatan yang ditemukan</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Cobalah mengubah filter pencarian Anda atau buat catatan baru dengan menekan tombol di kanan atas.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Q1 Section */}
          <div className="bg-white dark:bg-white/[0.02] border border-red-200 dark:border-red-950/40 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-red-600">Prioritas Tinggi (Q1)</h2>
              </div>
              <span className="text-[10px] font-black text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5">{filteredNotes.filter(n => n.priority === "Q1").length} Catatan</span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q1").length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Tidak ada catatan prioritas Q1.</p>
            ) : (
              renderNotesTable(filteredNotes.filter(n => n.priority === "Q1"))
            )}
          </div>

          {/* Q2 Section */}
          <div className="bg-white dark:bg-white/[0.02] border border-amber-200 dark:border-amber-950/40 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-amber-600">Prioritas Sedang (Q2)</h2>
              </div>
              <span className="text-[10px] font-black text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5">{filteredNotes.filter(n => n.priority === "Q2").length} Catatan</span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q2").length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Tidak ada catatan prioritas Q2.</p>
            ) : (
              renderNotesTable(filteredNotes.filter(n => n.priority === "Q2"))
            )}
          </div>

          {/* Q3 Section */}
          <div className="bg-white dark:bg-white/[0.02] border border-green-200 dark:border-green-950/40 p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <h2 className="text-xs font-black uppercase tracking-wider text-green-600">Prioritas Rendah (Q3)</h2>
              </div>
              <span className="text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-0.5">{filteredNotes.filter(n => n.priority === "Q3").length} Catatan</span>
            </div>
            {filteredNotes.filter(n => n.priority === "Q3").length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Tidak ada catatan prioritas Q3.</p>
            ) : (
              renderNotesTable(filteredNotes.filter(n => n.priority === "Q3"))
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Selesai / Tenggat</p>
                    <p className="mt-1 font-bold text-black dark:text-white">{formatDateIndo(endDate || startDate)} - {endTime}</p>
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

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-500">Tanggal Selesai / Tenggat</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-xs text-black outline-none transition focus:border-amber-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-gray-500">Jam Selesai</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
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
