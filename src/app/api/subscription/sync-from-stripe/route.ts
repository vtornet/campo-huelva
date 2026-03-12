import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

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

    console.log("[SYNC-STRIPE] Iniciando sincronización para usuario:", userId);

    // Verificar que Stripe esté configurado
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "STRIPE_NOT_CONFIGURED", message: "Sistema de pagos no configurado" },
        { status: 503 }
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

    if (!user?.companyProfile) {
      return NextResponse.json(
        { error: "Perfil de empresa no encontrado" },
        { status: 404 }
      );
    }

    const subscription = user.companyProfile.subscription;

    if (!subscription) {
      return NextResponse.json(
        { error: "No tienes una suscripción para sincronizar" },
        { status: 400 }
      );
    }

    if (!subscription.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: "NO_STRIPE_SUBSCRIPTION",
          message: "La suscripción no tiene un ID de Stripe asociado. Puede ser una suscripción creada manualmente."
        },
        { status: 400 }
      );
    }

    console.log("[SYNC-STRIPE] Recuperando suscripción desde Stripe:", subscription.stripeSubscriptionId);

    // Recuperar suscripción desde Stripe
    const stripeInstance = getStripe();
    const stripeSubscription = await stripeInstance.subscriptions.retrieve(subscription.stripeSubscriptionId);

    console.log("[SYNC-STRIPE] Estado en Stripe:", stripeSubscription.status);
    console.log("[SYNC-STRIPE] current_period_end:", stripeSubscription.current_period_end);

    // Determinar si está en periodo de prueba
    const hasTrial = Boolean(stripeSubscription.trial_end && stripeSubscription.trial_end > Date.now() / 1000);

    // Preparar datos de actualización
    const updateData: any = {
      status: stripeSubscription.status === "active" ? "ACTIVE" :
                 stripeSubscription.status === "trialing" ? "TRIALING" :
                 stripeSubscription.status === "past_due" ? "PAST_DUE" :
                 stripeSubscription.status === "canceled" ? "CANCELED" :
                 stripeSubscription.status === "incomplete" ? "INCOMPLETE" :
                 stripeSubscription.status === "paused" ? "PAUSED" : "ACTIVE",
      isTrial: hasTrial,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    };

    // Fechas opcionales
    if (stripeSubscription.trial_end) {
      updateData.trialEndsAt = new Date(stripeSubscription.trial_end * 1000);
    }
    if (stripeSubscription.current_period_start) {
      updateData.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    }
    if (stripeSubscription.current_period_end) {
      updateData.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    }

    // Actualizar suscripción en BD
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: updateData,
    });

    console.log("[SYNC-STRIPE] Suscripción actualizada correctamente");

    // Calcular días restantes
    let daysRemainingInTrial = 0;
    let daysRemainingInPeriod = 0;

    if (updatedSubscription.isTrial && updatedSubscription.trialEndsAt) {
      const now = new Date();
      const trialEnd = new Date(updatedSubscription.trialEndsAt);
      const diffTime = trialEnd.getTime() - now.getTime();
      daysRemainingInTrial = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemainingInTrial < 0) daysRemainingInTrial = 0;
    }

    if (updatedSubscription.currentPeriodEnd) {
      const now = new Date();
      const periodEnd = new Date(updatedSubscription.currentPeriodEnd);
      const diffTime = periodEnd.getTime() - now.getTime();
      daysRemainingInPeriod = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (daysRemainingInPeriod < 0) daysRemainingInPeriod = 0;
    }

    return NextResponse.json({
      success: true,
      message: "Suscripción sincronizada correctamente",
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        isTrial: updatedSubscription.isTrial,
        trialEndsAt: updatedSubscription.trialEndsAt,
        currentPeriodEnd: updatedSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: updatedSubscription.cancelAtPeriodEnd,
        daysRemainingInTrial,
        daysRemainingInPeriod,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[SYNC-STRIPE] Error sincronizando suscripción:", error);

    // Si el error es de autenticación
    if (error.message?.includes("Unauthorized") || error.message?.includes("inválido")) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    // Si es un error de Stripe (suscripción no encontrada)
    if (error.type === "StripeInvalidRequestError" || error.code === "resource_missing") {
      return NextResponse.json(
        {
          error: "STRIPE_SUBSCRIPTION_NOT_FOUND",
          message: "La suscripción no existe en Stripe. Puede haber sido cancelada o eliminada."
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Error al sincronizar suscripción", details: error?.message },
      { status: 500 }
    );
  }
}
