"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CalenderIcon, GroupIcon, PageIcon } from "@/icons";
import { RetainerIcon } from "@/icons/MenuIcons";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function DashboardHRM() {
  const [data, setData] = useState<any>(null);
  const [pt, setPt] = useState("Semua PT");
  const [ptList, setPtList] = useState<string[]>([]);

  // Fetch unique PTs from registered Retainer contracts
  useEffect(() => {
    fetch("/api/retainer")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const names = Array.from(new Set(data.map((r) => r.clientName).filter(Boolean))) as string[];
          setPtList(names.sort());
        }
      })
      .catch((err) => console.error("Error loading PTs for dashboard select:", err));
  }, []);

  // Fetch metrics dynamically filtered by the selected PT
  useEffect(() => {
    fetch(`/api/hrm/dashboard?pt=${encodeURIComponent(pt)}`)
      .then((res) => res.json())
      .then(setData);
  }, [pt]);

  if (!data) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="animate-spin rounded-none h-12 w-12 border-b-2 border-brand-500"></div>
    </div>
  );

  const barChartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: ['#3b82f6'],
    xaxis: { categories: data.barChart?.labels || [], labels: { style: { colors: '#9CA3AF' } } },
    yaxis: { labels: { style: { colors: '#9CA3AF' } } },
    theme: { mode: 'light' },
    plotOptions: { bar: { borderRadius: 0, columnWidth: '40%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: 'rgba(156, 163, 175, 0.1)' }
  };

  const donutOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    labels: data.donutChart?.labels || [],
    theme: { mode: 'light' },
    stroke: { show: false },
    legend: { position: 'bottom', labels: { colors: '#9CA3AF' } }
  };

  const statCards = [
    { label: "Total Karyawan Aktif", value: `${data.totalKaryawan} Orang`, icon: <GroupIcon />, color: "bg-brand-500" },
    { label: "Total Resign", value: `${data.totalResign} Orang`, icon: <PageIcon />, color: "bg-red-500" },
    { label: "Rata-rata KPI", value: `${data.avgKpi} / 5.0`, icon: <CalenderIcon />, color: "bg-orange-500" },
    { label: "Total Payroll", value: `Rp ${data.totalPayroll.toLocaleString('id-ID')}`, icon: <RetainerIcon />, color: "bg-success-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome Row - Matching Main Dashboard welcome header */}
      <div className="flex items-end justify-between pb-2 border-b border-stroke dark:border-strokedark">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white leading-tight uppercase tracking-wider">HR Summary Dashboard</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Ringkasan performa dan data kepegawaian perusahaan secara terintegrasi</p>
        </div>
        <select 
          className="px-4 py-2 border border-stroke rounded-none bg-white text-gray-700 outline-none focus:border-brand-500 dark:bg-gray-900 dark:border-strokedark dark:text-white transition-colors cursor-pointer shadow-sm text-xs font-black uppercase tracking-wider"
          value={pt}
          onChange={e => setPt(e.target.value)}
        >
          <option value="Semua PT">Semua Perusahaan (PT)</option>
          {ptList.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Stats Row - Matching Main Dashboard Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-none border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-gray-900 flex items-center gap-4 transition-all hover:border-brand-500 group">
            <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full ${stat.color} text-white scale-75`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white leading-none mb-1 uppercase">{stat.value}</h3>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="rounded-none border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-5 border-b border-stroke pb-3 dark:border-strokedark">
              <span className="w-1 h-4 bg-brand-500 rounded-none"></span>
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Skor KPI Karyawan</h3>
            </div>
            <div className="h-[300px]">
               {data.barChart && typeof window !== 'undefined' && <ReactApexChart options={barChartOptions} series={[{name: 'Skor KPI', data: data.barChart.data}]} type="bar" height={300} />}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-none border border-stroke bg-white p-5 shadow-default dark:border-strokedark dark:bg-gray-900">
            <div className="flex items-center gap-2 mb-5 border-b border-stroke pb-3 dark:border-strokedark">
              <span className="w-1 h-4 bg-brand-500 rounded-none"></span>
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Distribusi KPI</h3>
            </div>
            <div className="h-[300px] flex items-center justify-center">
               {data.donutChart && typeof window !== 'undefined' && <ReactApexChart options={donutOptions} series={data.donutChart.data} type="donut" height={320} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
