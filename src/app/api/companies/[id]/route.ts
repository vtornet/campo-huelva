import { NextResponse } from "next/server";
import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener perfil público de una empresa
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json({ error: "Falta ID de empresa" }, { status: 400 });
    }

    const company = await prisma.companyProfile.findUnique({
      where: { id: companyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        subscription: {
          select: {
            status: true,
            isTrial: true,
            trialEndsAt: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Calcular si es premium (para mostrar en frontend)
    const isPremium =
      company.subscription &&
      (company.subscription.status === SubscriptionStatus.ACTIVE ||
        company.subscription.status === SubscriptionStatus.TRIALING) &&
      (!company.subscription.currentPeriodEnd ||
        new Date(company.subscription.currentPeriodEnd) > new Date());

    return NextResponse.json({
      ...company,
      isPremium,
    });
  } catch (error) {
    console.error("Error al obtener perfil de empresa:", error);
    return NextResponse.json(
      { error: "Error al obtener el perfil" },
      { status: 500 }
    );
  }
}
