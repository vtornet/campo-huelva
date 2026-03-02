import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("VAPID keys no configuradas. Las notificaciones push no funcionarán.");
} else {
  webpush.setVapidDetails(
    `mailto:contact@appstracta.app`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushNotificationOptions {
  userId: string;
  title: string;
  body?: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Envía una notificación push a un usuario específico.
 * Si el usuario no tiene suscripción activa, la función falla silenciosamente.
 */
export async function sendPushNotification(options: PushNotificationOptions): Promise<boolean> {
  const { userId, title, body, url, tag, requireInteraction } = options;

  try {
    console.log(`[Push] Enviando notificación a usuario ${userId}: "${title}"`);

    // Obtener suscripción del usuario
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      console.log(`[Push] Usuario ${userId} no tiene suscripción push activa`);
      return false;
    }

    console.log(`[Push] Suscripción encontrada, endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    // Construir la suscripción en formato web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    // Enviar notificación. El tag permite reemplazar notificaciones anteriores del mismo tipo
    const payload = JSON.stringify({
      title,
      body: body || "",
      url: url || "/",
      tag: tag || "general",
      requireInteraction: requireInteraction || false,
      timestamp: Date.now(),
    });

    console.log(`[Push] Enviando a web-push...`);

    const result = await webpush.sendNotification(pushSubscription, payload)
      .catch((error: any) => {
        console.error(`[Push] Error de web-push:`, error);
        // Si la suscripción ya no es válida, eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Suscripción inválida (410/404) para usuario ${userId}, eliminando...`);
          prisma.pushSubscription.delete({
            where: { userId }
          }).catch(console.error);
        }
        throw error;
      });

    console.log(`[Push] ✓ Notificación enviada correctamente a ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Push] Error enviando notificación push a usuario ${userId}:`, error);
    return false;
  }
}

/**
 * Envía notificaciones push a múltiples usuarios.
 */
export async function sendBulkPushNotifications(
  userIds: string[],
  options: Omit<PushNotificationOptions, "userId">
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    const result = await sendPushNotification({ ...options, userId });
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Envía notificación de nuevo mensaje.
 * Usa un tag específico por conversación para que se reemplacen notificaciones anteriores del mismo chat.
 */
export async function notifyNewMessage(recipientId: string, senderName: string, conversationId: string): Promise<void> {
  await sendPushNotification({
    userId: recipientId,
    title: `Nuevo mensaje de ${senderName}`,
    body: "Tienes un nuevo mensaje sin leer",
    url: `/messages?id=${conversationId}`,
    tag: `chat-${conversationId}`,
  });
}

/**
 * Envía notificación de nueva inscripción en oferta (para empresas).
 */
export async function notifyNewApplication(companyId: string, workerName: string, postTitle: string): Promise<void> {
  await sendPushNotification({
    userId: companyId,
    title: "Nueva inscripción",
    body: `${workerName} se ha inscrito a tu oferta "${postTitle}"`,
    url: "/applications",
    tag: "new-application",
  });
}

/**
 * Envía notificación de cambio de estado en inscripción.
 */
export async function notifyApplicationStatus(workerId: string, status: string, postTitle: string): Promise<void> {
  const statusText = {
    ACCEPTED: "¡Te han aceptado!",
    REJECTED: "Te han rechazado",
    CONTACTED: "Te han contactado",
  }[status] || "Estado actualizado";

  await sendPushNotification({
    userId: workerId,
    title: statusText,
    body: `Tu estado para "${postTitle}" ha cambiado`,
    url: "/my-applications",
    tag: "application-status",
  });
}

/**
 * Envía notificación de nueva oferta según perfil.
 */
export async function notifyNewOffer(userId: string, offerTitle: string, location: string): Promise<void> {
  await sendPushNotification({
    userId,
    title: "Nueva oferta para ti",
    body: `"${offerTitle}" en ${location}`,
    url: "/",
    tag: "new-offer",
  });
}

/**
 * Envía notificación de solicitud de contacto.
 */
export async function notifyContactRequest(recipientId: string, requesterName: string): Promise<void> {
  await sendPushNotification({
    userId: recipientId,
    title: "Nueva solicitud de contacto",
    body: `${requesterName} quiere añadirte como contacto`,
    url: "/profile?tab=contacts",
    tag: "contact-request",
  });
}

/**
 * Envía notificación de contacto aceptado.
 */
export async function notifyContactAccepted(requesterId: string, recipientName: string): Promise<void> {
  await sendPushNotification({
    userId: requesterId,
    title: "Solicitud aceptada",
    body: `${recipientName} ha aceptado tu solicitud de contacto`,
    url: "/messages",
    tag: "contact-accepted",
  });
}
