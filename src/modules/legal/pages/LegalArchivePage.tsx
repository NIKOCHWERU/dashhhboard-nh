"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Search, Filter, FolderArchive, FileText, Download, Eye, X, Calendar, User, ShieldCheck } from "lucide-react";

interface LegalDoc {
  name: string;
  date: string;
  folder: string;
  tags: string[];
  size: string;
  pic: string;
  summary: string;
}

export default function LegalArchivePage() {
  const [activeFolder, setActiveFolder] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);

  const folders = ["Semua", "Korporat", "Kontrak Vendor", "HR & Ketenagakerjaan", "Litigasi", "HAKI & Merek Dagang"];

  const documents: LegalDoc[] = [
    { 
      name: "Vendor Agreement - PT Maju Bersama", 
      date: "Jan 2024", 
      folder: "Kontrak Vendor", 
      tags: ["Vendor", "Ditandatangani"], 
      size: "2.4 MB", 
      pic: "Andi Pratama, S.H.", 
      summary: "Perjanjian kemitraan penyediaan layanan operasional vendor keamanan gedung dan logistik dengan PT Maju Bersama."
    },
    { 
      name: "Sewa Gedung - Kembangan", 
      date: "Des 2023", 
      folder: "Korporat", 
      tags: ["Aset", "Ditandatangani"], 
      size: "4.1 MB", 
      pic: "Niko Chweru", 
      summary: "Kontrak sewa-menyewa gedung kantor cabang utama ruko 3 lantai di Kembangan Jakarta Barat untuk masa sewa 2 tahun."
    },
    { 
      name: "IT Infrastructure Contract v2", 
      date: "Nov 2023", 
      folder: "Kontrak Vendor", 
      tags: ["Vendor", "Kedaluwarsa"], 
      size: "1.9 MB", 
      pic: "Andi Pratama, S.H.", 
      summary: "Kontrak sewa server data center cloud. Status saat ini kedaluwarsa dan sedang diajukan draf perpanjangan adendum."
    },
    { 
      name: "Software License Agreement", 
      date: "Okt 2023", 
      folder: "Kontrak Vendor", 
      tags: ["Perangkat Lunak", "Ditandatangani"], 
      size: "1.2 MB", 
      pic: "Sarah Johnson", 
      summary: "Perjanjian lisensi perangkat lunak langganan suite kreatif desain produk digital."
    },
    { 
      name: "NDA - Kontraktor Independen", 
      date: "Sep 2023", 
      folder: "HR & Ketenagakerjaan", 
      tags: ["NDA", "Ditandatangani"], 
      size: "1.5 MB", 
      pic: "Sarah Johnson", 
      summary: "Non-Disclosure Agreement wajib untuk developer lepasan independen sebelum diberikan hak akses repositori kode utama."
    },
    { 
      name: "Service Level Agreement (SLA)", 
      date: "Agu 2023", 
      folder: "Kontrak Vendor", 
      tags: ["Vendor", "Ditandatangani"], 
      size: "2.8 MB", 
      pic: "Andi Pratama, S.H.", 
      summary: "Perjanjian SLA batas responsivitas layanan pemeliharaan server lokal kantor pusat."
    }
  ];

  const filtered = documents.filter(doc => {
    const matchesFolder = activeFolder === "Semua" || doc.folder === activeFolder;
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arsip Hukum</h1>
        <p className="text-gray-500">Cari, saring, dan temukan kembali draf hukum serta berkas kontrak masa lalu perusahaan.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-50 py-4">
          <CardTitle>Repositori Dokumen</CardTitle>
          <CardDescription>Telusuri folder arsip secara visual atau gunakan saringan pencarian kata kunci.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Cari nama dokumen, ringkasan, atau tag..." 
                className="pl-9 text-xs" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Sidebar folders */}
            <div className="md:col-span-1 space-y-2">
              <h4 className="font-black text-[10px] uppercase tracking-wider text-gray-400 mb-4">Daftar Folder</h4>
              {folders.map((f, i) => {
                const isSelected = activeFolder === f;
                return (
                  <button 
                    key={i} 
                    onClick={() => setActiveFolder(f)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                      isSelected ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FolderArchive className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    {f}
                  </button>
                );
              })}
            </div>
            
            {/* Document grid list */}
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((doc, i) => (
                  <div 
                    key={i} 
                    onClick={() => setSelectedDoc(doc)}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedDoc(doc)} className="h-8 w-8"><Eye className="w-4 h-4 text-gray-500" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4 text-gray-500" /></Button>
                        </div>
                      </div>
                      <h3 className="font-bold text-xs text-gray-950 leading-snug line-clamp-2" title={doc.name}>{doc.name}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1.5">{doc.folder}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{doc.date} • {doc.size}</p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      {doc.tags.map(t => (
                        <Badge key={t} variant={t === 'Kedaluwarsa' ? 'destructive' : 'secondary'} className="text-[9px] px-1.5 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-400 italic">Tidak ada dokumen ditemukan di folder ini.</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-lg w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-500" />
                Rincian Arsip Dokumen
              </h3>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-xs leading-snug">{selectedDoc.name}</h4>
                <div className="flex gap-2 mt-2">
                  {selectedDoc.tags.map(t => (
                    <Badge key={t} variant={t === 'Kedaluwarsa' ? 'destructive' : 'secondary'} className="text-[9px]">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-gray-600 leading-relaxed border space-y-2">
                <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Ringkasan Dokumen</span>
                <p>{selectedDoc.summary}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-3 font-semibold text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tanggal Berkas</p>
                    <p className="text-gray-900 text-xs mt-0.5">{selectedDoc.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Penanggung Jawab (PIC)</p>
                    <p className="text-gray-900 text-xs mt-0.5">{selectedDoc.pic}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Folder Kategori</p>
                    <p className="text-gray-900 text-xs mt-0.5">{selectedDoc.folder}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Ukuran File</p>
                    <p className="text-gray-900 text-xs mt-0.5">{selectedDoc.size}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedDoc(null)}>Tutup</Button>
              <Button className="font-bold"><Download className="w-4 h-4 mr-2" /> Unduh PDF</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
