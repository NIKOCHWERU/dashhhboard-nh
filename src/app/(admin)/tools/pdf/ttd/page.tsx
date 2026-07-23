"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileCheck } from "lucide-react";

export default function PDFTTDPage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF TTD"
      description="Sematkan tanda tangan digital atau stempel resmi langsung pada berkas PDF."
      icon={<FileCheck className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={false}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              File Tanda Tangan / Stempel (PNG Transparan)
            </label>
            <input
              type="file"
              accept="image/png"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Posisi Penempatan
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="bottom-right">Kanan Bawah Halaman Akhir</option>
              <option value="bottom-left">Kiri Bawah Halaman Akhir</option>
              <option value="all-pages">Semua Halaman (Paraf)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
