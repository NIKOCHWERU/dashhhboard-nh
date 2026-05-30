"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { AlertTriangle, Clock, CalendarDays, CheckCircle2, Calendar, FileText, Check } from "lucide-react";

const INITIAL_EXPIRING_CONTRACTS = [
  { id: "CTR-003", title: "PKWT - Budi Santoso", type: "HR", expiryDate: "2026-05-31", daysLeft: 1, picName: "Budi Santoso", ptName: "PT Narasumber Hukum" },
  { id: "CTR-012", title: "Vendor Agreement - PT Sukses Makmur", type: "Vendor", expiryDate: "2026-06-05", daysLeft: 6, picName: "Rian Hidayat", ptName: "PT Sukses Makmur" },
  { id: "CTR-044", title: "Sewa Kendaraan Operasional", type: "Operational", expiryDate: "2026-06-10", daysLeft: 11, picName: "Herman GA", ptName: "PT Braga Jaya Konstruksindo" },
  { id: "CTR-055", title: "Software License - Adobe", type: "Vendor", expiryDate: "2026-06-25", daysLeft: 26, picName: "Sarah Johnson", ptName: "PT Maju Bersama" },
  { id: "CTR-089", title: "NDA - Budi Karya", type: "NDA", expiryDate: "2026-06-28", daysLeft: 29, picName: "Budi Karya", ptName: "PT Teknologi Bersama" },
];

export default function ExpiryMonitoringPage() {
  const [contracts, setContracts] = useState<any[]>(INITIAL_EXPIRING_CONTRACTS);
  const [selectedContract, setSelectedContract] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Dynamically map retainers and employees if API calls succeed
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const resRetainer = await fetch("/api/retainer");
        const resKaryawan = await fetch("/api/karyawan");
        if (resRetainer.ok && resKaryawan.ok) {
          const retainers = await resRetainer.json();
          const employees = await resKaryawan.json();

          if (retainers.length > 0 && employees.length > 0) {
            const mapped = INITIAL_EXPIRING_CONTRACTS.map((c, index) => {
              const ret = retainers[index % retainers.length];
              const emp = employees[index % employees.length];
              return {
                ...c,
                picName: emp ? emp.name : c.picName,
                ptName: ret ? ret.clientName : c.ptName,
                title: ret ? c.title.replace(/PT Sukses Makmur|Budi Karya/g, ret.clientName) : c.title
              };
            });
            setContracts(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to load metadata in expiry page:", err);
      }
    };
    fetchMeta();
  }, []);

  const handleOpenRenewModal = (c: any) => {
    setSelectedContract(c);
    setNewExpiryDate("");
    setSuccessMessage("");
    setIsModalOpen(true);
  };

  const handleRenewSubmit = () => {
    if (!newExpiryDate) {
      alert("Harap pilih tanggal kedaluwarsa baru.");
      return;
    }

    const today = new Date("2026-05-30");
    const expiry = new Date(newExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      alert("Tanggal kedaluwarsa baru harus di masa mendatang.");
      return;
    }

    const updatedContracts = contracts.map(c => {
      if (c.id === selectedContract.id) {
        return {
          ...c,
          expiryDate: newExpiryDate,
          daysLeft: diffDays
        };
      }
      return c;
    });

    setContracts(updatedContracts);
    setSuccessMessage("Kontrak berhasil diperpanjang!");
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedContract(null);
    }, 1500);
  };

  // Count items for top stats
  const expiredCount = contracts.filter(c => c.daysLeft <= 0).length;
  const criticalCount = contracts.filter(c => c.daysLeft > 0 && c.daysLeft <= 7).length;
  const warningCount = contracts.filter(c => c.daysLeft > 7 && c.daysLeft <= 14).length;
  const safeCount = contracts.filter(c => c.daysLeft > 14 && c.daysLeft <= 30).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pemantauan Kedaluwarsa</h1>
        <p className="text-gray-500">Pantau kontrak dan dokumen yang mendekati tanggal habis masa berlaku.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Kedaluwarsa</h3>
            </div>
            <p className="text-3xl font-black text-red-700 mt-2">{expiredCount || 0}</p>
            <p className="text-sm text-red-600 mt-1">Kontrak melewati kedaluwarsa</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600">
              <Clock className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 7 Hari</h3>
            </div>
            <p className="text-3xl font-black text-amber-700 mt-2">{criticalCount}</p>
            <p className="text-sm text-amber-600 mt-1">Kedaluwarsa dalam seminggu</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-blue-600">
              <CalendarDays className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 14 Hari</h3>
            </div>
            <p className="text-3xl font-black text-blue-700 mt-2">{warningCount}</p>
            <p className="text-sm text-blue-600 mt-1">Kedaluwarsa dalam dua minggu</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 30 Hari</h3>
            </div>
            <p className="text-3xl font-black text-emerald-700 mt-2">{safeCount}</p>
            <p className="text-sm text-emerald-600 mt-1">Kedaluwarsa dalam sebulan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Segera Kedaluwarsa</CardTitle>
          <CardDescription>Kontrak diurutkan berdasarkan tanggal kedaluwarsa terdekat.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Kontrak</TableHead>
                <TableHead className="max-w-[200px]">Judul</TableHead>
                <TableHead>PIC / Karyawan</TableHead>
                <TableHead>Perusahaan / PT Klien</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Tanggal Kedaluwarsa</TableHead>
                <TableHead>Sisa Hari</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-gray-900">{c.id}</TableCell>
                  <TableCell className="max-w-[200px] break-words font-semibold">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span>{c.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-950">{c.picName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-brand-50/50 text-brand-700 border-brand-200 text-[10px]">
                      {c.ptName}
                    </Badge>
                  </TableCell>
                  <TableCell><span className="text-gray-500 text-xs">{c.type}</span></TableCell>
                  <TableCell className="text-gray-900 font-medium">{c.expiryDate}</TableCell>
                  <TableCell>
                    {c.daysLeft <= 7 ? (
                      <Badge variant="destructive">{c.daysLeft} Hari</Badge>
                    ) : c.daysLeft <= 14 ? (
                      <Badge variant="warning">{c.daysLeft} Hari</Badge>
                    ) : (
                      <Badge variant="secondary">{c.daysLeft} Hari</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleOpenRenewModal(c)}>Perpanjang</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* RENEW CONTRACT DIALOG MODAL */}
      {isModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                Perpanjang Kontrak
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <p className="text-gray-500">
                Anda memilih untuk memperpanjang masa berlaku dokumen berikut:
              </p>
              
              <div className="p-3 bg-gray-50 border rounded-lg space-y-1">
                <div className="font-bold text-gray-900">{selectedContract.title}</div>
                <div className="text-gray-500">ID: {selectedContract.id} • Jenis: {selectedContract.type}</div>
                <div className="text-gray-500">PIC: {selectedContract.picName} ({selectedContract.ptName})</div>
                <div className="text-red-600 font-semibold mt-1">Kedaluwarsa Sebelumnya: {selectedContract.expiryDate}</div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="font-semibold text-gray-700">Tanggal Kedaluwarsa Baru</label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none text-xs bg-white"
                />
              </div>

              {successMessage && (
                <div className="p-2 bg-emerald-50 border border-emerald-250 rounded text-emerald-700 text-center font-bold flex items-center justify-center gap-1">
                  <Check className="w-4 h-4" /> {successMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button onClick={handleRenewSubmit} disabled={!!successMessage}>Perpanjang Kontrak</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
