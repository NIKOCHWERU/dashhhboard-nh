"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  RotateCcw,
  Play,
  Clock,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Trash2,
  Download,
  Eye,
  Loader2,
  Sliders,
} from "lucide-react";

export interface ToolPageLayoutProps {
  category: "Image" | "PDF" | "Word" | "Excel";
  toolName: string;
  description: string;
  icon?: React.ReactNode;
  acceptedFileTypes?: string;
  allowMultipleFiles?: boolean;
  settingPanel?: React.ReactNode;
  onProcess?: (files: File[]) => Promise<void>;
  supportedFormatsText?: string;
}

export function ToolPageLayout({
  category,
  toolName,
  description,
  icon,
  acceptedFileTypes = "*",
  allowMultipleFiles = true,
  settingPanel,
  onProcess,
  supportedFormatsText = "Format didukung tergantung jenis alat",
}: ToolPageLayoutProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [history, setHistory] = useState<{ id: string; name: string; date: string; status: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "preview" | "history">("upload");
  const [dragActive, setDragActive] = useState(false);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleFileChange = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    const added = Array.from(incomingFiles);
    setFiles((prev) => (allowMultipleFiles ? [...prev, ...added] : [added[0]]));
    setActiveTab("preview");
    showToast("success", `${added.length} berkas dipilih`);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFiles([]);
    setProgress(0);
    setIsProcessing(false);
  };

  const handleStartProcess = async () => {
    if (files.length === 0) {
      showToast("error", "Silakan pilih atau unggah berkas terlebih dahulu.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(15);

      // Simulate step progress
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      if (onProcess) {
        await onProcess(files);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      clearInterval(interval);
      setProgress(100);
      showToast("success", "Proses berhasil diselesaikan!");

      // Add to history
      setHistory((prev) => [
        {
          id: String(Date.now()),
          name: files[0].name + (files.length > 1 ? ` (+${files.length - 1} file)` : ""),
          date: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          status: "Selesai",
        },
        ...prev,
      ]);
    } catch (err: any) {
      showToast("error", err?.message || "Terjadi kesalahan saat memproses.");
    } finally {
      setIsProcessing(false);
    }
  };

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

      {/* Header & Breadcrumb */}
      <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <Link href="/" className="hover:text-brand-500 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 dark:text-gray-400">Alat</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 dark:text-gray-400">{category}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">{toolName}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              {icon}
              {toolName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={handleStartProcess}
              disabled={isProcessing || files.length === 0}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Proses Alat
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Work Area & Settings Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Work Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            {[
              { id: "upload", label: `Unggah Berkas (${files.length})` },
              { id: "preview", label: "Pratinjau / Berkas Dipilih" },
              { id: "history", label: `Riwayat (${history.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Upload Drag & Drop Area */}
          {activeTab === "upload" && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-8 sm:p-12 border-2 border-dashed rounded-3xl text-center space-y-4 transition-all ${
                dragActive
                  ? "border-brand-500 bg-brand-500/10 scale-[1.01]"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] hover:border-brand-500/50"
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  Tarik & Lepaskan Berkas Di Sini
                </h3>
                <p className="text-xs text-gray-400">Atau klik tombol di bawah untuk memilih file dari komputer Anda.</p>
              </div>

              <div className="pt-2">
                <label className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all">
                  <Upload className="w-4 h-4" />
                  Pilih Berkas
                  <input
                    type="file"
                    accept={acceptedFileTypes}
                    multiple={allowMultipleFiles}
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </label>
              </div>

              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{supportedFormatsText}</p>
            </div>
          )}

          {/* TAB 2: File Preview & List */}
          {activeTab === "preview" && (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                  Daftar Berkas Terpilih ({files.length})
                </h3>
                <label className="text-xs font-bold text-brand-500 hover:underline cursor-pointer">
                  + Tambah Berkas
                  <input
                    type="file"
                    accept={acceptedFileTypes}
                    multiple={allowMultipleFiles}
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files)}
                  />
                </label>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">
                  Belum ada berkas terpilih. Silakan unggah berkas terlebih dahulu.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-black dark:text-white truncate" title={file.name}>
                            {file.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-semibold">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: History */}
          {activeTab === "history" && (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-500" />
                Riwayat Pemrosesan Terbaru
              </h3>

              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs font-semibold">Belum ada riwayat pemrosesan.</div>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs"
                    >
                      <div className="font-bold text-black dark:text-white truncate max-w-md">{h.name}</div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400">{h.date}</span>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 font-extrabold text-[10px] rounded-full uppercase">
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar (Visible during processing) */}
          {isProcessing && (
            <div className="bg-white dark:bg-gray-900 border border-brand-500/30 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in">
              <div className="flex justify-between text-xs font-black text-black dark:text-white uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  Memproses Berkas...
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

        {/* Settings Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Pengaturan & Panel Aksi
            </h3>

            {settingPanel || (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Kualitas Hasil Output
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
                    <option value="high">Tinggi (Standar Kualitas Maksimal)</option>
                    <option value="medium">Sedang (Ukuran Berkas Lebih Kecil)</option>
                    <option value="low">Rendah (Kompresi Ekstrem)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                    Format Output
                  </label>
                  <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
                    <option value="auto">Otomatis (Rekomendasi Terbaik)</option>
                    <option value="pdf">PDF Dokumen</option>
                    <option value="png">Gambar PNG Transparan</option>
                    <option value="jpg">Gambar JPG</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={handleStartProcess}
              disabled={isProcessing || files.length === 0}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 transition-all cursor-pointer mt-4"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Jalankan Proses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
