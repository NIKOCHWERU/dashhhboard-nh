"use client";
import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export interface UploadTask {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  folderId: string;
  description?: string;
  mimeType: string;
  speed?: string;
  eta?: string;
  uploadedBytes: number;
  uploadUrl?: string;
}

interface UploadContextType {
  tasks: UploadTask[];
  uploadFiles: (files: FileList | File[], folderId: string, description?: string) => void;
  cancelUpload: (taskId: string) => void;
  clearCompleted: () => void;
  activeUploadsCount: number;
  hasErrors: boolean;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

const CONCURRENCY_LIMIT = 3;
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB in bytes

export function UploadProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const xhrMapRef = useRef<{ [taskId: string]: XMLHttpRequest }>({});
  const fileCacheRef = useRef<{ [taskId: string]: File }>({});

  const uploadFiles = (files: FileList | File[], folderId: string, description = "") => {
    const fileList = Array.from(files);
    const newTasks: UploadTask[] = fileList.map((file) => {
      const isTooLarge = file.size > MAX_FILE_SIZE;
      return {
        id: Math.random().toString(36).substring(2, 11),
        fileName: file.name,
        fileSize: file.size,
        progress: 0,
        status: isTooLarge ? "error" : "pending",
        error: isTooLarge ? "Ukuran file melebihi batas maksimal 2GB" : undefined,
        folderId,
        description,
        mimeType: file.type || "application/octet-stream",
        uploadedBytes: 0,
      };
    });

    newTasks.forEach((task, index) => {
      if (task.status === "pending") {
        fileCacheRef.current[task.id] = fileList[index];
      }
    });

    setTasks((prev) => [...newTasks, ...prev]);
  };

  const cancelUpload = async (taskId: string) => {
    const xhr = xhrMapRef.current[taskId];
    if (xhr) {
      xhr.abort();
      delete xhrMapRef.current[taskId];
    }
    delete fileCacheRef.current[taskId];

    // Find task in local state to retrieve GDrive upload URL
    setTasks((prev) => {
      const task = prev.find((t) => t.id === taskId);
      if (task && task.uploadUrl) {
        // Asynchronously cancel upload session on Google Drive
        fetch(task.uploadUrl, { method: "DELETE" }).catch((e) =>
          console.error("Failed to cancel upload session on Google Drive:", e)
        );
      }
      return prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "error" as const, error: "Upload dibatalkan" }
          : t
      );
    });
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status === "pending" || t.status === "uploading"));
  };

  // Queue Scheduler
  useEffect(() => {
    const activeTasks = tasks.filter((t) => t.status === "uploading");
    if (activeTasks.length >= CONCURRENCY_LIMIT) return;

    const nextPending = tasks.find((t) => t.status === "pending");
    if (!nextPending) return;

    startUpload(nextPending.id);
  }, [tasks]);

  const startUpload = async (taskId: string) => {
    // 1. Update status to uploading
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: "uploading" as const } : t))
    );

    const file = fileCacheRef.current[taskId];
    const task = tasks.find((t) => t.id === taskId);
    if (!file || !task) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "error" as const, error: "Berkas tidak ditemukan" }
            : t
        )
      );
      return;
    }

    try {
      // 2. Initiate Resumable Upload
      const initRes = await fetch("/api/gdrive/initiate-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: task.mimeType,
          fileSize: file.size,
          folderId: task.folderId,
          description: task.description || "",
        }),
      });

      if (!initRes.ok) {
        const errJson = await initRes.json();
        throw new Error(errJson.error || "Gagal inisialisasi sesi upload.");
      }

      const { uploadUrl } = await initRes.json();

      // Store uploadUrl in the state so cancelUpload can access it
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, uploadUrl } : t))
      );

      // 3. PUT raw data to the session URL
      const xhr = new XMLHttpRequest();
      xhrMapRef.current[taskId] = xhr;

      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", task.mimeType);

      let startTime = Date.now();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const uploaded = event.loaded;
          const total = event.total;
          const progress = Math.round((uploaded / total) * 100);

          const elapsedTime = (Date.now() - startTime) / 1000; // seconds
          const speedBytesPerSec = elapsedTime > 0 ? uploaded / elapsedTime : 0;
          
          let speedStr = "0 KB/s";
          if (speedBytesPerSec > 1024 * 1024) {
            speedStr = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
          } else if (speedBytesPerSec > 1024) {
            speedStr = `${(speedBytesPerSec / 1024).toFixed(0)} KB/s`;
          }

          let etaStr = "--:--";
          if (speedBytesPerSec > 0) {
            const remainingBytes = total - uploaded;
            const remainingSeconds = remainingBytes / speedBytesPerSec;
            const m = Math.floor(remainingSeconds / 60);
            const s = Math.floor(remainingSeconds % 60);
            etaStr = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
          }

          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    progress,
                    uploadedBytes: uploaded,
                    speed: speedStr,
                    eta: etaStr,
                  }
                : t
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: "success" as const,
                    progress: 100,
                    uploadedBytes: file.size,
                    speed: undefined,
                    eta: undefined,
                  }
                : t
            )
          );
          
          // Push notification
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("Unggahan Selesai", {
              body: `File "${file.name}" berhasil diunggah ke Google Drive.`,
            });
          }

          // Clean up cache
          delete fileCacheRef.current[taskId];
          delete xhrMapRef.current[taskId];
        } else {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    status: "error" as const,
                    error: `Google API error: ${xhr.status}`,
                    speed: undefined,
                    eta: undefined,
                  }
                : t
            )
          );
          delete fileCacheRef.current[taskId];
          delete xhrMapRef.current[taskId];
        }
      };

      xhr.onerror = () => {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: "error" as const,
                  error: "Koneksi jaringan terputus.",
                  speed: undefined,
                  eta: undefined,
                }
              : t
          )
        );
        delete fileCacheRef.current[taskId];
        delete xhrMapRef.current[taskId];
      };

      xhr.send(file);
    } catch (err: any) {
      console.error("Error upload file ID:", taskId, err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "error" as const,
                error: err.message || "Gagal mengunggah",
                speed: undefined,
                eta: undefined,
              }
            : t
        )
      );

      delete fileCacheRef.current[taskId];
      delete xhrMapRef.current[taskId];
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const activeUploadsCount = tasks.filter((t) => t.status === "uploading" || t.status === "pending").length;
  const hasErrors = tasks.some((t) => t.status === "error");

  return (
    <UploadContext.Provider
      value={{
        tasks,
        uploadFiles,
        cancelUpload,
        clearCompleted,
        activeUploadsCount,
        hasErrors,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error("useUpload must be used within an UploadProvider");
  }
  return context;
}
