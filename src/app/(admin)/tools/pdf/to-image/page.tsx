"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileImage } from "lucide-react";

export default function PDFToImagePage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF To Image"
      description="Konversi setiap halaman dokumen PDF menjadi gambar berkualitras tinggi."
      icon={<FileImage className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Format Gambar Output
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="png">PNG (Resolusi Tinggi)</option>
              <option value="jpg">JPG (Ukuran Terkompresi)</option>
              <option value="webp">WEBP (Web Ready)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Kualitas Resolusi (DPI)
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="300">300 DPI (Cetak & HD)</option>
              <option value="150">150 DPI (Sedang)</option>
              <option value="96">96 DPI (Web & Email)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
