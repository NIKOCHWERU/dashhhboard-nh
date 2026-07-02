"use client";
import React, { useState, useRef, useEffect } from "react";

interface TimePickerInputProps {
  value: string; // HH:mm (24-hour)
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function parseTime(str: string): { h: number; m: number } {
  if (!str) return { h: 9, m: 0 };
  const parts = str.split(":");
  return { h: parseInt(parts[0]) || 0, m: parseInt(parts[1]) || 0 };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const MINUTE_STEPS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export default function TimePickerInput({
  value,
  onChange,
  disabled = false,
  placeholder = "Pilih waktu",
  className = "",
}: TimePickerInputProps) {
  const { h: initH, m: initM } = parseTime(value);
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(initH);
  const [minute, setMinute] = useState(initM);
  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { h, m } = parseTime(value);
    setHour(h);
    setMinute(m);
  }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll selected item into view
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const hEl = hourRef.current?.querySelector(`[data-hour="${hour}"]`);
        const mEl = minRef.current?.querySelector(`[data-minute="${minute}"]`);
        hEl?.scrollIntoView({ block: "center" });
        mEl?.scrollIntoView({ block: "center" });
      }, 50);
    }
  }, [open]);

  function selectTime(h: number, m: number) {
    setHour(h);
    setMinute(m);
    onChange(`${pad(h)}:${pad(m)}`);
  }

  function applyAndClose() {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-all
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800" : "cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 bg-white dark:bg-gray-900"}
          ${open ? "border-brand-500 ring-2 ring-brand-500/20" : "border-gray-300 dark:border-gray-700"}
          text-gray-800 dark:text-white`}
      >
        <span className={`flex items-center gap-2 ${!value ? "text-gray-400 dark:text-gray-500" : ""}`}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {value ? `${pad(hour)}:${pad(minute)}` : placeholder}
        </span>
        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-[9999] mt-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-56 overflow-hidden">
          {/* Header */}
          <div className="bg-brand-500 px-4 py-3 text-white text-center">
            <div className="text-2xl font-black tracking-widest">
              {pad(hour)}:{pad(minute)}
            </div>
            <div className="text-[10px] font-bold opacity-70 mt-0.5">Format 24 Jam</div>
          </div>

          {/* Scroll pickers */}
          <div className="flex divide-x divide-gray-100 dark:divide-gray-800">
            {/* Hours */}
            <div className="flex-1">
              <div className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1.5 border-b border-gray-100 dark:border-gray-800">Jam</div>
              <div
                ref={hourRef}
                className="h-44 overflow-y-auto scrollbar-thin"
                style={{ scrollbarWidth: "none" }}
              >
                {HOURS.map(h => (
                  <button
                    key={h}
                    type="button"
                    data-hour={h}
                    onClick={() => { setHour(h); onChange(`${pad(h)}:${pad(minute)}`); }}
                    className={`w-full py-2 text-sm font-bold transition-colors
                      ${h === hour
                        ? "bg-brand-500 text-white"
                        : "hover:bg-brand-50 dark:hover:bg-brand-900/30 text-gray-700 dark:text-gray-300"}`}
                  >
                    {pad(h)}
                  </button>
                ))}
              </div>
            </div>

            {/* Minutes */}
            <div className="flex-1">
              <div className="text-center text-[10px] font-black text-gray-400 uppercase tracking-wider py-1.5 border-b border-gray-100 dark:border-gray-800">Menit</div>
              <div
                ref={minRef}
                className="h-44 overflow-y-auto"
                style={{ scrollbarWidth: "none" }}
              >
                {MINUTE_STEPS.map(m => (
                  <button
                    key={m}
                    type="button"
                    data-minute={m}
                    onClick={() => { setMinute(m); onChange(`${pad(hour)}:${pad(m)}`); }}
                    className={`w-full py-2 text-sm font-bold transition-colors
                      ${m === minute
                        ? "bg-brand-500 text-white"
                        : "hover:bg-brand-50 dark:hover:bg-brand-900/30 text-gray-700 dark:text-gray-300"}`}
                  >
                    {pad(m)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick times */}
          <div className="p-2.5 border-t border-gray-100 dark:border-gray-800">
            <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1.5">Waktu Cepat</div>
            <div className="grid grid-cols-4 gap-1">
              {[["08:00", "08"], ["09:00", "09"], ["12:00", "12"], ["13:00", "13"], ["15:00", "15"], ["17:00", "17"], ["19:00", "19"], ["21:00", "21"]].map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    const [hh, mm] = val.split(":").map(Number);
                    setHour(hh);
                    setMinute(mm);
                    onChange(val);
                    setOpen(false);
                  }}
                  className={`py-1 text-[10px] font-black rounded-lg transition-colors
                    ${value === val
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/30 hover:text-brand-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-2.5 pb-2.5">
            <button
              type="button"
              onClick={applyAndClose}
              className="w-full py-2 text-xs font-black uppercase tracking-wide rounded-lg bg-brand-500 text-white hover:bg-brand-600 transition-colors"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
