"use client";

import React, { useState, useRef } from "react";
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
  RotateCcw,
} from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as XLSX from "xlsx";
import JSZip from "jszip";

export default function DocumentTemplateGeneratorPage() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateBuffer, setTemplateBuffer] = useState<ArrayBuffer | null>(null);
  const [placeholders, setPlaceholders] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<"form" | "excel">("form");

  // Form Mode State
  const [formData, setFormData] = useState<Record<string, string>>({});

  // Excel Mode State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<Record<string, any>[]>([]);

  // Execution & Progress State
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Scan placeholders from DOCX Template Buffer
  const scanPlaceholders = (buffer: ArrayBuffer) => {
    try {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, {
        delimiters: { start: "{{", end: "}}" },
        paragraphLoop: true,
        linebreaks: true,
      });

      // Extract raw text and match {{placeholder}} regex
      const text = doc.getFullText();
      const matches = text.match(/\{\{([^}]+)\}\}/g) || [];
      const cleaned = Array.from(
        new Set(matches.map((m) => m.replace(/[\{\}]/g, "").trim()))
      );

      setPlaceholders(cleaned);

      // Pre-fill form state
      const initialForm: Record<string, string> = {};
      cleaned.forEach((p) => {
        initialForm[p] = "";
      });
      setFormData(initialForm);

      if (cleaned.length > 0) {
        showToast("success", `Berhasil menemukan ${cleaned.length} placeholder.`);
      } else {
        showToast("error", "Tidak ditemukan placeholder {{...}} pada templat.");
      }
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas templat DOCX.");
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setTemplateFile(f);

    const buffer = await f.arrayBuffer();
    setTemplateBuffer(buffer);
    scanPlaceholders(buffer);
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

  // Generate Word Document (Form or Mass Excel)
  const handleGenerate = async () => {
    if (!templateBuffer) {
      showToast("error", "Silakan unggah templat DOCX terlebih dahulu.");
      return;
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      if (inputMode === "form") {
        // Single Document Generation
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
        link.download = `dokumen_generated_${Date.now()}.docx`;
        link.click();

        showToast("success", "Dokumen Word berhasil dibuat!");
      } else {
        // Mass Generation from Excel Rows -> Export as ZIP
        if (excelRows.length === 0) {
          showToast("error", "Silakan unggah berkas Excel (.xlsx / .csv) yang berisi baris data.");
          return;
        }

        const zipOutput = new JSZip();

        for (let i = 0; i < excelRows.length; i++) {
          const rowData = excelRows[i];

          // Normalize row keys to match placeholders case-insensitively
          const normalizedData: Record<string, any> = {};
          Object.keys(rowData).forEach((key) => {
            normalizedData[key.trim()] = rowData[key];
          });

          // Match placeholders
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
          <span>Word</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">Document Template Generator</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <FileCode className="w-5 h-5 text-brand-500" />
              Document Template Generator (Mail Merge)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Upload templat DOCX bertanda {"{{Placeholder}}"}, scan variabel otomatis, dan buat ratusan dokumen Word instan.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!templateBuffer || isProcessing}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Generate Dokumen Word
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Work Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Step 1: Upload Template */}
          {!templateFile ? (
            <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  1. Upload Templat DOCX (Master Template)
                </h3>
                <p className="text-xs text-gray-400">
                  Gunakan format tag {"{{Nama}}"}, {"{{Alamat}}"}, {"{{NoSurat}}"} di dalam file Word Anda.
                </p>
              </div>
              <label className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all">
                <Upload className="w-4 h-4" />
                Pilih Templat DOCX
                <input type="file" accept=".docx" className="hidden" onChange={handleTemplateUpload} />
              </label>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-500" />
                  <div>
                    <p className="text-xs font-black text-black dark:text-white">{templateFile.name}</p>
                    <p className="text-[10px] text-gray-400">
                      Terdeteksi {placeholders.length} placeholder variabel
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTemplateFile(null);
                    setTemplateBuffer(null);
                    setPlaceholders([]);
                  }}
                  className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold hover:bg-red-500/20"
                >
                  Ganti Templat
                </button>
              </div>

              {/* Mode Selection */}
              <div className="flex border-b border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => setInputMode("form")}
                  className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${
                    inputMode === "form"
                      ? "border-brand-500 text-brand-500"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  Form Isian Manual
                </button>
                <button
                  onClick={() => setInputMode("excel")}
                  className={`px-4 py-2 text-xs font-extrabold border-b-2 transition-all ${
                    inputMode === "excel"
                      ? "border-brand-500 text-brand-500"
                      : "border-transparent text-gray-400"
                  }`}
                >
                  Import Massal Excel (.xlsx / .csv)
                </button>
              </div>

              {/* Mode A: Form Input Manual (Auto Scanned Placeholders) */}
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
                            placeholder={`Masukkan ${p}...`}
                            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white outline-none focus:border-brand-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Import Massal Excel */}
              {inputMode === "excel" && (
                <div className="space-y-4 pt-1">
                  <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-black/30 rounded-2xl text-center space-y-3">
                    <Table className="w-8 h-8 text-brand-500 mx-auto" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase text-black dark:text-white">
                        Upload Berkas Excel (.XLSX / .CSV)
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        Pastikan nama header kolom di Excel sama dengan placeholder:{" "}
                        {placeholders.map((p) => `[${p}]`).join(" ")}
                      </p>
                    </div>
                    <label className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-bold inline-block cursor-pointer">
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

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-4 shadow-sm text-xs">
            <h3 className="font-black uppercase tracking-wider text-black dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-brand-500" />
              Placeholder Terdeteksi ({placeholders.length})
            </h3>

            {placeholders.length === 0 ? (
              <p className="text-gray-400 italic">Belum ada placeholder terdeteksi. Silakan upload templat DOCX.</p>
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
    </div>
  );
}
