import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { notifyNewContact } from "@/lib/notifications";

const prisma = new PrismaClient();

// GET: Obtener todas las conversaciones del usuario
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    // Buscar conversaciones donde el usuario es participante
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                workerProfile: {
                  select: {
                    fullName: true,
                    city: true,
                    province: true
                  }
                },
                foremanProfile: {
                  select: {
                    fullName: true,
                    city: true,
                    province: true,
                    crewSize: true
                  }
                },
                companyProfile: {
                  select: {
                    companyName: true,
                    city: true,
                    province: true
                  }
                }
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1 // Solo el último mensaje para preview
        },
        relatedPost: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Formatear respuesta
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.user.id !== userId);
      const lastMessage = conv.messages[0];
      const unreadCount = conv.participants.find(p => p.userId === userId)?.lastReadAt
        ? conv.messages.filter(m =>
            m.senderId !== userId &&
            m.createdAt > (conv.participants.find(p => p.userId === userId)?.lastReadAt || new Date(0))
          ).length
        : conv.messages.filter(m => m.senderId !== userId).length;

      return {
        id: conv.id,
        otherUser: otherParticipant?.user || null,
        lastMessage: lastMessage || null,
        unreadCount: unreadCount || 0,
        updatedAt: conv.updatedAt,
        relatedPost: conv.relatedPost
      };
    });

    return NextResponse.json(formattedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Crear nueva conversación o enviar mensaje a existente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { senderId, receiverId, content, postId } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json({ error: "No puedes enviarte mensajes a ti mismo" }, { status: 400 });
    }

    // Buscar si ya existe una conversación entre estos dos usuarios
    // IMPORTANTE: Buscamos cualquier conversación entre ambos, independientemente de relatedPostId
    // para no crear múltiples chats con la misma persona
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [senderId, receiverId]
            }
          }
        }
        // NO filtramos por relatedPostId aquí - queremos reutilizar la conversación existente
      },
      include: {
        participants: true
      },
      orderBy: {
        updatedAt: "desc" // Obtener la más reciente si hay varias
      }
    });

    // Si no existe, crear nueva conversación
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          relatedPostId: postId,
          participants: {
            create: [
              { userId: senderId },
              { userId: receiverId }
            ]
          }
        },
        include: {
          participants: true
        }
      });
    }

    // Crear el mensaje
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content
      }
    });

    // Actualizar timestamp de conversación
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() }
    });

    // Verificar si es el primer mensaje en esta conversación
    // Si la conversación se acaba de crear (createdAt == updatedAt), es el primer mensaje
    const isFirstMessage = conversation.createdAt.getTime() === conversation.updatedAt.getTime();
    if (!isFirstMessage) {
      // Obtener nombre del remitente para la notificación
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        include: {
          workerProfile: { select: { fullName: true } },
          foremanProfile: { select: { fullName: true } },
          companyProfile: { select: { companyName: true } }
        }
      });

      if (sender) {
        const senderName = sender.workerProfile?.fullName ||
                          sender.foremanProfile?.fullName ||
                          sender.companyProfile?.companyName ||
                          sender.email?.split("@")[0] ||
                          "Alguien";

        // Obtener título del post si existe
        let postTitle = "";
        if (postId) {
          const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { title: true }
          });
          postTitle = post?.title || "";
        }

        await notifyNewContact(receiverId, senderName, postId, postTitle, conversation.id);
      }
    }

    return NextResponse.json({
      conversationId: conversation.id,
      message,
      isNewConversation: isFirstMessage
    });

  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
