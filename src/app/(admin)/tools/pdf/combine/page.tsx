"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  Layers,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface PDFFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function PDFCombinePage() {
  const [pdfFiles, setPdfFiles] = useState<PDFFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: PDFFileItem[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).substr(2, 9),
      file: f,
      name: f.name,
      size: f.size,
    }));

    setPdfFiles((prev) => [...prev, ...newItems]);
    showToast("success", `${newItems.length} berkas PDF ditambahkan.`);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= pdfFiles.length) return;

    const updated = [...pdfFiles];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPdfFiles(updated);
  };

  const handleRemove = (id: string) => {
    setPdfFiles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCombine = async () => {
    if (pdfFiles.length < 2) {
      showToast("error", "Minimal pilih 2 berkas PDF untuk digabungkan.");
      return;
    }

    try {
      setIsProcessing(true);
      const mergedPdf = await PDFDocument.create();

      for (const item of pdfFiles) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pdf_combined_${Date.now()}.pdf`;
      link.click();

      showToast("success", "Penggabungan PDF selesai!");
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal menggabungkan dokumen PDF.");
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
          <span>Alat</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>PDF</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">PDF Combine</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-500" />
              PDF Combine & Merger
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Gabungkan banyak berkas PDF menjadi satu dokumen tunggal utuh langsung di browser Anda.
            </p>
          </div>

          <button
            onClick={handleCombine}
            disabled={pdfFiles.length < 2 || isProcessing}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Gabungkan ({pdfFiles.length} File)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white">
                Urutan Penggabungan Berkas PDF
              </h3>
              <label className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm">
                + Tambah PDF
                <input type="file" accept=".pdf" multiple className="hidden" onChange={handleFileChange} />
              </label>
            </div>

            {pdfFiles.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs font-semibold">
                Belum ada PDF yang diunggah. Silakan klik tombol di atas untuk memilih beberapa file PDF.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pdfFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-brand-500/10 text-brand-500 font-black text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-black dark:text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">
                          {(item.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMove(idx, "up")}
                        disabled={idx === 0}
                        className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(idx, "down")}
                        disabled={idx === pdfFiles.length - 1}
                        className="p-1.5 text-gray-400 hover:text-black dark:hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-3 text-xs">
            <h3 className="font-black uppercase tracking-wider text-black dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              Instruksi Penggabungan
            </h3>
            <p className="text-gray-500 leading-relaxed">
              1. Unggah dua atau lebih dokumen PDF.
              <br />
              2. Gunakan tombol panah untuk mengatur urutan penggabungan.
              <br />
              3. Klik tombol **Gabungkan** di atas untuk mengunduh dokumen tunggal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
