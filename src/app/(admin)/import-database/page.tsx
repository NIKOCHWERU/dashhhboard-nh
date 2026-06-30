"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, Database, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type ImportTarget = "karyawan" | "calon_klien" | "klien" | "retainer" | "perorangan" | "";

export default function ImportDatabasePage() {
  const [target, setTarget] = useState<ImportTarget>("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ success: number; failed: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        droppedFile.type === "application/vnd.ms-excel" ||
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls")
      ) {
        setFile(droppedFile);
        setResults(null);
      } else {
        alert("Mohon unggah file dengan format Excel (.xlsx atau .xls).");
      }
    }
  };

  const handleProcessImport = async () => {
    if (!target) return alert("Pilih tabel tujuan terlebih dahulu.");
    if (!file) return alert("Pilih file Excel terlebih dahulu.");

    setLoading(true);
    setResults(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (rows.length === 0) {
          alert("File Excel kosong atau tidak terbaca.");
          setLoading(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;

        const getVal = (row: any, keyNames: string[]) => {
          for (const name of keyNames) {
            const foundKey = Object.keys(row).find((k) => k.trim().toUpperCase() === name.toUpperCase());
            if (foundKey) return row[foundKey];
          }
          return "";
        };

        const parseIndoDate = (dateStr: any) => {
          if (!dateStr) return null;
          if (typeof dateStr === "number") {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const parsedDate = new Date(excelEpoch.getTime() + dateStr * 24 * 60 * 60 * 1000);
            if (!isNaN(parsedDate.getTime())) return parsedDate.toISOString().split("T")[0];
          }
          const str = String(dateStr).trim();
          if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
          const fallback = new Date(str);
          if (!isNaN(fallback.getTime())) return fallback.toISOString().split("T")[0];
          return null;
        };

        for (const row of rows) {
          let payload: any = {};
          let endpoint = "";

          switch (target) {
            case "calon_klien":
              endpoint = "/api/calon-klien";
              payload = {
                tanggal: parseIndoDate(getVal(row, ["TANGGAL", "TGL"])),
                namaProspek: String(getVal(row, ["NAMA PROSPEK", "NAMA"]) || "").trim(),
                potensiPekerjaan: String(getVal(row, ["POTENSI PEKERJAAN/PERKARA", "POTENSI PEKERJAAN", "PERKARA"]) || "").trim(),
                domisili: String(getVal(row, ["DOMISILI"]) || "").trim(),
                email: String(getVal(row, ["EMAIL"]) || "").trim(),
                mediaSosial: String(getVal(row, ["MEDIA SOSIAL", "MEDSOS"]) || "").trim(),
                telephone: String(getVal(row, ["TELEPHONE", "TELEPON", "TELP", "HP"]) || "").trim(),
                kategoriManit: String(getVal(row, ["KATEGORI MANIT (HOT A-E)", "KATEGORI MANIT", "MANIT"]) || "").trim(),
                kegiatanDilakukan: String(getVal(row, ["KEGIATAN YANG SUDAH DILAKUKAN", "KEGIATAN"]) || "").trim(),
                tantangan: String(getVal(row, ["TANTANGAN/HAMBATAN", "TANTANGAN", "HAMBATAN"]) || "").trim(),
                informasiPenting: String(getVal(row, ["INFORMASI PENTING"]) || "").trim(),
                keterangan: String(getVal(row, ["KETERANGAN"]) || "").trim(),
                catatan: String(getVal(row, ["CATATAN"]) || "").trim(),
              };
              if (!payload.namaProspek) continue; // Skip invalid row
              break;

            case "klien":
              endpoint = "/api/klien";
              payload = {
                namaKlien: String(getVal(row, ["NAMA KLIEN", "NAMA"]) || "").trim(),
                sumber: String(getVal(row, ["SUMBER"]) || "").trim(),
                nomorInvoice: String(getVal(row, ["NOMOR INVOICE", "NO INVOICE", "INVOICE"]) || "").trim(),
                jenisPekerjaan: String(getVal(row, ["JENIS PEKERJAAN/PERKARA", "JENIS PEKERJAAN", "PERKARA"]) || "").trim(),
                telephone: String(getVal(row, ["TELEPHONE", "TELEPON", "TELP", "HP"]) || "").trim(),
                statusPembayaran: String(getVal(row, ["STATUS PEMBAYARAN", "STATUS BAYAR"]) || "").trim(),
                posisiProgres: String(getVal(row, ["POSISI/TINDAKAN/PROGRES", "POSISI", "TINDAKAN", "PROGRES"]) || "").trim(),
                statusPekerjaan: String(getVal(row, ["STATUS PEKERJAAN", "STATUS KERJA"]) || "").trim(),
                informasiLain: String(getVal(row, ["INFORMASI LAIN", "INFO LAIN"]) || "").trim(),
                pencairan: String(getVal(row, ["PENCAIRAN"]) || "").trim(),
                keterangan: String(getVal(row, ["KETERANGAN"]) || "").trim(),
                catatan: String(getVal(row, ["CATATAN"]) || "").trim(),
              };
              if (!payload.namaKlien) continue;
              break;

            case "retainer":
              endpoint = "/api/retainer";
              payload = {
                clientName: String(getVal(row, ["NAMA KLIEN", "NAMA PT", "KLIEN", "NAMA"]) || "").trim(),
                projectName: String(getVal(row, ["NAMA PEKERJAAN", "NAMA KONTRAK", "KONTRAK", "PEKERJAAN"]) || "").trim(),
                categories: String(getVal(row, ["KATEGORI", "KATEGORI PEKERJAAN"]) || "").trim(),
                startDate: parseIndoDate(getVal(row, ["TANGGAL MULAI", "MULAI KONTRAK", "START DATE", "TANGGAL"])),
                endDate: parseIndoDate(getVal(row, ["TANGGAL SELESAI", "SELESAI KONTRAK", "END DATE"])),
                status: String(getVal(row, ["STATUS", "STATUS KONTRAK"]) || "Active").trim(),
                contractValue: getVal(row, ["NILAI KONTRAK", "NILAI", "HARGA"]),
                picEmail: String(getVal(row, ["PIC", "PIC EMAIL", "PERSON IN CHARGE"]) || "").trim(),
              };
              if (!payload.clientName) continue;
              break;

            case "perorangan":
              endpoint = "/api/perorangan";
              payload = {
                clientName: String(getVal(row, ["NAMA KLIEN", "NAMA PERORANGAN", "KLIEN", "NAMA"]) || "").trim(),
                projectName: String(getVal(row, ["NAMA PEKERJAAN", "NAMA PERKARA", "KONTRAK", "PEKERJAAN"]) || "").trim(),
                categories: String(getVal(row, ["KATEGORI", "KATEGORI PEKERJAAN"]) || "").trim(),
                startDate: parseIndoDate(getVal(row, ["TANGGAL MULAI", "MULAI KONTRAK", "START DATE", "TANGGAL"])),
                endDate: parseIndoDate(getVal(row, ["TANGGAL SELESAI", "SELESAI KONTRAK", "END DATE"])),
                status: String(getVal(row, ["STATUS", "STATUS KONTRAK"]) || "Active").trim(),
                contractValue: getVal(row, ["NILAI KONTRAK", "NILAI", "HARGA"]),
                picEmail: String(getVal(row, ["PIC", "PIC EMAIL", "PERSON IN CHARGE"]) || "").trim(),
              };
              if (!payload.clientName) continue;
              break;

            case "karyawan":
              endpoint = "/api/karyawan";
              payload = {
                name: String(getVal(row, ["NAMA KARYAWAN", "NAMA STAF", "NAMA"]) || "").trim(),
                position: String(getVal(row, ["JABATAN", "POSISI"]) || "").trim(),
                email: String(getVal(row, ["EMAIL", "ALAMAT EMAIL"]) || "").trim(),
                phone: String(getVal(row, ["NO HP", "NO TELEPON", "TELEPHONE", "PHONE"]) || "").trim(),
                status: String(getVal(row, ["STATUS", "AKTIF"]) || "Active").trim(),
              };
              if (!payload.name) continue;
              break;
          }

          if (endpoint) {
            try {
              const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (res.ok) {
                successCount++;
              } else {
                failCount++;
              }
            } catch {
              failCount++;
            }
          }
        }

        setResults({ success: successCount, failed: failCount });
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file. Pastikan format Excel Anda valid dan dapat dibaca.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const getFormatHelpText = () => {
    switch (target) {
      case "calon_klien": return "Kolom minimal: NAMA PROSPEK, TANGGAL, POTENSI PEKERJAAN, TELEPHONE";
      case "klien": return "Kolom minimal: NAMA KLIEN, SUMBER, JENIS PEKERJAAN, TELEPHONE";
      case "retainer": return "Kolom minimal: NAMA PT, NAMA PEKERJAAN, TANGGAL MULAI, PIC EMAIL";
      case "perorangan": return "Kolom minimal: NAMA PERORANGAN, NAMA PEKERJAAN, TANGGAL MULAI, PIC EMAIL";
      case "karyawan": return "Kolom minimal: NAMA KARYAWAN, JABATAN, EMAIL, NO HP";
      default: return "Pilih tabel tujuan terlebih dahulu untuk melihat format yang dibutuhkan.";
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Database className="w-6 h-6 text-brand-500" />
          Import Database Sentral
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Unggah data dalam jumlah banyak secara langsung dari file Excel (.xlsx / .csv) ke sistem secara otomatis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Col: Setup & Actions */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wide text-gray-800 dark:text-white mb-4">Pengaturan Import</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  1. Pilih Tabel Tujuan
                </label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as ImportTarget)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-black text-gray-800 dark:text-white rounded-xl text-xs font-bold uppercase transition-colors outline-none focus:border-brand-500"
                >
                  <option value="">-- PILIH TABEL / MODUL --</option>
                  <option value="calon_klien">Potensi Klien (Calon Klien)</option>
                  <option value="klien">Progress Pekerjaan (Klien Reguler)</option>
                  <option value="retainer">Pekerjaan Retainer (PT)</option>
                  <option value="perorangan">Pekerjaan Perorangan (Individu)</option>
                  <option value="karyawan">Direktori Karyawan & Staff</option>
                </select>
              </div>

              {target && (
                <div className="bg-brand-500/10 border border-brand-500/20 p-3 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-brand-700 dark:text-brand-300 font-semibold leading-relaxed">
                    {getFormatHelpText()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleProcessImport}
            disabled={!file || !target || loading}
            className="w-full bg-brand-500 text-white py-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-600 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sedang Memproses...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Mulai Import Data
              </>
            )}
          </button>
        </div>

        {/* Right Col: Dropzone & Results */}
        <div className="md:col-span-7 space-y-6">
          <div 
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[300px] ${
              file 
                ? "border-brand-500 bg-brand-500/5" 
                : "border-gray-300 dark:border-gray-700 hover:border-brand-500 hover:bg-brand-500/5 cursor-pointer bg-gray-50 dark:bg-white/[0.01]"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls"
              className="hidden"
            />
            
            {file ? (
              <>
                <div className="w-20 h-20 bg-brand-500 text-white rounded-2xl flex items-center justify-center shadow-xl mb-4">
                  <FileSpreadsheet className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-black dark:text-white mb-1">{file.name}</h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-black uppercase tracking-wider bg-brand-500/10 px-3 py-1 rounded-full">
                  File Siap Diimport
                </p>
                <p className="text-[10px] text-gray-400 mt-4">Klik untuk mengganti file lain</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10" />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">Unggah Dokumen Excel</h3>
                <p className="text-xs text-gray-500">Tarik dan letakkan file .xlsx di sini atau klik untuk mencari.</p>
              </>
            )}
          </div>

          {/* Import Results Banner */}
          {results && (
            <div className={`p-6 rounded-2xl border flex items-start gap-4 ${
              results.success > 0 ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-500/30" : "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-500/30"
            }`}>
              <div className={`p-3 rounded-full ${
                results.success > 0 ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              }`}>
                {results.success > 0 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-bold uppercase tracking-wide mb-1 ${
                  results.success > 0 ? "text-green-800 dark:text-green-400" : "text-amber-800 dark:text-amber-400"
                }`}>
                  Proses Import Selesai
                </h3>
                <div className="flex gap-6 mt-3">
                  <div>
                    <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Berhasil Masuk</span>
                    <span className="text-xl font-black text-green-600 dark:text-green-400">{results.success} Baris</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest">Gagal / Dilewati</span>
                    <span className="text-xl font-black text-rose-500">{results.failed} Baris</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
