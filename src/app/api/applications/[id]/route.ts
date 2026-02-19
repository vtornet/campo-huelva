// API para gestionar una inscripción específica
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT - Actualizar estado de inscripción (solo empresa)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Obtener la inscripción con la oferta
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        post: {
          include: {
            company: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    // Verificar que el solicitante es la empresa que publicó la oferta
    const companyId = application.post.company?.userId || application.post.companyId;
    if (companyId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar el estado
    const validStatuses = ["ACCEPTED", "REJECTED", "CONTACTED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Actualizar estado
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status }
    });

    // Crear notificación al candidato
    let notificationTitle = "";
    let notificationMessage = "";

    switch (status) {
      case "ACCEPTED":
        notificationTitle = "¡Buenas noticias!";
        notificationMessage = `Tu candidatura para "${application.post.title}" ha sido aceptada`;
        break;
      case "REJECTED":
        notificationTitle = "Candidatura no seleccionada";
        notificationMessage = `Tu candidatura para "${application.post.title}" no ha sido seleccionada`;
        break;
      case "CONTACTED":
        notificationTitle = "Te han contactado";
        notificationMessage = `La empresa te ha contactado sobre "${application.post.title}"`;
        break;
    }

    if (notificationTitle) {
      await prisma.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_ACCEPTED",
          title: notificationTitle,
          message: notificationMessage,
          link: `/applications`,
          relatedPostId: application.postId
        }
      });
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("Error al actualizar inscripción:", error);
    return NextResponse.json({ error: "Error al actualizar inscripción" }, { status: 500 });
  }
}

// GET - Obtener detalles de una inscripción
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const requesterId = searchParams.get("userId");

    if (!requesterId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        post: {
          include: {
            company: {
              select: {
                userId: true,
                id: true,
                companyName: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    // Solo el candidato o la empresa pueden ver la inscripción
    const companyId = application.post.company?.userId || application.post.companyId;
    if (application.userId !== requesterId && companyId !== requesterId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error al obtener inscripción:", error);
    return NextResponse.json({ error: "Error al obtener inscripción" }, { status: 500 });
  }
}
