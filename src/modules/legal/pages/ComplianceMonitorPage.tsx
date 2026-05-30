"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ShieldCheck, AlertCircle, FileWarning, CheckCircle, Check, X, ShieldAlert, Award } from "lucide-react";

interface ComplianceItem {
  id: string;
  title: string;
  desc: string;
  pt: string;
  pic: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  details: string;
  requirements: string[];
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden shadow-inner">
      <div 
        className="h-full bg-emerald-400 transition-all duration-700 ease-out" 
        style={{ width: `${value}%` }} 
      />
    </div>
  );
}

export default function ComplianceMonitorPage() {
  const [healthScore, setHealthScore] = useState(92);
  const [complianceLevel, setComplianceLevel] = useState(92);
  const [items, setItems] = useState<ComplianceItem[]>([
    {
      id: "CMP-01",
      title: "Data BPJS Karyawan Belum Lengkap",
      desc: "3 karyawan belum melengkapi dokumen pendaftaran BPJS Kesehatan wajib.",
      pt: "PT Braga Jaya Konstruksindo",
      pic: "sarah.johnson@bragajaya.co.id",
      severity: "HIGH",
      details: "Berdasarkan audit ketenagakerjaan berkala, terdapat 3 karyawan kontrak (PKWT) aktif di PT Braga Jaya yang belum melampirkan berkas pendaftaran BPJS Kesehatan wajib ke sistem.",
      requirements: [
        "Unggah Formulir F1 BPJS Kesehatan untuk masing-masing dari 3 karyawan.",
        "Unggah KTP dan Kartu Keluarga karyawan terkait.",
        "Dapatkan persetujuan dari HR Manager PT Braga."
      ]
    },
    {
      id: "CMP-02",
      title: "Izin Vendor Segera Kedaluwarsa",
      desc: "Izin operasional PT Teknologi Bersama akan habis dalam 14 hari.",
      pt: "PT Teknologi Bersama",
      pic: "andi.pratama@teknologibersama.com",
      severity: "MEDIUM",
      details: "Perjanjian kerjasama (PKS) lisensi perangkat lunak dengan PT Teknologi Bersama dijadwalkan berakhir pada 14 Juni 2026. Perpanjangan draf perlu disiapkan untuk menghindari penghentian layanan.",
      requirements: [
        "Drafting Adendum perpanjangan masa berlaku kontrak vendor selama 12 bulan.",
        "Review nilai kontrak kerjasama baru oleh tim finance.",
        "Tanda tangan digital perpanjangan oleh Direktur Utama."
      ]
    }
  ]);

  // Modal Review States
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const [completedReqs, setCompletedReqs] = useState<Record<string, boolean>>({});

  const handleOpenReview = (item: ComplianceItem) => {
    setSelectedItem(item);
    setCompletedReqs({});
  };

  const handleToggleReq = (index: number) => {
    setCompletedReqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleResolveCompliance = () => {
    if (!selectedItem) return;

    // Remove the resolved item from list
    const remainingItems = items.filter(i => i.id !== selectedItem.id);
    setItems(remainingItems);

    // Boost the health score and compliance percentage
    const boost = selectedItem.severity === "HIGH" ? 5 : 3;
    setHealthScore(prev => Math.min(100, prev + boost));
    setComplianceLevel(prev => Math.min(100, prev + boost));

    setSelectedItem(null);
    alert(`Sukses: Masalah kepatuhan "${selectedItem.title}" telah dinyatakan terpenuhi.`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pemantauan Kepatuhan</h1>
        <p className="text-gray-500">Lacak kesehatan hukum korporasi, verifikasi daftar periksa legalitas, dan mitigasi risiko regulasi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Banner */}
        <Card className="md:col-span-1 bg-brand-900 text-white border-0 overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32 text-white" />
          </div>
          <CardContent className="p-6 relative z-10 space-y-6">
            <div>
              <p className="text-brand-200 text-xs font-bold uppercase tracking-wider">Skor Kesehatan Hukum</p>
              <div className="flex items-end gap-2 mt-2">
                <h2 className="text-5xl font-black">{healthScore}</h2>
                <span className="text-brand-300 mb-1">/ 100</span>
              </div>
            </div>
            
            <p className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4" /> {healthScore >= 95 ? "Tingkat Kepatuhan Sempurna" : "Status Sangat Baik"}
            </p>
            
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs font-bold text-brand-200">
                <span>Rasio Kepatuhan</span>
                <span>{complianceLevel}%</span>
              </div>
              <ProgressBar value={complianceLevel} />
            </div>
          </CardContent>
        </Card>

        {/* Action Items List */}
        <Card className="md:col-span-2 shadow-lg">
          <CardHeader className="border-b border-gray-50 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-brand-500" />
              Tindakan Kepatuhan yang Diperlukan
            </CardTitle>
            <CardDescription className="text-xs">
              Menampilkan daftar risiko atau kekurangan regulasi yang membutuhkan mitigasi secepatnya.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-4">
                {items.length > 0 ? (
                  items.map((item) => (
                    <div key={item.id} className={`p-4 border rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 transition hover:shadow bg-white ${
                      item.severity === 'HIGH' ? 'border-red-100 bg-red-50/20' : 'border-amber-100 bg-amber-50/20'
                    }`}>
                      <div className="flex gap-3 items-start">
                        <AlertCircle className={`w-5 h-5 mt-0.5 ${item.severity === 'HIGH' ? 'text-red-500' : 'text-amber-500'}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-gray-400">{item.id}</span>
                            <Badge variant={item.severity === 'HIGH' ? 'destructive' : 'warning'} className="text-[9px] px-1.5 py-0">
                              {item.severity === 'HIGH' ? 'Kritis' : 'Medium'}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] border-gray-250 bg-white">
                              {item.pt}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-xs text-gray-950">{item.title}</h4>
                          <p className="text-xs text-gray-500 max-w-xl">{item.desc}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleOpenReview(item)} className="bg-white text-xs whitespace-nowrap self-end sm:self-center">
                        Tinjau Masalah
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-900">Perusahaan 100% Patuh Hukum</p>
                    <p className="text-[11px] text-gray-400 mt-1">Seluruh kriteria, perizinan, dan BPJS karyawan terpenuhi dengan sempurna.</p>
                  </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* COMPLIANCE REVIEW MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-lg w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-brand-500" />
                Audit Kepatuhan: {selectedItem.id}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 dark:text-white text-xs">{selectedItem.title}</h4>
                <p className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider">{selectedItem.pt} • PIC: {selectedItem.pic}</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg text-gray-600 leading-relaxed border">
                {selectedItem.details}
              </div>

              {/* Requirement Checklist */}
              <div className="space-y-2">
                <h5 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[10px]">Daftar Pemenuhan Syarat (Checklist)</h5>
                <div className="space-y-2">
                  {selectedItem.requirements.map((req, index) => {
                    const isChecked = !!completedReqs[index];
                    return (
                      <div 
                        key={index} 
                        onClick={() => handleToggleReq(index)}
                        className="flex items-start gap-2.5 p-2.5 border rounded-lg hover:bg-gray-50/50 cursor-pointer transition"
                      >
                        <div className={`mt-0.5 w-4.5 h-4.5 border rounded flex items-center justify-center transition ${
                          isChecked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`flex-1 text-xs ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {req}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setSelectedItem(null)}>Batal</Button>
              <Button 
                onClick={handleResolveCompliance} 
                disabled={Object.keys(completedReqs).filter(k => completedReqs[k]).length < selectedItem.requirements.length}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                <Check className="w-4 h-4 mr-2" /> Tandai Terpenuhi (Resolve)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
