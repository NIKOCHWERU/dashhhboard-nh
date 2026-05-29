"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500">Configure legal module parameters and auto-numbering rules.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Numbering Surat</CardTitle>
          <CardDescription>Define prefix format for generated documents.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Contract Prefix</label>
              <Input defaultValue="CTR/NH/2026/" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Warning Letter Prefix</label>
              <Input defaultValue="SP/NH/HR/2026/" />
            </div>
          </div>
          <Button>Save Formatting</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reminder Settings</CardTitle>
          <CardDescription>Configure when expiry alerts are sent.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h30" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h30" className="text-sm font-medium text-gray-700">Alert at H-30 days</label>
          </div>
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h14" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h14" className="text-sm font-medium text-gray-700">Alert at H-14 days</label>
          </div>
          <div className="flex items-center gap-3">
             <input type="checkbox" id="h7" defaultChecked className="rounded text-brand-500" />
             <label htmlFor="h7" className="text-sm font-medium text-gray-700">Alert at H-7 days</label>
          </div>
          <Button variant="outline">Update Reminders</Button>
        </CardContent>
      </Card>
    </div>
  );
}
