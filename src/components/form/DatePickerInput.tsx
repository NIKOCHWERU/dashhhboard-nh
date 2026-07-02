"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface DatePickerInputProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  minDate?: string;
  maxDate?: string;
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function formatDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

function parseDate(str: string): { y: number; m: number; d: number } | null {
  if (!str) return null;
  const parts = str.split("-");
  if (parts.length !== 3) return null;
  return { y: parseInt(parts[0]), m: parseInt(parts[1]), d: parseInt(parts[2]) };
}

export default function DatePickerInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Pilih tanggal",
  className = "",
  minDate,
  maxDate,
}: DatePickerInputProps) {
  const today = new Date();
  const parsed = parseDate(value);
  const [viewYear, setViewYear] = useState(parsed?.y ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.m - 1 : today.getMonth());
  const [open, setOpen] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = parseDate(value);
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m - 1);
    }
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowYearPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  function selectDate(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const newVal = `${viewYear}-${m}-${d}`;
    if (minDate && newVal < minDate) return;
    if (maxDate && newVal > maxDate) return;
    onChange(newVal);
    setOpen(false);
    setShowYearPicker(false);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function isSelected(day: number) {
    if (!parsed) return false;
    return parsed.y === viewYear && parsed.m - 1 === viewMonth && parsed.d === day;
  }

  function isToday(day: number) {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  }

  function isDisabledDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const s = `${viewYear}-${m}-${d}`;
    if (minDate && s < minDate) return true;
    if (maxDate && s > maxDate) return true;
    return false;
  }

  const yearRange = Array.from({ length: 21 }, (_, i) => viewYear - 10 + i);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) { setOpen(o => !o); setShowYearPicker(false); } }}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : "cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 bg-white dark:bg-gray-900"}
          ${open ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-300 dark:border-gray-700"}
          text-gray-800 dark:text-white`}
      >
        <span className={!value ? "text-gray-400 dark:text-gray-500" : ""}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[9999] mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-72 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-500 text-white">
            <button type="button" onClick={prevMonth} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowYearPicker(s => !s)}
              className="font-bold text-sm hover:bg-white/20 px-3 py-1 rounded-lg transition-colors"
            >
              {MONTHS[viewMonth]} {viewYear}
            </button>

            <button type="button" onClick={nextMonth} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {showYearPicker ? (
            <div className="grid grid-cols-3 gap-1 p-3 max-h-52 overflow-y-auto">
              {yearRange.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => { setViewYear(y); setShowYearPicker(false); }}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors
                    ${y === viewYear ? "bg-brand-500 text-white" : "hover:bg-brand-50 dark:hover:bg-brand-900/30 text-gray-700 dark:text-gray-300"}`}
                >
                  {y}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="text-center text-[10px] font-black text-gray-400 dark:text-gray-500 py-1">
                    {d}
                  </div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const sel = isSelected(day);
                  const tod = isToday(day);
                  const dis = isDisabledDay(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={dis}
                      onClick={() => selectDate(day)}
                      className={`h-8 w-full text-xs font-bold rounded-lg transition-all
                        ${dis ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
                        ${sel ? "bg-brand-500 text-white shadow-md" : tod ? "bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400" : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, "0");
                    const d = String(now.getDate()).padStart(2, "0");
                    onChange(`${y}-${m}-${d}`);
                    setOpen(false);
                  }}
                  className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
                >
                  Hari Ini
                </button>
                {value && (
                  <button
                    type="button"
                    onClick={() => { onChange(""); setOpen(false); }}
                    className="flex-1 py-1.5 text-[10px] font-black uppercase tracking-wide rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
