"use client";

import React from "react";
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
          <p className="text-gray-500 mt-1">Overview and monitoring for legal documents and compliance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><Settings className="w-4 h-4 mr-2" /> Settings</Button>
          <Button><Plus className="w-4 h-4 mr-2" /> New Request</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Contracts</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">124</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-2">12</h3>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileClock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">5</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed This Month</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-2">48</h3>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Expiring Contracts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Expiring Contracts</CardTitle>
            <CardDescription>Contracts expiring in the next 30 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Vendor Agreement - PT Maju Bersama", date: "3 Days", type: "Vendor", alert: "destructive" },
                { name: "NDA - Freelance Developer", date: "14 Days", type: "NDA", alert: "warning" },
                { name: "PKWT - Budi Santoso", date: "21 Days", type: "HR", alert: "warning" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-gray-50 transition">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileArchive className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">Type: {item.type}</p>
                    </div>
                  </div>
                  <Badge variant={item.alert as any}>Expires in {item.date}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">View All Contracts</Button>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
              {[
                { title: "Contract Signed", desc: "PKWT Sarah was signed by Director", time: "2 hours ago" },
                { title: "New Legal Request", desc: "Drafting partnership agreement", time: "5 hours ago" },
                { title: "Approval Pending", desc: "Vendor renewal requires your approval", time: "1 day ago" },
              ].map((act, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute w-3 h-3 bg-brand-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white" />
                  <p className="font-semibold text-sm text-gray-900">{act.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{act.desc}</p>
                  <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
