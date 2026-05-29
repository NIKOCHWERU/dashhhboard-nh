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

  const fetchData = async () => {
    const res = await fetch("/api/perorangan");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stroke dark:border-strokedark pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Kasus Perorangan</h1>
          <p className="text-xs text-gray-500">Daftar klien individu dan perkara hukum yang sedang ditangani secara profesional.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-500 text-white px-5 py-2.5 rounded-none font-black text-xs flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all uppercase tracking-wider w-full sm:w-auto justify-center">
          <PlusIcon /> Tambah Kasus Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-none"></div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark p-5 rounded-none hover:border-brand-500 hover:shadow-lg transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-8 bg-blue-500/10 text-blue-500 rounded-none flex items-center justify-center font-black text-xs">P</div>
                  <span className="text-[9px] font-black uppercase bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-none dark:bg-blue-900/20 tracking-widest">{item.status}</span>
                </div>
                <h3 className="font-black text-sm text-black dark:text-white uppercase tracking-wide">{item.clientName}</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Perkara: {item.caseType}</p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-stroke dark:border-strokedark flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                 <span>Terdaftar: {new Date(item.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                 <button onClick={() => handleOpenView(item)} className="text-brand-500 font-black hover:underline uppercase tracking-wider">LIHAT DETAIL →</button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 italic bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-none text-xs">Belum ada kasus perorangan.</div>
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
