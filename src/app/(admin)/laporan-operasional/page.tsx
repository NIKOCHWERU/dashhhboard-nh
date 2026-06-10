"use client";

import React, { useState, useEffect } from "react";
import * as xlsx from "xlsx";
import { APP_LABELS } from "@/config/app-labels";

interface ExcelRow {
  no: string;
  tanggal: string;
  quadran?: string;
  status: string;
  kategori?: string;
  deskripsi: string;
  tugas: string;
  area: string;
  keterangan: string;
  catatan: string;
  penanggungJawab: string;
  waktu?: string;
  namaKlien?: string;
}

type TabType = "RETAINER" | "NON_RETAINER" | "INTERNAL" | "LAPORAN_BERKALA";

export default function LaporanOperasionalPage() {
  const [activeTab, setActiveTab] = useState<TabType>("RETAINER");
  const [data, setData] = useState<ExcelRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [quadrantFilter, setQuadrantFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<keyof ExcelRow>("no");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Summary counts
  const [summary, setSummary] = useState({
    retainer: 0,
    nonRetainer: 0,
    internal: 0,
    laporanBerkala: 0,
  });

  const limit = 10;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam) {
        const upper = tabParam.toUpperCase();
        if (upper === "RETAINER" || upper === "NON_RETAINER" || upper === "INTERNAL" || upper === "LAPORAN_BERKALA") {
          setActiveTab(upper as TabType);
        }
      }
      const statusParam = params.get("status");
      if (statusParam) {
        setStatusFilter(statusParam);
      }
    }
    fetchSummary();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab, page, statusFilter, quadrantFilter, sortField, sortOrder]);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/laporan-operasional?summary=true");
      if (res.ok) {
        const counts = await res.json();
        setSummary(counts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let url = `/api/laporan-operasional?sheetName=${activeTab}&page=${page}&limit=${limit}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (quadrantFilter) {
        url += `&quadrant=${encodeURIComponent(quadrantFilter)}`;
      }
      if (sortField) {
        url += `&sortField=${sortField}&sortOrder=${sortOrder}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();

      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error(error);
      alert(APP_LABELS.common.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchData();
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(1);
    // Fetch data with empty search
    setTimeout(() => {
      fetchData();
    }, 0);
  };

  const handleSort = (field: keyof ExcelRow) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const handleExportExcel = async () => {
    try {
      // Fetch all matching data (without page limit) to export everything filtered
      let url = `/api/laporan-operasional?sheetName=${activeTab}&limit=5000`;
      if (search.trim()) url += `&search=${encodeURIComponent(search.trim())}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (quadrantFilter) url += `&quadrant=${encodeURIComponent(quadrantFilter)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const result = await res.json();
      const exportList: ExcelRow[] = result.data || [];

      if (exportList.length === 0) {
        alert(APP_LABELS.laporanOperasional.alerts.noExportData);
        return;
      }

      // Format data for sheet
      const wsData = exportList.map((item) => {
        const row: any = {
          "No": item.no,
          "Tanggal": item.tanggal,
        };
        if (item.waktu) row["Waktu"] = item.waktu;
        if (item.namaKlien) row["Nama Klien/Perusahaan"] = item.namaKlien;
        if (item.quadran) row["Kuadran"] = item.quadran;
        if (item.kategori) row["Kategori"] = item.kategori;
        row["Deskripsi"] = item.deskripsi;
        row["Tugas"] = item.tugas;
        row["Area"] = item.area;
        row["Status"] = item.status;
        row["Keterangan"] = item.keterangan;
        row["Catatan"] = item.catatan;
        row["Penanggung Jawab"] = item.penanggungJawab;
        return row;
      });

      const worksheet = xlsx.utils.json_to_sheet(wsData);
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, activeTab.substring(0, 30));
      xlsx.writeFile(workbook, `Laporan_${activeTab}_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e) {
      alert(APP_LABELS.laporanOperasional.alerts.exportFailed);
    }
  };

  const handleExportPDF = () => {
    // Simply trigger the browser print dialog which prints the page beautifully
    window.print();
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6 print:space-y-0 print:p-0">
      {/* SUMMARY PANEL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        {/* Retainer Card */}
        <div className="p-5 border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{APP_LABELS.laporanOperasional.summary.retainer}</span>
            <h2 className="text-2xl font-black text-black dark:text-white mt-1">{summary.retainer}</h2>
          </div>
          <div className="w-12 h-12 bg-brand-500/10 text-brand-500 rounded-xl flex items-center justify-center font-bold">
            R
          </div>
        </div>

        {/* Non Retainer Card */}
        <div className="p-5 border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{APP_LABELS.laporanOperasional.summary.nonRetainer}</span>
            <h2 className="text-2xl font-black text-black dark:text-white mt-1">{summary.nonRetainer}</h2>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center font-bold">
            NR
          </div>
        </div>

        {/* Internal Card */}
        <div className="p-5 border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{APP_LABELS.laporanOperasional.summary.internal}</span>
            <h2 className="text-2xl font-black text-black dark:text-white mt-1">{summary.internal}</h2>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center font-bold">
            IN
          </div>
        </div>

        {/* Laporan Berkala Card */}
        <div className="p-5 border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] rounded-2xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{APP_LABELS.laporanOperasional.summary.laporanBerkala}</span>
            <h2 className="text-2xl font-black text-black dark:text-white mt-1">{summary.laporanBerkala}</h2>
          </div>
          <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center font-bold">
            LB
          </div>
        </div>
      </div>

      {/* HEADER SECTION FOR PRINT */}
      <div className="hidden print:block pb-6 border-b border-gray-200">
        <h1 className="text-xl font-bold uppercase tracking-wider text-black">{APP_LABELS.laporanOperasional.printHeader}</h1>
        <p className="text-xs text-gray-500 mt-1">{APP_LABELS.laporanOperasional.printSubtext}{activeTab}{APP_LABELS.laporanOperasional.printSubtextDate}{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>

      {/* TAB SELECTOR */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 overflow-x-auto pb-px print:hidden">
        {(["RETAINER", "NON_RETAINER", "INTERNAL", "LAPORAN_BERKALA"] as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          let label = "";
          switch (tab) {
            case "RETAINER":
              label = APP_LABELS.laporanOperasional.tabs.retainer;
              break;
            case "NON_RETAINER":
              label = APP_LABELS.laporanOperasional.tabs.nonRetainer;
              break;
            case "INTERNAL":
              label = APP_LABELS.laporanOperasional.tabs.internal;
              break;
            case "LAPORAN_BERKALA":
              label = APP_LABELS.laporanOperasional.tabs.laporanBerkala;
              break;
          }
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setPage(1);
                setSearch("");
                setStatusFilter("");
                setQuadrantFilter("");
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? "border-brand-500 text-brand-500 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* SEARCH, FILTER & ACTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm print:hidden">
        {/* Search & Filters */}
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder={APP_LABELS.laporanOperasional.searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 transition-colors text-xs font-semibold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-605 font-black cursor-pointer text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-gray-300 outline-none focus:border-brand-500 text-xs font-black uppercase cursor-pointer"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{APP_LABELS.laporanOperasional.filters.allStatus}</option>
            <option value="Selesai">{APP_LABELS.laporanOperasional.filters.completed}</option>
            <option value="Aktif">{APP_LABELS.laporanOperasional.filters.active}</option>
            <option value="Pending">{APP_LABELS.laporanOperasional.filters.pending}</option>
          </select>

          {/* Quadrant Filter (Only if activeTab !== LAPORAN_BERKALA) */}
          {activeTab !== "LAPORAN_BERKALA" && (
            <select
              className="px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-transparent text-gray-700 dark:text-gray-300 outline-none focus:border-brand-500 text-xs font-black uppercase cursor-pointer"
              value={quadrantFilter}
              onChange={(e) => {
                setQuadrantFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{APP_LABELS.laporanOperasional.filters.allQuadrants}</option>
              <option value="Q1">{APP_LABELS.laporanOperasional.filters.q1Label}</option>
              <option value="Q2">{APP_LABELS.laporanOperasional.filters.q2Label}</option>
              <option value="Q3">{APP_LABELS.laporanOperasional.filters.q3Label}</option>
            </select>
          )}

          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-brand-600 transition-colors cursor-pointer"
          >
            {APP_LABELS.common.apply}
          </button>
        </form>

        {/* Export actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {APP_LABELS.common.exportExcel}
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-white hover:border-brand-500 rounded-xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-4 h-4 text-red-650" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            {APP_LABELS.common.printPDF}
          </button>
        </div>
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-6 h-6 rounded bg-gray-150 dark:bg-gray-800 flex-shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3.5 bg-gray-150 dark:bg-gray-800 rounded w-1/3"></div>
                  <div className="h-2.5 bg-gray-150 dark:bg-gray-800 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-xs text-gray-400 italic">
            {APP_LABELS.laporanOperasional.alerts.noData}
          </div>
        ) : (
          <div className="overflow-x-auto text-[13px]">
            <table className="w-full text-left border-collapse min-w-[900px] print:min-w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-405 uppercase tracking-widest bg-gray-50/20 dark:bg-white/[0.01]">
                  <th onClick={() => handleSort("no")} className="p-4 pl-6 cursor-pointer hover:text-brand-500 transition-colors w-16">
                    {APP_LABELS.laporanOperasional.table.no} {sortField === "no" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("tanggal")} className="p-4 cursor-pointer hover:text-brand-500 transition-colors w-28">
                    {APP_LABELS.laporanOperasional.table.tanggal} {sortField === "tanggal" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  {data[0]?.namaKlien !== undefined && (
                    <th onClick={() => handleSort("namaKlien")} className="p-4 cursor-pointer hover:text-brand-500 transition-colors">
                      {APP_LABELS.laporanOperasional.table.klien} {sortField === "namaKlien" && (sortOrder === "asc" ? "↑" : "↓")}
                    </th>
                  )}
                  {data[0]?.quadran !== undefined && (
                    <th className="p-4 w-20">{APP_LABELS.laporanOperasional.table.kuadran}</th>
                  )}
                  {data[0]?.kategori !== undefined && (
                    <th className="p-4 w-28">{APP_LABELS.laporanOperasional.table.kategori}</th>
                  )}
                  <th className="p-4">{APP_LABELS.laporanOperasional.table.deskripsi}</th>
                  <th className="p-4">{APP_LABELS.laporanOperasional.table.tugas}</th>
                  <th className="p-4 w-24">{APP_LABELS.laporanOperasional.table.area}</th>
                  <th className="p-4 w-24">{APP_LABELS.laporanOperasional.table.status}</th>
                  <th className="p-4">{APP_LABELS.laporanOperasional.table.keterangan}</th>
                  <th className="p-4">{APP_LABELS.laporanOperasional.table.pic}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                {data.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors print:hover:bg-transparent">
                    <td className="p-4 pl-6 font-bold text-black dark:text-white">{item.no}</td>
                    <td className="p-4 font-semibold">
                      {item.tanggal ? new Date(item.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      }) : "-"}
                    </td>
                    {item.namaKlien !== undefined && (
                      <td className="p-4 font-black uppercase text-[10px] text-brand-600 dark:text-brand-400">
                        {item.namaKlien}
                      </td>
                    )}
                    {item.quadran !== undefined && (
                      <td className="p-4">
                        <span className={`px-2 py-0.5 font-bold text-[9px] rounded-md border ${
                          item.quadran === "Q1"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : item.quadran === "Q2"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-gray-500/10 text-gray-600 border-gray-500/20"
                        }`}>
                          {item.quadran}
                        </span>
                      </td>
                    )}
                    {item.kategori !== undefined && (
                      <td className="p-4 text-gray-500 font-medium">{item.kategori}</td>
                    )}
                    <td className="p-4 font-semibold text-black dark:text-white max-w-[200px] truncate" title={item.deskripsi}>
                      {item.deskripsi}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400 max-w-[200px] truncate" title={item.tugas}>
                      {item.tugas}
                    </td>
                    <td className="p-4 font-medium">{item.area}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 font-black uppercase text-[9px] rounded-full border ${
                        item.status.toLowerCase() === "selesai"
                          ? "bg-green-500/10 text-green-600 border-green-500/20 dark:bg-green-500/20 dark:text-green-400"
                          : item.status.toLowerCase() === "aktif"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-450"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 max-w-[200px] truncate text-gray-400 font-medium" title={item.keterangan}>
                      {item.keterangan || "-"}
                    </td>
                    <td className="p-4 text-gray-500 font-bold uppercase text-[10px] whitespace-nowrap">
                      {item.penanggungJawab}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && data.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/30 dark:bg-white/[0.01] print:hidden">
            <span className="text-xs text-gray-500 font-medium">
              Menampilkan {data.length} dari {total} data
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                {APP_LABELS.common.back}
              </button>
              {[...Array(totalPages)].map((_, i) => {
                const p = i + 1;
                // Show pages dynamically around current page
                if (totalPages > 5 && Math.abs(page - p) > 2 && p !== 1 && p !== totalPages) {
                  if (p === 2 || p === totalPages - 1) {
                    return <span key={p} className="px-1 text-gray-400">...</span>;
                  }
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      page === p
                        ? "bg-brand-500 text-white"
                        : "border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer transition-colors"
              >
                {APP_LABELS.common.next}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
