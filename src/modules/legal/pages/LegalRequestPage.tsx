"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Plus, MessageSquare } from "lucide-react";

export default function LegalRequestPage() {
  const [activeTab, setActiveTab] = useState("Open");

  const requests = [
    { id: "REQ-01", title: "Review Kontrak Vendor IT", status: "In Progress", priority: "High", requester: "IT Dept", date: "Today" },
    { id: "REQ-02", title: "Drafting NDA Freelancer", status: "Open", priority: "Medium", requester: "HR Dept", date: "Yesterday" },
    { id: "REQ-03", title: "Konsultasi Hukum Ketenagakerjaan", status: "Pending", priority: "Low", requester: "Finance", date: "2 Days Ago" },
    { id: "REQ-04", title: "Perpanjangan Sewa Gedung", status: "Completed", priority: "High", requester: "GA Dept", date: "Last Week" },
  ];

  const filtered = requests.filter(r => r.status.includes(activeTab) || (activeTab === "Open" && r.status !== "Completed"));

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legal Request</h1>
          <p className="text-gray-500">Internal ticketing system for legal inquiries and drafting requests.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> Create Request</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-4 border-b border-gray-100 pb-2">
            {["Open", "In Progress", "Pending", "Completed"].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                className={`font-medium px-2 py-1 transition-colors ${activeTab === t ? "text-brand-600 border-b-2 border-brand-500" : "text-gray-500 hover:text-gray-900"}`}
              >
                {t}
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
                    <Badge variant={req.priority === 'High' ? 'destructive' : req.priority === 'Medium' ? 'warning' : 'secondary'}>{req.priority} Priority</Badge>
                    <Badge variant="outline">{req.status}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900">{req.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Requested by {req.requester} • {req.date}</p>
                </div>
                <Button variant="ghost" size="icon"><MessageSquare className="w-4 h-4 text-gray-400" /></Button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No {activeTab.toLowerCase()} requests found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
