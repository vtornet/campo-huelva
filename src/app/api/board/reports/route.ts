import { NextResponse } from "next/server";
import { PrismaClient, BoardReportType } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// POST: Crear una denuncia
export async function POST(request: Request) {
  try {
    const uid = await authenticateRequest(request);

    const body = await request.json();
    const { type, postId, commentId, reason, description } = body;

    // Validación básica
    if (!type || !reason) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    if (!["POST", "COMMENT"].includes(type)) {
      return NextResponse.json({ error: "Tipo de denuncia inválido" }, { status: 400 });
    }

    // Verificar que el post o comentario existe
    if (type === "POST" && postId) {
      const post = await prisma.boardPost.findUnique({
        where: { id: postId }
      });
      if (!post) {
        return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
      }
    }

    if (type === "COMMENT" && commentId) {
      const comment = await prisma.boardComment.findUnique({
        where: { id: commentId }
      });
      if (!comment) {
        return NextResponse.json({ error: "Comentario no encontrado" }, { status: 404 });
      }
    }

    // Crear la denuncia
    const newReport = await prisma.boardReport.create({
      data: {
        type: type as BoardReportType,
        reporterId: uid,
        reportedPostId: postId || null,
        reportedCommentId: commentId || null,
        reason,
        description: description || null
      }
    });

    return NextResponse.json(newReport);

  } catch (error: any) {
    console.error("Error creando denuncia:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al crear denuncia" }, { status: 500 });
  }
}
