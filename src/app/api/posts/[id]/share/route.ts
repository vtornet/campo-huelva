// src/app/api/posts/[id]/share/route.ts
// API para gestionar shares (compartidos) de publicaciones

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Compartir una publicación
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

    // Verificar si el usuario ya compartió
    const existingShare = await prisma.share.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId
        }
      }
    });

    if (existingShare) {
      return NextResponse.json({
        shared: false,
        message: "Ya compartiste esta publicación",
        sharesCount: post.sharesCount
      });
    }

    // Crear share
    await prisma.share.create({
      data: {
        postId: id,
        userId: userId
      }
    });

    // Actualizar contador
    const updatedPost = await prisma.post.update({
      where: { id },
      data: { sharesCount: { increment: 1 } }
    });

    // Crear notificación al autor (si no es el mismo usuario)
    const authorId = post.publisherId || post.company?.user?.id;
    if (authorId && authorId !== userId) {
      // Obtener nombre del usuario que compartió
      const sharer = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          workerProfile: { select: { fullName: true } },
          foremanProfile: { select: { fullName: true } },
          engineerProfile: { select: { fullName: true } }
        }
      });

      const sharerName = sharer?.workerProfile?.fullName ||
                         sharer?.foremanProfile?.fullName ||
                         sharer?.engineerProfile?.fullName ||
                         "Alguien";

      await prisma.notification.create({
        data: {
          userId: authorId,
          type: "POST_SHARE",
          title: "Han compartido tu publicación",
          message: `${sharerName} ha compartido tu publicación: "${post.title}"`,
          link: `/offer/${id}`,
          relatedPostId: id
        }
      });
    }

    return NextResponse.json({
      shared: true,
      sharesCount: updatedPost.sharesCount
    });
  } catch (error) {
    console.error("Error compartiendo publicación:", error);
    return NextResponse.json({ error: "Error al compartir publicación" }, { status: 500 });
  }
}
