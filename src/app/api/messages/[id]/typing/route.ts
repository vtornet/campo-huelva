import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener usuarios que están escribiendo en esta conversación
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const currentUserId = searchParams.get("currentUserId");

  if (!currentUserId) {
    return NextResponse.json({ error: "Falta currentUserId" }, { status: 400 });
  }

  try {
    // Buscar indicadores de escritura activos (últimos 5 segundos)
    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const typingIndicators = await prisma.typingIndicator.findMany({
      where: {
        conversationId: id,
        createdAt: { gte: fiveSecondsAgo },
        userId: { not: currentUserId }
      }
    });

    // Si no hay indicadores, devolver lista vacía
    if (typingIndicators.length === 0) {
      return NextResponse.json({ typing: [] });
    }

    // Obtener nombres de los usuarios que están escribiendo
    const userIds = typingIndicators.map(t => t.userId);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: { select: { fullName: true } },
        foremanProfile: { select: { fullName: true } },
        companyProfile: { select: { companyName: true } }
      }
    });

    const typingNames = users.map(user => {
      if (user.workerProfile?.fullName) return user.workerProfile.fullName;
      if (user.foremanProfile?.fullName) return user.foremanProfile.fullName;
      if (user.companyProfile?.companyName) return user.companyProfile.companyName;
      return user.email.split("@")[0];
    });

    return NextResponse.json({
      typing: typingNames,
      typingUsers: users
    });

  } catch (error) {
    console.error("Error fetching typing indicators:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Registrar que el usuario está escribiendo
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    console.log("[Typing API] POST request - conversationId:", id, "userId:", userId);

    // Verificar que el usuario es participante de la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { participants: true }
    });

    if (!conversation) {
      console.log("[Typing API] Conversación no encontrada");
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      console.log("[Typing API] Usuario no es participante");
      return NextResponse.json({ error: "No eres participante de esta conversación" }, { status: 403 });
    }

    // Primero intentamos actualizar si existe
    const existing = await prisma.typingIndicator.findUnique({
      where: {
        conversationId_userId: {
          conversationId: id,
          userId: userId
        }
      }
    });

    if (existing) {
      // Actualizar el timestamp
      await prisma.typingIndicator.update({
        where: { id: existing.id },
        data: { createdAt: new Date() }
      });
      console.log("[Typing API] Actualizado indicador existente");
    } else {
      // Crear nuevo
      await prisma.typingIndicator.create({
        data: {
          conversationId: id,
          userId: userId
        }
      });
      console.log("[Typing API] Creado nuevo indicador");
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Typing API] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Eliminar indicador de escritura
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    await prisma.typingIndicator.deleteMany({
      where: {
        conversationId: id,
        userId: userId
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting typing indicator:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
