import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET: Obtener una publicación del tablón por ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Obtener UID del usuario (si está autenticado)
    let userId: string | null = null;
    try {
      userId = await authenticateRequest(request);
    } catch {
      // Usuario no autenticado - continuar sin verificar likes
    }

    // Buscar la publicación con todos los datos necesarios
    const post = await prisma.boardPost.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            workerProfile: {
              select: { id: true, fullName: true, city: true, province: true, profileImage: true }
            },
            foremanProfile: {
              select: { id: true, fullName: true, city: true, province: true, profileImage: true }
            },
            engineerProfile: {
              select: { id: true, fullName: true, city: true, province: true, profileImage: true }
            },
            encargadoProfile: {
              select: { id: true, fullName: true, city: true, province: true, profileImage: true }
            },
            tractoristProfile: {
              select: { id: true, fullName: true, city: true, province: true, profileImage: true }
            },
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Publicación no encontrada" },
        { status: 404 }
      );
    }

    // Contar likes y comentarios
    const likesCount = await prisma.boardPostLike.count({
      where: { postId: id }
    });

    const commentsCount = await prisma.boardComment.count({
      where: { postId: id, parentId: null }
    });

    // Verificar si el usuario actual dio like
    let liked = false;
    if (userId) {
      const existingLike = await prisma.boardPostLike.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: userId
          }
        }
      });
      liked = !!existingLike;
    }

    // Formatear respuesta
    const response = {
      id: post.id,
      content: post.content,
      createdAt: post.createdAt,
      likesCount,
      commentsCount,
      liked,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        role: post.author.role,
        workerProfile: post.author.workerProfile,
        foremanProfile: post.author.foremanProfile,
        engineerProfile: post.author.engineerProfile,
        encargadoProfile: post.author.encargadoProfile,
        tractoristProfile: post.author.tractoristProfile,
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching board post:", error);
    return NextResponse.json(
      { error: "Error al cargar la publicación" },
      { status: 500 }
    );
  }
}

// PUT: Editar una publicación del tablón
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "El contenido no puede estar vacío" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "El contenido no puede exceder 2000 caracteres" },
        { status: 400 }
      );
    }

    // Buscar la publicación
    const post = await prisma.boardPost.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Publicación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el autor
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para editar esta publicación" },
        { status: 403 }
      );
    }

    // Actualizar la publicación
    const updatedPost = await prisma.boardPost.update({
      where: { id },
      data: { content: content.trim() }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("Error editando publicación del tablón:", error);
    return NextResponse.json(
      { error: "Error al editar la publicación" },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una publicación del tablón
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verificar autenticación
    let userId: string;
    try {
      userId = await authenticateRequest(request);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || "No autenticado" },
        { status: 401 }
      );
    }

    // Buscar la publicación
    const post = await prisma.boardPost.findUnique({
      where: { id },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json(
        { error: "Publicación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el autor
    if (post.authorId !== userId) {
      return NextResponse.json(
        { error: "No tienes permiso para eliminar esta publicación" },
        { status: 403 }
      );
    }

    // Eliminar la publicación (en cascada se eliminarán likes y comentarios)
    await prisma.boardPost.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: "Publicación eliminada" });
  } catch (error) {
    console.error("Error eliminando publicación del tablón:", error);
    return NextResponse.json(
      { error: "Error al eliminar la publicación" },
      { status: 500 }
    );
  }
}
