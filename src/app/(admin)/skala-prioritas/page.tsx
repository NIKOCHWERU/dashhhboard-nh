"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, TaskIcon, BoxIconLine } from "@/icons";

interface PriorityTask {
  id: string;
  taskName: string;
  level: number;
  status: string;
  deadline: string;
}

export default function SkalaPrioritasPage() {
  const [data, setData] = useState<PriorityTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<PriorityTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ taskName: "", level: "1", deadline: "", status: "Pending" });

  const fetchData = async () => {
    const res = await fetch("/api/skala-prioritas");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/skala-prioritas", { method: "POST", body: JSON.stringify(formData) });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ taskName: "", level: "1", deadline: "", status: "Pending" });
      fetchData();
    }
  };

  const getLevelLabel = (level: number) => {
    const labels: Record<number, string> = { 1: "Urgent", 2: "High", 3: "Medium", 4: "Low", 5: "Informational" };
    return labels[level] || "Normal";
  };

  const getLevelColor = (level: number) => {
    const colors: Record<number, string> = { 1: "bg-red-500", 2: "bg-orange-500", 3: "bg-blue-500", 4: "bg-success-500", 5: "bg-gray-400" };
    return colors[level] || "bg-brand-500";
  };

  const getLevelBadgeStyle = (level: number) => {
    const styles: Record<number, string> = {
      1: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
      2: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
      3: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      4: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20",
      5: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20",
    };
    return styles[level] || "bg-brand-50 text-brand-700";
  };

  const handleOpenView = (item: PriorityTask) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stroke dark:border-strokedark pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Skala Prioritas</h1>
          <p className="text-xs text-gray-500">Urutkan tugas berdasarkan tingkat urgensi hukum dan batas waktu penyelesaian.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-500 text-white px-5 py-2.5 rounded-none font-black text-xs flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all uppercase tracking-wider w-full sm:w-auto justify-center">
          <PlusIcon /> Tambah Tugas Baru
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-none"></div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleOpenView(item)}
              className="bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark p-4 rounded-none flex items-center justify-between hover:border-brand-500 hover:shadow-md cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className={`w-2.5 h-10 rounded-none ${getLevelColor(item.level)}`}></div>
                <div>
                  <h3 className="font-black text-black dark:text-white text-sm group-hover:text-brand-500 transition-colors uppercase tracking-wide">{item.taskName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[9px] font-black uppercase text-gray-400">Level: {getLevelLabel(item.level)}</span>
                    {item.deadline && <span className="text-[9px] font-black uppercase text-brand-500">Deadline: {new Date(item.deadline).toLocaleDateString("id-ID")}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-none ${item.status === 'Completed' ? 'bg-success-500 text-white' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-400 tracking-wider'}`}>
                  {item.status}
                </span>
                <span className="text-[9px] text-brand-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest hidden sm:inline">Lihat →</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 italic bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-none text-xs">Belum ada tugas prioritas.</div>
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
            <input required className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold" value={formData.taskName} onChange={(e) => setFormData({...formData, taskName: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tingkat Urgensi</label>
              <select className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold cursor-pointer" value={formData.level} onChange={(e) => setFormData({...formData, level: e.target.value})}>
                <option value="1">Level 1 - Urgent</option>
                <option value="2">Level 2 - High</option>
                <option value="3">Level 3 - Medium</option>
                <option value="4">Level 4 - Low</option>
                <option value="5">Level 5 - Informational</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Batas Waktu (Deadline)</label>
              <input type="date" className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} />
            </div>
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
                <span className={`px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase ${viewItem.status === 'Completed' ? 'bg-success-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
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
                  {getLevelLabel(viewItem.level)} (Level {viewItem.level})
                </span>
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
