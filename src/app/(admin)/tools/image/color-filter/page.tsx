"use client";

import React from "react";
import { ToolPageLayout } from "@/components/tools/ToolPageLayout";
import { Palette } from "lucide-react";

export default function ImageColorFilterPage() {
  return (
    <ToolPageLayout
      category="Image"
      toolName="Image Color Filter"
      description="Terapkan filter warna, tingkat kecerahan, kontras, dan efek foto."
      icon={<Palette className="w-5 h-5 text-brand-500" />}
      acceptedFileTypes="image/*"
      allowMultipleFiles={true}
      supportedFormatsText="Format didukung: JPG, PNG, WEBP"
      settingPanel={
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              Preset Filter Warna
            </label>
            <select className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white">
              <option value="none">Normal (Tanpa Filter)</option>
              <option value="grayscale">Hitam Putih (Grayscale)</option>
              <option value="sepia">Sepia Klasik</option>
              <option value="contrast">High Contrast Dokumen</option>
              <option value="warm">Warm Tone</option>
              <option value="cool">Cool Tone</option>
            </select>
          </div>
        </div>
      }
    />
  );
}
