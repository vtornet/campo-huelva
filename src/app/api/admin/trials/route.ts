import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET - Listar solicitudes de prueba gratuita (admin)
export async function GET(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const trials = await prisma.freeTrialRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            cif: true,
            province: true,
            isVerified: true,
            isApproved: true,
            user: {
              select: { email: true },
            },
          },
        },
      },
      take: 100,
    });

    return NextResponse.json({ trials });
  } catch (error: any) {
    console.error("Error fetching trials:", error);
    return NextResponse.json({ error: "Error al obtener solicitudes" }, { status: 500 });
  }
}
