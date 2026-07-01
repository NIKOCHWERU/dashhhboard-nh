"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FeatureModal } from "@/components/common/FeatureModal";
import PicSelect from "@/components/common/PicSelect";
import { PlusIcon, BoxIconLine } from "@/icons";

interface Retainer {
  id: string;
  clientName: string;
  projectName: string;
  categories: string;
  startDate: string;
  endDate: string | null;
  status: string;
  contractValue: number | null;
  picEmail: string | null;
  googleFolderId: string | null;
  createdAt: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

export default function RetainerPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdminOrPIC = user?.role === "admin" || user?.canManageRetainer;

  const [data, setData] = useState<Retainer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // View detail modal state
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState<Retainer | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "date-newest" | "date-oldest">("name-asc");

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Form state
  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    categories: [] as string[],
    startDate: "",
    endDate: "",
    status: "Active",
    contractValue: "",
    picEmail: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRet, resUsers] = await Promise.all([
        fetch("/api/retainer"),
        fetch("/api/users"),
      ]);

      if (resRet.ok) {
        const retData = await resRet.json();
        setData(Array.isArray(retData) ? retData : []);
      }
      if (resUsers.ok) {
        const userData = await resUsers.json();
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (e) {
      console.error(e);
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
    setFormData({
      clientName: "",
      projectName: "",
      categories: [],
      startDate: "",
      endDate: "",
      status: "Active",
      contractValue: "",
      picEmail: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Retainer) => {
    setIsEditMode(true);
    setSelectedId(item.id);
    setFormData({
      clientName: item.clientName,
      projectName: item.projectName,
      categories: item.categories ? item.categories.split(",") : [],
      startDate: item.startDate ? item.startDate.split("T")[0] : "",
      endDate: item.endDate ? item.endDate.split("T")[0] : "",
      status: item.status,
      contractValue: item.contractValue ? item.contractValue.toString() : "",
      picEmail: item.picEmail || "",
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (item: Retainer) => {
    setViewItem(item);
    setIsViewOpen(true);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        categories: formData.categories.join(","),
      };

      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `/api/retainer?id=${selectedId}` : "/api/retainer";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Gagal menyimpan data retainer.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data retainer ini? Folder Google Drive klien ini juga akan ikut dihapus secara otomatis.")) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/retainer?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus data.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan sistem saat menghapus data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCategoryCheckboxChange = (cat: string) => {
    setFormData((prev) => {
      const exists = prev.categories.includes(cat);
      const newCats = exists
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return { ...prev, categories: newCats };
    });
  };

  // Helper for checking expiration warning
  const getExpirationWarning = (endDateStr: string | null) => {
    if (!endDateStr) return null;
    const endDate = new Date(endDateStr);
    const today = new Date();
    const diffMs = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { message: "KONTRAK KEDALUWARSA", type: "expired" };
    }
    if (diffDays <= 90) { // 3 months
      return { message: `⚠️ HABIS DALAM ${diffDays} HARI (KONTRAK MAU HABIS)`, type: "warning" };
    }
    return null;
  };

  // Sort and filter data
  const filteredData = data.filter((item) => {
    const matchesSearch = 
      item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.projectName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    
    const matchesCategory = 
      categoryFilter === "All" || 
      (item.categories && item.categories.split(",").map(c => c.trim().toUpperCase()).includes(categoryFilter.toUpperCase()));
      
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === "name-asc") {
      return a.clientName.localeCompare(b.clientName);
    }
    if (sortBy === "name-desc") {
      return b.clientName.localeCompare(a.clientName);
    }
    if (sortBy === "date-newest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date-oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    return 0;
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Pekerjaan Retainer (PT)</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Kelola dan pantau kontrak kerja sama jangka panjang secara detail dan teratur.
          </p>
        </div>
        {isAdminOrPIC && (
          <button
            onClick={handleOpenCreate}
            className="bg-brand-500 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all"
          >
            <PlusIcon /> Tambah Retainer Baru
          </button>
        )}
      </div>

      {/* Expiration warning alerts panel if any contract is ending */}
      {data.some((r) => getExpirationWarning(r.endDate)?.type === "warning") && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-amber-500 p-4 rounded-xl">
          <div className="flex gap-2">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="text-xs font-black text-amber-800 dark:text-amber-400 uppercase">Peringatan Kontrak Mendekati Expired!</h4>
              <p className="text-[10px] text-amber-700 dark:text-amber-500 mt-0.5">
                Ada kontrak klien retainer yang akan habis dalam waktu kurang dari 3 bulan (90 hari). Harap periksa dan hubungi klien untuk perpanjangan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Unified Filters Dashboard */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white dark:bg-white/[0.02] p-4 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama klien / pekerjaan..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 transition-colors text-xs font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="All">Semua Status</option>
              <option value="Active">Active</option>
              <option value="Finished">Finished</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Filter Kategori */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider hidden sm:inline">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="All">Semua Kategori</option>
              <option value="HRM">HRM</option>
              <option value="CORPORATE LEGAL">Corporate Legal</option>
              <option value="PAJAK">Pajak</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 border-t xl:border-t-0 border-gray-150 dark:border-gray-850 pt-3 xl:pt-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 bg-transparent text-gray-700 dark:text-white text-xs font-bold uppercase rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="name-asc">Nama Klien (A-Z)</option>
              <option value="name-desc">Nama Klien (Z-A)</option>
              <option value="date-newest">Baru Ditambahkan</option>
              <option value="date-oldest">Lama Ditambahkan</option>
            </select>
          </div>
          <span className="text-[10px] font-black text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {filteredData.length} Klien
          </span>
        </div>
      </div>

      {/* RETAINER GRID */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
        </div>
      ) : sortedData.length === 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 p-16 text-center text-xs text-gray-400 italic bg-white dark:bg-white/[0.03] rounded-2xl">
          Tidak ada data retainer terdaftar yang cocok dengan filter Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sortedData.map((item) => {
            const expWarn = getExpirationWarning(item.endDate);
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl hover:border-brand-500 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-brand-500/20">
                      Retainer
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest ${
                        item.status === "Active"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                          : item.status === "On Hold"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                          : "bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wide line-clamp-1">
                    {item.clientName}
                  </h3>
                  <p className="text-[11px] text-gray-455 dark:text-gray-400 font-semibold line-clamp-1 mt-0.5">
                    Pekerjaan: {item.projectName}
                  </p>

                  {/* Expiration warning badge inside card */}
                  {expWarn && (
                    <div
                      className={`text-[9px] font-black tracking-wider uppercase px-2.5 py-1 mt-3 text-center rounded-lg ${
                        expWarn.type === "expired"
                          ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/30 dark:border-red-800/30"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/30 dark:border-amber-800/30"
                      }`}
                    >
                      {expWarn.message}
                    </div>
                  )}

                  {/* Display categories tags */}
                  {item.categories && (
                    <div className="flex flex-wrap gap-1.5 mt-3.5">
                      {item.categories.split(",").map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 text-[8px] font-black uppercase rounded-lg tracking-wider"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap justify-between items-center gap-4">
                  <div className="text-[10px] text-gray-400 font-semibold space-y-1">
                    <p>
                      Mulai:{" "}
                      <span className="text-black dark:text-white font-bold">
                        {new Date(item.startDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                    {item.endDate && (
                      <p>
                        Selesai:{" "}
                        <span className="text-black dark:text-white font-bold">
                          {new Date(item.endDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenView(item)}
                      className="px-3 py-1.5 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors border border-brand-500/20"
                    >
                      Detail
                    </button>
                    {isAdminOrPIC && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="px-3 py-1.5 border border-gray-250 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          Ubah
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FEATURE MODAL FOR CREATE/EDIT */}
      <FeatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? "Ubah Data Retainer" : "Tambah Data Retainer"}
        subtitle="Rincian kontrak kerja jangka panjang perusahaan klien"
        icon={<BoxIconLine />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Klien / PT</label>
            <input
              required
              placeholder="Contoh: PT Braga Jaya"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nama Pekerjaan / Kontrak</label>
            <input
              required
              placeholder="Contoh: Corporate Restructuring"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            />
          </div>

          {/* MULTI-SELECT CATEGORIES */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Kategori Kontrak Retainer</label>
            <div className="flex flex-wrap gap-4 p-3 border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800/50 rounded-none">
              {["HRM", "CORPORATE LEGAL", "PAJAK"].map((cat) => (
                <label key={cat} className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat)}
                    onChange={() => handleCategoryCheckboxChange(cat)}
                    className="w-4 h-4 text-brand-500 border-stroke rounded-none cursor-pointer focus:ring-0 focus:ring-offset-0"
                  />
                  {cat}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Mulai Kontrak</label>
              <input
                type="date"
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Selesai Kontrak</label>
              <input
                type="date"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Nilai Kontrak (Rupiah)</label>
              <input
                type="number"
                placeholder="Contoh: 150000000"
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none"
                value={formData.contractValue}
                onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Status Kontrak</label>
              <select
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none font-bold uppercase"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">ACTIVE</option>
                <option value="Finished">FINISHED</option>
                <option value="On Hold">ON HOLD</option>
              </select>
            </div>
          </div>

          {/* PIC SELECT DROPDOWN */}
          <div>
            <PicSelect
              label="Person in Charge (PIC)"
              users={users}
              selectedValues={formData.picEmail ? formData.picEmail.split(",").map(p => p.trim()).filter(Boolean) : []}
              onChange={(selected) => setFormData({ ...formData, picEmail: selected.join(", ") })}
              placeholder="Pilih Karyawan PIC..."
              valueKey="email"
            />
          </div>

          <button className="w-full bg-brand-500 text-white py-3.5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all shadow-sm">
            {isEditMode ? "Perbarui Retainer" : "Simpan Retainer"}
          </button>
        </form>
      </FeatureModal>

      {/* DETAILED VIEW MODAL (GLOBAL REQUEST ACTION VIEW) */}
      <FeatureModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detail Pekerjaan Retainer"
        subtitle="Rincian kontrak kerja sama jangka panjang klien secara lengkap"
        icon={<BoxIconLine />}
      >
        {viewItem && (
          <div className="space-y-6 text-xs">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-stroke dark:border-strokedark">
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status Kontrak</span>
                <span className={`px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                  viewItem.status === "Active"
                    ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400"
                    : "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400"
                }`}>
                  {viewItem.status}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">G-Drive Folder</span>
                {viewItem.googleFolderId ? (
                  <a
                    href={`/narasumber-hukum`}
                    className="text-xs font-bold text-brand-500 hover:underline uppercase tracking-wide"
                  >
                    📂 Buka Google Drive
                  </a>
                ) : (
                  <span className="text-gray-400 italic">No Folder ID</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Perusahaan / Klien Retainer</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{viewItem.clientName}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark rounded-none">
                <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nama Pekerjaan / Kategori Pekerjaan</span>
                <span className="text-sm font-bold text-black dark:text-white uppercase">{viewItem.projectName}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tanggal Mulai Kontrak</span>
                  <span className="font-bold text-black dark:text-white">
                    {new Date(viewItem.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tanggal Selesai Kontrak</span>
                  <span className="font-bold text-black dark:text-white">
                    {viewItem.endDate ? new Date(viewItem.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Jangka Panjang"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Nilai Kontrak</span>
                  <span className="font-black text-green-600 dark:text-green-400 text-sm">
                    Rp {viewItem.contractValue ? viewItem.contractValue.toLocaleString("id-ID") : "0"}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-3 border border-stroke dark:border-strokedark rounded-none">
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">PIC Tenaga Kerja</span>
                  {viewItem.picEmail ? (
                    <div className="flex flex-col gap-2">
                      {viewItem.picEmail.split(",").map(p => p.trim()).filter(Boolean).map((email) => {
                        const matchedUser = users.find(u => u.email === email || u.name === email);
                        const name = matchedUser?.name || email;
                        const image = (matchedUser as any)?.image;
                        return (
                          <div key={email} className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-2 rounded-xl">
                            {image ? (
                              <img src={image} alt={name} className="w-7 h-7 rounded-full object-cover border border-gray-200 dark:border-gray-700" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-black flex items-center justify-center text-[9px] uppercase border border-brand-500/20">
                                {name.substring(0, 2)}
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <span className="block text-xs font-bold text-gray-900 dark:text-white truncate">{name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic">No PIC</span>
                  )}
                </div>
              </div>

              {/* Category tags */}
              {viewItem.categories && (
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Kategori Pekerjaan</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewItem.categories.split(",").map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-1 border border-stroke dark:border-strokedark text-gray-700 dark:text-gray-300 text-[10px] font-black uppercase rounded-none tracking-wider bg-gray-50 dark:bg-gray-800"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
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

      {isSaving && (
        <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-xs font-black uppercase tracking-widest animate-pulse">Sedang sinkronisasi Google Drive, mohon tunggu...</p>
        </div>
      )}
    </div>
  );
}
