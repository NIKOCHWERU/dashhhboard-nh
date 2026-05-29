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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Tim WFO</h1>
          <p className="text-sm text-gray-500">Daftar pengguna terdaftar dan staf kantor.</p>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-2xl"></div>)
        ) : data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="group relative bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark p-8 rounded-3xl shadow-sm hover:border-brand-500 hover:shadow-xl transition-all duration-300 text-center overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-bl-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-24 h-24 mx-auto mb-6 relative">
                  {item.image ? (
                    <div className="w-full h-full rounded-2xl overflow-hidden border-4 border-white shadow-lg dark:border-gray-800">
                      <Image src={item.image} alt={item.name} width={96} height={96} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">
                      {item.name.charAt(0)}
                    </div>
                  )}
                  {item.source === "google" && (
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-md border border-stroke dark:border-strokedark">
                       <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-black dark:text-white mb-1">{item.name}</h3>
                <p className="text-[10px] text-brand-500 font-black uppercase tracking-[2px] mb-4 bg-brand-500/10 inline-block px-3 py-1 rounded-full">{item.position || "Staff"}</p>
                
                <div className="text-sm text-gray-500 mb-8 space-y-1">
                  <p className="truncate">{item.email}</p>
                  {item.phone && <p>{item.phone}</p>}
                </div>

                <div className="flex gap-3 justify-center">
                  <a 
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=${item.email}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-gray-50 dark:bg-gray-800 text-black dark:text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-brand-500 hover:text-white transition-all group"
                  >
                    <MailIcon /> Kirim Email
                  </a>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 italic">Belum ada anggota tim.</div>
        )}
      </div>


    </div>
  );
}
