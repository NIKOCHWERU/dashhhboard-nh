"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

export default function DaftarRetainer() {
  const [data, setData] = useState<any[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    startDate: "",
    endDate: "",
    status: "Active",
    contractValue: ""
  });

  const fetchData = async () => {
    try {
      const res = await fetch("/api/retainer");
      const json = await res.json();
      if (Array.isArray(json)) setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setSelectedId(item.id);
      setFormData({
        clientName: item.clientName || "",
        projectName: item.projectName || "",
        startDate: item.startDate ? new Date(item.startDate).toISOString().split("T")[0] : "",
        endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
        status: item.status || "Active",
        contractValue: item.contractValue ? item.contractValue.toString() : ""
      });
    } else {
      setSelectedId(null);
      setFormData({ clientName: "", projectName: "", startDate: "", endDate: "", status: "Active", contractValue: "" });
    }
    openModal();
  };

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = selectedId ? `/api/retainer?id=${selectedId}` : "/api/retainer";
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        closeModal();
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus retainer ini?")) return;
    try {
      const res = await fetch(`/api/retainer?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImport = () => {
    alert("Fitur Import Excel akan memproses data retainer otomatis.");
  };

  return (
    <div className="space-y-4">
      {/* Header Row - Matching welcome header */}
      <div className="flex items-end justify-between pb-2 border-b border-stroke dark:border-strokedark">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white leading-tight uppercase tracking-wider">Daftar Retainer</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Manajemen kontrak klien retainer perusahaan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImport} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stroke bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-strokedark dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 transition-all shadow-sm uppercase tracking-wider">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Import Data
          </button>
          <button onClick={() => handleOpenModal()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 text-xs font-bold text-white hover:bg-brand-600 transition-all shadow-sm uppercase tracking-wider">
            + Tambah Retainer
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[800px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-stroke dark:border-strokedark uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Klien</th>
                <th className="px-5 py-3">Nama Project</th>
                <th className="px-5 py-3">Masa Berlaku</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Nilai Kontrak</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {data.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-bold text-gray-900 dark:text-white block">{item.clientName}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-medium">{item.projectName}</td>
                  <td className="px-5 py-3">
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'} s/d</div>
                    <div className="text-[10px] text-gray-900 dark:text-white font-bold">{item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded-none text-[9px] font-black uppercase ${item.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-900 dark:text-white font-bold">
                    Rp {(item.contractValue || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="px-5 py-3 text-right flex justify-end gap-1">
                    <button onClick={() => handleOpenDetail(item)} className="px-2 py-1 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-none font-bold transition-colors uppercase text-[10px]">Detail</button>
                    <button onClick={() => handleOpenModal(item)} className="px-2 py-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-none font-bold transition-colors uppercase text-[10px]">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-none font-bold transition-colors uppercase text-[10px]">Hapus</button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && <tr><td colSpan={6} className="text-center p-6 text-gray-400">Belum ada data retainer.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl !rounded-2xl !bg-transparent !p-0">
        <div className="bg-white dark:bg-gray-900 rounded-2xl w-full shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
          <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{selectedId ? "Edit Retainer" : "Tambah Retainer"}</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nama Klien</label>
              <input type="text" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-medium" />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nama Project</label>
              <input type="text" value={formData.projectName} onChange={e => setFormData({...formData, projectName: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tanggal Mulai</label>
              <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tanggal Berakhir</label>
              <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-semibold cursor-pointer">
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Finished">Finished</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nilai Kontrak (Rp)</label>
              <input type="number" value={formData.contractValue} onChange={e => setFormData({...formData, contractValue: e.target.value})} className="w-full p-2.5 border border-stroke rounded-xl dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-medium" />
            </div>
          </div>
          <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
            <button onClick={closeModal} className="px-4 py-2 border border-stroke bg-white text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-100 dark:bg-gray-800 dark:border-strokedark dark:text-gray-300 transition-colors">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-sm">Simpan</button>
          </div>
        </div>
      </Modal>

      {/* DETAIL MODAL (GLOBAL REQUEST ACTION VIEW) */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-xl !rounded-2xl !bg-transparent !p-0">
        {selectedItem && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
            <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div>
                <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">Detail Kontrak Retainer</span>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider mt-0.5">{selectedItem.clientName}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                selectedItem.status === "Active"
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                  : "bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20"
              }`}>
                {selectedItem.status}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-xl">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Proyek / Kontrak Kerja</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{selectedItem.projectName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tanggal Mulai</span>
                  <span className="font-bold text-black dark:text-white">
                    {selectedItem.startDate ? new Date(selectedItem.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-xl">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tanggal Berakhir</span>
                  <span className="font-bold text-black dark:text-white">
                    {selectedItem.endDate ? new Date(selectedItem.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-xl">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nilai Total Kontrak</span>
                <span className="text-sm font-black text-green-600 dark:text-green-400">
                  Rp {(selectedItem.contractValue || 0).toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end bg-gray-50 dark:bg-gray-900/50">
              <button onClick={() => setIsDetailOpen(false)} className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-sm uppercase tracking-wider">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
