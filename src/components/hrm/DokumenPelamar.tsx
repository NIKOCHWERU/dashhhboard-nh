"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

interface Pelamar {
  id: string;
  namaKandidat: string;
  posisi: string;
  status: string;
  pt: string | null;
  picHr: string | null;
  documents: string;
  createdAt: string;
}

export default function DokumenPelamar() {
  const { isOpen, openModal, closeModal } = useModal();
  const [pelamarList, setPelamarList] = useState<Pelamar[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "date" | "pt">("date");

  // Form State
  const [uploadForm, setUploadForm] = useState({
    pelamarId: "",
    documentType: "CV / Resume",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/hrm/pelamar");
      if (res.ok) {
        const json = await res.json();
        setPelamarList(Array.isArray(json) ? json : []);
      }
    } catch (e) {
      console.error("Failed to fetch pelamar in docs page:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadClick = () => {
    setUploadForm({
      pelamarId: pelamarList[0]?.id || "",
      documentType: "CV / Resume",
    });
    setSelectedFile(null);
    openModal();
  };

  const handleSaveUpload = async () => {
    const selectedPelamar = pelamarList.find((p) => p.id === uploadForm.pelamarId);
    if (!selectedPelamar) {
      alert("Harap pilih kandidat.");
      return;
    }
    if (!selectedFile) {
      alert("Harap pilih file dokumen terlebih dahulu.");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("pelamarId", uploadForm.pelamarId);
      formData.append("documentType", uploadForm.documentType);
      formData.append("file", selectedFile);

      const res = await fetch("/api/hrm/pelamar/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert(`Berkas ${uploadForm.documentType} berhasil diupload ke Google Drive dan disimpan di database!`);
        closeModal();
        fetchData();
      } else {
        const errJson = await res.json();
        alert(`Gagal mengupload berkas: ${errJson.error || "Error tidak diketahui"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Terjadi kesalahan sistem: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Filter and sort
  const filteredList = pelamarList.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.namaKandidat.toLowerCase().includes(q) ||
      item.posisi.toLowerCase().includes(q) ||
      (item.pt && item.pt.toLowerCase().includes(q)) ||
      (item.picHr && item.picHr.toLowerCase().includes(q))
    );
  });

  const sortedList = [...filteredList].sort((a, b) => {
    if (sortBy === "name") {
      return a.namaKandidat.localeCompare(b.namaKandidat);
    }
    if (sortBy === "pt") {
      return (a.pt || "").localeCompare(b.pt || "");
    }
    if (sortBy === "date") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex items-end justify-between pb-2 border-b border-stroke dark:border-strokedark">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white leading-tight uppercase tracking-wider">Berkas Dokumen Pelamar</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Manajemen arsip dokumen kandidat, alokasi PT, dan PIC</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleUploadClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-brand-500 text-xs font-bold text-white hover:bg-brand-600 transition-all shadow-sm uppercase tracking-wider">
            + Upload Dokumen Baru
          </button>
        </div>
      </div>

      {/* FILTER & SORT BAR */}
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
            <option value="date">Terbaru Diupload</option>
            <option value="name">Nama Kandidat (A-Z)</option>
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
                <th className="px-5 py-3">Daftar Dokumen</th>
                <th className="px-5 py-3">PIC HR / Karyawan</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center p-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-500 mx-auto"></div>
                  </td>
                </tr>
              ) : sortedList.map((item, index) => {
                const docs = item.documents ? item.documents.split(",").filter(Boolean) : [];
                return (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <span className="font-bold text-gray-900 dark:text-white block uppercase tracking-wide">{item.namaKandidat}</span>
                      <span className="text-[10px] text-gray-500 block">Dibuat: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300 font-bold uppercase text-[11px]">{item.posisi}</td>

                    {/* Allocated Company PT */}
                    <td className="px-5 py-3 font-semibold text-brand-500 uppercase text-[11px] whitespace-nowrap">
                      {item.pt ? `🏢 ${item.pt}` : <span className="text-gray-400 italic font-normal">Belum Dialokasikan</span>}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {docs.map((doc, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-none text-[9px] font-black uppercase border border-stroke dark:border-strokedark flex items-center gap-1 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            {doc}
                          </span>
                        ))}
                        {docs.length === 0 && (
                          <span className="text-gray-400 italic">Belum ada berkas</span>
                        )}
                      </div>
                    </td>

                    {/* Associated PIC HR */}
                    <td className="px-5 py-3 font-bold text-gray-500 uppercase text-[10px] whitespace-nowrap">
                      {item.picHr ? `👤 ${item.picHr}` : <span className="text-gray-400 italic font-normal">-</span>}
                    </td>

                    <td className="px-5 py-3 text-right">
                      <a href={`/dokumen`} className="px-2.5 py-1.5 border border-stroke dark:border-strokedark text-[9px] font-black uppercase text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-none transition-colors">
                        Buka Explorer Berkas
                      </a>
                    </td>
                  </tr>
                );
              })}
              {sortedList.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center p-16 text-gray-400 italic">Belum ada dokumen kandidat.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-md !rounded-none !bg-transparent !p-0">
        <div className="bg-white dark:bg-gray-900 rounded-none w-full shadow-2xl border border-stroke dark:border-strokedark">
          <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Upload Dokumen Baru</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Pilih Kandidat Pelamar</label>
              <select
                value={uploadForm.pelamarId}
                onChange={(e) => setUploadForm({ ...uploadForm, pelamarId: e.target.value })}
                className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer"
              >
                <option value="">Pilih Kandidat...</option>
                {pelamarList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaKandidat} ({p.posisi}) {p.pt ? `[${p.pt}]` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Jenis Berkas Dokumen</label>
              <select
                value={uploadForm.documentType}
                onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer"
              >
                <option value="CV / Resume">CV / Resume</option>
                <option value="KTP">KTP</option>
                <option value="Ijazah Terakhir">Ijazah Terakhir</option>
                <option value="Sertifikat Pelatihan">Sertifikat Pelatihan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Pilih Berkas File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full p-2 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 cursor-pointer font-semibold"
              />
              {selectedFile && (
                <div className="mt-2 text-[10px] font-bold text-brand-500 uppercase">
                  Selected File: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </div>
          <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
            <button onClick={closeModal} className="px-4 py-2 border border-stroke bg-white text-gray-700 text-xs font-bold rounded-none hover:bg-gray-100 dark:bg-gray-800 dark:border-strokedark dark:text-gray-300 transition-colors" disabled={uploading}>Batal</button>
            <button 
              onClick={handleSaveUpload} 
              className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-none hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-1.5"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Mengupload...
                </>
              ) : (
                "Upload File"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
