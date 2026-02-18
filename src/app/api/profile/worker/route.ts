import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.workerProfile.findUnique({ where: { userId: uid } });
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer perfil" }, { status: 500 });
  }
}

// PUT: Guardar perfil (Con Auto-Reparación de Usuario)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Logging para depuración
    console.log("Datos recibidos en worker profile:", JSON.stringify(body, null, 2));

    const {
      uid,
      email, // <--- Importante: Recibimos el email
      fullName,
      city,
      province,
      phone,
      experience = [], // Valor por defecto: array vacío
      bio,
      hasVehicle,
      canRelocate,
      foodHandler,
      phytosanitaryLevel,
      profileImage
    } = body;

    if (!uid) {
      console.error("UID faltante en request. Body completo:", body);
      return NextResponse.json({ error: "Faltan datos (UID)" }, { status: 400 });
    }

    // 1. AUTO-REPARACIÓN: Aseguramos que el usuario exista en la tabla User
    // Usamos 'upsert' en el Usuario: Si no existe, lo crea.
    await prisma.user.upsert({
        where: { id: uid },
        update: {}, // Si existe, no hacemos nada
        create: {
            id: uid,
            // Si el email no llega, usamos uno temporal para no bloquear, pero debería llegar.
            email: email || `usuario_${uid}@recuperado.com`,
            role: Role.USER, // Asumimos rol de trabajador
        }
    });

    // 2. AHORA SÍ: Guardamos el perfil sin miedo a que falle la relación
    const updatedProfile = await prisma.workerProfile.upsert({
      where: { userId: uid },
      update: {
        fullName,
        city,
        province,
        phone,
        experience: experience || [], // Aseguramos array vacío si es null/undefined
        bio,
        hasVehicle,
        canRelocate,
        foodHandler,
        phytosanitaryLevel,
        profileImage,
      },
      create: {
        userId: uid,
        fullName,
        city,
        province,
        phone,
        experience: experience || [], // Aseguramos array vacío si es null/undefined
        bio,
        hasVehicle,
        canRelocate,
        foodHandler,
        phytosanitaryLevel,
        profileImage,
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Error guardando perfil:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}