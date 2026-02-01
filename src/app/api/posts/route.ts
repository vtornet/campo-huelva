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

  try {
    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: skip,
      // Incluimos los datos del autor para mostrar nombre/avatar en la tarjeta
      include: {
        company: true,    // Si es empresa
        publisher: {      // Si es usuario/manijero
          include: {
            workerProfile: true,
            foremanProfile: true
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
      // Si es Trabajador/Manijero, es publisherId directo
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