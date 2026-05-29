import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await prisma.skalaPrioritas.findMany({
      orderBy: [
        { level: "asc" },
        { createdAt: "desc" }
      ],
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch skala prioritas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await prisma.skalaPrioritas.create({
      data: {
        taskName: body.taskName,
        level: parseInt(body.level),
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status,
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
