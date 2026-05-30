"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Check, X, Clock, FileText, ArrowRight } from "lucide-react";

export default function ApprovalWorkflowPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alur Persetujuan</h1>
        <p className="text-gray-500">Sistem persetujuan dokumen bertingkat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-brand-50 rounded-xl h-fit">
                    <FileText className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <Badge variant="warning" className="mb-2">Menunggu Persetujuan Anda</Badge>
                    <h3 className="text-lg font-bold text-gray-900">Perjanjian Vendor IT Infrastruktur.pdf</h3>
                    <p className="text-sm text-gray-500 mt-1">Diminta oleh: Staf Legal • 2 jam yang lalu</p>
                    
                    <div className="mt-6 flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium"><Check className="w-3 h-3"/> Staf Legal</span>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md font-medium"><Check className="w-3 h-3"/> Manajer HR</span>
                      <ArrowRight className="w-4 h-4 text-gray-300" />
                      <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-md font-medium"><Clock className="w-3 h-3"/> Direktur (Anda)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3 justify-end">
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50"><X className="w-4 h-4 mr-2" /> Tolak</Button>
                <Button variant="outline">Minta Revisi</Button>
                <Button><Check className="w-4 h-4 mr-2" /> Setujui Dokumen</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Saya</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-emerald-100 text-emerald-600 rounded-full"><Check className="w-3 h-3" /></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Menyetujui NDA Freelance</p>
                    <p className="text-xs text-gray-500">Kemarin pukul 14:30</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 bg-red-100 text-red-600 rounded-full"><X className="w-3 h-3" /></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">Menolak Perpanjangan PKWT</p>
                    <p className="text-xs text-gray-500">2 hari yang lalu</p>
                  </div>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
