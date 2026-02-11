import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const type = searchParams.get("type") || "all";

  try {
    const where: any = {};

    // Filtro por estado
    if (filter !== "all") {
      where.status = filter;
    }

    // Filtro por tipo
    if (type !== "all") {
      where.reportType = type;
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        reporter: { select: { email: true } },
        reportedUser: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
