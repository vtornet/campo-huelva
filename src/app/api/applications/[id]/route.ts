// API para gestionar una inscripción específica
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ApplicationStatus } from "@prisma/client";

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
          select: {
            companyId: true
          }
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    // Obtener el userId del CompanyProfile
    let companyId = application.post.companyId;
    if (application.post.companyId) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { id: application.post.companyId },
        select: { userId: true }
      });
      companyId = companyProfile?.userId || application.post.companyId;
    }

    // Verificar que el solicitante es la empresa que publicó la oferta
    if (companyId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Validar el estado y convertir a enum
    let applicationStatus: ApplicationStatus;
    switch (status) {
      case "ACCEPTED":
        applicationStatus = ApplicationStatus.ACCEPTED;
        break;
      case "REJECTED":
        applicationStatus = ApplicationStatus.REJECTED;
        break;
      case "CONTACTED":
        applicationStatus = ApplicationStatus.CONTACTED;
        break;
      default:
        return NextResponse.json({ error: "Estado no válido" }, { status: 400 });
    }

    // Actualizar estado
    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: { status: applicationStatus }
    });

    // Crear notificación al candidato
    let notificationTitle = "";
    let notificationMessage = "";

    switch (applicationStatus) {
      case ApplicationStatus.ACCEPTED:
        notificationTitle = "¡Buenas noticias!";
        notificationMessage = `Tu candidatura ha sido aceptada`;
        break;
      case ApplicationStatus.REJECTED:
        notificationTitle = "Candidatura no seleccionada";
        notificationMessage = `Tu candidatura no ha sido seleccionada`;
        break;
      case ApplicationStatus.CONTACTED:
        notificationTitle = "Te han contactado";
        notificationMessage = `La empresa te ha contactado`;
        break;
    }

    if (notificationTitle) {
      // Obtener título del post
      const post = await prisma.post.findUnique({
        where: { id: application.postId },
        select: { title: true }
      });

      await prisma.notification.create({
        data: {
          userId: application.userId,
          type: "APPLICATION_ACCEPTED",
          title: notificationTitle,
          message: notificationMessage + (post ? ` para "${post.title}"` : ""),
          link: `/my-applications`,
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
          select: {
            companyId: true,
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

    // Obtener el userId del CompanyProfile si no está ya cargado
    let companyId = application.post.company?.userId || application.post.companyId;
    if (application.post.companyId && !application.post.company?.userId) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { id: application.post.companyId },
        select: { userId: true }
      });
      companyId = companyProfile?.userId || application.post.companyId;
    }

    // Solo el candidato o la empresa pueden ver la inscripción
    if (application.userId !== requesterId && companyId !== requesterId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error al obtener inscripción:", error);
    return NextResponse.json({ error: "Error al obtener inscripción" }, { status: 500 });
  }
}
