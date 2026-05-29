import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  createInternalDocumentFolder,
  renameFolder,
  deleteFolder,
  uploadFile,
} from "@/lib/googleDrive";
import { logActivity } from "@/lib/activityLog";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const docs = await prisma.internalDocument.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(docs);
  } catch (error) {
    console.error("GET internal documents error:", error);
    return NextResponse.json({ error: "Failed to fetch internal documents" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        documentType: formData.get("documentType") as string,
        documentNumber: formData.get("documentNumber") as string,
        recipientName: formData.get("recipientName") as string,
        issueDate: formData.get("issueDate") as string,
        expiryDate: formData.get("expiryDate") as string || null,
        description: formData.get("description") as string || null,
      };
      file = formData.get("file") as File;
    } else {
      body = await req.json();
    }

    // 1. Create Google Drive subfolder for this document
    let googleFolderId: string | null = null;
    try {
      googleFolderId = await createInternalDocumentFolder(
        body.documentType,
        body.documentNumber,
        body.recipientName
      );

      // If file is provided, upload it to the new folder
      if (file && googleFolderId) {
        const fileBytes = await file.arrayBuffer();
        const fileBuffer = Buffer.from(fileBytes);
        await uploadFile(googleFolderId, file.name, file.type, fileBuffer);
      }
    } catch (gErr) {
      console.error("Google Drive internal document folder creation/upload failed:", gErr);
    }

    // 2. Create in DB
    const data = await prisma.internalDocument.create({
      data: {
        documentType: body.documentType,
        documentNumber: body.documentNumber,
        recipientName: body.recipientName,
        issueDate: new Date(body.issueDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        description: body.description || null,
        googleFolderId,
      },
    });

    // 3. Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "CREATE",
      "InternalDocument",
      `Membuat surat internal baru: [${data.documentType}] No. ${data.documentNumber} untuk ${data.recipientName}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("POST internal document error:", error);
    return NextResponse.json({ error: "Failed to create internal document" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const contentType = req.headers.get("content-type") || "";
    let body: any = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      body = {
        documentType: formData.get("documentType") as string,
        documentNumber: formData.get("documentNumber") as string,
        recipientName: formData.get("recipientName") as string,
        issueDate: formData.get("issueDate") as string,
        expiryDate: formData.get("expiryDate") as string || null,
        description: formData.get("description") as string || null,
      };
      file = formData.get("file") as File;
    } else {
      body = await req.json();
    }

    // Fetch existing
    const existing = await prisma.internalDocument.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    let googleFolderId = existing.googleFolderId;

    try {
      if (googleFolderId) {
        // Folder exists: rename if type, number, or recipient changed
        if (
          existing.documentType !== body.documentType ||
          existing.documentNumber !== body.documentNumber ||
          existing.recipientName !== body.recipientName
        ) {
          const newName = `${body.documentType} - ${body.documentNumber.replace(/\//g, "-")} - ${body.recipientName}`;
          await renameFolder(googleFolderId, newName);
        }
      } else {
        // Create if missing
        googleFolderId = await createInternalDocumentFolder(
          body.documentType,
          body.documentNumber,
          body.recipientName
        );
      }

      // Upload file if selected during update
      if (file && googleFolderId) {
        const fileBytes = await file.arrayBuffer();
        const fileBuffer = Buffer.from(fileBytes);
        await uploadFile(googleFolderId, file.name, file.type, fileBuffer);
      }
    } catch (gErr) {
      console.error("Google Drive internal folder rename/upload failed:", gErr);
    }

    const data = await prisma.internalDocument.update({
      where: { id },
      data: {
        documentType: body.documentType,
        documentNumber: body.documentNumber,
        recipientName: body.recipientName,
        issueDate: body.issueDate ? new Date(body.issueDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        description: body.description || null,
        googleFolderId,
      },
    });

    // Log CRUD activity
    await logActivity(
      user.id,
      user.name || user.email,
      "UPDATE",
      "InternalDocument",
      `Memperbarui surat internal: [${data.documentType}] No. ${data.documentNumber}`
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("PUT internal document error:", error);
    return NextResponse.json({ error: "Failed to update internal document" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID Required" }, { status: 400 });

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = session.user as any;

    const existing = await prisma.internalDocument.findUnique({ where: { id } });
    if (existing) {
      if (existing.googleFolderId) {
        try {
          await deleteFolder(existing.googleFolderId);
        } catch (gErr) {
          console.error("Google Drive internal folder deletion failed:", gErr);
        }
      }
      await prisma.internalDocument.delete({ where: { id } });

      // Log CRUD activity
      await logActivity(
        user.id,
        user.name || user.email,
        "DELETE",
        "InternalDocument",
        `Menghapus surat internal: [${existing.documentType}] No. ${existing.documentNumber} untuk ${existing.recipientName}`
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE internal document error:", error);
    return NextResponse.json({ error: "Failed to delete internal document" }, { status: 500 });
  }
}
