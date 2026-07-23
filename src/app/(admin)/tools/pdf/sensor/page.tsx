"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { ShieldAlert } from "lucide-react";

export default function PDFSensorPage() {
  return (
    <ToolPageLayout
      category="PDF"
      toolName="PDF Sensor"
      description="Sensor atau tutup informasi sensitif (NIK, Nomor Rekening, Nama) pada dokumen PDF."
      icon={<ShieldAlert className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes=".pdf"
      allowMultipleFiles={false}
      supportedFormatsText="Format didukung: PDF"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Kata Kunci Otomatis Disensor
            </label>
            <input
              type="text"
              placeholder="Pisahkan dengan koma (Contoh: NIK, Rahasia)"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Warna Penutup Sensor
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="black">Hitam Pekat (Standard Blackout)</option>
              <option value="blur">Efek Blur Dokumen</option>
              <option value="white">Putih (Tutup Bersih)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
