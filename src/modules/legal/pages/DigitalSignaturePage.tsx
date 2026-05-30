"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UploadCloud, PenTool, CheckCircle, Shield, Award, Calendar, Layers, X } from "lucide-react";
import { Input } from "../components/ui/input";

interface SignedDoc {
  title: string;
  date: string;
  pt: string;
  fingerprint: string;
}

export default function DigitalSignaturePage() {
  const [signedDocs, setSignedDocs] = useState<SignedDoc[]>([
    { title: "NDA Freelancer - Q3", date: "Hari ini, 14:00", pt: "PT Braga Jaya Konstruksindo", fingerprint: "sha256:8f570233ea4cf909a48f" },
    { title: "Vendor Agreement PT XYZ", date: "Kemarin, 10:30", pt: "PT Maju Bersama", fingerprint: "sha256:2ab7983dea224f909a12" },
    { title: "SPK Renewal 2026", date: "24 Mei 2026, 09:15", pt: "PT Teknologi Bersama", fingerprint: "sha256:b6b8b5d44aef2208a95c" }
  ]);

  // Modal Sign states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docName, setDocName] = useState("");
  const [ptName, setPtName] = useState("PT Braga Jaya Konstruksindo");
  const [signName, setSignName] = useState("Direktur Utama");
  const [signType, setSignType] = useState<"type" | "upload">("type");
  const [isSigningProgress, setIsSigningProgress] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const handleOpenSign = () => {
    setIsModalOpen(true);
    setDocName("");
    setCompletedSteps(0);
  };

  const [completedSteps, setCompletedSteps] = useState(0);

  const handleApplySignature = () => {
    if (!docName) {
      alert("Harap masukkan Nama Dokumen.");
      return;
    }

    setIsSigningProgress(true);
    setProgressStep(0);

    // Simulate cryptographic blockchain signing steps
    const steps = [
      "Membaca berkas dokumen...",
      "Menerapkan algoritma hashing kriptografi sha256...",
      "Membubuhkan segel digital Direksi...",
      "Menyinkronkan jejak audit ke log sistem...",
      "Selesai! Dokumen berhasil ditandatangani."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        setProgressStep(currentStep);
      } else {
        clearInterval(interval);
        
        // Add to audit trail
        const newDoc: SignedDoc = {
          title: docName.endsWith(".pdf") ? docName : `${docName}.pdf`,
          date: "Baru saja",
          pt: ptName,
          fingerprint: `sha256:${Math.random().toString(16).substring(2, 22)}`
        };

        setSignedDocs([newDoc, ...signedDocs]);
        setIsSigningProgress(false);
        setIsModalOpen(false);
        alert(`Sukses: Dokumen "${newDoc.title}" telah ditandatangani secara digital.`);
      }
    }, 1000);
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tanda Tangan Digital</h1>
        <p className="text-gray-500">Tanda tangan digital aman dan pembubuhan stempel kriptografi dengan jejak audit blockchain.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Side: Sign Document Form */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-50 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <PenTool className="w-5 h-5 text-brand-500" />
              Tandatangani Dokumen Baru
            </CardTitle>
            <CardDescription className="text-xs">
              Unggah dan lakukan penandatanganan kriptografi pada berkas perjanjian legal perusahaan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div 
              onClick={handleOpenSign}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:bg-gray-50/50 transition cursor-pointer space-y-3"
            >
              <UploadCloud className="w-12 h-12 text-brand-500 mx-auto" />
              <p className="font-bold text-xs text-gray-900">Seret & Letakkan berkas atau Klik di sini</p>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Mendukung PDF, DOCX (Maks 10MB)</p>
            </div>
            <Button onClick={handleOpenSign} className="w-full text-xs font-black uppercase tracking-wider py-3">
              <PenTool className="w-4 h-4 mr-2"/> Bubuhkan Tanda Tangan
            </Button>
          </CardContent>
        </Card>

        {/* Right Side: Audit Trail List */}
        <Card className="shadow-lg">
          <CardHeader className="border-b border-gray-50 py-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-brand-500" />
              Jejak Audit Tanda Tangan
            </CardTitle>
            <CardDescription className="text-xs">
              Daftar dokumen hukum yang telah berhasil dibubuhi stempel digital dan tanda tangan.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 no-scrollbar">
              {signedDocs.map((doc, i) => (
                <div key={i} className="p-4 border rounded-xl bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition hover:shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl h-fit">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-gray-900 leading-snug">{doc.title}</h4>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{doc.pt} • {doc.date}</p>
                      <p className="font-mono text-[9px] text-gray-400 break-all bg-gray-50 px-2 py-1 border">{doc.fingerprint}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs self-end sm:self-center">
                    Verifikasi
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SIGNING DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                <PenTool className="w-5 h-5 text-brand-500" />
                Segel Kriptografi Dokumen
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>

            {isSigningProgress ? (
              /* SIGNING PROGRESS LOADER */
              <div className="py-8 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="font-bold text-xs text-gray-900">Proses Penandatanganan...</p>
                  <p className="text-[11px] text-gray-500 italic">
                    {[
                      "Membaca berkas dokumen...",
                      "Menerapkan algoritma hashing kriptografi sha256...",
                      "Membubuhkan segel digital Direksi...",
                      "Menyinkronkan jejak audit ke log sistem...",
                      "Selesai! Dokumen berhasil ditandatangani."
                    ][progressStep]}
                  </p>
                </div>
              </div>
            ) : (
              /* FORM DETAILS */
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Nama Dokumen</label>
                  <Input 
                    placeholder="Contoh: Perjanjian_Sewa_Ruko_Kembangan.pdf" 
                    value={docName} 
                    onChange={(e) => setDocName(e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Perusahaan (Klien Retainer)</label>
                  <select
                    value={ptName}
                    onChange={(e) => setPtName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs font-semibold"
                  >
                    <option value="PT Braga Jaya Konstruksindo">PT Braga Jaya Konstruksindo</option>
                    <option value="PT Maju Bersama">PT Maju Bersama</option>
                    <option value="PT Teknologi Bersama">PT Teknologi Bersama</option>
                  </select>
                </div>

                {/* Signature Stylizer input */}
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Ketik Nama Tanda Tangan</label>
                  <Input 
                    value={signName} 
                    onChange={(e) => setSignName(e.target.value)} 
                  />
                </div>

                {/* Live cursive preview box */}
                <div className="p-4 border bg-gray-50 rounded-xl text-center shadow-inner relative overflow-hidden">
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase text-gray-400 tracking-wider">Pratinjau TTD</span>
                  <div 
                    style={{ fontFamily: "'Brush Script MT', cursive, sans-serif" }}
                    className="text-4xl text-brand-600 py-6 select-none"
                  >
                    {signName || "Nama Anda"}
                  </div>
                  <div className="border-t border-dashed w-3/4 mx-auto text-gray-400 text-[10px]">Tanda Tangan Digital Kriptografi</div>
                </div>
              </div>
            )}

            {!isSigningProgress && (
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button onClick={handleApplySignature} className="bg-brand-500 text-white font-bold">
                  <CheckCircle className="w-4 h-4 mr-2" /> Terapkan Tanda Tangan
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
