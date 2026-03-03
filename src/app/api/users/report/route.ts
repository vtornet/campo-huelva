import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// POST: Denunciar un usuario
export async function POST(request: Request) {
  try {
    const { reportedUserId, reason, description } = await request.json();

    // Autenticar
    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!reportedUserId || !reason) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Verificar que el usuario a denunciar existe
    const targetUser = await prisma.user.findUnique({
      where: { id: reportedUserId },
      select: { id: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // No puedes denunciarte a ti mismo
    if (authUser === reportedUserId) {
      return NextResponse.json({ error: "No puedes denunciarte a ti mismo" }, { status: 400 });
    }

    // Crear denuncia usando el modelo Report existente con tipo USER
    const report = await prisma.report.create({
      data: {
        type: "USER",
        reporterId: authUser,
        reportedUserId,
        reason,
        description: description || null,
      }
    });

    // Crear notificación para admin
    await prisma.notification.create({
      data: {
        userId: "admin", // Será procesado por el endpoint
        type: "ADMIN_ACTION",
        title: "Nueva denuncia de usuario",
        message: `Razón: ${reason}${description ? ` - ${description}` : ""}`,
        link: `/admin?tab=user-reports`,
        isRead: false,
      }
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Denuncia enviada correctamente"
    });
  } catch (error) {
    console.error("Error al denunciar usuario:", error);
    return NextResponse.json({ error: "Error al enviar denuncia" }, { status: 500 });
  }
}

// GET: Obtener denuncias de un usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const authUser = await authenticateRequest(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    const reports = await prisma.report.findMany({
      where: {
        reportedUserId: userId,
        type: "USER"
      },
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: {
            id: true,
            email: true,
            workerProfile: { select: { fullName: true } },
            foremanProfile: { select: { fullName: true } },
          },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error obteniendo denuncias:", error);
    return NextResponse.json({ error: "Error al obtener denuncias" }, { status: 500 });
  }
}

