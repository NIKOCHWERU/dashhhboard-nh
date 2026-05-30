"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FileText, Search, User, Download, CheckCircle2, Plus, Clock, X } from "lucide-react";
import { Input } from "../components/ui/input";

interface DocumentItem {
  name: string;
  date: string;
  size: string;
  status: string;
  timeline: { title: string; time: string; user: string; type: "info" | "success" }[];
}

interface Employee {
  id: string;
  name: string;
  position: string;
  pt: string;
  joined: string;
  documents: Record<string, DocumentItem[]>;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "EMP-001",
    name: "Sarah Johnson",
    position: "Software Engineer",
    pt: "PT Braga Jaya Konstruksindo",
    joined: "Mei 2023",
    documents: {
      PKWT: [
        {
          name: "PKWT - Sarah Johnson v1.pdf",
          date: "12 Mei 2023",
          size: "2.4 MB",
          status: "Aktif",
          timeline: [
            { title: "Dokumen Diunggah", time: "12 Mei 2023, 10:00 AM", user: "HR Admin", type: "info" },
            { title: "Dokumen Ditandatangani oleh Karyawan", time: "13 Mei 2023, 09:30 AM", user: "Sarah Johnson", type: "success" }
          ]
        }
      ],
      NDA: [
        {
          name: "NDA - Sarah Johnson.pdf",
          date: "12 Mei 2023",
          size: "1.8 MB",
          status: "Aktif",
          timeline: [
            { title: "Dokumen NDA Diunggah", time: "12 Mei 2023, 10:15 AM", user: "HR Admin", type: "info" },
            { title: "Ditandatangani secara Digital", time: "12 Mei 2023, 11:00 AM", user: "Sarah Johnson", type: "success" }
          ]
        }
      ]
    }
  },
  {
    id: "EMP-002",
    name: "Budi Santoso",
    position: "Lead Designer",
    pt: "PT Maju Bersama",
    joined: "Januari 2022",
    documents: {
      PKWT: [
        {
          name: "PKWT Adendum - Budi Santoso.pdf",
          date: "15 Jan 2022",
          size: "3.1 MB",
          status: "Aktif",
          timeline: [
            { title: "Dokumen Diunggah", time: "15 Jan 2022, 09:00 AM", user: "HR Admin", type: "info" },
            { title: "Dokumen Ditandatangani", time: "15 Jan 2022, 11:30 AM", user: "Budi Santoso", type: "success" }
          ]
        }
      ]
    }
  },
  {
    id: "EMP-003",
    name: "Andi Pratama",
    position: "Legal Consultant",
    pt: "PT Teknologi Bersama",
    joined: "Oktober 2021",
    documents: {
      NDA: [
        {
          name: "NDA Kerjasama - Andi Pratama.pdf",
          date: "01 Okt 2021",
          size: "2.0 MB",
          status: "Aktif",
          timeline: [
            { title: "NDA Diunggah & Disetujui", time: "01 Okt 2021, 02:00 PM", user: "Legal Admin", type: "success" }
          ]
        }
      ]
    }
  }
];

export default function EmployeeLegalPage() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [selectedEmpIndex, setSelectedEmpIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("PKWT");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Upload states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [docType, setDocType] = useState("PKWT");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("2.0 MB");
  const [uploadUser, setUploadUser] = useState("HR Admin");

  const selectedEmployee = employees[selectedEmpIndex] || employees[0];
  const tabs = ["PKWT", "NDA", "BPJS", "KTP", "NPWP", "Surat Teguran", "Addendum"];

  // Fetch employees from database API if available
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/karyawan");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            // Map database employees to our structure
            const mapped: Employee[] = data.map((emp: any, index: number) => {
              const mockData = INITIAL_EMPLOYEES[index % INITIAL_EMPLOYEES.length];
              return {
                id: emp.id || `EMP-00${index + 1}`,
                name: emp.name,
                position: emp.position || "Staff",
                pt: emp.pt || "PT Narasumber Hukum",
                joined: emp.tanggalMasuk ? new Date(emp.tanggalMasuk).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "Mei 2023",
                documents: mockData ? mockData.documents : {}
              };
            });
            setEmployees(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
  }, []);

  const handleUploadDocument = () => {
    if (!fileName) {
      alert("Harap masukkan Nama Berkas Dokumen.");
      return;
    }

    const newDoc: DocumentItem = {
      name: fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`,
      date: new Date().toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      size: fileSize,
      status: "Aktif",
      timeline: [
        {
          title: `Dokumen ${docType} Diunggah`,
          time: new Date().toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
          user: uploadUser,
          type: "info"
        }
      ]
    };

    const updatedEmployees = [...employees];
    const emp = updatedEmployees[selectedEmpIndex];
    if (emp) {
      if (!emp.documents[docType]) {
        emp.documents[docType] = [];
      }
      emp.documents[docType].push(newDoc);
      setEmployees(updatedEmployees);
    }

    setIsModalOpen(false);
    setFileName("");
    setDocType("PKWT");
  };

  const handleDeleteDocument = (docName: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus dokumen ini?")) return;
    
    const updatedEmployees = [...employees];
    const emp = updatedEmployees[selectedEmpIndex];
    if (emp && emp.documents[activeTab]) {
      emp.documents[activeTab] = emp.documents[activeTab].filter(d => d.name !== docName);
      setEmployees(updatedEmployees);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.pt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeDocs = selectedEmployee?.documents?.[activeTab] || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Berkas Hukum Karyawan</h1>
          <p className="text-gray-500">Kelola dan lacak dokumen hukum (PKWT, NDA, KTP) karyawan beserta asimilasi PT terkait.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: Employees List */}
        <Card className="lg:col-span-1 h-fit shadow-md">
          <CardHeader className="px-4 py-4 border-b border-gray-50">
            <CardTitle className="text-sm font-black uppercase text-gray-400">Daftar Karyawan</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="mb-3 px-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Cari karyawan..." 
                  className="pl-9 text-xs py-2" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 no-scrollbar">
              {filteredEmployees.map((emp, index) => {
                const isSelected = emp.id === selectedEmployee?.id;
                return (
                  <button
                    key={emp.id}
                    onClick={() => {
                      const idx = employees.findIndex(e => e.id === emp.id);
                      if (idx !== -1) setSelectedEmpIndex(idx);
                    }}
                    className={`w-full flex flex-col items-start gap-1 p-3 rounded-xl text-left transition ${
                      isSelected ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-full ${isSelected ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs">{emp.name}</span>
                    </div>
                    <span className={`text-[10px] ${isSelected ? 'text-brand-100' : 'text-gray-400'} uppercase font-black tracking-wider`}>
                      {emp.pt}
                    </span>
                  </button>
                );
              })}
              {filteredEmployees.length === 0 && (
                <p className="text-xs text-gray-400 italic text-center py-6">Karyawan tidak ditemukan.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Documents Viewer */}
        <Card className="lg:col-span-3 shadow-lg">
          {selectedEmployee ? (
            <>
              <CardHeader className="border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">{selectedEmployee.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {selectedEmployee.position} • {selectedEmployee.pt} • Bergabung {selectedEmployee.joined}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsModalOpen(true)} className="text-xs"><Plus className="w-4 h-4 mr-2" /> Unggah Dokumen</Button>
                </div>
                
                {/* Document Type Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1 mt-6 border-b border-gray-100 no-scrollbar">
                  {tabs.map(t => (
                    <button 
                      key={t}
                      onClick={() => setActiveTab(t)}
                      className={`whitespace-nowrap px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition ${
                        activeTab === t ? "border-brand-500 text-brand-600" : "border-transparent text-gray-400 hover:text-gray-900"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeDocs.length > 0 ? (
                  <div className="space-y-6">
                    {activeDocs.map((doc, dIdx) => (
                      <div key={dIdx} className="space-y-6 border border-gray-100 rounded-xl p-4 bg-gray-50/20">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white border rounded-xl shadow-sm text-brand-600">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-bold text-xs text-gray-900 dark:text-white">{doc.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">Diunggah {doc.date} • {doc.size}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="success" className="text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {doc.status}
                            </Badge>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteDocument(doc.name)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Audit Trail Timeline */}
                        <div className="pt-4 border-t border-gray-100/50">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase mb-3 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Lini Masa Aktivitas Berkas
                          </h4>
                          <div className="relative border-l border-gray-200 ml-2 space-y-4 pb-2">
                            {doc.timeline.map((tm, tIdx) => (
                              <div key={tIdx} className="relative pl-5 text-[11px]">
                                <div className={`absolute w-2 h-2 rounded-full -left-[4.5px] top-1 ring-4 ring-white ${tm.type === 'success' ? 'bg-emerald-500' : 'bg-brand-500'}`} />
                                <p className="font-bold text-gray-800 dark:text-gray-200">{tm.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{tm.time} oleh {tm.user}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-xs">Tidak ada dokumen {activeTab} untuk karyawan ini.</p>
                    <Button variant="outline" onClick={() => setIsModalOpen(true)} className="mt-4 text-xs">Unggah berkas {activeTab}</Button>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <div className="p-8 text-center text-gray-400 italic">Silakan pilih karyawan di sebelah kiri.</div>
          )}
        </Card>
      </div>

      {/* UPLOAD DOCUMENT DIALOG MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Unggah Berkas Hukum ({selectedEmployee?.name})</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Jenis Dokumen</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs font-semibold"
                >
                  {tabs.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Nama Berkas (Judul)</label>
                <Input 
                  placeholder={`Contoh: ${docType} - ${selectedEmployee?.name}`} 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Ukuran File</label>
                  <Input 
                    value={fileSize} 
                    onChange={(e) => setFileSize(e.target.value)} 
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Petugas Pengunggah</label>
                  <Input 
                    value={uploadUser} 
                    onChange={(e) => setUploadUser(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
              <Button onClick={handleUploadDocument}>Unggah Berkas</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
