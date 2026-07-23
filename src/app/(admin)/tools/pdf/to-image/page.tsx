"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  FileImage,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import JSZip from "jszip";
import { PdfPageCanvas } from "@/components/tools/PdfPageCanvas";

// Set worker src to cdnjs for browser execution
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function PDFToImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");

  // Grid Zoom Level (Linux File Manager Style: 1 to 5)
  // Level 1 = 6 cols (kecil), Level 5 = 1 col (besar & sangat jelas)
  const [gridZoomLevel, setGridZoomLevel] = useState<number>(2);

  // Quality Multiplier Options (1x, 2x HD, 4x Ultra HD, 8x Extreme)
  const [qualityMultiplier, setQualityMultiplier] = useState<number>(2);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
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
      const arrayBuffer = await f.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
      setSelectedPages(Array.from({ length: pdf.numPages }, (_, i) => i + 1));
      showToast("success", `PDF berhasil dimuat (${pdf.numPages} halaman).`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectPage = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(Array.from({ length: numPages }, (_, i) => i + 1));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const handleExportZip = async () => {
    if (!pdfDoc || selectedPages.length === 0) {
      showToast("error", "Pilih setidaknya 1 halaman PDF untuk diekspor.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);
      const zip = new JSZip();

      // Quality Multiplier Scale (1x = 1.33, 2x = 2.66, 4x = 5.33, 8x = 10.66)
      const scale = qualityMultiplier * 1.333;

      for (let i = 0; i < selectedPages.length; i++) {
        const pageNum = selectedPages[i];
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
          const dataUrl = canvas.toDataURL(`image/${format}`, 0.95);
          const base64Data = dataUrl.split(",")[1];
          zip.file(`halaman_${pageNum}_${qualityMultiplier}x.${format}`, base64Data, { base64: true });
        }

        setProgress(Math.round(((i + 1) / selectedPages.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = `pdf_images_${qualityMultiplier}x_${Date.now()}.zip`;
      link.click();

      showToast("success", `ZIP berisi gambar PDF (${qualityMultiplier}x Kualitas) berhasil diekspor!`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Terjadi kesalahan saat memproses ekspor.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Map gridZoomLevel to Tailwind grid columns
  const getGridColsClass = () => {
    switch (gridZoomLevel) {
      case 1:
        return "grid-cols-2 sm:grid-cols-4 md:grid-cols-6"; // Kecil
      case 2:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"; // Standar
      case 3:
        return "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"; // Sedang
      case 4:
        return "grid-cols-1 sm:grid-cols-2"; // Besar
      case 5:
        return "grid-cols-1"; // Sangat Besar (Linux Manager Zoom Max)
      default:
        return "grid-cols-2 sm:grid-cols-3 md:grid-cols-4";
    }
  };

  // Map gridZoomLevel to canvas scale for thumbnail clarity
  const getCanvasScale = () => {
    switch (gridZoomLevel) {
      case 1:
        return 0.2;
      case 2:
        return 0.35;
      case 3:
        return 0.55;
      case 4:
        return 0.8;
      case 5:
        return 1.1;
      default:
        return 0.35;
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
          <span className="text-brand-500 font-bold">PDF To Image</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileImage className="w-5 h-5 text-brand-500" />
              PDF To Image Converter
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Konversi seluruh atau sebagian halaman PDF menjadi gambar resolusi tinggi (PNG/JPG/WEBP) dalam berkas ZIP.
            </p>
          </div>

          <button
            onClick={handleExportZip}
            disabled={!pdfDoc || isProcessing || selectedPages.length === 0}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export ZIP ({selectedPages.length} Halaman)
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!pdfDoc ? (
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
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-black dark:text-white uppercase">
                    Pilih Halaman ({selectedPages.length}/{numPages})
                  </span>
                </div>

                {/* Linux Style Grid Zoom Controls & Page Selector */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-800 rounded-xl p-1 bg-gray-50 dark:bg-gray-900">
                    <button
                      onClick={() => setGridZoomLevel((l) => Math.max(1, l - 1))}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer"
                      title="Perkecil Grid (Lebih Banyak Item)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] font-extrabold px-1.5 text-gray-500">
                      Grid Level {gridZoomLevel}
                    </span>
                    <button
                      onClick={() => setGridZoomLevel((l) => Math.min(5, l + 1))}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer"
                      title="Perbesar Grid (Detail Jelas)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={selectAllPages}
                    className="px-2.5 py-1 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={deselectAllPages}
                    className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              {/* Linux Manager Responsive Zoom Grid (Preserving Natural Aspect Ratio) */}
              <div className={`grid ${getGridColsClass()} gap-4 max-h-[560px] overflow-y-auto p-1.5 transition-all`}>
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
                  const isSelected = selectedPages.includes(pageNum);
                  return (
                    <div
                      key={pageNum}
                      onClick={() => toggleSelectPage(pageNum)}
                      className={`p-3 border-2 rounded-2xl cursor-pointer text-center space-y-2 transition-all relative flex flex-col items-center justify-between ${
                        isSelected
                          ? "border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/10"
                          : "border-gray-200 dark:border-gray-800 opacity-70 hover:opacity-100"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3" />
                        </div>
                      )}

                      {/* Natural Aspect Ratio Canvas Wrapper */}
                      <div className="w-full flex items-center justify-center overflow-hidden bg-white dark:bg-black/40 rounded-xl p-1.5 border border-gray-100 dark:border-gray-800/80 shadow-inner min-h-[140px]">
                        <PdfPageCanvas pdfDoc={pdfDoc} pageNum={pageNum} scale={getCanvasScale()} />
                      </div>

                      <p className="text-[11px] font-extrabold text-black dark:text-white pt-1">
                        Halaman {pageNum}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Indicator */}
          {isProcessing && (
            <div className="bg-white dark:bg-gray-900 border border-brand-500/30 p-4 rounded-2xl shadow-xl space-y-2 animate-in fade-in">
              <div className="flex justify-between text-xs font-black text-black dark:text-white uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
                  Mengonversi Halaman PDF ke Gambar...
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

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Pengaturan Konversi Gambar
            </h3>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Format Gambar Output
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "png", label: "PNG" },
                  { id: "jpeg", label: "JPG" },
                  { id: "webp", label: "WEBP" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id as any)}
                    className={`py-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                      format === f.id
                        ? "border-brand-500 text-brand-500 bg-brand-500/10"
                        : "border-gray-200 dark:border-gray-800 text-gray-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Multiplier Options (1x, 2x, 4x, 8x HD Pixel Scale) */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Skala Kualitas Piksel (Pixel Multiplier)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 1, label: "1x (Ukuran Standard)" },
                  { id: 2, label: "2x (HD Clear)" },
                  { id: 4, label: "4x (Ultra HD)" },
                  { id: 8, label: "8x (Extreme Detail)" },
                ].map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setQualityMultiplier(q.id)}
                    className={`py-2 px-2 text-[11px] font-black rounded-xl border transition-all cursor-pointer ${
                      qualityMultiplier === q.id
                        ? "border-brand-500 text-brand-500 bg-brand-500/10"
                        : "border-gray-200 dark:border-gray-800 text-gray-500"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
