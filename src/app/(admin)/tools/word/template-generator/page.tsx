"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  FileCode,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Table,
  FileText,
  X,
  Play,
  Search,
  User,
  Plus,
  Trash2,
  Edit,
  FolderOpen,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as XLSX from "xlsx";
import JSZip from "jszip";

interface WordTemplateItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  fileUrl: string;
  fileName: string;
  placeholders: string; // JSON string
  uploaderName: string;
  createdAt: string;
}

export default function DocumentTemplateGeneratorPage() {
  // Main Tabs: "generator" (Tab 1: Form & Pick) | "library" (Tab 2: List & Upload User)
  const [activeTab, setActiveTab] = useState<"generator" | "library">("generator");

  // Public Templates Library & Filter
  const [templatesList, setTemplatesList] = useState<WordTemplateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isLoadingList, setIsLoadingList] = useState(false);

  // Tab 1 Pick Template Modal
  const [isPickModalOpen, setIsPickModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");

  // Tab 2 Upload Modal State (Nama, Keterangan, File Max 100MB)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Surat Resmi");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBuffer, setUploadBuffer] = useState<ArrayBuffer | null>(null);
  const [scannedTags, setScannedTags] = useState<string[]>([]);

  // Active Loaded Template for Generation
  const [activeTemplate, setActiveTemplate] = useState<WordTemplateItem | null>(null);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);

  const [inputMode, setInputMode] = useState<"form" | "excel">("form");

  // Form & Excel States
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<Record<string, any>[]>([]);

  // Admin Edit Modal
  const [editingTemplate, setEditingTemplate] = useState<WordTemplateItem | null>(null);

  // Processing & Toast
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Templates
  const fetchTemplates = async () => {
    try {
      setIsLoadingList(true);
      const res = await fetch(
        `/api/word-templates?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
          selectedCategory
        )}`
      );
      if (res.ok) {
        const data = await res.json();
        setTemplatesList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [searchQuery, selectedCategory]);

  // Helper: Scan placeholders
  const scanPlaceholders = (buffer: ArrayBuffer): string[] => {
    try {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, {
        delimiters: { start: "{{", end: "}}" },
        paragraphLoop: true,
        linebreaks: true,
      });

      const text = doc.getFullText();
      const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
      const cleaned = Array.from(
        new Set(matches.map((m) => m.replace(/[\{\}]/g, "").trim()))
      );
      return cleaned;
    } catch (err: any) {
      console.error(err);
      return [];
    }
  };

  // Load selected template into Tab 1
  const handleSelectTemplate = async (item: WordTemplateItem) => {
    try {
      setIsProcessing(true);
      setActiveTemplate(item);

      const base64Str = item.fileUrl.split(",")[1];
      const binaryStr = atob(base64Str);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const buffer = bytes.buffer;

      setTemplateBuffer(buffer);
      const cleaned = scanPlaceholders(buffer);
      setPlaceholders(cleaned);

      const initialForm: Record<string, string> = {};
      cleaned.forEach((p) => {
        initialForm[p] = "";
      });
      setFormData(initialForm);

      setIsPickModalOpen(false);
      setActiveTab("generator");
      showToast("success", `Templat "${item.title}" dipilih dan siap diisi!`);
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal memuat berkas templat.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Upload File inside Upload Modal (Max 100MB check)
  const handleFileChangeForUploadModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Check Max 100MB
    const MAX_SIZE_MB = 100;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      showToast("error", `Ukuran file melebihi batas maksimal ${MAX_SIZE_MB}MB!`);
      return;
    }

    setUploadFile(f);
    if (!uploadTitle) setUploadTitle(f.name.replace(".docx", ""));

    const buffer = await f.arrayBuffer();
    setUploadBuffer(buffer);
    const tags = scanPlaceholders(buffer);
    setScannedTags(tags);
  };

  // Submit User Upload Modal to DB
  const handleSaveUploadModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadBuffer || !uploadTitle) {
      showToast("error", "Silakan isi nama templat dan pilih berkas DOCX.");
      return;
    }

    try {
      setIsProcessing(true);

      const bytes = new Uint8Array(uploadBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);
      const dataUrl = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${base64Data}`;

      const res = await fetch("/api/word-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: uploadTitle,
          description: uploadDescription,
          category: uploadCategory,
          fileUrl: dataUrl,
          fileName: uploadFile.name,
          placeholders: scannedTags,
        }),
      });

      if (res.ok) {
        showToast("success", "Templat baru berhasil diunggah dan disimpan ke Pustaka!");
        setIsUploadModalOpen(false);
        setUploadTitle("");
        setUploadDescription("");
        setUploadFile(null);
        setUploadBuffer(null);
        fetchTemplates();
      } else {
        showToast("error", "Gagal menyimpan templat ke server.");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Terjadi kesalahan server.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Admin Delete Template
  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus templat ini?")) return;

    try {
      const res = await fetch(`/api/word-templates?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Templat berhasil dihapus.");
        if (activeTemplate?.id === id) {
          setActiveTemplate(null);
          setTemplateBuffer(null);
          setPlaceholders([]);
        }
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal menghapus templat.");
    }
  };

  // Admin Update Template
  const handleUpdateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const res = await fetch("/api/word-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate.id,
          title: editingTemplate.title,
          description: editingTemplate.description,
          category: editingTemplate.category,
        }),
      });

      if (res.ok) {
        showToast("success", "Detail templat berhasil diperbarui!");
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Gagal memperbarui templat.");
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setExcelFile(f);

    try {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

      setExcelRows(rows);
      showToast("success", `Berhasil mengimpor ${rows.length} baris data dari Excel!`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas Excel.");
    }
  };

  const handleFormInputChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Generate Word Documents
  const handleGenerate = async () => {
    if (!templateBuffer) {
      showToast("error", "Silakan pilih templat DOCX dari daftar terlebih dahulu.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      if (inputMode === "form") {
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          delimiters: { start: "{{", end: "}}" },
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(formData);

        const out = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(out);
        link.download = `${activeTemplate?.title || "dokumen_generated"}_${Date.now()}.docx`;
        link.click();

        showToast("success", "Dokumen Word berhasil dibuat!");
      } else {
        if (excelRows.length === 0) {
          showToast("error", "Silakan unggah berkas Excel (.xlsx / .csv) yang berisi baris data.");
          return;
        }

        const zipOutput = new JSZip();

        for (let i = 0; i < excelRows.length; i++) {
          const rowData = excelRows[i];

          const normalizedData: Record<string, any> = {};
          Object.keys(rowData).forEach((key) => {
            normalizedData[key.trim()] = rowData[key];
          });

          const dataForDoc: Record<string, any> = {};
          placeholders.forEach((p) => {
            dataForDoc[p] = normalizedData[p] !== undefined ? normalizedData[p] : "";
          });

          const zip = new PizZip(templateBuffer);
          const doc = new Docxtemplater(zip, {
            delimiters: { start: "{{", end: "}}" },
            paragraphLoop: true,
            linebreaks: true,
          });

          doc.render(dataForDoc);

          const outBlob = doc.getZip().generate({
            type: "uint8array",
          });

          const fileName = dataForDoc["Nama"] || dataForDoc["NAMA"] || dataForDoc["NoSurat"] || `dokumen_${i + 1}`;
          zipOutput.file(`${fileName}_${i + 1}.docx`, outBlob);

          setProgress(Math.round(((i + 1) / excelRows.length) * 100));
        }

        const zipBlob = await zipOutput.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `mass_documents_${excelRows.length}_files_${Date.now()}.zip`;
        link.click();

        showToast("success", `Berhasil membuat ${excelRows.length} dokumen Word dalam ZIP!`);
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal memproses pembuatan dokumen Word.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered Templates for Tab 1 Pick Modal
  const modalFilteredTemplates = templatesList.filter(
    (item) =>
      item.title.toLowerCase().includes(modalSearch.toLowerCase()) ||
      item.uploaderName.toLowerCase().includes(modalSearch.toLowerCase()) ||
      item.fileName.toLowerCase().includes(modalSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-900 text-emerald-100 border border-emerald-700"
              : "bg-red-900 text-red-100 border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* MODAL 1: Tab 1 Pick Template from Public List */}
      {isPickModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-brand-500" />
                Pilih Templat dari Daftar Publik
              </h3>
              <button onClick={() => setIsPickModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search input in modal */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Cari templat atau nama pengunggah..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none text-black dark:text-white"
              />
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {modalFilteredTemplates.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8 italic">Tidak ada templat yang cocok.</p>
              ) : (
                modalFilteredTemplates.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTemplate(item)}
                    className="p-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 hover:border-brand-500 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-brand-500/10 text-brand-500 font-extrabold text-[9px] rounded-full uppercase">
                          {item.category}
                        </span>
                        <h4 className="text-xs font-black text-black dark:text-white group-hover:text-brand-500 transition-colors truncate">
                          {item.title}
                        </h4>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate">
                        Pengunggah: <strong className="text-black dark:text-white">{item.uploaderName}</strong> • {new Date(item.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>

                    <button className="px-3 py-1.5 bg-brand-500 text-white rounded-xl text-xs font-bold shrink-0">
                      Pilih
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: User Upload New Template Modal (Max 100MB) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black uppercase text-black dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-500" />
                Upload Templat Master DOCX (Max 100MB)
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUploadModalSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  1. Nama / Judul Templat *
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Contoh: Surat Perjanjian Kerja Sama Terbaru"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  2. Kategori Dokumen
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                >
                  <option value="Surat Resmi">Surat Resmi</option>
                  <option value="Kontrak & Perjanjian">Kontrak & Perjanjian</option>
                  <option value="Laporan Berkala">Laporan Berkala</option>
                  <option value="Sertifikat">Sertifikat</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  3. Keterangan Catatan (misal: Revisi / Terbaru)
                </label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Contoh: Versi Terbaru 2026 / Revisi Legal"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  4. Berkas Master DOCX (Max 100MB) *
                </label>
                <div className="p-5 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 rounded-2xl text-center space-y-2">
                  <Upload className="w-6 h-6 text-brand-500 mx-auto" />
                  {uploadFile ? (
                    <p className="text-xs font-bold text-brand-500 truncate">{uploadFile.name} ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)</p>
                  ) : (
                    <p className="text-[11px] text-gray-400">Pilih berkas Word (.docx) dari komputer</p>
                  )}
                  <label className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold inline-block cursor-pointer shadow-sm">
                    Pilih File DOCX
                    <input type="file" accept=".docx" className="hidden" onChange={handleFileChangeForUploadModal} />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || isProcessing}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-md shadow-brand-500/20"
                >
                  {isProcessing ? "Menyimpan..." : "Unggah & Simpan Templat"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Admin Edit Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-black uppercase text-black dark:text-white">Edit Detail Templat (Admin)</h3>
              <button onClick={() => setEditingTemplate(null)} className="p-1 text-gray-400 hover:text-black">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateTemplateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama / Judul Templat</label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none text-black dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kategori</label>
                <select
                  value={editingTemplate.category}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none text-black dark:text-white"
                >
                  <option value="Surat Resmi">Surat Resmi</option>
                  <option value="Kontrak & Perjanjian">Kontrak & Perjanjian</option>
                  <option value="Laporan Berkala">Laporan Berkala</option>
                  <option value="Sertifikat">Sertifikat</option>
                  <option value="Umum">Umum</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Keterangan Catatan</label>
                <textarea
                  value={editingTemplate.description || ""}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl font-semibold outline-none text-black dark:text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-bold">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <Link href="/" className="hover:text-brand-500 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Alat</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Word</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">Document Template Generator</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-5 h-5 text-brand-500" />
              Document Template Generator
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Pilih templat dari pustaka publik, isi variabel data, dan cetak ratusan dokumen Word otomatis.
            </p>
          </div>

          {activeTab === "generator" && (
            <button
              onClick={handleGenerate}
              disabled={!templateBuffer || isProcessing}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Generate Dokumen Word
            </button>
          )}
        </div>
      </div>

      {/* 2 MAIN TABS NAVIGATION */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab("generator")}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "generator"
              ? "border-brand-500 text-brand-500 bg-brand-500/10 rounded-t-2xl"
              : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <Edit className="w-4 h-4" />
          Tab 1: Isian Form & Generator Templat
        </button>

        <button
          onClick={() => setActiveTab("library")}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === "library"
              ? "border-brand-500 text-brand-500 bg-brand-500/10 rounded-t-2xl"
              : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Tab 2: Daftar Templat & Upload User ({templatesList.length})
        </button>
      </div>

      {/* TAB 1: FORM ISIAN & GENERATOR (NO FILE UPLOAD HERE, PICK TEMPLATE FROM LIST MODAL) */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            {!activeTemplate ? (
              <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                  <FolderOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                    Pilih Templat dari Daftar
                  </h3>
                  <p className="text-xs text-gray-400">
                    Silakan pilih templat master yang ingin Anda isi dan buat dari daftar templat publik.
                  </p>
                </div>
                <button
                  onClick={() => setIsPickModalOpen(true)}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all"
                >
                  <Search className="w-4 h-4" />
                  Pilih Templat
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-6">
                {/* Active Selected Template Banner */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center font-bold">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-black dark:text-white">{activeTemplate.title}</h3>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-500 font-bold">
                          {activeTemplate.category}
                        </span>
                        <span>• Pengunggah: <strong className="text-black dark:text-white">{activeTemplate.uploaderName}</strong></span>
                        <span>• {placeholders.length} Variable</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsPickModalOpen(true)}
                    className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-600 dark:text-gray-300 rounded-xl text-xs font-bold transition-all"
                  >
                    Ganti Templat
                  </button>
                </div>

                {/* Sub-Mode Selector */}
                <div className="flex border-b border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => setInputMode("form")}
                    className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      inputMode === "form"
                        ? "border-brand-500 text-brand-500"
                        : "border-transparent text-gray-400"
                    }`}
                  >
                    Form Isian Manual Interaktif
                  </button>
                  <button
                    onClick={() => setInputMode("excel")}
                    className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                      inputMode === "excel"
                        ? "border-brand-500 text-brand-500"
                        : "border-transparent text-gray-400"
                    }`}
                  >
                    Import Massal Excel / CSV
                  </button>
                </div>

                {/* Sub-Mode 1: Form Input Manual (UPPERCASE Labels) */}
                {inputMode === "form" && (
                  <div className="space-y-4 pt-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">
                      Form Isian Variabel (Judul Huruf Besar)
                    </h4>
                    {placeholders.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Tidak ada placeholder yang perlu diisi.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {placeholders.map((p) => (
                          <div key={p}>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              {p.toUpperCase()}
                            </label>
                            <input
                              type="text"
                              value={formData[p] || ""}
                              onChange={(e) => handleFormInputChange(p, e.target.value)}
                              placeholder={`Masukkan ${p.toUpperCase()}...`}
                              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white outline-none focus:border-brand-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-Mode 2: Import Massal Excel */}
                {inputMode === "excel" && (
                  <div className="space-y-4 pt-1">
                    <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/30 rounded-2xl text-center space-y-3">
                      <Table className="w-8 h-8 text-brand-500 mx-auto" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-black dark:text-white">
                          Upload Berkas Excel (.XLSX / .CSV)
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          Header kolom di Excel akan dicocokkan otomatis dengan placeholder:{" "}
                          {placeholders.map((p) => `[${p}]`).join(" ")}
                        </p>
                      </div>
                      <label className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold inline-block cursor-pointer shadow-sm">
                        Pilih Excel / CSV
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={handleExcelUpload}
                        />
                      </label>
                    </div>

                    {excelFile && (
                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                            {excelFile.name}
                          </span>
                        </div>
                        <span className="font-black text-brand-500">
                          {excelRows.length} Baris Data Terbaca
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
              <div className="bg-white dark:bg-gray-900 border border-brand-500/30 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in">
                <div className="flex justify-between text-xs font-black text-black dark:text-white uppercase tracking-wider">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                    Meng-generate Dokumen Word...
                  </span>
                  <span className="text-brand-500">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Summary Sidebar for Tab 1 */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-3 shadow-sm text-xs">
              <h3 className="font-black uppercase tracking-wider text-black dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-500" />
                Placeholder Terdeteksi ({placeholders.length})
              </h3>
              {placeholders.length === 0 ? (
                <p className="text-gray-400 italic">Belum ada templat yang dipilih.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {placeholders.map((p) => (
                    <div
                      key={p}
                      className="p-2 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-[11px] text-brand-500 font-bold flex items-center justify-between"
                    >
                      <span>{"{{" + p + "}}"}</span>
                      <span className="text-[9px] uppercase text-gray-400">{p.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR TEMPLAT & USER UPLOAD (USER UPLOAD WITH MODAL MAX 100MB) */}
      {activeTab === "library" && (
        <div className="space-y-6">
          {/* Top Header & Search & Upload Button */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari templat / nama pengunggah / keterangan..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-semibold outline-none text-black dark:text-white"
              >
                <option value="Semua">Semua Kategori</option>
                <option value="Surat Resmi">Surat Resmi</option>
                <option value="Kontrak & Perjanjian">Kontrak & Perjanjian</option>
                <option value="Laporan Berkala">Laporan Berkala</option>
                <option value="Sertifikat">Sertifikat</option>
                <option value="Umum">Umum</option>
              </select>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                + Upload Templat Baru
              </button>
            </div>
          </div>

          {/* Cards Grid List */}
          {isLoadingList ? (
            <div className="p-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Memuat daftar templat publik...
            </div>
          ) : templatesList.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-3xl bg-white dark:bg-white/[0.02]">
              Belum ada templat yang diunggah ke pustaka publik.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {templatesList.map((item) => {
                const parsedPlaceholders: string[] = (() => {
                  try {
                    return JSON.parse(item.placeholders);
                  } catch {
                    return [];
                  }
                })();

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectTemplate(item)}
                    className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 hover:border-brand-500 rounded-3xl p-5 space-y-4 cursor-pointer transition-all duration-200 hover:shadow-xl group relative flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Badge Category & Admin CRUD Actions */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-brand-500/10 text-brand-500 font-extrabold text-[10px] rounded-full uppercase tracking-wider">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate(item);
                            }}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 rounded-lg"
                            title="Edit Detail Templat (Admin Only)"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteTemplate(item.id, e)}
                            className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg"
                            title="Hapus Templat (Admin Only)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-black dark:text-white group-hover:text-brand-500 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                        {item.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 italic">
                            Keterangan: {item.description}
                          </p>
                        )}
                      </div>

                      {/* Scanned Tag Chips */}
                      {parsedPlaceholders.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {parsedPlaceholders.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 font-mono text-[9px] text-gray-600 dark:text-gray-300 font-bold rounded"
                            >
                              {"{{" + tag + "}}"}
                            </span>
                          ))}
                          {parsedPlaceholders.length > 4 && (
                            <span className="text-[9px] font-bold text-gray-400 px-1">
                              +{parsedPlaceholders.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer Info (Uploader Name, Auto Date & Select) */}
                    <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-black dark:text-white font-extrabold">
                          <User className="w-3 h-3 text-brand-500" />
                          {item.uploaderName}
                        </div>
                        <div className="flex items-center gap-1 text-[9px]">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>

                      <span className="text-brand-500 font-bold group-hover:underline text-xs">
                        Pilih Templat →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
