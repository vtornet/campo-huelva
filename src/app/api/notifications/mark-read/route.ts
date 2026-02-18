import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Marcar notificaciones como leídas
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, notificationIds, markAll } = body;

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    if (markAll) {
      // Marcar todas las notificaciones del usuario como leídas
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Marcar notificaciones específicas como leídas
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId // Seguridad: solo puede marcar sus propias notificaciones
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
