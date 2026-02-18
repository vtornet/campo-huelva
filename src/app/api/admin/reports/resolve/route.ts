import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { reportId, status, resolution, adminId } = body;

  if (!reportId || !status) {
    return NextResponse.json({ error: "Falta reportId o status" }, { status: 400 });
  }

  try {
    await prisma.report.update({
      where: { id: reportId },
      data: {
        status,
        resolution,
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    // Crear log
    await prisma.adminLog.create({
      data: {
        adminId: adminId || "system",
        action: "RESOLVE_REPORT",
        targetType: "REPORT",
        targetId: reportId,
        details: `${status}: ${resolution || ""}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error resolving report:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
