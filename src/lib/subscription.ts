import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verifica si una empresa tiene suscripción premium activa
 * @param userId - ID del usuario de Firebase
 * @returns true si tiene suscripción premium activa, false en caso contrario
 */
export async function hasActivePremiumSubscription(
  userId: string
): Promise<boolean> {
  try {
    // Obtener el usuario con su perfil de empresa y suscripción
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

    // Verificar que sea empresa
    if (!user || user.role !== Role.COMPANY || !user.companyProfile) {
      return false;
    }

    // Verificar si tiene suscripción
    const subscription = user.companyProfile.subscription;
    if (!subscription) {
      return false;
    }

    // Verificar si la suscripción está activa
    const isActive =
      (subscription.status === "ACTIVE" ||
        subscription.status === "TRIALING") &&
      (!subscription.currentPeriodEnd ||
        new Date(subscription.currentPeriodEnd) > new Date());

    return isActive;
  } catch (error) {
    console.error("Error checking premium subscription:", error);
    return false;
  }
}

/**
 * Verifica si una empresa puede publicar ofertas ilimitadas
 * (tiene suscripción premium activa)
 */
export async function canPublishUnlimitedPosts(userId: string): Promise<boolean> {
  return await hasActivePremiumSubscription(userId);
}

/**
 * Verifica si una empresa puede acceder al buscador de candidatos
 * (tiene suscripción premium activa)
 */
export async function canAccessCandidateSearch(userId: string): Promise<boolean> {
  return await hasActivePremiumSubscription(userId);
}

/**
 * Obtiene información detallada de la suscripción de una empresa
 */
export async function getSubscriptionInfo(userId: string) {
  try {
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
      return null;
    }

    const sub = user.companyProfile.subscription;

    return {
      isActive:
        (sub.status === "ACTIVE" || sub.status === "TRIALING") &&
        (!sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date()),
      isTrial: sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date(),
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error("Error getting subscription info:", error);
    return null;
  }
}
