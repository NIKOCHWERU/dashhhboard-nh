"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Scissors } from "lucide-react";

export default function PDFSlicePage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF Slice"
      description="Pisah atau potong halaman tertentu dari dokumen PDF menjadi berkas baru."
      icon={<Scissors className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={false}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Rentang Halaman (Contoh: 1-5, 8, 11-13)
            </label>
            <input
              type="text"
              placeholder="Contoh: 1-3, 5"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
            />
          </div>
        </div>
      }
    />
  );
}
