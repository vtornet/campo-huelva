import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "No UID provided" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: uid },
      include: {
        workerProfile: true,
        companyProfile: true,
        foremanProfile: true,
      },
    });

    if (!user) return NextResponse.json({ exists: false });

    // === LÓGICA DE AUTO-CORRECCIÓN ===
    let selectedProfile = null;
    let effectiveRole = user.role; // Empezamos confiando en el rol de la BD

    // 1. Intento estricto (lo que dice el rol)
    if (user.role === 'USER') selectedProfile = user.workerProfile;
    else if (user.role === 'FOREMAN') selectedProfile = user.foremanProfile;
    else if (user.role === 'COMPANY') selectedProfile = user.companyProfile;

    // 2. FALLBACK INTELIGENTE (Si falló lo anterior, buscamos qué perfil existe realmente)
    if (!selectedProfile) {
      if (user.foremanProfile) {
        selectedProfile = user.foremanProfile;
        effectiveRole = 'FOREMAN'; // Corregimos el rol para el Frontend
      } else if (user.companyProfile) {
        selectedProfile = user.companyProfile;
        effectiveRole = 'COMPANY';
      } else if (user.workerProfile) {
        selectedProfile = user.workerProfile;
        effectiveRole = 'USER';
      }
    }

    return NextResponse.json({ 
        exists: true, 
        ...user, 
        role: effectiveRole, // Enviamos el rol CORREGIDO para que la UI cargue la ficha correcta
        profile: selectedProfile 
    });

  } catch (error) {
    console.error("Error fetching user identity:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}