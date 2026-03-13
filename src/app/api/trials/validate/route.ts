import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET - Validar token de prueba gratuita
export async function GET(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token no proporcionado" }, { status: 400 });
    }

    // Buscar la solicitud de prueba con el token
    const trial = await prisma.freeTrialRequest.findUnique({
      where: { token },
      include: {
        company: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!trial) {
      return NextResponse.json({ valid: false, error: "Token no encontrado" }, { status: 404 });
    }

    // Verificar que el token esté APPROVED y no USED
    if (trial.status !== "APPROVED") {
      if (trial.status === "USED") {
        return NextResponse.json({ valid: false, error: "Este enlace ya ha sido utilizado" }, { status: 400 });
      }
      return NextResponse.json({ valid: false, error: "Token no válido" }, { status: 400 });
    }

    // Verificar que el usuario autenticado es de la misma empresa
    if (trial.company.userId !== userId) {
      return NextResponse.json({ valid: false, error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    console.error("Error validating trial token:", error);
    return NextResponse.json({ error: "Error al validar token" }, { status: 500 });
  }
}
