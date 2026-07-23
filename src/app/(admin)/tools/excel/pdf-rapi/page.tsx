"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  Table,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Eye,
  FileSpreadsheet,
  Save,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PresetConfig {
  orientation: "p" | "l";
  format: "a4" | "letter" | "legal";
  fitToWidth: boolean;
  repeatHeader: boolean;
  gridLines: boolean;
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  watermarkText: string;
}

export default function ExcelPdfRapiPage() {
  const [file, setFile] = useState<File | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheetData, setSheetData] = useState<any[][]>([]);

  // Layout & Styling Settings
  const [orientation, setOrientation] = useState<"p" | "l">("l");
  const [paperFormat, setPaperFormat] = useState<"a4" | "letter" | "legal">("a4");
  const [fitToWidth, setFitToWidth] = useState(true);
  const [repeatHeader, setRepeatHeader] = useState(true);
  const [gridLines, setGridLines] = useState(true);
  const [headerText, setHeaderText] = useState("Laporan Resmi Narasumber Hukum");
  const [footerText, setFooterText] = useState("Dokumen Rahasia & Terenkripsi");
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [watermarkText, setWatermarkText] = useState("DRAFT / CONFIDENTIAL");
  const [themeColor, setThemeColor] = useState("#3B82F6");

  // Presets
  const [savedPresets, setSavedPresets] = useState<Record<string, PresetConfig>>({});

  // Execution & Progress State
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("excel_pdf_presets");
      if (stored) setSavedPresets(JSON.parse(stored));
    } catch {}
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    try {
      setIsProcessing(true);
      const arrayBuffer = await f.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });

      setWorkbook(wb);
      setSheetNames(wb.SheetNames);
      const firstSheet = wb.SheetNames[0];
      setSelectedSheet(firstSheet);

      const parsedData: any[][] = XLSX.utils.sheet_to_json(wb.Sheets[firstSheet], {
        header: 1,
      });
      setSheetData(parsedData);
      showToast("success", `Spreadsheet ${f.name} berhasil dimuat.`);
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal membaca berkas Excel.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!workbook) return;
    setSelectedSheet(sheetName);
    const parsedData: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
    });
    setSheetData(parsedData);
  };

  const handleSavePreset = () => {
    const presetName = prompt("Masukkan Nama Preset Pengaturan:");
    if (!presetName) return;

    const config: PresetConfig = {
      orientation,
      format: paperFormat,
      fitToWidth,
      repeatHeader,
      gridLines,
      headerText,
      footerText,
      showPageNumbers,
      watermarkText,
    };

    const nextPresets = { ...savedPresets, [presetName]: config };
    setSavedPresets(nextPresets);
    try {
      localStorage.setItem("excel_pdf_presets", JSON.stringify(nextPresets));
      showToast("success", `Preset "${presetName}" berhasil disimpan!`);
    } catch {}
  };

  const handleLoadPreset = (name: string) => {
    const p = savedPresets[name];
    if (!p) return;

    setOrientation(p.orientation);
    setPaperFormat(p.format);
    setFitToWidth(p.fitToWidth);
    setRepeatHeader(p.repeatHeader);
    setGridLines(p.gridLines);
    setHeaderText(p.headerText);
    setFooterText(p.footerText);
    setShowPageNumbers(p.showPageNumbers);
    setWatermarkText(p.watermarkText);
    showToast("success", `Preset "${name}" diterapkan.`);
  };

  const handleExportPDF = () => {
    if (!sheetData || sheetData.length === 0) {
      showToast("error", "Tidak ada data tabel Excel yang tersedia.");
      return;
    }

    try {
      setIsProcessing(true);

      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format: paperFormat,
      });

      const head = [sheetData[0] || []];
      const body = sheetData.slice(1);

      autoTable(doc, {
        head,
        body,
        startY: 25,
        theme: gridLines ? "grid" : "striped",
        headStyles: {
          fillColor: themeColor,
          textColor: "#FFFFFF",
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: "#1F2937",
        },
        alternateRowStyles: {
          fillColor: "#F9FAFB",
        },
        margin: { top: 25, bottom: 20, left: 10, right: 10 },
        didDrawPage: (data) => {
          const pageSize = doc.internal.pageSize;
          const pageWidth = pageSize.width || pageSize.getWidth();
          const pageHeight = pageSize.height || pageSize.getHeight();

          // Header Text
          if (headerText) {
            doc.setFontSize(9);
            doc.setTextColor("#6B7280");
            doc.text(headerText, 10, 15);
            doc.setDrawColor("#E5E7EB");
            doc.line(10, 18, pageWidth - 10, 18);
          }

          // Watermark Text (Diagonal Translucent)
          if (watermarkText) {
            doc.saveGraphicsState();
            doc.setFontSize(36);
            doc.setTextColor("#E5E7EB");
            doc.text(watermarkText, pageWidth / 2, pageHeight / 2, {
              align: "center",
              angle: 35,
            });
            doc.restoreGraphicsState();
          }

          // Footer Text & Page Numbers
          doc.setFontSize(8);
          doc.setTextColor("#9CA3AF");
          if (footerText) {
            doc.text(footerText, 10, pageHeight - 10);
          }
          if (showPageNumbers) {
            const pageStr = `Halaman ${data.pageNumber} dari ${doc.internal.pages.length - 1}`;
            doc.text(pageStr, pageWidth - 10, pageHeight - 10, { align: "right" });
          }
        },
      });

      doc.save(`excel_pdf_rapi_${selectedSheet}_${Date.now()}.pdf`);
      showToast("success", "Cetak PDF Rapi berhasil diunduh!");
    } catch (err: any) {
      console.error(err);
      showToast("error", "Gagal memproses cetak PDF.");
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
          <span>Excel</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">Excel PDF Rapi</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Table className="w-5 h-5 text-brand-500" />
              Excel PDF Rapi Converter (Auto Fit & Clean Print)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Cetak spreadsheet Excel (.xlsx / .xls / .csv) ke PDF dengan tata letak rapi, presisi, watermark, dan nomor halaman.
            </p>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={!workbook || isProcessing}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PDF Rapi
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Work Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {!file ? (
            <div className="p-12 border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.02] rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                <Upload className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  Upload Spreadsheet Excel
                </h3>
                <p className="text-xs text-gray-400">Pilih berkas XLSX, XLS, atau CSV dari komputer Anda.</p>
              </div>
              <label className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all">
                <Upload className="w-4 h-4" />
                Pilih Berkas Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          ) : (
            <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-3xl p-5 space-y-4">
              {/* Sheet Navigation Tabs */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 overflow-x-auto">
                  {sheetNames.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSheetChange(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedSheet === s
                          ? "bg-brand-500 text-white shadow-sm"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] font-black text-brand-500 uppercase">
                  {sheetData.length} Baris Data
                </span>
              </div>

              {/* Realtime Table Preview */}
              <div className="max-h-[460px] overflow-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr style={{ backgroundColor: themeColor, color: "#FFFFFF" }}>
                      {(sheetData[0] || []).map((col: any, idx: number) => (
                        <th key={idx} className="p-2.5 font-extrabold border border-white/20 whitespace-nowrap">
                          {String(col)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheetData.slice(1, 100).map((row: any[], rIdx: number) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? "bg-white dark:bg-black/30" : "bg-gray-50 dark:bg-black/10"}
                      >
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} className="p-2 border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {cell !== undefined ? String(cell) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-4 shadow-sm text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-500" />
                Pengaturan Layout PDF
              </h3>
              <button
                onClick={handleSavePreset}
                className="px-2.5 py-1 bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 text-[10px] font-bold rounded-lg flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Simpan Preset
              </button>
            </div>

            {/* Presets List */}
            {Object.keys(savedPresets).length > 0 && (
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Preset Tersimpan
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.keys(savedPresets).map((pName) => (
                    <button
                      key={pName}
                      onClick={() => handleLoadPreset(pName)}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-brand-500 hover:text-white text-[10px] font-bold rounded-lg transition-all"
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Orientation & Format */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Orientasi
                </label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none text-black dark:text-white"
                >
                  <option value="l">Landscape (Melebar)</option>
                  <option value="p">Portrait (Tegak)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Ukuran Kertas
                </label>
                <select
                  value={paperFormat}
                  onChange={(e) => setPaperFormat(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none text-black dark:text-white"
                >
                  <option value="a4">A4</option>
                  <option value="letter">US Letter</option>
                  <option value="legal">Legal</option>
                </select>
              </div>
            </div>

            {/* Header & Watermark */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Teks Header Atas
              </label>
              <input
                type="text"
                value={headerText}
                onChange={(e) => setHeaderText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none text-black dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Teks Watermark Latar
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none text-black dark:text-white"
              />
            </div>

            {/* Color Swatch */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Warna Tema Header Tabel
              </label>
              <div className="flex items-center gap-2">
                {["#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#1F2937"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setThemeColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      themeColor === c ? "scale-110 border-brand-500" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
