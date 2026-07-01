"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, GroupIcon, MailIcon } from "@/icons";
import Image from "next/image";

interface Member {
  id: string;
  name: string;
  position?: string;
  role?: string;
  email: string;
  phone?: string;
  image?: string;
  source: "manual" | "google";
}

export default function TimPage() {
  const [data, setData] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: "", position: "", email: "", phone: "", status: "Active" });

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (data.length > 0 && !selectedMember) {
      setSelectedMember(data[0]);
    }
  }, [data, selectedMember]);

  const fetchData = async () => {
    try {
      const [resKaryawan, resUsers] = await Promise.all([
        fetch("/api/karyawan"),
        fetch("/api/users")
      ]);

      const karyawanData = resKaryawan.ok ? await resKaryawan.json() : [];
      const usersData = resUsers.ok ? await resUsers.json() : [];

      const formattedKaryawan = karyawanData.map((k: any) => ({
        ...k,
        source: "manual",
      }));

      const formattedUsers = usersData.map((u: any) => ({
        id: u.id,
        name: u.name || "User",
        email: u.email,
        image: u.image,
        position: u.role === "admin" ? "Administrator" : "User Sistem",
        source: "google",
      }));

      // Merge and remove duplicates by email
      const combined = [...formattedUsers, ...formattedKaryawan];
      const unique = combined.filter((v, i, a) => a.findIndex(t => t.email === v.email) === i);

      setData(unique);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const search = params.get("search");
      if (search) {
        setSearchTerm(search);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/karyawan", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ name: "", position: "", email: "", phone: "", status: "Active" });
      fetchData();
    }
  };

  const filteredData = data.filter((item) => {
    const searchString = `${item.name} ${item.email} ${item.position || ""}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white uppercase tracking-wider">Direktori Tenaga Kerja & Staf</h1>
          <p className="text-xs text-gray-500">Daftar pengguna terdaftar dan staf kantor yang aktif di sistem.</p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari nama, email, jabatan..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-white/[0.02] text-gray-700 dark:text-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/50 transition-colors text-xs font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Column: Compact Table Directory */}
        <div className="xl:col-span-7 flex flex-col space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl overflow-hidden">
            {loading ? (
              <div className="p-5 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-gray-150 dark:bg-gray-800 flex-shrink-0"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-150 dark:bg-gray-800 rounded w-1/3"></div>
                      <div className="h-2.5 bg-gray-150 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-20 text-xs text-gray-450 dark:text-gray-500 italic">
                Tidak ada tenaga kerja ditemukan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] font-bold text-gray-405 uppercase tracking-widest bg-gray-50/20 dark:bg-white/[0.01]">
                      <th className="p-4 pl-6">Tenaga Kerja</th>
                      <th className="p-4">Jabatan</th>
                      <th className="p-4">Sumber</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-300">
                    {filteredData.map((item) => {
                      const isActive = selectedMember?.id === item.id;
                      return (
                        <tr 
                          key={item.id} 
                          className={`cursor-pointer transition-all ${
                            isActive 
                              ? "bg-brand-500/5 hover:bg-brand-500/10 dark:bg-brand-500/5 dark:hover:bg-brand-500/10" 
                              : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                          }`}
                          onClick={() => setSelectedMember(item)}
                        >
                          <td className="p-4 pl-6">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-800 flex-shrink-0">
                                  <Image src={item.image} alt={item.name} width={32} height={32} className="object-cover w-full h-full" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-black dark:text-white truncate">
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-gray-400 truncate">
                                  {item.email}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-[11px] font-bold text-gray-650 dark:text-gray-300">
                              {item.position || "Staff"}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              item.source === "google"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                                : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                            }`}>
                              {item.source}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMember(item);
                              }}
                              className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 text-[10px] font-black rounded-lg uppercase transition-colors"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Details drawer */}
        <div className="xl:col-span-5">
          {selectedMember ? (
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-6 flex flex-col items-center text-center relative overflow-hidden group">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
              
              <div className="w-24 h-24 mb-4 relative z-10 mt-4">
                {selectedMember.image ? (
                  <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-lg dark:border-gray-800">
                    <Image src={selectedMember.image} alt={selectedMember.name} width={96} height={96} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {selectedMember.source === "google" && (
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md border border-stroke dark:border-strokedark">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-black dark:text-white mb-1 relative z-10">{selectedMember.name}</h3>
              <p className="text-[10px] text-brand-500 font-black uppercase tracking-[2px] mb-6 bg-brand-500/10 inline-block px-3 py-1 rounded-full relative z-10">
                {selectedMember.position || "Staff"}
              </p>
              
              <div className="w-full space-y-4 text-left border-t border-gray-100 dark:border-gray-800 pt-6">
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Alamat Email</span>
                  <span className="block text-sm font-semibold text-black dark:text-white mt-0.5 break-all">{selectedMember.email}</span>
                </div>
                {selectedMember.phone && (
                  <div>
                    <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Nomor Telepon</span>
                    <span className="block text-sm font-semibold text-black dark:text-white mt-0.5">{selectedMember.phone}</span>
                  </div>
                )}
                <div>
                  <span className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Sumber Akun</span>
                  <span className="block text-xs font-semibold text-black dark:text-white mt-1 capitalize">{selectedMember.source} System</span>
                </div>
              </div>

              <div className="w-full mt-8 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                <a 
                  href={`https://mail.google.com/mail/?view=cm&fs=1&to=${selectedMember.email}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-brand-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-brand-600 transition-all shadow-md active:scale-95"
                >
                  <MailIcon /> Kirim Email Resmi
                </a>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] rounded-2xl shadow-xl p-12 flex flex-col items-center justify-center text-center h-[350px]">
              <svg className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              <p className="text-xs text-gray-400 italic">Pilih salah satu tenaga kerja di daftar sebelah kiri untuk melihat detail lengkap profil.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
