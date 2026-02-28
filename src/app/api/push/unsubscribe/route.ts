import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Desuscribir usuario de notificaciones push
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: "Faltan datos de suscripción" },
        { status: 400 }
      );
    }

    // Eliminar suscripción por endpoint
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint: subscription.endpoint
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error desuscribiendo:", error);
    return NextResponse.json(
      { error: "Error al desuscribir" },
      { status: 500 }
    );
  }
}
