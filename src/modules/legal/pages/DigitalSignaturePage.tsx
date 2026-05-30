"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { UploadCloud, PenTool, History, CheckCircle } from "lucide-react";

export default function DigitalSignaturePage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tanda Tangan Digital</h1>
        <p className="text-gray-500">Tanda tangan digital dan pembubuhan stempel yang aman dengan jejak audit.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tandatangani Dokumen</CardTitle>
            <CardDescription>Unggah dokumen untuk membubuhkan tanda tangan digital Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition cursor-pointer">
              <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="font-medium text-gray-900">Seret & Letakkan atau Klik untuk Mengunggah</p>
              <p className="text-sm text-gray-500 mt-1">Mendukung PDF, DOCX (Maks 10MB)</p>
            </div>
            <Button className="w-full"><PenTool className="w-4 h-4 mr-2"/> Bubuhkan Tanda Tangan</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jejak Audit Tanda Tangan</CardTitle>
            <CardDescription>Dokumen terbaru yang ditandatangani oleh Anda.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "NDA Freelancer - Q3", date: "Hari ini, 14:00" },
                { title: "Vendor Agreement PT XYZ", date: "Kemarin, 10:30" },
                { title: "SPK Renewal 2026", date: "24 Mei 2026, 09:15" },
              ].map((doc, i) => (
                <div key={i} className="flex justify-between items-center p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-gray-500">{doc.date}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Lihat Log</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
