import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

// Helper to check admin session
async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session && (session.user as any)?.role === "admin";
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");
    const backupsDir = path.join(process.cwd(), "backups");

    // 1. Download single file
    if (filename) {
      // Security check: prevent directory traversal
      if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
      }

      const filePath = path.join(backupsDir, filename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Type": "application/gzip",
        },
      });
    }

    // 2. List all backup files
    if (!fs.existsSync(backupsDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(backupsDir)
      .filter(file => file.startsWith("db_backup_") && file.endsWith(".sql.gz"))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          sizeBytes: stats.size,
          sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.mtime.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

    return NextResponse.json(files);
  } catch (error) {
    console.error("GET backups error:", error);
    return NextResponse.json({ error: "Failed to read backups" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Run script in background or synchronously
    const scriptPath = path.join(process.cwd(), "scripts", "backup.js");
    
    return new Promise<NextResponse>((resolve) => {
      exec(`node "${scriptPath}"`, async (error, stdout, stderr) => {
        if (error) {
          console.error("Backup script execution error:", error, stderr);
          resolve(NextResponse.json({ error: `Backup failed: ${error.message}` }, { status: 500 }));
          return;
        }

        console.log("Backup script stdout:", stdout);

        // Fetch newest file info
        const backupsDir = path.join(process.cwd(), "backups");
        let newestFile = null;
        if (fs.existsSync(backupsDir)) {
          const files = fs.readdirSync(backupsDir)
            .filter(file => file.startsWith("db_backup_") && file.endsWith(".sql.gz"))
            .map(file => ({
              name: file,
              time: fs.statSync(path.join(backupsDir, file)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          if (files.length > 0) {
            newestFile = files[0].name;
          }
        }

        resolve(NextResponse.json({
          success: true,
          message: "Database backup created successfully",
          filename: newestFile
        }));
      });
    });

  } catch (error) {
    console.error("POST backup error:", error);
    return NextResponse.json({ error: "Backup trigger failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    // Security check: prevent directory traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), "backups");
    const filePath = path.join(backupsDir, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    // Log this action to the ActivityLog
    const session = await getServerSession(authOptions);
    await prisma.activityLog.create({
      data: {
        userId: (session?.user as any)?.id || null,
        userName: session?.user?.name || "Admin",
        action: "DELETE",
        target: "BACKUP_FILE",
        details: `File backup database dihapus secara manual: ${filename}`,
      },
    });

    return NextResponse.json({ success: true, message: `Backup file ${filename} deleted` });
  } catch (error) {
    console.error("DELETE backup error:", error);
    return NextResponse.json({ error: "Failed to delete backup file" }, { status: 500 });
  }
}
