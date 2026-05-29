"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

interface Retainer {
  id: string;
  clientName: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export default function DataPelamar() {
  const [data, setData] = useState<any[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // View details modal state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "apply-newest" | "apply-oldest" | "pt">("apply-newest");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    namaKandidat: "",
    posisi: "",
    noHp: "",
    sumber: "",
    tanggalApply: "",
    sesi: "",
    status: "Applied",
    picHr: "",
    pt: "",
    keterangan: "",
    catatan: ""
  });

  const fetchData = async () => {
    try {
      const [resPelamar, resRet, resUsers] = await Promise.all([
        fetch("/api/hrm/pelamar"),
        fetch("/api/retainer"),
        fetch("/api/users"),
      ]);

      if (resPelamar.ok) {
        const json = await resPelamar.json();
        if (Array.isArray(json)) setData(json);
      }
      if (resRet.ok) {
        const json = await resRet.json();
        if (Array.isArray(json)) setRetainers(json);
      }
      if (resUsers.ok) {
        const json = await resUsers.json();
        if (Array.isArray(json)) setUsers(json);
      }
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
        namaKandidat: item.namaKandidat || "",
        posisi: item.posisi || "",
        noHp: item.noHp || "",
        sumber: item.sumber || "",
        tanggalApply: item.tanggalApply ? new Date(item.tanggalApply).toISOString().split("T")[0] : "",
        sesi: item.sesi || "",
        status: item.status || "Applied",
        picHr: item.picHr || "",
        pt: item.pt || "",
        keterangan: item.keterangan || "",
        catatan: item.catatan || ""
      });
    } else {
      setSelectedId(null);
      setFormData({
        namaKandidat: "",
        posisi: "",
        noHp: "",
        sumber: "",
        tanggalApply: new Date().toISOString().split("T")[0],
        sesi: "Tahap Berkas",
        status: "Applied",
        picHr: "",
        pt: "",
        keterangan: "",
        catatan: ""
      });
    }
    openModal();
  };

  const handleOpenDetail = (item: any) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = selectedId ? `/api/hrm/pelamar?id=${selectedId}` : "/api/hrm/pelamar";
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
    if (!confirm("Hapus pelamar ini?")) return;
    try {
      const res = await fetch(`/api/hrm/pelamar?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Autocomplete suggestions lists from historical input
  const posisiHistory = Array.from(new Set(data.map((item) => item.posisi))).filter(Boolean);
  const sesiHistory = Array.from(new Set(data.map((item) => item.sesi))).filter(Boolean);
  const sumberHistory = Array.from(new Set(data.map((item) => item.sumber))).filter(Boolean);
  const keteranganHistory = Array.from(new Set(data.map((item) => item.keterangan))).filter(Boolean);

  // Search filtering
  const filteredData = data.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.namaKandidat.toLowerCase().includes(q) ||
      item.posisi.toLowerCase().includes(q) ||
      (item.pt && item.pt.toLowerCase().includes(q)) ||
      (item.keterangan && item.keterangan.toLowerCase().includes(q))
    );
  });

  // Sorting
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "name-asc") return a.namaKandidat.localeCompare(b.namaKandidat);
    if (sortBy === "name-desc") return b.namaKandidat.localeCompare(a.namaKandidat);
    if (sortBy === "apply-newest") return new Date(b.tanggalApply).getTime() - new Date(a.tanggalApply).getTime();
    if (sortBy === "apply-oldest") return new Date(a.tanggalApply).getTime() - new Date(b.tanggalApply).getTime();
    if (sortBy === "pt") return (a.pt || "").localeCompare(b.pt || "");
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header Row - Matching welcome header */}
      <div className="flex items-end justify-between pb-2 border-b border-stroke dark:border-strokedark">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white leading-tight uppercase tracking-wider">Talent Acquisition & Pelamar</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Data rekrutmen dan kandidat karyawan baru</p>
        </div>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-brand-500 text-xs font-bold text-white hover:bg-brand-600 transition-all shadow-sm uppercase tracking-wider">
          + Tambah Pelamar
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 border border-stroke dark:border-strokedark rounded-none">
        <input
          type="text"
          placeholder="Cari kandidat, posisi, atau PT..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-semibold rounded-none w-full md:max-w-xs focus:outline-none focus:border-brand-500"
        />

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-[10px] font-bold uppercase rounded-none focus:outline-none focus:border-brand-500"
          >
            <option value="apply-newest">Baru Melamar</option>
            <option value="apply-oldest">Lama Melamar</option>
            <option value="name-asc">Nama Kandidat (A-Z)</option>
            <option value="name-desc">Nama Kandidat (Z-A)</option>
            <option value="pt">Perusahaan (PT)</option>
          </select>
        </div>
      </div>

      <div className="rounded-none border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-stroke dark:border-strokedark uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3">Nama Kandidat</th>
                <th className="px-5 py-3">Posisi Dilamar</th>
                <th className="px-5 py-3">Alokasi Perusahaan (PT)</th>
                <th className="px-5 py-3">Sesi / Status / PIC</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {sortedData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                      {item.namaKandidat}
                    </span>
                    <div className="text-[10px] text-gray-500 font-normal mt-0.5">{item.noHp} | {item.sumber}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px]">{item.posisi}</td>
                  
                  {/* Allocated Company PT */}
                  <td className="px-5 py-3 font-semibold text-brand-500 uppercase text-[11px] whitespace-nowrap">
                    {item.pt ? `🏢 ${item.pt}` : <span className="text-gray-400 italic font-normal">Belum Dialokasikan</span>}
                  </td>

                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-1">
                      <span className="block text-xs font-bold dark:text-white uppercase">{item.sesi}</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-none text-[9px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 tracking-wider">
                          {item.status}
                        </span>
                        {item.picHr && (
                          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                            PIC: {item.picHr}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap space-x-1">
                    <button onClick={() => handleOpenDetail(item)} className="px-2 py-1.5 border border-stroke dark:border-strokedark text-[10px] font-bold text-brand-500 hover:bg-brand-50 rounded-none transition-colors uppercase">Detail</button>
                    <button onClick={() => handleOpenModal(item)} className="px-2 py-1.5 border border-stroke dark:border-strokedark text-[10px] font-bold text-blue-500 hover:bg-blue-50 rounded-none transition-colors uppercase">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="px-2 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold rounded-none transition-colors uppercase">Hapus</button>
                  </td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr><td colSpan={5} className="text-center p-16 text-gray-400 italic">Belum ada data kandidat pelamar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRUD */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl !rounded-none !bg-transparent !p-0">
        <div className="bg-white dark:bg-gray-900 rounded-none w-full shadow-2xl border border-stroke dark:border-strokedark">
          <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">{selectedId ? "Ubah Data Kandidat" : "Tambah Kandidat Baru"}</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nama Kandidat</label>
              <input type="text" value={formData.namaKandidat} placeholder="Contoh: Budi Santoso" onChange={e => setFormData({...formData, namaKandidat: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Posisi Dilamar</label>
              <input type="text" list="posisi-history" value={formData.posisi} placeholder="Contoh: Legal Officer" onChange={e => setFormData({...formData, posisi: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">No HP</label>
              <input type="text" value={formData.noHp} placeholder="Contoh: 08123456789" onChange={e => setFormData({...formData, noHp: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tanggal Melamar</label>
              <input type="date" value={formData.tanggalApply} onChange={e => setFormData({...formData, tanggalApply: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Tahapan Sesi</label>
              <input type="text" list="sesi-history" value={formData.sesi} placeholder="Contoh: Tahap Wawancara Direksi" onChange={e => setFormData({...formData, sesi: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Status Talent</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer">
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Hired">Hired</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Sumber Pelamar</label>
              <input type="text" list="sumber-history" value={formData.sumber} placeholder="Contoh: LinkedIn / JobsDB" onChange={e => setFormData({...formData, sumber: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>

            {/* DYNAMIC COMPANY (PT) SELECTION */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Alokasi Perusahaan (PT)</label>
              <select
                value={formData.pt}
                onChange={(e) => setFormData({ ...formData, pt: e.target.value })}
                className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer"
              >
                <option value="">-- BELUM DIALOKASIKAN --</option>
                {retainers.map((r) => (
                  <option key={r.id} value={r.clientName}>
                    {r.clientName}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Keterangan / Catatan Kualifikasi</label>
              <input type="text" list="keterangan-history" value={formData.keterangan} placeholder="Tulis kualifikasi singkat kandidat..." onChange={e => setFormData({...formData, keterangan: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
            </div>
          </div>
          <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
            <button onClick={closeModal} className="px-4 py-2 border border-stroke bg-white text-gray-700 text-xs font-bold rounded-none hover:bg-gray-100 dark:bg-gray-800 dark:border-strokedark dark:text-gray-300 transition-colors">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-none hover:bg-brand-600 transition-colors shadow-sm">Simpan Kandidat</button>
          </div>
        </div>
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} className="max-w-2xl !rounded-none !bg-transparent !p-0">
        {selectedItem && (
          <div className="bg-white dark:bg-gray-900 rounded-none w-full shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
            <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div>
                <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">Detail Profil Pelamar</span>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider mt-0.5">{selectedItem.namaKandidat}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider ${
                selectedItem.status === "Hired"
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400"
                  : selectedItem.status === "Interview"
                  ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400"
                  : "bg-gray-100 text-gray-700 border border-stroke dark:bg-gray-800 dark:text-gray-400"
              }`}>
                {selectedItem.status}
              </span>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Posisi Yang Dilamar</span>
                  <span className="text-sm font-bold text-black dark:text-white uppercase">💼 {selectedItem.posisi}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Alokasi Perusahaan (PT)</span>
                  <span className="text-sm font-bold text-brand-500 uppercase">🏢 {selectedItem.pt || "Belum Dialokasikan"}</span>
                </div>
              </div>

              <div className="border border-stroke dark:border-strokedark rounded-none overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody className="divide-y divide-stroke dark:divide-strokedark text-gray-700 dark:text-gray-300">
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px] w-1/3">No HP / WhatsApp</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedItem.noHp || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Tanggal Melamar</td>
                      <td className="p-3 font-semibold text-black dark:text-white">
                        {selectedItem.tanggalApply ? new Date(selectedItem.tanggalApply).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Sesi / Tahapan Saat Ini</td>
                      <td className="p-3 font-bold text-black dark:text-white uppercase">{selectedItem.sesi || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Sumber Lowongan</td>
                      <td className="p-3 font-semibold text-black dark:text-white uppercase">{selectedItem.sumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">PIC HRD</td>
                      <td className="p-3 font-bold text-black dark:text-white uppercase">{selectedItem.picHr || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Catatan Kualifikasi</td>
                      <td className="p-3 font-medium text-gray-600 dark:text-gray-400">{selectedItem.keterangan || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end bg-gray-50 dark:bg-gray-900/50">
              <button onClick={() => setIsDetailOpen(false)} className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-none hover:bg-brand-600 transition-colors shadow-sm uppercase tracking-wider">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Native Browser Google Search Style Autocomplete History Datalists */}
      <datalist id="posisi-history">
        {posisiHistory.map((val, i) => <option key={i} value={val} />)}
      </datalist>
      <datalist id="sesi-history">
        {sesiHistory.map((val, i) => <option key={i} value={val} />)}
      </datalist>
      <datalist id="sumber-history">
        {sumberHistory.map((val, i) => <option key={i} value={val} />)}
      </datalist>
      <datalist id="keterangan-history">
        {keteranganHistory.map((val, i) => <option key={i} value={val} />)}
      </datalist>
    </div>
  );
}
