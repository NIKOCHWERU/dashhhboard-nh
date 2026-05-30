"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Check, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [contractPrefix, setContractPrefix] = useState("CTR/NH/2026/");
  const [spPrefix, setSpPrefix] = useState("SP/NH/HR/2026/");
  const [h30, setH30] = useState(true);
  const [h14, setH14] = useState(true);
  const [h7, setH7] = useState(true);

  // Success indicator states
  const [saveSuratSuccess, setSaveSuratSuccess] = useState(false);
  const [saveRemindSuccess, setSaveRemindSuccess] = useState(false);

  const handleSaveSurat = () => {
    setSaveSuratSuccess(true);
    setTimeout(() => {
      setSaveSuratSuccess(false);
      alert("Format penomoran surat berhasil diperbarui!");
    }, 800);
  };

  const handleSaveRemind = () => {
    setSaveRemindSuccess(true);
    setTimeout(() => {
      setSaveRemindSuccess(false);
      alert("Pengaturan pengingat kedaluwarsa berhasil disimpan!");
    }, 800);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan</h1>
        <p className="text-gray-500">Konfigurasikan parameter modul legal dan aturan penomoran otomatis.</p>
      </div>

      <Card className="hover:shadow-sm transition">
        <CardHeader>
          <CardTitle>Penomoran Surat Otomatis</CardTitle>
          <CardDescription>Tentukan format awalan (prefix) untuk dokumen yang dibuat.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Awalan Kontrak</label>
              <Input 
                value={contractPrefix}
                onChange={(e) => setContractPrefix(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Awalan Surat Peringatan (SP)</label>
              <Input 
                value={spPrefix}
                onChange={(e) => setSpPrefix(e.target.value)} 
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSaveSurat} disabled={saveSuratSuccess}>
              {saveSuratSuccess ? "Menyimpan..." : "Simpan Format"}
            </Button>
            {saveSuratSuccess && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Berhasil disimpan
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-sm transition">
        <CardHeader>
          <CardTitle>Pengaturan Pengingat</CardTitle>
          <CardDescription>Konfigurasikan kapan peringatan kedaluwarsa dikirimkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                id="h30" 
                checked={h30} 
                onChange={(e) => setH30(e.target.checked)}
                className="rounded text-brand-500 w-4 h-4 cursor-pointer" 
              />
              <label htmlFor="h30" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Peringatan pada H-30 hari
              </label>
            </div>
            
            <div className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                id="h14" 
                checked={h14} 
                onChange={(e) => setH14(e.target.checked)}
                className="rounded text-brand-500 w-4 h-4 cursor-pointer" 
              />
              <label htmlFor="h14" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Peringatan pada H-14 hari
              </label>
            </div>

            <div className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                id="h7" 
                checked={h7} 
                onChange={(e) => setH7(e.target.checked)}
                className="rounded text-brand-500 w-4 h-4 cursor-pointer" 
              />
              <label htmlFor="h7" className="text-sm font-medium text-gray-700 cursor-pointer select-none">
                Peringatan pada H-7 hari
              </label>
            </div>
          </div>
          
          <div className="flex items-center gap-3 pt-2">
            <Button variant="outline" onClick={handleSaveRemind} disabled={saveRemindSuccess}>
              {saveRemindSuccess ? "Memperbarui..." : "Perbarui Pengingat"}
            </Button>
            {saveRemindSuccess && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> Pengingat diperbarui
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
