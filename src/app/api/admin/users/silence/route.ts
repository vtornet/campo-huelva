import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, silence, hours } = body;

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }
    if (user.role === "ADMIN") {
      return NextResponse.json({ error: "No se puede silenciar a un admin" }, { status: 400 });
    }

    let silencedUntil: Date | null = null;
    if (silence && hours) {
      silencedUntil = new Date();
      silencedUntil.setHours(silencedUntil.getHours() + hours);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isSilenced: silence,
        silencedUntil: silencedUntil,
      },
    });

    // Crear log
    await prisma.adminLog.create({
      data: {
        adminId: body.adminId || "system",
        action: silence ? "SILENCE_USER" : "UNSILENCE_USER",
        targetType: "USER",
        targetId: userId,
        details: hours ? `${hours} horas` : "",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error silencing user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
