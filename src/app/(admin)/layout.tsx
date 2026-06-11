"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { UploadProvider } from "@/context/UploadContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const [mounted, setMounted] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Check in background if permissions or role changed in DB
  React.useEffect(() => {
    if (status !== "authenticated") return;

    const checkSessionStatus = async () => {
      try {
        const res = await fetch("/api/users/check-status");
        if (res.ok) {
          const data = await res.json();
          if (data.isSessionStale) {
            alert("Sesi Anda telah diperbarui oleh Administrator. Silakan login kembali.");
            signOut({ callbackUrl: "/auth/signin" });
          }
        }
      } catch (err) {
        console.error("Failed to verify user session status:", err);
      }
    };

    checkSessionStatus();
  }, [pathname, status]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" suppressHydrationWarning>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  // Security route verification
  const user = session?.user as any;
  const isAdmin = user?.role === "admin";

  let isAllowed = true;

  if (pathname === "/admin-control" && !isAdmin) {
    isAllowed = false;
  } else if (pathname.startsWith("/hrm") && !isAdmin && !user?.canManageHRM) {
    isAllowed = false;
  }

  return (
    <UploadProvider>
      <div className="min-h-screen xl:flex" suppressHydrationWarning>
        {/* Sidebar and Backdrop */}
        <AppSidebar />
        <Backdrop />
        {/* Main Content Area */}
        <div
          className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
          suppressHydrationWarning
        >
          {/* Header */}
          <AppHeader />
          
          {/* Page Content Guard */}
          <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6" suppressHydrationWarning>
            {isAllowed ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  className="animate-stagger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="min-h-[70vh] flex items-center justify-center p-4">
                <div className="w-full max-w-md p-8 border border-red-500/30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md rounded-none shadow-2xl text-center space-y-6 animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-red-500"></div>
                  <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest">Akses Menu Ditolak</h2>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 leading-relaxed">
                      Anda tidak diperkenankan mengakses menu ini, mohon hubungi Administrator.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => router.push("/")}
                      className="px-5 py-2.5 bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 text-xs font-black uppercase tracking-wider rounded-none transition-colors cursor-pointer w-full"
                    >
                      Kembali ke Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UploadProvider>
  );
}
