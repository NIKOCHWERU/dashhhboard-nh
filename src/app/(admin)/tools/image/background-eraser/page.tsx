"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Image as ImageIcon } from "lucide-react";

export default function BackgroundEraserPage() {
  return (
    <ToolPageLayout
      category="Image"
      toolName="Background Eraser"
      description="Hapus latar belakang foto atau gambar secara otomatis dengan presisi tinggi."
      icon={<ImageIcon className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes="image/*"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: JPG, PNG, WEBP"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Mode Penghapusan Latar
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="auto">Otomatis (AI Smart Detection)</option>
              <option value="solid">Latar Solid / Monokrom</option>
              <option value="portrait">Foto Profil / Manusia</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Warna Pengganti Latar
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="transparent">Transparan (PNG)</option>
              <option value="white">Putih Bersih</option>
              <option value="red">Merah (Pas Foto)</option>
              <option value="blue">Biru (Pas Foto)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
