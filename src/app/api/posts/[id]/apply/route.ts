// API para inscribirse en una oferta
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, ApplicationStatus } from "@prisma/client";

const prisma = new PrismaClient();

// POST - Inscribirse en una oferta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // Verificar que la publicación existe
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        company: true,
        publisher: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Verificar que no sea una demanda (solo te puedes inscribir en ofertas)
    if (post.type === "DEMAND") {
      return NextResponse.json({ error: "No puedes inscribirte en una demanda" }, { status: 400 });
    }

    // Obtener ID de la empresa - primero intentar obtener el userId del company
    let companyId = post.companyId || undefined;
    if (post.company && post.companyId) {
      // Buscar el userId del CompanyProfile
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { id: post.companyId },
        select: { userId: true }
      });
      companyId = companyProfile?.userId || post.companyId;
    }

    // No puedes inscribirte en tu propia oferta
    if (companyId === userId || post.publisherId === userId) {
      return NextResponse.json({ error: "No puedes inscribirte en tu propia oferta" }, { status: 400 });
    }

    // Verificar si ya está inscrito
    const existing = await prisma.application.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existing) {
      // Si ya está inscrito y se retiró, reactivar
      if (existing.status === ApplicationStatus.WITHDRAWN) {
        await prisma.application.update({
          where: { id: existing.id },
          data: { status: ApplicationStatus.PENDING }
        });
        return NextResponse.json({ success: true, reactivated: true });
      }
      return NextResponse.json({ error: "Ya estás inscrito en esta oferta" }, { status: 400 });
    }

    // Crear inscripción
    const application = await prisma.application.create({
      data: {
        postId,
        userId,
        status: ApplicationStatus.PENDING
      },
      include: {
        user: {
          include: {
            workerProfile: true,
            foremanProfile: true
          }
        }
      }
    });

    // Crear notificación a la empresa
    if (companyId) {
      const applicantName = application.user.workerProfile?.fullName ||
                           application.user.foremanProfile?.fullName ||
                           "Un candidato";

      await prisma.notification.create({
        data: {
          userId: companyId,
          type: "NEW_APPLICATION",
          title: "Nueva inscripción",
          message: `${applicantName} se ha inscrito en tu oferta "${post.title}"`,
          link: `/applications?post=${postId}`,
          relatedPostId: postId
        }
      });
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Error al inscribirse:", error);
    return NextResponse.json({ error: "Error al inscribirse" }, { status: 500 });
  }
}

// GET - Obtener inscritos de una oferta (solo para la empresa)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const requesterId = searchParams.get("userId");

    if (!requesterId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // Verificar que la publicación existe y obtener el ID de la empresa
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        companyId: true
      }
    });

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    // Obtener el userId del CompanyProfile
    let companyId = post.companyId;
    if (post.companyId) {
      const companyProfile = await prisma.companyProfile.findUnique({
        where: { id: post.companyId },
        select: { userId: true }
      });
      companyId = companyProfile?.userId || post.companyId;
    }

    // Solo la empresa puede ver los inscritos
    if (companyId !== requesterId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Obtener inscritos
    const applications = await prisma.application.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: {
              select: {
                fullName: true,
                phone: true,
                province: true,
                city: true,
                experience: true,
                hasVehicle: true,
                canRelocate: true,
                yearsExperience: true,
                profileImage: true,
                bio: true,
                machineryExperience: true,
                licenseTypes: true
              }
            },
            foremanProfile: {
              select: {
                fullName: true,
                phone: true,
                province: true,
                city: true,
                crewSize: true,
                workArea: true,
                hasVan: true,
                yearsExperience: true,
                profileImage: true,
                bio: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error("Error al obtener inscritos:", error);
    return NextResponse.json({ error: "Error al obtener inscritos" }, { status: 500 });
  }
}

// DELETE - Retirar inscripción
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // Buscar la inscripción
    const application = await prisma.application.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (!application) {
      return NextResponse.json({ error: "Inscripción no encontrada" }, { status: 404 });
    }

    // Solo el propio usuario puede retirarse
    if (application.userId !== userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Marcar como retirada en lugar de borrar
    await prisma.application.update({
      where: { id: application.id },
      data: { status: ApplicationStatus.WITHDRAWN }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al retirar inscripción:", error);
    return NextResponse.json({ error: "Error al retirar inscripción" }, { status: 500 });
  }
}
