"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CalenderIcon, GroupIcon, PageIcon } from "@/icons";
import { DigitalClock, MiniCalendar } from "@/components/dashboard/DashboardWidgets";
import { RetainerIcon } from "@/icons/MenuIcons";

interface Agenda {
  id: string;
  title: string;
  startDate: string;
  pic: string;
  scale: string;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [allAgendas, setAllAgendas] = useState<Agenda[]>([]);
  const [displayAgendas, setDisplayAgendas] = useState<Agenda[]>([]);
  const [stats, setStats] = useState({
    agendaToday: 0,
    activeCases: 0,
    totalTeam: 0,
    retainerCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        // Fetch Agendas
        const resAgenda = await fetch("/api/agenda");
        const agendas = resAgenda.ok ? await resAgenda.json() : [];
        setAllAgendas(agendas);
        setDisplayAgendas(agendas.slice(0, 5));

        // Fetch Stats from other APIs
        const [resKaryawan, resRetainer, resPerorangan] = await Promise.all([
          fetch("/api/karyawan"),
          fetch("/api/retainer"),
          fetch("/api/perorangan")
        ]);

        const team = resKaryawan.ok ? await resKaryawan.json() : [];
        const retainers = resRetainer.ok ? await resRetainer.json() : [];
        const perorangan = resPerorangan.ok ? await resPerorangan.json() : [];

        setStats({
          agendaToday: agendas.filter((a: any) => new Date(a.startDate).toDateString() === new Date().toDateString()).length,
          activeCases: perorangan.filter((p: any) => p.status !== "Finished").length,
          totalTeam: team.length,
          retainerCount: retainers.length
        });

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  const statCards = [
    { label: "Agenda Hari Ini", value: stats.agendaToday, icon: <CalenderIcon />, color: "bg-brand-500" },
    { label: "Kasus Perorangan", value: stats.activeCases, icon: <PageIcon />, color: "bg-blue-500" },
    { label: "Project Retainer", value: stats.retainerCount, icon: <RetainerIcon />, color: "bg-orange-500" },
    { label: "Total Tim", value: stats.totalTeam, icon: <GroupIcon />, color: "bg-success-500" },
  ];

  return (
    <div className="space-y-4" suppressHydrationWarning>
      {/* Welcome Row - Compact */}
      <div className="flex items-end justify-between pb-2 border-b border-stroke dark:border-strokedark" suppressHydrationWarning>
        <div>
          <h1 className="text-xl font-bold text-black dark:text-white leading-tight">
            Selamat Datang, <span className="text-brand-500">{session?.user?.name || "User"}</span>
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            Sistem Manajemen DASHBOARD NH. Kelola seluruh berkas dan jadwal Anda.
          </p>
        </div>
        <div className="text-right hidden sm:block">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">NH Law Firm Management</span>
        </div>
      </div>

      {/* Stats Row - 4 Horizontal Mini Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" suppressHydrationWarning>
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-sm border border-stroke bg-white p-3 shadow-default dark:border-strokedark dark:bg-gray-900 flex items-center gap-3 transition-all hover:border-brand-500 group">
            <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full ${stat.color} text-white scale-75`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white leading-none mb-0.5">{stat.value}</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout: 7/5 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" suppressHydrationWarning>
        
        {/* LEFT COLUMN: Agendas (7/12) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-sm border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-gray-900 min-h-[450px]">
            <div className="flex items-center justify-between mb-5 border-b border-stroke pb-3 dark:border-strokedark">
              <div className="flex items-center gap-2">
                <span className="w-1 h-4 bg-brand-500 rounded-full"></span>
                <h2 className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                  {selectedDate ? `Agenda: ${selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}` : "Agenda Terdekat"}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)} className="text-[9px] text-red-500 font-bold hover:underline">Hapus Filter</button>
                )}
                <a href="/calendar" className="text-brand-500 font-bold hover:underline text-[10px]">Semua</a>
              </div>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                [1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>)
              ) : displayAgendas.length > 0 ? (
                displayAgendas.map(agenda => (
                  <div key={agenda.id} className="flex items-center justify-between p-3 rounded-sm border border-stroke dark:border-strokedark hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded bg-gray-50 dark:bg-gray-800 font-black text-[10px] ${
                        agenda.scale === 'Q1' ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {agenda.scale}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-black dark:text-white group-hover:text-brand-500 transition-colors leading-tight">{agenda.title}</h4>
                        <div className="text-[9px] text-gray-500 mt-1 flex items-center gap-2 font-medium">
                          <span>{new Date(agenda.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                          <span className="text-brand-500 font-bold uppercase">PIC: {agenda.pic}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <p className="text-[10px] text-gray-400 font-medium italic">Tidak ada agenda hukum untuk ditampilkan.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Clock & Calendar (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          <DigitalClock />
          <MiniCalendar 
            agendas={allAgendas} 
            onDateClick={setSelectedDate} 
            selectedDate={selectedDate}
          />
          
          <div className="rounded-sm border border-stroke bg-white px-5 py-3 shadow-default dark:border-strokedark dark:bg-gray-900 flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest">Status Keamanan</h4>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span className="font-bold text-success text-[10px] uppercase">Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
