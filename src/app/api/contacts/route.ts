import { NextResponse } from "next/server";
import { PrismaClient, ContactStatus } from "@prisma/client";
import { notifyContactRequest } from "@/lib/push-notifications";

const prisma = new PrismaClient();

// GET: Listar contactos del usuario actual
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const requests = searchParams.get("requests") === "true"; // Solo pendientes

  if (!uid) {
    return NextResponse.json({ error: "Falta UID" }, { status: 400 });
  }

  try {
    // Si pide solo pendientes, devolver solicitudes recibidas pendientes
    if (requests) {
      const pendingRequests = await prisma.contact.findMany({
        where: {
          recipientId: uid,
          status: ContactStatus.PENDING
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      // Enriquecer con datos del perfil
      const enriched = await Promise.all(pendingRequests.map(async (contact) => {
        let profile = null;
        const { requester } = contact;

        // Buscar perfil según rol
        switch (requester.role) {
          case "USER":
            profile = await prisma.workerProfile.findUnique({
              where: { userId: requester.id },
              select: { fullName: true, province: true, profileImage: true }
            });
            break;
          case "FOREMAN":
            profile = await prisma.foremanProfile.findUnique({
              where: { userId: requester.id },
              select: { fullName: true, province: true, profileImage: true }
            });
            break;
          case "ENGINEER":
            profile = await prisma.engineerProfile.findUnique({
              where: { userId: requester.id },
              select: { fullName: true, province: true, profileImage: true }
            });
            break;
          case "ENCARGADO":
            profile = await prisma.encargadoProfile.findUnique({
              where: { userId: requester.id },
              select: { fullName: true, province: true, profileImage: true }
            });
            break;
          case "TRACTORISTA":
            profile = await prisma.tractoristProfile.findUnique({
              where: { userId: requester.id },
              select: { fullName: true, province: true, profileImage: true }
            });
            break;
          case "COMPANY":
            profile = await prisma.companyProfile.findUnique({
              where: { userId: requester.id },
              select: { companyName: true, province: true, profileImage: true }
            });
            break;
        }

        return {
          ...contact,
          profile
        };
      }));

      return NextResponse.json(enriched);
    }

    // Listar contactos aceptados (tanto enviados como recibidos)
    const [sentContacts, receivedContacts] = await Promise.all([
      prisma.contact.findMany({
        where: {
          requesterId: uid,
          status: ContactStatus.ACCEPTED
        },
        include: {
          recipient: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { acceptedAt: "desc" }
      }),
      prisma.contact.findMany({
        where: {
          recipientId: uid,
          status: ContactStatus.ACCEPTED
        },
        include: {
          requester: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { acceptedAt: "desc" }
      })
    ]);

    // Enriquecer con datos de perfil
    const enrichContact = async (contact: any, isRequester: boolean) => {
      const user = isRequester ? contact.recipient : contact.requester;
      let profile = null;

      switch (user.role) {
        case "USER":
          profile = await prisma.workerProfile.findUnique({
            where: { userId: user.id },
            select: { fullName: true, province: true, profileImage: true }
          });
          break;
        case "FOREMAN":
          profile = await prisma.foremanProfile.findUnique({
            where: { userId: user.id },
            select: { fullName: true, province: true, profileImage: true }
          });
          break;
        case "ENGINEER":
          profile = await prisma.engineerProfile.findUnique({
            where: { userId: user.id },
            select: { fullName: true, province: true, profileImage: true }
          });
          break;
        case "ENCARGADO":
          profile = await prisma.encargadoProfile.findUnique({
            where: { userId: user.id },
            select: { fullName: true, province: true, profileImage: true }
          });
          break;
        case "TRACTORISTA":
          profile = await prisma.tractoristProfile.findUnique({
            where: { userId: user.id },
            select: { fullName: true, province: true, profileImage: true }
          });
          break;
        case "COMPANY":
          profile = await prisma.companyProfile.findUnique({
            where: { userId: user.id },
            select: { companyName: true, province: true, profileImage: true }
          });
          break;
      }

      return {
        id: contact.id,
        status: contact.status,
        createdAt: contact.createdAt,
        acceptedAt: contact.acceptedAt,
        user: { ...user, profile }
      };
    };

    const enriched = await Promise.all([
      ...sentContacts.map((c) => enrichContact(c, true)),
      ...receivedContacts.map((c) => enrichContact(c, false))
    ]);

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }
}

// POST: Enviar solicitud de contacto
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterId, recipientId } = body;

    if (!requesterId || !recipientId) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (requesterId === recipientId) {
      return NextResponse.json({ error: "No puedes añadirte como contacto a ti mismo" }, { status: 400 });
    }

    // Verificar que el destinatario existe
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId }
    });

    if (!recipient) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Verificar si ya existe una relación de contacto
    const existingContact = await prisma.contact.findFirst({
      where: {
        OR: [
          { requesterId, recipientId },
          { requesterId: recipientId, recipientId: requesterId }
        ]
      }
    });

    if (existingContact) {
      if (existingContact.status === ContactStatus.ACCEPTED) {
        return NextResponse.json({ message: "Ya sois contactos", contact: existingContact });
      }
      if (existingContact.status === ContactStatus.PENDING) {
        return NextResponse.json({ message: "Solicitud ya enviada", contact: existingContact });
      }
      if (existingContact.requesterId === requesterId) {
        // Si estaba BLOCKED y el requester quiere reenviar, lo cambiamos a PENDING
        const updated = await prisma.contact.update({
          where: { id: existingContact.id },
          data: { status: ContactStatus.PENDING }
        });
        return NextResponse.json({ message: "Solicitud reenviada", contact: updated });
      }
      // Si el destinatario tenía bloqueado al requester, no permitir
      return NextResponse.json({ error: "No se puede enviar solicitud" }, { status: 403 });
    }

    // Crear solicitud de contacto
    const newContact = await prisma.contact.create({
      data: {
        requesterId,
        recipientId,
        status: ContactStatus.PENDING
      }
    });

    // Obtener nombre del solicitante
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      include: {
        workerProfile: { select: { fullName: true } },
        foremanProfile: { select: { fullName: true } },
        engineerProfile: { select: { fullName: true } },
        encargadoProfile: { select: { fullName: true } },
        tractoristProfile: { select: { fullName: true } },
        companyProfile: { select: { companyName: true } }
      }
    });

    const requesterName = requester?.workerProfile?.fullName ||
                         requester?.foremanProfile?.fullName ||
                         requester?.engineerProfile?.fullName ||
                         requester?.encargadoProfile?.fullName ||
                         requester?.tractoristProfile?.fullName ||
                         requester?.companyProfile?.companyName ||
                         "Alguien";

    // Crear notificación al destinatario
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "CONTACT_REQUEST",
        title: "Nueva solicitud de contacto",
        message: `${requesterName} quiere añadirte como contacto`,
        link: `/profile?tab=contacts`,
        relatedUserId: requesterId
      }
    });

    // Enviar notificación push
    await notifyContactRequest(recipientId, requesterName);

    return NextResponse.json(newContact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact request:", error);
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
  }
}
