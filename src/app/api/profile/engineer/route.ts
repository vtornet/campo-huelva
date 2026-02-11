import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil de Ingeniero
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.engineerProfile.findUnique({ where: { userId: uid } });
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer perfil" }, { status: 500 });
  }
}

// PUT: Guardar perfil (Upsert con Auto-Reparación)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Desestructuramos los campos que vienen del formulario
    const {
      uid, email,
      fullName, city, province, phone,
      collegiateNumber,
      yearsExperience, cropExperience,
      specialties, servicesOffered,
      isAvailable, canTravel, bio
    } = body;

    if (!uid) {
      return NextResponse.json({ error: "Faltan datos (UID)" }, { status: 400 });
    }

    // 1. AUTO-REPARACIÓN: Aseguramos que el usuario exista en la tabla User con rol ENGINEER
    await prisma.user.upsert({
      where: { id: uid },
      update: {}, // Si existe, no tocamos nada del usuario base
      create: {
        id: uid,
        email: email || `ingeniero_${uid}@recuperado.com`,
        role: Role.ENGINEER,
      }
    });

    // 2. UPSERT DEL PERFIL DE INGENIERO
    const expInt = yearsExperience ? parseInt(yearsExperience) || 0 : null;

    const updatedProfile = await prisma.engineerProfile.upsert({
      where: { userId: uid },
      update: {
        fullName, city, province, phone,
        collegiateNumber,
        yearsExperience: expInt,
        cropExperience,      // String[]
        specialties,         // String[]
        servicesOffered,     // String[]
        isAvailable,
        canTravel,
        bio
      },
      create: {
        userId: uid,
        fullName, city, province, phone,
        collegiateNumber,
        yearsExperience: expInt,
        cropExperience,
        specialties,
        servicesOffered,
        isAvailable,
        canTravel,
        bio
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Error guardando perfil ingeniero:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
