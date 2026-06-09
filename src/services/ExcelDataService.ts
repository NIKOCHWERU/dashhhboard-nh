import fs from "fs";
import path from "path";
import * as xlsx from "xlsx";

export interface ExcelDataRow {
  no: string;
  tanggal: string; // formatted Date
  rawTanggal?: number;
  quadran?: string;
  status: string;
  kategori?: string;
  deskripsi: string;
  tugas: string;
  area: string;
  keterangan: string;
  catatan: string;
  penanggungJawab: string;
  waktu?: string;
  namaKlien?: string;
}

interface CacheEntry {
  data: Record<string, ExcelDataRow[]>;
  timestamp: number;
  mtimeMs: number;
}

export class ExcelDataService {
  private static cache: CacheEntry | null = null;
  private static readonly TTL_MS = 60 * 1000; // 60 seconds cache TTL
  private static readonly EXCEL_PATH = path.join(
    process.cwd(),
    "DASHBOARD NARASUMBER HUKUM.xlsx"
  );

  /**
   * Convert Excel Date Serial Number to ISO date string (YYYY-MM-DD)
   */
  public static excelDateToISO(serial: any): string {
    if (!serial) return "";
    const num = Number(serial);
    if (isNaN(num)) {
      // If it is already a string date, return it cleaned
      return String(serial).trim();
    }
    // Excel date epoch starts on 1900-01-01
    // Offset for Unix timestamp is 25569 days
    const date = new Date((num - 25569) * 86400 * 1000);
    if (isNaN(date.getTime())) return String(serial).trim();
    
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Load and Parse Excel file with caching
   */
  private static async loadExcelData(): Promise<Record<string, ExcelDataRow[]>> {
    try {
      if (!fs.existsSync(this.EXCEL_PATH)) {
        throw new Error(`File Excel tidak ditemukan di path: ${this.EXCEL_PATH}`);
      }

      const stats = fs.statSync(this.EXCEL_PATH);
      const mtimeMs = stats.mtimeMs;
      const now = Date.now();

      // Return cached data if valid
      if (
        this.cache &&
        now - this.cache.timestamp < this.TTL_MS &&
        this.cache.mtimeMs === mtimeMs
      ) {
        return this.cache.data;
      }

      console.log("Loading and parsing Excel file from disk...");
      const workbook = xlsx.readFile(this.EXCEL_PATH);
      const parsedData: Record<string, ExcelDataRow[]> = {};

      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const rows: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        const list: ExcelDataRow[] = [];

        if (sheetName === "SKALA PRIORITAS RETAINER") {
          // Headers are at Row 7 (index 6). Data starts from index 7.
          const startIdx = 7;
          for (let i = startIdx; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 5 || !r[1]) continue; // Skip empty rows or rows without No/Klien
            list.push({
              no: String(r[1]).trim(),
              tanggal: this.excelDateToISO(r[2]),
              rawTanggal: Number(r[2]) || undefined,
              waktu: r[3] ? String(r[3]).trim() : "",
              namaKlien: r[4] ? String(r[4]).trim() : "",
              quadran: r[5] ? String(r[5]).trim() : "",
              deskripsi: r[6] ? String(r[6]).trim() : "",
              tugas: r[7] ? String(r[7]).trim() : "",
              area: r[8] ? String(r[8]).trim() : "",
              status: r[9] ? String(r[9]).trim() : "",
              keterangan: r[10] ? String(r[10]).trim() : "",
              catatan: r[11] ? String(r[11]).trim() : "",
              penanggungJawab: r[12] ? String(r[12]).trim() : "",
            });
          }
          parsedData["RETAINER"] = list;
        } else if (sheetName === "NON RETAINER") {
          // Headers at Row 6 (index 5). Data starts from index 6.
          const startIdx = 6;
          for (let i = startIdx; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 5 || !r[0]) continue;
            list.push({
              no: String(r[0]).trim(),
              tanggal: this.excelDateToISO(r[1]),
              rawTanggal: Number(r[1]) || undefined,
              quadran: r[2] ? String(r[2]).trim() : "",
              status: r[3] ? String(r[3]).trim() : "",
              kategori: r[4] ? String(r[4]).trim() : "",
              deskripsi: r[5] ? String(r[5]).trim() : "",
              area: r[6] ? String(r[6]).trim() : "",
              tugas: r[7] ? String(r[7]).trim() : "",
              keterangan: r[8] ? String(r[8]).trim() : "",
              catatan: r[9] ? String(r[9]).trim() : "",
              penanggungJawab: r[10] ? String(r[10]).trim() : "",
            });
          }
          parsedData["NON_RETAINER"] = list;
        } else if (sheetName === "INTERNAL") {
          // Headers at Row 6 (index 5). Data starts from index 6.
          const startIdx = 6;
          for (let i = startIdx; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 5 || !r[0]) continue;
            list.push({
              no: String(r[0]).trim(),
              tanggal: this.excelDateToISO(r[1]),
              rawTanggal: Number(r[1]) || undefined,
              quadran: r[2] ? String(r[2]).trim() : "",
              status: r[3] ? String(r[3]).trim() : "",
              deskripsi: r[4] ? String(r[4]).trim() : "",
              area: r[5] ? String(r[5]).trim() : "",
              tugas: r[6] ? String(r[6]).trim() : "",
              keterangan: r[7] ? String(r[7]).trim() : "",
              catatan: r[8] ? String(r[8]).trim() : "",
              penanggungJawab: r[9] ? String(r[9]).trim() : "",
            });
          }
          parsedData["INTERNAL"] = list;
        } else if (sheetName === "KHUSUS LAPORAN BERKALA RETAINER") {
          // Headers at Row 7 (index 6). Data starts from index 7.
          const startIdx = 7;
          for (let i = startIdx; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 5 || !r[1]) continue;
            list.push({
              no: String(r[1]).trim(),
              tanggal: this.excelDateToISO(r[2]),
              rawTanggal: Number(r[2]) || undefined,
              waktu: r[3] ? String(r[3]).trim() : "",
              namaKlien: r[4] ? String(r[4]).trim() : "",
              deskripsi: r[5] ? String(r[5]).trim() : "",
              tugas: r[6] ? String(r[6]).trim() : "",
              area: r[7] ? String(r[7]).trim() : "",
              status: r[8] ? String(r[8]).trim() : "",
              keterangan: r[9] ? String(r[9]).trim() : "",
              catatan: r[10] ? String(r[10]).trim() : "",
              penanggungJawab: r[11] ? String(r[11]).trim() : "",
            });
          }
          parsedData["LAPORAN_BERKALA"] = list;
        }
      });

      this.cache = {
        data: parsedData,
        timestamp: now,
        mtimeMs,
      };

      return parsedData;
    } catch (error) {
      console.error("Failed to parse Excel file:", error);
      throw error;
    }
  }

  /**
   * Get filtered, sorted and paginated data for a sheet
   */
  public static async getSheetData(
    sheetKey: "RETAINER" | "NON_RETAINER" | "INTERNAL" | "LAPORAN_BERKALA",
    params: {
      page?: number;
      limit?: number;
      search?: string;
      statusFilter?: string;
      quadrantFilter?: string;
      sortField?: keyof ExcelDataRow;
      sortOrder?: "asc" | "desc";
    } = {}
  ): Promise<{ data: ExcelDataRow[]; total: number }> {
    const allData = await this.loadExcelData();
    let list = allData[sheetKey] || [];

    // 1. Search Filter
    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter((r) => {
        return (
          (r.namaKlien && r.namaKlien.toLowerCase().includes(q)) ||
          r.deskripsi.toLowerCase().includes(q) ||
          r.tugas.toLowerCase().includes(q) ||
          r.penanggungJawab.toLowerCase().includes(q) ||
          (r.kategori && r.kategori.toLowerCase().includes(q)) ||
          r.area.toLowerCase().includes(q)
        );
      });
    }

    // 2. Status Filter
    if (params.statusFilter) {
      const status = params.statusFilter.toLowerCase();
      list = list.filter((r) => r.status.toLowerCase() === status);
    }

    // 3. Quadrant Filter
    if (params.quadrantFilter) {
      const quad = params.quadrantFilter.toLowerCase();
      list = list.filter((r) => r.quadran && r.quadran.toLowerCase() === quad);
    }

    // 4. Sort
    if (params.sortField) {
      const field = params.sortField;
      const order = params.sortOrder || "asc";
      list.sort((a, b) => {
        let valA = a[field] || "";
        let valB = b[field] || "";

        // If sorting by date
        if (field === "tanggal") {
          const rawA = a.rawTanggal || 0;
          const rawB = b.rawTanggal || 0;
          return order === "asc" ? rawA - rawB : rawB - rawA;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return order === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return 0;
      });
    }

    const total = list.length;

    // 5. Pagination
    if (params.page && params.limit) {
      const start = (params.page - 1) * params.limit;
      list = list.slice(start, start + params.limit);
    }

    return { data: list, total };
  }

  /**
   * Get Summary Counts for Dashboard Panels
   */
  public static async getSummaryCounts(): Promise<{
    retainer: number;
    nonRetainer: number;
    internal: number;
    laporanBerkala: number;
  }> {
    const allData = await this.loadExcelData();
    return {
      retainer: (allData["RETAINER"] || []).length,
      nonRetainer: (allData["NON_RETAINER"] || []).length,
      internal: (allData["INTERNAL"] || []).length,
      laporanBerkala: (allData["LAPORAN_BERKALA"] || []).length,
    };
  }

  /**
   * Get active agendas with approaching deadlines or active status from Excel
   */
  public static async getAgendas(limit: number = 10): Promise<ExcelDataRow[]> {
    const allData = await this.loadExcelData();
    // Gather ongoing tasks from Retainer, Non-Retainer, and Internal
    const combined: ExcelDataRow[] = [];

    const retainerActive = (allData["RETAINER"] || []).filter(
      (r) => r.status.toLowerCase() !== "selesai"
    );
    const nonRetainerActive = (allData["NON_RETAINER"] || []).filter(
      (r) => r.status.toLowerCase() !== "selesai"
    );
    const internalActive = (allData["INTERNAL"] || []).filter(
      (r) => r.status.toLowerCase() !== "selesai"
    );

    combined.push(...retainerActive, ...nonRetainerActive, ...internalActive);

    // Sort by Date (newest or closest)
    combined.sort((a, b) => {
      const rawA = a.rawTanggal || 0;
      const rawB = b.rawTanggal || 0;
      return rawB - rawA; // Newest modification first
    });

    return combined.slice(0, limit);
  }
}
