"use client";
import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";

interface Karyawan {
  id: string;
  name: string;
  position: string;
  email: string | null;
  phone: string | null;
  status: string;
  nik: string | null;
  divisi: string | null;
  jabatan: string | null;
  atasanLangsung: string | null;
  statusKerja: string | null;
  tanggalMasuk: string | null;
  tanggalKeluar: string | null;
  masaKontrak: string | null;
  lokasiKerja: string | null;
  bpjsKesehatan: string | null;
  bpjsKetenagakerjaan: string | null;
  pt: string | null;
  sim: string | null;
  documents: string;
  createdAt: string;
}

export default function DaftarKaryawanPage() {
  const [employees, setEmployees] = useState<Karyawan[]>([]);
  const [retainers, setRetainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPT, setSelectedPT] = useState<string>("Semua PT");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");

  // Modals
  const formModal = useModal();
  const detailModal = useModal();

  // Selected for View / Edit
  const [selectedEmployee, setSelectedEmployee] = useState<Karyawan | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    email: "",
    phone: "",
    status: "Active",
    nik: "",
    divisi: "",
    jabatan: "",
    atasanLangsung: "",
    statusKerja: "PKWT",
    tanggalMasuk: "",
    tanggalKeluar: "",
    masaKontrak: "",
    lokasiKerja: "",
    bpjsKesehatan: "",
    bpjsKetenagakerjaan: "",
    pt: "",
  });

  const [uploadFiles, setUploadFiles] = useState<{
    file_ktp: File | null;
    file_cv: File | null;
    file_contract: File | null;
    file_bpjs_kes: File | null;
    file_bpjs_tk: File | null;
    file_sim: File | null;
  }>({
    file_ktp: null,
    file_cv: null,
    file_contract: null,
    file_bpjs_kes: null,
    file_bpjs_tk: null,
    file_sim: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resKaryawan, resRetainer] = await Promise.all([
        fetch("/api/karyawan"),
        fetch("/api/retainer"),
      ]);

      if (resKaryawan.ok) {
        const data = await resKaryawan.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
      if (resRetainer.ok) {
        const data = await resRetainer.json();
        setRetainers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching employee page data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Extract unique PTs from both employees and active retainers
  const ptList = React.useMemo(() => {
    const pts = new Set<string>();
    retainers.forEach((r) => {
      if (r.clientName) pts.add(r.clientName);
    });
    employees.forEach((emp) => {
      if (emp.pt) pts.add(emp.pt);
    });
    return Array.from(pts).sort();
  }, [retainers, employees]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setSelectedEmployee(null);
    setFormData({
      name: "",
      position: "",
      email: "",
      phone: "",
      status: "Active",
      nik: "",
      divisi: "",
      jabatan: "",
      atasanLangsung: "",
      statusKerja: "PKWT",
      tanggalMasuk: "",
      tanggalKeluar: "",
      masaKontrak: "",
      lokasiKerja: "",
      bpjsKesehatan: "",
      bpjsKetenagakerjaan: "",
      pt: ptList[0] || "",
    });
    setUploadFiles({
      file_ktp: null,
      file_cv: null,
      file_contract: null,
      file_bpjs_kes: null,
      file_bpjs_tk: null,
      file_sim: null,
    });
    formModal.openModal();
  };

  const handleOpenEdit = (emp: Karyawan) => {
    setIsEditMode(true);
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name || "",
      position: emp.position || "",
      email: emp.email || "",
      phone: emp.phone || "",
      status: emp.status || "Active",
      nik: emp.nik || "",
      divisi: emp.divisi || "",
      jabatan: emp.jabatan || "",
      atasanLangsung: emp.atasanLangsung || "",
      statusKerja: emp.statusKerja || "PKWT",
      tanggalMasuk: emp.tanggalMasuk ? emp.tanggalMasuk.split("T")[0] : "",
      tanggalKeluar: emp.tanggalKeluar ? emp.tanggalKeluar.split("T")[0] : "",
      masaKontrak: emp.masaKontrak || "",
      lokasiKerja: emp.lokasiKerja || "",
      bpjsKesehatan: emp.bpjsKesehatan || "",
      bpjsKetenagakerjaan: emp.bpjsKetenagakerjaan || "",
      pt: emp.pt || "",
    });
    setUploadFiles({
      file_ktp: null,
      file_cv: null,
      file_contract: null,
      file_bpjs_kes: null,
      file_bpjs_tk: null,
      file_sim: null,
    });
    formModal.openModal();
  };

  const handleOpenDetail = (emp: Karyawan) => {
    setSelectedEmployee(emp);
    detailModal.openModal();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data karyawan ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/karyawan?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData();
      } else {
        alert("Gagal menghapus data karyawan.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof typeof uploadFiles) => {
    const file = e.target.files?.[0] || null;
    setUploadFiles((prev) => ({ ...prev, [fieldName]: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Nama wajib diisi.");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        fd.append(key, val);
      });

      // Append files if selected
      if (uploadFiles.file_ktp) fd.append("file_ktp", uploadFiles.file_ktp);
      if (uploadFiles.file_cv) fd.append("file_cv", uploadFiles.file_cv);
      if (uploadFiles.file_contract) fd.append("file_contract", uploadFiles.file_contract);
      if (uploadFiles.file_bpjs_kes) fd.append("file_bpjs_kes", uploadFiles.file_bpjs_kes);
      if (uploadFiles.file_bpjs_tk) fd.append("file_bpjs_tk", uploadFiles.file_bpjs_tk);
      if (uploadFiles.file_sim) fd.append("file_sim", uploadFiles.file_sim);

      const url = isEditMode && selectedEmployee
        ? `/api/karyawan?id=${selectedEmployee.id}`
        : "/api/karyawan";
      
      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        body: fd,
      });

      if (res.ok) {
        formModal.closeModal();
        fetchData();
      } else {
        const err = await res.json();
        alert(`Gagal menyimpan data karyawan: ${err.error || "Error tidak diketahui"}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Parsing Helper for documents JSON
  const getParsedDocs = (docString?: string) => {
    if (!docString) return {};
    try {
      return JSON.parse(docString);
    } catch (e) {
      // Fallback parser if stored as plain comma list
      const docs: Record<string, string> = {};
      const list = docString.split(",").filter(Boolean);
      list.forEach((doc) => {
        if (doc.toUpperCase().includes("KTP")) docs["ktp"] = doc;
        else if (doc.toUpperCase().includes("CV")) docs["cv"] = doc;
        else if (doc.toUpperCase().includes("CONTRACT")) docs["contract"] = doc;
        else if (doc.toUpperCase().includes("KESEHATAN")) docs["bpjs_kes"] = doc;
        else if (doc.toUpperCase().includes("KETENAGAKERJAAN")) docs["bpjs_tk"] = doc;
        else docs["lainnya"] = doc;
      });
      return docs;
    }
  };

  // Filter and sort employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesPT = selectedPT === "Semua PT" || emp.pt === selectedPT;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(q) ||
      (emp.nik && emp.nik.toLowerCase().includes(q)) ||
      (emp.position && emp.position.toLowerCase().includes(q)) ||
      (emp.divisi && emp.divisi.toLowerCase().includes(q)) ||
      (emp.jabatan && emp.jabatan.toLowerCase().includes(q));
    return matchesPT && matchesSearch;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "date-newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return 0;
  });

  return (
    <div className="space-y-6 p-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stroke dark:border-strokedark pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Daftar Karyawan (HRM)</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pilih Perusahaan (PT) di bawah untuk menampilkan data karyawan lengkap, pendaftaran baru, dan manajemen berkas arsip.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-brand-500 text-white px-5 py-2.5 rounded-none font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-brand-600 shadow-sm transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Daftarkan Karyawan Baru
        </button>
      </div>

      {/* PT Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-stroke dark:border-strokedark pb-3">
        <button
          onClick={() => setSelectedPT("Semua PT")}
          className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-none border ${
            selectedPT === "Semua PT"
              ? "bg-brand-500 border-brand-500 text-white"
              : "border-stroke dark:border-strokedark text-gray-500 bg-white dark:bg-gray-900 hover:text-black dark:hover:text-white"
          }`}
        >
          Semua PT
        </button>
        {ptList.map((pt) => (
          <button
            key={pt}
            onClick={() => setSelectedPT(pt)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider transition-all rounded-none border ${
              selectedPT === pt
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-stroke dark:border-strokedark text-gray-500 bg-white dark:bg-gray-900 hover:text-black dark:hover:text-white"
            }`}
          >
            {pt}
          </button>
        ))}
      </div>

      {/* Filtering Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50 p-3 border border-stroke dark:border-strokedark rounded-none">
        <input
          type="text"
          placeholder="Cari nama, NIK, divisi, posisi..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-1.5 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-xs font-semibold rounded-none w-full sm:max-w-xs focus:outline-none focus:border-brand-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Urutan:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 border border-stroke dark:border-strokedark bg-white dark:bg-gray-900 text-[10px] font-bold uppercase rounded-none focus:outline-none focus:border-brand-500"
          >
            <option value="name-asc">Nama (A-Z)</option>
            <option value="name-desc">Nama (Z-A)</option>
            <option value="date-newest">Terbaru Ditambahkan</option>
          </select>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-4">
            Total: {sortedEmployees.length} Karyawan
          </span>
        </div>
      </div>

      {/* Employees Table */}
      <div className="rounded-none border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-gray-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1500px]">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-bold border-b border-stroke dark:border-strokedark uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">NIK</th>
                <th className="px-4 py-3">No HP</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Posisi</th>
                <th className="px-4 py-3">Divisi</th>
                <th className="px-4 py-3">Jabatan</th>
                <th className="px-4 py-3">Atasan</th>
                <th className="px-4 py-3">Status Kerja</th>
                <th className="px-4 py-3">Tgl Masuk</th>
                <th className="px-4 py-3">Tgl Keluar</th>
                <th className="px-4 py-3">Masa Kontrak</th>
                <th className="px-4 py-3">Lokasi</th>
                <th className="px-4 py-3">BPJS Kes</th>
                <th className="px-4 py-3">BPJS TK</th>
                <th className="px-4 py-3">Status Aktif</th>
                <th className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-gray-900 border-l border-stroke dark:border-strokedark shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke dark:divide-strokedark">
              {loading ? (
                <tr>
                  <td colSpan={18} className="text-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto"></div>
                  </td>
                </tr>
              ) : sortedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={18} className="text-center py-16 text-gray-400 italic">
                    Belum ada data karyawan terdaftar untuk PT ini.
                  </td>
                </tr>
              ) : (
                sortedEmployees.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3 text-center text-gray-400 font-bold">{index + 1}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-black dark:text-white block uppercase tracking-wide">{item.name}</span>
                      <span className="text-[9px] text-brand-500 font-black uppercase block tracking-wider">{item.pt || "-"}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{item.nik || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium">{item.phone || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">{item.email || "-"}</td>
                    <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-300 uppercase text-[10px]">{item.position}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 uppercase text-[10px]">{item.divisi || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 uppercase text-[10px]">{item.jabatan || "-"}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 uppercase text-[10px]">{item.atasanLangsung || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-none text-[9px] font-black uppercase border border-stroke dark:border-strokedark">
                        {item.statusKerja || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-500">
                      {item.tanggalMasuk ? new Date(item.tanggalMasuk).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-400">
                      {item.tanggalKeluar ? new Date(item.tanggalKeluar).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400">{item.masaKontrak || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 uppercase text-[10px]">{item.lokasiKerja || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-500">{item.bpjsKesehatan || "-"}</td>
                    <td className="px-4 py-3 font-medium text-gray-500">{item.bpjsKetenagakerjaan || "-"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider ${
                          item.status === "Active"
                            ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                            : item.status === "Resigned"
                            ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                            : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right sticky right-0 bg-white dark:bg-gray-900 border-l border-stroke dark:border-strokedark shadow-[-4px_0_10px_-3px_rgba(0,0,0,0.05)] w-48 space-x-2">
                      <button
                        onClick={() => handleOpenDetail(item)}
                        className="px-2 py-1 text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 font-black rounded-none transition-colors uppercase text-[9px] tracking-wider border border-brand-500/20"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2 py-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 font-black rounded-none transition-colors uppercase text-[9px] tracking-wider border border-blue-500/20"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 font-black rounded-none transition-colors uppercase text-[9px] tracking-wider border border-red-500/20"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (CREATE / EDIT) */}
      <Modal isOpen={formModal.isOpen} onClose={formModal.closeModal} className="max-w-4xl !rounded-none !bg-transparent !p-0">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-none w-full shadow-2xl border border-stroke dark:border-strokedark">
          <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
              {isEditMode ? "Ubah Data Karyawan" : "Daftarkan Karyawan Baru"}
            </h3>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto">
            {/* SECTION 1: PERSONAL DETAILS */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest border-b border-stroke dark:border-strokedark pb-1">1. Detail Pribadi</h4>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nama Lengkap</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-bold uppercase" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">NIK (Nomor Induk Kependudukan)</label>
                <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">No HP / WhatsApp</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Lokasi Kerja</label>
                <input placeholder="Contoh: Jakarta Office / WFH" type="text" value={formData.lokasiKerja} onChange={e => setFormData({...formData, lokasiKerja: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold uppercase" />
              </div>
            </div>

            {/* SECTION 2: WORK DETAILS */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest border-b border-stroke dark:border-strokedark pb-1">2. Detail Pekerjaan & BPJS</h4>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Alokasi Perusahaan (PT)</label>
                <select value={formData.pt} onChange={e => setFormData({...formData, pt: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer">
                  {ptList.length === 0 && <option value="">-- BELUM ADA PT DAFTAR --</option>}
                  {ptList.map((pt) => (
                    <option key={pt} value={pt}>{pt}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Posisi</label>
                  <input required placeholder="Contoh: Lawyer" type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Divisi</label>
                  <input placeholder="Contoh: Legal" type="text" value={formData.divisi} onChange={e => setFormData({...formData, divisi: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Jabatan</label>
                  <input placeholder="Contoh: Associate" type="text" value={formData.jabatan} onChange={e => setFormData({...formData, jabatan: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold uppercase" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Atasan Langsung</label>
                  <input placeholder="Contoh: Budi Santoso" type="text" value={formData.atasanLangsung} onChange={e => setFormData({...formData, atasanLangsung: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Status Kontrak</label>
                  <select value={formData.statusKerja} onChange={e => setFormData({...formData, statusKerja: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer">
                    <option value="PROBATION">PROBATION</option>
                    <option value="PKWT">PKWT</option>
                    <option value="PKWTT">PKWTT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Masa Kontrak</label>
                  <input placeholder="Contoh: 1 Tahun / Tetap" type="text" value={formData.masaKontrak} onChange={e => setFormData({...formData, masaKontrak: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tanggal Masuk</label>
                  <input type="date" value={formData.tanggalMasuk} onChange={e => setFormData({...formData, tanggalMasuk: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tanggal Keluar</label>
                  <input type="date" value={formData.tanggalKeluar} onChange={e => setFormData({...formData, tanggalKeluar: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">BPJS Kesehatan</label>
                  <input placeholder="No Kartu BPJS Kes" type="text" value={formData.bpjsKesehatan} onChange={e => setFormData({...formData, bpjsKesehatan: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">BPJS TK</label>
                  <input placeholder="No Kartu BPJS TK" type="text" value={formData.bpjsKetenagakerjaan} onChange={e => setFormData({...formData, bpjsKetenagakerjaan: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-medium" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Status Keaktifan</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full p-2.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs outline-none focus:border-brand-500 font-semibold cursor-pointer">
                  <option value="Active">ACTIVE</option>
                  <option value="Resigned">RESIGNED</option>
                  <option value="On Hold">ON HOLD</option>
                </select>
              </div>
            </div>

            {/* SECTION 3: UPLOAD DOCUMENTS */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest border-b border-stroke dark:border-strokedark pb-1">3. Upload Dokumen Karyawan</h4>
              
              <div className="p-3 border border-stroke dark:border-strokedark bg-gray-50 dark:bg-gray-800/20 text-[10px] text-gray-500 font-semibold">
                Pilih file untuk diupload langsung ke folder Google Drive PT Karyawan. Ekstensi disarankan PDF/Gambar.
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload KTP</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_ktp")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && getParsedDocs(selectedEmployee.documents).ktp && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SUDAH TERUPLOAD: {getParsedDocs(selectedEmployee.documents).ktp}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload CV / Resume</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_cv")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && getParsedDocs(selectedEmployee.documents).cv && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SUDAH TERUPLOAD: {getParsedDocs(selectedEmployee.documents).cv}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload Kontrak Kerja</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_contract")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && getParsedDocs(selectedEmployee.documents).contract && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SUDAH TERUPLOAD: {getParsedDocs(selectedEmployee.documents).contract}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload BPJS Kesehatan</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_bpjs_kes")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && getParsedDocs(selectedEmployee.documents).bpjs_kes && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SUDAH TERUPLOAD: {getParsedDocs(selectedEmployee.documents).bpjs_kes}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload BPJS Ketenagakerjaan</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_bpjs_tk")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && getParsedDocs(selectedEmployee.documents).bpjs_tk && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SUDAH TERUPLOAD: {getParsedDocs(selectedEmployee.documents).bpjs_tk}</span>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Upload SIM (Opsional)</label>
                <input type="file" onChange={(e) => handleFileChange(e, "file_sim")} className="w-full p-1.5 border border-stroke rounded-none dark:bg-gray-900 dark:border-strokedark dark:text-white text-xs cursor-pointer font-medium focus:border-brand-500 outline-none" />
                {isEditMode && selectedEmployee && selectedEmployee.sim && (
                  <span className="text-[9px] font-black text-green-600 block mt-1">✓ SIM TERUPLOAD: {selectedEmployee.sim}</span>
                )}
              </div>
            </div>
          </div>

          <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
            <button type="button" onClick={formModal.closeModal} className="px-4 py-2 border border-stroke bg-white text-gray-700 text-xs font-bold rounded-none hover:bg-gray-100 dark:bg-gray-800 dark:border-strokedark dark:text-gray-300 transition-colors" disabled={submitting}>
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-none hover:bg-brand-600 transition-colors shadow-sm flex items-center gap-1.5" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  Menyimpan...
                </>
              ) : (
                "Simpan Data Karyawan"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAIL MODAL */}
      <Modal isOpen={detailModal.isOpen} onClose={detailModal.closeModal} className="max-w-2xl !rounded-none !bg-transparent !p-0">
        {selectedEmployee && (
          <div className="bg-white dark:bg-gray-900 rounded-none w-full shadow-2xl border border-stroke dark:border-strokedark overflow-hidden">
            <div className="p-5 border-b border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
              <div>
                <span className="text-[9px] font-black text-brand-500 uppercase tracking-widest">Detail Karyawan Lengkap</span>
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider mt-0.5">{selectedEmployee.name}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-none text-[9px] font-black uppercase tracking-wider ${
                selectedEmployee.status === "Active"
                  ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
                  : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
              }`}>
                {selectedEmployee.status}
              </span>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* BLOCK 1: WORK SUMMARY */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Perusahaan / PT</span>
                  <span className="text-xs font-black text-black dark:text-white uppercase mt-1 block">🏢 {selectedEmployee.pt || "Belum Dialokasikan"}</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/40 p-4 border border-stroke dark:border-strokedark">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Posisi / Jabatan</span>
                  <span className="text-xs font-black text-black dark:text-white uppercase mt-1 block">💼 {selectedEmployee.position} {selectedEmployee.jabatan ? `- ${selectedEmployee.jabatan}` : ""}</span>
                </div>
              </div>

              {/* BLOCK 2: DETAILED TABLE INFORMATION */}
              <div className="border border-stroke dark:border-strokedark rounded-none overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <tbody className="divide-y divide-stroke dark:divide-strokedark">
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px] w-1/3">NIK</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedEmployee.nik || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">No HP / WhatsApp</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedEmployee.phone || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Email</td>
                      <td className="p-3 font-semibold text-gray-700 dark:text-gray-300">{selectedEmployee.email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Divisi</td>
                      <td className="p-3 font-bold text-black dark:text-white uppercase">{selectedEmployee.divisi || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Atasan Langsung</td>
                      <td className="p-3 font-bold text-black dark:text-white uppercase">{selectedEmployee.atasanLangsung || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Status Kontrak</td>
                      <td className="p-3 font-black text-brand-500 uppercase">{selectedEmployee.statusKerja || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Tanggal Masuk</td>
                      <td className="p-3 font-bold text-gray-700 dark:text-gray-300">{selectedEmployee.tanggalMasuk ? new Date(selectedEmployee.tanggalMasuk).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Tanggal Keluar</td>
                      <td className="p-3 font-bold text-gray-700 dark:text-gray-300">{selectedEmployee.tanggalKeluar ? new Date(selectedEmployee.tanggalKeluar).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Masa Kontrak</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedEmployee.masaKontrak || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">Lokasi Kerja</td>
                      <td className="p-3 font-bold text-black dark:text-white uppercase">{selectedEmployee.lokasiKerja || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">BPJS Kesehatan</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedEmployee.bpjsKesehatan || "-"}</td>
                    </tr>
                    <tr>
                      <td className="p-3 bg-gray-50 dark:bg-gray-800/20 font-black text-gray-400 uppercase text-[10px]">BPJS Ketenagakerjaan</td>
                      <td className="p-3 font-semibold text-black dark:text-white">{selectedEmployee.bpjsKetenagakerjaan || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* BLOCK 3: ATTACHED DOCUMENTS FROM GOOGLE DRIVE */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-brand-500 uppercase tracking-widest border-b border-stroke pb-1">Arsip Dokumen Di Google Drive</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(getParsedDocs(selectedEmployee.documents)).map(([key, filename]) => (
                    <a
                      key={key}
                      href={`/narasumber-hukum`}
                      className="px-3.5 py-2 border border-stroke dark:border-strokedark text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-none uppercase flex items-center gap-2 tracking-wider transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      {key.toUpperCase()}: {filename as string}
                    </a>
                  ))}
                  {selectedEmployee.sim && (
                    <a
                      href={`/narasumber-hukum`}
                      className="px-3.5 py-2 border border-stroke dark:border-strokedark text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-none uppercase flex items-center gap-2 tracking-wider transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      SIM: {selectedEmployee.sim}
                    </a>
                  )}
                  {Object.keys(getParsedDocs(selectedEmployee.documents)).length === 0 && !selectedEmployee.sim && (
                    <span className="text-gray-400 italic text-xs">Belum ada dokumen yang terunggah untuk karyawan ini.</span>
                  )}
                </div>
                <div className="p-3 border border-stroke dark:border-strokedark bg-blue-50 dark:bg-blue-900/10 text-[9px] text-blue-700 dark:text-blue-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <span>ℹ️</span> 
                  Untuk membuka, melihat, dan mengunduh berkas fisik, silakan gunakan menu &ldquo;BERKAS ARSIP KANTOR&rdquo; di sidebar.
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-stroke dark:border-strokedark flex justify-end bg-gray-50 dark:bg-gray-900/50">
              <button onClick={detailModal.closeModal} className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-none hover:bg-brand-600 transition-colors shadow-sm uppercase tracking-wider">
                Tutup Detail
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
