import type { Metadata } from "next";
import Calendar from "@/components/calendar/Calendar";
import React from "react";

export const metadata: Metadata = {
  title: "Kalender",
  description: "Atur dan lihat kegiatan atau agenda kerja anda",
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider">Kalender</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Atur dan lihat kegiatan atau agenda kerja anda</p>
        </div>
      </div>
      
      <Calendar />
    </div>
  );
}
