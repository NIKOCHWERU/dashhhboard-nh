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
    type: "google" | "local";
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
    } else {
      setPic(event.extendedProps.pic);
      setScale(event.extendedProps.scale);
      setDescription(event.extendedProps.description);
      setNotes(event.extendedProps.notes);
    }
    openModal();
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    if (!title || !startDate || !startTime || !pic) {
      alert("Harap isi Judul, Tanggal, Jam, dan PIC.");
      return;
    }

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
          pic,
          scale,
          description,
          notes,
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
    if (!title || !startDate || !startTime || !pic) {
      alert("Harap isi Judul, Tanggal, Jam, dan PIC.");
      return;
    }

    const start = new Date(`${startDate}T${startTime}`);
    let end = new Date(`${endDate || startDate}T${endTime}`);

    if (end <= start) {
      end = new Date(start.getTime() + 60 * 60 * 1000);
      setEndTime(end.toTimeString().slice(0, 5));
    }

    handleSubmit();
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
    setSelectedEventId(null);
    setIsGoogleEvent(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left Side: FullCalendar */}
      <div className="xl:col-span-8 rounded-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-6">
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
        <div className="rounded-none border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] shadow-2xl p-4 md:p-6 flex flex-col h-[650px] overflow-hidden">
          {/* Header Panel */}
          <div className="border-b border-gray-100 dark:border-gray-800 pb-4 space-y-4">
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                  {selectedDate ? `Daftar Agenda ${formatDateIndo(selectedDate)}` : "Semua Agenda Tim"}
                </h3>
                {canManage && (
                  <button
                    onClick={() => {
                      resetForm();
                      setStartDate(selectedDate || new Date().toISOString().split("T")[0]);
                      setEndDate(selectedDate || new Date().toISOString().split("T")[0]);
                      openModal();
                    }}
                    className="px-3 py-1.5 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 font-black text-[10px] uppercase tracking-widest cursor-pointer shadow active:scale-95 transition-transform"
                  >
                    + Agenda
                  </button>
                )}
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-left text-[10px] font-black text-brand-500 uppercase tracking-wider hover:underline mt-1"
                >
                  Reset Filter Tanggal ×
                </button>
              )}
            </div>
          </div>

          {/* Agenda Scroll Area */}
          <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
                </svg>
                <p className="text-xs font-semibold text-gray-400">Tidak ada agenda kerja.</p>
              </div>
            ) : (
              filteredEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-4 border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/10 hover:bg-gray-50/50 dark:hover:bg-gray-900/20 rounded-none flex flex-col gap-2 transition-all group relative cursor-pointer"
                  onClick={() => handleEventClickFromList(ev)}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none text-white ${
                        ev.extendedProps?.scale === "Q1"
                          ? "bg-red-500"
                          : ev.extendedProps?.scale === "Q2"
                          ? "bg-amber-500"
                          : ev.extendedProps?.scale === "Q3"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {ev.extendedProps?.scale || "Tim WFO"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {ev.start ? new Date(ev.start as any).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      }) : ""}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-black dark:text-white leading-snug truncate">
                    {ev.title}
                  </h4>
                  {ev.extendedProps?.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                      {ev.extendedProps.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase">
                      PIC: {ev.extendedProps?.pic || "WFO"}
                    </span>
                    <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClickFromList(ev);
                        }}
                        className="text-[9px] font-black uppercase tracking-wider text-brand-500 hover:underline transition"
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
                            className="text-[9px] font-black uppercase tracking-wider text-blue-600 hover:underline transition"
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
                            className="text-[9px] font-black uppercase tracking-wider text-red-600 hover:underline transition"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
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

          <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-3">Judul Agenda</label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Sidang Perdata PT. Maju Jaya"
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                />
              </div>

              {/* Start Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-black dark:text-white">Waktu Mulai</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    disabled={!canManage}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                  />
                  <input
                    type="time"
                    disabled={!canManage}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-32 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                  />
                </div>
              </div>

              {/* End Date & Time */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-black dark:text-white">Waktu Selesai</label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    disabled={!canManage}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                  />
                  <input
                    type="time"
                    disabled={!canManage}
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-32 rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                  />
                </div>
              </div>

              {/* PIC Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-3 flex justify-between items-center">
                  <span>Pilih PIC Karyawan</span>
                  {pic && <span className="text-xs font-black text-brand-500 uppercase">Terpilih: {pic}</span>}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto no-scrollbar p-1">
                  {karyawanList.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      disabled={!canManage}
                      onClick={() => setPic(k.name)}
                      className={`p-3 rounded-none border-2 transition-all flex flex-col items-start gap-1 text-left ${
                        pic === k.name
                          ? "border-brand-500 bg-brand-500/10 shadow-md"
                          : "border-stroke bg-transparent hover:border-brand-500/50 dark:border-form-strokedark"
                      } disabled:opacity-80`}
                    >
                      <span className={`text-sm font-bold ${pic === k.name ? "text-brand-500" : "text-black dark:text-white"}`}>
                        {k.name}
                      </span>
                      <span className="text-[10px] font-black uppercase text-gray-500">
                        {k.position}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scale */}
              <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-3">Skala Prioritas</label>
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
                <label className="block text-sm font-medium text-black dark:text-white mb-3">Keterangan</label>
                <textarea
                  rows={3}
                  disabled={!canManage}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
                ></textarea>
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-black dark:text-white mb-3">Catatan Internal</label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-none border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-brand-500 active:border-brand-500 dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-brand-500"
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
