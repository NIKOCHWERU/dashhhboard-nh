"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileSpreadsheet, FileIcon, BarChart3 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500">Export data and generate insights for legal operations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="p-3 bg-brand-50 w-fit rounded-lg text-brand-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Contract Status Report</CardTitle>
            <CardDescription>Export all active, expired, and pending contracts.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
            <Button variant="outline" className="flex-1"><FileIcon className="w-4 h-4 mr-2" /> PDF</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="p-3 bg-blue-50 w-fit rounded-lg text-blue-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Employee Legal Report</CardTitle>
            <CardDescription>Summary of PKWT, NDA, and warning letters.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
            <Button variant="outline" className="flex-1"><FileIcon className="w-4 h-4 mr-2" /> PDF</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="p-3 bg-emerald-50 w-fit rounded-lg text-emerald-600 mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <CardTitle>Compliance Audit</CardTitle>
            <CardDescription>Checklist of corporate legal health score.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button variant="outline" className="flex-1"><FileSpreadsheet className="w-4 h-4 mr-2" /> Excel</Button>
            <Button variant="outline" className="flex-1"><FileIcon className="w-4 h-4 mr-2" /> PDF</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
