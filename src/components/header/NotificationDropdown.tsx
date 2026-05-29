"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    try {
      // Dismiss notification immediately by deleting it
      await fetch(`/api/notifications?id=${item.id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      closeDropdown();
      // Redirect to target link
      router.push(item.link);
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!mounted) return null;

  const hasUnread = notifications.length > 0;

  return (
    <div className="relative">
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {hasUnread && (
          <span className="absolute right-0.5 top-0.5 z-10 h-2.5 w-2.5 rounded-full bg-orange-500 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-500 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[380px] w-[320px] flex-col rounded-none border border-stroke bg-white p-3 shadow-theme-lg dark:border-strokedark dark:bg-gray-900 sm:w-[350px] lg:right-0 z-999999"
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-stroke dark:border-strokedark">
          <h5 className="text-xs font-black text-black dark:text-white uppercase tracking-wider">
            Notifikasi ({notifications.length})
          </h5>
          {hasUnread && (
            <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black uppercase dark:bg-orange-500/10 dark:text-orange-400">
              Baru
            </span>
          )}
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar grow divide-y divide-stroke dark:divide-strokedark">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center grow py-10 text-center">
              <svg className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-[10px] text-gray-400 italic">Tidak ada notifikasi baru</p>
            </div>
          ) : (
            notifications.map((item) => (
              <li key={item.id}>
                <div
                  onClick={() => handleNotificationClick(item)}
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors block text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-black dark:text-white line-clamp-1 uppercase tracking-wide">
                      {item.title}
                    </span>
                    <span className="text-[8px] text-gray-400 whitespace-nowrap">
                      {getRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </Dropdown>
    </div>
  );
}
