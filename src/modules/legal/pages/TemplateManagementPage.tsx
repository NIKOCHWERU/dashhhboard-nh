"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search, Upload, FileText, CheckCircle2, XCircle, Trash2, ArrowRight, Play } from "lucide-react";

const INITIAL_TEMPLATES = [
  { id: 1, name: "PKWT Karyawan Kontrak", category: "PKWT", status: "active", version: "v1.2", date: "2026-05-10" },
  { id: 2, name: "Non-Disclosure Agreement (NDA)", category: "NDA", status: "active", version: "v2.0", date: "2026-04-22" },
  { id: 3, name: "Perjanjian Kerjasama Vendor", category: "Vendor", status: "inactive", version: "v1.0", date: "2026-01-15" },
  { id: 4, name: "Surat Peringatan Pertama (SP1)", category: "SP", status: "active", version: "v1.1", date: "2026-05-01" },
  { id: 5, name: "Surat Kuasa Khusus", category: "Kuasa", status: "active", version: "v1.0", date: "2026-03-10" },
];

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("PKWT");
  const [newVersion, setNewVersion] = useState("v1.0");
  const [newStatus, setNewStatus] = useState("active");

  const filtered = templates.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateTemplate = () => {
    if (!newName) {
      alert("Harap masukkan Nama Templat.");
      return;
    }

    const newTemplate = {
      id: templates.length + 1,
      name: newName,
      category: newCategory,
      status: newStatus,
      version: newVersion,
      date: new Date().toISOString().split('T')[0]
    };

    setTemplates([...templates, newTemplate]);
    setIsModalOpen(false);
    
    // Reset Form
    setNewName("");
    setNewCategory("PKWT");
    setNewVersion("v1.0");
    setNewStatus("active");
  };

  const handleDeleteTemplate = (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus templat ini?")) return;
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleToggleStatus = (id: number) => {
    const updated = templates.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: t.status === "active" ? "inactive" : "active"
        };
      }
      return t;
    });
    setTemplates(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Templat</h1>
          <p className="text-gray-500">Kelola templat DOCX untuk otomatisasi pembuatan dokumen hukum.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Upload className="w-4 h-4 mr-2" /> Unggah Templat</Button>
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
                    <button onClick={() => handleToggleStatus(t.id)}>
                      {t.status === "active" ? (
                        <Badge variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-250 cursor-pointer"><CheckCircle2 className="w-3 h-3 mr-1"/> Aktif</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"><XCircle className="w-3 h-3 mr-1"/> Nonaktif</Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      <Link href={`/legal/generate-surat?template=${t.category}`}>
                        <Button size="sm" variant="outline" className="text-brand-600 border-brand-200 hover:bg-brand-50 gap-1 text-xs py-1 px-2.5 h-8">
                          <Play className="w-3 h-3" /> Gunakan
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(t.id)} className="text-red-500 hover:text-red-700 h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* UPLOAD TEMPLATE DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Unggah Templat Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Nama Templat</label>
                <Input 
                  placeholder="Contoh: Perjanjian Kerja PKWT" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Kategori Templat</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                  >
                    <option value="PKWT">PKWT</option>
                    <option value="NDA">NDA</option>
                    <option value="Vendor">Vendor</option>
                    <option value="SP">Surat Peringatan (SP)</option>
                    <option value="Kuasa">Surat Kuasa</option>
                    <option value="Addendum">Addendum</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Versi Awal</label>
                  <Input 
                    placeholder="Contoh: v1.0" 
                    value={newVersion} 
                    onChange={(e) => setNewVersion(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Status Templat</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button onClick={handleCreateTemplate}>Simpan Templat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
