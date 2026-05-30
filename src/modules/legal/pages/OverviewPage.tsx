"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { 
  FileText, ShieldAlert, FileClock, 
  CheckCircle, Plus, FileArchive, Settings
} from "lucide-react";

export default function OverviewPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard Legal</h1>
          <p className="text-gray-500 mt-1">Ikhtisar dan pemantauan dokumen hukum serta kepatuhan.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/legal/settings">
            <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Pengaturan</Button>
          </Link>
          <Link href="/legal/requests">
            <Button><Plus className="w-4 h-4 mr-2" /> Permintaan Baru</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/legal/contracts">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Kontrak Aktif</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">124</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/legal/expiry-monitoring">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Segera Kedaluwarsa</p>
                <h3 className="text-3xl font-bold text-amber-600 mt-2">12</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileClock className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/legal/approvals">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Menunggu Persetujuan</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">5</h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/legal/compliance">
          <Card className="hover:shadow-md transition cursor-pointer">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Selesai Bulan Ini</p>
                <h3 className="text-3xl font-bold text-emerald-600 mt-2">48</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Contracts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kontrak Segera Kedaluwarsa</CardTitle>
            <CardDescription>Daftar kontrak yang akan habis masa berlakunya dalam 30 hari ke depan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Vendor Agreement - PT Maju Bersama", date: "3 Hari", type: "Vendor", alert: "destructive" },
                { name: "NDA - Freelance Developer", date: "14 Hari", type: "NDA", alert: "warning" },
                { name: "PKWT - Budi Santoso", date: "21 Hari", type: "HR", alert: "warning" },
              ].map((item, i) => (
                <Link href="/legal/expiry-monitoring" key={i} className="block">
                  <div className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <FileArchive className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Jenis: {item.type}</p>
                      </div>
                    </div>
                    <Badge variant={item.alert as any}>Habis dalam {item.date}</Badge>
                  </div>
                </Link>
              ))}
            </div>
            <Link href="/legal/contracts" className="block w-full mt-4">
              <Button variant="outline" className="w-full">Lihat Semua Kontrak</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
              {[
                { title: "Kontrak Ditandatangani", desc: "PKWT Sarah telah ditandatangani oleh Direktur", time: "2 jam yang lalu", link: "/legal/employee-legal" },
                { title: "Permintaan Legal Baru", desc: "Penyusunan draf perjanjian kemitraan baru", time: "5 jam yang lalu", link: "/legal/requests" },
                { title: "Menunggu Persetujuan", desc: "Perpanjangan vendor memerlukan persetujuan Anda", time: "1 hari yang lalu", link: "/legal/approvals" },
              ].map((act, i) => (
                <Link href={act.link} key={i} className="block group">
                  <div className="relative pl-6 hover:bg-gray-50/50 p-2 rounded-lg transition">
                    <div className="absolute w-3 h-3 bg-brand-500 rounded-full -left-[6.5px] top-3.5 ring-4 ring-white" />
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-brand-600 transition">{act.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{act.desc}</p>
                    <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
