"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { UserCircleIcon } from "@/icons";

interface TaskItem {
  task: string;
  duration: number;
  desc: string;
}

interface SavedReport {
  id: string;
  userId: string;
  tanggal: string;
  prioritas: string; // JSON string
  documents: string; // JSON string
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

export default function SkalaPrioritasPage() {
  const { data: session } = useSession();
  const user = session?.user as any;

  const [selectedDate, setSelectedDate] = useState("");
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Set default date to today
  useEffect(() => {
    const tzoffset = new Date().getTimezoneOffset() * 60000;
    const localISOTime = new Date(Date.now() - tzoffset).toISOString().slice(0, 10);
    setSelectedDate(localISOTime);
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchReports();
    }
  }, [selectedDate]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan-harian?date=${selectedDate}`);
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch priority reports:", e);
    } finally {
      setLoading(false);
    }
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-wider">Pemantauan Skala Prioritas</h1>
          <p className="text-xs text-gray-500">Memonitor skala prioritas kerja harian dari setiap karyawan.</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3 bg-white dark:bg-white/[0.02] p-2 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Tanggal:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent text-xs font-bold text-black dark:text-white outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Main Panel */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-100 dark:bg-white/[0.01] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
          <div className="h-64 bg-gray-100 dark:bg-white/[0.01] border border-gray-200 dark:border-gray-800 animate-pulse rounded-2xl"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {reports.map((report) => {
            let q1List: TaskItem[] = [];
            let q2List: TaskItem[] = [];
            let q3List: TaskItem[] = [];
            let attachedFiles: { name: string; url: string }[] = [];

            try {
              const prio = JSON.parse(report.prioritas);
              q1List = prio.q1 || [];
              q2List = prio.q2 || [];
              q3List = prio.q3 || [];
            } catch (e) {}

            try {
              if (report.documents) {
                attachedFiles = JSON.parse(report.documents);
              }
            } catch (e) {}

            return (
              <div
                key={report.id}
                className="bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-5 rounded-2xl shadow-lg flex flex-col justify-between"
              >
                {/* User Header */}
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center font-black text-sm">
                      {report.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-black dark:text-white uppercase tracking-wide">
                        {report.user.name}
                      </h3>
                      <span className="text-[10px] font-bold text-gray-400 block mt-0.5">
                        {report.user.email}
                      </span>
                    </div>
                  </div>
                  
                  {/* Date Badge */}
                  <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 bg-brand-500/10 text-brand-500 rounded-full">
                    {formatDateIndo(report.tanggal).split(",")[1]?.trim() || formatDateIndo(report.tanggal)}
                  </span>
                </div>

                {/* Priorities Columns */}
                <div className="space-y-4 flex-1">
                  
                  {/* Q1 Column */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                      Q1 — Mendesak & Penting
                    </span>
                    {q1List.length > 0 ? (
                      <div className="space-y-2.5 bg-rose-500/[0.01] dark:bg-rose-500/[0.02] border border-rose-500/10 p-3 rounded-xl">
                        {q1List.map((t, idx) => (
                          <div key={idx} className="text-xs">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">
                              {idx + 1}. {t.task} <span className="text-[10px] text-rose-500 font-bold bg-rose-500/5 px-1.5 py-0.2 rounded-md ml-1">{t.duration}m</span>
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 italic">{t.desc || "-"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-semibold italic pl-3">-</p>
                    )}
                  </div>

                  {/* Q2 Column */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-[#B88A16] uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B88A16]"></span>
                      Q2 — Penting, Tidak Mendesak
                    </span>
                    {q2List.length > 0 ? (
                      <div className="space-y-2.5 bg-[#B88A16]/[0.01] dark:bg-[#B88A16]/[0.02] border border-[#B88A16]/10 p-3 rounded-xl">
                        {q2List.map((t, idx) => (
                          <div key={idx} className="text-xs">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">
                              {idx + 1}. {t.task} <span className="text-[10px] text-[#B88A16] font-bold bg-[#B88A16]/5 px-1.5 py-0.2 rounded-md ml-1">{t.duration}m</span>
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 italic">{t.desc || "-"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-semibold italic pl-3">-</p>
                    )}
                  </div>

                  {/* Q3 Column */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                      Q3 — Rendah
                    </span>
                    {q3List.length > 0 ? (
                      <div className="space-y-2.5 bg-brand-500/[0.01] dark:bg-brand-500/[0.02] border border-brand-500/10 p-3 rounded-xl">
                        {q3List.map((t, idx) => (
                          <div key={idx} className="text-xs">
                            <h4 className="font-bold text-gray-800 dark:text-gray-200">
                              {idx + 1}. {t.task} <span className="text-[10px] text-brand-500 font-bold bg-brand-500/5 px-1.5 py-0.2 rounded-md ml-1">{t.duration}m</span>
                            </h4>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5 italic">{t.desc || "-"}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-semibold italic pl-3">-</p>
                    )}
                  </div>

                </div>

                {/* Attachments Section */}
                {attachedFiles.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Lampiran Dokumen</span>
                    <div className="flex flex-wrap gap-1.5">
                      {attachedFiles.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-white/10 text-brand-500 hover:text-brand-600 border border-gray-200 dark:border-gray-800 text-[10px] font-bold rounded truncate max-w-[200px]"
                          title={file.name}
                        >
                          {file.name}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 italic bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 rounded-2xl text-xs flex flex-col items-center justify-center">
          Belum ada laporan skala prioritas masuk pada tanggal {formatDateIndo(selectedDate)}.
        </div>
      )}
    </div>
  );
}
