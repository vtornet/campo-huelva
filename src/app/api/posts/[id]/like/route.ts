// src/app/api/posts/[id]/like/route.ts
// API para gestionar likes de publicaciones

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Dar o quitar like a una publicación
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // Verificar que la publicación existe
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        publisher: { select: { id: true } },
        company: { select: { user: { select: { id: true } } } }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Verificar si el usuario ya dio like
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId
        }
      }
    });

    if (existingLike) {
      // Quitar like
      await prisma.like.delete({
        where: { id: existingLike.id }
      });

      // Actualizar contador
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { likesCount: { decrement: 1 } }
      });

      return NextResponse.json({
        liked: false,
        likesCount: Math.max(0, updatedPost.likesCount)
      });
    } else {
      // Dar like
      await prisma.like.create({
        data: {
          postId: id,
          userId: userId
        }
      });

      // Actualizar contador
      const updatedPost = await prisma.post.update({
        where: { id },
        data: { likesCount: { increment: 1 } }
      });

      // Crear notificación al autor (si no es el mismo usuario)
      const authorId = post.publisherId || post.company?.user?.id;
      if (authorId && authorId !== userId) {
        // Obtener nombre del usuario que dio like
        const liker = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
            engineerProfile: { select: { fullName: true } }
          }
        });

        const likerName = liker?.workerProfile?.fullName ||
                          liker?.foremanProfile?.fullName ||
                          liker?.engineerProfile?.fullName ||
                          "Alguien";

        await prisma.notification.create({
          data: {
            userId: authorId,
            type: "POST_LIKE",
            title: "Nuevo like en tu publicación",
            message: `A ${likerName} le gustó tu publicación: "${post.title}"`,
            link: `/offer/${id}`,
            relatedPostId: id
          }
        });
      }

      return NextResponse.json({
        liked: true,
        likesCount: updatedPost.likesCount
      });
    }
  } catch (error) {
    console.error("Error gestionando like:", error);
    return NextResponse.json({ error: "Error al procesar like" }, { status: 500 });
  }
}

// GET: Obtener likes de una publicación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const likes = await prisma.like.findMany({
      where: { postId: id },
      include: {
        user: {
          select: {
            id: true,
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
            engineerProfile: { select: { fullName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({
      count: likes.length,
      likes: likes.map(l => ({
        id: l.id,
        userId: l.userId,
        userName: l.user.workerProfile?.fullName || l.user.foremanProfile?.fullName || l.user.engineerProfile?.fullName || "Usuario"
      }))
    });
  } catch (error) {
    console.error("Error obteniendo likes:", error);
    return NextResponse.json({ error: "Error al obtener likes" }, { status: 500 });
  }
}
