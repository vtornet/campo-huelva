import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Validar que el filtro de rol es valido
const isValidRoleFilter = (filter: string | null): boolean => {
  if (!filter || filter === "ALL") return true;
  return ["USER", "FOREMAN", "COMPANY", "ADMIN", "BANNED", "SILENCED"].includes(filter);
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter") || "ALL";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  // Validar filtros
  if (!isValidRoleFilter(filter)) {
    return NextResponse.json({ error: "Filtro inválido" }, { status: 400 });
  }

  // Calcular paginacion
  const skip = (page - 1) * limit;

  try {
    // Construir clausula where dinamica
    const where: any = {};

    // Filtrar por rol
    if (filter === "BANNED") {
      where.isBanned = true;
    } else if (filter === "SILENCED") {
      where.isSilenced = true;
    } else if (filter !== "ALL") {
      where.role = filter as Role;
    }

    // Busqueda por email o nombre
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { workerProfile: { fullName: { contains: search, mode: "insensitive" } } },
        { foremanProfile: { fullName: { contains: search, mode: "insensitive" } } },
        { companyProfile: { companyName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Obtener total de usuarios para paginacion
    const total = await prisma.user.count({ where });

    // Obtener usuarios con paginacion
    const users = await prisma.user.findMany({
      where,
      include: {
        workerProfile: {
          select: {
            fullName: true,
            city: true,
            province: true,
          },
        },
        foremanProfile: {
          select: {
            fullName: true,
            city: true,
            province: true,
            crewSize: true,
          },
        },
        companyProfile: {
          select: {
            companyName: true,
            city: true,
            province: true,
            isVerified: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
