import { NextResponse } from "next/server";
import { PrismaClient, ContactStatus } from "@prisma/client";
import { notifyContactAccepted } from "@/lib/push-notifications";

const prisma = new PrismaClient();

// PUT: Aceptar solicitud de contacto
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { uid, action } = body; // action puede ser "accept" o "reject"

    if (!uid) {
      return NextResponse.json({ error: "Falta UID" }, { status: 400 });
    }

    // Buscar la solicitud de contacto
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    // Verificar que el usuario es el destinatario de la solicitud
    if (contact.recipientId !== uid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (action === "accept") {
      // Aceptar solicitud
      const updated = await prisma.contact.update({
        where: { id },
        data: {
          status: ContactStatus.ACCEPTED,
          acceptedAt: new Date()
        }
      });

      // Obtener nombre del destinatario que aceptó
      const recipient = await prisma.user.findUnique({
        where: { id: contact.recipientId },
        include: {
          workerProfile: { select: { fullName: true } },
          foremanProfile: { select: { fullName: true } },
          engineerProfile: { select: { fullName: true } },
          encargadoProfile: { select: { fullName: true } },
          tractoristProfile: { select: { fullName: true } },
          companyProfile: { select: { companyName: true } }
        }
      });

      const recipientName = recipient?.workerProfile?.fullName ||
                           recipient?.foremanProfile?.fullName ||
                           recipient?.engineerProfile?.fullName ||
                           recipient?.encargadoProfile?.fullName ||
                           recipient?.tractoristProfile?.fullName ||
                           recipient?.companyProfile?.companyName ||
                           "Alguien";

      // Crear notificación al solicitante
      await prisma.notification.create({
        data: {
          userId: contact.requesterId,
          type: "CONTACT_ACCEPTED",
          title: "Solicitud de contacto aceptada",
          message: `${recipientName} ha aceptado tu solicitud de contacto`,
          link: `/profile/contacts`,
          relatedUserId: contact.recipientId
        }
      });

      // Enviar notificación push
      await notifyContactAccepted(contact.requesterId, recipientName);

      return NextResponse.json(updated);
    } else if (action === "reject") {
      // Eliminar solicitud (rechazar)
      await prisma.contact.delete({
        where: { id }
      });

      return NextResponse.json({ message: "Solicitud rechazada" });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json({ error: "Error al actualizar solicitud" }, { status: 500 });
  }
}

// DELETE: Eliminar contacto
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json({ error: "Falta UID" }, { status: 400 });
    }

    // Buscar la relación de contacto
    const contact = await prisma.contact.findUnique({
      where: { id }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 });
    }

    // Verificar que el usuario es parte de la relación
    if (contact.requesterId !== uid && contact.recipientId !== uid) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    await prisma.contact.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Contacto eliminado" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json({ error: "Error al eliminar contacto" }, { status: 500 });
  }
}
