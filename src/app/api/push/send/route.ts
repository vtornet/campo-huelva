import { NextResponse } from "next/server";
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

interface SendNotificationBody {
  userId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

// POST: Enviar notificación push a un usuario
export async function POST(request: Request) {
  try {
    const body: SendNotificationBody = await request.json();
    const { userId, title, body: notificationBody, url, tag, requireInteraction } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (userId, title)" },
        { status: 400 }
      );
    }

    // Obtener suscripción del usuario
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Usuario no tiene suscripción push" },
        { status: 404 }
      );
    }

    // Construir la suscripción en formato web-push
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    // Enviar notificación
    const payload = JSON.stringify({
      title,
      body: notificationBody || "",
      url: url || "/",
      tag: tag || "general",
      requireInteraction: requireInteraction || false,
    });

    await webpush.sendNotification(pushSubscription, payload)
      .catch((error: any) => {
        // Si la suscripción ya no es válida, eliminarla
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`Suscripción inválida para usuario ${userId}, eliminando...`);
          prisma.pushSubscription.delete({
            where: { userId }
          }).catch(console.error);
        }
        throw error;
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error enviando notificación push:", error);
    return NextResponse.json(
      { error: "Error al enviar notificación" },
      { status: 500 }
    );
  }
}
