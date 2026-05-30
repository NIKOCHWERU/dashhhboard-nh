"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, MessageSquare, Send, CheckCircle2, User, HelpCircle } from "lucide-react";
import { Input } from "../components/ui/input";

interface TicketMessage {
  sender: string;
  role: string;
  time: string;
  content: string;
}

interface LegalTicket {
  id: string;
  title: string;
  status: "Open" | "In Progress" | "Pending" | "Completed";
  priority: "High" | "Medium" | "Low";
  requester: string;
  date: string;
  desc: string;
  chat: TicketMessage[];
}

export default function LegalRequestPage() {
  const [activeTab, setActiveTab] = useState("Open");
  const [tickets, setTickets] = useState<LegalTicket[]>([
    { 
      id: "REQ-01", 
      title: "Review Kontrak Vendor IT", 
      status: "In Progress", 
      priority: "High", 
      requester: "Dept IT", 
      date: "Hari ini",
      desc: "Mohon review untuk draf PKS penyediaan server cloud PT. Data Nusantara. Perhatikan klausul garansi SLA minimal 99.9%.",
      chat: [
        { sender: "Budi (IT)", role: "Pengusul", time: "Hari ini, 09:00 AM", content: "Draf awal telah diunggah. Mohon ditinjau secepatnya karena server lama akan dinonaktifkan." },
        { sender: "Andi (Legal)", role: "Staf Legal", time: "Hari ini, 11:30 AM", content: "Baik, sedang kami tinjau klausul garansi dan batasan tanggung jawab hukumnya." }
      ]
    },
    { 
      id: "REQ-02", 
      title: "Penyusunan NDA Freelancer", 
      status: "Open", 
      priority: "Medium", 
      requester: "Dept HR", 
      date: "Kemarin",
      desc: "Draf NDA untuk desainer lepasan (freelancer) proyek mobile app baru. Data aset grafis harus terlindungi sepenuhnya.",
      chat: [
        { sender: "Sarah (HR)", role: "Pengusul", time: "Kemarin, 02:00 PM", content: "Butuh draf NDA standar untuk desainer proyek kuartal depan." }
      ]
    },
    { 
      id: "REQ-03", 
      title: "Konsultasi Hukum Ketenagakerjaan", 
      status: "Pending", 
      priority: "Low", 
      requester: "Finance", 
      date: "2 Hari Lalu",
      desc: "Tanya jawab terkait ketentuan hak pesangon karyawan PKWTT yang mengundurkan diri sukarela (resign) secara tertulis.",
      chat: [
        { sender: "Rian (Finance)", role: "Pengusul", time: "2 Hari Lalu, 10:00 AM", content: "Apakah karyawan resign sukarela berhak atas uang penghargaan masa kerja?" }
      ]
    },
    { 
      id: "REQ-04", 
      title: "Perpanjangan Sewa Gedung", 
      status: "Completed", 
      priority: "High", 
      requester: "Dept GA", 
      date: "Minggu Lalu",
      desc: "Perpanjangan berkas kontrak sewa ruko kantor cabang di Kembangan, Jakarta Barat.",
      chat: [
        { sender: "Herman (GA)", role: "Pengusul", time: "Minggu Lalu", content: "Kontrak sewa disetujui diperpanjang selama 2 tahun dengan harga sewa tetap." }
      ]
    }
  ]);

  // Modal Create Ticket states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [newRequester, setNewRequester] = useState("Dept IT");
  const [newDesc, setNewDesc] = useState("");

  // Modal Discussion Chat states
  const [selectedTicket, setSelectedTicket] = useState<LegalTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const handleCreateTicket = () => {
    if (!newTitle || !newDesc) {
      alert("Harap isi Judul dan Deskripsi Permintaan.");
      return;
    }

    const newTicket: LegalTicket = {
      id: `REQ-0${tickets.length + 1}`,
      title: newTitle,
      status: "Open",
      priority: newPriority,
      requester: newRequester,
      date: "Baru saja",
      desc: newDesc,
      chat: [
        { sender: `User (${newRequester})`, role: "Pengusul", time: "Baru saja", content: newDesc }
      ]
    };

    setTickets([newTicket, ...tickets]);
    setIsCreateModalOpen(false);
    
    // Reset form
    setNewTitle("");
    setNewPriority("Medium");
    setNewRequester("Dept IT");
    setNewDesc("");
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage) return;

    const updatedTickets = tickets.map(t => {
      if (t.id === selectedTicket.id) {
        const updatedChat = [
          ...t.chat,
          {
            sender: "Andi (Legal)",
            role: "Staf Legal",
            time: "Baru saja",
            content: replyMessage
          }
        ];
        return {
          ...t,
          status: t.status === 'Open' ? 'In Progress' : t.status, // Auto shift status
          chat: updatedChat
        };
      }
      return t;
    });

    setTickets(updatedTickets);
    const updated = updatedTickets.find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
    setReplyMessage("");
  };

  const filtered = tickets.filter(r => r.status.includes(activeTab) || (activeTab === "Open" && r.status !== "Completed"));

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "In Progress": return "Sedang Diproses";
      case "Pending": return "Tertunda";
      case "Completed": return "Selesai";
      case "Open":
      default: return "Terbuka";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "High": return "Tinggi";
      case "Medium": return "Sedang";
      case "Low":
      default: return "Rendah";
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center border-b border-gray-150 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permintaan Legal</h1>
          <p className="text-gray-500">Sistem tiket internal divisi untuk konsultasi hukum, pembuatan berkas, dan peninjauan draf.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Buat Permintaan</Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="border-b border-gray-50 py-4">
          <div className="flex gap-4 border-b border-gray-100 pb-2">
            {[
              { key: "Open", label: "Terbuka" },
              { key: "In Progress", label: "Sedang Diproses" },
              { key: "Pending", label: "Tertunda" },
              { key: "Completed", label: "Selesai" }
            ].map(t => (
              <button 
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`font-black text-xs uppercase tracking-wider px-2 py-1 transition-colors border-b-2 ${
                  activeTab === t.key ? "text-brand-600 border-brand-500 font-black" : "text-gray-400 border-transparent hover:text-gray-900"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {filtered.map(req => (
              <div 
                key={req.id} 
                className="p-4 border rounded-xl hover:shadow-md transition bg-white flex justify-between items-start gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black text-gray-400">{req.id}</span>
                    <Badge variant={req.priority === 'High' ? 'destructive' : req.priority === 'Medium' ? 'warning' : 'secondary'} className="text-[9px] px-1.5 py-0">
                      Prioritas {getPriorityLabel(req.priority)}
                    </Badge>
                    <Badge variant="outline" className="text-[9px] bg-brand-50/20 border-brand-100 text-brand-700">
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-gray-950 leading-snug">{req.title}</h3>
                  <p className="text-xs text-gray-500 font-semibold">Diminta oleh {req.requester} • {req.date}</p>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xl">{req.desc}</p>
                </div>
                
                <Button variant="outline" size="sm" onClick={() => setSelectedTicket(req)} className="text-xs gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                  Diskusi ({req.chat.length})
                </Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <HelpCircle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-xs font-semibold">Tidak ada tiket permintaan ditemukan.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-md w-full space-y-4 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Buat Permintaan Baru</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Judul Permintaan</label>
                <Input 
                  placeholder="Masukkan pokok bahasan konsultasi/review..." 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Skala Prioritas</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs font-semibold"
                  >
                    <option value="High">Tinggi (High)</option>
                    <option value="Medium">Sedang (Medium)</option>
                    <option value="Low">Rendah (Low)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Departemen Pengaju</label>
                  <select
                    value={newRequester}
                    onChange={(e) => setNewRequester(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none bg-white text-xs font-semibold"
                  >
                    <option value="Dept IT">Dept IT</option>
                    <option value="Dept HR">Dept HR</option>
                    <option value="Dept GA">Dept GA</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-gray-700">Keterangan / Deskripsi Permintaan</label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Uraikan secara detail pokok masalah hukum atau poin-poin draf perjanjian yang ingin disusun..."
                  className="w-full rounded-lg border border-gray-250 bg-transparent px-4 py-3 text-xs outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Batal</Button>
              <Button onClick={handleCreateTicket}>Kirim Permintaan</Button>
            </div>
          </div>
        </div>
      )}

      {/* DISCUSSION CHAT MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-xl max-w-xl w-full space-y-4 animate-in zoom-in duration-200 flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2 flex-shrink-0">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-brand-500" />
                  Diskusi Tiket: {selectedTicket.id}
                </h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{selectedTicket.title}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto space-y-4 py-3 px-1 no-scrollbar min-h-[30vh]">
              {selectedTicket.chat.map((msg, mIdx) => {
                const isLegal = msg.role === "Staf Legal";
                return (
                  <div key={mIdx} className={`flex gap-3 max-w-[85%] ${isLegal ? 'ml-auto flex-row-reverse' : ''}`}>
                    <div className={`p-2 rounded-full h-fit ${isLegal ? 'bg-brand-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div className={`p-3 rounded-2xl text-xs space-y-1 border ${
                      isLegal 
                        ? 'bg-brand-50/50 border-brand-100 rounded-tr-none' 
                        : 'bg-white border-gray-150 rounded-tl-none dark:bg-gray-800 dark:border-gray-700'
                    }`}>
                      <div className="flex justify-between items-center gap-4 text-[10px] font-semibold text-gray-400">
                        <span>{msg.sender} ({msg.role})</span>
                        <span>{msg.time}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Reply Form */}
            <div className="border-t border-gray-100 pt-4 flex gap-2 flex-shrink-0">
              <Input
                placeholder="Ketik balasan Anda untuk divisi..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendReply();
                }}
                className="text-xs"
              />
              <Button onClick={handleSendReply}>
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
