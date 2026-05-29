"use client";
import React, { useState, useEffect } from "react";
import { FeatureModal } from "@/components/common/FeatureModal";
import { PlusIcon, TrashBinIcon, FileIcon, BellIcon } from "@/icons";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface Pengumuman {
  id: string;
  title: string;
  content: string;
  priority: string;
  image?: string;
  expiresAt?: string;
  createdAt: string;
}

export default function PengumumanPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<Pengumuman[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    title: "", 
    content: "", 
    priority: "Normal",
    displayDays: "7" // Default 7 days
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAdmin = (session?.user as any)?.role === "admin";

  const fetchData = async () => {
    const res = await fetch("/api/pengumuman");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const form = new FormData();
    form.append("title", formData.title);
    form.append("content", formData.content);
    form.append("priority", formData.priority);
    form.append("displayDays", formData.displayDays);
    if (selectedFile) {
      form.append("image", selectedFile);
    }

    const res = await fetch("/api/pengumuman", {
      method: "POST",
      body: form,
    });

    if (res.ok) {
      setIsModalOpen(false);
      setFormData({ title: "", content: "", priority: "Normal", displayDays: "7" });
      setSelectedFile(null);
      fetchData();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight">Pengumuman</h1>
          <p className="text-sm text-gray-500">Kelola informasi penting kantor hukum.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-500 text-white px-6 py-2.5 rounded-none font-black text-sm flex items-center gap-2 hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
          >
            <PlusIcon /> Tambah Pengumuman
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          <div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-none"></div>
        ) : data.length > 0 ? (
          data.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-none shadow-sm hover:border-brand-500 transition-all overflow-hidden flex flex-col md:flex-row h-full">
              {item.image && (
                <div className="relative w-full md:w-48 h-48 md:h-full flex-shrink-0">
                  <Image 
                    src={item.image} 
                    alt={item.title} 
                    fill 
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-6 flex flex-col justify-between flex-grow">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-none uppercase ${
                      item.priority === 'High' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                    }`}>
                      {item.priority}
                    </span>
                    {item.expiresAt && (
                       <span className="text-[10px] font-bold text-gray-400 uppercase">
                         Aktif Hingga: {new Date(item.expiresAt).toLocaleDateString('id-ID')}
                       </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-black dark:text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-3">{item.content}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-stroke dark:border-strokedark text-[10px] text-gray-400 font-bold uppercase">
                  Diposting pada {new Date(item.createdAt).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 italic lg:col-span-2 bg-white dark:bg-gray-900 border border-stroke dark:border-strokedark rounded-none">Belum ada pengumuman.</div>
        )}
      </div>

      <FeatureModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Tambah Pengumuman Baru"
        subtitle="Siarkan informasi penting ke seluruh anggota tim"
        icon={<BellIcon />}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Judul</label>
              <input 
                required
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Prioritas</label>
              <select 
                className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none transition-all font-bold"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Lama Tampilan (Hari)</label>
            <input 
              type="number"
              required
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none transition-all"
              value={formData.displayDays}
              onChange={(e) => setFormData({...formData, displayDays: e.target.value})}
              min="1"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Unggah Gambar</label>
            <div className="relative group">
               <input 
                 type="file"
                 accept="image/*"
                 onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                 className="hidden"
                 id="image-upload"
               />
               <label 
                 htmlFor="image-upload"
                 className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-stroke dark:border-strokedark rounded-none cursor-pointer hover:border-brand-500 transition-all bg-gray-50 dark:bg-gray-800"
               >
                 {selectedFile ? (
                   <span className="text-xs font-bold text-brand-500">{selectedFile.name}</span>
                 ) : (
                   <>
                     <span className="text-gray-400 mb-2"><FileIcon /></span>
                     <span className="text-[10px] font-black uppercase text-gray-400">Pilih Gambar</span>
                   </>
                 )}
               </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-500 mb-1.5">Isi Pengumuman</label>
            <textarea 
              required
              rows={4}
              className="w-full bg-gray-50 dark:bg-gray-800 border border-stroke dark:border-strokedark rounded-none px-4 py-3 text-sm focus:border-brand-500 outline-none transition-all"
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
            />
          </div>
          <button className="w-full bg-brand-500 text-white py-3.5 rounded-none font-black uppercase tracking-widest text-xs hover:bg-brand-600 transition-all">
            Simpan Pengumuman
          </button>
        </form>
      </FeatureModal>
    </div>
  );
}
