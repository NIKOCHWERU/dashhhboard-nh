"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, TaskIcon, BoxIconLine } from "@/icons";
import PicSelect from "@/components/common/PicSelect";

interface SkalaPrioritas {
  id: string;
  taskName: string;
  level: string; // 1 (Urgent), 2 (High), 3 (Medium), 4 (Low), 5 (Informational)
  deadline?: string | null;
  status: string;
  picEmail?: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export default function SkalaPrioritasPage() {
  const [data, setData] = useState<SkalaPrioritas[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<SkalaPrioritas | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ taskName: "", level: "1", deadline: "", status: "Pending", picEmail: "" });

  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("All");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resData, resUsers] = await Promise.all([
        fetch("/api/skala-prioritas"),
        fetch("/api/users"),
      ]);
      if (resData.ok) setData(await resData.json());
      if (resUsers.ok) setUsers(await resUsers.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "1": return "bg-red-500";
      case "2": return "bg-orange-500";
      case "3": return "bg-amber-500";
      case "4": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "1": return "Level 1 - Urgent / Darurat";
      case "2": return "Level 2 - Tinggi / High";
      case "3": return "Level 3 - Sedang / Medium";
      case "4": return "Level 4 - Rendah / Low";
      default: return "Level 5 - Informasi";
    }
  };

  const getLevelBadgeStyle = (level: string) => {
    switch (level) {
      case "1": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400";
      case "2": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400";
      case "3": return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400";
      case "4": return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400";
      default: return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400";
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch = item.taskName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "All" || item.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/skala-prioritas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ taskName: "", level: "1", deadline: "", status: "Pending", picEmail: "" });
      fetchData();
    }
  };

  const handleOpenView = (item: SkalaPrioritas) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Skala Prioritas Kerja</h1>
          <p className="text-xs text-gray-500">Kelola & tentukan tingkat urgensi tugas hukum tim secara terstruktur.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all uppercase tracking-wider w-full sm:w-auto justify-center">
          <PlusIcon /> Tambah Prioritas Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="Cari nama tugas / perkara..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 transition-colors text-xs font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Urgensi:</span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
          >
            <option value="All">Semua Level</option>
            <option value="1">Level 1 (Urgent)</option>
            <option value="2">Level 2 (High)</option>
            <option value="3">Level 3 (Medium)</option>
            <option value="4">Level 4 (Low)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenView(item)}
              className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex items-center justify-between hover:border-brand-500 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-10 rounded-full ${getLevelColor(item.level)}`}></div>
                <div>
                  <h3 className="font-black text-black dark:text-white text-sm group-hover:text-brand-500 transition-colors uppercase tracking-wide">{item.taskName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black uppercase text-gray-400">{getLevelLabel(item.level)}</span>
                    {item.deadline && <span className="text-[9px] font-black uppercase text-brand-500">Deadline: {new Date(item.deadline).toLocaleDateString("id-ID")}</span>}
                    {item.picEmail && <span className="text-[9px] font-bold text-gray-500">👤 PIC: {item.picEmail}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border ${item.status === 'Completed' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {item.status}
                </span>
                <span className="text-[9px] text-brand-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest hidden sm:inline">Lihat →</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl text-xs">
            Belum ada tugas prioritas terdaftar.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <FeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Skala Prioritas"
        subtitle="Tetapkan tingkat urgensi untuk tugas atau perkara baru"
        icon={<TaskIcon />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Tugas / Perkara Resmi</label>
            <input required className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold" value={formData.taskName} onChange={(e) => setFormData({...formData, taskName: e.target.value})} placeholder="Contoh: Peninjauan Perjanjian Kerjasama" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tingkat Urgensi</label>
              <select className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold cursor-pointer uppercase" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                <option value="1">Level 1 - Urgent / Darurat</option>
                <option value="2">Level 2 - High / Tinggi</option>
                <option value="3">Level 3 - Medium / Sedang</option>
                <option value="4">Level 4 - Low / Rendah</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Batas Waktu (Deadline)</label>
              <input type="date" className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
            </div>
          </div>

          {/* PIC SELECT DROPDOWN */}
          <div>
            <PicSelect
              label="Person in Charge (PIC)"
              users={users}
              selectedValues={formData.picEmail ? formData.picEmail.split(",").map(e => e.trim()) : []}
              onChange={(selected) => setFormData({ ...formData, picEmail: selected.join(",") })}
              valueKey="email"
              placeholder="Pilih PIC Karyawan..."
            />
          </div>

          <button className="w-full bg-brand-500 text-white py-3.5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all">Simpan Prioritas</button>
        </form>
      </FeatureModal>

      {/* VIEW DETAILS MODAL */}
      <FeatureModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detail Tugas Prioritas"
        subtitle="Rincian tingkat prioritas dan deadline tugas hukum"
        icon={<BoxIconLine />}
      >
        {viewItem && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Tugas</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${viewItem.status === 'Completed' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                  {viewItem.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Deadline</span>
                <span className="text-xs font-bold text-red-500">
                  {viewItem.deadline ? new Date(viewItem.deadline).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  }) : "Tanpa Batas Waktu"}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Tugas / Masalah Hukum</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{viewItem.taskName}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tingkat Urgensi / Prioritas</span>
                <span className={`inline-block px-3 py-1 text-xs font-black uppercase border tracking-wider ${getLevelBadgeStyle(viewItem.level)}`}>
                  {getLevelLabel(viewItem.level)}
                </span>
              </div>

              {viewItem.picEmail && (
                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PIC Penanggung Jawab</span>
                  <span className="text-xs font-bold text-black dark:text-white">👤 {viewItem.picEmail}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsViewOpen(false)}
              className="w-full bg-brand-500 text-white py-3 rounded-none font-black uppercase tracking-wider text-xs hover:bg-brand-600 transition-all shadow-sm"
            >
              Tutup Rincian
            </button>
          </div>
        )}
      </FeatureModal>
    </div>
  );
}
