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

    const reports = await prisma.report.findMany({
      where,
      include: {
        // Quién hace la denuncia
        reporter: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
            companyProfile: { select: { companyName: true } },
          }
        },
        // Usuario denunciado (si es una denuncia de usuario)
        reportedUser: {
          select: {
            id: true,
            email: true,
            role: true,
            isBanned: true,
            isSilenced: true,
            workerProfile: { select: { fullName: true, city: true, province: true } },
            foremanProfile: { select: { fullName: true, city: true, province: true } },
            companyProfile: { select: { companyName: true, city: true, province: true, isApproved: true, isVerified: true } },
          }
        },
        // Publicación denunciada (si es una denuncia de publicación)
        reportedPost: {
          select: {
            id: true,
            title: true,
            description: true,
            type: true,
            status: true,
            location: true,
            province: true,
            createdAt: true,
            company: {
              select: {
                id: true,
                companyName: true,
                isVerified: true,
              }
            },
            publisher: {
              select: {
                id: true,
                workerProfile: { select: { fullName: true } },
                foremanProfile: { select: { fullName: true } },
              }
            }
          }
        }
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
