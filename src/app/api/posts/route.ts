import { NextResponse } from "next/server";
import { PrismaClient, PostType, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener el Feed (Soporta paginación, filtros y modo Oferta/Demanda)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const limit = 5;
  const province = searchParams.get("province");
  const viewMode = searchParams.get("view"); // "OFFERS" o "DEMANDS"
  const userId = searchParams.get("userId"); // Para obtener publicaciones de un usuario específico

  // Calculamos el offset para paginación
  const skip = (page - 1) * limit;

  // Construimos el filtro dinámico
  const where: any = {};

  // 1. Filtro por Provincia (si no es 'todas')
  if (province && province !== "todas") {
    where.province = province;
  }

  // 2. Filtro por Tipo (Ofertas vs Demandas)
  if (viewMode === "DEMANDS") {
    where.type = PostType.DEMAND;
  } else {
    // Si vemos ofertas, queremos las OFICIALES y las COMPARTIDAS
    where.type = { in: [PostType.OFFICIAL, PostType.SHARED] };
  }

  // 3. Filtro por usuario (para ver sus propias publicaciones)
  if (userId) {
    // Si se pide un userId, filtramos por ese usuario
    where.OR = [
      { publisherId: userId },
      { companyId: userId }
    ];
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
      // Incluimos los datos del autor para mostrar nombre/avatar en la tarjeta
      include: {
        company: {
          include: {
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
                province: true
              }
            },
            foremanProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                crewSize: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error cargando feed:", error);
    return NextResponse.json({ error: "Error al cargar publicaciones" }, { status: 500 });
  }
}

// POST: Crear nueva publicación
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, location, province, type, uid } = body;

    // Validación básica
    if (!title || !province || !uid || !type) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
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
      // Convertimos el string que llega del front al Enum de Prisma
      type: type as PostType, 
    };

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