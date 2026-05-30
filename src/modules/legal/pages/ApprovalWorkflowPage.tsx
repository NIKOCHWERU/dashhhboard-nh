"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, X, Clock, FileText, ArrowRight, RefreshCw, Send, AlertTriangle } from "lucide-react";

interface ApprovalItem {
  id: string;
  name: string;
  requester: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  pt: string;
  stages: { name: string; status: "success" | "pending" }[];
}

interface HistoryItem {
  title: string;
  time: string;
  status: "APPROVED" | "REJECTED" | "REVISION";
}

export default function ApprovalWorkflowPage() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([
    {
      id: "APP-01",
      name: "Perjanjian Vendor IT Infrastruktur.pdf",
      requester: "Staf Legal",
      time: "2 jam yang lalu",
      status: "PENDING",
      pt: "PT Braga Jaya Konstruksindo",
      stages: [
        { name: "Staf Legal", status: "success" },
        { name: "Manajer HR", status: "success" },
        { name: "Direktur (Anda)", status: "pending" }
      ]
    },
    {
      id: "APP-02",
      name: "Adendum Sewa Gedung Cabang.pdf",
      requester: "GA Dept",
      time: "4 jam yang lalu",
      status: "PENDING",
      pt: "PT Maju Bersama",
      stages: [
        { name: "Staf GA", status: "success" },
        { name: "Direktur (Anda)", status: "pending" }
      ]
    }
  ]);

  const [history, setHistory] = useState<HistoryItem[]>([
    { title: "Menyetujui NDA Freelancer", time: "Kemarin pukul 14:30", status: "APPROVED" },
    { title: "Menolak Perpanjangan PKWT", time: "2 hari yang lalu", status: "REJECTED" }
  ]);

  // Modal revision states
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  const handleApprove = (id: string) => {
    const doc = pendingApprovals.find(p => p.id === id);
    if (!doc) return;

    // Add to history
    const newHist: HistoryItem = {
      title: `Menyetujui ${doc.name}`,
      time: "Baru saja",
      status: "APPROVED"
    };

    setHistory([newHist, ...history]);
    // Remove from pending
    setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
    alert(`Sukses: Dokumen "${doc.name}" telah disetujui.`);
  };

  const handleReject = (id: string) => {
    const doc = pendingApprovals.find(p => p.id === id);
    if (!doc) return;

    if (!confirm(`Apakah Anda yakin ingin menolak dokumen "${doc.name}"?`)) return;

    // Add to history
    const newHist: HistoryItem = {
      title: `Menolak ${doc.name}`,
      time: "Baru saja",
      status: "REJECTED"
    };

    setHistory([newHist, ...history]);
    // Remove from pending
    setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
  };

  const handleOpenRevisionModal = (id: string) => {
    setSelectedDocId(id);
    setIsRevisionModalOpen(true);
  };

  const handleRequestRevision = () => {
    if (!selectedDocId || !revisionNotes) {
      alert("Harap isi catatan revisi terlebih dahulu.");
      return;
    }

    const doc = pendingApprovals.find(p => p.id === selectedDocId);
    if (!doc) return;

    // Add to history
    const newHist: HistoryItem = {
      title: `Meminta Revisi ${doc.name}`,
      time: "Baru saja",
      status: "REVISION"
    };

    setHistory([newHist, ...history]);
    setPendingApprovals(pendingApprovals.filter(p => p.id !== selectedDocId));
    setIsRevisionModalOpen(false);
    setRevisionNotes("");
    alert(`Sukses: Permintaan revisi dokumen "${doc.name}" telah dikirim ke pengusul.`);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alur Persetujuan</h1>
        <p className="text-gray-500">Sistem persetujuan dokumen bertingkat dan penandatanganan Direksi.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Pending List */}
        <div className="lg:col-span-2 space-y-6">
          {pendingApprovals.length > 0 ? (
            pendingApprovals.map((doc) => (
              <Card key={doc.id} className="shadow-md hover:shadow-lg transition">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex gap-4">
                      <div className="p-3 bg-brand-50 text-brand-600 rounded-xl h-fit">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="warning" className="text-[10px]">Menunggu Persetujuan Anda</Badge>
                          <Badge variant="outline" className="bg-brand-50/50 text-brand-700 border-brand-200 text-[10px]">
                            {doc.pt}
                          </Badge>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">{doc.name}</h3>
                        <p className="text-[11px] text-gray-500 mt-1">Diminta oleh: {doc.requester} • {doc.time}</p>
                        
                        {/* Approval levels */}
                        <div className="mt-6 flex flex-wrap items-center gap-2 text-[10px] uppercase font-black tracking-wider">
                          {doc.stages.map((stage, sIdx) => (
                            <React.Fragment key={sIdx}>
                              {sIdx > 0 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
                              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold ${
                                stage.status === 'success' 
                                  ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20' 
                                  : 'text-amber-600 bg-amber-50 dark:bg-amber-950/20'
                              }`}>
                                {stage.status === 'success' ? <Check className="w-3 h-3"/> : <Clock className="w-3 h-3"/>}
                                {stage.name}
                              </span>
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap gap-3 justify-end text-xs font-bold uppercase tracking-wider">
                    <Button 
                      variant="outline" 
                      onClick={() => handleReject(doc.id)} 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5 mr-2" /> Tolak
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleOpenRevisionModal(doc.id)}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-2" /> Minta Revisi
                    </Button>
                    <Button 
                      onClick={() => handleApprove(doc.id)}
                    >
                      <Check className="w-3.5 h-3.5 mr-2" /> Setujui Dokumen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl shadow-inner">
              <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-xs font-semibold">Semua pekerjaan persetujuan telah selesai.</p>
              <p className="text-[11px] text-gray-400 mt-1">Tidak ada dokumen tertunda yang memerlukan tinjauan Anda.</p>
            </Card>
          )}
        </div>
        
        {/* Right Side: History Log */}
        <Card className="lg:col-span-1 shadow-md">
          <CardHeader className="border-b border-gray-50">
            <CardTitle>Riwayat Tindakan</CardTitle>
            <CardDescription className="text-[11px]">Log persetujuan yang telah Anda putuskan baru-baru ini.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-5">
                {history.map((hist, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-3">
                    <div className={`mt-0.5 p-1.5 rounded-full ${
                      hist.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : hist.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {hist.status === 'APPROVED' ? <Check className="w-3 h-3" /> : hist.status === 'REJECTED' ? <X className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white leading-snug">{hist.title}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{hist.time}</p>
                    </div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* REQUEST REVISION MODAL */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Catatan Revisi Dokumen
              </h3>
              <button onClick={() => setIsRevisionModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-2 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Tuliskan bagian, pasal, atau klausul spesifik yang perlu direvisi oleh tim pengusul sebelum Anda menyetujui draf berkas ini.
              </p>
              <textarea
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Contoh: Pasal 5 ayat 2 mengenai penyesuaian termin pembayaran harap diubah dari 30 hari menjadi 14 hari kerja."
                className="w-full rounded-lg border border-gray-200 bg-transparent px-4 py-3 text-xs outline-none focus:border-brand-500 dark:border-gray-800"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)}>Batal</Button>
              <Button onClick={handleRequestRevision} className="bg-amber-500 hover:bg-amber-600 text-white">
                <Send className="w-3.5 h-3.5 mr-2" /> Kirim Revisi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
