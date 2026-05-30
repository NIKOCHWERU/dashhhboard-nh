"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileSpreadsheet, FileIcon, BarChart3, Loader2, Check } from "lucide-react";

export default function ReportsPage() {
  // Simulator states
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStep, setDownloadStep] = useState("");
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadType, setDownloadType] = useState<"Excel" | "PDF" | "">("");
  const [reportName, setReportName] = useState("");

  const triggerDownload = (name: string, type: "Excel" | "PDF") => {
    setReportName(name);
    setDownloadType(type);
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStep("Membaca dan memproses database...");

    const steps = [
      { progress: 20, text: "Menyaring data sesuai kriteria modul..." },
      { progress: 50, text: "Menyusun struktur baris kolom..." },
      { progress: 80, text: `Mengonversi berkas menjadi format ${type === "Excel" ? ".xlsx" : ".pdf"}...` },
      { progress: 100, text: "Selesai! Mengunduh berkas ke sistem lokal..." }
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        const step = steps[currentStepIdx];
        setDownloadProgress(step.progress);
        setDownloadStep(step.text);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsDownloading(false);
          setDownloadType("");
          setReportName("");
        }, 1500);
      }
    }, 600);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan</h1>
        <p className="text-gray-500">Ekspor data dan hasilkan wawasan untuk operasional hukum perusahaan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition">
          <CardHeader>
            <div className="p-3 bg-brand-50 w-fit rounded-lg text-brand-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Laporan Status Kontrak</CardTitle>
            <CardDescription>Ekspor semua kontrak aktif, kedaluwarsa, dan yang sedang ditunda.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Laporan Status Kontrak", "Excel")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Laporan Status Kontrak", "PDF")}>
              <FileIcon className="w-4 h-4 mr-2" /> PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader>
            <div className="p-3 bg-blue-50 w-fit rounded-lg text-blue-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Laporan Hukum Karyawan</CardTitle>
            <CardDescription>Ringkasan berkas PKWT, NDA, dan surat teguran karyawan.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Laporan Hukum Karyawan", "Excel")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Laporan Hukum Karyawan", "PDF")}>
              <FileIcon className="w-4 h-4 mr-2" /> PDF
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition">
          <CardHeader>
            <div className="p-3 bg-emerald-50 w-fit rounded-lg text-emerald-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Audit Kepatuhan</CardTitle>
            <CardDescription>Daftar periksa dan laporan kepatuhan serta skor kesehatan hukum perusahaan.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Audit Kepatuhan", "Excel")}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => triggerDownload("Audit Kepatuhan", "PDF")}>
              <FileIcon className="w-4 h-4 mr-2" /> PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* DOWNLOAD PROGRESS OVERLAY MODAL */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 p-6 rounded-xl max-w-sm w-full space-y-4 text-center animate-in zoom-in duration-200 shadow-2xl">
            <div className="mx-auto p-3 bg-brand-50 text-brand-600 rounded-full w-fit">
              {downloadProgress === 100 ? (
                <Check className="w-8 h-8 text-emerald-600 animate-bounce" />
              ) : (
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              )}
            </div>
            
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-sm text-gray-950 dark:text-white">Ekspor Laporan Aktif</h3>
              <p className="text-gray-500 font-semibold">{reportName} ({downloadType})</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${downloadProgress === 100 ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 font-black">
                <span>{downloadStep}</span>
                <span>{downloadProgress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
