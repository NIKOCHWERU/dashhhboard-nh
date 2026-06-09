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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 transition-all duration-300 hover:shadow-md hover:border-brand-500/30">
      {/* Subtle top-right ambient glow */}
      <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-brand-500 animate-spin-[spin_8s_linear_infinite]" style={{ animation: 'spin 12s linear infinite' }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-500">{day}</span>
          </div>
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{date}</span>
          <div className="mt-2">
            <span className="inline-flex items-center gap-1 bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-brand-500/20 uppercase">
              Week {weekNum}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end font-mono">
            <span className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{time}</span>
            <span className="ml-1 text-sm font-black text-brand-500 w-5 animate-pulse">{seconds}</span>
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Live System</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- WIDGET KALENDER MINI ---
const HOLIDAYS_2026 = [
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi' },
  { date: '2026-01-17', name: 'Isra Mikraj Nabi Muhammad SAW' },
  { date: '2026-02-17', name: 'Tahun Baru Imlek 2577 Kongzili' },
  { date: '2026-03-19', name: 'Hari Suci Nyepi 1948' },
  { date: '2026-03-20', name: 'Hari Raya Idul Fitri 1447 H' },
  { date: '2026-03-21', name: 'Hari Raya Idul Fitri 1447 H' },
  { date: '2026-04-03', name: 'Wafat Yesus Kristus' },
  { date: '2026-04-05', name: 'Hari Raya Paskah' },
  { date: '2026-05-01', name: 'Hari Buruh Internasional' },
  { date: '2026-05-14', name: 'Kenaikan Yesus Kristus' },
  { date: '2026-05-27', name: 'Hari Raya Idul Adha 1447 H' },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE' },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila' },
  { date: '2026-06-07', name: 'Tahun Baru Islam 1448 H' },
  { date: '2026-08-17', name: 'Hari Kemerdekaan RI Ke-81' },
  { date: '2026-08-26', name: 'Maulid Nabi Muhammad SAW' },
  { date: '2026-12-25', name: 'Hari Raya Natal' }
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
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-800/80 dark:bg-gray-900 transition-all duration-300 hover:shadow-md hover:border-brand-500/30">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none">
            {monthNames[month]} <span className="font-normal text-gray-400 dark:text-gray-500 text-xs ml-0.5">{year}</span>
          </span>
          <div className="mt-1">
            <span className="inline-flex items-center bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[9px] font-black tracking-widest px-2 py-0.5 rounded border border-brand-500/20 uppercase">
              Week {weekNum}
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <button 
            onClick={prevMonth} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 border border-transparent hover:border-gray-200/60 dark:hover:border-gray-800"
            title="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={nextMonth} 
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-850 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-brand-500 dark:hover:text-brand-500 border border-transparent hover:border-gray-200/60 dark:hover:border-gray-800"
            title="Bulan Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Names */}
      <div className="grid grid-cols-7 mb-2.5 text-center border-b border-gray-100 dark:border-gray-800/80 pb-2">
        {daysShort.map((day, i) => (
          <div key={i} className={`text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'text-rose-500' : 'text-gray-400 dark:text-gray-550'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 text-center min-h-[160px] content-start gap-y-1.5 gap-x-1">
        {blankDays.map((_, i) => <div key={`blank-${i}`} className="h-7"></div>)}
        {daysArray.map(day => {
          const count = getAgendaCount(day);
          const holiday = isHoliday(day);
          const sunday = new Date(year, month, day).getDay() === 0;
          const today = isToday(day);
          const active = isSelected(day);

          return (
            <div key={day} className="h-7 flex items-center justify-center relative">
              <button
                onClick={() => onDateClick(new Date(year, month, day))}
                className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] transition-all font-bold relative
                  ${today ? "bg-brand-500 text-white shadow-md shadow-brand-500/25 ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900" : ""}
                  ${active && !today ? "bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/35 ring-1 ring-brand-500/20" : ""}
                  ${!today && !active && (holiday || sunday) ? "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10 hover:bg-rose-500/15" : ""}
                  ${!today && !active && !holiday && !sunday ? "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-850" : ""}
                `}
              >
                {day}
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center border-2 border-white dark:border-gray-900 font-black shadow-sm transition-transform hover:scale-110
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

      {/* Holidays List */}
      <div className="mt-4 pt-3 border-t border-gray-150 dark:border-gray-800">
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarDays className="w-3.5 h-3.5 text-rose-550 dark:text-rose-400" />
          <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Hari Libur Nasional</span>
        </div>
        
        <div className="h-[90px] overflow-y-auto pr-1 space-y-1.5 no-scrollbar">
          {holidaysInMonth.length > 0 ? (
            holidaysInMonth.map((h, i) => {
              const hD = new Date(h.date);
              return (
                <div key={i} className="flex items-center gap-2.5 p-1.5 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] dark:bg-rose-500/[0.04] transition-all hover:bg-rose-500/[0.06]">
                  <div className="flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-rose-550/10 text-rose-600 dark:text-rose-455 flex-shrink-0">
                    <span className="text-[11px] font-black leading-none">{hD.getDate()}</span>
                    <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">{monthNames[hD.getMonth()].substring(0, 3)}</span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-750 dark:text-gray-300 leading-tight truncate">{h.name}</span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 italic">Tidak ada hari libur bulan ini</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
