"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, UserCircleIcon, BoxIconLine } from "@/icons";

interface Perorangan {
  id: string;
  clientName: string;
  caseType: string;
  status: string;
  startDate: string;
}

export default function PeroranganPage() {
  const [data, setData] = useState<Perorangan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Perorangan | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ clientName: "", caseType: "", startDate: "", status: "In Progress" });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("name-asc");

  const fetchData = async () => {
    const res = await fetch("/api/perorangan");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredData = data.filter((item) => {
    const matchesSearch = 
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caseType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
      
    return matchesSearch && matchesStatus;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.clientName.localeCompare(b.clientName);
    }
    if (sortBy === "name-desc") {
      return b.clientName.localeCompare(a.clientName);
    }
    if (sortBy === "date-newest") {
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    }
    if (sortBy === "date-oldest") {
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    }
    return 0;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/perorangan", { method: "POST", body: JSON.stringify(formData) });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ clientName: "", caseType: "", startDate: "", status: "In Progress" });
      fetchData();
    }
  };

  const handleOpenView = (item: Perorangan) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Kasus Perorangan</h1>
          <p className="text-xs text-gray-500">Daftar klien individu dan perkara hukum yang sedang ditangani secara profesional.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all uppercase tracking-wider w-full sm:w-auto justify-center">
          <PlusIcon /> Tambah Kasus Baru
        </button>
      </div>

      {/* Filters Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama klien / perkara..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 transition-colors text-xs font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="All">Semua Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Finished">Finished</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 border-t md:border-t-0 border-gray-150 dark:border-gray-850 pt-3 md:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="name-asc">Nama Klien (A-Z)</option>
              <option value="name-desc">Nama Klien (Z-A)</option>
              <option value="date-newest">Baru Pendaftaran</option>
              <option value="date-oldest">Lama Pendaftaran</option>
            </select>
          </div>
          <span className="text-[10px] font-black text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {filteredData.length} Kasus
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <>
            <div className="h-40 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
            <div className="h-40 bg-gray-100 dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
          </>
        ) : sortedData.length > 0 ? (
          sortedData.map((item) => (
            <div key={item.id} className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl hover:border-brand-500 hover:shadow-xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center font-black text-xs border border-brand-500/20">P</div>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest border ${
                    item.status === "In Progress"
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : item.status === "Finished"
                      ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                      : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20"
                  }`}>{item.status}</span>
                </div>
                <h3 className="font-black text-sm text-black dark:text-white uppercase tracking-wide">{item.clientName}</h3>
                <p className="text-[10px] text-gray-455 dark:text-gray-400 font-bold uppercase tracking-widest mt-1">Perkara: {item.caseType}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex justify-between items-center text-[10px] text-gray-450 dark:text-gray-400 font-semibold">
                 <span>Terdaftar: {new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                 <button onClick={() => handleOpenView(item)} className="text-brand-500 font-black hover:underline uppercase tracking-wider">LIHAT DETAIL →</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl text-xs">
            Belum ada kasus perorangan yang terdaftar.
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      <FeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Kasus Perorangan"
        subtitle="Daftarkan klien individu dan rincian perkara baru"
        icon={<UserCircleIcon />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Klien</label>
            <input required className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold" value={formData.clientName} onChange={(e) => setFormData({...formData, clientName: e.target.value})} />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Jenis Perkara (Misal: Perdata, Pidana)</label>
            <input required className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold" value={formData.caseType} onChange={(e) => setFormData({...formData, caseType: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tanggal Pendaftaran</label>
              <input type="date" required className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Status</label>
              <select className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                <option value="In Progress">IN PROGRESS</option>
                <option value="Finished">FINISHED</option>
                <option value="On Hold">ON HOLD</option>
              </select>
            </div>
          </div>
          <button className="w-full bg-brand-500 text-white py-3.5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all">Simpan Kasus</button>
        </form>
      </FeatureModal>

      {/* VIEW DETAILS MODAL */}
      <FeatureModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detail Kasus Perorangan"
        subtitle="Rincian data kasus klien individu secara lengkap"
        icon={<BoxIconLine />}
      >
        {viewItem && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Kasus</span>
                <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-black uppercase dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20 tracking-wider">
                  {viewItem.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Pendaftaran</span>
                <span className="text-xs font-bold text-black dark:text-white">
                  {new Date(viewItem.startDate).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Klien / Individu</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{viewItem.clientName}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jenis Perkara / Masalah Hukum</span>
                <span className="text-sm font-bold text-brand-500 uppercase">{viewItem.caseType}</span>
              </div>
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
