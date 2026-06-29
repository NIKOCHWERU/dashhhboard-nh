import { NextRequest, NextResponse } from "next/server";
import { ExcelDataService, ExcelDataRow } from "@/services/ExcelDataService";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Check if summary count is requested
    const getSummary = searchParams.get("summary");
    if (getSummary === "true") {
      const counts = await ExcelDataService.getSummaryCounts();
      return NextResponse.json(counts);
    }

    // Check if agenda list is requested
    const getAgenda = searchParams.get("agenda");
    if (getAgenda === "true") {
      const agendas = await prisma.agenda.findMany({
        orderBy: { startDate: "asc" },
      });
      const mapped = agendas.map((row) => ({
        id: row.id,
        title: row.title,
        startDate: row.startDate,
        pic: row.pic,
        scale: row.scale,
        description: row.description,
        notes: row.notes,
      }));
      return NextResponse.json(mapped);
    }

    const sheetName = searchParams.get("sheetName");
    if (!sheetName) {
      return NextResponse.json(
        { error: "sheetName is required" },
        { status: 400 }
      );
    }

    // Validate sheet key
    let sheetKey: "RETAINER" | "NON_RETAINER" | "INTERNAL" | "LAPORAN_BERKALA";
    switch (sheetName.toUpperCase()) {
      case "RETAINER":
        sheetKey = "RETAINER";
        break;
      case "NON_RETAINER":
      case "NON-RETAINER":
        sheetKey = "NON_RETAINER";
        break;
      case "INTERNAL":
        sheetKey = "INTERNAL";
        break;
      case "LAPORAN_BERKALA":
      case "LAPORAN-BERKALA":
        sheetKey = "LAPORAN_BERKALA";
        break;
      default:
        return NextResponse.json(
          { error: `Invalid sheetName: ${sheetName}` },
          { status: 400 }
        );
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || undefined;
    const statusFilter = searchParams.get("status") || undefined;
    const quadrantFilter = searchParams.get("quadrant") || undefined;
    const sortField = (searchParams.get("sortField") as keyof ExcelDataRow) || undefined;
    const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    const result = await ExcelDataService.getSheetData(sheetKey, {
      page,
      limit,
      search,
      statusFilter,
      quadrantFilter,
      sortField,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Laporan Operasional error:", error);
    return NextResponse.json(
      { error: "Data tidak dapat dimuat saat ini. Silakan coba kembali beberapa saat lagi." },
      { status: 500 }
    );
  }
}
