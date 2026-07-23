"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Crop } from "lucide-react";

export default function ImageCropPage() {
  return (
    <ToolPageLayout
      category="Image"
      toolName="Image Crop"
      description="Potong dan atur aspek rasio gambar sesuai ukuran yang diinginkan."
      icon={<Crop className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes="image/*"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: JPG, PNG, WEBP"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Aspek Rasio Pemotongan
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="free">Bebas (Custom Ratio)</option>
              <option value="1:1">1:1 (Persegi / Profil)</option>
              <option value="4:3">4:3 (Standar Foto)</option>
              <option value="16:9">16:9 (Widescreen / Banner)</option>
              <option value="3:4">3:4 (Pas Foto 3x4)</option>
              <option value="4:6">4:6 (Pas Foto 4x6)</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
