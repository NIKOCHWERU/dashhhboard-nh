"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileText } from "lucide-react";

export default function PDFToWordPage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF To Word"
      description="Ubah berkas PDF menjadi dokumen Microsoft Word (.docx) yang dapat diedit."
      icon={<FileText className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Metode Ekstraksi Teks
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="standard">Standar (Mempertahankan Layout)</option>
              <option value="ocr">OCR (Mengenali Hasil Scan Gambar)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
