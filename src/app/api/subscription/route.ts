import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// DELETE - Cancelar suscripción (desde base de datos)
export async function DELETE(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Obtener datos de la empresa con su suscripción
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyProfile: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user?.companyProfile?.subscription) {
      return NextResponse.json(
        { error: "No tienes una suscripción activa" },
        { status: 400 }
      );
    }

    const subscription = user.companyProfile.subscription;

    // Verificar si ya está cancelada
    if (subscription.status === "CANCELED") {
      return NextResponse.json(
        { error: "La suscripción ya está cancelada" },
        { status: 400 }
      );
    }

    // Si tiene stripeSubscriptionId, también cancelar en Stripe
    if (subscription.stripeSubscriptionId) {
      try {
        const { getStripe } = await import("@/lib/stripe");
        const stripe = getStripe();
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeError) {
        console.error("Error cancelando en Stripe, continuando con cancelación local:", stripeError);
        // Continuar con la cancelación local aunque falle en Stripe
      }
    }

    // Actualizar suscripción en base de datos
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "CANCELED",
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      },
    });

    // Crear registro en historial
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId: subscription.id,
        action: "CANCELED",
        fromStatus: subscription.status,
        toStatus: "CANCELED",
        changeReason: "Cancelación solicitada por la empresa",
        changedBy: userId,
      },
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
      },
    });
  } catch (error: any) {
    console.error("Error canceling subscription:", error);

    // Si el error es de autenticación, devolver 401
    if (error.message?.includes("Unauthorized") || error.message?.includes("inválido")) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Error al cancelar la suscripción", details: error?.message || "Error desconocido" },
      { status: 500 }
    );
  }
}

// GET - Obtener detalles de suscripción
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "No se proporcionó userId" },
        { status: 400 }
      );
    }

    // Obtener datos de la empresa con su suscripción
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyProfile: {
          include: {
            subscription: {
              include: {
                history: {
                  orderBy: { createdAt: "desc" },
                  take: 10,
                },
              },
            },
          },
        },
      },
    });

    if (!user?.companyProfile) {
      return NextResponse.json(
        { error: "Perfil de empresa no encontrado" },
        { status: 404 }
      );
    }

    const subscription = user.companyProfile.subscription;

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    // Calcular días restantes del trial
    let daysRemainingInTrial = 0;
    if (subscription.isTrial && subscription.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(subscription.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysRemainingInTrial = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemainingInTrial < 0) daysRemainingInTrial = 0;
    }

    // Calcular días restantes del periodo actual
    let daysRemainingInPeriod = 0;
    if (subscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(subscription.currentPeriodEnd);
      const diffTime = periodEnd.getTime() - now.getTime();
      daysRemainingInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemainingInPeriod < 0) daysRemainingInPeriod = 0;
    }

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        isTrial: subscription.isTrial,
        trialEndsAt: subscription.trialEndsAt,
        trialUsed: subscription.trialUsed,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeCustomerId: subscription.stripeCustomerId,
        daysRemainingInTrial,
        daysRemainingInPeriod,
        history: subscription.history,
      },
    });
  } catch (error: any) {
    console.error("Error getting subscription details:", error);
    return NextResponse.json(
      { error: "Error al obtener detalles de suscripción", details: error?.message },
      { status: 500 }
    );
  }
}
