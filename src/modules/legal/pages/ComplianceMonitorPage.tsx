"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ShieldCheck, AlertCircle, FileWarning, CheckCircle } from "lucide-react";

// Inline simple progress component for standalone usage
function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-500 ${value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
        style={{ width: `${value}%` }} 
      />
    </div>
  );
}

export default function ComplianceMonitorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Monitor</h1>
        <p className="text-gray-500">Track corporate legal health and compliance checklists.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 bg-brand-900 text-white border-0 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-brand-100 font-medium">Overall Legal Health Score</p>
            <div className="flex items-end gap-2 mt-2">
              <h2 className="text-5xl font-black">92</h2>
              <span className="text-brand-200 mb-1">/ 100</span>
            </div>
            <p className="text-sm text-emerald-400 mt-2 font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" /> Excellent Status
            </p>
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-sm text-brand-100">
                <span>Compliance Level</span>
                <span>92%</span>
              </div>
              <ProgressBar value={92} />
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Compliance Action Items</CardTitle>
            <CardDescription>Tasks requiring immediate attention to maintain compliance.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
                <div className="p-4 border border-red-100 bg-red-50 rounded-xl flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Missing Employee BPJS Data</h4>
                    <p className="text-sm text-red-700 mt-1">3 employees are missing mandatory BPJS registration documents.</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">Review</Button>
                </div>

                <div className="p-4 border border-amber-100 bg-amber-50 rounded-xl flex items-start gap-4">
                  <FileWarning className="w-5 h-5 text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900">Vendor License Expiring</h4>
                    <p className="text-sm text-amber-700 mt-1">PT Teknologi Bersama operational license expires in 14 days.</p>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white">Review</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
