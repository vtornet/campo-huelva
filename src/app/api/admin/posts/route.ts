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
      where.type = type;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        publisher: {
          include: {
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
          },
        },
        company: { select: { companyName: true, isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
