"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalenderIcon, GroupIcon, PageIcon } from "@/icons";
import { DigitalClock, MiniCalendar } from "@/components/dashboard/DashboardWidgets";
import { RetainerIcon } from "@/icons/MenuIcons";
import Link from "next/link";

interface Agenda {
  id: string;
  title: string;
  startDate: string;
  pic: string;
  scale: string;
}

interface Member {
  id: string;
  name: string;
  email: string;
}

interface Project {
  id: string;
  clientName: string;
  projectName?: string;
  caseType?: string;
  startDate: string;
  endDate?: string;
  status: string;
}

interface PersonalTask {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

interface Pengumuman {
  id: string;
  title: string;
  content: string;
  priority: string;
  createdAt: string;
}

interface GDriveItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  isFolder: boolean;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [allAgendas, setAllAgendas] = useState<Agenda[]>([]);
  const [displayAgendas, setDisplayAgendas] = useState<Agenda[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [karyawanList, setKaryawanList] = useState<Member[]>([]);
  const [retainers, setRetainers] = useState<Project[]>([]);
  const [perorangan, setPerorangan] = useState<Project[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  const [recentDocs, setRecentDocs] = useState<GDriveItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      setIsAdmin((session.user as any).role === "admin");
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Agendas
        const resAgenda = await fetch("/api/agenda");
        const agendas = resAgenda.ok ? await resAgenda.json() : [];
        setAllAgendas(agendas);
        setDisplayAgendas(agendas.slice(0, 5));

        // Fetch other operational data
        const [
          resKaryawan, 
          resRetainer, 
          resPerorangan, 
          resPersonalTasks,
          resPengumuman,
          resDocs
        ] = await Promise.all([
          fetch("/api/karyawan"),
          fetch("/api/retainer"),
          fetch("/api/perorangan"),
          fetch("/api/personal-tasks"),
          fetch("/api/pengumuman"),
          fetch("/api/narasumber-hukum")
        ]);

        const team = resKaryawan.ok ? await resKaryawan.json() : [];
        const retainerData = resRetainer.ok ? await resRetainer.json() : [];
        const peroranganData = resPerorangan.ok ? await resPerorangan.json() : [];
        const tasks = resPersonalTasks.ok ? await resPersonalTasks.json() : [];
        const ann = resPengumuman.ok ? await resPengumuman.json() : [];
        const docResult = resDocs.ok ? await resDocs.json() : { items: [] };

        setKaryawanList(team);
        setRetainers(retainerData);
        setPerorangan(peroranganData);
        setPersonalTasks(tasks);
        setAnnouncements(ann.slice(0, 3));
        setRecentDocs(docResult.items ? docResult.items.slice(0, 5) : []);

        // Fetch Activity Logs (Admin Only)
        if ((session?.user as any)?.role === "admin") {
          const resLogs = await fetch("/api/admin/activities");
          const logs = resLogs.ok ? await resLogs.json() : [];
          setActivityLogs(logs.slice(0, 5));
        }

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  useEffect(() => {
    if (selectedDate) {
      const filtered = allAgendas.filter(a => {
        const aDate = new Date(a.startDate);
        return aDate.getDate() === selectedDate.getDate() &&
               aDate.getMonth() === selectedDate.getMonth() &&
               aDate.getFullYear() === selectedDate.getFullYear();
      });
      setDisplayAgendas(filtered);
    } else {
      setDisplayAgendas(allAgendas.slice(0, 5));
    }
  }, [selectedDate, allAgendas]);

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse" suppressHydrationWarning></div>
  );

  // Statistics calculation for Command Cards
  const activeProjectsCount = 
    retainers.filter(r => r.status === "Active").length + 
    perorangan.filter(p => p.status === "In Progress" || p.status !== "Finished").length;

  const priorityTasksCount = personalTasks.filter(t => t.status !== "COMPLETED").length;
  const totalTeamCount = karyawanList.length;
  const documentCount = recentDocs.length;

  // Calculate upcoming deadlines (sorted by closest remaining days)
  const getUpcomingDeadlines = () => {
    const today = new Date();
    const list: { title: string; client: string; remainingDays: number; type: string; url: string }[] = [];

    retainers.forEach(r => {
      if (r.endDate && r.status === "Active") {
        const end = new Date(r.endDate);
        const diffTime = end.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 45) {
          list.push({
            title: r.projectName || "Kontrak Retainer",
            client: r.clientName,
            remainingDays: diffDays,
            type: "Retainer",
            url: "/retainer"
          });
        }
      }
    });

    perorangan.forEach(p => {
      if (p.startDate && p.status !== "Finished") {
        // Assume projects have a soft target date, e.g. 60 days from start date
        const target = new Date(p.startDate);
        target.setDate(target.getDate() + 60);
        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 45) {
          list.push({
            title: p.caseType || "Pendampingan Perdata",
            client: p.clientName,
            remainingDays: diffDays,
            type: "Perorangan",
            url: "/perorangan"
          });
        }
      }
    });

    return list.sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 5);
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 md:px-3" suppressHydrationWarning>
      
      {/* Header Ringkasan Operasional */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200 dark:border-gray-800 gap-4" suppressHydrationWarning>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-wider">
            Ringkasan Operasional
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Selamat Datang, <span className="font-bold text-brand-500">{session?.user?.name || "User"}</span>. Ringkasan aktivitas operasional kantor hukum hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Sistem Aktif</span>
        </div>
      </div>

      {/* SECTION 1: Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
        {/* Card 1: Proyek Aktif */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3.5 transition-all hover:border-brand-500 hover:shadow group">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
            <RetainerIcon />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{activeProjectsCount}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Proyek Aktif</p>
          </div>
        </div>

        {/* Card 2: Tugas Prioritas */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3.5 transition-all hover:border-brand-500 hover:shadow group">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors group-hover:bg-red-500 group-hover:text-white">
            <CalenderIcon />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{priorityTasksCount}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Tugas Prioritas</p>
          </div>
        </div>

        {/* Card 3: Arsip NH */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3.5 transition-all hover:border-brand-500 hover:shadow group">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
            <PageIcon />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{documentCount}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Folder Utama Arsip</p>
          </div>
        </div>

        {/* Card 4: Karyawan */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3.5 transition-all hover:border-brand-500 hover:shadow group">
          <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            <GroupIcon />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{totalTeamCount}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">Anggota Tim</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: 70% / 30% Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        {/* LEFT COLUMN: Agenda & Deadline (70%) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-brand-500 rounded-full"></span>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {selectedDate ? `Agenda Tanggal: ${selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : "Agenda & Deadline Terdekat"}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  {selectedDate && (
                    <button 
                      onClick={() => setSelectedDate(null)} 
                      className="text-[10px] text-red-500 font-black uppercase hover:underline"
                    >
                      Reset Filter
                    </button>
                  )}
                  <Link href="/calendar" className="text-brand-500 font-black hover:underline text-[10px] uppercase tracking-wider">Lihat Semua</Link>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
                ) : displayAgendas.length > 0 ? (
                  displayAgendas.map(agenda => (
                    <div key={agenda.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-xs ${
                          agenda.scale === 'Q1' ? 'bg-red-50 text-red-500 dark:bg-red-950/20' : 'bg-gray-50 text-gray-500 dark:bg-gray-800'
                        }`}>
                          {agenda.scale}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors leading-snug">
                            {agenda.title}
                          </h4>
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-3 font-semibold uppercase tracking-wider">
                            <span>{new Date(agenda.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span className="text-brand-500 font-black">PIC: {agenda.pic}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                    <svg className="w-10 h-10 text-gray-300 dark:text-gray-650 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tidak ada agenda hukum untuk tanggal ini.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clock, Calendar & Quick Actions (30%) */}
        <div className="lg:col-span-4 space-y-4">
          <DigitalClock />
          <MiniCalendar 
            agendas={allAgendas} 
            onDateClick={setSelectedDate} 
            selectedDate={selectedDate}
          />
          
          {/* Quick Actions Container */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 space-y-3">
            <h4 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">Akses Cepat</h4>
            <div className="grid grid-cols-2 gap-2">
              <Link 
                href="/catatan-pribadi" 
                className="p-3 text-center border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all block group"
              >
                <span className="text-[10px] font-black text-gray-850 dark:text-gray-200 group-hover:text-brand-500 block uppercase tracking-wider">Buat Catatan</span>
              </Link>
              <Link 
                href="/retainer" 
                className="p-3 text-center border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all block group"
              >
                <span className="text-[10px] font-black text-gray-850 dark:text-gray-200 group-hover:text-brand-500 block uppercase tracking-wider">Tambah Proyek</span>
              </Link>
              <Link 
                href="/narasumber-hukum" 
                className="p-3 text-center border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all block group"
              >
                <span className="text-[10px] font-black text-gray-850 dark:text-gray-200 group-hover:text-brand-500 block uppercase tracking-wider">Upload Arsip</span>
              </Link>
              <Link 
                href="/karyawan" 
                className="p-3 text-center border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all block group"
              >
                <span className="text-[10px] font-black text-gray-850 dark:text-gray-200 group-hover:text-brand-500 block uppercase tracking-wider">Tambah Data</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: 50% / 50% Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" suppressHydrationWarning>
        
        {/* LEFT COLUMN: Deadline Mendekat (50%) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-red-500 rounded-full"></span>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Tenggat Waktu Mendekat</h2>
            </div>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
            ) : upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((dl, idx) => (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.002]">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{dl.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold uppercase tracking-wider">Klien: {dl.client}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${
                      dl.remainingDays <= 7 ? "bg-red-50 text-red-500 dark:bg-red-950/20" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20"
                    }`}>
                      {dl.remainingDays} Hari Lagi
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Tidak ada tenggat waktu kontrak mendesak.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Aktivitas Terbaru (50%) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[350px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Aktivitas Terbaru</h2>
              </div>
            </div>
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
              ) : !isAdmin ? (
                /* Non-admin fallback info card */
                <div className="text-center py-12 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/10">
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-relaxed px-4">
                    Log aktivitas sistem terenkripsi dan hanya dapat diakses oleh Administrator.
                  </p>
                </div>
              ) : activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50/20 dark:bg-white/[0.002]">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {log.userName || "Sistem"} <span className="font-normal text-gray-500 text-[11px]">{log.action}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium truncate max-w-xs">{log.details}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 font-bold font-mono">
                      {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-16">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Belum ada catatan aktivitas.</p>
                </div>
              )}
            </div>
          </div>
          {isAdmin && activityLogs.length > 0 && (
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-right">
              <Link href="/admin-control" className="text-[10px] font-black text-brand-500 uppercase tracking-widest hover:underline">
                Lihat Semua &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: 50% / 50% Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" suppressHydrationWarning>
        
        {/* LEFT COLUMN: Pengumuman (50%) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Pengumuman Internal</h2>
            </div>
            <Link href="/pengumuman" className="text-brand-500 font-black hover:underline text-[10px] uppercase tracking-wider">Semua</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1, 2].map(i => <div key={i} className="h-24 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
            ) : announcements.length > 0 ? (
              announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.002] space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[200px] uppercase tracking-wide">{ann.title}</h4>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                      ann.priority === "High" ? "bg-red-50 text-red-500 dark:bg-red-950/20" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                    }`}>
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{ann.content}</p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider pt-1">
                    {new Date(ann.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Tidak ada pengumuman baru.</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Dokumen Terbaru (50%) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[350px]">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
              <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Dokumen Terbaru</h2>
            </div>
            <Link href="/narasumber-hukum" className="text-brand-500 font-black hover:underline text-[10px] uppercase tracking-wider">Eksplor</Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
            ) : recentDocs.length > 0 ? (
              recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.002] hover:border-brand-500/30 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-xs">{doc.name}</span>
                  </div>
                  <div>
                    {doc.webViewLink ? (
                      <a 
                        href={doc.webViewLink} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] font-black uppercase tracking-widest text-brand-500 hover:underline"
                      >
                        Buka
                      </a>
                    ) : (
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Folder</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider italic">Tidak ada dokumen di folder utama.</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
