import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Leer perfil de empresa
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) return NextResponse.json({ error: "Falta UID" }, { status: 400 });

  try {
    const profile = await prisma.companyProfile.findUnique({ where: { userId: uid } });
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json({ error: "Error al leer perfil" }, { status: 500 });
  }
}

// PUT: Guardar perfil de empresa (Upsert con Auto-Reparación)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const {
      uid,
      email, // Email para auto-reparación
      cif,
      companyName,
      address,
      city,
      province,
      phone,
      contactPerson,
      website,
      description
    } = body;

    if (!uid) {
      return NextResponse.json({ error: "Faltan datos (UID)" }, { status: 400 });
    }

    // Validaciones básicas
    if (!companyName || !cif) {
      return NextResponse.json({ error: "Faltan datos obligatorios (CIF y Nombre)" }, { status: 400 });
    }

    // 1. VERIFICAR QUE EL USUARIO EXISTA
    const existingUser = await prisma.user.findUnique({
      where: { id: uid }
    });

    if (!existingUser) {
      return NextResponse.json({ error: "Usuario no encontrado. Por favor, completa el onboarding primero." }, { status: 400 });
    }

    // Actualizar el rol si no es COMPANY (por seguridad)
    if (existingUser.role !== Role.COMPANY) {
      await prisma.user.update({
        where: { id: uid },
        data: { role: Role.COMPANY }
      });
    }

    // 2. VERIFICAR SI YA EXISTE PERFIL PARA ESTE USUARIO
    const existingProfile = await prisma.companyProfile.findUnique({
      where: { userId: uid }
    });

    if (existingProfile) {
      // ACTUALIZAR: Solo actualizamos el CIF si es diferente o si no hay conflicto
      // Si el CIF nuevo es diferente y ya existe en otra empresa, mantenemos el anterior
      let updateData: any = {
        companyName,
        address: address || null,
        city: city || null,
        province: province || null,
        phone: phone || null,
        contactPerson: contactPerson || null,
        website: website || null,
        description: description || null
      };

      // Solo actualizar CIF si es diferente del actual
      if (existingProfile.cif !== cif) {
        // Verificar si el nuevo CIF ya está en uso
        const cifExists = await prisma.companyProfile.findUnique({
          where: { cif: cif }
        });
        if (!cifExists) {
          updateData.cif = cif;
        }
        // Si el CIF ya existe en otra empresa, no lo actualizamos (mantenemos el actual)
      }

      const updatedProfile = await prisma.companyProfile.update({
        where: { userId: uid },
        data: updateData
      });

      return NextResponse.json(updatedProfile);
    }

    // 3. CREAR NUEVO PERFIL
    try {
      const newProfile = await prisma.companyProfile.create({
        data: {
          userId: uid,
          cif,
          companyName,
          address: address || null,
          city: city || null,
          province: province || null,
          phone: phone || null,
          contactPerson: contactPerson || null,
          website: website || null,
          description: description || null
        }
      });

      return NextResponse.json(newProfile);
    } catch (createError: any) {
      // Si falla por CIF duplicado
      if (createError.code === 'P2002') {
        return NextResponse.json({
          error: "El CIF ya está registrado en otra empresa. Si crees que es un error, contacta con soporte."
        }, { status: 400 });
      }
      throw createError;
    }

  } catch (error) {
    console.error("Error guardando perfil empresa:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
