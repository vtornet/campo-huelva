import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, ban, reason } = body;

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    // Verificar que no se banea a un admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "No se puede banear a un admin" }, { status: 400 });
    }

    // Actualizar usuario
    await prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: ban,
        banReason: ban ? reason : null,
        bannedUntil: ban ? null : null, // Si se desbanea, limpiar
      },
    });

    // Crear log
    await prisma.adminLog.create({
      data: {
        adminId: body.adminId || "system",
        action: ban ? "BAN_USER" : "UNBAN_USER",
        targetType: "USER",
        targetId: userId,
        details: reason || "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error banning user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
