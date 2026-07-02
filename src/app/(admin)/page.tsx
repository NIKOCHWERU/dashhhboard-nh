"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalenderIcon, GroupIcon, PageIcon, BellIcon, PlusIcon, TrashBinIcon } from "@/icons";
import { DigitalClock, MiniCalendar } from "@/components/dashboard/DashboardWidgets";
import { RetainerIcon } from "@/icons/MenuIcons";
import Link from "next/link";
import { APP_LABELS } from "@/config/app-labels";
import { useAnimeSlideInLeft, useAnimeSlideInRight } from "@/hooks/useAnime";
import { FeatureModal } from "@/components/common/FeatureModal";

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

interface PersonalTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  endDate?: string | Date;
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

export default function Dashboard() {
  const { data: session } = useSession();
  const [allAgendas, setAllAgendas] = useState<Agenda[]>([]);
  const [displayAgendas, setDisplayAgendas] = useState<Agenda[]>([]);
  const [personalTasks, setPersonalTasks] = useState<PersonalTask[]>([]);
  const [todayQ1Tasks, setTodayQ1Tasks] = useState<any[]>([]);
  const [karyawanList, setKaryawanList] = useState<Member[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);

  const formatDateIndoCapitalized = (dVal: any) => {
    if (!dVal) return "-";
    const d = new Date(dVal);
    if (isNaN(d.getTime())) return "-";
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };
  
  const [dbSummary, setDbSummary] = useState({
    totalCalonKlien: 0,
    totalActivePekerjaan: 0,
    totalCompletedPekerjaan: 0,
    totalArsipDokumen: 0
  });
  const [recentCalonKlien, setRecentCalonKlien] = useState<any[]>([]);
  const [recentArsipFiles, setRecentArsipFiles] = useState<any[]>([]);
  
  const [laporanTab, setLaporanTab] = useState<"dilo" | "wilo" | "milo">("dilo");
  const [diloRows, setDiloRows] = useState<any[]>([]);
  const [wiloRows, setWiloRows] = useState<any[]>([]);
  const [miloRows, setMiloRows] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Pengumuman | null>(null);

  // Task completion modal states
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [completeStartTime, setCompleteStartTime] = useState("09:00");
  const [completeEndTime, setCompleteEndTime] = useState("10:00");
  const [completeKeterangan, setCompleteKeterangan] = useState("");
  const [completeCatatan, setCompleteCatatan] = useState("");
  const [completeFile, setCompleteFile] = useState<{ name: string; url: string } | null>(null);
  const [completeUploading, setCompleteUploading] = useState(false);

  const animTrigger = !loading;
  const metric1Ref = useAnimeSlideInLeft(1000, 1000, animTrigger);
  const metric2Ref = useAnimeSlideInLeft(1000, 1000, animTrigger);
  const metric3Ref = useAnimeSlideInRight(1000, 1000, animTrigger);
  const metric4Ref = useAnimeSlideInRight(1000, 1000, animTrigger);

  const middleLeftRef = useAnimeSlideInLeft(1500, 1000, animTrigger);
  const middleRightRef = useAnimeSlideInRight(2000, 1000, animTrigger);

  const bottomLeftRef = useAnimeSlideInLeft(2500, 1000, animTrigger);
  const bottomRightRef = useAnimeSlideInRight(3000, 1000, animTrigger);

  const user = session?.user as any;
  const canViewPekerjaan = user?.role === "admin" || user?.canAccessPekerjaan;
  const canViewDokumentasi = user?.role === "admin" || user?.canAccessDokumentasi;
  const canViewLegal = user?.role === "admin" || user?.canManageLegal;
  const canViewSkala = user?.role === "admin" || user?.canAccessPekerjaan;
  const quickAccessItems = [
    { href: "/daftar-potensi-klien", label: "Potensi", show: canViewPekerjaan },
    { href: "/legal/template-management", label: "Formulir", show: canViewLegal },
    { href: "/dokumentasi", label: "Pedoman", show: canViewDokumentasi },
    { href: "/skala-prioritas", label: "P3", show: canViewSkala },
  ];

  const recentKlienRef = useAnimeSlideInLeft(3500, 1000, animTrigger);
  const recentArsipRef = useAnimeSlideInRight(4000, 1000, animTrigger);

  const fetchData = async () => {
    try {
      setLoading(true);

      const resAgenda = await fetch("/api/laporan-operasional?agenda=true");
      const agendas = resAgenda.ok ? await resAgenda.json() : [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingAgendas = agendas.filter((a: any) => {
        const aDate = new Date(a.startDate);
        aDate.setHours(0, 0, 0, 0);
        return aDate.getTime() >= today.getTime();
      }).sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

      setAllAgendas(upcomingAgendas);
      setDisplayAgendas(upcomingAgendas.slice(0, 5));

      const sessionUser = session?.user as any;
      const userLaporanUrl = sessionUser?.id 
        ? `/api/laporan-harian?userId=${sessionUser.id}`
        : "/api/laporan-harian";

      const [
        resKaryawan, 
        resPersonalTasks,
        resPengumuman,
        resCalonKlien,
        resProgressSummary,
        resArsipSummary,
        resRecentArsip,
        resDilo,
        resWilo,
        resMilo,
        resLaporan
      ] = await Promise.all([
        fetch("/api/karyawan"),
        fetch("/api/personal-tasks"),
        fetch("/api/pengumuman"),
        fetch("/api/calon-klien"),
        fetch("/api/progress-pekerjaan?summary=true"),
        fetch("/api/narasumber-hukum?summary=true"),
        fetch("/api/narasumber-hukum?recent=true"),
        fetch("/api/progress-pekerjaan?type=RETAINER&limit=3"),
        fetch("/api/progress-pekerjaan?type=NON_RETAINER&limit=3"),
        fetch("/api/progress-pekerjaan?type=INTERNAL&limit=3"),
        fetch(userLaporanUrl)
      ]);

      const team = resKaryawan.ok ? await resKaryawan.json() : [];
      const tasks = resPersonalTasks.ok ? await resPersonalTasks.json() : [];
      const ann = resPengumuman.ok ? await resPengumuman.json() : [];
      const calonKlienData = resCalonKlien.ok ? await resCalonKlien.json() : [];
      const reports = resLaporan.ok ? await resLaporan.json() : [];
      
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayReport = reports.find((r: any) => r.tanggal.slice(0, 10) === todayStr);
      let q1Tasks: any[] = [];
      if (todayReport && todayReport.prioritas) {
        try {
          const parsed = JSON.parse(todayReport.prioritas);
          q1Tasks = (parsed.q1 || []).map((t: any) => {
            const taskObj = typeof t === "string" ? { task: t } : t;
            return {
              ...taskObj,
              id: `prio_${todayReport.id}_q1_${taskObj.task}`,
            };
          });
        } catch (e) {}
      }
      setTodayQ1Tasks(q1Tasks);

      // Build Laporan Kerja list from all reports
      const mappedLaporanKerja: any[] = [];
      reports.forEach((report: any) => {
        // Today's scale priority (Selesai)
        if (report.prioritas) {
          try {
            const parsed = JSON.parse(report.prioritas);
            ["q1", "q2", "q3"].forEach((pKey) => {
              const list = parsed[pKey] || [];
              list.forEach((item: any) => {
                const taskName = typeof item === "string" ? item : item.task;
                if (!taskName) return;
                mappedLaporanKerja.push({
                  id: `prio_${report.id}_${pKey}_${taskName}`,
                  title: taskName,
                  priority: pKey.toUpperCase(),
                  endDate: report.tanggal,
                  status: item.completed ? "COMPLETED" : "PENDING",
                });
              });
            });
          } catch (e) {}
        }

        // Tomorrow's planned priority (Selesaikan)
        if (report.tugasEsok) {
          try {
            const parsed = JSON.parse(report.tugasEsok);
            ["q1", "q2", "q3"].forEach((pKey) => {
              const list = parsed[pKey] || [];
              list.forEach((item: any) => {
                const taskName = typeof item === "string" ? item : item.task;
                if (!taskName) return;
                
                const tomorrowDate = new Date(report.tanggal);
                tomorrowDate.setDate(tomorrowDate.getDate() + 1);

                mappedLaporanKerja.push({
                  id: `esok_${report.id}_${pKey}_${taskName}`,
                  title: taskName,
                  priority: pKey.toUpperCase(),
                  endDate: tomorrowDate.toISOString(),
                  status: "PENDING",
                });
              });
            });
          } catch (e) {}
        }
      });

      const recentArsip = resRecentArsip.ok ? await resRecentArsip.json() : [];
      const arsipSummaryObj = resArsipSummary.ok ? await resArsipSummary.json() : { total: 0 };
      const progressSummaryObj = resProgressSummary.ok ? await resProgressSummary.json() : {};
      
      const diloObj = resDilo.ok ? await resDilo.json() : [];
      const wiloObj = resWilo.ok ? await resWilo.json() : [];
      const miloObj = resMilo.ok ? await resMilo.json() : [];

      let totalActive = 0;
      let totalCompleted = 0;
      Object.values(progressSummaryObj).forEach((sheet: any) => {
        totalActive += (sheet.progress || 0) + (sheet.pending || 0) + (sheet.internalConf || 0) + (sheet.companyConf || 0);
        totalCompleted += (sheet.selesai || 0);
      });

      setKaryawanList(team);
      setPersonalTasks(mappedLaporanKerja);
      setAnnouncements(ann.slice(0, 3));
      setRecentCalonKlien(calonKlienData.slice(0, 5));
      setRecentArsipFiles(Array.isArray(recentArsip) ? recentArsip : recentArsip.items || []);
      
      setDiloRows(diloObj || []);
      setWiloRows(wiloObj || []);
      setMiloRows(miloObj || []);

      setDbSummary({
        totalCalonKlien: calonKlienData.length,
        totalActivePekerjaan: totalActive,
        totalCompletedPekerjaan: totalCompleted,
        totalArsipDokumen: arsipSummaryObj.total || 0
      });

      if (sessionUser?.role === "admin") {
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

  useEffect(() => {
    setMounted(true);
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

  const handleCompleteFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompleteUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload?category=Laporan Harian", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.url) {
        setCompleteFile({ name: file.name, url: data.url });
      } else {
        alert(data.error || "Gagal mengunggah berkas");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengunggah berkas.");
    } finally {
      setCompleteUploading(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      const res = await fetch("/api/laporan-harian/complete-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: selectedTask.id,
          startTime: completeStartTime,
          endTime: completeEndTime,
          keterangan: completeKeterangan,
          catatan: completeCatatan,
          uploadedFile: completeFile,
        }),
      });

      if (res.ok) {
        alert("Pekerjaan berhasil diselesaikan dan dicatat ke Laporan Harian!");
        setCompleteModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyelesaikan pekerjaan");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    }
  };

  if (!mounted) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 animate-pulse" suppressHydrationWarning></div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 md:px-3 pb-6" suppressHydrationWarning>
      
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
          <Link href="/progress-pekerjaan" className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-brand-500 text-[9px] font-black uppercase tracking-wider transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" suppressHydrationWarning>
        <Link ref={metric1Ref} href="/daftar-potensi-klien" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-855 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition-colors group-hover:bg-brand-500 group-hover:text-white">
            <GroupIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{dbSummary.totalCalonKlien}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Kontak Klien</p>
          </div>
        </Link>

        <Link ref={metric2Ref} href="/progress-pekerjaan" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-855 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 transition-colors group-hover:bg-amber-500 group-hover:text-white">
            <RetainerIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{dbSummary.totalActivePekerjaan}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Pekerjaan Aktif</p>
          </div>
        </Link>

        <Link ref={metric3Ref} href="/progress-pekerjaan" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-855 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
            <PageIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{dbSummary.totalCompletedPekerjaan}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Pekerjaan Selesai</p>
          </div>
        </Link>

        <Link ref={metric4Ref} href="/narasumber-hukum" className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-gray-855 dark:bg-gray-900 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] hover:border-brand-500 hover:shadow-md group cursor-pointer">
          <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white">
            <PageIcon />
          </div>
          <div className="overflow-hidden">
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-none mb-0.5">{dbSummary.totalArsipDokumen}</h3>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">Arsip Dokumen</p>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        <div ref={middleLeftRef} className="lg:col-span-7 flex flex-col">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-850 dark:bg-gray-900 flex-1 flex flex-col justify-between max-h-[350px] min-h-[350px]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-hidden">
              
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Agenda Terdekat
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
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tidak ada agenda.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full overflow-hidden border-t md:border-t-0 md:border-l border-gray-150 dark:border-gray-800 md:pl-6 pt-4 md:pt-0">
                <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-red-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Tugas Aktif
                    </h2>
                  </div>
                  <Link href="/catatan-pribadi" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
                </div>
                
                <div className="space-y-2 overflow-y-auto pr-1 flex-1 no-scrollbar">
                  {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
                  ) : todayQ1Tasks.length > 0 ? (
                    todayQ1Tasks.map((task, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-55/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg font-black text-[9px] bg-red-50 text-red-500 dark:bg-red-950/20">
                            Q1
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-[11px] font-bold text-gray-905 dark:text-white leading-snug truncate" title={task.task}>
                              {task.task}
                            </h4>
                            <div className="text-[9px] text-gray-400 mt-0.5 flex items-center gap-2 font-semibold uppercase tracking-wider">
                              {task.completed ? (
                                <span className="text-emerald-555 font-black uppercase tracking-widest text-[8px]">Selesai</span>
                              ) : (
                                <span className="text-red-555 font-black uppercase tracking-widest text-[8px]">On Duty</span>
                              )}
                            </div>
                          </div>
                        </div>
                        {!task.completed && (
                          <button
                            onClick={() => {
                              setSelectedTask({
                                id: task.id,
                                title: task.task,
                                priority: "Q1",
                              });
                              setCompleteStartTime("09:00");
                              setCompleteEndTime("10:00");
                              setCompleteKeterangan("");
                              setCompleteCatatan("");
                              setCompleteFile(null);
                              setCompleteModalOpen(true);
                            }}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[6px] text-[8px] font-black uppercase tracking-wider transition-all shadow cursor-pointer active:scale-95 flex-shrink-0"
                          >
                            Selesai
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tidak ada tugas aktif Q1 hari ini.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div ref={middleRightRef} className="lg:col-span-5 flex flex-col justify-between max-h-[350px] min-h-[350px] space-y-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        <div ref={bottomLeftRef} className="lg:col-span-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[420px] max-h-[520px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-2 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider font-bold">Laporan Kerja</h2>
              </div>
            </div>
            
            <div className="flex-1 min-w-[500px] overflow-x-auto overflow-y-auto no-scrollbar">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-800 text-gray-400 uppercase tracking-wider font-bold">
                    <th className="pb-1.5 w-8">No</th>
                    <th className="pb-1.5 w-48">Klien/Pekerjaan</th>
                    <th className="pb-1.5 w-16">Prioritas</th>
                    <th className="pb-1.5 w-32">Batas</th>
                    <th className="pb-1.5 w-24 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                  {personalTasks.length > 0 ? (
                    personalTasks.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.002]">
                        <td className="py-2.5 font-bold text-gray-450">{idx + 1}</td>
                        <td className="py-2.5 font-bold text-gray-905 dark:text-white truncate max-w-[180px]" title={item.title}>
                          {item.title || "-"}
                        </td>
                        <td className="py-2.5">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            item.priority === "Q1" ? "text-red-650 bg-red-50 dark:bg-red-950/20" :
                            item.priority === "Q2" ? "text-blue-650 bg-blue-50 dark:bg-blue-950/20" :
                            "text-gray-650 bg-gray-55 dark:bg-white/[0.03]"
                          }`}>{item.priority || "Q3"}</span>
                        </td>
                        <td className="py-2.5 font-bold text-brand-500">
                          {item.endDate ? formatDateIndoCapitalized(item.endDate) : "-"}
                        </td>
                        <td className="py-2.5 text-right">
                          {item.status === "COMPLETED" ? (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-[5px] text-[8px] font-black uppercase tracking-widest border border-emerald-500/10">Selesai</span>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTask(item);
                                setCompleteStartTime("09:00");
                                setCompleteEndTime("10:00");
                                setCompleteKeterangan("");
                                setCompleteCatatan("");
                                setCompleteFile(null);
                                setCompleteModalOpen(true);
                              }}
                              className="px-2 py-1 bg-brand-500 hover:bg-brand-600 text-white rounded-[6px] text-[8px] font-black uppercase tracking-wider transition-all shadow active:scale-95 cursor-pointer"
                            >
                              Selesaikan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 italic">Tidak ada skala prioritas pribadi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div ref={bottomRightRef} className="lg:col-span-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[420px] max-h-[520px] flex flex-col overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-hidden">
              
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 dark:border-gray-800 flex-shrink-0">
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
                      <button
                        key={ann.id}
                        type="button"
                        onClick={() => setSelectedAnnouncement(ann)}
                        className="w-full text-left p-2.5 rounded-xl border border-gray-155 dark:border-gray-800 bg-gray-50/20 dark:bg-white/[0.002] flex justify-between items-start gap-3 hover:border-brand-500 transition-all"
                      >
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
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-[9px] text-gray-400 font-bold uppercase italic">Tidak ada pengumuman.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col h-full overflow-hidden border-t md:border-t-0 md:border-l border-gray-150 dark:border-gray-800 md:pl-4 pt-3 md:pt-0">
                <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2 dark:border-gray-800 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-violet-500 rounded-full"></span>
                    <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                      Akses Cepat
                    </h2>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 flex-1 items-center">
                  {quickAccessItems.filter((item) => item.show).length > 0 ? (
                    quickAccessItems.filter((item) => item.show).map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center p-2 text-center border border-gray-100 dark:border-gray-850 bg-gray-50/50 dark:bg-white/[0.005] hover:border-brand-500 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] group h-12"
                      >
                        <span className="text-[9px] font-black text-gray-800 dark:text-gray-200 group-hover:text-brand-500 uppercase tracking-wider">
                          {item.label}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-2 py-6 text-center text-[10px] font-black uppercase tracking-wider text-gray-400">
                      Tidak ada shortcut tersedia.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" suppressHydrationWarning>
        <div ref={recentKlienRef} className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-850 dark:bg-gray-900 min-h-[300px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider font-bold">
                  Kontak Klien Terbaru
                </h2>
              </div>
              <Link href="/daftar-potensi-klien" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
              ) : recentCalonKlien.length > 0 ? (
                recentCalonKlien.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group">
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors leading-snug truncate">
                        {item.namaProspek}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-0.5 truncate font-semibold uppercase tracking-wider">
                        {item.potensiPekerjaan || "Belum ada keterangan perkara"}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-brand-500 flex-shrink-0">
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Belum ada potensi klien baru.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div ref={recentArsipRef} className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-855 dark:bg-gray-900 min-h-[300px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-brand-500 rounded-full"></span>
                <h2 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider font-bold">
                  Arsip Berkas Terbaru
                </h2>
              </div>
              <Link href="/narasumber-hukum" className="text-brand-500 font-black hover:underline text-[9px] uppercase tracking-wider">Semua</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2">
              {loading ? (
                [1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 dark:bg-gray-800/40 rounded-xl animate-pulse"></div>)
              ) : recentArsipFiles.length > 0 ? (
                recentArsipFiles.map((item, idx) => (
                  <a
                    key={item.id || idx}
                    href={item.webViewLink || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-gray-105 dark:border-gray-800 hover:bg-gray-55/50 dark:hover:bg-white/[0.005] hover:border-brand-500/30 transition-all group cursor-pointer"
                  >
                    <div className="overflow-hidden">
                      <h4 className="text-[11px] font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors leading-snug truncate">
                        {item.customName || item.name}
                      </h4>
                      <p className="text-[9px] text-gray-400 mt-0.5 truncate font-semibold uppercase tracking-wider">
                        {item.pt ? `Asosiasi: ${item.pt}` : "Arsip Umum"}
                      </p>
                    </div>
                    <span className="text-[9px] font-bold text-brand-500 flex-shrink-0">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) : "-"}
                    </span>
                  </a>
                ))
              ) : (
                <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/20">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Belum ada berkas arsip baru.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Completion Modal */}
      <FeatureModal
        isOpen={completeModalOpen}
        onClose={() => setCompleteModalOpen(false)}
        title="Selesaikan Pekerjaan"
        subtitle="Selesaikan tugas aktif ini dan catat langsung ke Laporan Harian Anda."
        icon={<PageIcon />}
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Nama Pekerjaan</label>
            <div className="w-full bg-gray-100 dark:bg-gray-800/80 px-4 py-3 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300">
              {selectedTask ? (selectedTask.namaKlien || selectedTask.deskripsi || selectedTask.tugas || selectedTask.title) : ""}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Jam Mulai</label>
              <input
                type="time"
                required
                value={completeStartTime}
                onChange={(e) => setCompleteStartTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-black dark:text-white outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Jam Selesai</label>
              <input
                type="time"
                required
                value={completeEndTime}
                onChange={(e) => setCompleteEndTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-bold text-black dark:text-white outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Keterangan (Wajib)</label>
            <textarea
              required
              rows={2}
              value={completeKeterangan}
              onChange={(e) => setCompleteKeterangan(e.target.value)}
              placeholder="Deskripsi pengerjaan..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-black dark:text-white outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Catatan (Opsional)</label>
            <textarea
              rows={2}
              value={completeCatatan}
              onChange={(e) => setCompleteCatatan(e.target.value)}
              placeholder="Catatan tambahan pengerjaan..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2.5 text-xs font-semibold text-black dark:text-white outline-none focus:border-brand-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 mb-1.5">Unggah Berkas Pendukung (Opsional)</label>
            <div className="relative">
              <input
                type="file"
                id="complete-file-upload"
                onChange={handleCompleteFileUpload}
                className="hidden"
              />
              <label
                htmlFor="complete-file-upload"
                className={`w-full text-center border border-dashed border-gray-300 dark:border-gray-700 py-3 rounded-xl text-xs font-bold text-gray-500 hover:border-brand-500 cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  completeUploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                <span>{completeUploading ? "Mengunggah..." : completeFile ? `✓ ${completeFile.name}` : "Upload Berkas Ke Google Drive"}</span>
                {completeUploading && (
                  <div className="w-11/12 bg-gray-250 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1 relative">
                    <div className="bg-brand-500 h-full w-[70%] animate-pulse transition-all duration-1000"></div>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-brand-500 text-white py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all cursor-pointer shadow-md"
          >
            Selesaikan & Catat Laporan
          </button>
        </form>
      </FeatureModal>

    </div>
  );
}
