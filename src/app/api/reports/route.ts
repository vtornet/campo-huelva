// src/app/api/reports/route.ts
// API pública para que los usuarios puedan crear denuncias

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ReportType } from "@prisma/client";
import { rateLimitMiddleware, RateLimitPresets } from "@/lib/rate-limit";

const prisma = new PrismaClient();

// POST: Crear una nueva denuncia
export async function POST(request: NextRequest) {
  // Rate limiting estricto para denuncias
  const rateLimitResponse = rateLimitMiddleware(request, "reports", RateLimitPresets.reports);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { reporterId, reportedPostId, reportedUserId, reason, description, type } = body;

    if (!reporterId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    if (!reason) {
      return NextResponse.json({ error: "La razón es obligatoria" }, { status: 400 });
    }

    // Validar longitud de campos
    if (reason.length > 200) {
      return NextResponse.json({ error: "La razón es demasiado larga (máximo 200 caracteres)" }, { status: 400 });
    }

    if (description && description.length > 1000) {
      return NextResponse.json({ error: "La descripción es demasiado larga (máximo 1000 caracteres)" }, { status: 400 });
    }

    if (!reportedPostId && !reportedUserId) {
      return NextResponse.json({ error: "Debes denunciar una publicación o un usuario" }, { status: 400 });
    }

    // Determinar el tipo de denuncia
    let reportType: ReportType;
    if (type) {
      reportType = type as ReportType;
    } else if (reportedPostId) {
      reportType = ReportType.POST;
    } else {
      reportType = ReportType.USER;
    }

    // Verificar que el usuario no se denuncie a sí mismo
    if (reportedUserId && reportedUserId === reporterId) {
      return NextResponse.json({ error: "No puedes denunciarte a ti mismo" }, { status: 400 });
    }

    // Verificar si ya existe una denuncia igual del mismo usuario
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId,
        reportedPostId: reportedPostId || null,
        reportedUserId: reportedUserId || null,
        status: { in: ["PENDING", "REVIEWED"] } // Solo denuncias no resueltas
      }
    });

    if (existingReport) {
      return NextResponse.json({ error: "Ya has denunciado esto anteriormente" }, { status: 400 });
    }

    // Verificar que la publicación/usuario existe
    if (reportedPostId) {
      const post = await prisma.post.findUnique({ where: { id: reportedPostId } });
      if (!post) {
        return NextResponse.json({ error: "La publicación no existe" }, { status: 404 });
      }
    }

    if (reportedUserId) {
      const user = await prisma.user.findUnique({ where: { id: reportedUserId } });
      if (!user) {
        return NextResponse.json({ error: "El usuario no existe" }, { status: 404 });
      }
    }

    // Crear la denuncia
    const report = await prisma.report.create({
      data: {
        type: reportType,
        reporterId,
        reportedPostId,
        reportedUserId,
        reason,
        description: description || null,
        status: "PENDING"
      }
    });

    return NextResponse.json({
      success: true,
      message: "Denuncia creada correctamente",
      report
    });

  } catch (error) {
    console.error("Error creando denuncia:", error);
    return NextResponse.json({ error: "Error al crear denuncia" }, { status: 500 });
  }
}
