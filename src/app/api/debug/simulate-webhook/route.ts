import { NextResponse } from "next/server";
import { PrismaClient, SubscriptionStatus } from "@prisma/client";

const prisma = new PrismaClient();

// Endpoint temporal para simular webhook de Stripe (solo para desarrollo)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Obtener el perfil de empresa del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user || user.role !== "COMPANY" || !user.companyProfile) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 });
    }

    // Crear suscripción de prueba
    const subscription = await prisma.subscription.upsert({
      where: { companyId: user.companyProfile.id },
      create: {
        companyId: user.companyProfile.id,
        stripeCustomerId: "cus_test_" + userId,
        stripeSubscriptionId: "sub_test_" + userId,
        stripePriceId: "price_test_99eur",
        status: SubscriptionStatus.ACTIVE,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días de prueba
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        history: {
          create: {
            action: "CREATED",
            toStatus: SubscriptionStatus.ACTIVE,
            changeReason: "Simulación para desarrollo",
          },
        },
      },
      update: {
        status: SubscriptionStatus.ACTIVE,
        isTrial: true,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        status: subscription.status,
        isTrial: subscription.isTrial,
        trialEndsAt: subscription.trialEndsAt,
      },
    });
  } catch (error) {
    console.error("Error simulando webhook:", error);
    return NextResponse.json(
      { error: "Error al simular webhook" },
      { status: 500 }
    );
  }
}

// GET para verificar estado actual
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId requerido" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      companyProfile: {
        include: { subscription: true },
      },
    },
  });

  if (!user?.companyProfile) {
    return NextResponse.json({ hasPremium: false });
  }

  const sub = user.companyProfile.subscription;
  const isActive =
    sub &&
    (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
    (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date());

  return NextResponse.json({
    hasPremium: isActive,
    subscription: sub,
  });
}
