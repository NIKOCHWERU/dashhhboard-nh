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

    const sessionUser = session.user as any;
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        role: true,
        canCreateAgenda: true,
        canManageHRM: true,
        canManageRetainer: true,
        canManagePerorangan: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ isSessionStale: true }); // User deleted, force logout
    }

    // Compare session variables with real-time database values
    const isSessionStale =
      dbUser.role !== sessionUser.role ||
      dbUser.canCreateAgenda !== sessionUser.canCreateAgenda ||
      dbUser.canManageHRM !== sessionUser.canManageHRM ||
      dbUser.canManageRetainer !== sessionUser.canManageRetainer ||
      dbUser.canManagePerorangan !== sessionUser.canManagePerorangan;

    return NextResponse.json({
      isSessionStale,
      dbUser,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to check session status" }, { status: 500 });
  }
}
