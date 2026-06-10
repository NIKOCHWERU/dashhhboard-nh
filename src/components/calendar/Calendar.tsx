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
  };
}

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

    return (
      <div
        key={ev.id}
        className="p-3.5 border border-gray-100 dark:border-gray-800/50 bg-gray-50/30 dark:bg-white/[0.02] hover:bg-gray-100/60 dark:hover:bg-white/[0.05] rounded-xl flex flex-col gap-2 transition-all group relative cursor-pointer"
        onClick={() => handleEventClickFromList(ev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                ev.extendedProps?.scale === "Q1"
                  ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/30 dark:border-red-800/30"
                  : ev.extendedProps?.scale === "Q2"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200/30 dark:border-amber-800/30"
                  : ev.extendedProps?.scale === "Q3"
                  ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200/30 dark:border-green-800/30"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/30 dark:border-blue-800/30"
              }`}
            >
              {ev.extendedProps?.scale || "Tim WFO"}
            </span>
            {timeRange && (
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeRange}
              </span>
            )}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">
            {ev.start ? new Date(ev.start as any).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
            }) : ""}
          </span>
        </div>
        
        <h4 className="text-sm font-semibold text-black dark:text-white leading-snug group-hover:text-brand-500 transition-colors truncate">
          {ev.title}
        </h4>
        
        {ev.extendedProps?.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {ev.extendedProps.description}
          </p>
        )}
        
        <div className="flex items-center justify-between pt-1 mt-1 border-t border-gray-100/50 dark:border-gray-800/30">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
            <svg className="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            PIC: {ev.extendedProps?.pic || "WFO"}
          </span>
          <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEventClickFromList(ev);
              }}
              className="text-[10px] font-bold uppercase text-brand-500 hover:text-brand-600 transition"
            >
              View
            </button>
            {canManage && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClickFromList(ev);
                  }}
                  className="text-[10px] font-bold uppercase text-blue-500 hover:text-blue-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (confirm("Apakah Anda yakin ingin menghapus agenda ini? Agenda di Google Calendar juga akan dihapus.")) {
                      try {
                        const isGoogle = (ev.extendedProps?.type as any) === "Tim WFO";
                        const url = isGoogle ? `/api/calendar/events?id=${ev.id}` : `/api/agenda?id=${ev.id}`;
                        const response = await fetch(url, { method: "DELETE" });
                        if (response.ok) {
                          fetchAllEvents();
                        }
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                  className="text-[10px] font-bold uppercase text-red-500 hover:text-red-600 transition"
                >
                  Delete
                </button>
              </>
            )}
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

      const formattedLocal = localData.map((a: any) => ({
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
        },
        backgroundColor: a.scale === "Q1" ? "#D4AF37" : a.scale === "Q2" ? "#B8860B" : "#8B6508",
        borderColor: "transparent",
      }));

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
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left Side: FullCalendar */}
      <div className="xl:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-6">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={false}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            dayCellContent={renderDayCellContent}
            height="auto"
          />
        </div>
      </div>

      {/* Right Side: Agenda List Panel */}
      <div className="xl:col-span-4 flex flex-col space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-6 flex flex-col h-[650px] overflow-hidden">
          {/* Header Panel */}
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand-500"></span>
                  {selectedDate ? "Agenda Terpilih" : "Agenda"}
                </h3>
                {canManage && (
                  <button
                    onClick={() => {
                      resetForm();
                      setStartDate(selectedDate || new Date().toISOString().split("T")[0]);
                      setEndDate(selectedDate || new Date().toISOString().split("T")[0]);
                      openModal();
                    }}
                    className="px-3 py-1.5 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-bold text-[10px] uppercase tracking-widest cursor-pointer shadow active:scale-95 transition-transform rounded-lg flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Agenda
                  </button>
                )}
              </div>
              {selectedDate ? (
                <div className="flex justify-between items-center bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 px-3 py-2 rounded-lg">
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wide truncate">
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

          {/* Agenda Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-5">
            {selectedDate ? (
              filteredEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                  </svg>
                  <p className="text-xs font-semibold text-gray-400">Tidak ada agenda pada tanggal ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map(renderAgendaItem)}
                </div>
              )
            ) : (() => {
              const grouped = getGroupedEvents();
              const hasToday = grouped.today.length > 0;
              const hasTomorrow = grouped.tomorrow.length > 0;
              const hasThisWeek = grouped.thisWeek.length > 0;

              if (!hasToday && !hasTomorrow && !hasThisWeek) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                    </svg>
                    <p className="text-xs font-semibold text-gray-400">Tidak ada agenda mendatang.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Group 1: Hari Ini */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        Hari Ini
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full">
                        {grouped.today.length}
                      </span>
                    </div>
                    {grouped.today.length === 0 ? (
                      <p className="text-xs text-gray-400 italic pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                        Tidak ada agenda untuk hari ini.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {grouped.today.map(renderAgendaItem)}
                      </div>
                    )}
                  </div>

                  {/* Group 2: Besok */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Besok
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">
                        {grouped.tomorrow.length}
                      </span>
                    </div>
                    {grouped.tomorrow.length === 0 ? (
                      <p className="text-xs text-gray-400 italic pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                        Tidak ada agenda untuk besok.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {grouped.tomorrow.map(renderAgendaItem)}
                      </div>
                    )}
                  </div>

                  {/* Group 3: Minggu Ini */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-brand-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                        Minggu Ini (Mendatang)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-brand-500/10 text-brand-500 rounded-full">
                        {grouped.thisWeek.length}
                      </span>
                    </div>
                    {grouped.thisWeek.length === 0 ? (
                      <p className="text-xs text-gray-400 italic pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                        Tidak ada agenda mendatang dalam 7 hari ini.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {grouped.thisWeek.map(renderAgendaItem)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
                    { key: "Q1", label: "Q1 (Tinggi)" },
                    { key: "Q2", label: "Q2 (Sedang)" },
                    { key: "Q3", label: "Q3 (Rendah)" }
                  ].map((q) => (
                    <button
                      key={q.key}
                      type="button"
                      disabled={!canManage}
                      onClick={() => setScale(q.key)}
                      className={`py-3 rounded-none border-2 transition-all font-bold text-xs ${
                        scale === q.key
                          ? q.key === "Q1"
                            ? "border-red-500 bg-red-500 text-white shadow-md"
                            : q.key === "Q2"
                            ? "border-amber-500 bg-amber-500 text-white shadow-md"
                            : "border-green-500 bg-green-500 text-white shadow-md"
                          : "border-stroke bg-transparent text-gray-400 hover:border-brand-500/50 dark:border-form-strokedark"
                      }`}
                    >
                      {q.label}
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
