"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Search, Filter, FolderArchive, FileText, Download, Eye } from "lucide-react";

export default function LegalArchivePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Arsip Hukum</h1>
        <p className="text-gray-500">Cari dan temukan kembali dokumen hukum serta kontrak masa lalu.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Repositori Dokumen</CardTitle>
          <CardDescription>Telusuri folder atau cari langsung menggunakan kata kunci.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input placeholder="Cari nama dokumen, tag, atau metadata..." className="pl-9" />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter Lanjutan</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1 space-y-2">
              <h4 className="font-semibold text-gray-900 mb-4">Folder</h4>
              {["Korporat", "Kontrak Vendor", "HR & Ketenagakerjaan", "Litigasi", "HAKI & Merek Dagang"].map((f, i) => (
                <button key={i} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${i === 1 ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <FolderArchive className={`w-4 h-4 ${i === 1 ? 'text-brand-500' : 'text-gray-400'}`} />
                  {f}
                </button>
              ))}
            </div>
            
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Vendor Agreement - PT Maju Bersama", date: "Jan 2024", tags: ["Vendor", "Ditandatangani"] },
                  { name: "Sewa Gedung - Kembangan", date: "Des 2023", tags: ["Aset", "Ditandatangani"] },
                  { name: "IT Infrastructure Contract v2", date: "Nov 2023", tags: ["Vendor", "Kedaluwarsa"] },
                  { name: "Software License Agreement", date: "Okt 2023", tags: ["Perangkat Lunak", "Ditandatangani"] },
                  { name: "NDA - Kontraktor Independen", date: "Sep 2023", tags: ["NDA", "Ditandatangani"] },
                  { name: "Service Level Agreement (SLA)", date: "Agu 2023", tags: ["Vendor", "Ditandatangani"] },
                ].map((doc, i) => (
                  <div key={i} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Download className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2" title={doc.name}>{doc.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 mb-3">{doc.date} • PDF</p>
                    <div className="flex gap-2 mt-auto">
                      {doc.tags.map(t => (
                        <Badge key={t} variant={t === 'Kedaluwarsa' ? 'destructive' : 'secondary'} className="text-[10px] px-1.5 py-0">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
