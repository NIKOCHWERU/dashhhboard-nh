import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";

const EXCEL_PATH = path.join(process.cwd(), "DASHBOARD NARASUMBER HUKUM.xlsx");

// Helper to convert Excel date serial or string to Date object
function parseExcelDate(serial: any): Date | null {
  if (!serial) return null;
  const num = Number(serial);
  if (isNaN(num)) {
    const parsed = Date.parse(String(serial));
    return isNaN(parsed) ? null : new Date(parsed);
  }
  const date = new Date((num - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? null : date;
}

// Helper to map status to standardized capitalised statuses
function mapExcelStatus(statusStr: string): string {
  if (!statusStr) return "ON PROGRESS";
  const s = statusStr.trim().toUpperCase();
  if (s === "SELESAI") return "SELESAI";
  if (s === "AKTIF" || s === "ON PROGRESS" || s === "IN PROGRESS" || s === "ON-PROGRESS") return "ON PROGRESS";
  if (s === "PENDING") return "PENDING";
  if (s === "CANCEL" || s === "BATAL") return "CANCEL";
  if (s === "KONFIRMASI INTERNAL" || s === "CONFIRM INTERNAL") return "KONFIRMASI INTERNAL";
  if (s === "KONFIRMASI PERUSAHAAN" || s === "CONFIRM PERUSAHAAN") return "KONFIRMASI PERUSAHAAN";
  return s;
}

// Seeder logic to import Excel rows into DB
async function seedExcelToDb() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.warn("Excel file not found, skipping auto-seed.");
    return;
  }

  console.log("Seeding ProgressPekerjaan from Excel...");
  const workbook = xlsx.readFile(EXCEL_PATH);
  const toInsert: any[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    if (sheetName === "SKALA PRIORITAS RETAINER") {
      const startIdx = 7;
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 5 || !r[1]) continue;
        toInsert.push({
          type: "RETAINER",
          no: String(r[1]).trim(),
          tanggal: parseExcelDate(r[2]),
          waktu: r[3] ? String(r[3]).trim() : "",
          namaKlien: r[4] ? String(r[4]).trim() : "",
          quadran: r[5] ? String(r[5]).trim() : "",
          deskripsi: r[6] ? String(r[6]).trim() : "",
          tugas: r[7] ? String(r[7]).trim() : "",
          area: r[8] ? String(r[8]).trim() : "",
          status: mapExcelStatus(r[9] ? String(r[9]).trim() : ""),
          keterangan: r[10] ? String(r[10]).trim() : "",
          catatan: r[11] ? String(r[11]).trim() : "",
          penanggungJawab: r[12] ? String(r[12]).trim() : "",
        });
      }
    } else if (sheetName === "NON RETAINER") {
      const startIdx = 6;
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 5 || !r[0]) continue;
        toInsert.push({
          type: "NON_RETAINER",
          no: String(r[0]).trim(),
          tanggal: parseExcelDate(r[1]),
          quadran: r[2] ? String(r[2]).trim() : "",
          status: mapExcelStatus(r[3] ? String(r[3]).trim() : ""),
          kategori: r[4] ? String(r[4]).trim() : "",
          deskripsi: r[5] ? String(r[5]).trim() : "",
          area: r[6] ? String(r[6]).trim() : "",
          tugas: r[7] ? String(r[7]).trim() : "",
          keterangan: r[8] ? String(r[8]).trim() : "",
          catatan: r[9] ? String(r[9]).trim() : "",
          penanggungJawab: r[10] ? String(r[10]).trim() : "",
        });
      }
    } else if (sheetName === "INTERNAL") {
      const startIdx = 6;
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 5 || !r[0]) continue;
        toInsert.push({
          type: "INTERNAL",
          no: String(r[0]).trim(),
          tanggal: parseExcelDate(r[1]),
          quadran: r[2] ? String(r[2]).trim() : "",
          status: mapExcelStatus(r[3] ? String(r[3]).trim() : ""),
          deskripsi: r[4] ? String(r[4]).trim() : "",
          area: r[5] ? String(r[5]).trim() : "",
          tugas: r[6] ? String(r[6]).trim() : "",
          keterangan: r[7] ? String(r[7]).trim() : "",
          catatan: r[8] ? String(r[8]).trim() : "",
          penanggungJawab: r[9] ? String(r[9]).trim() : "",
        });
      }
    } else if (sheetName === "KHUSUS LAPORAN BERKALA RETAINER") {
      const startIdx = 7;
      for (let i = startIdx; i < rows.length; i++) {
        const r = rows[i];
        if (!r || r.length < 5 || !r[1]) continue;
        toInsert.push({
          type: "LAPORAN_BERKALA",
          no: String(r[1]).trim(),
          tanggal: parseExcelDate(r[2]),
          waktu: r[3] ? String(r[3]).trim() : "",
          namaKlien: r[4] ? String(r[4]).trim() : "",
          deskripsi: r[5] ? String(r[5]).trim() : "",
          tugas: r[6] ? String(r[6]).trim() : "",
          area: r[7] ? String(r[7]).trim() : "",
          status: mapExcelStatus(r[8] ? String(r[8]).trim() : ""),
          keterangan: r[9] ? String(r[9]).trim() : "",
          catatan: r[10] ? String(r[10]).trim() : "",
          penanggungJawab: r[11] ? String(r[11]).trim() : "",
        });
      }
    }
  });

  if (toInsert.length > 0) {
    await prisma.progressPekerjaan.createMany({
      data: toInsert,
    });
    console.log(`Successfully seeded ${toInsert.length} rows into ProgressPekerjaan.`);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Auto-seed if database table is empty
    const count = await prisma.progressPekerjaan.count();
    if (count === 0) {
      await seedExcelToDb();
    }

    // Check if summary count counts is requested
    const getSummary = searchParams.get("summary");
    if (getSummary === "true") {
      const allRows = await prisma.progressPekerjaan.findMany({
        select: { type: true, status: true }
      });

      const summaryObj = {
        RETAINER: { total: 0, selesai: 0, internalConf: 0, companyConf: 0, progress: 0, pending: 0, cancel: 0 },
        NON_RETAINER: { total: 0, selesai: 0, internalConf: 0, companyConf: 0, progress: 0, pending: 0, cancel: 0 },
        INTERNAL: { total: 0, selesai: 0, internalConf: 0, companyConf: 0, progress: 0, pending: 0, cancel: 0 },
        LAPORAN_BERKALA: { total: 0, selesai: 0, internalConf: 0, companyConf: 0, progress: 0, pending: 0, cancel: 0 }
      };

      allRows.forEach((row) => {
        const t = row.type as keyof typeof summaryObj;
        if (!summaryObj[t]) return;

        summaryObj[t].total++;
        const s = row.status.toUpperCase();
        if (s === "SELESAI") summaryObj[t].selesai++;
        else if (s === "KONFIRMASI INTERNAL") summaryObj[t].internalConf++;
        else if (s === "KONFIRMASI PERUSAHAAN") summaryObj[t].companyConf++;
        else if (s === "ON PROGRESS") summaryObj[t].progress++;
        else if (s === "PENDING") summaryObj[t].pending++;
        else if (s === "CANCEL") summaryObj[t].cancel++;
      });

      return NextResponse.json(summaryObj);
    }

    const type = searchParams.get("type");
    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Dynamic filters
    const where: any = { type };

    if (status) {
      where.status = status;
    }

    if (search) {
      const q = search.toLowerCase();
      where.OR = [
        { namaKlien: { contains: q } },
        { deskripsi: { contains: q } },
        { tugas: { contains: q } },
        { penanggungJawab: { contains: q } },
        { kategori: { contains: q } },
        { area: { contains: q } },
        { keterangan: { contains: q } },
        { catatan: { contains: q } },
      ];
    }

    const data = await prisma.progressPekerjaan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET progress-pekerjaan error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type,
      no,
      tanggal,
      waktu,
      namaKlien,
      quadran,
      kategori,
      deskripsi,
      tugas,
      area,
      status,
      keterangan,
      catatan,
      penanggungJawab,
    } = body;

    if (!type) {
      return NextResponse.json({ error: "type is required" }, { status: 400 });
    }

    const data = await prisma.progressPekerjaan.create({
      data: {
        type,
        no: no || null,
        tanggal: tanggal ? new Date(tanggal) : null,
        waktu: waktu || null,
        namaKlien: namaKlien || null,
        quadran: quadran || null,
        kategori: kategori || null,
        deskripsi: deskripsi || null,
        tugas: tugas || null,
        area: area || null,
        status: status || "ON PROGRESS",
        keterangan: keterangan || null,
        catatan: catatan || null,
        penanggungJawab: penanggungJawab || null,
      },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST progress-pekerjaan error:", error);
    return NextResponse.json({ error: error.message || "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      no,
      tanggal,
      waktu,
      namaKlien,
      quadran,
      kategori,
      deskripsi,
      tugas,
      area,
      status,
      keterangan,
      catatan,
      penanggungJawab,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const data = await prisma.progressPekerjaan.update({
      where: { id },
      data: {
        no: no !== undefined ? no : undefined,
        tanggal: tanggal ? new Date(tanggal) : (tanggal === null ? null : undefined),
        waktu: waktu !== undefined ? waktu : undefined,
        namaKlien: namaKlien !== undefined ? namaKlien : undefined,
        quadran: quadran !== undefined ? quadran : undefined,
        kategori: kategori !== undefined ? kategori : undefined,
        deskripsi: deskripsi !== undefined ? deskripsi : undefined,
        tugas: tugas !== undefined ? tugas : undefined,
        area: area !== undefined ? area : undefined,
        status: status !== undefined ? status : undefined,
        keterangan: keterangan !== undefined ? keterangan : undefined,
        catatan: catatan !== undefined ? catatan : undefined,
        penanggungJawab: penanggungJawab !== undefined ? penanggungJawab : undefined,
      },
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("PUT progress-pekerjaan error:", error);
    return NextResponse.json({ error: error.message || "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
    }

    await prisma.progressPekerjaan.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE progress-pekerjaan error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete" }, { status: 500 });
  }
}
