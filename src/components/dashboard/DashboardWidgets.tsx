"use client";
import React, { useState, useEffect } from "react";

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
  const date = now.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-500">{day}</span>
          <span className="text-sm font-medium text-black dark:text-white">{date}</span>
        </div>
        <div className="text-right">
          <div className="flex items-baseline justify-end">
            <span className="text-3xl font-black text-black dark:text-white">{time}</span>
            <span className="ml-1 text-sm font-bold text-brand-500 w-5">{seconds}</span>
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

  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

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

  return (
    <div className="rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-black dark:text-white">
            {monthNames[month]} <span className="font-normal opacity-60">{year}</span>
          </span>
          <span className="text-[9px] text-brand-500 font-bold uppercase tracking-tight">Week {getWeekNumber(viewDate)} {year}</span>
        </div>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-meta-4 rounded transition-colors text-black dark:text-white">
            <svg className="fill-current" width="12" height="12" viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>
          </button>
          <button onClick={nextMonth} className="p-1 hover:bg-gray-100 dark:hover:bg-meta-4 rounded transition-colors text-black dark:text-white">
            <svg className="fill-current" width="12" height="12" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-2 text-center border-b border-stroke pb-1 dark:border-strokedark">
        {daysShort.map((day, i) => (
          <div key={i} className={`text-[9px] font-bold uppercase ${i === 0 ? 'text-red-500' : 'text-gray-400'}`}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 text-center min-h-[160px] content-start">
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
                className={`w-6 h-6 flex items-center justify-center rounded-md text-[10px] transition-all font-bold relative
                  ${today ? "bg-brand-500 text-white shadow-md" : ""}
                  ${active && !today ? "bg-brand-100 text-brand-600 dark:bg-brand-500/20" : ""}
                  ${!today && !active && (holiday || sunday) ? "text-red-500 bg-red-50 dark:bg-red-500/10" : ""}
                  ${!today && !active && !holiday && !sunday ? "text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4" : ""}
                `}
              >
                {day}
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full text-[7px] flex items-center justify-center border border-white dark:border-boxdark font-black shadow-sm
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

      <div className="mt-3 pt-3 border-t border-stroke dark:border-strokedark h-[80px] overflow-y-auto no-scrollbar">
        {holidaysInMonth.length > 0 ? (
          holidaysInMonth.map((h, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
              <div className="flex items-center justify-center min-w-[24px] h-5 rounded bg-red-500 shadow-sm">
                <span className="text-[9px] font-bold text-white">{new Date(h.date).getDate().toString().padStart(2, '0')}</span>
              </div>
              <span className="text-[9px] leading-tight text-black dark:text-white pt-0.5 font-bold">{h.name}</span>
            </div>
          ))
        ) : (
          <p className="text-[9px] italic text-gray-400 text-center pt-2">Tidak ada hari libur</p>
        )}
      </div>
    </div>

  );
};
