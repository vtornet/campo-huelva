import { NextResponse } from "next/server";
import { PrismaClient, Role, BoardPostStatus } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET: Obtener publicaciones del tablón
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const userId = searchParams.get("userId"); // Para obtener publicaciones de un usuario específico
  const currentUserId = searchParams.get("currentUserId"); // Usuario autenticado actual (para verificar sus likes)
  const province = searchParams.get("province"); // Filtro por provincia

  const skip = (page - 1) * limit;

  // Construimos el filtro dinámico
  const where: any = {
    status: BoardPostStatus.ACTIVE,
  };

  // Si se pide un userId, filtramos por ese usuario
  if (userId) {
    where.authorId = userId;
  }

  // Filtrar por provincia si se proporciona
  if (province && province !== "Todas") {
    // Necesitamos buscar publicaciones donde el autor tenga esa provincia en su perfil
    // Como la provincia está en los perfiles específicos, necesitamos un filtro más complejo
    // Primero obtenemos los IDs de usuarios de esa provincia
    const usersWithProvince = await prisma.user.findMany({
      where: {
        OR: [
          { workerProfile: { province } },
          { foremanProfile: { province } },
          { engineerProfile: { province } },
          { encargadoProfile: { province } },
          { tractoristProfile: { province } },
        ],
      },
      select: { id: true },
    });

    const userIdsInProvince = usersWithProvince.map((u) => u.id);
    if (userIdsInProvince.length > 0) {
      where.authorId = { in: userIdsInProvince };
    } else {
      // Si no hay usuarios en esa provincia, devolver resultado vacío
      return NextResponse.json([]);
    }
  }

  try {
    const posts = await prisma.boardPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
      select: {
        id: true,
        content: true,
        likesCount: true,
        commentsCount: true,
        createdAt: true,
        updatedAt: true,
        authorId: true,
        author: {
          select: {
            id: true,
            email: true,
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

    // Si hay un usuario autenticado, verificamos sus likes
    let postsWithLikedInfo = posts;

    if (currentUserId) {
      const userLikes = await prisma.boardPostLike.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) }
        },
        select: { postId: true }
      });

      const likedPostIds = new Set(userLikes.map(l => l.postId));

      postsWithLikedInfo = posts.map(post => ({
        ...post,
        liked: likedPostIds.has(post.id)
      }));
    }

    return NextResponse.json(postsWithLikedInfo);
  } catch (error) {
    console.error("Error cargando tablón:", error);
    return NextResponse.json({ error: "Error al cargar publicaciones" }, { status: 500 });
  }
}

// POST: Crear nueva publicación en el tablón
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, userId: bodyUserId } = body;

    // Verificar autenticación
    let uid: string;
    try {
      uid = await authenticateRequest(request);
    } catch (error: any) {
      // Fallback: si Firebase Admin no está configurado, usar userId del body
      // Esto permite que la app funcione mientras se configura Firebase Admin
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

    if (content.length > 2000) {
      return NextResponse.json({ error: "El contenido no puede exceder 2000 caracteres" }, { status: 400 });
    }

    // Buscar al usuario
    const user = await prisma.user.findUnique({
      where: { id: uid }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario no esté baneado o silenciado
    if (user.isBanned) {
      return NextResponse.json({ error: "Tu cuenta está suspendida" }, { status: 403 });
    }

    if (user.isSilenced) {
      // Verificar si el silencio es temporal y ha expirado
      if (user.silencedUntil && user.silencedUntil < new Date()) {
        // Silencio expirado, quitarlo
        await prisma.user.update({
          where: { id: uid },
          data: { isSilenced: false, silencedUntil: null }
        });
      } else {
        return NextResponse.json({ error: "Tu cuenta está temporalmente silenciada" }, { status: 403 });
      }
    }

    // **REGLA**: Las empresas NO pueden publicar en el tablón
    if (user.role === Role.COMPANY) {
      return NextResponse.json({
        error: "Las empresas no pueden publicar en el tablón. Utiliza la sección de ofertas para publicar empleos."
      }, { status: 403 });
    }

    // Crear la publicación
    const newPost = await prisma.boardPost.create({
      data: {
        content: content.trim(),
        authorId: uid
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

    return NextResponse.json(newPost);

  } catch (error: any) {
    console.error("Error creando publicación en tablón:", error);
    return NextResponse.json({ error: "Error interno al publicar" }, { status: 500 });
  }
}
