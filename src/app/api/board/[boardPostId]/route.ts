import { NextResponse } from "next/server";
import { PrismaClient, BoardPostStatus, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET: Obtener una publicación específica con sus comentarios
export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardPostId: string }> }
) {
  const { boardPostId } = await params;
  const { searchParams } = new URL(request.url);
  const currentUserId = searchParams.get("currentUserId");

  try {
    const post = await prisma.boardPost.findUnique({
      where: { id: boardPostId },
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
        comments: {
          where: {
            parentId: null // Solo comentarios principales, las respuestas se cargan anidadas
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
        },
        likes: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Añadir información de likes del usuario actual
    let postData: any = { ...post };

    if (currentUserId) {
      const userLiked = post.likes.some(like => like.userId === currentUserId);
      postData = {
        ...postData,
        liked: userLiked
      };
    }

    // Procesar comentarios para añadir info de likes
    postData.comments = postData.comments.map((comment: any) => {
      const commentLiked = currentUserId && comment.likes.some((like: any) => like.userId === currentUserId);
      const processedComment = {
        ...comment,
        liked: commentLiked,
        likesCount: comment.likes.length
      };
      delete processedComment.likes;

      // Procesar respuestas
      processedComment.replies = processedComment.replies.map((reply: any) => {
        const replyLiked = currentUserId && reply.likes.some((like: any) => like.userId === currentUserId);
        const processedReply = {
          ...reply,
          liked: replyLiked,
          likesCount: reply.likes.length
        };
        delete processedReply.likes;
        return processedReply;
      });

      return processedComment;
    });

    return NextResponse.json(postData);
  } catch (error) {
    console.error("Error cargando publicación:", error);
    return NextResponse.json({ error: "Error al cargar publicación" }, { status: 500 });
  }
}

// DELETE: Eliminar una publicación (solo el autor o admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardPostId: string }> }
) {
  try {
    const { boardPostId } = await params;
    const uid = await authenticateRequest(request);

    const post = await prisma.boardPost.findUnique({
      where: { id: boardPostId },
      select: { authorId: true }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Verificar que el usuario es el autor o un admin
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { role: true }
    });

    if (post.authorId !== uid && user?.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No tienes permiso para eliminar esta publicación" }, { status: 403 });
    }

    // Marcar como eliminada
    await prisma.boardPost.update({
      where: { id: boardPostId },
      data: { status: BoardPostStatus.REMOVED }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error eliminando publicación:", error);
    if (error.message.includes("No autenticado") || error.message.includes("Token")) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al eliminar publicación" }, { status: 500 });
  }
}
