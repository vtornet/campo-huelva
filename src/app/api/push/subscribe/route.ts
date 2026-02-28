import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.warn("VAPID keys no configuradas. Las notificaciones push no funcionarán.");
}

// POST: Suscribir usuario a notificaciones push
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: "Faltan datos de suscripción o userId" },
        { status: 400 }
      );
    }

    // Guardar o actualizar suscripción
    const existing = await prisma.pushSubscription.findFirst({
      where: { userId }
    });

    if (existing) {
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error suscribiendo a notificaciones:", error);
    return NextResponse.json(
      { error: "Error al suscribir" },
      { status: 500 }
    );
  }
}

// GET: Obtener VAPID public key para Web Push
export async function GET() {
  if (!VAPID_PUBLIC_KEY) {
    return NextResponse.json(
      { error: "VAPID no configurado" },
      { status: 501 }
    );
  }

  return NextResponse.json({ key: VAPID_PUBLIC_KEY });
}
