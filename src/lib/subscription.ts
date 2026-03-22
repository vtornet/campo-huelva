import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verifica si una empresa tiene suscripción premium activa
 * Lógica simplificada: tiene Premium si currentPeriodEnd > ahora
 * @param userId - ID del usuario de Firebase
 * @returns Objeto con hasPremium, isTrial, o null si no tiene suscripción
 */
export async function hasActivePremiumSubscription(
  userId: string
): Promise<{ hasPremium: boolean; isTrial: boolean } | null> {
  try {
    console.log('[hasActivePremiumSubscription] Checking userId:', userId);

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
      console.log('[hasActivePremiumSubscription] Not a company or no profile');
      return null;
    }

    // Verificar si tiene suscripción
    const subscription = user.companyProfile.subscription;
    if (!subscription) {
      console.log('[hasActivePremiumSubscription] No subscription found');
      return null;
    }

    // Verificar si está en periodo de prueba
    const isTrial = !!(
      subscription &&
      subscription.isTrial &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) > new Date()
    );

    // Lógica simplificada: tiene Premium si currentPeriodEnd > ahora
    // No importa el status (ACTIVE, CANCELED, etc.)
    const now = new Date();
    const hasPremium = !!(
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > now
    );

    console.log('[hasActivePremiumSubscription] Result:', {
      userId,
      hasPremium,
      isTrial,
      currentPeriodEnd: subscription.currentPeriodEnd,
      status: subscription.status
    });

    return { hasPremium, isTrial };
  } catch (error) {
    console.error("Error checking premium subscription:", error);
    return null;
  }
}

/**
 * Versión boolean de compatibilidad para hasActivePremiumSubscription
 * @param userId - ID del usuario de Firebase
 * @returns true si tiene suscripción premium activa, false en caso contrario
 */
export async function hasActivePremiumSubscriptionBool(
  userId: string
): Promise<boolean> {
  const result = await hasActivePremiumSubscription(userId);
  return result?.hasPremium || false;
}

/**
 * Verifica si una empresa ha pagado (no está solo en periodo de prueba)
 * Lógica simplificada: tiene suscripción pagada si currentPeriodEnd > ahora
 * @param userId - ID del usuario de Firebase
 * @returns true si ha pagado (suscripción activa fuera de prueba), false en caso contrario
 */
export async function hasPaidSubscription(
  userId: string
): Promise<boolean> {
  try {
    console.log('[hasPaidSubscription] Checking userId:', userId);

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
      console.log('[hasPaidSubscription] Not a company or no profile');
      return false;
    }

    // Verificar si tiene suscripción
    const subscription = user.companyProfile.subscription;
    if (!subscription) {
      console.log('[hasPaidSubscription] No subscription found');
      return false;
    }

    // Lógica simplificada: tiene suscripción si currentPeriodEnd > ahora
    // No importa el status ni si es trial
    const now = new Date();
    const hasPaid = !!(
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > now
    );

    console.log('[hasPaidSubscription] Result:', {
      userId,
      hasPaid,
      currentPeriodEnd: subscription.currentPeriodEnd,
      status: subscription.status
    });

    return hasPaid;
  } catch (error) {
    console.error("Error checking paid subscription:", error);
    return false;
  }
}

/**
 * Verifica si una empresa puede publicar ofertas ilimitadas
 * (tiene suscripción premium activa, INCLUYENDO periodo de prueba)
 */
export async function canPublishUnlimitedPosts(userId: string): Promise<boolean> {
  return await hasActivePremiumSubscriptionBool(userId);
}

/**
 * Verifica si una empresa puede acceder al buscador de candidatos
 * (REQUIERE suscripción PAGADA, no solo periodo de prueba)
 */
export async function canAccessCandidateSearch(userId: string): Promise<boolean> {
  return await hasPaidSubscription(userId);
}

/**
 * Obtiene información detallada de la suscripción de una empresa
 * Lógica simplificada: isActive = currentPeriodEnd > ahora
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
    const now = new Date();

    // Verificar si está en periodo de prueba
    const isTrial = sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) > now;

    // Lógica simplificada: isActive = currentPeriodEnd > ahora
    const isActive = !!(sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) > now);

    return {
      isActive,
      isTrial,
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
