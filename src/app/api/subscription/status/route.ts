import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Obtener userId de la query string (compatibilidad con el sistema existente)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "No se proporcionó userId" },
        { status: 400 }
      );
    }

    // Obtener datos del usuario con su suscripción
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

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Si no es empresa, no puede tener suscripción
    if (user.role !== Role.COMPANY) {
      return NextResponse.json({
        isPremium: false,
        canHavePremium: false,
      });
    }

    // Si no tiene perfil de empresa
    if (!user.companyProfile) {
      return NextResponse.json({
        isPremium: false,
        canHavePremium: true,
        needsProfile: true,
      });
    }

    const subscription = user.companyProfile.subscription;

    // Verificar si está en periodo de prueba (prioridad sobre currentPeriodEnd)
    const isTrial =
      subscription &&
      subscription.isTrial &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) > new Date();

    // Verificar si la suscripción está activa
    // Si está en prueba, usar trialEndsAt. Si no, usar currentPeriodEnd.
    let isActive = false;
    if (subscription) {
      if (subscription.status === "ACTIVE" || subscription.status === "TRIALING") {
        // Si está en periodo de prueba, verificar por trialEndsAt
        if (isTrial) {
          isActive = true;
        } else {
          // Si no está en prueba, verificar por currentPeriodEnd
          isActive = !subscription.currentPeriodEnd ||
            new Date(subscription.currentPeriodEnd) > new Date();
        }
      }
    }

    // Debug logs
    console.log('[SUBSCRIPTION STATUS] userId:', userId);
    console.log('[SUBSCRIPTION STATUS] subscription:', subscription ? {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      trialEndsAt: subscription.trialEndsAt
    } : 'NO SUBSCRIPTION');
    console.log('[SUBSCRIPTION STATUS] isActive:', isActive);
    console.log('[SUBSCRIPTION STATUS] isTrial:', isTrial);
    console.log('[SUBSCRIPTION STATUS] isPremium:', isActive || false);

    return NextResponse.json({
      isPremium: isActive || false,
      isTrial: isTrial || false,
      canHavePremium: true,
      subscription: subscription
        ? {
            status: subscription.status,
            isTrial: subscription.isTrial,
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    });
  } catch (error) {
    console.error("Error checking subscription status:", error);
    return NextResponse.json(
      { error: "Error al verificar suscripción" },
      { status: 500 }
    );
  }
}
