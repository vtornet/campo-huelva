import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener notificaciones del usuario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        relatedPost: {
          select: {
            id: true,
            title: true,
            type: true,
            province: true,
            location: true
          }
        },
        relatedUser: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: {
              select: { fullName: true }
            },
            foremanProfile: {
              select: { fullName: true }
            },
            companyProfile: {
              select: { companyName: true }
            }
          }
        }
      }
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear nueva notificación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, title, message, link, relatedPostId, relatedUserId } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        relatedPostId,
        relatedUserId
      }
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
