import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, adminId, deleteFromFirebase } = body;

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    // 1. Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2. Eliminar en cascada todos los registros relacionados
    // El orden es importante: primero las relaciones, luego los perfiles, finalmente el usuario

    // Eliminar relaciones del tablón social
    await prisma.boardCommentLike.deleteMany({ where: { userId } });
    await prisma.boardPostLike.deleteMany({ where: { userId } });
    await prisma.boardComment.deleteMany({ where: { authorId: userId } });
    await prisma.boardPost.deleteMany({ where: { authorId: userId } });
    await prisma.boardReport.deleteMany({ where: { reporterId: userId } });

    // Eliminar notificaciones donde este usuario es el destinatario o la entidad relacionada
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId },
          { relatedUserId: userId },
        ],
      },
    });

    // Eliminar denuncias
    await prisma.report.deleteMany({
      where: {
        OR: [
          { reporterId: userId },
          { reportedUserId: userId },
        ],
      },
    });

    // Eliminar mensajería
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
    });

    // Eliminar participantes de conversaciones
    await prisma.conversationParticipant.deleteMany({ where: { userId } });

    // Eliminar contactos y bloqueos
    await prisma.contact.deleteMany({
      where: {
        OR: [
          { requesterId: userId },
          { recipientId: userId },
        ],
      },
    });

    await prisma.blockedUser.deleteMany({
      where: {
        OR: [
          { blockerId: userId },
          { blockedId: userId },
        ],
      },
    });

    // Eliminar conexiones
    await prisma.connection.deleteMany({
      where: {
        OR: [
          { followerId: userId },
          { followingId: userId },
        ],
      },
    });

    // Eliminar likes y shares de posts
    await prisma.like.deleteMany({ where: { userId } });
    await prisma.share.deleteMany({ where: { userId } });

    // Eliminar inscripciones (como trabajador)
    await prisma.application.deleteMany({ where: { userId } });

    // Eliminar posts del usuario
    await prisma.post.deleteMany({ where: { publisherId: userId } });

    // Eliminar perfiles
    await prisma.workerProfile.deleteMany({ where: { userId } });
    await prisma.companyProfile.deleteMany({ where: { userId } });
    await prisma.foremanProfile.deleteMany({ where: { userId } });
    await prisma.engineerProfile.deleteMany({ where: { userId } });
    await prisma.encargadoProfile.deleteMany({ where: { userId } });
    await prisma.tractoristProfile.deleteMany({ where: { userId } });

    // Finalmente, eliminar el usuario
    await prisma.user.delete({ where: { id: userId } });

    // 3. Opcional: Eliminar de Firebase Auth
    if (deleteFromFirebase) {
      try {
        const adminAuth = initFirebaseAdmin();
        if (adminAuth) {
          await adminAuth.deleteUser(userId);
        }
      } catch (firebaseError: any) {
        // Si el usuario no existe en Firebase, no es un error crítico
        if (firebaseError.code !== "auth/user-not-found") {
          console.error("Error eliminando de Firebase:", firebaseError);
        }
      }
    }

    // 4. Crear log de la acción
    await prisma.adminLog.create({
      data: {
        adminId: adminId || "system",
        action: "DELETE_USER",
        targetType: "USER",
        targetId: userId,
        details: `Usuario eliminado: ${user.email} (Rol: ${user.role})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando usuario:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
