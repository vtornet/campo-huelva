import { NextResponse } from "next/server";
import { PrismaClient, PostType, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener el Feed (Soporta paginación, filtros y modo Oferta/Demanda)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const userId = searchParams.get("userId"); // Para obtener publicaciones de un usuario específico
  // Si se piden posts de un usuario específico, no limitamos (o usamos un límite mayor)
  const limit = userId ? 100 : 5;

  // Soportar múltiples valores para provincia y taskType (multiselección)
  const allProvinces = searchParams.getAll("province");
  const allTaskTypes = searchParams.getAll("taskType");

  const viewMode = searchParams.get("view"); // "OFFERS" o "DEMANDS"
  const currentUserId = searchParams.get("currentUserId"); // Usuario autenticado actual (para verificar sus likes)

  // Calculamos el offset para paginación
  const skip = (page - 1) * limit;

  // Construimos el filtro dinámico
  const where: any = {};

  // 1. Filtro por usuario (para ver sus propias publicaciones) - PRIORITARIO
  // Si se pide un userId, el usuario quiere ver TODAS sus publicaciones
  if (userId) {
    where.OR = [
      { publisherId: userId },
      { companyId: userId }
    ];
  } else {
    // 2. Filtro por Tipo (solo si NO estamos filtrando por userId)
    if (viewMode === "DEMANDS") {
      where.type = PostType.DEMAND;
      // Si se especifican taskTypes, filtramos por esos tipos
      if (allTaskTypes.length > 0 && !allTaskTypes.includes("todos") && !allTaskTypes.includes("")) {
        where.taskType = { in: allTaskTypes };
      }
    } else {
      // Si vemos ofertas, queremos las OFICIALES y las COMPARTIDAS
      where.type = { in: [PostType.OFFICIAL, PostType.SHARED] };
    }

    // 3. Filtro por Provincia (solo si NO estamos filtrando por userId)
    if (allProvinces.length > 0 && !allProvinces.includes("todas") && !allProvinces.includes("")) {
      where.province = { in: allProvinces };
    }
  }

  // 4. Solo mostrar posts activos (no ocultos ni eliminados)
  // Nota: Comentado temporalmente hasta que se migre la BD correctamente
  // where.status = "ACTIVE";

  try {
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        province: true,
        type: true,
        status: true,
        taskType: true,
        contractType: true,
        providesAccommodation: true,
        salaryAmount: true,
        salaryPeriod: true,
        hoursPerWeek: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        publisherId: true,
        companyId: true,
        likesCount: true,
        sharesCount: true,
        _count: {
          select: {
            applications: true
          }
        },
        company: {
          select: {
            id: true,
            companyName: true,
            profileImage: true,
            isApproved: true,
            user: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          }
        },
        publisher: {
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
                crewSize: true,
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

    // Si hay un usuario autenticado, verificamos sus likes para cada post
    // Y añadir el conteo de aplicaciones para cada post
    let postsWithLikedInfo = posts;

    if (currentUserId) {
      // Obtener todos los likes del usuario actual
      const userLikes = await prisma.like.findMany({
        where: {
          userId: currentUserId,
          postId: { in: posts.map(p => p.id) }
        },
        select: { postId: true }
      });

      const likedPostIds = new Set(userLikes.map(l => l.postId));

      // Añadir propiedad 'liked' a cada post
      postsWithLikedInfo = posts.map(post => ({
        ...post,
        liked: likedPostIds.has(post.id)
      }));
    }

    return NextResponse.json(postsWithLikedInfo);
  } catch (error) {
    console.error("Error cargando feed:", error);
    return NextResponse.json({ error: "Error al cargar publicaciones" }, { status: 500 });
  }
}

// POST: Crear nueva publicación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      location,
      province,
      type,
      uid,
      taskType,
      // Campos adicionales para ofertas de empleo
      contractType,
      providesAccommodation,
      salaryAmount,
      salaryPeriod,
      hoursPerWeek,
      startDate,
      endDate
    } = body;

    // Validación básica
    if (!title || !province || !uid || !type) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    // Para ofertas (no demandas), validar campos adicionales
    const isDemand = type === "DEMAND";
    if (!isDemand) {
      // Para ofertas, estos campos son obligatorios
      if (!contractType) {
        return NextResponse.json({ error: "El tipo de contrato es obligatorio para ofertas" }, { status: 400 });
      }
      if (!salaryAmount) {
        return NextResponse.json({ error: "El salario es obligatorio para ofertas" }, { status: 400 });
      }
      if (!salaryPeriod) {
        return NextResponse.json({ error: "El periodo de salario es obligatorio para ofertas" }, { status: 400 });
      }
      if (!hoursPerWeek) {
        return NextResponse.json({ error: "Las horas semanales son obligatorias para ofertas" }, { status: 400 });
      }
    }

    // 1. Identificar al Autor para vincularlo correctamente
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { companyProfile: true } // Necesitamos saber si tiene perfil de empresa
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Verificar que el usuario no esté baneado o silenciado
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

    // 2.1. Si es empresa, verificar que esté aprobada para publicar ofertas OFICIALES
    if (user.role === Role.COMPANY && type === "OFFICIAL") {
      if (!user.companyProfile?.isApproved) {
        return NextResponse.json({
          error: "Tu empresa debe estar aprobada por un administrador para publicar ofertas oficiales. Contacta con soporte para solicitar la aprobación."
        }, { status: 403 });
      }
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

    // 2. Preparar datos para Prisma
    let postData: any = {
      title,
      description,
      location,
      province,
      taskType: taskType || null, // Tipo de tarea para demandas
      // Convertimos el string que llega del front al Enum de Prisma
      type: type as PostType,
    };

    // Añadir campos específicos para ofertas de empleo
    if (!isDemand) {
      postData.contractType = contractType || null;
      postData.providesAccommodation = providesAccommodation || false;
      postData.salaryAmount = salaryAmount || null;
      postData.salaryPeriod = salaryPeriod || null;
      postData.hoursPerWeek = hoursPerWeek ? parseInt(hoursPerWeek) : null;
      postData.startDate = startDate || null;
      postData.endDate = endDate || null;
    }

    // 3. Vinculación Inteligente según el ROL
    if (user.role === Role.COMPANY) {
      // Si es empresa, forzamos tipo OFICIAL y vinculamos companyId
      postData.type = PostType.OFFICIAL;
      postData.companyId = user.companyProfile?.id;
      // También guardamos publisherId por trazabilidad, aunque sea opcional
      postData.publisherId = user.id;
    } else {
      // Si es Trabajador/Manijero, respetamos el tipo que envía el frontend (DEMAND o SHARED)
      // Ya se asignó arriba: type: type as PostType
      postData.publisherId = user.id;
    }

    // 4. Guardar en Base de Datos
    const newPost = await prisma.post.create({
      data: postData
    });

    return NextResponse.json(newPost);

  } catch (error) {
    console.error("Error creando post:", error);
    return NextResponse.json({ error: "Error interno al publicar" }, { status: 500 });
  }
}