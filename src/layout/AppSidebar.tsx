"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { Database } from "lucide-react";
import { useSession } from "next-auth/react";
import { APP_LABELS } from "../config/app-labels";
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
  path?: string;
  subItems?: { name: string; path: string }[];
};

type MenuGroups = {
  title: string;
  items: NavItem[];
};

const staticMenuGroups: MenuGroups[] = [
  {
    title: "Menu",
    items: [
      { name: "Dashboard Utama", icon: <GridIcon />, path: "/" },
      { name: "Kalender", icon: <CalenderIcon />, path: "/calendar" },
      { name: "Dokumentasi", icon: <DokumentasiIcon />, path: "/dokumentasi" },
      { name: "Pengumuman", icon: <PengumumanIcon />, path: "/pengumuman" },
    ],
  },
  {
    title: "Manajemen Arsip",
    items: [
      { name: "Arsip", icon: <DokumenIcon />, path: "/narasumber-hukum" },
    ],
  },
  {
    title: "Pekerjaan",
    items: [
      { name: "Retainer", icon: <RetainerIcon />, path: "/retainer" },
      { name: "Perorangan", icon: <PeroranganIcon />, path: "/perorangan" },
    ],
  },
  {
    title: "Karyawan",
    items: [
      { name: "Daftar Karyawan", icon: <KaryawanIcon />, path: "/karyawan" },
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
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleSubmenu = (menuName: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuName)
        ? prev.filter((name) => name !== menuName)
        : [...prev, menuName]
    );
  };

  useEffect(() => {
    if (!session?.user) return;
    const userObj = session.user as any;
    const isAdminUser = userObj.role === "admin";

    const groups: MenuGroups[] = [];

    // 1. Menu Group
    const menuItems = [
      { name: APP_LABELS.sidebar.items.dashboard, icon: <GridIcon />, path: "/" },
      { name: APP_LABELS.sidebar.items.calendar, icon: <CalenderIcon />, path: "/calendar" },
      ...(isAdminUser || userObj.canAccessPekerjaan ? [
        { name: APP_LABELS.sidebar.items.tasks, icon: <CatatanIcon />, path: "/daftar-potensi-klien" },
        { name: "Pekerjaan", icon: <SkalaPrioritasIcon />, path: "/progress-pekerjaan" }
      ] : []),
      { name: "Laporan", icon: <CatatanIcon />, path: "/laporan-harian" },
      ...(isAdminUser || userObj.canAccessDokumentasi ? [
        { name: APP_LABELS.sidebar.items.dokumentasi, icon: <DokumentasiIcon />, path: "/dokumentasi" }
      ] : []),
      { name: APP_LABELS.sidebar.items.pengumuman, icon: <PengumumanIcon />, path: "/pengumuman" }
    ];
    groups.push({ title: APP_LABELS.sidebar.groups.menu, items: menuItems });

    // 2. NARASUMBER HUKUM Group
    if (isAdminUser || userObj.canAccessArsip) {
      groups.push({
        title: APP_LABELS.sidebar.groups.archiveManagement,
        items: [
          { name: APP_LABELS.sidebar.items.arsipDokumen, icon: <DokumenIcon />, path: "/narasumber-hukum" }
        ]
      });
    }

    // 3. Project Group (Retainer & Perorangan - visible to all but restricted internally)
    groups.push({
      title: APP_LABELS.sidebar.groups.project,
      items: [
        { name: APP_LABELS.sidebar.items.retainer, icon: <RetainerIcon />, path: "/retainer" },
        { name: APP_LABELS.sidebar.items.perorangan, icon: <PeroranganIcon />, path: "/perorangan" },
      ]
    });

    // 4. Karyawan Group (renamed to Tim)
    if (isAdminUser || userObj.canAccessTenagaKerja) {
      groups.push({
        title: APP_LABELS.sidebar.groups.employee,
        items: [
          { name: APP_LABELS.sidebar.items.daftarKaryawan, icon: <KaryawanIcon />, path: "/karyawan" }
        ]
      });
    }

    // 5. HRM Group
    if (isAdminUser || userObj.canManageHRM) {
      groups.push({
        title: APP_LABELS.sidebar.groups.hrm,
        items: [
          { name: APP_LABELS.sidebar.items.dashboardHrm, icon: <GridIcon />, path: "/hrm" },
          { name: "Sistem & Integrasi", icon: <Database className="w-5 h-5" />, path: "/import-database" },
          { name: APP_LABELS.sidebar.items.daftarKaryawan, icon: <KaryawanIcon />, path: "/hrm/karyawan" },
          { name: APP_LABELS.sidebar.items.daftarRetainer, icon: <RetainerIcon />, path: "/hrm/retainer" },
          { name: APP_LABELS.sidebar.items.dataPelamar, icon: <KaryawanIcon />, path: "/hrm/pelamar" },
          { name: APP_LABELS.sidebar.items.dokumenPelamar, icon: <DokumenIcon />, path: "/hrm/dokumen" }
        ]
      });
    }

    // 6. Dashboard Legal Group
    if (isAdminUser || userObj.canManageLegal) {
      groups.push({
        title: APP_LABELS.sidebar.groups.legal,
        items: [
          { name: APP_LABELS.sidebar.items.dashboardLegal, icon: <GridIcon />, path: "/legal/overview" },
          {
            name: APP_LABELS.sidebar.items.documentAutomation,
            icon: <DokumenIcon />,
            subItems: [
              { name: APP_LABELS.sidebar.items.createLetter, path: "/legal/generate-surat" },
              { name: APP_LABELS.sidebar.items.templateManagement, path: "/legal/template-management" }
            ]
          },
          {
            name: APP_LABELS.sidebar.items.contractManagement,
            icon: <CatatanIcon />,
            subItems: [
              { name: APP_LABELS.sidebar.items.allContracts, path: "/legal/contracts" },
              { name: APP_LABELS.sidebar.items.expiryMonitoring, path: "/legal/expiry-monitoring" }
            ]
          },
          { name: APP_LABELS.sidebar.items.employeeLegal, icon: <KaryawanIcon />, path: "/legal/employee-legal" },
          { name: APP_LABELS.sidebar.items.approvals, icon: <SkalaPrioritasIcon />, path: "/legal/approvals" },
          { name: APP_LABELS.sidebar.items.archiveLegal, icon: <DokumentasiIcon />, path: "/legal/archive" },
          { name: APP_LABELS.sidebar.items.compliance, icon: <GridIcon />, path: "/legal/compliance" },
          { name: APP_LABELS.sidebar.items.legalRequests, icon: <PengumumanIcon />, path: "/legal/requests" },
          { name: APP_LABELS.sidebar.items.reports, icon: <DokumenIcon />, path: "/legal/reports" },
          { name: APP_LABELS.sidebar.items.settings, icon: <HorizontaLDots />, path: "/legal/settings" }
        ]
      });
    }

    // 7. Admin Control Group
    if (isAdminUser) {
      groups.push({
        title: APP_LABELS.sidebar.groups.admin,
        items: [
          { name: APP_LABELS.sidebar.items.accessManagement, icon: <CatatanIcon />, path: "/admin-control" }
        ]
      });
    }

    setMenuGroups(groups);
  }, [session]);

  const renderMenuItems = (items: NavItem[]) => {
    const showLabels = isExpanded || isMobileOpen;
    return (
      <ul className="flex flex-col gap-2 w-full">
        {items.map((nav) => {
          const isSubmenuExpanded = expandedMenus.includes(nav.name);
          const hasActiveSubItem = nav.subItems?.some(sub => isActive(sub.path));
          const active = nav.path ? isActive(nav.path) : hasActiveSubItem;
          
          const linkClasses = `flex items-center rounded-xl font-bold transition-all duration-200 cursor-pointer ${
            active
              ? "bg-brand-500 text-white shadow-md shadow-brand-500/20"
              : "text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 dark:text-gray-400"
          } ${
            showLabels
              ? "w-full px-4 py-2.5 gap-3 justify-start"
              : "w-12 h-12 justify-center mx-auto"
          }`;

          return (
            <li key={nav.name} className="flex flex-col items-center justify-center w-full">
              {nav.subItems ? (
                <div
                  className={linkClasses}
                  onClick={() => toggleSubmenu(nav.name)}
                >
                  <div className={`flex items-center ${showLabels ? "gap-3" : "justify-center"}`}>
                    <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-brand-500"}`}>
                      {nav.icon}
                    </span>
                    {showLabels && (
                      <span className="text-sm truncate font-semibold">{nav.name}</span>
                    )}
                  </div>
                  {showLabels && (
                    <span className={`transition-transform duration-200 ${isSubmenuExpanded ? "rotate-180" : ""}`}>
                      <ChevronDownIcon />
                    </span>
                  )}
                </div>
              ) : (
                <Link
                  href={nav.path!}
                  className={linkClasses}
                >
                  <span className={`flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors ${active ? "text-white" : "text-gray-400 group-hover:text-brand-500"}`}>
                    {nav.icon}
                  </span>
                  {showLabels && (
                    <span className="text-sm truncate font-semibold">{nav.name}</span>
                  )}
                </Link>
              )}

              {nav.subItems && isSubmenuExpanded && showLabels && (
                <ul className="mt-2 space-y-1 pl-11 w-full">
                  {nav.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.path}
                        className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                          isActive(sub.path)
                            ? "bg-brand-50 text-brand-600 font-semibold dark:bg-brand-500/10 dark:text-brand-400"
                            : "text-gray-500 hover:text-brand-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                        }`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 print:hidden 
        ${isExpanded || isMobileOpen ? "w-[290px] px-5" : "w-[90px] px-2"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
    >
      <div className="py-8 flex justify-center w-full">
        <Link href="/" className="flex items-center justify-center">
          {isExpanded || isMobileOpen ? (
            <Image src="/images/logo/logo-law.png" alt="Logo" width={64} height={64} className="transition-all duration-300" />
          ) : (
            <Image src="/images/logo/logo-law.png" alt="Logo" width={40} height={40} className="transition-all duration-300" />
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar pb-10 w-full">
        <nav className="space-y-8 w-full">
          {menuGroups.map((group) => {
            const showLabels = isExpanded || isMobileOpen;
            return (
              <div key={group.title} className="w-full">
                <h2 className={`mb-4 text-[10px] font-black uppercase tracking-[2px] text-gray-400/80 flex items-center ${
                  showLabels ? "justify-start px-2" : "justify-center"
                }`}>
                  {showLabels ? (
                    group.title
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(group.items)}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
