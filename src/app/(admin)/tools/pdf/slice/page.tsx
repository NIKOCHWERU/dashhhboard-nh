"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  Scissors,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function PDFSlicePage() {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [sliceMode, setSliceMode] = useState<"each" | "range">("each");
  const [rangeInput, setRangeInput] = useState<string>("1-2, 4");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    try {
      setIsProcessing(true);
      const bytes = await f.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      setTotalPages(pdf.getPageCount());
      showToast("success", `Dokumen PDF memuat ${pdf.getPageCount()} halaman.`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const parseRanges = (input: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(",");
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map(Number);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(maxPages, end); p++) {
            pages.add(p);
          }
        }
      } else {
        const p = Number(trimmed);
        if (!isNaN(p) && p >= 1 && p <= maxPages) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSlice = async () => {
    if (!file || totalPages === 0) return;

    try {
      setIsProcessing(true);
      const bytes = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(bytes);

      if (sliceMode === "each") {
        const zip = new JSZip();
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [page] = await newPdf.copyPages(originalPdf, [i]);
          newPdf.addPage(page);
          const pdfBytes = await newPdf.save();
          zip.file(`halaman_${i + 1}.pdf`, pdfBytes);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `pdf_split_${Date.now()}.zip`;
        link.click();
        showToast("success", "Pemisahan PDF per halaman selesai (ZIP)!");
      } else {
        const selectedPages = parseRanges(rangeInput, totalPages);
        if (selectedPages.length === 0) {
          showToast("error", "Rentang halaman tidak valid.");
          return;
        }

        const newPdf = await PDFDocument.create();
        const indices = selectedPages.map((p) => p - 1);
        const copiedPages = await newPdf.copyPages(originalPdf, indices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `pdf_range_${Date.now()}.pdf`;
        link.click();
        showToast("success", "Potongan PDF berhasil diekspor!");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal memotong dokumen PDF.");
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
          <span className="text-brand-500 font-bold">PDF Slice</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Scissors className="w-5 h-5 text-brand-500" />
              PDF Slice & Splitter
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Pisahkan PDF per halaman tunggal (ZIP) atau ambil rentang halaman kustom menjadi PDF baru.
            </p>
          </div>

          <button
            onClick={handleSlice}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Proses Pemotongan
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          {!file ? (
            <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  Upload Dokumen PDF
                </h3>
                <p className="text-xs text-gray-400">Pilih berkas PDF dari komputer Anda.</p>
              </div>
              <label className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all">
                <Upload className="w-4 h-4" />
                Pilih Berkas PDF
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <span className="font-extrabold text-black dark:text-white">{file.name}</span>
                <span className="font-black text-brand-500">{totalPages} Halaman</span>
              </div>
              <p className="text-gray-500">
                Dokumen telah siap dipotong. Silakan tentukan mode pemotongan di panel sebelah kanan.
              </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Pengaturan Pemotongan
            </h3>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Mode Pemotongan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSliceMode("each")}
                  className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                    sliceMode === "each"
                      ? "border-brand-500 text-brand-500 bg-brand-500/10 font-black"
                      : "border-gray-200 dark:border-gray-800 text-gray-500"
                  }`}
                >
                  Per Halaman (ZIP)
                </button>
                <button
                  onClick={() => setSliceMode("range")}
                  className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                    sliceMode === "range"
                      ? "border-brand-500 text-brand-500 bg-brand-500/10 font-black"
                      : "border-gray-200 dark:border-gray-800 text-gray-500"
                  }`}
                >
                  Rentang Kustom
                </button>
              </div>
            </div>

            {sliceMode === "range" && (
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Masukkan Rentang Halaman
                </label>
                <input
                  type="text"
                  value={rangeInput}
                  onChange={(e) => setRangeInput(e.target.value)}
                  placeholder="Contoh: 1-3, 5, 8-10"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
