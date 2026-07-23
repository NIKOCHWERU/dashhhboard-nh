"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Minimize2 } from "lucide-react";

export default function PDFCompressPage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF Compress"
      description="Kecilkan ukuran berkas PDF tanpa mengurangi kualitas keterbacaan dokumen."
      icon={<Minimize2 className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Tingkat Kompresi
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="recommended">Rekomendasi (Kualitas Baik & Ukuran Optimal)</option>
              <option value="extreme">Kompresi Ekstrem (Ukuran Sangat Kecil)</option>
              <option value="low">Kompresi Rendah (Kualitas Maksimal)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
