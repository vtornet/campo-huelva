import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import webpush from "web-push";

const prisma = new PrismaClient();

// Configurar VAPID
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("VAPID keys no configuradas");
} else {
  webpush.setVapidDetails(
    `mailto:contact@appstracta.app`,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// POST: Enviar notificación de prueba al usuario actual
export async function POST(request: Request) {
  const logs: string[] = [];
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "Falta userId", logs: ["ERROR: No se proporcionó userId"] },
        { status: 400 }
      );
    }

    logs.push(`[1/6] Iniciando prueba de notificación para usuario: ${userId}`);
    logs.push(`[2/6] VAPID Public Key: ${VAPID_PUBLIC_KEY ? "✓ Configurada" : "✗ NO configurada"}`);
    logs.push(`[2/6] VAPID Private Key: ${VAPID_PRIVATE_KEY ? "✓ Configurada" : "✗ NO configurada"}`);

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({
        error: "VAPID no configurado",
        logs,
        success: false
      });
    }

    // Obtener suscripción del usuario
    logs.push(`[3/6] Buscando suscripción push en BD...`);
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId }
    });

    if (!subscription) {
      logs.push(`[3/6] ✗ Usuario NO tiene suscripción push activa`);
      return NextResponse.json({
        error: "Usuario no tiene suscripción push",
        logs,
        success: false
      });
    }

    logs.push(`[3/6] ✓ Suscripción encontrada`);
    logs.push(`[3/6] Endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    logs.push(`[3/6] p256dh: ${subscription.p256dh.substring(0, 20)}...`);
    logs.push(`[3/6] auth: ${subscription.auth.substring(0, 10)}...`);

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
      title: "🔔 Notificación de Prueba",
      body: `Esta es una notificación de prueba - ${new Date().toLocaleTimeString()}`,
      url: "/",
      tag: `test-${Date.now()}`, // Tag único para no reemplazar
      requireInteraction: true,
    });

    logs.push(`[4/6] Enviando notificación push...`);
    logs.push(`[4/6] Payload: ${payload}`);

    const result = await webpush.sendNotification(pushSubscription, payload);
    logs.push(`[4/6] ✓ Notificación enviada correctamente`);
    logs.push(`[5/6] Resultado: ${JSON.stringify(result)}`);

    const elapsed = Date.now() - startTime;
    logs.push(`[6/6] ✓ Completado en ${elapsed}ms`);

    return NextResponse.json({
      success: true,
      logs,
      elapsed,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    const elapsed = Date.now() - startTime;
    logs.push(`[ERROR] ${error.message}`);
    logs.push(`[ERROR] StatusCode: ${error.statusCode}`);
    logs.push(`[ERROR] Headers: ${JSON.stringify(error.headers)}`);

    // Si es un error 410 (Gone), la suscripción ya no es válida
    if (error.statusCode === 410) {
      logs.push(`[ERROR] La suscripción ha expirado (410 Gone). El usuario debe volver a suscribirse.`);
      // Eliminar la suscripción inválida
      try {
        const { userId } = await request.json();
        if (userId) {
          await prisma.pushSubscription.delete({ where: { userId } });
          logs.push(`[ERROR] Suscripción eliminada de BD`);
        }
      } catch (e) {
        logs.push(`[ERROR] No se pudo eliminar la suscripción: ${e}`);
      }
    }

    return NextResponse.json({
      success: false,
      error: error.message,
      statusCode: error.statusCode,
      logs,
      elapsed
    });
  }
}

// GET: Verificar estado de notificaciones push
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  const info = {
    timestamp: new Date().toISOString(),
    vapid: {
      publicKey: VAPID_PUBLIC_KEY ? "✓ Configurada" : "✗ NO configurada",
      privateKey: VAPID_PRIVATE_KEY ? "✓ Configurada" : "✗ NO configurada",
    },
    subscription: null as any,
  };

  if (userId) {
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId }
    });

    if (subscription) {
      info.subscription = {
        found: true,
        endpoint: subscription.endpoint.substring(0, 50) + "...",
        createdAt: subscription.createdAt,
        updatedAt: subscription.updatedAt,
      };
    } else {
      info.subscription = {
        found: false,
        message: "Usuario no tiene suscripción push activa"
      };
    }
  }

  return NextResponse.json(info);
}
