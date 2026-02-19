// API para obtener las inscripciones del usuario actual
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Obtener inscripciones del usuario
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: {
        userId,
        status: {
          not: "WITHDRAWN" // No mostrar retiradas por defecto
        }
      },
      include: {
        post: {
          include: {
            company: {
              select: {
                id: true,
                companyName: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    return NextResponse.json({ error: "Error al obtener inscripciones" }, { status: 500 });
  }
}
