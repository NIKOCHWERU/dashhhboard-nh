"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Layers } from "lucide-react";

export default function PDFCombinePage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF Combine"
      description="Gabungkan beberapa dokumen PDF terpisah menjadi satu berkas gabungan utuh."
      icon={<Layers className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Urutan Penggabungan
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="asc">Sesuai Urutan Berkas Dipilih</option>
              <option value="name">Berdasarkan Nama File (A-Z)</option>
              <option value="date">Berdasarkan Tanggal File</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
