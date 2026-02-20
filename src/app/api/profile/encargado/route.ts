import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.encargadoProfile.findUnique({ where: { userId: uid } });
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer perfil" }, { status: 500 });
  }
}

// PUT: Guardar perfil (Con Auto-Reparación de Usuario y control de nombre)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    console.log("Datos recibidos en encargado profile:", JSON.stringify(body, null, 2));

    const {
      uid,
      email,
      fullName,
      city,
      province,
      phone,
      bio,
      yearsExperience,
      canDriveTractor,
      cropExperience = [],
      needsAccommodation,
      workArea = [],
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
        role: Role.ENCARGADO,
      }
    });

    // 2. Verificar si el perfil ya existe para controlar la modificación del nombre
    const existingProfile = await prisma.encargadoProfile.findUnique({
      where: { userId: uid }
    });

    // Control de modificación de nombre (60 días)
    let updateFullName = fullName;
    if (existingProfile && existingProfile.fullName && existingProfile.fullName !== fullName) {
      if (existingProfile.nameLastModified) {
        const daysSinceLastChange = Math.floor(
          (Date.now() - new Date(existingProfile.nameLastModified).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceLastChange < 60) {
          return NextResponse.json({
            error: `Solo puedes cambiar tu nombre una vez cada 60 días. Días restantes: ${60 - daysSinceLastChange}`
          }, { status: 400 });
        }
      }
      // Actualizamos la fecha de modificación del nombre
      await prisma.encargadoProfile.update({
        where: { userId: uid },
        data: { nameLastModified: new Date() }
      });
    } else if (!existingProfile) {
      // Nuevo perfil - establecer fecha de modificación si hay nombre
      if (fullName) {
        await prisma.encargadoProfile.update({
          where: { userId: uid },
          data: { nameLastModified: new Date() }
        });
      }
    }

    // 3. Guardamos el perfil
    const updatedProfile = await prisma.encargadoProfile.upsert({
      where: { userId: uid },
      update: {
        city,
        province,
        phone,
        bio,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        canDriveTractor,
        cropExperience: cropExperience || [],
        needsAccommodation,
        workArea: workArea || [],
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
        canDriveTractor,
        cropExperience: cropExperience || [],
        needsAccommodation,
        workArea: workArea || [],
        phytosanitaryLevel,
        foodHandler,
        profileImage,
        nameLastModified: fullName ? new Date() : null,
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Error guardando perfil:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
