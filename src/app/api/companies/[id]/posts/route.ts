import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener todas las ofertas de una empresa
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = params.id;

    if (!companyId) {
      return NextResponse.json({ error: "Falta ID de empresa" }, { status: 400 });
    }

    // Obtener ofertas de la empresa, ordenadas por fecha descendente
    const posts = await prisma.post.findMany({
      where: {
        companyId: companyId,
        status: "ACTIVE", // Solo ofertas activas
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50, // Máximo 50 ofertas
    });

    // Contar aplicaciones por oferta
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const applicationCount = await prisma.application.count({
          where: { postId: post.id },
        });
        return {
          ...post,
          applicationCount,
        };
      })
    );

    return NextResponse.json(postsWithCounts);
  } catch (error) {
    console.error("Error al obtener ofertas de empresa:", error);
    return NextResponse.json(
      { error: "Error al obtener las ofertas" },
      { status: 500 }
    );
  }
}
