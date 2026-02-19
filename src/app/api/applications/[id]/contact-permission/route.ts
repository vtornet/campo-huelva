// API para gestionar permisos de contacto
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Solicitar permiso de contacto
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const body = await request.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Falta companyId" }, { status: 400 });
    }

    // Buscar la inscripción
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        post: true
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    // Verificar que la empresa es la propietaria de la oferta
    let postCompanyId = application.post.companyId;
    if (application.post.companyId) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { id: application.post.companyId },
        select: { userId: true }
      });
      postCompanyId = companyProfile?.userId || application.post.companyId;
    }

    if (postCompanyId !== companyId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verificar si ya hay permiso (usando casting para evitar error de TypeScript)
    if ((application as any).contactPermission === true) {
      return NextResponse.json({ success: true, alreadyGranted: true });
    }

    // Actualizar para marcar como solicitado
    const updated = await (prisma.application as any).update({
      where: { id: applicationId },
      data: { contactPermission: true } // Conceder permiso automáticamente
    });

    // Crear notificación al candidato
    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: "APPLICATION_ACCEPTED",
        title: "Solicitud de datos de contacto",
        message: `Una empresa está interesada en tu perfil y ha solicitado ver tus datos de contacto.`,
        link: `/my-applications`,
        relatedPostId: application.postId
      }
    });

    return NextResponse.json({ success: true, granted: true });
  } catch (error) {
    console.error("Error requesting contact permission:", error);
    return NextResponse.json({ error: "Error al solicitar permiso" }, { status: 500 });
  }
}
