"use client";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UploadDropdown from "@/components/header/UploadDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { APP_LABELS } from "../config/app-labels";

const STATIC_MENUS = [
  { name: "Dashboard Utama", category: "Menu", path: "/", description: "Ringkasan kegiatan operasional kantor hari ini" },
  { name: "Kalender", category: "Menu", path: "/calendar", description: "Atur dan lihat kegiatan atau agenda kerja anda" },
  { name: "Kontak klien", category: "Menu", path: "/daftar-potensi-klien", description: "Daftar prospek, klien, dan interaksi klien" },
  { name: "Dokumentasi", category: "Menu", path: "/dokumentasi", description: "Panduan operasional dan dokumentasi sistem" },
  { name: "Pengumuman", category: "Menu", path: "/pengumuman", description: "Daftar pengumuman internal kantor hukum" },
  { name: "Arsip", category: "Manajemen Arsip", path: "/narasumber-hukum", description: "Manajemen folder dan arsip dokumen Google Drive" },
  { name: "Pekerjaan Retainer", category: "Pekerjaan", path: "/retainer", description: "Daftar pekerjaan berstatus Retainer" },
  { name: "Pekerjaan Perorangan", category: "Pekerjaan", path: "/perorangan", description: "Daftar pekerjaan perorangan (Non-Retainer)" },
  { name: "Daftar Karyawan", category: "Karyawan", path: "/karyawan", description: "Daftar karyawan dan tim resmi Narasumber Hukum" },
  { name: "Skala Prioritas", category: "Karyawan", path: "/skala-prioritas", description: "Status skala prioritas kerja tim" },
  { name: "Surat Internal", category: "Karyawan", path: "/internal", description: "Arsip surat keluar masuk internal kantor" },
  { name: "Dashboard HRM", category: "HRM", path: "/hrm", description: "Overview rekrutmen dan data pelamar kerja" },
  { name: "HRM: Data Pelamar", category: "HRM", path: "/hrm/pelamar", description: "Daftar pelamar rekrutmen staff baru" },
  { name: "HRM: Dokumen Pelamar", category: "HRM", path: "/hrm/dokumen", description: "Berkas dan CV pelamar kerja" },
  { name: "HRM: Daftar Karyawan", category: "HRM", path: "/hrm/karyawan", description: "Data administrasi karyawan HRM" },
  { name: "HRM: Daftar Retainer", category: "HRM", path: "/hrm/retainer", description: "Monitoring status retainer klien" },
  { name: "Dashboard Legal", category: "Legal & Compliance", path: "/legal/overview", description: "Overview layanan hukum dan kepatuhan" },
  { name: "Buat Surat Otomatis", category: "Legal & Compliance", path: "/legal/generate-surat", description: "Layanan automasi pembuatan surat legal" },
  { name: "Manajemen Template", category: "Legal & Compliance", path: "/legal/template-management", description: "Pengelolaan draf template surat otomatis" },
  { name: "Kadaluwarsa Kontrak", category: "Legal & Compliance", path: "/legal/expiry-monitoring", description: "Monitoring masa aktif kontrak dan retainer" },
  { name: "Manajemen Akses", category: "Admin", path: "/admin-control", description: "Konfigurasi role permission dan hak akses user" }
];

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [agendas, setAgendas] = useState<any[]>([]);
  const [karyawan, setKaryawan] = useState<any[]>([]);
  const [hasLoadedDynamic, setHasLoadedDynamic] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadDynamicSearchData = async () => {
    if (hasLoadedDynamic) return;
    try {
      const [agendaRes, karyawanRes] = await Promise.all([
        fetch("/api/agenda"),
        fetch("/api/karyawan")
      ]);
      if (agendaRes.ok) {
        const agendaData = await agendaRes.json();
        setAgendas(agendaData);
      }
      if (karyawanRes.ok) {
        const karyawanData = await karyawanRes.json();
        setKaryawan(karyawanData);
      }
      setHasLoadedDynamic(true);
    } catch (err) {
      console.error("Failed to load search dynamic data:", err);
    }
  };

  const filteredMenus = STATIC_MENUS.filter(menu =>
    menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    menu.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgendas = agendas.filter(evt =>
    evt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (evt.description && evt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredKaryawan = karyawan.filter(k =>
    k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.position && k.position.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const hasResults = filteredMenus.length > 0 || filteredAgendas.length > 0 || filteredKaryawan.length > 0;


  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname.startsWith("/hrm/pelamar")) return APP_LABELS.header.titles.dataPelamar;
    if (pathname.startsWith("/hrm/dokumen")) return APP_LABELS.header.titles.dokumenPelamar;
    if (pathname.startsWith("/hrm/retainer")) return APP_LABELS.header.titles.daftarRetainerHrm;
    if (pathname.startsWith("/hrm")) return APP_LABELS.header.titles.dashboardHrm;
    
    switch (pathname) {
      case "/": return APP_LABELS.header.titles.dashboard;
      case "/calendar": return APP_LABELS.header.titles.calendar;
      case "/dokumentasi": return APP_LABELS.header.titles.dokumentasi;
      case "/pengumuman": return APP_LABELS.header.titles.pengumuman;
      case "/retainer": return APP_LABELS.header.titles.retainer;
      case "/perorangan": return APP_LABELS.header.titles.perorangan;
      case "/karyawan": return APP_LABELS.header.titles.daftarKaryawan;
      case "/skala-prioritas": return APP_LABELS.header.titles.skalaPrioritas;
      case "/internal": return APP_LABELS.header.titles.suratInternal;
      case "/narasumber-hukum": return "Arsip";
      case "/progress-pekerjaan": return "Pekerjaan aktif";
      default: return APP_LABELS.header.titles.default;
    }
  };

  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-40 dark:border-gray-800 dark:bg-gray-900 lg:border-b print:hidden">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg z-99999 dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="12"
                viewBox="0 0 16 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {/* Cross Icon */}
          </button>

          <Link href="/" className="lg:hidden">
            <Image
              width={40}
              height={40}
              src="/images/logo/logo-law.png"
              alt="Logo"
            />

          </Link>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg z-99999 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div className="hidden lg:flex items-center">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
              {getPageTitle()}
            </h1>
          </div>
        </div>
        <div
          className={`${
            isApplicationMenuOpen ? "flex" : "hidden"
          } items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          {/* Global Search Bar */}
          <div ref={searchContainerRef} className="relative w-full max-w-[320px] hidden sm:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari menu, fitur, atau isi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  setIsSearchFocused(true);
                  loadDynamicSearchData();
                }}
                className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-gray-400 dark:placeholder-gray-500"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            
            {/* Search Results Dropdown Overlay */}
            {isSearchFocused && (
              <div className="absolute right-0 mt-2 w-[450px] bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-2xl shadow-2xl p-4 z-99999 max-h-[450px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                {!searchQuery ? (
                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black uppercase tracking-wider text-gray-400">Pencarian Populer</h6>
                    <div className="grid grid-cols-2 gap-2">
                      {STATIC_MENUS.slice(0, 6).map((menu) => (
                        <Link
                          key={menu.path}
                          href={menu.path}
                          onClick={() => setIsSearchFocused(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{menu.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Menus Section */}
                    {filteredMenus.length > 0 && (
                      <div>
                        <h6 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Menu & Fitur ({filteredMenus.length})</h6>
                        <div className="space-y-1">
                          {filteredMenus.map((menu) => (
                            <Link
                              key={menu.path}
                              href={menu.path}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex flex-col p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                            >
                              <span className="text-xs font-bold text-black dark:text-white">{menu.name}</span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{menu.description}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Agendas Section */}
                    {filteredAgendas.length > 0 && (
                      <div>
                        <h6 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Agenda & Kegiatan ({filteredAgendas.length})</h6>
                        <div className="space-y-1">
                          {filteredAgendas.map((evt) => (
                            <Link
                              key={evt.id}
                              href={`/calendar?eventId=${evt.id}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex flex-col p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                            >
                              <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                {evt.title}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                PIC: {evt.pic || "-"} &bull; {new Date(evt.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Karyawan Section */}
                    {filteredKaryawan.length > 0 && (
                      <div>
                        <h6 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-2">Karyawan & Staff ({filteredKaryawan.length})</h6>
                        <div className="space-y-1">
                          {filteredKaryawan.map((k) => (
                            <Link
                              key={k.id}
                              href={`/karyawan?search=${encodeURIComponent(k.name)}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex flex-col p-2 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-xl transition-all"
                            >
                              <span className="text-xs font-bold text-black dark:text-white flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                {k.name}
                              </span>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                {k.position} &bull; {k.email || "-"}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {!hasResults && (
                      <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                        Tidak menemukan hasil pencarian untuk "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 2xsm:gap-3">
            {/* <!-- Dark Mode Toggler --> */}
            <ThemeToggleButton />
            {/* <!-- Dark Mode Toggler --> */}

           <UploadDropdown />
           <NotificationDropdown /> 
            {/* <!-- Notification Menu Area --> */}
          </div>
          {/* <!-- User Area --> */}
          <UserDropdown /> 
    
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
