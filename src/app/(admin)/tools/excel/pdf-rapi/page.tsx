"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Table } from "lucide-react";

export default function ExcelPdfRapiPage() {
  return (
    <ToolPageLayout
      category="Excel"
      toolName="Excel PDF Rapi"
      description="Konversi spreadsheet Excel ke PDF dengan tata letak rapi, presisi, dan tidak terpotong."
      icon={<Table className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".xlsx,.xls,.csv"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: XLSX, XLS, CSV"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Orientasi Kertas
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="auto">Otomatis (Fit Kertas Sesuai Kolom)</option>
              <option value="landscape">Landscape (Melebar)</option>
              <option value="portrait">Portrait (Tegak)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Skala Halaman (Fit To Page)
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="fit-width">Sesuaikan Lebar Kolom (1 Halaman)</option>
              <option value="actual">Ukuran Asli (100%)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
