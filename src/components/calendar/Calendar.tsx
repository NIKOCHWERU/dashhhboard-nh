"use client";
import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import { useModal } from "@/hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { useSession } from "next-auth/react";
import { CalenderIcon } from "@/icons";


interface AgendaEvent extends EventInput {
  extendedProps: {
    pic: string;
    scale: string;
    description: string;
    notes: string;
    type: "google" | "local" | "Tim WFO";
    status?: string;
    kategori?: string;
    lokasi?: string;
    fileLink?: string;
  };
}

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MONTHS_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

const YEARS = Array.from({ length: 21 }, (_, i) => 2020 + i);

const YearView: React.FC<{
  year: number;
  events: AgendaEvent[];
  onMonthClick: (monthIndex: number) => void;
  getEventDateString: (start: any) => string;
}> = ({ year, events, onMonthClick, getEventDateString }) => {
  const daysOfWeek = ["M", "S", "S", "R", "K", "J", "S"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-1">
      {MONTHS.map((monthName, monthIdx) => {
        const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
        const firstDayIndex = new Date(year, monthIdx, 1).getDay();
        
        const monthEventsCount = events.filter(ev => {
          const dateStr = getEventDateString(ev.start);
          if (!dateStr) return false;
          const evDate = new Date(dateStr);
          return evDate.getFullYear() === year && evDate.getMonth() === monthIdx;
        }).length;

        return (
          <div
            key={monthIdx}
            onClick={() => onMonthClick(monthIdx)}
            className="border border-gray-200 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.01] hover:border-brand-500/50 dark:hover:border-brand-500/30 rounded-2xl p-4 transition-all duration-200 cursor-pointer hover:shadow-lg group flex flex-col"
          >
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100 dark:border-gray-800/50">
              <span className="text-xs font-black text-black dark:text-white uppercase tracking-wider group-hover:text-brand-500 transition-colors">
                {MONTHS_SHORT[monthIdx]}
              </span>
              {monthEventsCount > 0 && (
                <span className="px-2 py-0.5 bg-brand-500 text-white text-[9px] font-black uppercase rounded">
                  {monthEventsCount} Agenda
                </span>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold">
              {daysOfWeek.map((dayLabel, idx) => (
                <span key={idx} className="text-gray-400 dark:text-gray-600 mb-1">
                  {dayLabel}
                </span>
              ))}

              {Array.from({ length: firstDayIndex }).map((_, idx) => (
                <span key={`blank-${idx}`}></span>
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                
                const dayEvents = events.filter(ev => {
                  const evDateStr = getEventDateString(ev.start);
                  return evDateStr === dateStr;
                });
                
                const hasEvents = dayEvents.length > 0;
                const isToday = new Date().toDateString() === new Date(year, monthIdx, day).toDateString();

                let indicatorColor = "bg-brand-500";
                if (hasEvents) {
                  const containsQ1 = dayEvents.some(ev => ev.extendedProps?.scale === "Q1" && ev.extendedProps?.status !== "Selesai");
                  const containsQ2 = dayEvents.some(ev => ev.extendedProps?.scale === "Q2" && ev.extendedProps?.status !== "Selesai");
                  const containsQ3 = dayEvents.some(ev => ev.extendedProps?.scale === "Q3" && ev.extendedProps?.status !== "Selesai");
                  const allSelesai = dayEvents.every(ev => ev.extendedProps?.status === "Selesai");

                  if (containsQ1) {
                    indicatorColor = "bg-red-500";         // Q1: Penting & Mendesak
                  } else if (containsQ2) {
                    indicatorColor = "bg-[#B88A16]";       // Q2: Penting, Tidak Mendesak
                  } else if (containsQ3) {
                    indicatorColor = "bg-green-500";       // Q3: Rendah
                  } else if (allSelesai) {
                    indicatorColor = "bg-green-500";
                  }
                }

                return (
                  <div
                    key={`day-${day}`}
                    className={`relative flex flex-col items-center justify-center h-6 w-full rounded transition-all ${
                      isToday
                        ? "bg-brand-500 text-white font-black"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{day}</span>
                    {hasEvents && !isToday && (
                      <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${indicatorColor}`}></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Calendar: React.FC = () => {
  const { data: session } = useSession();
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();


  // Form States
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [pic, setPic] = useState("");
  const [scale, setScale] = useState("Q1");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [kategori, setKategori] = useState("Retainer");
  const [kategoriLainnya, setKategoriLainnya] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [pengingatWaktu, setPengingatWaktu] = useState("09:00");
  const [pengingatHari, setPengingatHari] = useState("0");
  const [pengingatPengulangan, setPengingatPengulangan] = useState("none");
  const [selectedPeserta, setSelectedPeserta] = useState<string[]>([]);
  const [fileLink, setFileLink] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pesertaSearchQuery, setPesertaSearchQuery] = useState("");
  const [isPesertaDropdownOpen, setIsPesertaDropdownOpen] = useState(false);
  const pesertaDropdownRef = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState("Aktif");
  const [searchAgendaQuery, setSearchAgendaQuery] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [activeView, setActiveView] = useState("dayGridMonth");
  const [viewTitle, setViewTitle] = useState("");
  const [hoveredEvent, setHoveredEvent] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pesertaDropdownRef.current && !pesertaDropdownRef.current.contains(event.target as Node)) {
        setIsPesertaDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isGoogleEvent, setIsGoogleEvent] = useState(false);
  const [karyawanList, setKaryawanList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const lastClickRef = useRef<{ dateStr: string; time: number } | null>(null);

  const getEventDateString = (start: any) => {
    if (!start) return "";
    if (typeof start === "string") {
      return start.split("T")[0];
    }
    if (start instanceof Date) {
      return start.toISOString().split("T")[0];
    }
    if (typeof start.toISOString === "function") {
      return start.toISOString().split("T")[0];
    }
    return "";
  };

  const formatDateIndo = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleEventClickFromList = (ev: any) => {
    const fakeEvent = {
      id: ev.id,
      title: ev.title,
      start: ev.start ? new Date(ev.start) : null,
      end: ev.end ? new Date(ev.end) : null,
      extendedProps: ev.extendedProps
    };
    handleEventClick({ event: fakeEvent } as any);
  };

  const filteredEvents = events.filter((ev) => {
    if (!selectedDate) return true;
    const dateStr = getEventDateString(ev.start);
    return dateStr === selectedDate;
  });

  const getGroupedEvents = () => {
    const localNow = new Date();
    const yyyy = localNow.getFullYear();
    const mm = String(localNow.getMonth() + 1).padStart(2, "0");
    const dd = String(localNow.getDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const tomorrowObj = new Date(localNow);
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrowYyyy = tomorrowObj.getFullYear();
    const tomorrowMm = String(tomorrowObj.getDate() + 1).padStart(2, "0"); // wait, tomorrowObj is already mutated, let's just format it
    const tomorrowMmStr = String(tomorrowObj.getMonth() + 1).padStart(2, "0");
    const tomorrowDdStr = String(tomorrowObj.getDate()).padStart(2, "0");
    const tomorrowStr = `${tomorrowYyyy}-${tomorrowMmStr}-${tomorrowDdStr}`;

    const sevenDaysLaterObj = new Date(localNow);
    sevenDaysLaterObj.setDate(sevenDaysLaterObj.getDate() + 7);
    
    const todayEvents: AgendaEvent[] = [];
    const tomorrowEvents: AgendaEvent[] = [];
    const thisWeekEvents: AgendaEvent[] = [];

    events.forEach((ev) => {
      const dateStr = getEventDateString(ev.start);
      if (!dateStr) return;

      if (dateStr === todayStr) {
        todayEvents.push(ev);
      } else if (dateStr === tomorrowStr) {
        tomorrowEvents.push(ev);
      } else {
        const parts = dateStr.split("-");
        const evDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        
        const startOfToday = new Date(yyyy, localNow.getMonth(), parseInt(dd));
        const diffTime = evDate.getTime() - startOfToday.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1 && diffDays <= 7) {
          thisWeekEvents.push(ev);
        }
      }
    });

    const sortByTime = (a: AgendaEvent, b: AgendaEvent) => {
      const timeA = a.start ? new Date(a.start as any).getTime() : 0;
      const timeB = b.start ? new Date(b.start as any).getTime() : 0;
      return timeA - timeB;
    };

    return {
      today: todayEvents.sort(sortByTime),
      tomorrow: tomorrowEvents.sort(sortByTime),
      thisWeek: thisWeekEvents.sort(sortByTime),
    };
  };

  const renderAgendaItem = (ev: AgendaEvent) => {
    const isGoogle = ev.extendedProps?.type === "Tim WFO";
    const startStr = ev.start ? new Date(ev.start as any).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    const endStr = ev.end ? new Date(ev.end as any).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    const timeRange = endStr ? `${startStr} - ${endStr}` : startStr;
    
    const scale = ev.extendedProps?.scale || "Q2";
    const statusVal = ev.extendedProps?.status || "Aktif";
    const isSelesai = statusVal === "Selesai";

    let priorityText = "Rendah";
    let priorityColorClass = "bg-green-500/10 text-green-600 border border-green-200/30 dark:border-green-800/30";
    
    if (isSelesai) {
      priorityText = "Selesai";
      priorityColorClass = "bg-green-500/10 text-green-600 border border-green-200/30 dark:border-green-800/30";
    } else if (scale === "Q1") {
      priorityText = "Mendesak";
      priorityColorClass = "bg-red-500/10 text-red-600 border border-red-200/30 dark:border-red-800/30";
    } else if (scale === "Q2") {
      priorityText = "Penting";
      priorityColorClass = "bg-[#B88A16]/10 text-[#B88A16] border border-[#B88A16]/20 dark:border-[#B88A16]/30";
    } else if (scale === "Q3") {
      priorityText = "Rendah";
      priorityColorClass = "bg-green-500/10 text-green-600 border border-green-200/30 dark:border-green-800/30";
    }

    if (isGoogle) {
      priorityText = "WFO";
      priorityColorClass = "bg-blue-500/10 text-blue-600 border border-blue-200/30 dark:border-blue-800/30";
    }

    return (
      <div
        key={ev.id}
        className="p-3 border border-gray-150 dark:border-gray-800 bg-white dark:bg-white/[0.01] hover:border-brand-500/50 dark:hover:border-brand-500/30 rounded-xl flex flex-col gap-1.5 transition-all duration-200 group relative cursor-pointer shadow-sm hover:shadow"
        onClick={() => handleEventClickFromList(ev)}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Jam / Time Range */}
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeRange || "All Day"}
          </span>

          {/* Status Indicator */}
          <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColorClass}`}>
            {priorityText}
          </span>
        </div>

        {/* Judul */}
        <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-snug group-hover:text-brand-500 transition-colors truncate">
          {ev.title}
        </h4>

        {/* PIC & Action Row */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800/50 text-[10px]">
          <span className="text-gray-400 truncate max-w-[150px] font-medium" title={ev.extendedProps?.pic}>
            PIC: <span className="font-bold text-gray-600 dark:text-gray-300">{ev.extendedProps?.pic || "WFO"}</span>
          </span>

          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEventClickFromList(ev);
              }}
              className="text-[9px] font-black uppercase text-brand-500 hover:text-brand-600 transition"
            >
              Detail
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDayCellContent = (arg: any) => {
    const year = arg.date.getFullYear();
    const month = String(arg.date.getMonth() + 1).padStart(2, "0");
    const day = String(arg.date.getDate()).padStart(2, "0");
    const localDateStr = `${year}-${month}-${day}`;

    const count = events.filter((ev) => getEventDateString(ev.start) === localDateStr).length;

    return (
      <div className="relative flex items-center justify-center" style={{ minWidth: "22px", minHeight: "22px" }}>
        <span>{arg.dayNumberText}</span>
        {count > 0 && (
          <span className="fc-agenda-blob">
            {count}
          </span>
        )}
      </div>
    );
  };

  const handleDateClick = (info: any) => {
    const now = Date.now();
    const lastClick = lastClickRef.current;

    setSelectedDate(info.dateStr);

    if (canManage && lastClick && lastClick.dateStr === info.dateStr && now - lastClick.time < 300) {
      lastClickRef.current = null;
      resetForm();
      setStartDate(info.dateStr);
      setEndDate(info.dateStr);
      openModal();
    } else {
      lastClickRef.current = { dateStr: info.dateStr, time: now };
    }
  };

  const fetchAllEvents = async () => {
    setLoading(true);
    try {
      // Fetch Local Agendas
      const localRes = await fetch("/api/agenda");
      const localData = await localRes.json();
      
      // Fetch Google Events
      const googleRes = await fetch("/api/calendar/events");
      const googleData = await googleRes.json();

      // Fetch Karyawan & Admins
      const [karyawanRes, adminRes] = await Promise.all([
        fetch("/api/karyawan"),
        fetch("/api/users/admins")
      ]);
      
      const karyawanData = await karyawanRes.json();
      const adminData = await adminRes.json();

      // Combine and format for PIC selection
      const combinedStaff = [
        ...karyawanData.map((k: any) => ({ id: k.id, name: k.name, position: k.position })),
        ...adminData.map((a: any) => ({ id: a.id, name: a.name || "Admin", position: "Admin" }))
      ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i); // Unique by name

      setKaryawanList(combinedStaff);

      const localGoogleIds = new Set(localData.map((a: any) => a.googleEventId).filter(Boolean));

      const formattedLocal = localData.map((a: any) => {
        let isSelesai = false;
        let parsedNotes = {} as any;
        if (a.notes && a.notes.startsWith("{") && a.notes.endsWith("}")) {
          try {
            parsedNotes = JSON.parse(a.notes);
            if (parsedNotes.status === "Selesai") {
              isSelesai = true;
            }
          } catch (e) {}
        }
        
        let color = "#10B981"; // default Green
        if (isSelesai) {
          color = "#10B981"; // Green (Selesai)
        } else if (a.scale === "Q1") {
          color = "#EF4444"; // Red (Penting & Mendesak)
        } else if (a.scale === "Q2") {
          color = "#B88A16"; // Amber/Gold (Penting, Tidak Mendesak)
        } else if (a.scale === "Q3") {
          color = "#10B981"; // Green (Rendah)
        }

        return {
          id: a.id,
          title: a.title,
          start: a.startDate,
          end: a.endDate,
          extendedProps: {
            pic: a.pic,
            scale: a.scale,
            description: a.description,
            notes: a.notes,
            type: "local",
            status: parsedNotes.status || "Aktif",
            kategori: parsedNotes.kategori || "Retainer",
            lokasi: parsedNotes.lokasi || "",
            fileLink: parsedNotes.fileLink || "",
          },
          backgroundColor: color,
          borderColor: "transparent",
        };
      });

      const formattedGoogle = (Array.isArray(googleData) ? googleData : [])
        .filter((g: any) => !localGoogleIds.has(g.id)) // Hapus jika sudah ada di lokal
        .map((g: any) => ({
          ...g,
          extendedProps: { ...g.extendedProps, type: "Tim WFO" },
          backgroundColor: "#4285F4",
          borderColor: "transparent",
        }));

      setEvents([...formattedLocal, ...formattedGoogle]);

    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchAllEvents();
  }, []);

  useEffect(() => {
    if (!mounted || events.length === 0) return;
    const searchParams = new URLSearchParams(window.location.search);
    const eventId = searchParams.get("eventId");
    if (eventId) {
      const foundEvent = events.find(ev => ev.id === eventId);
      if (foundEvent) {
        const fakeClickInfo = {
          event: {
            id: foundEvent.id,
            title: foundEvent.title,
            start: foundEvent.start ? new Date(foundEvent.start as any) : null,
            end: foundEvent.end ? new Date(foundEvent.end as any) : null,
            extendedProps: foundEvent.extendedProps
          }
        };
        handleEventClick(fakeClickInfo as any);
        // Clear query parameter so it doesn't reopen
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [mounted, events]);

  if (!mounted) return <div className="h-screen animate-pulse bg-white dark:bg-gray-900 rounded-3xl"></div>;


  const userObj = session?.user as any;
  const isAdminUser = userObj?.role === "admin";
  const isRegularUser = userObj?.role?.toLowerCase() === "user";
  const canManage = !isRegularUser && (isAdminUser || userObj?.canCreateAgenda);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (!canManage) return;
    resetForm();
    setStartDate(selectInfo.startStr.split("T")[0]);
    setEndDate(selectInfo.endStr.split("T")[0]);
    openModal();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    const isGoogle = event.extendedProps.type === "Tim WFO";
    setIsGoogleEvent(isGoogle);

    setSelectedEventId(event.id);
    setTitle(event.title);
    setStartDate(event.start?.toISOString().split("T")[0] || "");
    setStartTime(event.start?.toTimeString().slice(0, 5) || "09:00");
    setEndDate(event.end?.toISOString().split("T")[0] || "");
    setEndTime(event.end?.toTimeString().slice(0, 5) || "10:00");
    
    if (isGoogle) {
      setPic("Google Sync");
      setScale("Google Sync");
      setDescription(event.extendedProps.description || "");
      setNotes(event.extendedProps.location || "");
      setKategori("Internal");
      setKategoriLainnya("");
      setLokasi(event.extendedProps.location || "");
      setReminderEnabled(false);
      setPengingatWaktu("09:00");
      setPengingatHari("0");
      setPengingatPengulangan("none");
      setSelectedPeserta([]);
      setFileLink("");
    } else {
      setPic(event.extendedProps.pic || "");
      setScale(event.extendedProps.scale || "Q1");
      setDescription(event.extendedProps.description || "");
      
      const rawNotes = event.extendedProps.notes || "";
      let parsedNotes = {
        kategori: "Retainer",
        kategoriLainnya: "",
        lokasi: "",
        reminderEnabled: false,
        pengingatWaktu: "09:00",
        pengingatHari: "0",
        pengingatPengulangan: "none",
        fileLink: "",
        realNotes: rawNotes
      };
      
      if (rawNotes.startsWith("{") && rawNotes.endsWith("}")) {
        try {
          const parsed = JSON.parse(rawNotes);
          parsedNotes = { ...parsedNotes, ...parsed };
        } catch (e) {
          console.error("Failed to parse notes JSON:", e);
        }
      }
      
      setKategori(parsedNotes.kategori);
      setKategoriLainnya(parsedNotes.kategoriLainnya);
      setLokasi(parsedNotes.lokasi);
      setReminderEnabled(parsedNotes.reminderEnabled);
      setPengingatWaktu(parsedNotes.pengingatWaktu);
      setPengingatHari(parsedNotes.pengingatHari);
      setPengingatPengulangan(parsedNotes.pengingatPengulangan);
      setFileLink(parsedNotes.fileLink);
      setNotes(parsedNotes.realNotes);
      setStatus((parsedNotes as any).status || event.extendedProps.status || "Aktif");
      
      const picStr = event.extendedProps.pic || "";
      setSelectedPeserta(picStr ? picStr.split(", ").filter(Boolean) : []);
    }
    openModal();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setFileLink(window.location.origin + data.url);
      } else {
        alert("Gagal mengunggah berkas");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Terjadi kesalahan saat mengunggah berkas");
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (picValue: string) => {
    if (!canManage) return;

    const notesJson = JSON.stringify({
      kategori,
      kategoriLainnya,
      lokasi,
      reminderEnabled,
      pengingatWaktu,
      pengingatHari,
      pengingatPengulangan,
      fileLink,
      realNotes: notes,
      status,
    });

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${endDate || startDate}T${endTime}:00`;

    try {
      const url = selectedEventId ? `/api/agenda?id=${selectedEventId}` : "/api/agenda";
      const method = selectedEventId ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startDate: startDateTime,
          endDate: endDateTime,
          pic: picValue,
          scale,
          description,
          notes: notesJson,
        }),
      });

      if (response.ok) {
        closeModal();
        fetchAllEvents();
        resetForm();
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const validateAndSubmit = () => {
    if (!canManage) return;
    const picValue = selectedPeserta.join(", ");
    if (!title || !startDate || !startTime || !picValue) {
      alert("Harap isi Judul, Tanggal, Jam, dan Peserta.");
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    let end = new Date(`${endDate || startDate}T${endTime}`);

    if (end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
      setEndTime(end.toTimeString().slice(0, 5));
    }

    handleSubmit(picValue);
  };

  const handleDelete = async () => {
    if (!canManage) return;
    if (!selectedEventId) return;
    if (!confirm("Apakah Anda yakin ingin menghapus agenda ini? Agenda di Google Calendar juga akan dihapus.")) return;

    try {
      const url = isGoogleEvent ? `/api/calendar/events?id=${selectedEventId}` : `/api/agenda?id=${selectedEventId}`;
      const response = await fetch(url, {
        method: "DELETE",
      });

      if (response.ok) {
        closeModal();
        fetchAllEvents();
        resetForm();
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const resetForm = () => {
    setTitle("");
    setStartDate("");
    setStartTime("09:00");
    setEndDate("");
    setEndTime("10:00");
    setPic("");
    setScale("Q1");
    setDescription("");
    setNotes("");
    setKategori("Retainer");
    setKategoriLainnya("");
    setLokasi("");
    setReminderEnabled(false);
    setPengingatWaktu("09:00");
    setPengingatHari("0");
    setPengingatPengulangan("none");
    setSelectedPeserta([]);
    setFileLink("");
    setUploadingFile(false);
    setPesertaSearchQuery("");
    setIsPesertaDropdownOpen(false);
    setSelectedEventId(null);
    setIsGoogleEvent(false);
    setStatus("Aktif");
  };

  const handlePrev = () => {
    if (activeView === "year") {
      const newYear = currentYear - 1;
      setCurrentYear(newYear);
      setViewTitle(`${newYear}`);
    } else {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.prev();
        const date = api.getDate();
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    }
  };

  const handleNext = () => {
    if (activeView === "year") {
      const newYear = currentYear + 1;
      setCurrentYear(newYear);
      setViewTitle(`${newYear}`);
    } else {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.next();
        const date = api.getDate();
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    }
  };

  const handleToday = () => {
    const todayDate = new Date();
    if (activeView === "year") {
      setCurrentYear(todayDate.getFullYear());
      setViewTitle(`${todayDate.getFullYear()}`);
    } else {
      const api = calendarRef.current?.getApi();
      if (api) {
        api.today();
        const date = api.getDate();
        setCurrentMonth(date.getMonth());
        setCurrentYear(date.getFullYear());
      }
    }
  };

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentMonth(monthIndex);
    if (activeView === "year") {
      setActiveView("dayGridMonth");
      setTimeout(() => {
        const api = calendarRef.current?.getApi();
        if (api) {
          const targetDate = new Date(currentYear, monthIndex, 1);
          api.gotoDate(targetDate);
          api.changeView("dayGridMonth");
        }
      }, 50);
    } else {
      const api = calendarRef.current?.getApi();
      if (api) {
        const targetDate = new Date(currentYear, monthIndex, 1);
        api.gotoDate(targetDate);
      }
    }
  };

  const handleYearSelect = (year: number) => {
    setCurrentYear(year);
    if (activeView === "year") {
      setViewTitle(`${year}`);
    } else {
      const api = calendarRef.current?.getApi();
      if (api) {
        const targetDate = new Date(year, currentMonth, 1);
        api.gotoDate(targetDate);
      }
    }
  };

  const handleViewChange = (viewKey: string) => {
    setActiveView(viewKey);
    if (viewKey === "year") {
      setViewTitle(`${currentYear}`);
    } else {
      setTimeout(() => {
        const api = calendarRef.current?.getApi();
        if (api) {
          const targetDate = new Date(currentYear, currentMonth, 1);
          api.gotoDate(targetDate);
          api.changeView(viewKey);
          setViewTitle(api.view.title);
        }
      }, 50);
    }
  };

  const handleDatesSet = (arg: any) => {
    const api = arg.view.calendar;
    const date = api.getDate();
    setCurrentMonth(date.getMonth());
    setCurrentYear(date.getFullYear());
    setViewTitle(arg.view.title);
  };

  // Statistics Calculations
  const getStats = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    // Start and end of this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let deadlineCount = 0;
    
    events.forEach(ev => {
      const dateStr = getEventDateString(ev.start);
      if (!dateStr) return;
      
      const evDate = new Date(dateStr);
      
      // Today
      if (dateStr === todayStr) {
        todayCount++;
      }
      
      // This week
      if (evDate >= startOfWeek && evDate <= endOfWeek) {
        weekCount++;
      }
      
      // This month
      if (evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === now.getMonth()) {
        monthCount++;
      }
      
      // Mendesak Dekat: Q1 dalam 7 hari ke depan, belum Selesai
      const diffTime = evDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isUpcoming = diffDays >= 0 && diffDays <= 7;
      const isPriority = ev.extendedProps?.scale === "Q1";
      const isCompleted = ev.extendedProps?.status === "Selesai";
      if (isUpcoming && isPriority && !isCompleted) {
        deadlineCount++;
      }
    });
    
    return { todayCount, weekCount, monthCount, deadlineCount };
  };

  const { todayCount, weekCount, monthCount, deadlineCount } = getStats();

  const filterBySearch = (list: AgendaEvent[]) => {
    if (!searchAgendaQuery) return list;
    const q = searchAgendaQuery.toLowerCase();
    return list.filter(ev =>
      (ev.title ?? "").toLowerCase().includes(q) ||
      (ev.extendedProps?.pic && ev.extendedProps.pic.toLowerCase().includes(q)) ||
      (ev.extendedProps?.description && ev.extendedProps.description.toLowerCase().includes(q))
    );
  };

  const getHoveredEventTimeRange = (event: any) => {
    if (!event) return "";
    const start = event.start;
    const end = event.end;
    if (!start) return "All Day";
    const startStr = new Date(start).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const endStr = end ? new Date(end).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    return endStr ? `${startStr} - ${endStr}` : startStr;
  };

  const renderAgendaPanelContent = () => {
    return (
      <>
        {/* Header Panel */}
        <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
          <div className="flex flex-col space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                {selectedDate ? "Agenda Terpilih" : "Agenda"}
              </h3>
              {canManage && (
                <button
                  onClick={() => {
                    setIsMobilePanelOpen(false);
                    resetForm();
                    setStartDate(selectedDate || new Date().toISOString().split("T")[0]);
                    setEndDate(selectedDate || new Date().toISOString().split("T")[0]);
                    openModal();
                  }}
                  className="px-2.5 py-1.5 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold text-[9px] uppercase tracking-widest cursor-pointer shadow active:scale-95 transition-transform rounded-lg flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Agenda
                </button>
              )}
            </div>
            {selectedDate ? (
              <div className="flex justify-between items-center bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 px-2.5 py-1.5 rounded-lg">
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide truncate">
                  Tanggal: {formatDateIndo(selectedDate)}
                </span>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-gray-400 hover:text-red-500 font-bold text-sm leading-none ml-2 cursor-pointer transition-colors"
                  title="Reset Filter"
                >
                  ×
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Search Box */}
        <div className="relative mt-3">
          <input
            type="text"
            placeholder="Cari agenda..."
            value={searchAgendaQuery}
            onChange={(e) => setSearchAgendaQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-white/[0.02] text-gray-700 dark:text-white outline-none focus:border-brand-500 transition-colors text-xs font-semibold"
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Ringkasan */}
        <div className="mt-3 p-3 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-gray-800 rounded-xl grid grid-cols-2 gap-2 text-center">
          <div>
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Hari Ini</span>
            <span className="text-xs font-black text-black dark:text-white">{todayCount} Agenda</span>
          </div>
          <div className="border-l border-gray-100 dark:border-gray-800">
            <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">Minggu Ini</span>
            <span className="text-xs font-black text-black dark:text-white">{weekCount} Agenda</span>
          </div>
        </div>

        {/* Agenda Scroll Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
          {selectedDate ? (
            filterBySearch(filteredEvents).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
                <p className="text-[10px] font-semibold text-gray-400">Tidak ada hasil cocok.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filterBySearch(filteredEvents).map(renderAgendaItem)}
              </div>
            )
          ) : (() => {
            const grouped = getGroupedEvents();
            const filteredToday = filterBySearch(grouped.today);
            const filteredTomorrow = filterBySearch(grouped.tomorrow);
            const filteredThisWeek = filterBySearch(grouped.thisWeek);

            if (filteredToday.length === 0 && filteredTomorrow.length === 0 && filteredThisWeek.length === 0) {
              return (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-8">
                  <svg className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <p className="text-[10px] font-semibold text-gray-400">Tidak ada hasil cocok.</p>
                </div>
              );
            }

            return (
              <div className="space-y-5">
                {/* Group 1: Hari Ini */}
                {filteredToday.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Hari Ini
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-red-500/10 text-red-500 rounded-full">
                        {filteredToday.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredToday.map(renderAgendaItem)}
                    </div>
                  </div>
                )}

                {/* Group 2: Besok */}
                {filteredTomorrow.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Besok
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-500/10 text-amber-500 rounded-full">
                        {filteredTomorrow.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredTomorrow.map(renderAgendaItem)}
                    </div>
                  </div>
                )}

                {/* Group 3: Minggu Ini */}
                {filteredThisWeek.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-brand-500 uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                        Minggu Ini
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-brand-500/10 text-brand-500 rounded-full">
                        {filteredThisWeek.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {filteredThisWeek.map(renderAgendaItem)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Agenda Hari Ini */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Hari Ini</span>
            <h4 className="text-xl font-black text-black dark:text-white leading-none mt-1">{todayCount}</h4>
          </div>
        </div>

        {/* Card 2: Agenda Minggu Ini */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Minggu Ini</span>
            <h4 className="text-lg font-black text-black dark:text-white leading-none mt-1">{weekCount}</h4>
          </div>
        </div>

        {/* Card 3: Agenda Bulan Ini */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Bulan Ini</span>
            <h4 className="text-lg font-black text-black dark:text-white leading-none mt-1">{monthCount}</h4>
          </div>
        </div>

        {/* Card 4: Deadline Dekat */}
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Deadline Dekat</span>
            <h4 className="text-lg font-black text-black dark:text-white leading-none mt-1">{deadlineCount}</h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Side: Calendar Area (75% / xl:col-span-9) */}
        <div className="xl:col-span-9 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-6 flex flex-col">
          
          {/* Custom Header Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            {/* Navigation and Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Prev / Next buttons */}
              <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-gray-50/50 dark:bg-white/[0.02]">
                <button
                  onClick={handlePrev}
                  className="p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition border-l border-gray-200 dark:border-gray-800 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              {/* TODAY button */}
              <button
                onClick={handleToday}
                className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition uppercase tracking-widest cursor-pointer"
              >
                TODAY
              </button>

              {/* June Dropdown */}
              <select
                value={currentMonth}
                onChange={(e) => handleMonthSelect(parseInt(e.target.value))}
                className="px-2.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-black text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 outline-none focus:border-brand-500 transition cursor-pointer uppercase tracking-wider"
              >
                {MONTHS.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              {/* 2026 Dropdown */}
              <select
                value={currentYear}
                onChange={(e) => handleYearSelect(parseInt(e.target.value))}
                className="px-2.5 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-[11px] font-black text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 outline-none focus:border-brand-500 transition cursor-pointer"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Title (June 2026 / 2026) */}
            <div className="flex items-center">
              <h2 className="text-sm md:text-base font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                {viewTitle || `${MONTHS[currentMonth]} ${currentYear}`}
              </h2>
            </div>

            {/* View selectors */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {[
                { key: "year", label: "YEAR" },
                { key: "dayGridMonth", label: "MONTH" },
                { key: "timeGridWeek", label: "WEEK" },
                { key: "timeGridDay", label: "DAY" }
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => handleViewChange(v.key)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-widest transition cursor-pointer ${
                    activeView === v.key
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {activeView === "year" ? (
            <YearView
              year={currentYear}
              events={events}
              onMonthClick={handleMonthSelect}
              getEventDateString={getEventDateString}
            />
          ) : (
            <div className="custom-calendar">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                events={events}
                selectable={false}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                dayCellContent={renderDayCellContent}
                datesSet={handleDatesSet}
                height="auto"
              />
            </div>
          )}
        </div>

        {/* Right Side: Agenda List Panel (25% / xl:col-span-3) */}
        <div className="xl:col-span-3 flex flex-col space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-5 flex flex-col h-[650px] overflow-hidden">
            {renderAgendaPanelContent()}
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="bg-white dark:bg-boxdark rounded-none overflow-hidden shadow-2xl border border-stroke dark:border-strokedark max-w-3xl w-full mx-auto animate-in zoom-in duration-300">
          {/* Header Modern */}
          <div className="px-8 py-6 bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-none bg-brand-500/10 flex items-center justify-center text-brand-500">
                <CalenderIcon />
              </div>
              <div>
                <h3 className="text-xl font-bold text-black dark:text-white">
                  {selectedEventId ? (canManage ? "Detail & Edit Agenda" : "Detail Agenda") : "Buat Agenda Baru"}
                </h3>
                <p className="text-xs text-gray-500 font-medium">
                  {canManage ? "Lengkapi rincian jadwal kegiatan Anda" : "Rincian jadwal kegiatan resmi NH"}
                </p>
              </div>
            </div>
            <button
              onClick={closeModal}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Judul</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Meeting PT. A"
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Kategori</label>
                <select
                  disabled={!canManage}
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3.5 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-semibold text-sm"
                >
                  <option value="Retainer">Retainer</option>
                  <option value="Non Retainer">Non Retainer</option>
                  <option value="Internal">Internal</option>
                  <option value="Lainnya">Lainnya (Input Manual)</option>
                </select>
                {kategori === "Lainnya" && (
                  <input
                    type="text"
                    disabled={!canManage}
                    value={kategoriLainnya}
                    onChange={(e) => setKategoriLainnya(e.target.value)}
                    placeholder="Masukkan Kategori Lainnya..."
                    className="w-full mt-3 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                  />
                )}
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Lokasi</label>
                <input
                  type="text"
                  list="locations"
                  disabled={!canManage}
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  placeholder="Pilih atau ketik lokasi..."
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                />
                <datalist id="locations">
                  <option value="Kantor Pusat Narasumber Hukum" />
                  <option value="Pengadilan Negeri Jakarta Pusat" />
                  <option value="Ruang Rapat Utama" />
                  <option value="Ruang Rapat Direksi" />
                  <option value="Online via Zoom" />
                </datalist>
              </div>

              {/* Start Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-black dark:text-white">Waktu Mulai</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    disabled={!canManage}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                  />
                  <input
                    type="time"
                    disabled={!canManage}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-black dark:text-white">Waktu Selesai</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    disabled={!canManage}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                  />
                  <input
                    type="time"
                    disabled={!canManage}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-semibold text-sm"
                  />
                </div>
              </div>

              {/* Tambah Pengingat */}
              <div className="md:col-span-2 border border-gray-100 dark:border-gray-800 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-black dark:text-white">Tambah Pengingat</label>
                  <input
                    type="checkbox"
                    disabled={!canManage}
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
                {reminderEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-1 duration-200">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Waktu Pengingat</label>
                      <input
                        type="time"
                        disabled={!canManage}
                        value={pengingatWaktu}
                        onChange={(e) => setPengingatWaktu(e.target.value)}
                        className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-3 py-2 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white font-semibold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Hari Pengingat</label>
                      <select
                        disabled={!canManage}
                        value={pengingatHari}
                        onChange={(e) => setPengingatHari(e.target.value)}
                        className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-3 py-2.5 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white font-semibold text-sm"
                      >
                        <option value="0">Hari H</option>
                        <option value="1">1 Hari Sebelumnya</option>
                        <option value="2">2 Hari Sebelumnya</option>
                        <option value="3">3 Hari Sebelumnya</option>
                        <option value="7">1 Minggu Sebelumnya</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-2">Pengulangan</label>
                      <select
                        disabled={!canManage}
                        value={pengingatPengulangan}
                        onChange={(e) => setPengingatPengulangan(e.target.value)}
                        className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-3 py-2.5 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white font-semibold text-sm"
                      >
                        <option value="none">Tidak Ada Pengulangan</option>
                        <option value="tanggal7">Per Tanggal 7</option>
                        <option value="weekly">1 Minggu Sekali</option>
                        <option value="monthly">1 Bulan Sekali</option>
                        <option value="yearly">1 Tahun Sekali</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Peserta (Multi-select) */}
              <div ref={pesertaDropdownRef} className="md:col-span-2 relative">
                <label className="block text-sm font-bold text-black dark:text-white mb-2">Peserta</label>
                <button
                  type="button"
                  disabled={!canManage}
                  onClick={() => setIsPesertaDropdownOpen(!isPesertaDropdownOpen)}
                  className="w-full text-left flex justify-between items-center rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white"
                >
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    {selectedPeserta.length > 0
                      ? `${selectedPeserta.length} Peserta Terpilih`
                      : "Pilih Peserta..."}
                  </span>
                  <span className="text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </span>
                </button>
                
                {isPesertaDropdownOpen && (
                  <div className="absolute left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-stroke dark:border-strokedark shadow-2xl z-999 p-3 max-h-[250px] overflow-y-auto rounded-none animate-in fade-in zoom-in-95 duration-200">
                    <input
                      type="text"
                      placeholder="Cari karyawan..."
                      value={pesertaSearchQuery}
                      onChange={(e) => setPesertaSearchQuery(e.target.value)}
                      className="w-full mb-3 px-3 py-1.5 text-xs rounded border border-stroke dark:border-form-strokedark bg-transparent text-black dark:text-white outline-none focus:border-brand-500"
                    />
                    <div className="space-y-1">
                      {karyawanList
                        .filter((k) =>
                          k.name.toLowerCase().includes(pesertaSearchQuery.toLowerCase()) ||
                          (k.position && k.position.toLowerCase().includes(pesertaSearchQuery.toLowerCase()))
                        )
                        .map((k) => {
                          const isChecked = selectedPeserta.includes(k.name);
                          return (
                            <label
                              key={k.id}
                              className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer rounded transition-colors text-xs font-semibold"
                            >
                              <input
                                type="checkbox"
                                disabled={!canManage}
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setSelectedPeserta(selectedPeserta.filter((name) => name !== k.name));
                                  } else {
                                    setSelectedPeserta([...selectedPeserta, k.name]);
                                  }
                                }}
                                className="w-3.5 h-3.5 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                              />
                              <div className="flex flex-col">
                                <span className="text-black dark:text-white">{k.name}</span>
                                <span className="text-[9px] text-gray-400 font-medium uppercase">{k.position}</span>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
                {selectedPeserta.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedPeserta.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-wide rounded border border-brand-500/20"
                      >
                        {name}
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => setSelectedPeserta(selectedPeserta.filter((n) => n !== name))}
                            className="text-gray-400 hover:text-red-500 ml-1 font-bold text-xs"
                          >
                            &times;
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload File & Link File */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3">Unggah File (Opsional)</label>
                  <div className="relative">
                    <input
                      type="file"
                      disabled={!canManage || uploadingFile}
                      onChange={handleFileUpload}
                      className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-brand-500/10 file:text-brand-600 hover:file:bg-brand-500/20 cursor-pointer"
                    />
                    {uploadingFile && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-[10px] text-brand-500 font-bold">Mengunggah...</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-black dark:text-white mb-3">Link File / Tautan</label>
                  <input
                    type="text"
                    disabled={!canManage}
                    value={fileLink}
                    onChange={(e) => setFileLink(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                  />
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Skala Prioritas</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "Q1", label: "Q1 — Mendesak",   activeClass: "border-red-500 bg-red-500 text-white shadow-md" },
                    { key: "Q2", label: "Q2 — Penting",    activeClass: "border-[#B88A16] bg-[#B88A16] text-white shadow-md" },
                    { key: "Q3", label: "Q3 — Rendah",     activeClass: "border-green-500 bg-green-500 text-white shadow-md" }
                  ].map((q) => (
                    <button
                      key={q.key}
                      type="button"
                      disabled={!canManage}
                      onClick={() => setScale(q.key)}
                      className={`py-3 rounded-none border-2 transition-all font-bold text-xs ${
                        scale === q.key
                          ? q.activeClass
                          : "border-stroke bg-transparent text-gray-400 hover:border-brand-500/50 dark:border-form-strokedark"
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Status</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "Aktif", label: "Aktif", color: "border-blue-500 bg-blue-500" },
                    { key: "Selesai", label: "Selesai", color: "border-green-500 bg-green-500" },
                    { key: "Ditunda", label: "Ditunda", color: "border-amber-500 bg-amber-500" },
                    { key: "Dibatalkan", label: "Dibatalkan", color: "border-red-500 bg-red-500" }
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      disabled={!canManage}
                      onClick={() => setStatus(s.key)}
                      className={`py-2.5 rounded-none border-2 transition-all font-bold text-xs ${
                        status === s.key
                          ? `${s.color} text-white shadow-md`
                          : "border-stroke bg-transparent text-gray-400 hover:border-brand-500/50 dark:border-form-strokedark"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Keterangan</label>
                <textarea
                  rows={3}
                  disabled={!canManage}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                ></textarea>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-black dark:text-white mb-3">Catatan</label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500 font-medium text-sm"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Footer Modern */}
          <div className="px-8 py-6 bg-white dark:bg-boxdark border-t border-stroke dark:border-strokedark flex justify-between items-center">
            <div>
              {selectedEventId && canManage && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-none text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  Hapus Agenda
                </button>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 rounded-none text-sm font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
              >
                {canManage ? "Batal" : "Tutup"}
              </button>
              {!isGoogleEvent && canManage && (
                <button
                  onClick={validateAndSubmit}
                  className="px-8 py-2.5 rounded-none text-sm font-black bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-500/40 transition-all active:scale-95"
                >
                  {selectedEventId ? "Simpan Perubahan" : "Konfirmasi Agenda"}
                </button>
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* Styled Override for Custom Box Border-Radius & Gold Highlights */}
      <style>{`
        .custom-calendar {
          width: 100% !important;
          max-width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        .fc {
          border-radius: 0px !important;
          border: none !important;
        }
        .fc .fc-daygrid-day-number {
          padding: 4px 6px !important;
          font-size: 11px !important;
        }
        .fc-daygrid-day-frame {
          min-height: 45px !important;
        }
        .fc .fc-view-harness {
          border-radius: 0px !important;
          overflow: visible !important;
        }
        .fc-event {
          display: none !important;
        }
        .fc-button {
          border-radius: 0px !important;
          text-transform: uppercase !important;
          font-size: 10px !important;
          font-weight: 900 !important;
          letter-spacing: 0.05em !important;
        }
        .fc-toolbar-title {
          font-size: 16px !important;
          font-weight: 900 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        /* 🥇 GOLD THEME CALENDAR HIGHLIGHTS */
        .fc-day-today {
          background-color: rgba(166, 124, 0, 0.1) !important;
          border: 1px solid rgba(166, 124, 0, 0.2) !important;
        }
        .fc-day-today .fc-scrollgrid-sync-inner {
          background-color: transparent !important;
        }
        .fc-day-today .fc-daygrid-day-number {
          color: #A67C00 !important;
          font-weight: 900 !important;
        }

        /* 👑 BRAND BUTTONS OVERRIDE */
        .fc .fc-button-primary {
          background-color: #A67C00 !important;
          border-color: #A67C00 !important;
          color: #ffffff !important;
        }
        .fc .fc-button-primary:hover {
          background-color: #8B6508 !important;
          border-color: #8B6508 !important;
        }
        .fc .fc-button-primary:disabled {
          background-color: #d4c39c !important;
          border-color: #d4c39c !important;
          color: #ffffff !important;
        }
        .fc .fc-button-primary:not(:disabled).fc-button-active,
        .fc .fc-button-primary:not(:disabled):active {
          background-color: #8B6508 !important;
          border-color: #705206 !important;
          color: #ffffff !important;
        }

        /* 🔴 RESPONSIVE MOBILE OVERRIDES FOR FULL CALENDAR */
        @media (max-width: 767px) {
          .fc {
            width: 100% !important;
            max-width: 100% !important;
          }
          .fc .fc-toolbar {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 4px !important;
            margin-bottom: 8px !important;
          }
          .fc .fc-toolbar-title {
            font-size: 10px !important;
            font-weight: 950 !important;
            text-align: center !important;
            margin: 0 !important;
            letter-spacing: 0px !important;
          }
          .fc .fc-button {
            font-size: 8px !important;
            padding: 3px 5px !important;
          }
          .fc .fc-col-header-cell-cushion {
            font-size: 8px !important;
            padding: 2px 1px !important;
          }
          .fc .fc-daygrid-day-number {
            font-size: 8px !important;
            padding: 1px 2px !important;
          }
          .fc-daygrid-day-frame {
            min-height: 30px !important;
          }
        }

        /* 🟢 AGENDA BULLET BLOB (WA STYLE) */
        .fc-agenda-blob {
          position: absolute !important;
          top: -6px !important;
          right: -10px !important;
          width: 14px !important;
          height: 14px !important;
          font-size: 8px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 900 !important;
          border-radius: 9999px !important;
          background-color: #ffffff !important;
          color: #A67C00 !important;
          border: 1px solid rgba(166, 124, 0, 0.3) !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          z-index: 10 !important;
        }
        @media (max-width: 767px) {
          .fc-agenda-blob {
            top: -3px !important;
            right: -5px !important;
            width: 9px !important;
            height: 9px !important;
            font-size: 6px !important;
          }
        }

        ${selectedDate ? `
        .fc-daygrid-day[data-date="${selectedDate}"] {
          z-index: 100 !important;
        }
        .fc-daygrid-day[data-date="${selectedDate}"] .fc-scrollgrid-sync-inner {
          border: 2px solid #A67C00 !important;
          background-color: transparent !important;
        }
        .fc-daygrid-day[data-date="${selectedDate}"] .fc-daygrid-day-number {
          color: #A67C00 !important;
          font-weight: 900 !important;
        }
        .fc-day-today[data-date="${selectedDate}"] {
          background-color: transparent !important;
        }
        .fc-day-today[data-date="${selectedDate}"] .fc-scrollgrid-sync-inner {
          border: 2px solid #A67C00 !important;
          background-color: transparent !important;
        }
        .fc-day-today[data-date="${selectedDate}"] .fc-daygrid-day-number {
          color: #A67C00 !important;
          font-weight: 900 !important;
        }
        ` : ""}
      `}</style>
    </div>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const type = eventInfo.event.extendedProps.type;
  return (
    <div className={`flex flex-col p-1.5 rounded-lg overflow-hidden border-l-4 ${
      type === 'Tim WFO' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-brand-500 bg-brand-50 dark:bg-brand-500/10'
    }`}>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold opacity-70">{eventInfo.timeText}</span>
        {type === 'local' ? (
          <span className="px-1 bg-brand-500 text-white text-[9px] rounded font-black">{eventInfo.event.extendedProps.scale}</span>
        ) : (
          <span className="px-1 bg-blue-500 text-white text-[9px] rounded font-black uppercase tracking-tighter">Tim WFO</span>
        )}
      </div>
      <div className="text-xs font-bold truncate text-gray-800 dark:text-gray-200">{eventInfo.event.title}</div>
      <div className="text-[10px] opacity-70 truncate italic">
        {type === 'local' ? `PIC: ${eventInfo.event.extendedProps.pic}` : 'Google Calendar Sync'}
      </div>
    </div>
  );
};

export default Calendar;
