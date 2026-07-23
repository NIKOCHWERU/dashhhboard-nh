"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  Palette,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";

export default function ImageColorFilterPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [filterColor, setFilterColor] = useState<string>("#3B82F6");
  const [opacity, setOpacity] = useState<number>(50);
  const [intensity, setIntensity] = useState<number>(100);
  const [blendMode, setBlendMode] = useState<GlobalCompositeOperation>("multiply");
  const [showOriginal, setShowOriginal] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "webp">("png");

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
      applyFilter(img, filterColor, opacity, intensity, blendMode, showOriginal);
      showToast("success", "Gambar berhasil dimuat.");
    };
  };

  const applyFilter = (
    img: HTMLImageElement,
    color: string,
    op: number,
    inten: number,
    blend: GlobalCompositeOperation,
    origOnly: boolean
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    if (origOnly) return;

    // Apply color overlay layer using Canvas composite operations
    ctx.save();
    ctx.globalAlpha = (op / 100) * (inten / 100);
    ctx.globalCompositeOperation = blend;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  };

  useEffect(() => {
    if (imgRef.current && imageLoaded) {
      applyFilter(
        imgRef.current,
        filterColor,
        opacity,
        intensity,
        blendMode,
        showOriginal
      );
    }
  }, [filterColor, opacity, intensity, blendMode, showOriginal, imageLoaded]);

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const link = document.createElement("a");
    link.download = `color_filter_${Date.now()}.${outputFormat}`;
    link.href = canvas.toDataURL(`image/${outputFormat}`);
    link.click();
    showToast("success", "Gambar HD berfilter berhasil diunduh!");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 ${
            toast.type === "success"
              ? "bg-emerald-900 text-emerald-100 border border-emerald-700"
              : "bg-red-900 text-red-100 border border-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header & Breadcrumb */}
      <div className="space-y-2 pb-4 border-b border-gray-200 dark:border-gray-800">
        <nav className="flex items-center gap-1.5 text-xs font-semibold text-gray-400">
          <Link href="/" className="hover:text-brand-500 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Alat</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>Image</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500 font-bold">Image Color Filter</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-5 h-5 text-brand-500" />
              Image Color Filter
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Terapkan filter warna kustom, atur intensitas, transparansi, dan blend mode secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => setShowOriginal(true)}
              onMouseUp={() => setShowOriginal(false)}
              onMouseLeave={() => setShowOriginal(false)}
              disabled={!imageLoaded}
              className="px-3.5 py-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Tahan (Bandingkan Original)
            </button>
            <button
              onClick={handleExport}
              disabled={!imageLoaded}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export HD
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-4 rounded-3xl min-h-[420px] flex items-center justify-center overflow-hidden shadow-sm relative">
            {!imageLoaded ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto shadow-sm">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                    Upload Foto / Gambar
                  </h3>
                  <p className="text-xs text-gray-400">Pilih gambar JPG, PNG, atau WEBP dari komputer Anda.</p>
                </div>
                <label className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20 transition-all">
                  <Upload className="w-4 h-4" />
                  Pilih Gambar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-[520px] object-contain shadow-xl rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Pengaturan Filter Warna
            </h3>

            {/* Color Picker using Tailwind styled input */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Pilih Warna Filter Kustom
              </label>
              <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl">
                <input
                  type="color"
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <div>
                  <p className="text-xs font-black text-black dark:text-white uppercase">
                    {filterColor}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold">Color Picker HTML5</p>
                </div>
              </div>
            </div>

            {/* Preset Color Swatches */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Preset Palette Warna
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  "#3B82F6",
                  "#EF4444",
                  "#10B981",
                  "#F59E0B",
                  "#8B5CF6",
                  "#EC4899",
                  "#6B7280",
                  "#000000",
                ].map((hex) => (
                  <button
                    key={hex}
                    onClick={() => setFilterColor(hex)}
                    className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
                      filterColor === hex ? "scale-110 border-brand-500 ring-2 ring-brand-500/30" : "border-transparent"
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>

            {/* Blend Mode */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Blend Mode (Pencampuran Warna)
              </label>
              <select
                value={blendMode}
                onChange={(e) => setBlendMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
              >
                <option value="multiply">Multiply (Pergelap / Tint)</option>
                <option value="overlay">Overlay (Kontras Sedang)</option>
                <option value="soft-light">Soft Light (Lembut)</option>
                <option value="color">Color (Warna Monokrom)</option>
                <option value="screen">Screen (Pencerah)</option>
                <option value="difference">Difference (Efek Negatif)</option>
              </select>
            </div>

            {/* Opacity & Intensity Sliders */}
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  <span>Opacity (Transparansi)</span>
                  <span>{opacity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  <span>Intensitas Warna</span>
                  <span>{intensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Format Output */}
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Format Berkas Output
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
              >
                <option value="png">PNG (Resolusi Tinggi)</option>
                <option value="jpeg">JPG (Kompresi Terstandar)</option>
                <option value="webp">WEBP (Web Ready)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
