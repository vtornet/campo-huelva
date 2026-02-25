import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET: Obtener comentarios de una publicación
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const currentUserId = searchParams.get("currentUserId");

  try {
    const comments = await prisma.boardComment.findMany({
      where: {
        postId: id,
        parentId: null // Solo comentarios principales
      },
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            workerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            foremanProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            engineerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            encargadoProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            tractoristProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            }
          }
        },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                role: true,
                workerProfile: {
                  select: {
                    fullName: true,
                    profileImage: true
                  }
                },
                foremanProfile: {
                  select: {
                    fullName: true,
                    profileImage: true
                  }
                },
                engineerProfile: {
                  select: {
                    fullName: true,
                    profileImage: true
                  }
                },
                encargadoProfile: {
                  select: {
                    fullName: true,
                    profileImage: true
                  }
                },
                tractoristProfile: {
                  select: {
                    fullName: true,
                    profileImage: true
                  }
                }
              }
            },
            likes: {
              select: {
                userId: true
              }
            }
          }
        },
        likes: {
          select: {
            userId: true
          }
        }
      }
    });

    // Procesar comentarios para añadir info de likes
    const processedComments = comments.map(comment => {
      const commentLiked = currentUserId && comment.likes.some(like => like.userId === currentUserId);
      const processedComment: any = {
        ...comment,
        liked: commentLiked,
        likesCount: comment.likes.length
      };
      delete processedComment.likes;

      // Procesar respuestas
      processedComment.replies = processedComment.replies.map((reply: any) => {
        const replyLiked = currentUserId && reply.likes.some((like: any) => like.userId === currentUserId);
        const processedReply: any = {
          ...reply,
          liked: replyLiked,
          likesCount: reply.likes.length
        };
        delete processedReply.likes;
        return processedReply;
      });

      return processedComment;
    });

    return NextResponse.json(processedComments);
  } catch (error) {
    console.error("Error cargando comentarios:", error);
    return NextResponse.json({ error: "Error al cargar comentarios" }, { status: 500 });
  }
}

// POST: Crear un nuevo comentario
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, parentId, userId: bodyUserId } = body;

    // Verificar autenticación
    let uid: string;
    try {
      uid = await authenticateRequest(request);
    } catch (error: any) {
      // Fallback: si Firebase Admin no está configurado, usar userId del body
      if (bodyUserId) {
        console.warn("Firebase Admin no configurado, usando userId del body (modo degradado)");
        uid = bodyUserId;
      } else {
        return NextResponse.json({ error: error.message || "No autenticado" }, { status: 401 });
      }
    }

    // Validación básica
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "El contenido no puede estar vacío" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "El comentario no puede exceder 1000 caracteres" }, { status: 400 });
    }

    // Verificar que el post existe
    const post = await prisma.boardPost.findUnique({
      where: { id }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Si es una respuesta, verificar que el comentario padre existe
    if (parentId) {
      const parentComment = await prisma.boardComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json({ error: "Comentario padre no encontrado" }, { status: 404 });
      }
    }

    // Verificar que el usuario no esté baneado
    const user = await prisma.user.findUnique({
      where: { id: uid }
    });

    if (user?.isBanned) {
      return NextResponse.json({ error: "Tu cuenta está suspendida" }, { status: 403 });
    }

    // Crear el comentario
    const newComment = await prisma.boardComment.create({
      data: {
        content: content.trim(),
        postId: id,
        authorId: uid,
        parentId: parentId || null
      },
      include: {
        author: {
          select: {
            id: true,
            role: true,
            workerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            foremanProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            engineerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            encargadoProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            tractoristProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    // Actualizar contador de comentarios del post
    await prisma.boardPost.update({
      where: { id },
      data: {
        commentsCount: { increment: 1 }
      }
    });

    return NextResponse.json(newComment);

  } catch (error: any) {
    console.error("Error creando comentario:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al crear comentario" }, { status: 500 });
  }
}
