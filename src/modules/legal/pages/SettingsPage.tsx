"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
        <p className="text-gray-500">Konfigurasikan parameter modul legal dan aturan penomoran otomatis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Penomoran Surat Otomatis</CardTitle>
          <CardDescription>Tentukan format awalan (prefix) untuk dokumen yang dibuat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Awalan Kontrak</label>
              <Input defaultValue="CTR/NH/2026/" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Awalan Surat Peringatan (SP)</label>
              <Input defaultValue="SP/NH/HR/2026/" />
            </div>
          </div>
          <Button>Simpan Format</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Pengingat</CardTitle>
          <CardDescription>Konfigurasikan kapan peringatan kedaluwarsa dikirimkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h30" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h30" className="text-sm font-medium text-gray-700">Peringatan pada H-30 hari</label>
          </div>
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h14" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h14" className="text-sm font-medium text-gray-700">Peringatan pada H-14 hari</label>
          </div>
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h7" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h7" className="text-sm font-medium text-gray-700">Peringatan pada H-7 hari</label>
          </div>
          <Button variant="outline">Perbarui Pengingat</Button>
        </CardContent>
      </Card>
    </div>
  );
}
