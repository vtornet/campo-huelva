import { NextResponse } from "next/server";
import { PrismaClient, PostType } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer publicaciones (Con filtro de TIPO y PROVINCIA)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const viewMode = searchParams.get("view"); // "OFFERS" o "DEMANDS"
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 5;

  try {
    const where: any = {};

    // 1. Filtro por Provincia
    if (province && province !== "todas") {
      where.province = province;
    }

    // 2. Filtro por Tipo (Ofertas vs Demandas)
    if (viewMode === "DEMANDS") {
      where.type = "DEMAND"; // Solo demandas
    } else {
      // Si busco ofertas, quiero las OFICIALES y las COMPARTIDAS
      where.type = { in: ["OFFICIAL", "SHARED"] };
    }

    const posts = await prisma.post.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
      include: {
        company: true, 
        publisher: {   
           include: { workerProfile: true, foremanProfile: true } // Incluimos ambos perfiles
        }
      }
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: "Error cargando datos" }, { status: 500 });
  }
}

// POST: Publicar (Ahora maneja los 3 tipos)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, location, province, description, uid, postType } = body; 
    // postType puede ser: "OFFER" (Empresa), "SHARED" (Trabajador comparte), "DEMAND" (Pide trabajo)

    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: { companyProfile: true },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let finalType: PostType = "SHARED"; // Por defecto
    let companyId = null;

    // LÓGICA DE TIPOS
    if (user.role === "COMPANY") {
        finalType = "OFFICIAL";
        companyId = user.companyProfile?.id;
    } else {
        // Si es Trabajador o Manijero
        if (postType === "DEMAND") finalType = "DEMAND";
        else finalType = "SHARED";
    }

    const newPost = await prisma.post.create({
      data: {
        title,
        description,
        location,
        province,
        type: finalType,
        publisherId: user.id,
        companyId: companyId
      },
    });

    return NextResponse.json(newPost);

  } catch (error) {
    console.error("Error creando post:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}