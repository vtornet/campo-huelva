import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { postId, status, reason, adminId } = body;

  if (!postId || !status) {
    return NextResponse.json({ error: "Falta postId o status" }, { status: 400 });
  }

  try {
    // Intentar primero en Post
    try {
      await prisma.post.update({
        where: { id: postId },
        data: {
          status,
          moderatedBy: adminId,
          moderatedAt: new Date(),
          moderationReason: reason,
        },
      });

      // Crear log
      await prisma.adminLog.create({
        data: {
          adminId: adminId || "system",
          action: status === "REMOVED" ? "REMOVE_POST" : status === "HIDDEN" ? "HIDE_POST" : "SHOW_POST",
          targetType: "POST",
          targetId: postId,
          details: reason || "",
        },
      });

      return NextResponse.json({ success: true });
    } catch (postError: any) {
      // Si no existe en Post, intentar en BoardPost
      if (postError.code === "P2025") {
        await prisma.boardPost.update({
          where: { id: postId },
          data: {
            status,
            moderatedBy: adminId,
            moderatedAt: new Date(),
            moderationReason: reason,
          },
        });

        // Crear log
        await prisma.adminLog.create({
          data: {
            adminId: adminId || "system",
            action: status === "REMOVED" ? "REMOVE_POST" : status === "HIDDEN" ? "HIDE_POST" : "SHOW_POST",
            targetType: "BOARD_POST",
            targetId: postId,
            details: reason || "",
          },
        });

        return NextResponse.json({ success: true });
      }
      throw postError;
    }
  } catch (error) {
    console.error("Error moderating post:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
