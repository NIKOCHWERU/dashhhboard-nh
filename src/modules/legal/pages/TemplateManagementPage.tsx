"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, Upload, FileText, MoreVertical, CheckCircle2, XCircle } from "lucide-react";

const DUMMY_TEMPLATES = [
  { id: 1, name: "PKWT Karyawan Kontrak", category: "HR", status: "active", version: "v1.2", date: "2026-05-10" },
  { id: 2, name: "Non-Disclosure Agreement (NDA)", category: "NDA", status: "active", version: "v2.0", date: "2026-04-22" },
  { id: 3, name: "Perjanjian Kerjasama Vendor", category: "Vendor", status: "inactive", version: "v1.0", date: "2026-01-15" },
  { id: 4, name: "Surat Peringatan Pertama (SP1)", category: "HR", status: "active", version: "v1.1", date: "2026-05-01" },
  { id: 5, name: "Kontrak Sewa Gedung", category: "Operational", status: "active", version: "v1.0", date: "2026-03-10" },
];

export default function TemplateManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = DUMMY_TEMPLATES.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Templat</h1>
          <p className="text-gray-500">Kelola templat DOCX untuk otomatisasi pembuatan dokumen hukum.</p>
        </div>
        <Button><Upload className="w-4 h-4 mr-2" /> Unggah Templat</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templat Dokumen</CardTitle>
          <CardDescription>Daftar seluruh templat yang tersedia untuk otomatisasi pembuatan dokumen.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Cari templat..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline">Filter Kategori</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Templat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Versi</TableHead>
                <TableHead>Terakhir Diperbarui</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-gray-900">{t.name}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
                  <TableCell className="text-gray-500">{t.version}</TableCell>
                  <TableCell className="text-gray-500">{t.date}</TableCell>
                  <TableCell>
                    {t.status === "active" ? (
                      <Badge variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1"/> Aktif</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1"/> Nonaktif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                    Templat tidak ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
