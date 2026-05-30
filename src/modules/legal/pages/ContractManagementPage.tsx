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
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [selectedRetainer, setSelectedRetainer] = useState<string>("ALL");
  const [contracts, setContracts] = useState<any[]>([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("Vendor");
  const [newRetainerId, setNewRetainerId] = useState("");
  const [newPicName, setNewPicName] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newStatus, setNewStatus] = useState("Draft");

  // Fetch Retainer & Employee data from database API
  useEffect(() => {
    const fetchData = async () => {
      let fetchedRetainers: any[] = [];
      let fetchedEmployees: any[] = [];

      try {
        const res = await fetch("/api/retainer");
        if (res.ok) {
          fetchedRetainers = await res.json();
          setRetainers(fetchedRetainers);
        }
      } catch (err) {
        console.error("Failed to load retainers:", err);
      }

      try {
        const res = await fetch("/api/karyawan");
        if (res.ok) {
          fetchedEmployees = await res.json();
          setEmployees(fetchedEmployees);
        }
      } catch (err) {
        console.error("Failed to load employees:", err);
      }

      // Map dummy contracts to actual database retainers and employees if they exist
      const mappedContracts = INITIAL_DUMMY_CONTRACTS.map((c, index) => {
        const rIndex = index % (fetchedRetainers.length || 1);
        const eIndex = index % (fetchedEmployees.length || 1);
        const ret = fetchedRetainers[rIndex];
        const emp = fetchedEmployees[eIndex];

        return {
          ...c,
          retainerId: ret ? ret.id : `RET-00${rIndex + 1}`,
          retainerName: ret ? ret.clientName : (index % 2 === 0 ? "PT Braga Jaya Konstruksindo" : "PT Maju Bersama"),
          picName: emp ? emp.name : (index % 2 === 0 ? "Sarah Johnson" : "Budi Santoso"),
          title: ret 
            ? c.title.replace(/PT Maju Bersama|Freelance Designer|Sarah Johnson|Kantor Pusat|API|Universitas Bina Nusantara/g, ret.clientName)
            : c.title
        };
      });
      setContracts(mappedContracts);
    };
    
    fetchData();
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
      retainerName: selectedRet ? selectedRet.clientName : "Umum / Tanpa Klien",
      picName: newPicName || "Budi Santoso"
    };

    setContracts([newContract, ...contracts]);
    setIsModalOpen(false);
    
    // Reset form
    setNewTitle("");
    setNewType("Vendor");
    setNewRetainerId("");
    setNewPicName("");
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
                <TableHead className="w-[100px]">ID Kontrak</TableHead>
                <TableHead className="max-w-[200px]">Judul</TableHead>
                <TableHead>PIC / Karyawan</TableHead>
                <TableHead>Perusahaan / PT Klien</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Masa Berlaku</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-gray-900">{c.id}</TableCell>
                  <TableCell className="max-w-[200px] break-words font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      <span className="truncate md:whitespace-normal">{c.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">{c.picName || "Sarah Johnson"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-brand-50/50 text-brand-700 border-brand-200 text-[10px]">
                      {c.retainerName || "Umum"}
                    </Badge>
                  </TableCell>
                  <TableCell><span className="text-gray-500 text-xs">{c.type}</span></TableCell>
                  <TableCell className="text-gray-500 text-xs">
                    <div>{c.startDate}</div>
                    <div className="text-[10px] text-gray-400">s/d {c.endDate}</div>
                  </TableCell>
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
                  <label className="font-semibold text-gray-700">Klien Retainer / PT</label>
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
                  <label className="font-semibold text-gray-700">PIC / Karyawan</label>
                  <select
                    value={newPicName}
                    onChange={(e) => setNewPicName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs"
                  >
                    <option value="">-- Pilih PIC Karyawan --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.name}>{emp.name}</option>
                    ))}
                  </select>
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
