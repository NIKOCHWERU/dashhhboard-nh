"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, X, Clock, FileText, ArrowRight, RefreshCw, Send, AlertTriangle, Eye, Bell } from "lucide-react";

interface ApprovalItem {
  id: string;
  name: string;
  requester: string;
  time: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "REVISION_REQUESTED";
  pt: string;
  stages: { name: string; status: "success" | "pending" }[];
  content: string;
}

interface HistoryItem {
  title: string;
  time: string;
  status: "APPROVED" | "REJECTED" | "REVISION";
}

const DOCUMENT_CONTENTS: Record<string, string> = {
  "APP-01": `PERJANJIAN KERJASAMA PENYEDIAAN LAYANAN IT (VENDOR)
Nomor: 089/PKS/IT/2026

Pihak Pertama: PT Narasumber Hukum
Pihak Kedua: PT Braga Jaya Konstruksindo (Penyedia Jasa)

Menimbang perlunya optimalisasi sistem server komputasi cloud, kedua belah pihak sepakat mengikatkan diri dalam kerjasama operasional dengan ketentuan:

Pasal 1: Pihak Kedua wajib menjamin ketersediaan server (uptime) dengan Service Level Agreement (SLA) minimal 99.9% setiap bulannya.
Pasal 2: Nilai kontrak disepakati sebesar Rp 45.000.000 (empat puluh lima juta rupiah) per kuartal, yang dibayarkan paling lambat tanggal 10 di awal periode kuartal baru.
Pasal 3: Pihak Kedua berkomitmen menjaga kerahasiaan seluruh skema basis data dan dilarang menduplikasi kode sumber platform tanpa izin tertulis.

Jakarta, 30 Mei 2026

( PT Narasumber Hukum )             ( PT Braga Jaya Konstruksindo )`,

  "APP-02": `ADDENDUM PERJANJIAN SEWA MENYEWA GEDUNG KANTOR
Nomor: 002/ADD/SEWA/2026

Pihak Pertama: PT Narasumber Hukum (Penyewa)
Pihak Kedua: PT Maju Bersama (Pemilik Gedung)

Menunjuk Perjanjian Utama Sewa Menyewa Ruko Kantor Cabang Nomor 102/PKS/2024, para pihak bersepakat menyusun amandemen pasal sebagai berikut:

Pasal 1: Masa sewa ruko kantor cabang di Kembangan disepakati diperpanjang selama 12 (dua belas) bulan terhitung mulai Juni 2026 hingga Mei 2027.
Pasal 2: Biaya sewa untuk periode perpanjangan disepakati tetap sebesar Rp 85.000.000 (delapan puluh lima juta rupiah) per tahun bersih dari pajak.
Pasal 3: Seluruh klausul dan ketentuan lain di dalam perjanjian utama dinyatakan tetap berlaku penuh, sah, dan mengikat kedua belah pihak.

Jakarta, 30 Mei 2026

( PT Narasumber Hukum )             ( PT Maju Bersama )`
};

export default function ApprovalWorkflowPage() {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([
    {
      id: "APP-01",
      name: "Perjanjian Vendor IT Infrastruktur.pdf",
      requester: "Staf Legal (Andi)",
      time: "2 jam yang lalu",
      status: "PENDING",
      pt: "PT Braga Jaya Konstruksindo",
      stages: [
        { name: "Staf Legal", status: "success" },
        { name: "Manajer HR", status: "success" },
        { name: "Direktur (Anda)", status: "pending" }
      ],
      content: DOCUMENT_CONTENTS["APP-01"]
    },
    {
      id: "APP-02",
      name: "Adendum Sewa Gedung Cabang.pdf",
      requester: "GA Dept (Herman)",
      time: "4 jam yang lalu",
      status: "PENDING",
      pt: "PT Maju Bersama",
      stages: [
        { name: "Staf GA", status: "success" },
        { name: "Direktur (Anda)", status: "pending" }
      ],
      content: DOCUMENT_CONTENTS["APP-02"]
    }
  ]);

  const [history, setHistory] = useState<HistoryItem[]>([
    { title: "Menyetujui NDA Freelancer", time: "Kemarin pukul 14:30", status: "APPROVED" },
    { title: "Menolak Perpanjangan PKWT", time: "2 hari yang lalu", status: "REJECTED" }
  ]);

  // Modal & Notification states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ApprovalItem | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  
  // Toast notifications state
  const [toastMessage, setToastMessage] = useState("");

  // State for simulated push notification to document creator
  const [creatorNotification, setCreatorNotification] = useState<{
    isOpen: boolean;
    recipient: string;
    docName: string;
    type: "APPROVED" | "REJECTED" | "REVISION";
    message: string;
    notes?: string;
  } | null>(null);
  const [notifTimeoutId, setNotifTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  const triggerCreatorNotification = (
    recipient: string,
    docName: string,
    type: "APPROVED" | "REJECTED" | "REVISION",
    notes?: string
  ) => {
    if (notifTimeoutId) {
      clearTimeout(notifTimeoutId);
    }

    let message = "";
    if (type === "APPROVED") {
      message = `Dokumen "${docName}" yang Anda ajukan telah disetujui penuh oleh Direktur dan siap untuk diproses ke tahap penandatanganan.`;
    } else if (type === "REJECTED") {
      message = `Dokumen "${docName}" yang Anda ajukan telah ditolak oleh Direktur. Silakan periksa kembali detail draf perjanjian Anda.`;
    } else if (type === "REVISION") {
      message = `Dokumen "${docName}" memerlukan revisi perbaikan sebelum disetujui.`;
    }

    setCreatorNotification({
      isOpen: true,
      recipient,
      docName,
      type,
      message,
      notes
    });

    const newTimeout = setTimeout(() => {
      setCreatorNotification(null);
    }, 8000);
    setNotifTimeoutId(newTimeout);
  };

  const handleOpenPreview = (doc: ApprovalItem) => {
    setSelectedDoc(doc);
    setIsPreviewOpen(true);
  };

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
    setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
    setIsPreviewOpen(false);

    // Show popup notification to document creator
    showToast(`Sukses: Dokumen "${doc.name}" disetujui. Notifikasi pop-up terkirim ke pembuat surat (${doc.requester})!`);
    triggerCreatorNotification(doc.requester, doc.name, "APPROVED");
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
    setPendingApprovals(pendingApprovals.filter(p => p.id !== id));
    setIsPreviewOpen(false);

    // Show popup notification to document creator
    showToast(`Pemberitahuan: Dokumen "${doc.name}" telah ditolak. Notifikasi pop-up terkirim ke pembuat surat (${doc.requester})!`);
    triggerCreatorNotification(doc.requester, doc.name, "REJECTED");
  };

  const handleOpenRevisionModalFromPreview = () => {
    setIsPreviewOpen(false);
    setIsRevisionModalOpen(true);
  };

  const handleRequestRevision = () => {
    if (!selectedDoc || !revisionNotes) {
      alert("Harap isi catatan revisi terlebih dahulu.");
      return;
    }

    const doc = pendingApprovals.find(p => p.id === selectedDoc.id);
    if (!doc) return;

    // Add to history
    const newHist: HistoryItem = {
      title: `Meminta Revisi ${doc.name}`,
      time: "Baru saja",
      status: "REVISION"
    };

    setHistory([newHist, ...history]);
    setPendingApprovals(pendingApprovals.filter(p => p.id !== selectedDoc.id));
    setIsRevisionModalOpen(false);
    const notes = revisionNotes;
    setRevisionNotes("");

    // Show popup notification to document creator
    showToast(`Sukses: Catatan revisi dikirim. Notifikasi pop-up terkirim ke pembuat surat (${doc.requester})!`);
    triggerCreatorNotification(doc.requester, doc.name, "REVISION", notes);
  };

  return (
    <div className="p-6 space-y-6 relative">
      
      {/* TOAST SUCCESS POPUP ALERT */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-emerald-600 text-white font-bold rounded-xl shadow-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
          <Bell className="w-6 h-6 flex-shrink-0 animate-bounce" />
          <div className="text-xs space-y-1">
            <p className="uppercase tracking-widest font-black text-[10px] text-emerald-200">Notifikasi Sistem Legal</p>
            <p className="leading-relaxed">{toastMessage}</p>
          </div>
          <button onClick={() => setToastMessage("")} className="ml-auto text-white font-black text-sm">&times;</button>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-gray-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alur Persetujuan</h1>
          <p className="text-gray-500">Tinjau dan baca dokumen legal terlebih dahulu sebelum menyetujui atau meminta revisi.</p>
        </div>
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
                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800/80 flex justify-end text-xs font-bold uppercase tracking-wider">
                    <Button 
                      onClick={() => handleOpenPreview(doc)} 
                      className="w-full sm:w-auto bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Tinjau & Baca Dokumen
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

      {/* DRAFT DOCUMENT PREVIEW MODAL */}
      {isPreviewOpen && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-2xl w-full space-y-4 animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 flex-shrink-0">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-500" />
                  Pratinjau Berkas Hukum
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedDoc.name} • {selectedDoc.pt}</p>
              </div>
              <button onClick={() => setIsPreviewOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            {/* Paper sheet */}
            <div className="flex-1 overflow-y-auto p-8 border bg-gray-50 rounded-xl shadow-inner text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-[50vh] text-gray-800">
              {selectedDoc.content}
            </div>

            {/* Stages & Actions inside modal */}
            <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
              <div className="text-[10px] uppercase font-bold text-gray-400">
                Diminta oleh: <span className="text-gray-900">{selectedDoc.requester}</span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto text-xs font-bold uppercase tracking-wider">
                <Button 
                  variant="outline" 
                  onClick={() => handleReject(selectedDoc.id)}
                  className="text-red-500 hover:bg-red-50 flex-1 sm:flex-initial"
                >
                  Tolak
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleOpenRevisionModalFromPreview}
                  className="flex-1 sm:flex-initial"
                >
                  Minta Revisi
                </Button>
                <Button 
                  onClick={() => handleApprove(selectedDoc.id)}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Setujui
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST REVISION MODAL */}
      {isRevisionModalOpen && selectedDoc && (
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

      {/* SIMULATED PUSH NOTIFICATION TO DOCUMENT CREATOR */}
      {creatorNotification && creatorNotification.isOpen && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-[0_10px_45px_rgba(0,0,0,0.18)] overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="relative flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-brand-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Simulasi Notifikasi Pengaju
              </span>
            </span>
            <button 
              onClick={() => setCreatorNotification(null)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition font-bold text-sm"
            >
              &times;
            </button>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl flex-shrink-0 ${
                creatorNotification.type === 'APPROVED' 
                  ? 'bg-emerald-50 dark:bg-emerald-950/35 text-emerald-600 dark:text-emerald-400' 
                  : creatorNotification.type === 'REJECTED'
                  ? 'bg-rose-50 dark:bg-rose-950/35 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-50 dark:bg-amber-950/35 text-amber-600 dark:text-amber-400'
              }`}>
                <Bell className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Penerima: {creatorNotification.recipient}
                </div>
                <h4 className="font-bold text-xs text-gray-900 dark:text-white">
                  {creatorNotification.type === 'APPROVED' 
                    ? 'Dokumen Anda Disetujui!' 
                    : creatorNotification.type === 'REJECTED'
                    ? 'Dokumen Anda Ditolak'
                    : 'Revisi Dokumen Diperlukan'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-1.5">
                  {creatorNotification.message}
                </p>
                {creatorNotification.notes && (
                  <div className="mt-3 p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-lg text-[10px] text-amber-700 dark:text-amber-400 font-medium italic">
                    &ldquo;{creatorNotification.notes}&rdquo;
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase tracking-wide">
              <span>Status: Terkirim via Push</span>
              <button 
                onClick={() => setCreatorNotification(null)}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
              >
                Tutup Simulasi
              </button>
            </div>
          </div>
          
          {/* Progress timer bar */}
          <div className="h-1 bg-gray-100 dark:bg-gray-800 w-full overflow-hidden">
            <div className="h-full bg-brand-500 animate-shrink-width" style={{ transformOrigin: 'left' }}></div>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes shrinkWidth {
              from { width: 100%; }
              to { width: 0%; }
            }
            .animate-shrink-width {
              animation: shrinkWidth 8s linear forwards;
            }
          `}} />
        </div>
      )}
    </div>
  );
}
