"use client";
import React, { useState, useEffect } from "react";
import { Clock, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

// Helper function to calculate ISO week number
const calculateWeekNumber = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

// --- WIDGET JAM DIGITAL ---
export const DigitalClock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(".", ":");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const day = now.toLocaleDateString("id-ID", { weekday: "long" });
  const date = now.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  const weekNum = calculateWeekNumber(now);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 transition-all duration-300 hover:shadow-md hover:border-brand-500/30 flex items-center h-full">
      {/* Subtle top-right ambient glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="flex items-center justify-between w-full relative z-10">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-brand-500" style={{ animation: 'spin 12s linear infinite' }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">{day}</span>
          </div>
          <span className="text-gray-200 dark:text-gray-850 font-normal text-[10px]">|</span>
          <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">{date}</span>
          <span className="text-gray-200 dark:text-gray-850 font-normal text-[10px]">|</span>
          <span className="inline-flex items-center bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border border-brand-500/20 uppercase">
            Week {weekNum}
          </span>
        </div>
        
        <div className="text-right flex items-center gap-3">
          <div className="flex items-baseline font-mono">
            <span className="text-2xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{time}</span>
            <span className="ml-0.5 text-xs font-black text-brand-500 w-5 animate-pulse text-left">{seconds}</span>
          </div>
          <div className="flex items-center gap-1 select-none border-l border-gray-150 dark:border-gray-800 pl-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sistem Aktif</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- WIDGET KALENDER MINI ---
export const HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Tahun Baru Masehi 🎉' },
  { date: '2026-01-16', name: 'Isra Mi’raj Nabi Muhammad S.A.W. 🕌' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili 🐉' },
  { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948) 🌸' },
  { date: '2026-03-21', name: 'Idul Fitri 1447 H 🌙' },
  { date: '2026-03-22', name: 'Idul Fitri 1447 H 🌙' },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus ✝️' },
  { date: '2026-04-05', name: 'Kebangkitan Yesus Kristus (Paskah) 🐣' },
  { date: '2026-05-01', name: 'Hari Buruh Internasional 💼' },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus ✨' },
  { date: '2026-05-27', name: 'Idul Adha 1447 H 🐑' },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE 🕉️' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila 📜' },
  { date: '2026-06-16', name: '1 Muharam Tahun Baru Islam 1448 H 🕌' },
  { date: '2026-08-17', name: 'Proklamasi Kemerdekaan 🇮🇩' },
  { date: '2026-08-25', name: 'Maulid Nabi Muhammad S.A.W. 🎊' },
  { date: '2026-12-25', name: 'Kelahiran Yesus Kristus (Natal) 🎄' }
];

interface MiniCalendarProps {
  agendas: any[];
  onDateClick: (date: Date | null) => void;
  selectedDate: Date | null;
}

export const MiniCalendar: React.FC<MiniCalendarProps> = ({ agendas, onDateClick, selectedDate }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const month = viewDate.getMonth();
  const year = viewDate.getFullYear();

  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const blankDays = Array.from({ length: firstDayOfMonth });
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isToday = (day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (day: number) => {
    return selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;
  };

  const isHoliday = (day: number) => {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return HOLIDAYS_2026.find(h => h.date === dStr);
  };

  const getAgendaCount = (day: number) => {
    return agendas.filter(a => {
      const aDate = new Date(a.startDate);
      return aDate.getDate() === day && aDate.getMonth() === month && aDate.getFullYear() === year;
    }).length;
  };

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const holidaysInMonth = HOLIDAYS_2026.filter(h => {
    const hD = new Date(h.date);
    return hD.getMonth() === month && hD.getFullYear() === year;
  });

  const weekNum = calculateWeekNumber(viewDate);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-3.5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 transition-all duration-300 hover:shadow-md hover:border-brand-500/30 h-full flex flex-col justify-between">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">
            {monthNames[month]} <span className="font-normal text-gray-400 dark:text-gray-550 text-[10px] ml-0.5">{year}</span>
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded border border-brand-500/20 uppercase">
              Week {weekNum}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 border border-transparent hover:border-gray-200/60 dark:hover:border-gray-800"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 border border-transparent hover:border-gray-200/60 dark:hover:border-gray-800"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 mb-1.5 text-center border-b border-gray-100 dark:border-gray-800/80 pb-1.5">
        {daysShort.map((day, i) => (
          <div key={i} className={`text-[9px] font-black uppercase tracking-wider ${i === 0 ? 'text-rose-500' : 'text-gray-400 dark:text-gray-550'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 text-center min-h-[135px] content-start gap-y-1 gap-x-1 flex-1">
        {blankDays.map((_, i) => <div key={`blank-${i}`} className="h-6"></div>)}
        {daysArray.map(day => {
          const count = getAgendaCount(day);
          const holiday = isHoliday(day);
          const sunday = new Date(year, month, day).getDay() === 0;
          const today = isToday(day);
          const active = isSelected(day);

          return (
            <div key={day} className="h-6 flex items-center justify-center relative">
              <button
                onClick={() => onDateClick(new Date(year, month, day))}
                className={`w-5 h-5 flex items-center justify-center rounded-md text-[9px] transition-all font-bold relative
                  ${today ? "bg-brand-500 text-white shadow-sm shadow-brand-500/25 ring-1 ring-brand-500 ring-offset-1 dark:ring-offset-gray-900" : ""}
                  ${active && !today ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/35" : ""}
                  ${!today && !active && (holiday || sunday) ? "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/15" : ""}
                  ${!today && !active && !holiday && !sunday ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850" : ""}
                `}
              >
                {day}
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] flex items-center justify-center border border-white dark:border-gray-900 font-black shadow-sm transition-transform hover:scale-110
                    ${today ? "bg-white text-brand-500" : "bg-brand-500 text-white"}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
