import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "all";
  const type = searchParams.get("type") || "all";

  try {
    // Si filtra por BOARD, buscar en BoardPost
    if (type === "BOARD") {
      const where: any = {};
      if (filter !== "all") {
        where.status = filter;
      }

      const boardPosts = await prisma.boardPost.findMany({
        where,
        include: {
          author: {
            include: {
              workerProfile: { select: { fullName: true } },
              foremanProfile: { select: { fullName: true } },
              engineerProfile: { select: { fullName: true } },
              encargadoProfile: { select: { fullName: true } },
              tractoristProfile: { select: { fullName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      // Transformar BoardPost al mismo formato que Post para el frontend
      const formatted = boardPosts.map(post => ({
        id: post.id,
        type: "BOARD",
        status: post.status,
        title: post.content?.substring(0, 100) + (post.content?.length > 100 ? "..." : ""),
        description: post.content || "",
        location: "",
        province: null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        moderationReason: post.moderationReason,
        publisher: post.author, // Mapeamos author a publisher para consistencia
        company: null,
        contractType: null,
      }));

      return NextResponse.json(formatted);
    }

    // Para otros tipos o "all", buscar en Post
    const where: any = {};

    // Filtro por estado
    if (filter !== "all") {
      where.status = filter;
    }

    // Filtro por tipo
    if (type !== "all") {
      where.type = type;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        publisher: {
          include: {
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
            engineerProfile: { select: { fullName: true } },
            encargadoProfile: { select: { fullName: true } },
            tractoristProfile: { select: { fullName: true } },
          },
        },
        company: { select: { companyName: true, isVerified: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
