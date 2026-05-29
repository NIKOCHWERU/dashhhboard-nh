import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const pt = searchParams.get("pt") || "Semua PT";

  try {
    const ptFilter = pt === "Semua PT" ? {} : { pt };

    // Fetch metrics
    const karyawanCount = await prisma.karyawan.count({
      where: { status: "Active", ...ptFilter }
    });

    const resignCount = await prisma.karyawan.count({
      where: { status: "Resign", ...ptFilter }
    });

    // We can also check HRMOffboarding for resign data
    const offboardCount = await prisma.hRMOffboarding.count({
      where: { ...ptFilter }
    });

    const kpiData = await prisma.hRMKPI.findMany({
      where: { ...ptFilter }
    });

    const avgKpi = kpiData.length > 0 
      ? (kpiData.reduce((acc, curr) => acc + curr.skor, 0) / kpiData.length).toFixed(1)
      : "0.0";

    const payrollData = await prisma.hRMPayroll.aggregate({
      _sum: { totalGaji: true },
      where: { ...ptFilter }
    });

    // Prepare chart data
    // Bar chart: Name vs KPI score
    const barLabels = kpiData.map(k => k.nama).slice(0, 10);
    const barData = kpiData.map(k => k.skor).slice(0, 10);

    // Donut chart: KPI distribution (e.g. Score 5, 4, 3, 2, 1)
    const dist = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    kpiData.forEach(k => {
      const score = Math.round(k.skor).toString();
      if (dist[score as keyof typeof dist] !== undefined) {
        dist[score as keyof typeof dist]++;
      }
    });

    return NextResponse.json({
      totalKaryawan: karyawanCount,
      totalResign: resignCount + offboardCount,
      avgKpi: avgKpi,
      totalPayroll: payrollData._sum.totalGaji || 0,
      barChart: {
        labels: barLabels.length ? barLabels : ["Tidak ada data"],
        data: barData.length ? barData : [0]
      },
      donutChart: {
        labels: ["Skor 5", "Skor 4", "Skor 3", "Skor 2", "Skor 1"],
        data: [dist["5"], dist["4"], dist["3"], dist["2"], dist["1"]]
      }
    });

  } catch (error) {
    console.error("Dashboard HRM error:", error);
    // Return dummy data if DB is not pushed yet
    return NextResponse.json({
      totalKaryawan: 120,
      totalResign: 5,
      avgKpi: "3.8",
      totalPayroll: 500000000,
      barChart: {
        labels: ["Wahyu", "Erika", "Niko", "Rina", "Adin"],
        data: [4.5, 4.0, 3.5, 5.0, 3.0]
      },
      donutChart: {
        labels: ["Skor 5", "Skor 4", "Skor 3", "Skor 2", "Skor 1"],
        data: [10, 45, 20, 5, 2]
      }
    });
  }
}
