import { NextResponse } from "next/server";
import { PrismaClient, ContactStatus } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Buscar conversación existente o crear nueva (sin enviar mensaje)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId1, userId2 } = body;

    if (!userId1 || !userId2) {
      return NextResponse.json({ error: "Faltan IDs de usuarios" }, { status: 400 });
    }

    if (userId1 === userId2) {
      return NextResponse.json({ error: "Los IDs deben ser diferentes" }, { status: 400 });
    }

    // Verificar que son contactos aceptados (sin excepción para empresas)
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { requesterId: userId1, recipientId: userId2, status: ContactStatus.ACCEPTED },
          { requesterId: userId2, recipientId: userId1, status: ContactStatus.ACCEPTED }
        ]
      }
    });

    if (!contact) {
      return NextResponse.json({
        error: "Para enviar mensajes, primero debes añadir a esta persona como contacto",
        errorCode: "NOT_CONTACT"
      }, { status: 403 });
    }

    // Buscar si ya existe una conversación entre estos dos usuarios
    let conversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [userId1, userId2]
            }
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                role: true,
                workerProfile: { select: { fullName: true, profileImage: true } },
                foremanProfile: { select: { fullName: true, profileImage: true } },
                engineerProfile: { select: { fullName: true, profileImage: true } },
                encargadoProfile: { select: { fullName: true, profileImage: true } },
                tractoristProfile: { select: { fullName: true, profileImage: true } },
                companyProfile: { select: { companyName: true, profileImage: true } },
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: "desc"
      }
    });

    // Si no existe, crear nueva conversación (sin mensaje)
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: userId1 },
              { userId: userId2 }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  role: true,
                  workerProfile: { select: { fullName: true, profileImage: true } },
                  foremanProfile: { select: { fullName: true, profileImage: true } },
                  engineerProfile: { select: { fullName: true, profileImage: true } },
                  encargadoProfile: { select: { fullName: true, profileImage: true } },
                  tractoristProfile: { select: { fullName: true, profileImage: true } },
                  companyProfile: { select: { companyName: true, profileImage: true } },
                }
              }
            }
          }
        }
      });
    }

    return NextResponse.json({
      conversationId: conversation.id,
      isNewConversation: !conversation || conversation.createdAt.getTime() === conversation.updatedAt.getTime()
    });

  } catch (error) {
    console.error("Error finding/creating conversation:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
