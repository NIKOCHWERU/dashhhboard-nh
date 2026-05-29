"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Plus, Filter, MoreHorizontal, FileText } from "lucide-react";

const DUMMY_CONTRACTS = [
  { id: "CTR-001", title: "Vendor Agreement - PT Maju Bersama", type: "Vendor", startDate: "2024-01-01", endDate: "2025-01-01", status: "Approved" },
  { id: "CTR-002", title: "NDA - Freelance Designer", type: "NDA", startDate: "2024-03-15", endDate: "2026-03-15", status: "Signed" },
  { id: "CTR-003", title: "PKWT - Sarah Johnson", type: "HR", startDate: "2023-06-01", endDate: "2024-06-01", status: "Expired" },
  { id: "CTR-004", title: "Sewa Gedung Kantor Pusat", type: "Operational", startDate: "2022-01-01", endDate: "2027-01-01", status: "Signed" },
  { id: "CTR-005", title: "Perjanjian Kerjasama API", type: "Vendor", startDate: "2024-05-10", endDate: "2025-05-10", status: "Review" },
  { id: "CTR-006", title: "MOU - Universitas Bina Nusantara", type: "Corporate", startDate: "2024-02-01", endDate: "2025-02-01", status: "Draft" },
];

export default function ContractManagementPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = DUMMY_CONTRACTS.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Signed":
      case "Approved":
        return <Badge variant="success">{status}</Badge>;
      case "Review":
        return <Badge variant="warning">{status}</Badge>;
      case "Expired":
        return <Badge variant="destructive">{status}</Badge>;
      case "Draft":
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contract Management</h1>
          <p className="text-gray-500">Track and manage all corporate contracts and agreements.</p>
        </div>
        <Button><Plus className="w-4 h-4 mr-2" /> New Contract</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>A comprehensive list of all drafted, signed, and expired contracts.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search contracts by title or ID..." 
                className="pl-9" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-gray-900">{c.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      {c.title}
                    </div>
                  </TableCell>
                  <TableCell><span className="text-gray-500">{c.type}</span></TableCell>
                  <TableCell className="text-gray-500">{c.startDate}</TableCell>
                  <TableCell className="text-gray-500">{c.endDate}</TableCell>
                  <TableCell>{getStatusBadge(c.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
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
