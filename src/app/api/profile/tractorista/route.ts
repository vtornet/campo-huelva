import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.tractoristProfile.findUnique({ where: { userId: uid } });
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer perfil" }, { status: 500 });
  }
}

// PUT: Guardar perfil (Con Auto-Reparación de Usuario)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    console.log("Datos recibidos en tractorista profile:", JSON.stringify(body, null, 2));

    const {
      uid,
      email,
      fullName,
      city,
      province,
      phone,
      bio,
      yearsExperience,
      machineryTypes = [],
      cropExperience = [],
      hasTractorLicense,
      hasSprayerLicense,
      hasHarvesterLicense,
      isAvailableSeason,
      canTravel,
      phytosanitaryLevel,
      foodHandler,
      profileImage
    } = body;

    if (!uid) {
      console.error("UID faltante en request. Body completo:", body);
      return NextResponse.json({ error: "Faltan datos (UID)" }, { status: 400 });
    }

    // 1. AUTO-REPARACIÓN: Aseguramos que el usuario exista en la tabla User
    await prisma.user.upsert({
      where: { id: uid },
      update: {},
      create: {
        id: uid,
        email: email || `usuario_${uid}@recuperado.com`,
        role: Role.TRACTORISTA,
      }
    });

    // 2. Guardamos el perfil
    const updatedProfile = await prisma.tractoristProfile.upsert({
      where: { userId: uid },
      update: {
        fullName,
        city,
        province,
        phone,
        bio,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        machineryTypes: machineryTypes || [],
        cropExperience: cropExperience || [],
        hasTractorLicense,
        hasSprayerLicense,
        hasHarvesterLicense,
        isAvailableSeason,
        canTravel,
        phytosanitaryLevel,
        foodHandler,
        profileImage,
      },
      create: {
        userId: uid,
        fullName,
        city,
        province,
        phone,
        bio,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        machineryTypes: machineryTypes || [],
        cropExperience: cropExperience || [],
        hasTractorLicense,
        hasSprayerLicense,
        hasHarvesterLicense,
        isAvailableSeason,
        canTravel,
        phytosanitaryLevel,
        foodHandler,
        profileImage,
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Error guardando perfil:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
