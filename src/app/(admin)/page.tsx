"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalenderIcon, GroupIcon, PageIcon } from "@/icons";
import { DigitalClock, MiniCalendar } from "@/components/dashboard/DashboardWidgets";
import { RetainerIcon } from "@/icons/MenuIcons";
import Link from "next/link";
import { APP_LABELS } from "@/config/app-labels";

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
  const [gdriveError, setGdriveError] = useState<string | null>(null);
  const [summaryCounts, setSummaryCounts] = useState({
    activeCount: 0,
    nonRetainer: 0,
    retainer: 0,
    internal: 0
  });
  const [activeBottomTab, setActiveBottomTab] = useState<"announcements" | "docs" | "logs">("announcements");
  const [laporanTab, setLaporanTab] = useState<"dilo" | "wilo" | "milo">("dilo");
  const [diloRows, setDiloRows] = useState<any[]>([]);
  const [wiloRows, setWiloRows] = useState<any[]>([]);
  const [miloRows, setMiloRows] = useState<any[]>([]);
  
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
        setGdriveError(null);

        // Fetch Agendas
        const resAgenda = await fetch("/api/laporan-operasional?agenda=true");
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
          resDocs,
          resSummary,
          resDilo,
          resWilo,
          resMilo
        ] = await Promise.all([
          fetch("/api/karyawan"),
          fetch("/api/retainer"),
          fetch("/api/perorangan"),
          fetch("/api/personal-tasks"),
          fetch("/api/pengumuman"),
          fetch("/api/gdrive/recent?limit=5"),
          fetch("/api/laporan-operasional?summary=true"),
          fetch("/api/laporan-operasional?sheetName=RETAINER&limit=3"),
          fetch("/api/laporan-operasional?sheetName=NON_RETAINER&limit=3"),
          fetch("/api/laporan-operasional?sheetName=INTERNAL&limit=3")
        ]);

        const team = resKaryawan.ok ? await resKaryawan.json() : [];
        const retainerData = resRetainer.ok ? await resRetainer.json() : [];
        const peroranganData = resPerorangan.ok ? await resPerorangan.json() : [];
        const tasks = resPersonalTasks.ok ? await resPersonalTasks.json() : [];
        const ann = resPengumuman.ok ? await resPengumuman.json() : [];
        const summaryObj = resSummary.ok ? await resSummary.json() : { activeCount: 0, nonRetainer: 0, retainer: 0, internal: 0 };
        const diloObj = resDilo.ok ? await resDilo.json() : { data: [] };
        const wiloObj = resWilo.ok ? await resWilo.json() : { data: [] };
        const miloObj = resMilo.ok ? await resMilo.json() : { data: [] };
        
        let docs: GDriveItem[] = [];
        if (resDocs.ok) {
          const docData = await resDocs.json();
          if (Array.isArray(docData)) {
            docs = docData;
          } else if (docData && typeof docData === "object" && docData.error) {
            setGdriveError(docData.error);
          }
        } else {
          try {
            const errData = await resDocs.json();
            setGdriveError(errData.error || "Gagal memuat dokumen.");
          } catch {
            setGdriveError("Koneksi Google Drive terputus.");
          }
        }

        setKaryawanList(team);
        setRetainers(retainerData);
        setPerorangan(peroranganData);
        setPersonalTasks(tasks);
        setAnnouncements(ann.slice(0, 3));
        setRecentDocs(docs);
        setSummaryCounts(summaryObj);
        setDiloRows(diloObj.data || []);
        setWiloRows(wiloObj.data || []);
        setMiloRows(miloObj.data || []);

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
    <div className="space-y-4 max-w-7xl mx-auto px-1 md:px-3 pb-4" suppressHydrationWarning>
      
      {/* Header Ringkasan Operasional */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-3 border-b border-gray-200 dark:border-gray-800 gap-4" suppressHydrationWarning>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight uppercase tracking-wider">
            {APP_LABELS.dashboard.title}
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {APP_LABELS.dashboard.welcome} <span className="font-bold text-brand-500">{session?.user?.name || "User"}</span>, {APP_LABELS.dashboard.welcomeSub}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/daftar-potensi-klien" className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]">
            + Potensi
          </Link>
          <Link href="/retainer" className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]">
            + Pekerjaan
          </Link>
          <Link href="/narasumber-hukum" className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]">
            + Unggah
          </Link>
          <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 pl-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{APP_LABELS.common.systemActive}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
        {/* Card 1: Pekerjaan Aktif */}
        <Link href="/progress-pekerjaan" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
            <RetainerIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{summaryCounts.activeCount}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Pekerjaan Aktif</p>
          </div>
        </Link>

        {/* Card 2: Non Retainer */}
        <Link href="/progress-pekerjaan?tab=NON_RETAINER" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
            <PageIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{summaryCounts.nonRetainer}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Non Retainer</p>
          </div>
        </Link>

        {/* Card 3: Retainer */}
        <Link href="/progress-pekerjaan?tab=RETAINER" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
            <RetainerIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{summaryCounts.retainer}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Retainer</p>
          </div>
        </Link>

        {/* Card 4: INTERNAL */}
        <Link href="/progress-pekerjaan?tab=INTERNAL" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            <GroupIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{summaryCounts.internal}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">INTERNAL</p>
          </div>
        </Link>
      </div>

      {/* SECTION 2: Agenda & Tugas + Clock/Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        {/* LEFT COLUMN: Agenda & Tugas side-by-side (70% width) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex-1 flex flex-col justify-between max-h-[350px] min-h-[350px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
              
              {/* Agenda (Agenda Terdekat) */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Agenda (Agenda Terdekat)
                    </h2>
                  </div>
                  <Link href="/calendar" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
                  {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
                  ) : displayAgendas.length > 0 ? (
                    displayAgendas.map(agenda => (
                      <div key={agenda.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-[9px] ${
                            agenda.scale === 'Q1' ? 'bg-red-50 text-red-500 dark:bg-red-950/20' : 'bg-gray-50 text-gray-500 dark:bg-gray-800'
                          }`}>
                            {agenda.scale}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors leading-snug truncate">
                              {agenda.title}
                            </h4>
                            <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-2 font-semibold uppercase tracking-wider">
                              <span>{new Date(agenda.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                              <span className="text-brand-500 font-black">PIC: {agenda.pic}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{APP_LABELS.dashboard.empty.agenda}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tugas (Personal Tasks) */}
              <div className="flex flex-col h-full overflow-hidden border-t md:border-t-0 md:border-l border-gray-150 dark:border-gray-800 md:pl-6 pt-4 md:pt-0">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-red-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Tugas
                    </h2>
                  </div>
                  <Link href="/daftar-potensi-klien" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
                  {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
                  ) : personalTasks.filter(t => t.status !== "COMPLETED").length > 0 ? (
                    personalTasks.filter(t => t.status !== "COMPLETED").slice(0, 4).map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-[9px] ${
                            task.priority === 'Q1' ? 'bg-red-50 text-red-500 dark:bg-red-950/20' : 
                            task.priority === 'Q2' ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/20' : 
                            'bg-gray-50 text-gray-500 dark:bg-gray-800'
                          }`}>
                            {task.priority || 'Q2'}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors leading-snug truncate">
                              {task.title}
                            </h4>
                            <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-2 font-semibold uppercase tracking-wider">
                              <span className="text-red-550 font-black uppercase tracking-widest text-[8px]">{task.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tidak ada tugas aktif.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clock, MiniCalendar (30% width) */}
        <div className="lg:col-span-4 flex flex-col justify-between max-h-[350px] min-h-[350px] space-y-4">
          <div className="flex-1 flex flex-col justify-center min-h-[90px] max-h-[90px]">
            <DigitalClock />
          </div>
          <div className="flex-1 flex flex-col justify-between min-h-[244px] max-h-[244px]">
            <MiniCalendar 
              agendas={allAgendas} 
              onDateClick={setSelectedDate} 
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: Laporan (Dilo | Wilo | Milo) & Split widget (Pengumuman | Akses Cepat) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        {/* Left Column: Laporan (Dilo, Wilo, Milo) */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[210px] max-h-[210px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Laporan</h2>
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-850 p-0.5 rounded-lg select-none">
                {(["dilo", "wilo", "milo"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setLaporanTab(tab)}
                    className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                      laporanTab === tab
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-brand-500"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                    {laporanTab === "dilo" && (
                      <>
                        <th className="pb-1 w-8">No</th>
                        <th className="pb-1">Pekerjaan</th>
                        <th className="pb-1 w-16">Prioritas</th>
                        <th className="pb-1 w-16 text-right">Batas</th>
                      </>
                    )}
                    {laporanTab === "wilo" && (
                      <>
                        <th className="pb-1 w-8">No</th>
                        <th className="pb-1">Pekerjaan</th>
                        <th className="pb-1 w-24">Klien</th>
                        <th className="pb-1 w-16 text-right">Status</th>
                      </>
                    )}
                    {laporanTab === "milo" && (
                      <>
                        <th className="pb-1 w-8">No</th>
                        <th className="pb-1">Pekerjaan</th>
                        <th className="pb-1 w-16">PIC</th>
                        <th className="pb-1 w-16 text-right">Hasil</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {laporanTab === "dilo" && diloRows.length > 0 ? (
                    diloRows.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.002]">
                        <td className="py-1.5 font-bold text-gray-450">{item.no}</td>
                        <td className="py-1.5 font-bold text-gray-900 dark:text-white truncate max-w-[150px]" title={item.deskripsi || item.tugas}>
                          {item.namaKlien || item.deskripsi || item.tugas}
                        </td>
                        <td className="py-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            item.quadran === "Q1" ? "text-red-600 bg-red-50 dark:bg-red-950/20" :
                            item.quadran === "Q2" ? "text-orange-600 bg-orange-50 dark:bg-orange-950/20" :
                            "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                          }`}>{item.quadran || "Q3"}</span>
                        </td>
                        <td className="py-1.5 text-right font-bold text-brand-500">
                          {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                        </td>
                      </tr>
                    ))
                  ) : laporanTab === "dilo" ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 italic">Tidak ada data Dilo.</td>
                    </tr>
                  ) : null}
                  {laporanTab === "wilo" && wiloRows.length > 0 ? (
                    wiloRows.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.002]">
                        <td className="py-1.5 font-bold text-gray-450">{item.no}</td>
                        <td className="py-1.5 font-bold text-gray-900 dark:text-white truncate max-w-[150px]" title={item.deskripsi || item.tugas}>
                          {item.deskripsi || item.tugas}
                        </td>
                        <td className="py-1.5 text-gray-500 truncate max-w-[80px]" title={item.area}>
                          {item.area || item.kategori || "-"}
                        </td>
                        <td className="py-1.5 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            item.status === "Selesai" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-955/20" :
                            item.status === "Aktif" ? "text-blue-600 bg-blue-50 dark:bg-blue-955/20" :
                            "text-amber-600 bg-amber-50 dark:bg-amber-955/20"
                          }`}>{item.status || "-"}</span>
                        </td>
                      </tr>
                    ))
                  ) : laporanTab === "wilo" ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 italic">Tidak ada data Wilo.</td>
                    </tr>
                  ) : null}
                  {laporanTab === "milo" && miloRows.length > 0 ? (
                    miloRows.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.002]">
                        <td className="py-1.5 font-bold text-gray-450">{item.no}</td>
                        <td className="py-1.5 font-bold text-gray-900 dark:text-white truncate max-w-[150px]" title={item.deskripsi || item.tugas}>
                          {item.deskripsi || item.tugas}
                        </td>
                        <td className="py-1.5 text-gray-500 truncate max-w-[80px]" title={item.penanggungJawab}>
                          {item.penanggungJawab || "-"}
                        </td>
                        <td className="py-1.5 text-right">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            item.status === "Selesai" ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-955/20" :
                            item.status === "Aktif" ? "text-blue-600 bg-blue-50 dark:bg-blue-955/20" :
                            "text-amber-600 bg-amber-50 dark:bg-amber-955/20"
                          }`}>{item.status || "-"}</span>
                        </td>
                      </tr>
                    ))
                  ) : laporanTab === "milo" ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-400 italic">Tidak ada data Milo.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Split widget (Pengumuman | Akses Cepat) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[210px] max-h-[210px] flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden">
              
              {/* Pengumuman */}
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-emerald-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Pengumuman
                    </h2>
                  </div>
                  <Link href="/pengumuman" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
                  {loading ? (
                    [1, 2].map(i => <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
                  ) : announcements.length > 0 ? (
                    announcements.map((ann) => (
                      <div key={ann.id} className="p-2.5 rounded-xl border border-gray-150 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.002] flex justify-between items-start gap-3">
                        <div className="overflow-hidden">
                          <h4 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-wide truncate">{ann.title}</h4>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{ann.content}</p>
                        </div>
                        <div className="flex flex-col items-end flex-shrink-0">
                          <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${
                            ann.priority === "High" ? "bg-red-50 text-red-500 dark:bg-red-950/20" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                          }`}>
                            {ann.priority}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[9px] text-gray-400 font-bold uppercase italic">{APP_LABELS.dashboard.empty.announcements}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Akses Cepat */}
              <div className="flex flex-col h-full overflow-hidden border-t md:border-t-0 md:border-l border-gray-150 dark:border-gray-800 md:pl-4 pt-3 md:pt-0">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-violet-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Akses Cepat
                    </h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                  <Link href="/daftar-potensi-klien" className="flex flex-col items-center justify-center p-2 text-center border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group h-12">
                    <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 group-hover:text-brand-500 uppercase tracking-wider">Potensi</span>
                  </Link>
                  <Link href="/legal/template-management" className="flex flex-col items-center justify-center p-2 text-center border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group h-12">
                    <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 group-hover:text-brand-500 uppercase tracking-wider">Formulir</span>
                  </Link>
                  <Link href="/dokumentasi" className="flex flex-col items-center justify-center p-2 text-center border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group h-12">
                    <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 group-hover:text-brand-500 uppercase tracking-wider">Pedoman</span>
                  </Link>
                  <Link href="/skala-prioritas" className="flex flex-col items-center justify-center p-2 text-center border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group h-12">
                    <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 group-hover:text-brand-500 uppercase tracking-wider">P3</span>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
