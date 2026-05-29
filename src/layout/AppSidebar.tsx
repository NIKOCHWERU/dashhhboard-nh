"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { useSession } from "next-auth/react";
import {
  GridIcon,
  CalenderIcon,
  HorizontaLDots,
  ChevronDownIcon
} from "../icons/index";
import {
  DokumenIcon,
  DokumentasiIcon,
  PengumumanIcon,
  RetainerIcon,
  PeroranganIcon,
  KaryawanIcon,
  SkalaPrioritasIcon,
  CatatanIcon
} from "../icons/MenuIcons";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

type MenuGroups = {
  title: string;
  items: NavItem[];
};

const staticMenuGroups: MenuGroups[] = [
  {
    title: "Menu",
    items: [
      { name: "Dashboard", icon: <GridIcon />, path: "/" },
      { name: "Jadwal", icon: <CalenderIcon />, path: "/calendar" },
      { name: "Berkas", icon: <DokumenIcon />, path: "/dokumen" },
      { name: "Dokumentasi", icon: <DokumentasiIcon />, path: "/dokumentasi" },
      { name: "Pengumuman", icon: <PengumumanIcon />, path: "/pengumuman" },
    ],
  },
  {
    title: "NARASUMBER HUKUM",
    items: [
      { name: "Arsip NH", icon: <DokumenIcon />, path: "/narasumber-hukum" },
    ],
  },
  {
    title: "Project",
    items: [
      { name: "Retainer", icon: <RetainerIcon />, path: "/retainer" },
      { name: "Perorangan", icon: <PeroranganIcon />, path: "/perorangan" },
    ],
  },
  {
    title: "Karyawan",
    items: [
      { name: "Tim WFO", icon: <KaryawanIcon />, path: "/karyawan" },
      { name: "Skala Prioritas", icon: <SkalaPrioritasIcon />, path: "/skala-prioritas" },
      { name: "Surat Internal", icon: <DokumenIcon />, path: "/internal" }
    ],
  },
  {
    title: "HRM",
    items: [
      { name: "Dashboard HRM", icon: <GridIcon />, path: "/hrm" },
      { name: "Daftar Karyawan", icon: <KaryawanIcon />, path: "/hrm/karyawan" },
      { name: "Daftar Retainer", icon: <RetainerIcon />, path: "/hrm/retainer" },
      { name: "Data Pelamar", icon: <KaryawanIcon />, path: "/hrm/pelamar" },
      { name: "Dokumen Pelamar", icon: <DokumenIcon />, path: "/hrm/dokumen" }
    ],
  },
];


const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const isActive = useCallback((path: string) => path === pathname, [pathname]);
  
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [menuGroups, setMenuGroups] = useState<MenuGroups[]>([]);

  useEffect(() => {
    if (!session?.user) return;
    const userObj = session.user as any;
    const isAdminUser = userObj.role === "admin";

    const groups: MenuGroups[] = [];

    // 1. Menu Group
    const menuItems = [
      { name: "Dashboard", icon: <GridIcon />, path: "/" },
      { name: "Kalender Tim", icon: <CalenderIcon />, path: "/calendar" },
      { name: "Catatan Pribadi", icon: <CatatanIcon />, path: "/catatan-pribadi" },
      { name: "Berkas", icon: <DokumenIcon />, path: "/dokumen" },
      { name: "Dokumentasi", icon: <DokumentasiIcon />, path: "/dokumentasi" },
      { name: "Pengumuman", icon: <PengumumanIcon />, path: "/pengumuman" }
    ];
    groups.push({ title: "Menu", items: menuItems });

    // 2. NARASUMBER HUKUM Group
    groups.push({
      title: "NARASUMBER HUKUM",
      items: [{ name: "Arsip NH", icon: <DokumenIcon />, path: "/narasumber-hukum" }]
    });

    // 3. Project Group
    groups.push({
      title: "Project",
      items: [
        { name: "Retainer", icon: <RetainerIcon />, path: "/retainer" },
        { name: "Perorangan", icon: <PeroranganIcon />, path: "/perorangan" },
      ]
    });

    // 4. Karyawan Group
    groups.push({
      title: "Karyawan",
      items: [
        { name: "Tim WFO", icon: <KaryawanIcon />, path: "/karyawan" },
        { name: "Skala Prioritas", icon: <SkalaPrioritasIcon />, path: "/skala-prioritas" },
        { name: "Surat Internal", icon: <DokumenIcon />, path: "/internal" }
      ]
    });

    // 5. HRM Group
    if (isAdminUser || userObj.canManageHRM) {
      groups.push({
        title: "HRM",
        items: [
          { name: "Dashboard HRM", icon: <GridIcon />, path: "/hrm" },
          { name: "Daftar Karyawan", icon: <KaryawanIcon />, path: "/hrm/karyawan" },
          { name: "Daftar Retainer", icon: <RetainerIcon />, path: "/hrm/retainer" },
          { name: "Data Pelamar", icon: <KaryawanIcon />, path: "/hrm/pelamar" },
          { name: "Dokumen Pelamar", icon: <DokumenIcon />, path: "/hrm/dokumen" }
        ]
      });
    }

    // 6. Admin Control Group
    if (isAdminUser) {
      groups.push({
        title: "Admin",
        items: [
          { name: "Admin Control", icon: <CatatanIcon />, path: "/admin-control" }
        ]
      });
    }

    setMenuGroups(groups);
  }, [session]);

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-2">
      {items.map((nav) => (
        <li key={nav.name}>
          <Link
            href={nav.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
              isActive(nav.path)
                ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                : "text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:text-gray-400"
            } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
          >
            <span className={`${isActive(nav.path) ? "text-white" : "text-gray-400 group-hover:text-brand-500"}`}>
              {nav.icon}
            </span>
            {(isExpanded || isHovered || isMobileOpen) && (
              <span className="text-sm truncate">{nav.name}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
        <Link href="/" className="flex items-center gap-3">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image src="/images/logo/logo-law.png" alt="Logo" width={48} height={48} />
              <span className="text-lg font-black tracking-tighter text-black dark:text-white">
                DASHBOARD <span className="text-brand-500">NH</span>
              </span>
            </>
          ) : (
            <Image src="/images/logo/logo-law.png" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-10">
        <nav className="space-y-8">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <h2 className={`mb-4 text-[10px] font-black uppercase tracking-[2px] text-gray-400/80 ${
                !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
              }`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  group.title
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(group.items)}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
