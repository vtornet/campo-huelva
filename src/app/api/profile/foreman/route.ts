import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil de Manijero
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.foremanProfile.findUnique({ where: { userId: uid } });
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
      crewSize, workArea, // Array de zonas
      hasVan, needsBus, ownTools,
      yearsExperience, specialties, bio,
      profileImage // Foto de perfil
    } = body;

    if (!uid) {
      return NextResponse.json({ error: "Faltan datos (UID)" }, { status: 400 });
    }

    // 1. AUTO-REPARACIÓN: Aseguramos que el usuario exista en la tabla User con rol FOREMAN
    await prisma.user.upsert({
        where: { id: uid },
        update: {}, // Si existe, no tocamos nada del usuario base
        create: {
            id: uid,
            email: email || `manijero_${uid}@recuperado.com`,
            role: Role.FOREMAN,
        }
    });

    // 2. VERIFICAR CAMBIO DE NOMBRE Y PERIODO DE 60 DÍAS
    const existingProfile = await prisma.foremanProfile.findUnique({ where: { userId: uid } });
    const DIAS_60_MS = 60 * 24 * 60 * 60 * 1000;

    // Si existe perfil y el nombre es diferente, verificar si pueden cambiarlo
    if (existingProfile && existingProfile.fullName !== fullName) {
      if (existingProfile.nameLastModified) {
        const daysSinceModification = Date.now() - new Date(existingProfile.nameLastModified).getTime();
        if (daysSinceModification < DIAS_60_MS) {
          return NextResponse.json({
            error: "Nombre no modificable",
            message: `Solo puedes modificar el nombre una vez cada 60 días. Última modificación: ${new Date(existingProfile.nameLastModified).toLocaleDateString()}`
          }, { status: 400 });
        }
      }
    }

    // 3. UPSERT DEL PERFIL DE MANIJERO
    // Convertimos a enteros los campos numéricos por seguridad
    const sizeInt = parseInt(crewSize) || 0;
    const expInt = parseInt(yearsExperience) || 0;

    // Verificar si el nombre cambió para actualizar nameLastModified
    const nameChanged = existingProfile && existingProfile.fullName !== fullName;

    // Datos del perfil
    const profileData = {
      fullName, city, province, phone,
      crewSize: sizeInt,
      workArea,
      hasVan, needsBus, ownTools,
      yearsExperience: expInt,
      specialties,
      bio,
      ...(nameChanged || !existingProfile?.nameLastModified ? { nameLastModified: new Date() } : {}),
      ...(profileImage !== undefined ? { profileImage } : {})
    };

    const updatedProfile = await prisma.foremanProfile.upsert({
      where: { userId: uid },
      update: profileData,
      create: {
        userId: uid,
        ...profileData
      }
    });

    return NextResponse.json(updatedProfile);

  } catch (error) {
    console.error("Error guardando perfil manijero:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}