"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, MessageSquare } from "lucide-react";

export default function LegalRequestPage() {
  const [activeTab, setActiveTab] = useState("Open");

  const requests = [
    { id: "REQ-01", title: "Review Kontrak Vendor IT", status: "In Progress", priority: "High", requester: "Dept IT", date: "Hari ini" },
    { id: "REQ-02", title: "Penyusunan NDA Freelancer", status: "Open", priority: "Medium", requester: "Dept HR", date: "Kemarin" },
    { id: "REQ-03", title: "Konsultasi Hukum Ketenagakerjaan", status: "Pending", priority: "Low", requester: "Finance", date: "2 Hari Lalu" },
    { id: "REQ-04", title: "Perpanjangan Sewa Gedung", status: "Completed", priority: "High", requester: "Dept GA", date: "Minggu Lalu" },
  ];

  const filtered = requests.filter(r => r.status.includes(activeTab) || (activeTab === "Open" && r.status !== "Completed"));

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permintaan Legal</h1>
          <p className="text-gray-500">Sistem tiket internal untuk pertanyaan hukum dan penyusunan draf dokumen.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Buat Permintaan</Button>
      </div>

      <Card>
        <CardHeader>
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
                className={`font-medium px-2 py-1 transition-colors ${activeTab === t.key ? "text-brand-600 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-900"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filtered.map(req => (
              <div key={req.id} className="p-4 border rounded-xl hover:shadow-sm transition bg-white flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-bold text-gray-400">{req.id}</span>
                    <Badge variant={req.priority === 'High' ? 'destructive' : req.priority === 'Medium' ? 'warning' : 'secondary'}>Prioritas {getPriorityLabel(req.priority)}</Badge>
                    <Badge variant="outline">{getStatusLabel(req.status)}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Diminta oleh {req.requester} • {req.date}</p>
                </div>
                <Button variant="ghost" size="icon"><MessageSquare className="w-4 h-4 text-gray-400" /></Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Tidak ada permintaan ditemukan.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
