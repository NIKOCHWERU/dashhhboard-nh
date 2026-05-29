"use client";
import React, { useState } from "react";
import { useUpload } from "@/context/UploadContext";
import { Dropdown } from "../ui/dropdown/Dropdown";

export default function UploadDropdown() {
  const { tasks, cancelUpload, clearCompleted, activeUploadsCount } = useUpload();
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const hasActive = activeUploadsCount > 0;

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
        title="Daftar Unggahan"
      >
        {hasActive && (
          <span className="absolute right-0.5 top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-brand-500 flex">
            <span className="absolute inline-flex w-full h-full bg-brand-500 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className={`fill-current ${hasActive ? "text-brand-500 animate-pulse" : ""}`}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 16V4M12 4L8 8M12 4L16 8M4 20H20"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[190px] mt-[17px] flex h-[400px] w-[320px] flex-col rounded-none border border-stroke bg-white p-4 shadow-theme-lg dark:border-strokedark dark:bg-gray-900 sm:w-[360px] lg:right-0 z-999999"
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-stroke dark:border-strokedark">
          <h5 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            Unggahan ({tasks.length})
          </h5>
          {tasks.length > 0 && (
            <button
              onClick={clearCompleted}
              className="text-[9px] font-black text-red-500 hover:text-red-600 uppercase tracking-widest cursor-pointer"
            >
              Bersihkan
            </button>
          )}
        </div>

        <div className="flex flex-col h-auto overflow-y-auto custom-scrollbar grow divide-y divide-stroke dark:divide-strokedark">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center grow py-10 text-center">
              <svg
                className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p className="text-[10px] text-gray-400 italic">Tidak ada proses unggahan</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="py-3 flex flex-col gap-1.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="overflow-hidden grow">
                    <span className="text-[10px] font-bold text-black dark:text-white truncate block uppercase tracking-wide" title={task.fileName}>
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
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Batalkan Unggahan"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    {task.status === "success" && (
                      <span className="px-1.5 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase dark:bg-green-500/10 dark:text-green-400">
                        Selesai
                      </span>
                    )}
                    {task.status === "error" && (
                      <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-black uppercase dark:bg-red-500/10 dark:text-red-400" title={task.error}>
                        Gagal
                      </span>
                    )}
                  </div>
                </div>

                {(task.status === "uploading" || task.status === "pending") && (
                  <div className="space-y-1">
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-none overflow-hidden relative border border-gray-200/10">
                      <div
                        className="bg-brand-500 h-full transition-all duration-300 rounded-none"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase">
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
            ))
          )}
        </div>
      </Dropdown>
    </div>
  );
}
