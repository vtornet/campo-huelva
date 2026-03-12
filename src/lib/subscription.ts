import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verifica si una empresa tiene suscripción premium activa
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

    // Verificar si la suscripción está activa
    const isActive = !!(
      subscription &&
      (subscription.status === "ACTIVE" || subscription.status === "TRIALING") &&
      (isTrial || (!subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > new Date()))
    );

    return { hasPremium: isActive, isTrial };
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
 * Requiere que la suscripción esté ACTIVE y que haya pagado después del periodo de prueba
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

    console.log('[hasPaidSubscription] subscription:', {
      id: subscription.id,
      status: subscription.status,
      isTrial: subscription.isTrial,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

    // Verificar si la suscripción está activa y NO es solo periodo de prueba
    const now = new Date();
    const isActiveStatus = subscription.status === "ACTIVE";
    const isNotInTrial = !subscription.isTrial || !subscription.trialEndsAt || new Date(subscription.trialEndsAt) < now;
    const isWithinPeriod = !subscription.currentPeriodEnd || new Date(subscription.currentPeriodEnd) > now;

    const hasPaid = isActiveStatus && isNotInTrial && isWithinPeriod;

    console.log('[hasPaidSubscription] isActiveStatus:', isActiveStatus);
    console.log('[hasPaidSubscription] isNotInTrial:', isNotInTrial);
    console.log('[hasPaidSubscription] isWithinPeriod:', isWithinPeriod);
    console.log('[hasPaidSubscription] hasPaid:', hasPaid);

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

    // Verificar si está en periodo de prueba
    const isTrial = sub.isTrial && sub.trialEndsAt && new Date(sub.trialEndsAt) > new Date();

    // Verificar si la suscripción está activa
    let isActive = false;
    if (sub.status === "ACTIVE" || sub.status === "TRIALING") {
      // Si está en periodo de prueba, verificar por trialEndsAt
      if (isTrial) {
        isActive = true;
      } else {
        // Si no está en prueba, verificar por currentPeriodEnd
        isActive = !sub.currentPeriodEnd || new Date(sub.currentPeriodEnd) > new Date();
      }
    }

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
