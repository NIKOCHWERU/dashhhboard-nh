"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { AlertTriangle, Clock, CalendarDays, CheckCircle2 } from "lucide-react";

const EXPIRING_CONTRACTS = [
  { id: "CTR-003", title: "PKWT - Budi Santoso", type: "HR", expiryDate: "2026-05-31", daysLeft: 1 },
  { id: "CTR-012", title: "Vendor Agreement - PT Sukses Makmur", type: "Vendor", expiryDate: "2026-06-05", daysLeft: 6 },
  { id: "CTR-044", title: "Sewa Kendaraan Operasional", type: "Operational", expiryDate: "2026-06-10", daysLeft: 11 },
  { id: "CTR-055", title: "Software License - Adobe", type: "Vendor", expiryDate: "2026-06-25", daysLeft: 26 },
  { id: "CTR-089", title: "NDA - Budi Karya", type: "NDA", expiryDate: "2026-06-28", daysLeft: 29 },
];

export default function ExpiryMonitoringPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expiry Monitoring</h1>
        <p className="text-gray-500">Monitor contracts and documents that are nearing expiration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg">Expired</h3>
            </div>
            <p className="text-3xl font-black text-red-700 mt-2">3</p>
            <p className="text-sm text-red-600 mt-1">Contracts passed expiry</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-amber-600">
              <Clock className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 7 Days</h3>
            </div>
            <p className="text-3xl font-black text-amber-700 mt-2">2</p>
            <p className="text-sm text-amber-600 mt-1">Expiring within a week</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-blue-600">
              <CalendarDays className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 14 Days</h3>
            </div>
            <p className="text-3xl font-black text-blue-700 mt-2">5</p>
            <p className="text-sm text-blue-600 mt-1">Expiring within two weeks</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-bold text-lg">&lt; 30 Days</h3>
            </div>
            <p className="text-3xl font-black text-emerald-700 mt-2">12</p>
            <p className="text-sm text-emerald-600 mt-1">Expiring within a month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Expirations</CardTitle>
          <CardDescription>Contracts ordered by closest expiry date.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {EXPIRING_CONTRACTS.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-gray-900">{c.id}</TableCell>
                  <TableCell>{c.title}</TableCell>
                  <TableCell><span className="text-gray-500">{c.type}</span></TableCell>
                  <TableCell className="text-gray-900 font-medium">{c.expiryDate}</TableCell>
                  <TableCell>
                    {c.daysLeft <= 7 ? (
                      <Badge variant="destructive">{c.daysLeft} Days</Badge>
                    ) : c.daysLeft <= 14 ? (
                      <Badge variant="warning">{c.daysLeft} Days</Badge>
                    ) : (
                      <Badge variant="secondary">{c.daysLeft} Days</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">Renew</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
