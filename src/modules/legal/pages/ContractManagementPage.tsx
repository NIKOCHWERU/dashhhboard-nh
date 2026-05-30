"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Plus, Filter, MoreHorizontal, FileText, Check, X } from "lucide-react";

const INITIAL_DUMMY_CONTRACTS = [
  { id: "CTR-001", title: "Vendor Agreement - PT Maju Bersama", type: "Vendor", startDate: "2024-01-01", endDate: "2025-01-01", status: "Approved" },
  { id: "CTR-002", title: "NDA - Freelance Designer", type: "NDA", startDate: "2024-03-15", endDate: "2026-03-15", status: "Signed" },
  { id: "CTR-003", title: "PKWT - Sarah Johnson", type: "HR", startDate: "2023-06-01", endDate: "2024-06-01", status: "Expired" },
  { id: "CTR-004", title: "Sewa Gedung Kantor Pusat", type: "Operasional", startDate: "2022-01-01", endDate: "2027-01-01", status: "Signed" },
  { id: "CTR-005", title: "Perjanjian Kerjasama API", type: "Vendor", startDate: "2024-05-10", endDate: "2025-05-10", status: "Review" },
  { id: "CTR-006", title: "MOU - Universitas Bina Nusantara", type: "Korporat", startDate: "2024-02-01", endDate: "2025-02-01", status: "Draft" },
];

export default function ContractManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [retainers, setRetainers] = useState<{ id: string; clientName: string }[]>([]);
  const [selectedRetainer, setSelectedRetainer] = useState<string>("ALL");
  const [contracts, setContracts] = useState<any[]>(INITIAL_DUMMY_CONTRACTS);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Vendor");
  const [newRetainerId, setNewRetainerId] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newStatus, setNewStatus] = useState("Draft");

  // Fetch Retainer data from database API
  useEffect(() => {
    const fetchRetainers = async () => {
      try {
        const res = await fetch("/api/retainer");
        if (res.ok) {
          const data = await res.json();
          setRetainers(data);
          
          // Map dummy contracts to actual database retainers if they exist
          if (data.length > 0) {
            const mappedContracts = INITIAL_DUMMY_CONTRACTS.map((c, index) => {
              const rIndex = index % data.length;
              return {
                ...c,
                retainerId: data[rIndex].id,
                retainerName: data[rIndex].clientName,
                title: c.title.replace(/PT Maju Bersama|Freelance Designer|Sarah Johnson|Kantor Pusat|API|Universitas Bina Nusantara/g, data[rIndex].clientName)
              };
            });
            setContracts(mappedContracts);
          }
        }
      } catch (err) {
        console.error("Failed to load retainers:", err);
      }
    };
    fetchRetainers();
  }, []);

  const handleCreateContract = () => {
    if (!newTitle || !newStartDate || !newEndDate) {
      alert("Harap isi Judul Kontrak, Tanggal Mulai, dan Tanggal Selesai.");
      return;
    }

    const selectedRet = retainers.find(r => r.id === newRetainerId);

    const newContract = {
      id: `CTR-0${contracts.length + 1}`,
      title: newTitle,
      type: newType,
      startDate: newStartDate,
      endDate: newEndDate,
      status: newStatus,
      retainerId: newRetainerId || undefined,
      retainerName: selectedRet ? selectedRet.clientName : "Umum"
    };

    setContracts([newContract, ...contracts]);
    setIsModalOpen(false);
    
    // Reset form
    setNewTitle("");
    setNewType("Vendor");
    setNewRetainerId("");
    setNewStartDate("");
    setNewEndDate("");
    setNewStatus("Draft");
  };

  const handleDeleteContract = (idToDelete: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus kontrak ini?")) return;
    setContracts(contracts.filter(c => c.id !== idToDelete));
  };

  const filtered = contracts.filter(c => {
    const matchesSearch = 
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRetainer = selectedRetainer === "ALL" || c.retainerId === selectedRetainer;
    return matchesSearch && matchesRetainer;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Signed":
        return <Badge variant="success">Ditandatangani</Badge>;
      case "Approved":
        return <Badge variant="success">Disetujui</Badge>;
      case "Review":
        return <Badge variant="warning">Ditinjau</Badge>;
      case "Expired":
        return <Badge variant="destructive">Kedaluwarsa</Badge>;
      case "Draft":
      default:
        return <Badge variant="secondary">Draf</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Kontrak</h1>
          <p className="text-gray-500">Lacak dan kelola semua kontrak dan perjanjian perusahaan berdasarkan Klien Retainer.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Kontrak Baru</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kontrak Per Klien Retainer</CardTitle>
          <CardDescription>Menampilkan berkas hukum dan kontrak yang dikelompokkan berdasarkan data Klien Retainer aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Cari kontrak berdasarkan judul atau ID..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-64">
              <select
                value={selectedRetainer}
                onChange={(e) => setSelectedRetainer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-250 bg-white rounded-lg text-xs text-black outline-none transition focus:border-brand-500"
              >
                <option value="ALL">Semua Klien Retainer</option>
                {retainers.map((r) => (
                  <option key={r.id} value={r.id}>{r.clientName}</option>
                ))}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Kontrak</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Klien Retainer</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tanggal Mulai</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-gray-900">{c.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      {c.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-brand-50/50 text-brand-700 border-brand-200">
                      {c.retainerName || "Umum"}
                    </Badge>
                  </TableCell>
                  <TableCell><span className="text-gray-500">{c.type}</span></TableCell>
                  <TableCell className="text-gray-500">{c.startDate}</TableCell>
                  <TableCell className="text-gray-500">{c.endDate}</TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteContract(c.id)}>
                        <X className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-gray-500">
                    Tidak ada kontrak ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* NEW CONTRACT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-lg w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">Buat Kontrak Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Judul Kontrak</label>
                <Input 
                  placeholder="Masukkan judul perjanjian..." 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Jenis Kontrak</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                  >
                    <option value="Vendor">Vendor</option>
                    <option value="NDA">NDA</option>
                    <option value="HR">HR / Kepegawaian</option>
                    <option value="Operasional">Operasional</option>
                    <option value="Korporat">Korporat</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Klien Retainer</label>
                  <select
                    value={newRetainerId}
                    onChange={(e) => setNewRetainerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                  >
                    <option value="">-- Umum / Tanpa Klien --</option>
                    {retainers.map(r => (
                      <option key={r.id} value={r.id}>{r.clientName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Status Awal</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                >
                  <option value="Draft">Draf</option>
                  <option value="Review">Dalam Peninjauan</option>
                  <option value="Signed">Ditandatangani</option>
                  <option value="Approved">Disetujui</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button onClick={handleCreateContract}>Simpan Kontrak</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
