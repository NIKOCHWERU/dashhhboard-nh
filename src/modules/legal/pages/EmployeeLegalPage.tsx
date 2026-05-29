"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { FileText, Search, User, Download, CheckCircle2 } from "lucide-react";
import { Input } from "../components/ui/input";

export default function EmployeeLegalPage() {
  const [activeTab, setActiveTab] = useState("PKWT");

  const tabs = ["PKWT", "NDA", "BPJS", "KTP", "NPWP", "Surat Teguran", "Addendum"];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Legal Files</h1>
        <p className="text-gray-500">Manage and track legal documents for all employees.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>Employees</CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            <div className="px-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search employee..." className="pl-9" />
              </div>
            </div>
            <div className="space-y-1">
              {["Sarah Johnson", "Budi Santoso", "Andi Pratama", "Diana P."].map((name, i) => (
                <button
                  key={name}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    i === 0 ? "bg-brand-50 text-brand-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="p-1.5 bg-white border rounded-full">
                    <User className="w-4 h-4 text-gray-500" />
                  </div>
                  {name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Sarah Johnson</CardTitle>
                <CardDescription>Software Engineer - Joined May 2023</CardDescription>
              </div>
              <Button>Upload Document</Button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 mt-4 pt-4 border-b border-gray-100">
              {tabs.map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition ${
                    activeTab === t ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === "PKWT" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white border rounded-xl">
                      <FileText className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">PKWT - Sarah Johnson v1.pdf</p>
                      <p className="text-sm text-gray-500">Uploaded 12 May 2023 • 2.4 MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="success"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
                    <Button variant="outline" size="sm"><Download className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Activity Timeline</h4>
                  <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-brand-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white" />
                      <p className="font-semibold text-sm text-gray-900">Document Uploaded</p>
                      <p className="text-xs text-gray-400 mt-1">12 May 2023, 10:00 AM by HR Admin</p>
                    </div>
                    <div className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[6.5px] top-1.5 ring-4 ring-white" />
                      <p className="font-semibold text-sm text-gray-900">Document Signed by Employee</p>
                      <p className="text-xs text-gray-400 mt-1">13 May 2023, 09:30 AM via Digital Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== "PKWT" && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No documents found for {activeTab}</p>
                <Button variant="outline" className="mt-4">Upload {activeTab}</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
