"use client";
import React, { useState, useEffect } from "react";
import { useUpload } from "@/context/UploadContext";

export default function FloatingUploadWidget() {
  const { tasks, cancelUpload, clearCompleted, activeUploadsCount } = useUpload();
  const [isMinimized, setIsMinimized] = useState(false);

  // Auto-open when new uploads start
  useEffect(() => {
    if (activeUploadsCount > 0) {
      setIsMinimized(false);
    }
  }, [activeUploadsCount]);

  if (tasks.length === 0) return null;

  // Calculate overall progress
  const totalFiles = tasks.length;
  const completedFiles = tasks.filter((t) => t.status === "success").length;
  const failedFiles = tasks.filter((t) => t.status === "error").length;
  
  const totalBytes = tasks.reduce((acc, t) => acc + t.fileSize, 0);
  const uploadedBytes = tasks.reduce(
    (acc, t) => acc + (t.status === "success" ? t.fileSize : t.uploadedBytes || 0),
    0
  );
  
  const overallProgress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="fixed bottom-6 right-6 z-[99999] flex flex-col items-end">
      {isMinimized ? (
        /* MINIMIZED VIEW: Small interactive pill */
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 bg-brand-500 hover:bg-brand-600 dark:bg-brand-600 dark:hover:bg-brand-700 text-white px-5 py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105"
        >
          {activeUploadsCount > 0 ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          <span className="text-xs font-black uppercase tracking-wider">
            {activeUploadsCount > 0 
              ? `Mengunggah (${completedFiles}/${totalFiles}) • ${overallProgress}%` 
              : `Selesai (${completedFiles} File)`
            }
          </span>
        </button>
      ) : (
        /* MAXIMIZED VIEW: Beautiful detailed floating modal card */
        <div className="w-80 sm:w-96 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-150 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeUploadsCount > 0 ? "bg-brand-500" : "bg-green-500"}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${activeUploadsCount > 0 ? "bg-brand-500" : "bg-green-500"}`}></span>
              </span>
              <h5 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
                Status Unggahan ({completedFiles}/{totalFiles})
              </h5>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Minimize Button */}
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-gray-150 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors cursor-pointer"
                title="Kecilkan Tampilan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
              
              {/* Clear Completed */}
              {tasks.length > completedFiles + failedFiles === false && (
                <button
                  onClick={clearCompleted}
                  className="text-[9px] font-black text-red-500 hover:text-red-650 uppercase tracking-widest cursor-pointer"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>

          {/* Upload Progress Bar (Overall) */}
          {activeUploadsCount > 0 && (
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          )}

          {/* List of Tasks */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-850 px-5 py-2 custom-scrollbar">
            {tasks.map((task) => (
              <div key={task.id} className="py-3 flex flex-col gap-1.5 first:pt-1 last:pb-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="overflow-hidden grow">
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate block uppercase tracking-wide" title={task.fileName}>
                      {task.fileName}
                    </span>
                    <span className="text-[8px] text-gray-400 font-semibold block mt-0.5">
                      Ukuran: {formatSize(task.fileSize)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {(task.status === "pending" || task.status === "uploading") && (
                      <button
                        onClick={() => cancelUpload(task.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded"
                        title="Batalkan Unggahan"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {task.status === "success" && (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase rounded dark:bg-green-500/10 dark:text-green-400">
                        Selesai
                      </span>
                    )}
                    {task.status === "error" && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-650 text-[8px] font-black uppercase rounded dark:bg-red-500/10 dark:text-red-400" title={task.error}>
                        Gagal
                      </span>
                    )}
                  </div>
                </div>

                {(task.status === "uploading" || task.status === "pending") && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 dark:bg-gray-900 h-1.5 rounded overflow-hidden relative">
                      <div
                        className="bg-brand-500 h-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                      <span>{task.progress}%</span>
                      {task.status === "uploading" && task.speed && (
                        <span>
                          {task.speed} &bull; {task.eta} tersisa
                        </span>
                      )}
                      {task.status === "pending" && <span>Mengantre...</span>}
                    </div>
                  </div>
                )}

                {task.status === "error" && task.error && (
                  <p className="text-[9px] font-semibold text-red-500 leading-tight">
                    Info: {task.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
