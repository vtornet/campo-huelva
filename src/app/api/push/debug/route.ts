import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Diagnosticar estado de notificaciones push
export async function GET(request: Request) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    vapid: {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ? "Configurada" : "NO configurada",
      privateKey: process.env.VAPID_PRIVATE_KEY ? "Configurada" : "NO configurada",
      publicKeyValue: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20) + "...",
    },
    subscriptions: {
      total: 0,
      sampleSubscriptions: [] as any[],
    },
  };

  try {
    // Contar suscripciones
    const count = await prisma.pushSubscription.count();
    diagnostics.subscriptions.total = count;

    // Obtener algunas suscripciones de muestra (sin exponer datos sensibles)
    const samples = await prisma.pushSubscription.findMany({
      take: 5,
      select: {
        id: true,
        userId: true,
        endpoint: true,
        createdAt: true,
      }
    });
    diagnostics.subscriptions.sampleSubscriptions = samples.map(s => ({
      ...s,
      endpoint: s.endpoint.substring(0, 50) + "..."
    }));

    return NextResponse.json(diagnostics);
  } catch (error) {
    return NextResponse.json({
      ...diagnostics,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
