import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// POST: Bloquear un usuario
export async function POST(request: Request) {
  try {
    const { blockedUserId } = await request.json();

    // Autenticar
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!blockedUserId) {
      return NextResponse.json({ error: "Falta ID de usuario a bloquear" }, { status: 400 });
    }

    // No puedes bloquearte a ti mismo
    if (authUser === blockedUserId) {
      return NextResponse.json({ error: "No puedes bloquearte a ti mismo" }, { status: 400 });
    }

    // Crear relación de bloqueo
    const existing = await prisma.blockedUser.findUnique({
      where: {
        blockerId_blockedById: {
          blockerId: authUser,
          blockedById: blockedUserId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, message: "Usuario ya bloqueado" });
    }

    await prisma.blockedUser.create({
      data: {
        blockerId: authUser,
        blockedById: blockedUserId
      }
    });

    return NextResponse.json({ success: true, message: "Usuario bloqueado correctamente" });
  } catch (error) {
    console.error("Error al bloquear usuario:", error);
    return NextResponse.json({ error: "Error al bloquear usuario" }, { status: 500 });
  }
}

// GET: Obtener lista de usuarios bloqueados
export async function GET(request: Request) {
  try {
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const blocked = await prisma.blockedUser.findMany({
      where: { blockerId: authUser },
      select: {
        blockedById: true,
        createdAt: true,
        blockedUser: {
          select: {
            id: true,
            email: true,
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
            engineerProfile: { select: { fullName: true } },
            encargadoProfile: { select: { fullName: true } },
            tractoristProfile: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json(blocked);
  } catch (error) {
    console.error("Error obteniendo usuarios bloqueados:", error);
    return NextResponse.json({ error: "Error obteniendo usuarios bloqueados" }, { status: 500 });
  }
}

// DELETE: Desbloquear un usuario
export async function DELETE(request: Request) {
  try {
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const blockedUserId = searchParams.get("blockedUserId");

    if (!blockedUserId) {
      return NextResponse.json({ error: "Falta ID de usuario a desbloquear" }, { status: 400 });
    }

    await prisma.blockedUser.delete({
      where: {
        blockerId_blockedById: {
          blockerId: authUser,
          blockedById: blockedUserId
        }
      }
    });

    return NextResponse.json({ success: true, message: "Usuario desbloqueado correctamente" });
  } catch (error) {
    console.error("Error al desbloquear usuario:", error);
    return NextResponse.json({ error: "Error al desbloquear usuario" }, { status: 500 });
  }
}
