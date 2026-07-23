"use client";

import React, { useEffect, useRef } from "react";

interface PdfPageCanvasProps {
  pdfDoc: any;
  pageNum: number;
  scale?: number;
  className?: string;
}

export function PdfPageCanvas({ pdfDoc, pageNum, scale = 0.3, className = "" }: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        console.error(`Error rendering PDF thumbnail page ${pageNum}:`, err);
      }
    }

    renderPage();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNum, scale]);

  return <canvas ref={canvasRef} className={`rounded-lg shadow-sm ${className}`} />;
}
