import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "No user ID provided" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        companyProfile: true,
        foremanProfile: true,
        engineerProfile: true,
        encargadoProfile: true,
        tractoristProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determinar el perfil activo según el rol
    let selectedProfile = null;
    let effectiveRole = user.role;

    if (user.role === 'ADMIN') {
      selectedProfile = user.workerProfile || null;
    }
    else if (user.role === 'USER') selectedProfile = user.workerProfile;
    else if (user.role === 'FOREMAN') selectedProfile = user.foremanProfile;
    else if (user.role === 'COMPANY') selectedProfile = user.companyProfile;
    else if (user.role === 'ENGINEER') selectedProfile = user.engineerProfile;
    else if (user.role === 'ENCARGADO') selectedProfile = user.encargadoProfile;
    else if (user.role === 'TRACTORISTA') selectedProfile = user.tractoristProfile;

    // Fallback si no hay perfil para el rol
    if (!selectedProfile && effectiveRole !== 'ADMIN') {
      if (user.companyProfile) {
        selectedProfile = user.companyProfile;
        effectiveRole = 'COMPANY';
      } else if (user.foremanProfile) {
        selectedProfile = user.foremanProfile;
        effectiveRole = 'FOREMAN';
      } else if (user.engineerProfile) {
        selectedProfile = user.engineerProfile;
        effectiveRole = 'ENGINEER';
      } else if (user.encargadoProfile) {
        selectedProfile = user.encargadoProfile;
        effectiveRole = 'ENCARGADO';
      } else if (user.tractoristProfile) {
        selectedProfile = user.tractoristProfile;
        effectiveRole = 'TRACTORISTA';
      } else if (user.workerProfile) {
        selectedProfile = user.workerProfile;
        effectiveRole = 'USER';
      }
    }

    return NextResponse.json({
      id: user.id,
      role: effectiveRole,
      profile: selectedProfile,
      email: user.email,
      createdAt: user.createdAt,
    });

  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
