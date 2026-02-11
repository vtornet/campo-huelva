import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type NotificationType = "NEW_MESSAGE" | "NEW_APPLICATION" | "APPLICATION_ACCEPTED" | "POST_NEARBY" | "PROFILE_VIEW" | "COMPANY_VERIFIED" | "ADMIN_ACTION";

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  relatedPostId,
  relatedUserId
}: {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  relatedPostId?: string;
  relatedUserId?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        relatedPostId,
        relatedUserId
      }
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// Función para notificar cuando hay un nuevo mensaje
export async function notifyNewMessage(receiverId: string, senderName: string, conversationId: string) {
  return createNotification({
    userId: receiverId,
    type: "NEW_MESSAGE",
    title: "Nuevo mensaje",
    message: `${senderName} te envió un mensaje.`,
    link: `/messages/${conversationId}`
  });
}

// Función para notificar cuando alguien se aplica a una oferta
export async function notifyNewApplication(employerId: string, applicantName: string, postId: string, postTitle: string) {
  return createNotification({
    userId: employerId,
    type: "NEW_APPLICATION",
    title: "Nueva candidatura",
    message: `${applicantName} se ha postulado a tu oferta: ${postTitle}`,
    link: `/`,
    relatedPostId: postId,
    relatedUserId: applicantName
  });
}

// Función para notificar cuando alguien te contacta por una publicación
export async function notifyNewContact(receiverId: string, senderName: string, postId: string, postTitle: string, conversationId: string) {
  return createNotification({
    userId: receiverId,
    type: "NEW_MESSAGE",
    title: "Nueva consulta",
    message: `${senderName} está interesado en tu publicación: ${postTitle}`,
    link: `/messages/${conversationId}`,
    relatedPostId: postId
  });
}
