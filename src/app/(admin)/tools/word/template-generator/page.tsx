"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { FileCode } from "lucide-react";

export default function DocumentTemplateGeneratorPage() {
  return (
    <ToolPageLayout
      category="Word"
      toolName="Document Template Generator"
      description="Buat dokumen Word secara otomatis berdasarkan templat dan variabel isian data."
      icon={<FileCode className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".docx,.doc"
      allowMultipleFiles={false}
      supportedFormatsText="Format didukung: DOCX, DOC"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              File Templat Master (.docx)
            </label>
            <input
              type="file"
              accept=".docx"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold text-black dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Metode Pengisian Data
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="form">Isian Form Interaktif</option>
              <option value="excel">Import Massal dari Excel (.xlsx)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
