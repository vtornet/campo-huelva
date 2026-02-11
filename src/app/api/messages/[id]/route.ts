import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener mensajes de una conversación
export async function GET(
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
    // Verificar que el usuario es participante de la conversación
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: true
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversación no encontrada" }, { status: 404 });
    }

    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      return NextResponse.json({ error: "No tienes acceso a esta conversación" }, { status: 403 });
    }

    // Marcar mensajes como leídos
    await prisma.conversationParticipant.updateMany({
      where: {
        conversationId: id,
        userId: userId
      },
      data: {
        lastReadAt: new Date()
      }
    });

    // Marcar mensajes recibidos como leídos
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Obtener mensajes
    const messages = await prisma.message.findMany({
      where: {
        conversationId: id
      },
      orderBy: {
        createdAt: "asc"
      },
      take: 100 // Limitar a últimos 100 mensajes
    });

    // Obtener info de otros participantes
    const otherParticipants = conversation.participants
      .filter(p => p.userId !== userId)
      .map(p => p.userId);

    return NextResponse.json({
      messages,
      otherParticipants,
      relatedPostId: conversation.relatedPostId
    });

  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE: Eliminar conversación (salirse de ella)
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
    // Eliminar participante de la conversación
    await prisma.conversationParticipant.deleteMany({
      where: {
        conversationId: id,
        userId: userId
      }
    });

    // Si no quedan participantes, eliminar conversación y mensajes
    const remainingParticipants = await prisma.conversationParticipant.count({
      where: { conversationId: id }
    });

    if (remainingParticipants === 0) {
      await prisma.conversation.delete({
        where: { id }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
