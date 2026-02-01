import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client"; // <--- IMPORTANTE: Importamos 'Role'

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, email, role } = body;

    if (!uid || !email || !role) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    // Comprobar si ya existe
    const existingUser = await prisma.user.findUnique({ where: { id: uid } });
    if (existingUser) {
      return NextResponse.json({ message: "El usuario ya existe" }, { status: 200 });
    }

    // MAPEO SEGURO DE ROLES USANDO EL ENUM DE PRISMA
    let dbRole: Role = Role.USER; // Por defecto
    if (role === "COMPANY") dbRole = Role.COMPANY;
    if (role === "FOREMAN") dbRole = Role.FOREMAN;

    // Crear usuario en base de datos
    // SOLUCIÓN UPSERT: Si existe actualiza, si no crea.
    // Esto evita el error P2002 si el usuario ya está registrado.
    await prisma.user.upsert({
      where: { email: email }, // Buscamos por email (que es único)
      update: { 
        // Si ya existe, actualizamos el rol y aseguramos el ID
        role: dbRole, 
        // Nota: No tocamos el ID en el update para evitar conflictos de Primary Key,
        // confiamos en que el email vincula a la cuenta correcta.
      },
      create: {
        id: uid,
        email: email,
        role: dbRole,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error en registro:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}