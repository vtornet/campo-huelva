import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, role } = body;

    if (!uid || !email || !role) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // MAPEO SEGURO DE ROLES USANDO EL ENUM DE PRISMA
    let dbRole: Role = Role.USER;
    if (role === "COMPANY") dbRole = Role.COMPANY;
    if (role === "FOREMAN") dbRole = Role.FOREMAN;
    if (role === "ENGINEER") dbRole = Role.ENGINEER;

    // 1. Buscar usuario por UID (el identificador correcto de Firebase)
    const existingUserByUid = await prisma.user.findUnique({ where: { id: uid } });

    if (existingUserByUid) {
      // El usuario ya existe con este UID, actualizamos el rol si es necesario
      if (existingUserByUid.role !== dbRole) {
        await prisma.user.update({
          where: { id: uid },
          data: { role: dbRole }
        });
      }
      return NextResponse.json({ success: true, message: "Usuario actualizado" });
    }

    // 2. Si no existe por UID, verificar si existe por email
    // Esto puede pasar si el usuario se registró antes con un UID diferente
    const existingUserByEmail = await prisma.user.findFirst({ where: { email: email } });

    if (existingUserByEmail) {
      // El email ya está registrado pero con un UID diferente
      // Actualizamos el UID al nuevo (el actual de Firebase) para mantener consistencia
      await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: {
          id: uid, // Actualizamos el ID al UID actual de Firebase
          role: dbRole
        }
      });
      return NextResponse.json({ success: true, message: "Usuario recuperado y actualizado" });
    }

    // 3. Crear nuevo usuario
    await prisma.user.create({
      data: {
        id: uid,
        email: email,
        role: dbRole,
      },
    });

    return NextResponse.json({ success: true, message: "Usuario creado" });

  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
