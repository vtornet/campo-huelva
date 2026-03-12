import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Código de cupón requerido" },
        { status: 400 }
      );
    }

    // Buscar el cupón
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Código de cupón no válido" },
        { status: 404 }
      );
    }

    // Verificar estado
    if (coupon.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Este cupón ya ha sido usado o no está activo" },
        { status: 400 }
      );
    }

    // Verificar expiración
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Este cupón ha caducado" },
        { status: 400 }
      );
    }

    // Verificar que el usuario es una empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user?.companyProfile) {
      return NextResponse.json(
        { error: "Debes tener un perfil de empresa para usar este cupón" },
        { status: 400 }
      );
    }

    // Verificar si ya ha usado un cupón
    const existingUsed = await prisma.coupon.findFirst({
      where: {
        usedBy: user.companyProfile.id,
        status: "USED",
      },
    });

    if (existingUsed) {
      return NextResponse.json(
        { error: "Ya has utilizado un cupón anteriormente" },
        { status: 400 }
      );
    }

    // Verificar límite de usos
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json(
        { error: "Este cupón ha alcanzado su límite de usos" },
        { status: 400 }
      );
    }

    // Redimir el cupón: añadir 1 crédito de oferta a la empresa
    await prisma.$transaction([
      // Actualizar el cupón
      prisma.coupon.update({
        where: { id: coupon.id },
        data: {
          status: "USED",
          usedCount: { increment: 1 },
          usedBy: user.companyProfile.id,
          usedAt: new Date(),
        },
      }),
      // Añadir crédito a la empresa
      prisma.companyProfile.update({
        where: { id: user.companyProfile.id },
        data: { offerCredits: { increment: 1 } },
      }),
    ]);

    console.log(`[COUPON] Cupón ${code} redimido por empresa ${user.companyProfile.id}`);

    return NextResponse.json({
      success: true,
      message: "¡Cupón redimido! Tienes 1 crédito para publicar una oferta.",
      credits: 1,
    });
  } catch (error: any) {
    console.error("Error redeeming coupon:", error);
    return NextResponse.json(
      { error: "Error al redimir el cupón" },
      { status: 500 }
    );
  }
}
