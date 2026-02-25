import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// POST: Dar like a una publicación
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = await authenticateRequest(request);

    // Verificar que la publicación existe
    const post = await prisma.boardPost.findUnique({
      where: { id: id }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Verificar si ya existe el like
    const existingLike = await prisma.boardPostLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: uid
        }
      }
    });

    if (existingLike) {
      // Ya existe, lo quitamos (toggle)
      await prisma.boardPostLike.delete({
        where: {
          postId_userId: {
            postId: id,
            userId: uid
          }
        }
      });

      // Actualizar contador
      await prisma.boardPost.update({
        where: { id: id },
        data: {
          likesCount: { decrement: 1 }
        }
      });

      return NextResponse.json({ liked: false, likesCount: Math.max(0, post.likesCount - 1) });
    }

    // Crear el like
    await prisma.boardPostLike.create({
      data: {
        postId: id,
        userId: uid
      }
    });

    // Actualizar contador
    await prisma.boardPost.update({
      where: { id: id },
      data: {
        likesCount: { increment: 1 }
      }
    });

    return NextResponse.json({ liked: true, likesCount: post.likesCount + 1 });

  } catch (error: any) {
    console.error("Error en like:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al procesar like" }, { status: 500 });
  }
}
