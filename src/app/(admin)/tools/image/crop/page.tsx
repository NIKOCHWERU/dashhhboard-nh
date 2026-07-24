"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  Download,
  Crop as CropIcon,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function ImageCropPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<string>("free");
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg" | "webp">("png");

  // Custom Pixel Crop
  const [cropWidth, setCropWidth] = useState<number>(800);
  const [cropHeight, setCropHeight] = useState<number>(600);

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
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      imgRef.current = img;
      setCropWidth(img.width);
      setCropHeight(img.height);
      setImageLoaded(true);
      setTimeout(() => {
        renderCanvas(img, rotation, flipH, flipV, img.width, img.height);
      }, 50);
      showToast("success", "Gambar berhasil dimuat.");
    };
  };

  const renderCanvas = (
    img: HTMLImageElement,
    rot: number,
    hFlip: boolean,
    vFlip: boolean,
    targetW: number,
    targetH: number
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = img.width;
    const h = img.height;

    if (rot === 90 || rot === 270) {
      canvas.width = h;
      canvas.height = w;
    } else {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // 1. Draw base image with rotation and flip
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.scale(hFlip ? -1 : 1, vFlip ? -1 : 1);
    ctx.drawImage(img, -w / 2, -h / 2);
    ctx.restore();

    // 2. Draw Live Crop Mask & Rectangle overlay
    const cWidth = Math.min(canvas.width, targetW);
    const cHeight = Math.min(canvas.height, targetH);
    const startX = (canvas.width - cWidth) / 2;
    const startY = (canvas.height - cHeight) / 2;

    // Dark semi-transparent overlay outside crop box
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    // Top
    ctx.fillRect(0, 0, canvas.width, startY);
    // Bottom
    ctx.fillRect(0, startY + cHeight, canvas.width, canvas.height - (startY + cHeight));
    // Left
    ctx.fillRect(0, startY, startX, cHeight);
    // Right
    ctx.fillRect(startX + cWidth, startY, canvas.width - (startX + cWidth), cHeight);

    // Live Crop Box Border (Bright Brand Line)
    ctx.strokeStyle = "#3B82F6";
    ctx.lineWidth = 3;
    ctx.strokeRect(startX, startY, cWidth, cHeight);

    // Live Grid lines inside Crop Box
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Vertical grid lines
    ctx.moveTo(startX + cWidth / 3, startY);
    ctx.lineTo(startX + cWidth / 3, startY + cHeight);
    ctx.moveTo(startX + (cWidth * 2) / 3, startY);
    ctx.lineTo(startX + (cWidth * 2) / 3, startY + cHeight);
    // Horizontal grid lines
    ctx.moveTo(startX, startY + cHeight / 3);
    ctx.lineTo(startX + cWidth, startY + cHeight / 3);
    ctx.moveTo(startX, startY + (cHeight * 2) / 3);
    ctx.lineTo(startX + cWidth, startY + (cHeight * 2) / 3);
    ctx.stroke();
  };

  useEffect(() => {
    if (imgRef.current && imageLoaded) {
      renderCanvas(imgRef.current, rotation, flipH, flipV, cropWidth, cropHeight);
    }
  }, [cropWidth, cropHeight, rotation, flipH, flipV, imageLoaded]);

  const handleRotate = () => {
    const nextRot = (rotation + 90) % 360;
    setRotation(nextRot);
    if (imgRef.current) renderCanvas(imgRef.current, nextRot, flipH, flipV, cropWidth, cropHeight);
  };

  const handleFlipH = () => {
    const nextH = !flipH;
    setFlipH(nextH);
    if (imgRef.current) renderCanvas(imgRef.current, rotation, nextH, flipV, cropWidth, cropHeight);
  };

  const handleFlipV = () => {
    const nextV = !flipV;
    setFlipV(nextV);
    if (imgRef.current) renderCanvas(imgRef.current, rotation, flipH, nextV, cropWidth, cropHeight);
  };

  const handleAspectChange = (ratioStr: string) => {
    setAspectRatio(ratioStr);
    if (!imgRef.current) return;
    const origW = imgRef.current.width;

    let newW = origW;
    let newH = imgRef.current.height;

    if (ratioStr === "1:1") {
      newW = origW;
      newH = origW;
    } else if (ratioStr === "4:3") {
      newW = origW;
      newH = Math.round((origW * 3) / 4);
    } else if (ratioStr === "16:9") {
      newW = origW;
      newH = Math.round((origW * 9) / 16);
    } else if (ratioStr === "A4") {
      newW = 1240;
      newH = 1754;
    } else if (ratioStr === "Letter") {
      newW = 1275;
      newH = 1650;
    } else if (ratioStr === "Instagram") {
      newW = 1080;
      newH = 1080;
    } else if (ratioStr === "Youtube") {
      newW = 1280;
      newH = 720;
    }

    setCropWidth(newW);
    setCropHeight(newH);
    if (imgRef.current) renderCanvas(imgRef.current, rotation, flipH, flipV, newW, newH);
  };

  const handleExport = () => {
    if (!imgRef.current || !imageLoaded) return;
    const img = imgRef.current;

    // Build un-masked export canvas
    const tempCanvas = document.createElement("canvas");
    const w = img.width;
    const h = img.height;

    if (rotation === 90 || rotation === 270) {
      tempCanvas.width = h;
      tempCanvas.height = w;
    } else {
      tempCanvas.width = w;
      tempCanvas.height = h;
    }

    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
    tempCtx.rotate((rotation * Math.PI) / 180);
    tempCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    tempCtx.drawImage(img, -w / 2, -h / 2);

    // Export Cropped Box Area
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = cropWidth;
    exportCanvas.height = cropHeight;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    const cWidth = Math.min(tempCanvas.width, cropWidth);
    const cHeight = Math.min(tempCanvas.height, cropHeight);
    const startX = (tempCanvas.width - cWidth) / 2;
    const startY = (tempCanvas.height - cHeight) / 2;

    expCtx.drawImage(
      tempCanvas,
      startX,
      startY,
      cWidth,
      cHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const link = document.createElement("a");
    link.download = `crop_output_${Date.now()}.${outputFormat}`;
    link.href = exportCanvas.toDataURL(`image/${outputFormat}`);
    link.click();
    showToast("success", "Gambar hasil pemotongan berhasil diunduh!");
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
          <span className="text-brand-500 font-bold">Image Crop</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Crop className="w-5 h-5 text-brand-500" />
              Image Crop & Resizer (Live Preview Box)
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Potong, putar, balik, dan ubah ukuran gambar dengan pratinjau garis kotak pemotong secara live.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRotate}
              disabled={!imageLoaded}
              className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Putar 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleFlipH}
              disabled={!imageLoaded}
              className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={handleFlipV}
              disabled={!imageLoaded}
              className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Flip Vertical"
            >
              <FlipVertical className="w-4 h-4" />
            </button>
            <button
              onClick={handleExport}
              disabled={!imageLoaded}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Crop
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
              Pengaturan Crop & Aspek Rasio
            </h3>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Preset Aspek Rasio (Live Adjust)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "free", label: "Free / Bebas" },
                  { id: "1:1", label: "1 : 1 (Persegi)" },
                  { id: "4:3", label: "4 : 3 (Foto)" },
                  { id: "16:9", label: "16 : 9 (Widescreen)" },
                  { id: "Instagram", label: "Instagram (1080px)" },
                  { id: "Youtube", label: "Youtube (720p)" },
                  { id: "A4", label: "A4 Document" },
                  { id: "Letter", label: "US Letter" },
                ].map((a) => (
                  <button
                    key={a.id}
                    onClick={() => handleAspectChange(a.id)}
                    className={`py-2 px-3 text-[11px] font-bold rounded-xl border transition-all cursor-pointer text-left ${
                      aspectRatio === a.id
                        ? "border-brand-500 text-brand-500 bg-brand-500/10 font-black"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-500/30"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pixel Crop Inputs */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Ukuran Output Pixel Live (Manual)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold text-gray-500">Lebar (px)</span>
                  <input
                    type="number"
                    value={cropWidth}
                    onChange={(e) => setCropWidth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500">Tinggi (px)</span>
                  <input
                    type="number"
                    value={cropHeight}
                    onChange={(e) => setCropHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-brand-500 text-black dark:text-white"
                  />
                </div>
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
                <option value="png">PNG (Transparan / Kualitas Asli)</option>
                <option value="jpeg">JPG (Kompresi Terstandar)</option>
                <option value="webp">WEBP (Format Web Ringan)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
