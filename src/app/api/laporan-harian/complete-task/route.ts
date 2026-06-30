import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const body = await req.json();
    const { taskId, startTime, endTime, keterangan, catatan, uploadedFile } = body;

    if (!taskId || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Get the task details (check ProgressPekerjaan first, then PersonalTask)
    let taskName = "";
    let taskPriority = "";
    let taskLabel = "";
    let isPersonalTask = false;

    let progressTask = await prisma.progressPekerjaan.findUnique({
      where: { id: taskId },
    });

    if (progressTask) {
      taskName = progressTask.deskripsi || progressTask.tugas || "";
      taskPriority = progressTask.quadran || "Q3";
      taskLabel = progressTask.namaKlien || (progressTask.type === "RETAINER" ? "RETAINER" : progressTask.type === "NON_RETAINER" ? "NON RETAINER" : "INTERNAL");

      // Prepare attachments update
      let updatedAttachments = [];
      try {
        if (progressTask.attachments) {
          updatedAttachments = JSON.parse(progressTask.attachments);
        }
      } catch (e) {}

      if (uploadedFile) {
        updatedAttachments.push(uploadedFile);
      }

      // Update ProgressPekerjaan status to SELESAI
      await prisma.progressPekerjaan.update({
        where: { id: taskId },
        data: {
          status: "SELESAI",
          keterangan: keterangan || progressTask.keterangan,
          catatan: catatan || progressTask.catatan,
          attachments: JSON.stringify(updatedAttachments),
        },
      });
    } else if (taskId.startsWith("esok_") || taskId.startsWith("prio_")) {
      const parts = taskId.split("_");
      taskName = parts.slice(3).join("_");
      taskPriority = parts[2].toUpperCase();
      taskLabel = "LAPORAN TASK";
    } else {
      let personalTask = await prisma.personalTask.findUnique({
        where: { id: taskId },
      });

      if (!personalTask) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      taskName = personalTask.title;
      taskPriority = personalTask.priority || "Q3";
      taskLabel = "PERSONAL TASK";
      isPersonalTask = true;

      // Update PersonalTask status to COMPLETED
      await prisma.personalTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          notes: catatan || personalTask.notes,
        },
      });
    }

    // 2. Fetch or create today's LaporanHarian for this user
    const targetDate = new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const existingReport = await prisma.laporanHarian.findFirst({
      where: {
        userId: user.id,
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Compute Duration string
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight fallback
    const hrs = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const durationStr = `durasi ${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:00`;

    // Construct the log description
    const label = taskLabel;
    const activityDesc = `[${label}] ${taskName} - Keterangan: ${keterangan || "-"}${catatan ? `. Catatan: ${catatan}` : ""}`;

    const newTimeLog = {
      start: startTime,
      end: endTime,
      duration: durationStr,
      activity: activityDesc,
    };

    const outputDesc = `[${label}] Selesai: ${taskName}`;

    if (existingReport) {
      // Append to existing report
      let prio = { q1: [], q2: [], q3: [] };
      let logs = [];
      let outs = [];
      let docs = [];

      try { prio = JSON.parse(existingReport.prioritas); } catch (e) {}
      try { logs = JSON.parse(existingReport.rincianKegiatan) || []; } catch (e) {}
      try { outs = JSON.parse(existingReport.hasilKerja) || []; } catch (e) {}
      try { docs = JSON.parse(existingReport.documents || "[]") || []; } catch (e) {}

      // Append
      logs.push(newTimeLog);
      
      // Prevent duplicate output listings
      if (!outs.includes(outputDesc)) {
        outs.push(outputDesc);
      }

      if (uploadedFile) {
        docs.push(uploadedFile);
      }

      await prisma.laporanHarian.update({
        where: { id: existingReport.id },
        data: {
          rincianKegiatan: JSON.stringify(logs),
          hasilKerja: JSON.stringify(outs),
          documents: JSON.stringify(docs),
        },
      });
    } else {
      // Create new Laporan Harian
      const newReportDocs = uploadedFile ? [uploadedFile] : [];
      await prisma.laporanHarian.create({
        data: {
          userId: user.id,
          prioritas: JSON.stringify({ q1: [], q2: [], q3: [] }),
          rincianKegiatan: JSON.stringify([newTimeLog]),
          hasilKerja: JSON.stringify([outputDesc]),
          tugasEsok: JSON.stringify({ q1: [], q2: [], q3: [] }),
          refleksi: JSON.stringify({ learning: "", obstacles: "", notes: "" }),
          documents: JSON.stringify(newReportDocs),
          tanggal: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Complete task error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete task" }, { status: 500 });
  }
}
