"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Eye,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import { PdfPageCanvas } from "@/components/tools/PdfPageCanvas";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export default function PDFTTDPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Signature Position & Properties
  const [targetPageMode, setTargetPageMode] = useState<"last" | "all" | "first">("last");
  const [sigWidth, setSigWidth] = useState<number>(150);
  const [sigHeight, setSigHeight] = useState<number>(75);
  const [posX, setPosX] = useState<number>(100);
  const [posY, setPosY] = useState<number>(100);

  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfFile(f);

    try {
      const buffer = await f.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDoc(pdf);
      setTotalPages(pdf.numPages);
      showToast("success", `Dokumen PDF berhasil dimuat (${pdf.numPages} Halaman).`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas PDF.");
    }
  };

  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setSignatureFile(f);

    const reader = new FileReader();
    reader.onload = (evt) => {
      setSignatureDataUrl(evt.target?.result as string);
    };
    reader.readAsDataURL(f);
    showToast("success", "Gambar tanda tangan (PNG) berhasil dimuat.");
  };

  const handleApplyTTD = async () => {
    if (!pdfFile || !signatureFile) {
      showToast("error", "Silakan unggah dokumen PDF dan gambar TTD PNG.");
      return;
    }

    try {
      setIsProcessing(true);
      const pdfBytes = await pdfFile.arrayBuffer();
      const sigBytes = await signatureFile.arrayBuffer();

      const loadedPdf = await PDFDocument.load(pdfBytes);
      const sigImage = await loadedPdf.embedPng(sigBytes);

      const totalCount = loadedPdf.getPageCount();
      let targetIndices: number[] = [];

      if (targetPageMode === "last") targetIndices = [totalCount - 1];
      else if (targetPageMode === "first") targetIndices = [0];
      else targetIndices = Array.from({ length: totalCount }, (_, i) => i);

      for (const idx of targetIndices) {
        const page = loadedPdf.getPage(idx);
        page.drawImage(sigImage, {
          x: posX,
          y: posY,
          width: sigWidth,
          height: sigHeight,
        });
      }

      const finalPdfBytes = await loadedPdf.save();
      const blob = new Blob([new Uint8Array(finalPdfBytes)], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `pdf_ttd_${Date.now()}.pdf`;
      link.click();

      showToast("success", "Tanda tangan berhasil disematkan HD ke PDF!");
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal menyematkan tanda tangan ke PDF.");
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
          <span className="text-brand-500 font-bold">PDF TTD</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-brand-500" />
              PDF TTD & Digital Stempel (Live Preview)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Sematkan tanda tangan digital / stempel PNG transparan dengan pratinjau langsung di atas halaman PDF.
            </p>
          </div>

          <button
            onClick={handleApplyTTD}
            disabled={!pdfFile || !signatureFile || isProcessing}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Sematkan & Export PDF
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Upload PDF */}
            <div className="p-5 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase text-black dark:text-white">1. Dokumen PDF</h3>
              {pdfFile ? (
                <p className="text-xs font-extrabold text-brand-500 truncate">{pdfFile.name}</p>
              ) : (
                <label className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold inline-block cursor-pointer">
                  Pilih PDF
                  <input type="file" accept=".pdf" className="hidden" onChange={handlePdfChange} />
                </label>
              )}
            </div>

            {/* Upload Signature PNG */}
            <div className="p-5 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black uppercase text-black dark:text-white">2. Gambar TTD (PNG)</h3>
              {signatureFile ? (
                <p className="text-xs font-extrabold text-brand-500 truncate">{signatureFile.name}</p>
              ) : (
                <label className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold inline-block cursor-pointer">
                  Pilih PNG TTD
                  <input type="file" accept="image/png" className="hidden" onChange={handleSignatureChange} />
                </label>
              )}
            </div>
          </div>

          {/* Interactive Live PDF Canvas Preview */}
          {pdfDoc && (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-3xl space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <h3 className="text-xs font-black uppercase text-black dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand-500" />
                  Pratinjau Langsung (Live Preview Target Halaman)
                </h3>
                <span className="text-[10px] font-bold text-gray-400">
                  Target: {targetPageMode === "last" ? "Halaman Terakhir" : targetPageMode === "first" ? "Halaman Pertama" : "Semua Halaman"}
                </span>
              </div>

              <div className="relative border border-gray-200 dark:border-gray-800/80 rounded-2xl overflow-hidden bg-gray-100 dark:bg-black/50 flex items-center justify-center p-4 min-h-[400px]">
                <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white">
                  <PdfPageCanvas
                    pdfDoc={pdfDoc}
                    pageNum={targetPageMode === "first" ? 1 : totalPages}
                    scale={0.8}
                  />

                  {/* Overlaid Signature Image Live */}
                  {signatureDataUrl && (
                    <div
                      className="absolute border-2 border-dashed border-brand-500 bg-brand-500/10 rounded pointer-events-none transition-all flex items-center justify-center"
                      style={{
                        left: `${posX * 0.7}px`,
                        bottom: `${posY * 0.7}px`,
                        width: `${sigWidth * 0.7}px`,
                        height: `${sigHeight * 0.7}px`,
                      }}
                    >
                      <img
                        src={signatureDataUrl}
                        alt="Signature Overlay"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Posisi & Ukuran TTD
            </h3>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Target Halaman
              </label>
              <select
                value={targetPageMode}
                onChange={(e) => setTargetPageMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
              >
                <option value="last">Halaman Terakhir (Standar Dokumen)</option>
                <option value="first">Halaman Pertama</option>
                <option value="all">Semua Halaman (Paraf)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500">Posisi X (px)</span>
                <input
                  type="number"
                  value={posX}
                  onChange={(e) => setPosX(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500">Posisi Y (px)</span>
                <input
                  type="number"
                  value={posY}
                  onChange={(e) => setPosY(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] font-bold text-gray-500">Lebar TTD (px)</span>
                <input
                  type="number"
                  value={sigWidth}
                  onChange={(e) => setSigWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500">Tinggi TTD (px)</span>
                <input
                  type="number"
                  value={sigHeight}
                  onChange={(e) => setSigHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
