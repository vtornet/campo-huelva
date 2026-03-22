import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";

  try {
    const where: any = {};

    // Filtro por estado de verificación
    if (filter === "verified") {
      where.isVerified = true;
    } else if (filter === "unverified") {
      where.isVerified = false;
    }
    // Filtro pendientes de aprobación (verificadas pero no aprobadas)
    else if (filter === "pending_approval") {
      where.isVerified = true;
      where.isApproved = false;
    }
    // Filtro por estado de aprobación (obsoleto, mantener por compatibilidad)
    else if (filter === "approved") {
      where.isApproved = true;
    } else if (filter === "unapproved") {
      // Para "por aprobar", mostramos las verificadas pero no aprobadas
      where.isVerified = true;
      where.isApproved = false;
    }
    // Filtros por estado premium
    else if (filter === "premium") {
      // Empresas con suscripción activa (y no en cancelación pendiente)
      where.subscription = {
        status: "ACTIVE",
        cancelAtPeriodEnd: false
      };
    } else if (filter === "cancel_pending") {
      // Empresas con cancelación pendiente
      where.subscription = {
        status: "ACTIVE",
        cancelAtPeriodEnd: true
      };
    } else if (filter === "paid") {
      // Igual que premium (obsoleto, mantenido por compatibilidad)
      where.subscription = {
        status: "ACTIVE"
      };
    } else if (filter === "inactive") {
      // Empresas sin suscripción o con suscripción inactiva
      where.OR = [
        { subscription: null },
        { subscription: { status: { not: "ACTIVE" } } }
      ];
    } else if (filter === "restricted") {
      // Empresas baneadas o silenciadas
      where.user = {
        OR: [
          { isBanned: true },
          { isSilenced: true }
        ]
      };
    }

    const companies = await prisma.companyProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isBanned: true,
            isSilenced: true,
          }
        },
        subscription: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Aprobar o retirar aprobación de empresas
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, approve, userId } = body;

    if (!companyId || typeof approve !== "boolean" || !userId) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Verificar que el usuario es admin
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Actualizar el estado de aprobación
    const company = await prisma.companyProfile.update({
      where: { id: companyId },
      data: {
        isApproved: approve,
        approvedAt: approve ? new Date() : null,
        approvedBy: approve ? userId : null
      }
    });

    return NextResponse.json({ success: true, company });
  } catch (error) {
    console.error("Error approving company:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
