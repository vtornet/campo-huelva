import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// POST: Dar like a un comentario
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = await authenticateRequest(request);

    // Verificar que el comentario existe
    const comment = await prisma.boardComment.findUnique({
      where: { id: id }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Verificar si ya existe el like
    const existingLike = await prisma.boardCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: uid
        }
      }
    });

    if (existingLike) {
      // Ya existe, lo quitamos (toggle)
      await prisma.boardCommentLike.delete({
        where: {
          commentId_userId: {
            commentId: id,
            userId: uid
          }
        }
      });

      // Actualizar contador
      await prisma.boardComment.update({
        where: { id: id },
        data: {
          likesCount: { decrement: 1 }
        }
      });

      return NextResponse.json({ liked: false, likesCount: Math.max(0, comment.likesCount - 1) });
    }

    // Crear el like
    await prisma.boardCommentLike.create({
      data: {
        commentId: id,
        userId: uid
      }
    });

    // Actualizar contador
    await prisma.boardComment.update({
      where: { id: id },
      data: {
        likesCount: { increment: 1 }
      }
    });

    return NextResponse.json({ liked: true, likesCount: comment.likesCount + 1 });

  } catch (error: any) {
    console.error("Error en like de comentario:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al procesar like" }, { status: 500 });
  }
}

// DELETE: Eliminar un comentario (solo el autor o admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const uid = await authenticateRequest(request);

    const comment = await prisma.boardComment.findUnique({
      where: { id: id },
      select: { authorId: true, postId: true }
    });

    if (!comment) {
      return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es el autor o un admin
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (comment.authorId !== uid && user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No tienes permiso para eliminar este comentario" }, { status: 403 });
    }

    // Eliminar el comentario (las respuestas se eliminan en cascada por el schema)
    await prisma.boardComment.delete({
      where: { id: id }
    });

    // Actualizar contador de comentarios del post
    await prisma.boardPost.update({
      where: { id: comment.postId },
      data: {
        commentsCount: { decrement: 1 }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error eliminando comentario:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al eliminar comentario" }, { status: 500 });
  }
}
