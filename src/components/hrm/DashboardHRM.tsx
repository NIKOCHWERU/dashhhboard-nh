"use client";
import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CalenderIcon, GroupIcon, PageIcon } from "@/icons";
import { RetainerIcon } from "@/icons/MenuIcons";
import { FeatureModal } from "@/components/common/FeatureModal";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface Employee {
  id: string;
  name: string;
  position: string;
  email: string | null;
  phone: string | null;
  status: string;
  pt: string | null;
}

export default function DashboardHRM() {
  const [data, setData] = useState<any>(null);
  const [pt, setPt] = useState("Semua PT");
  const [ptList, setPtList] = useState<string[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals / Interactive states
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Fetch employee lists to build payroll directory
  useEffect(() => {
    fetch("/api/karyawan")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEmployees(data);
        }
      })
      .catch((err) => console.error("Error loading employees for payroll:", err));
  }, []);

  if (!data) return (
    <div className="flex h-[400px] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-500"></div>
    </div>
  );

  const barChartOptions: any = {
    chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
    colors: ['#A67C00'],
    xaxis: { categories: data.barChart?.labels || [], labels: { style: { colors: '#9CA3AF' } } },
    yaxis: { labels: { style: { colors: '#9CA3AF' } } },
    theme: { mode: 'light' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '30%' } },
    dataLabels: { enabled: false },
    grid: { borderColor: 'rgba(156, 163, 175, 0.1)' }
  };

  const donutOptions: any = {
    chart: { type: 'donut', background: 'transparent' },
    labels: data.donutChart?.labels || [],
    theme: { mode: 'light' },
    stroke: { show: false },
    colors: ['#A67C00', '#B8860B', '#C5A059', '#D4AF37', '#E5C158'],
    legend: { position: 'bottom', labels: { colors: '#9CA3AF' } }
  };

  const statCards = [
    { label: "Total Karyawan Aktif", value: `${data.totalKaryawan} Orang`, icon: <GroupIcon />, color: "bg-brand-500" },
    { label: "Total Resign", value: `${data.totalResign} Orang`, icon: <PageIcon />, color: "bg-red-500" },
    { label: "Rata-rata KPI", value: `${data.avgKpi} / 5.0`, icon: <CalenderIcon />, color: "bg-orange-500" },
    { label: "Total Payroll", value: `Rp ${data.totalPayroll.toLocaleString('id-ID')}`, icon: <RetainerIcon />, color: "bg-emerald-500" },
  ];

  // Derive salary parameters based on employee position
  const getSalaryDetails = (emp: Employee) => {
    const pos = (emp.position || "Staff").toUpperCase();
    let gapok = 7500000;
    let tunjangan = 1500000;
    let potongan = 350000;

    if (pos.includes("PARTNER") || pos.includes("PIMPINAN")) {
      gapok = 32000000;
      tunjangan = 6500000;
      potongan = 1500000;
    } else if (pos.includes("LAWYER") || pos.includes("LEGAL")) {
      gapok = 16500000;
      tunjangan = 2500000;
      potongan = 750000;
    } else if (pos.includes("ADMIN") || pos.includes("OPERASIONAL")) {
      gapok = 8500000;
      tunjangan = 1200000;
      potongan = 400000;
    } else if (pos.includes("ASSOCIATE")) {
      gapok = 12000000;
      tunjangan = 2000000;
      potongan = 600000;
    }

    return {
      gapok,
      tunjangan,
      potongan,
      total: gapok + tunjangan - potongan,
    };
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesPT = pt === "Semua PT" || emp.pt === pt;
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (emp.position && emp.position.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPT && matchesSearch;
  });

  const handleProcessPayroll = () => {
    setIsProcessing(true);
    setProcessingStep(1);
    
    // Simulate steps
    setTimeout(() => setProcessingStep(2), 1500);
    setTimeout(() => setProcessingStep(3), 3000);
    setTimeout(() => {
      setProcessingStep(4);
      setIsProcessing(false);
    }, 4500);
  };

  const getMonthYearString = () => {
    const date = new Date();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-stroke dark:border-strokedark gap-4">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white leading-tight uppercase tracking-wider">HRM Summary & Control</h2>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Ringkasan performa, data kepegawaian, dan pengontrol payroll terintegrasi</p>
        </div>
        <select 
          className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white text-gray-700 dark:bg-gray-900 dark:text-white outline-none focus:border-brand-500 transition-colors cursor-pointer shadow-sm text-xs font-black uppercase tracking-wider"
          value={pt}
          onChange={e => setPt(e.target.value)}
        >
          <option value="Semua PT">Semua Perusahaan (PT)</option>
          {ptList.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02] flex items-center gap-4 transition-all hover:border-brand-500 group">
            <div className={`h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-full ${stat.color} text-white scale-90`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white leading-none mb-1 uppercase">{stat.value}</h3>
              <p className="text-[9px] font-black text-gray-405 dark:text-gray-450 uppercase tracking-wider truncate">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Layout - Side by Side and Compact Height (220px) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* KPI Skor Chart */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-150 pb-3 dark:border-gray-850">
              <span className="w-1.5 h-4 bg-brand-500 rounded-none"></span>
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Skor KPI Karyawan</h3>
            </div>
            <div className="h-[220px]">
               {data.barChart && typeof window !== 'undefined' && <ReactApexChart options={barChartOptions} series={[{name: 'Skor KPI', data: data.barChart.data}]} type="bar" height={220} />}
            </div>
          </div>
        </div>

        {/* KPI Distribution Chart */}
        <div className="lg:col-span-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4 border-b border-gray-150 pb-3 dark:border-gray-850">
              <span className="w-1.5 h-4 bg-brand-500 rounded-none"></span>
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">Distribusi KPI</h3>
            </div>
            <div className="h-[220px] flex items-center justify-center">
               {data.donutChart && typeof window !== 'undefined' && <ReactApexChart options={donutOptions} series={data.donutChart.data} type="donut" height={200} />}
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Control Center Panel */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02] shadow-xl p-5 space-y-4">
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-150 dark:border-gray-850 gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Gaji & Payroll Karyawan</h3>
          </div>
          <button
            onClick={() => {
              setProcessingStep(0);
              setProcessModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            Proses Payroll Bulanan
          </button>
        </div>

        {/* Directory Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari karyawan / jabatan..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 transition-colors text-xs font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Periode Gaji: <span className="text-black dark:text-white font-black">{getMonthYearString()}</span>
          </span>
        </div>

        {/* Payroll Table */}
        <div className="border border-gray-100 dark:border-gray-850 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800 text-[10px] font-bold text-gray-405 uppercase tracking-widest bg-gray-50/25 dark:bg-white/[0.01]">
                  <th className="p-3.5 pl-6">Karyawan</th>
                  <th className="p-3.5">Rekening Bank</th>
                  <th className="p-3.5">Gaji Pokok</th>
                  <th className="p-3.5">Tunjangan</th>
                  <th className="p-3.5">Potongan</th>
                  <th className="p-3.5">Total Diterima</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800 text-gray-750 dark:text-gray-300">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400 italic">
                      Tidak ada karyawan untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => {
                    const sal = getSalaryDetails(emp);
                    return (
                      <tr key={emp.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors">
                        <td className="p-3.5 pl-6">
                          <div>
                            <span className="font-bold text-black dark:text-white uppercase block">{emp.name}</span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase block tracking-wider mt-0.5">{emp.position || "Staff"}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-medium text-gray-600 dark:text-gray-400">
                            BCA 8021••••
                          </span>
                        </td>
                        <td className="p-3.5 font-bold">
                          Rp {sal.gapok.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          +Rp {sal.tunjangan.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 text-red-500 dark:text-red-400 font-semibold">
                          -Rp {sal.potongan.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5 font-black text-black dark:text-white">
                          Rp {sal.total.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[9px] tracking-wider rounded-md border border-emerald-500/20">
                            Paid
                          </span>
                        </td>
                        <td className="p-3.5 pr-6 text-right">
                          <button
                            onClick={() => setSelectedSlip({ emp, sal })}
                            className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                          >
                            Slip Gaji
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: DETAIL SLIP GAJI */}
      <FeatureModal
        isOpen={selectedSlip !== null}
        onClose={() => setSelectedSlip(null)}
        title="Slip Gaji Resmi"
        subtitle="Rincian pembayaran gaji bulanan resmi kantor hukum NH"
      >
        {selectedSlip && (
          <div className="space-y-6 pt-2">
            
            {/* Slip Header */}
            <div className="text-center pb-4 border-b border-gray-150 dark:border-gray-800">
              <h4 className="text-base font-black text-black dark:text-white uppercase tracking-wider">Narasumber Hukum (NH)</h4>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">Slip Gaji Bulanan Karyawan</p>
              <span className="inline-block mt-3 px-3 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-black uppercase tracking-wider rounded-full">
                Periode: {getMonthYearString()}
              </span>
            </div>

            {/* Employee details */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-150 dark:border-gray-800">
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Penerima</span>
                <span className="block font-bold text-black dark:text-white mt-1 uppercase">{selectedSlip.emp.name}</span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Jabatan / Posisi</span>
                <span className="block font-bold text-black dark:text-white mt-1 uppercase">{selectedSlip.emp.position || "Staff"}</span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Rekening Tujuan</span>
                <span className="block font-medium text-gray-600 dark:text-gray-400 mt-1">BCA 8021•••• (a.n. {selectedSlip.emp.name})</span>
              </div>
              <div>
                <span className="block text-[9px] font-black text-gray-400 uppercase tracking-widest">Perusahaan (PT)</span>
                <span className="block font-bold text-brand-500 mt-1 uppercase">{selectedSlip.emp.pt || "NH Law Firm"}</span>
              </div>
            </div>

            {/* Income breakdown */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-black text-brand-500 uppercase tracking-wider border-b border-gray-150 pb-1.5 dark:border-gray-800">Rincian Penerimaan & Potongan</h5>
              <div className="space-y-2 text-xs">
                
                {/* Income */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">1. Gaji Pokok</span>
                  <span className="font-bold text-black dark:text-white">Rp {selectedSlip.sal.gapok.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 font-medium">2. Tunjangan & Lembur</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">+Rp {selectedSlip.sal.tunjangan.toLocaleString("id-ID")}</span>
                </div>

                {/* Deductions */}
                <div className="flex justify-between items-center py-1 border-t border-dashed border-gray-150 dark:border-gray-800 mt-1 pt-2">
                  <span className="text-gray-500 font-medium">3. Potongan Kesehatan / BPJS</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">-Rp {selectedSlip.sal.potongan.toLocaleString("id-ID")}</span>
                </div>

                {/* Net Income */}
                <div className="flex justify-between items-center py-3 border-t-2 border-gray-250 dark:border-gray-750 bg-brand-500/5 px-3 rounded-lg mt-4">
                  <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">Total Diterima (Net)</span>
                  <span className="text-sm font-black text-black dark:text-white">Rp {selectedSlip.sal.total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Signatures & Actions */}
            <div className="flex justify-between items-end pt-4 border-t border-gray-150 dark:border-gray-800">
              <div className="text-[10px] text-gray-400 italic">
                Slip ini diproses secara digital dan sah.
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedSlip(null)}
                  className="px-4 py-2 border border-gray-250 dark:border-gray-800 text-xs font-bold rounded-lg text-gray-550 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Tutup
                </button>
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase rounded-lg tracking-wider transition-colors shadow-md"
                >
                  Cetak Slip
                </button>
              </div>
            </div>
          </div>
        )}
      </FeatureModal>

      {/* MODAL: PROSES PAYROLL BULANAN */}
      <FeatureModal
        isOpen={processModalOpen}
        onClose={() => !isProcessing && setProcessModalOpen(false)}
        title="Prosedur Payroll Bulanan"
        subtitle="Proses kalkulasi dan transfer gaji secara massal untuk seluruh staf"
      >
        <div className="space-y-6 pt-2">
          {processingStep === 0 ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879-.659c1.546-1.248 3.655-1.248 5.201 0l.879.66M7 11.24c.776-.714 1.942-1.14 3.167-1.14H14c1.23 0 2.397.426 3.167 1.14m-10.22 3.86c.776.714 1.942 1.14 3.167 1.14H14c1.23 0 2.397-.426 3.167-1.14" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">Mulai Proses Transfer Payroll?</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  Sistem akan secara otomatis memverifikasi absensi, menghitung KPI Karyawan, menyinkronkan BPJS, dan mentransfer dana ke rekening masing-masing staf.
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl text-left border border-gray-150 dark:border-gray-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Karyawan Penerima:</span>
                  <span className="font-bold text-black dark:text-white">{employees.length} Orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Periode Anggaran:</span>
                  <span className="font-bold text-black dark:text-white uppercase">{getMonthYearString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-800 pt-2 font-bold text-brand-500">
                  <span>Estimasi Pengeluaran Payroll:</span>
                  <span>Rp {data.totalPayroll ? data.totalPayroll.toLocaleString("id-ID") : "125.000.000"}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setProcessModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-250 dark:border-gray-800 text-xs font-bold rounded-lg text-gray-550 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayroll}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-lg tracking-wider transition-colors shadow-md active:scale-95"
                >
                  Ya, Proses Payroll
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Steps simulation layout */}
              <div className="space-y-4">
                
                {/* Step 1 */}
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    processingStep >= 1 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}>
                    {processingStep > 1 ? "✓" : "1"}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${processingStep >= 1 ? "text-black dark:text-white" : "text-gray-400"}`}>
                      Verifikasi Data Absensi & Lembur
                    </p>
                    {processingStep === 1 && <span className="text-[10px] text-brand-500 animate-pulse font-medium">Memverifikasi 120+ log kehadiran...</span>}
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    processingStep >= 2 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}>
                    {processingStep > 2 ? "✓" : "2"}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${processingStep >= 2 ? "text-black dark:text-white" : "text-gray-400"}`}>
                      Kalkulasi Potongan BPJS & Bonus KPI
                    </p>
                    {processingStep === 2 && <span className="text-[10px] text-brand-500 animate-pulse font-medium">Menyesuaikan denda & bonus KPI...</span>}
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    processingStep >= 3 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}>
                    {processingStep > 3 ? "✓" : "3"}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${processingStep >= 3 ? "text-black dark:text-white" : "text-gray-400"}`}>
                      Penyaluran via Bank Gateway API
                    </p>
                    {processingStep === 3 && <span className="text-[10px] text-brand-500 animate-pulse font-medium">Menghubungkan ke API Bank BCA & Mandiri...</span>}
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-center gap-3 text-xs">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    processingStep >= 4 ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                  }`}>
                    {processingStep > 4 ? "✓" : "4"}
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold ${processingStep >= 4 ? "text-black dark:text-white" : "text-gray-400"}`}>
                      Payroll Sukses Disalurkan!
                    </p>
                    {processingStep === 4 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% Gaji berhasil dikirimkan ke semua rekening.</span>}
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-500" 
                  style={{ width: `${(processingStep / 4) * 100}%` }}
                ></div>
              </div>

              {/* Action buttons */}
              {processingStep === 4 && (
                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setProcessModalOpen(false)}
                    className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-black uppercase rounded-lg tracking-wider transition-colors shadow-md"
                  >
                    Selesai & Tutup
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </FeatureModal>
    </div>
  );
}
