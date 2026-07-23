"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Upload,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Redo2,
  Eraser,
  Wand2,
  Brush,
  Pipette,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";

export default function BackgroundEraserPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [mode, setMode] = useState<"auto" | "magic" | "manual" | "restore">("auto");
  const [brushSize, setBrushSize] = useState(25);
  const [feather, setFeather] = useState(2);
  const [tolerance, setTolerance] = useState(30);
  const [bgPreviewMode, setBgPreviewMode] = useState<"checker" | "white" | "black" | "custom">("checker");
  const [customBgColor, setCustomBgColor] = useState("#3B82F6");
  const [pickedColor, setPickedColor] = useState<string | null>(null);
  const [isPipetteActive, setIsPipetteActive] = useState(false);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // History Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Toast
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Canvas Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Push Canvas state to history
  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);

    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, data];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && history[nextIdx]) {
        ctx.putImageData(history[nextIdx], 0, 0);
        setHistoryIndex(nextIdx);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (canvas && ctx && history[nextIdx]) {
        ctx.putImageData(history[nextIdx], 0, 0);
        setHistoryIndex(nextIdx);
      }
    }
  };

  // Load Image onto Canvases
  const handleFileChange = (file: File | null) => {
    if (!file) return;
    setImageFile(file);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      setImageLoaded(true);
      setTimeout(() => {
        const canvas = canvasRef.current;
        const origCanvas = originalCanvasRef.current;
        if (!canvas || !origCanvas) return;

        canvas.width = img.width;
        canvas.height = img.height;
        origCanvas.width = img.width;
        origCanvas.height = img.height;

        const ctx = canvas.getContext("2d");
        const origCtx = origCanvas.getContext("2d");
        if (!ctx || !origCtx) return;

        ctx.drawImage(img, 0, 0);
        origCtx.drawImage(img, 0, 0);

        const initialData = ctx.getImageData(0, 0, img.width, img.height);
        setHistory([initialData]);
        setHistoryIndex(0);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        showToast("success", "Gambar berhasil dimuat.");
      }, 50);
    };
  };

  // Web Worker Ref
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Worker) {
      workerRef.current = new Worker("/workers/background-eraser.worker.js");
      workerRef.current.onmessage = (e) => {
        const { type, imageData, targetR, targetG, targetB } = e.data;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.putImageData(imageData, 0, 0);
        saveState();

        if (type === "auto-detect-complete") {
          showToast("success", "Latar belakang terdeteksi dan berhasil dihapus!");
        } else if (type === "magic-eraser-complete") {
          if (targetR !== undefined) {
            setPickedColor(`rgb(${targetR}, ${targetG}, ${targetB})`);
          }
          showToast("success", "Area warna berhasil dihapus!");
        }
      };
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [saveState]);

  // Auto Detect Object Removal (Web Worker Offloaded)
  const handleAutoDetect = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "auto-detect",
        imageData: imgData,
        tolerance,
        width: canvas.width,
        height: canvas.height,
      });
    } else {
      // Synchronous Fallback
      const d = imgData.data;
      const corners = [
        [0, 0],
        [canvas.width - 1, 0],
        [0, canvas.height - 1],
        [canvas.width - 1, canvas.height - 1],
      ];

      const bgColors = corners.map(([x, y]) => {
        const idx = (y * canvas.width + x) * 4;
        return [d[idx], d[idx + 1], d[idx + 2]];
      });

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const isBg = bgColors.some(([br, bg, bb]) => {
          const dist = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);
          return dist <= tolerance * 2.5;
        });

        if (isBg) {
          d[i + 3] = 0;
        }
      }

      ctx.putImageData(imgData, 0, 0);
      saveState();
      showToast("success", "Latar belakang terdeteksi dan berhasil dihapus!");
    }
  };

  // Magic Color Flood Eraser (Web Worker Offloaded)
  const applyMagicEraser = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (workerRef.current) {
      workerRef.current.postMessage({
        type: "magic-eraser",
        imageData: imgData,
        tolerance,
        startX,
        startY,
        width: canvas.width,
        height: canvas.height,
      });
    } else {
      // Synchronous Fallback
      const d = imgData.data;
      const width = canvas.width;
      const height = canvas.height;

      const startIdx = (startY * width + startX) * 4;
      const targetR = d[startIdx];
      const targetG = d[startIdx + 1];
      const targetB = d[startIdx + 2];

      setPickedColor(`rgb(${targetR}, ${targetG}, ${targetB})`);

      const visited = new Uint8Array(width * height);
      const stack = [[startX, startY]];

      while (stack.length > 0) {
        const [x, y] = stack.pop()!;
        const idx = (y * width + x) * 4;

        if (x < 0 || x >= width || y < 0 || y >= height || visited[y * width + x]) continue;
        visited[y * width + x] = 1;

        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        const dist = Math.sqrt((r - targetR) ** 2 + (g - targetG) ** 2 + (b - targetB) ** 2);

        if (dist <= tolerance * 2.5) {
          d[idx + 3] = 0;
          stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
        }
      }

      ctx.putImageData(imgData, 0, 0);
      saveState();
      showToast("success", "Area warna berhasil dihapus!");
    }
  };

  // Canvas Mouse Interactions (Drawing / Erasing / Pan)
  const isMouseDown = useRef(false);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || isDragging) return; // Middle click / pan
    isMouseDown.current = true;

    const { x, y } = getCanvasCoords(e);

    if (isPipetteActive) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        const px = ctx.getImageData(x, y, 1, 1).data;
        setPickedColor(`rgb(${px[0]}, ${px[1]}, ${px[2]})`);
        setIsPipetteActive(false);
      }
      return;
    }

    if (mode === "magic") {
      applyMagicEraser(x, y);
    } else {
      drawBrush(x, y);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDown.current) return;
    if (mode === "magic" || isPipetteActive) return;
    const { x, y } = getCanvasCoords(e);
    drawBrush(x, y);
  };

  const handleCanvasMouseUp = () => {
    if (isMouseDown.current) {
      isMouseDown.current = false;
      saveState();
    }
  };

  const drawBrush = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!canvas || !origCanvas) return;
    const ctx = canvas.getContext("2d");
    const origCtx = origCanvas.getContext("2d");
    if (!ctx || !origCtx) return;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);

    if (mode === "manual" || mode === "auto") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
    } else if (mode === "restore") {
      ctx.globalCompositeOperation = "source-over";
      const origPatternData = origCtx.getImageData(
        Math.max(0, x - brushSize),
        Math.max(0, y - brushSize),
        brushSize * 2,
        brushSize * 2
      );
      ctx.drawImage(
        origCanvas,
        Math.max(0, x - brushSize),
        Math.max(0, y - brushSize),
        brushSize * 2,
        brushSize * 2,
        Math.max(0, x - brushSize),
        Math.max(0, y - brushSize),
        brushSize * 2,
        brushSize * 2
      );
    }
    ctx.restore();
  };

  // Export Output Image
  const handleExportHD = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create temporary export canvas
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const expCtx = exportCanvas.getContext("2d");
    if (!expCtx) return;

    if (bgPreviewMode === "white") {
      expCtx.fillStyle = "#FFFFFF";
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    } else if (bgPreviewMode === "black") {
      expCtx.fillStyle = "#000000";
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    } else if (bgPreviewMode === "custom") {
      expCtx.fillStyle = customBgColor;
      expCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    expCtx.drawImage(canvas, 0, 0);

    const link = document.createElement("a");
    link.download = `eraser_output_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    showToast("success", "Gambar HD berhasil diunduh!");
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
          <span className="text-brand-500 font-bold">Background Eraser</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-brand-500" />
              Background Eraser
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Hapus latar belakang foto atau gambar secara instan langsung di browser tanpa upload ke server.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportHD}
              disabled={!imageLoaded}
              className="px-4 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export HD (PNG)
            </button>
          </div>
        </div>
      </div>

      {/* Hidden Original Canvas */}
      <canvas ref={originalCanvasRef} className="hidden" />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Area (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Zoom / Canvas Controls Bar */}
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Mode Penghapus:</span>
              {[
                { id: "auto", label: "Auto Detect", icon: <Wand2 className="w-3.5 h-3.5" /> },
                { id: "magic", label: "Magic Wand", icon: <Eraser className="w-3.5 h-3.5" /> },
                { id: "manual", label: "Manual Eraser", icon: <Brush className="w-3.5 h-3.5" /> },
                { id: "restore", label: "Restore Brush", icon: <RotateCcw className="w-3.5 h-3.5" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    mode === m.id
                      ? "bg-brand-500 text-white shadow-sm"
                      : "border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-500">{Math.round(zoom * 100)}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg cursor-pointer"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Interactive Viewport */}
          <div
            ref={containerRef}
            className={`relative min-h-[420px] rounded-3xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all select-none ${
              bgPreviewMode === "checker"
                ? "bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:16px_16px]"
                : bgPreviewMode === "white"
                ? "bg-white"
                : bgPreviewMode === "black"
                ? "bg-black"
                : ""
            }`}
            style={bgPreviewMode === "custom" ? { backgroundColor: customBgColor } : {}}
          >
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
              <div
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transformOrigin: "center center",
                  transition: isDragging ? "none" : "transform 0.1s ease-out",
                }}
              >
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUp}
                  className="max-w-full max-h-[550px] object-contain cursor-crosshair shadow-2xl rounded-lg"
                />
              </div>
            )}
          </div>
        </div>

        {/* Setting Panel Right (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl space-y-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
              <Sliders className="w-4 h-4 text-brand-500" />
              Pengaturan Eraser & Kuas
            </h3>

            {/* Quick Auto Detect Button */}
            <button
              onClick={handleAutoDetect}
              disabled={!imageLoaded}
              className="w-full py-3 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              Auto Detect & Hapus Latar
            </button>

            {/* Sliders */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  <span>Ukuran Kuas (Brush Size)</span>
                  <span>{brushSize}px</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  <span>Toleransi Warna (Magic Wand)</span>
                  <span>{tolerance}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={tolerance}
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Background Preview Toggle */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Preview Background Tampilan
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "checker", label: "Checker" },
                  { id: "white", label: "Putih" },
                  { id: "black", label: "Hitam" },
                  { id: "custom", label: "Warna" },
                ].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBgPreviewMode(b.id as any)}
                    className={`py-2 text-[11px] font-bold rounded-xl border transition-all cursor-pointer ${
                      bgPreviewMode === b.id
                        ? "border-brand-500 text-brand-500 bg-brand-500/10 font-black"
                        : "border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>

              {bgPreviewMode === "custom" && (
                <div className="pt-2 flex items-center gap-3">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                    {customBgColor}
                  </span>
                </div>
              )}
            </div>

            {/* Color Picker Indicator */}
            {pickedColor && (
              <div className="p-3 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between text-xs">
                <span className="text-gray-500 font-bold">Warna Terpilih:</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: pickedColor }} />
                  <span className="font-extrabold text-black dark:text-white">{pickedColor}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
