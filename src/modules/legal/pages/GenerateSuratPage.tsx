"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { FileText, Download, Check, UploadCloud, Settings, Edit3, Eye } from "lucide-react";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

// Pre-configured letter templates
const TEMPLATES_LIBRARY = {
  SP: {
    name: "Surat Peringatan (SP)",
    placeholders: ["nomor_sp", "nama_karyawan", "jabatan", "alasan", "jangka_waktu", "tanggal_terbit"],
    defaults: {
      nomor_sp: "001/SP/HRD/V/2026",
      nama_karyawan: "Budi Santoso",
      jabatan: "Software Engineer",
      alasan: "Tidak hadir tanpa keterangan selama 3 hari berturut-turut.",
      jangka_waktu: "6 (enam) bulan",
      tanggal_terbit: "2026-05-30"
    },
    text: `SURAT PERINGATAN KARYAWAN
Nomor: {{nomor_sp}}

Kepada Yth,
Nama: {{nama_karyawan}}
Jabatan: {{jabatan}}
PT Narasumber Hukum

Dengan ini perusahaan menerbitkan Surat Peringatan ini berdasarkan temuan pelanggaran kedisiplinan kerja, yaitu:
{{alasan}}

Diharapkan karyawan yang bersangkutan dapat melakukan perbaikan kedisiplinan dan kinerja dalam jangka waktu {{jangka_waktu}} terhitung sejak tanggal diterbitkannya surat ini pada {{tanggal_terbit}}. Apabila tidak ada perbaikan, perusahaan akan mengambil tindakan administratif lebih lanjut sesuai dengan ketentuan yang berlaku.

Jakarta, {{tanggal_terbit}}

Hormat kami,
PT Narasumber Hukum



( Direktur HRD )`
  },
  PKWT: {
    name: "Perjanjian Kerja (PKWT)",
    placeholders: ["nomor_kontrak", "nama_karyawan", "jabatan", "gaji", "durasi_kontrak", "tanggal_mulai", "tanggal_selesai"],
    defaults: {
      nomor_kontrak: "102/PKWT/NH/2026",
      nama_karyawan: "Sarah Johnson",
      jabatan: "UX Designer",
      gaji: "8.500.000",
      durasi_kontrak: "1 (satu) tahun",
      tanggal_mulai: "2026-06-01",
      tanggal_selesai: "2027-06-01"
    },
    text: `PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: {{nomor_kontrak}}

Perjanjian kerja ini ditandatangani antara PT Narasumber Hukum selaku Pemberi Kerja dan Karyawan berikut:

Nama: {{nama_karyawan}}
Jabatan: {{jabatan}}
Gaji Bulanan: Rp {{gaji}}

Kedua belah pihak sepakat untuk mengikatkan diri dalam hubungan kerja dengan ketentuan sebagai berikut:
1. Hubungan kerja bersifat Kontrak Waktu Tertentu (PKWT) selama {{durasi_kontrak}}.
2. Kontrak ini terhitung mulai tanggal {{tanggal_mulai}} sampai dengan tanggal {{tanggal_selesai}}.
3. Karyawan wajib menaati segala peraturan perusahaan yang berlaku dan melaksanakan tugas dengan dedikasi tinggi.

Jakarta, {{tanggal_mulai}}

Pemberi Kerja,                      Penerima Kerja,



( PT Narasumber Hukum )             ( {{nama_karyawan}} )`
  },
  NDA: {
    name: "Non-Disclosure Agreement (NDA)",
    placeholders: ["tanggal_perjanjian", "pihak_pertama", "pihak_kedua", "informasi_rahasia"],
    defaults: {
      tanggal_perjanjian: "2026-05-30",
      pihak_pertama: "PT Narasumber Hukum",
      pihak_kedua: "PT Teknologi Bersama",
      informasi_rahasia: "Source code platform, skema arsitektur database, dan data profil klien."
    },
    text: `PERJANJIAN KERAHASIAAN INFORMASI (NDA)

Perjanjian Non-Disclosure ini ditandatangani pada tanggal {{tanggal_perjanjian}} oleh dan antara para pihak di bawah ini:

1. Pihak Pertama: {{pihak_pertama}}
2. Pihak Kedua: {{pihak_kedua}}

Bahwa para pihak sepakat untuk melakukan kerjasama strategis yang mewajibkan adanya pertukaran informasi sensitif. Oleh karena itu, para pihak setuju atas ketentuan berikut:

Pasal 1: Informasi Rahasia yang dimaksud dalam perjanjian ini mencakup namun tidak terbatas pada: {{informasi_rahasia}}
Pasal 2: Pihak Kedua berkomitmen menjaga kerahasiaan seluruh informasi tersebut dan dilarang menduplikasi, menyebarkan, atau membocorkannya kepada pihak ketiga tanpa izin tertulis dari Pihak Pertama.

Ditandatangani oleh para pihak:

Pihak Pertama,                      Pihak Kedua,



( {{pihak_pertama}} )               ( {{pihak_kedua}} )`
  },
  Vendor: {
    name: "Perjanjian Kerjasama Vendor",
    placeholders: ["nomor_perjanjian", "nama_vendor", "ruang_lingkup", "nilai_kontrak", "jangka_waktu", "tanggal_mulai"],
    defaults: {
      nomor_perjanjian: "045/PKS/VENDOR/2026",
      nama_vendor: "PT Maju Bersama",
      ruang_lingkup: "Penyediaan jasa keamanan dan kebersihan kantor pusat.",
      nilai_kontrak: "120.000.000",
      jangka_waktu: "12 bulan",
      tanggal_mulai: "2026-06-01"
    },
    text: `PERJANJIAN KERJASAMA PENYEDIAAN JASA (VENDOR)
Nomor: {{nomor_perjanjian}}

Perjanjian kerjasama ini dibuat dan ditandatangani pada tanggal {{tanggal_mulai}} oleh PT Narasumber Hukum dan:

Nama Vendor: {{nama_vendor}}
Ruang Lingkup Pekerjaan: {{ruang_lingkup}}
Nilai Kontrak Kerjasama: Rp {{nilai_kontrak}}
Jangka Waktu Penyediaan: {{jangka_waktu}}

Kedua belah pihak bersepakat bahwa Vendor akan menyediakan layanan sesuai dengan spesifikasi teknis dan standar profesional yang disepakati. Pembayaran akan dilakukan secara bertahap sesuai dengan prestasi kerja.

Hormat kami,

PT Narasumber Hukum                 {{nama_vendor}}



( Direktur Utama )                  ( Direktur Vendor )`
  },
  Kuasa: {
    name: "Surat Kuasa Khusus",
    placeholders: ["nama_pemberi_kuasa", "nama_penerima_kuasa", "hal_dikuasakan", "tanggal"],
    defaults: {
      nama_pemberi_kuasa: "Niko Chweru",
      nama_penerima_kuasa: "Andi Pratama, S.H.",
      hal_dikuasakan: "Mewakili perusahaan dalam persidangan gugatan perdata sengketa tanah di PN Jakarta Selatan.",
      tanggal: "2026-05-30"
    },
    text: `SURAT KUASA KHUSUS

Yang bertandatangan di bawah ini:
Nama Pemberi Kuasa: {{nama_pemberi_kuasa}}
PT Narasumber Hukum

Dengan ini memberikan kuasa penuh kepada penerima kuasa di bawah ini:
Nama Penerima Kuasa: {{nama_penerima_kuasa}}
Profesi: Konsultan Hukum / Advokat

----------------------------- KHUSUS -----------------------------
Untuk bertindak atas nama Pemberi Kuasa dalam urusan hukum:
{{hal_dikuasakan}}

Penerima kuasa diberikan hak untuk menghadiri sidang, mengajukan bukti, mengajukan gugatan atau tanggapan, serta melakukan tindakan hukum lainnya yang sah demi membela kepentingan Pemberi Kuasa.

Surat kuasa ini dibuat pada tanggal {{tanggal}} untuk dipergunakan sebagaimana mestinya.

Pemberi Kuasa,                      Penerima Kuasa,



( {{nama_pemberi_kuasa}} )          ( {{nama_penerima_kuasa}} )`
  },
  Addendum: {
    name: "Addendum Perjanjian",
    placeholders: ["nomor_addendum", "nomor_perjanjian_awal", "nama_klien", "pasal_diubah", "ketentuan_baru", "tanggal"],
    defaults: {
      nomor_addendum: "001/ADD/PKS/2026",
      nomor_perjanjian_awal: "023/PKS/NH/2025",
      nama_klien: "PT Sukses Makmur",
      pasal_diubah: "Pasal 4 tentang Biaya Jasa Konsultasi Bulanan",
      ketentuan_baru: "Biaya jasa disesuaikan menjadi Rp 15.000.000 per bulan terhitung mulai Juni 2026.",
      tanggal: "2026-05-30"
    },
    text: `ADDENDUM PERJANJIAN KERJASAMA
Nomor Addendum: {{nomor_addendum}}

Addendum ini dibuat pada tanggal {{tanggal}} sebagai amandemen dari Perjanjian Awal Nomor: {{nomor_perjanjian_awal}} antara PT Narasumber Hukum dan:

Nama Klien: {{nama_klien}}

Para pihak bersepakat untuk merubah ketentuan perjanjian awal sebagai berikut:
1. Ketentuan di dalam {{pasal_diubah}} dinyatakan diubah.
2. Bunyi amandemen baru adalah: {{ketentuan_baru}}
3. Seluruh pasal dan ketentuan lain di dalam perjanjian awal yang tidak diubah melalui addendum ini dinyatakan tetap berlaku penuh dan mengikat.

Jakarta, {{tanggal}}

PT Narasumber Hukum                 {{nama_klien}}



( Direktur Utama )                  ( Perwakilan Klien )`
  }
};

export default function GenerateSuratPage() {
  const [activeMode, setActiveMode] = useState<"wizard" | "upload">("wizard");
  
  // Wizard Mode States
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<keyof typeof TEMPLATES_LIBRARY>("SP");
  const [wizardFormData, setWizardFormData] = useState<Record<string, string>>({});
  const [editableText, setEditableText] = useState("");
  const [isSuccessWizard, setIsSuccessWizard] = useState(false);

  // Upload Mode States
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadPlaceholders, setUploadPlaceholders] = useState<string[]>([]);
  const [uploadFormData, setUploadFormData] = useState<Record<string, string>>({});
  const [isGeneratingUpload, setIsGeneratingUpload] = useState(false);
  const [isSuccessUpload, setIsSuccessUpload] = useState(false);

  // Reset form fields when template changes
  useEffect(() => {
    const template = TEMPLATES_LIBRARY[selectedTemplateKey];
    setWizardFormData(template.defaults);
    setEditableText(template.text);
    setIsSuccessWizard(false);
  }, [selectedTemplateKey]);

  // Update editor text dynamically when form fields change (only if not customized manually)
  const handleWizardInputChange = (key: string, value: string) => {
    const updatedForm = { ...wizardFormData, [key]: value };
    setWizardFormData(updatedForm);
    
    // Auto-replace in template text for the editor
    let text = TEMPLATES_LIBRARY[selectedTemplateKey].text;
    Object.entries(updatedForm).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v || `[${k}]`);
    });
    setEditableText(text);
  };

  const handleDownloadWizard = () => {
    setIsSuccessWizard(true);
    // HTML wrapper to download as doc file (rich styling opened by Microsoft Word)
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><title>Dokumen Legal</title><style>body { font-family: 'Arial', sans-serif; line-height: 1.6; padding: 40px; white-space: pre-wrap; }</style></head><body>";
    const footer = "</body></html>";
    const htmlContent = header + editableText.replace(/\n/g, '<br/>') + footer;
    
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    saveAs(blob, `${selectedTemplateKey}_Generated_${Date.now()}.doc`);
    
    setTimeout(() => setIsSuccessWizard(false), 3000);
  };

  // Upload custom DOCX handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTemplateFile(file);
    setIsSuccessUpload(false);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (content) {
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
          
          const text = doc.getFullText();
          const regex = /\{\{([^}]+)\}\}/g;
          let match;
          const found = new Set<string>();
          while ((match = regex.exec(text)) !== null) {
            found.add(match[1].trim());
          }
          
          setUploadPlaceholders(Array.from(found));
          setUploadFormData({});
        }
      } catch (err) {
        console.error("Error reading docx template", err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadInputChange = (key: string, value: string) => {
    setUploadFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerateUpload = () => {
    if (!templateFile) return;
    setIsGeneratingUpload(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        if (content) {
          const zip = new PizZip(content);
          const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
          });
          
          doc.render(uploadFormData);
          
          const out = doc.getZip().generate({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          });
          
          saveAs(out, `Generated_${templateFile.name}`);
          setIsSuccessUpload(true);
          setIsGeneratingUpload(false);
        }
      } catch (err) {
        console.error("Error generating document", err);
        setIsGeneratingUpload(false);
      }
    };
    reader.readAsArrayBuffer(templateFile);
  };

  // Generate real-time highlighted HTML for preview
  const getHighlightedPreview = () => {
    let previewHtml = TEMPLATES_LIBRARY[selectedTemplateKey].text;
    
    // Escape HTML characters
    previewHtml = previewHtml
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
      
    // Replace newlines with breaks
    previewHtml = previewHtml.replace(/\n/g, "<br/>");
    
    // Wrap placeholders in highlight tags
    Object.entries(wizardFormData).forEach(([k, v]) => {
      const displayVal = v || `[${k.replace(/_/g, ' ')}]`;
      previewHtml = previewHtml.replace(
        new RegExp(`\\{\\{${k}\\}\\}`, 'g'),
        `<strong class="bg-brand-50 text-brand-600 px-1 py-0.5 border-b border-brand-300 font-extrabold rounded-none">${displayVal}</strong>`
      );
    });
    
    return previewHtml;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buat Surat</h1>
          <p className="text-gray-500">Otomatisasi pembuatan surat keputusan, perjanjian, dan draf hukum.</p>
        </div>
        
        {/* Toggle Mode Button */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveMode("wizard")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${activeMode === "wizard" ? "bg-white text-brand-600 shadow" : "text-gray-500"}`}
          >
            <Settings className="w-3.5 h-3.5" /> Templat Kustom NH
          </button>
          <button
            onClick={() => setActiveMode("upload")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition ${activeMode === "upload" ? "bg-white text-brand-600 shadow" : "text-gray-500"}`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Scan File DOCX
          </button>
        </div>
      </div>

      {activeMode === "wizard" ? (
        /* WIZARD MODE: MULTIPLE TEMPLATE SELECTION & LIVE PREVIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form input fields on Left */}
          <Card className="lg:col-span-5 h-fit shadow-lg">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-brand-500" />
                1. Pilih & Isi Templat Surat
              </CardTitle>
              <CardDescription>Pilih jenis surat hukum yang ingin dirancang di bawah.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-gray-400">Pilih Jenis Surat</label>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) => setSelectedTemplateKey(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs font-semibold"
                >
                  {Object.entries(TEMPLATES_LIBRARY).map(([key, item]) => (
                    <option key={key} value={key}>{item.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 my-4 pt-4 space-y-4">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-gray-400">Variabel Dokumen</h4>
                <div className="grid grid-cols-1 gap-4 max-h-[45vh] overflow-y-auto pr-1 no-scrollbar">
                  {TEMPLATES_LIBRARY[selectedTemplateKey].placeholders.map((key) => (
                    <div key={key} className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </label>
                      <Input 
                        placeholder={`Isi ${key.replace(/_/g, ' ')}`}
                        value={wizardFormData[key] || ""}
                        onChange={(e) => handleWizardInputChange(key, e.target.value)}
                        className="text-xs py-2"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Preview Paper Sheet on Right */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="shadow-2xl overflow-hidden border border-gray-200/80">
              <CardHeader className="border-b border-gray-100 flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Eye className="w-5 h-5 text-brand-500" />
                  2. Pratinjau Dokumen Legal (Real-time)
                </CardTitle>
                {isSuccessWizard && (
                  <Badge variant="success" className="bg-emerald-100 text-emerald-800"><Check className="w-3.5 h-3.5 mr-1" /> Sukses Mengunduh</Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                {/* Paper sheet */}
                <div className="bg-white dark:bg-gray-950 p-10 font-mono text-[11px] leading-relaxed border-b border-gray-100 max-h-[60vh] overflow-y-auto shadow-inner text-gray-800 dark:text-gray-300">
                  <div 
                    dangerouslySetInnerHTML={{ __html: getHighlightedPreview() }}
                    className="space-y-2 whitespace-pre-wrap select-all font-sans"
                  />
                </div>
                
                {/* Download bar */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
                  <Button onClick={handleDownloadWizard} className="px-6 py-2.5 text-xs font-black uppercase tracking-wider">
                    <Download className="w-4 h-4 mr-2" /> Buat & Unduh Berkas Word (.doc)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* UPLOAD MODE: LOAD CUSTOM DOCX & AUTO DETECT PLACEHOLDERS */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 h-fit shadow-md">
            <CardHeader>
              <CardTitle>1. Unggah Templat DOCX Anda</CardTitle>
              <CardDescription>Unggah berkas Word (.docx) apa saja berisi variabel {"{{seperti_ini}}"}.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition cursor-pointer">
                <input 
                  type="file" 
                  accept=".docx" 
                  className="hidden" 
                  id="template-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="template-upload" className="cursor-pointer flex flex-col items-center">
                  <UploadCloud className="w-10 h-10 text-brand-500 mb-3" />
                  <span className="font-medium text-gray-950">Klik untuk unggah berkas</span>
                  <span className="text-xs text-gray-400 mt-1">Format khusus .docx</span>
                </label>
              </div>
              
              {templateFile && (
                <div className="mt-4 p-3 bg-brand-50 rounded-lg border border-brand-100 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-600" />
                  <span className="text-sm font-medium text-brand-900 truncate">{templateFile.name}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle>2. Pindai Variabel & Isi Data</CardTitle>
              <CardDescription>
                {uploadPlaceholders.length > 0 
                  ? `Berhasil mendeteksi ${uploadPlaceholders.length} variabel di dalam dokumen.` 
                  : "Sistem akan mendeteksi variabel dokumen otomatis setelah unggahan."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadPlaceholders.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {uploadPlaceholders.map((key) => (
                      <div key={key} className="space-y-1">
                        <label className="text-sm font-medium text-gray-700 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <Input 
                          placeholder={`Masukkan ${key.replace(/_/g, ' ')}`} 
                          value={uploadFormData[key] || ""}
                          onChange={(e) => handleUploadInputChange(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 mt-6">
                    {isSuccessUpload && (
                      <span className="flex items-center text-sm text-emerald-600 font-medium mr-auto">
                        <Check className="w-4 h-4 mr-1" /> Dokumen Berhasil Dibuat
                      </span>
                    )}
                    <Button 
                      onClick={handleGenerateUpload} 
                      isLoading={isGeneratingUpload}
                      disabled={Object.keys(uploadFormData).length < uploadPlaceholders.length}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Buat & Unduh berkas DOCX
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                  Silakan unggah templat terlebih dahulu untuk melakukan pemindaian otomatis variabel data.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
