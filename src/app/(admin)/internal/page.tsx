"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, BoxIconLine } from "@/icons";

interface InternalDocument {
  id: string;
  documentType: string;
  documentNumber: string;
  recipientName: string;
  issueDate: string;
  expiryDate: string | null;
  description: string | null;
  googleFolderId: string | null;
  createdAt: string;
}

export default function InternalDocumentsPage() {
  const [data, setData] = useState<InternalDocument[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState<InternalDocument | null>(null);

  // Sorting and searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "issue-newest" | "issue-oldest">("issue-newest");

  // Form states
  const [formData, setFormData] = useState({
    documentType: "PKWT",
    customType: "",
    documentNumber: "",
    recipientName: "",
    issueDate: "",
    expiryDate: "",
    description: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/internal");
      if (res.ok) {
        const docData = await res.json();
        setData(Array.isArray(docData) ? docData : []);
      }
    } catch (e) {
      console.error("Failed to fetch internal documents:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedId(null);
    setSelectedFile(null);
    setFormData({
      documentType: "PKWT",
      customType: "",
      documentNumber: "",
      recipientName: "",
      issueDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      description: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InternalDocument) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    setSelectedFile(null);

    const isCustom = !["PKWT", "SPHK", "SP1", "SP2", "SP3", "Surat Tugas", "Surat Keputusan"].includes(item.documentType);

    setFormData({
      documentType: isCustom ? "Custom" : item.documentType,
      customType: isCustom ? item.documentType : "",
      documentNumber: item.documentNumber,
      recipientName: item.recipientName,
      issueDate: item.issueDate ? item.issueDate.split("T")[0] : "",
      expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
      description: item.description || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (item: InternalDocument) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const actualType = formData.documentType === "Custom" ? formData.customType : formData.documentType;

    if (!actualType) {
      alert("Jenis dokumen harus diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const fData = new FormData();
      fData.append("documentType", actualType);
      fData.append("documentNumber", formData.documentNumber);
      fData.append("recipientName", formData.recipientName);
      fData.append("issueDate", formData.issueDate);
      if (formData.expiryDate) {
        fData.append("expiryDate", formData.expiryDate);
      }
      fData.append("description", formData.description);
      if (selectedFile) {
        fData.append("file", selectedFile);
      }

      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `/api/internal?id=${selectedId}` : "/api/internal";

      const res = await fetch(url, {
        method,
        body: fData,
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errJson = await res.json();
        alert(`Gagal menyimpan data surat: ${errJson.error || "Error tidak diketahui"}`);
      }
    } catch (e: any) {
      console.error(e);
      alert(`Terjadi kesalahan sistem: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data surat ini? Folder dokumen di Google Drive juga akan dihapus.")) return;

    const res = await fetch(`/api/internal?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    } else {
      alert("Gagal menghapus data.");
    }
  };

  // Filter and sort list
  const filteredData = data.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.recipientName.toLowerCase().includes(query) ||
      item.documentNumber.toLowerCase().includes(query) ||
      item.documentType.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query))
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.recipientName.localeCompare(b.recipientName);
    }
    if (sortBy === "name-desc") {
      return b.recipientName.localeCompare(a.recipientName);
    }
    if (sortBy === "issue-newest") {
      return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
    }
    if (sortBy === "issue-oldest") {
      return new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-wider">Surat Internal & PKWT</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kelola dan arsipkan PKWT, SPHK, SP1, SP2, dan dokumen tugas internal perusahaan secara terstruktur.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-500 text-white px-5 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all"
        >
          <PlusIcon /> Buat Surat Baru
        </button>
      </div>

      {/* FILTER & SORT PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 border border-stroke dark:border-strokedark rounded-none">
        <input
          type="text"
          placeholder="Cari berdasarkan nama karyawan, nomor surat, jenis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-semibold rounded-none focus:outline-none focus:border-brand-500"
        />

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2 grow justify-end">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1.5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-[10px] font-bold uppercase rounded-none focus:outline-none focus:border-brand-500"
            >
              <option value="issue-newest">Baru Dibuat (Tanggal Dikeluarkan)</option>
              <option value="issue-oldest">Lama Dibuat (Tanggal Dikeluarkan)</option>
              <option value="name-asc">Nama Penerima (A-Z)</option>
              <option value="name-desc">Nama Penerima (Z-A)</option>
            </select>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Total: {sortedData.length} Surat
          </span>
        </div>
      </div>

      {/* LETTERS TABLE */}
      <div className="border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 rounded-none overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-16 text-xs text-gray-400 italic">
            Belum ada arsip surat internal ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">Jenis Surat</th>
                  <th className="p-4">Nomor Surat</th>
                  <th className="p-4">Penerima (Karyawan)</th>
                  <th className="p-4">Tanggal Keluar</th>
                  <th className="p-4">Tanggal Habis</th>
                  <th className="p-4">Arsip Digital</th>
                  <th className="p-4 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke dark:divide-strokedark text-gray-700 dark:text-gray-300">
                {sortedData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                    {/* Doc Type Badge */}
                    <td className="p-4 pl-6 whitespace-nowrap">
                      <span className="px-2 py-0.5 bg-brand-50 text-brand-700 text-[9px] font-black uppercase dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 tracking-wider">
                        {item.documentType}
                      </span>
                    </td>

                    {/* Doc Number */}
                    <td className="p-4 font-bold text-black dark:text-white whitespace-nowrap">
                      {item.documentNumber}
                    </td>

                    {/* Recipient */}
                    <td className="p-4 font-bold uppercase text-[11px] whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {item.recipientName}
                    </td>

                    {/* Issue Date */}
                    <td className="p-4 whitespace-nowrap font-medium text-gray-500">
                      {new Date(item.issueDate).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Expiration Date */}
                    <td className="p-4 whitespace-nowrap font-semibold">
                      {item.expiryDate ? (
                        <span className="text-gray-600 dark:text-gray-400">
                          {new Date(item.expiryDate).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic font-normal">-</span>
                      )}
                    </td>

                    {/* GDrive Link */}
                    <td className="p-4 whitespace-nowrap">
                      {item.googleFolderId ? (
                        <a
                          href={`/dokumen`}
                          className="text-brand-500 hover:text-brand-600 font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5"
                        >
                          📂 Buka Folder G-Drive
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">No Folder</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 whitespace-nowrap text-right space-x-2">
                      <button
                        onClick={() => handleOpenView(item)}
                        className="px-2.5 py-1 bg-gray-50 text-gray-700 border border-stroke dark:border-strokedark dark:bg-gray-800 dark:text-gray-300 text-[9px] font-black uppercase tracking-wider hover:bg-gray-100 rounded-none transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1 border border-stroke dark:border-strokedark text-[9px] font-black uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 rounded-none transition-colors"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 text-[9px] font-black uppercase tracking-wider rounded-none transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FEATURE MODAL FOR SURAT INPUT */}
      <FeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Ubah Data Surat Internal" : "Buat Surat Internal Baru"}
        subtitle="Kelola arsip surat menyurat resmi secara digital"
        icon={<BoxIconLine />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Jenis Dokumen</label>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold uppercase text-gray-700 dark:text-gray-300 cursor-pointer"
                value={formData.documentType}
                onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              >
                <option value="PKWT">PKWT (Perjanjian Kerja)</option>
                <option value="SPHK">SPHK (Pemutusan Hubungan Kerja)</option>
                <option value="SP1">SP1 (Surat Peringatan 1)</option>
                <option value="SP2">SP2 (Surat Peringatan 2)</option>
                <option value="SP3">SP3 (Surat Peringatan 3)</option>
                <option value="Surat Tugas">Surat Tugas</option>
                <option value="Surat Keputusan">Surat Keputusan</option>
                <option value="Custom">Lainnya (Tulis Sendiri)</option>
              </select>
            </div>

            {formData.documentType === "Custom" && (
              <div>
                <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tulis Jenis Dokumen</label>
                <input
                  required
                  placeholder="Contoh: SPH (Surat Penawaran)"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold"
                  value={formData.customType}
                  onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nomor Surat Resmi</label>
            <input
              required
              placeholder="Contoh: 102/HRD-NH/V/2026"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold"
              value={formData.documentNumber}
              onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Penerima / Karyawan</label>
            <input
              required
              placeholder="Contoh: Ahmad Budiman"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold"
              value={formData.recipientName}
              onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tanggal Dikeluarkan</label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Tanggal Berakhir (Opsional)</label>
              <input
                type="date"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>

          {/* REAL FILE UPLOAD COMPONENT FOR DOCUMENTS */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Upload File Berkas Surat (Opsional)</label>
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none p-2.5 text-xs focus:border-brand-500 outline-none cursor-pointer font-bold"
            />
            {selectedFile && (
              <div className="mt-2 text-[10px] font-black text-brand-500 uppercase">
                Berkas Terpilih: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Keterangan / Catatan Singkat</label>
            <textarea
              rows={3}
              placeholder="Tulis keterangan atau catatan singkat mengenai surat ini..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-brand-500 text-white py-3.5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all shadow-sm flex items-center justify-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                Menyimpan Data...
              </>
            ) : isEditMode ? (
              "Perbarui Surat & Upload"
            ) : (
              "Simpan Surat & Upload"
            )}
          </button>
        </form>
      </FeatureModal>

      {/* DETAILED VIEW MODAL (GLOBAL REQUEST ACTION VIEW) */}
      <FeatureModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Detail Dokumen Surat"
        subtitle="Rincian arsip data lengkap secara rinci"
        icon={<BoxIconLine />}
      >
        {viewItem && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jenis Dokumen</span>
                <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-black uppercase dark:bg-brand-500/10 dark:text-brand-400 border border-brand-100 dark:border-brand-500/20 tracking-wider">
                  {viewItem.documentType}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nomor Surat Resmi</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{viewItem.documentNumber}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Penerima / Karyawan</span>
                <span className="text-xs font-black text-gray-800 dark:text-white uppercase">{viewItem.recipientName}</span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Arsip Google Drive</span>
                {viewItem.googleFolderId ? (
                  <a
                    href={`/dokumen`}
                    className="text-brand-500 hover:underline font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider"
                  >
                    📂 Buka Folder G-Drive
                  </a>
                ) : (
                  <span className="text-gray-400 italic">Tidak ada folder</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Keluar</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {new Date(viewItem.issueDate).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tanggal Berakhir</span>
                <span className="font-bold text-gray-800 dark:text-white">
                  {viewItem.expiryDate ? (
                    new Date(viewItem.expiryDate).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })
                  ) : (
                    <span className="text-gray-400 italic font-normal">-</span>
                  )}
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Keterangan / Catatan Singkat</span>
              <p className="bg-gray-50 dark:bg-gray-800 p-4 border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 leading-relaxed font-semibold">
                {viewItem.description || <span className="text-gray-400 italic font-normal">Tidak ada catatan keterangan tambahan.</span>}
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2 border border-stroke bg-white text-gray-700 text-xs font-bold rounded-none hover:bg-gray-100 dark:bg-gray-800 dark:border-strokedark dark:text-gray-300 transition-colors"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </FeatureModal>
    </div>
  );
}
