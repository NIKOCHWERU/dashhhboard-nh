import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        canCreateAgenda: true,
        canManageHRM: true,
        canManageRetainer: true,
        canManagePerorangan: true,
        canAccessPekerjaan: true,
        canAccessDokumentasi: true,
        canAccessPengumuman: true,
        canAccessArsip: true,
        canAccessTenagaKerja: true,
        canManageLegal: true,
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      id, 
      role, 
      canCreateAgenda, 
      canManageHRM, 
      canManageRetainer, 
      canManagePerorangan,
      canAccessPekerjaan,
      canAccessDokumentasi,
      canAccessPengumuman,
      canAccessArsip,
      canAccessTenagaKerja,
      canManageLegal
    } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        role,
        canCreateAgenda,
        canManageHRM,
        canManageRetainer,
        canManagePerorangan,
        canAccessPekerjaan,
        canAccessDokumentasi,
        canAccessPengumuman,
        canAccessArsip,
        canAccessTenagaKerja,
        canManageLegal,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PUT user permissions error:", error);
    return NextResponse.json({ error: "Failed to update user permissions" }, { status: 500 });
  }
}
