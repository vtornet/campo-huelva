import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Obtener perfil público de un usuario
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    if (!userId) {
      return NextResponse.json({ error: "Falta ID de usuario" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        banReason: true,
        createdAt: true,
        workerProfile: {
          select: {
            fullName: true,
            province: true,
            city: true,
            phone: true,
            bio: true,
            profileImage: true,
            experience: true,
            toolsExperience: true,
            hasVehicle: true,
            yearsExperience: true,
          },
        },
        foremanProfile: {
          select: {
            fullName: true,
            province: true,
            city: true,
            phone: true,
            bio: true,
            profileImage: true,
            crewSize: true,
            hasVan: true,
            yearsExperience: true,
            specialties: true,
          },
        },
        engineerProfile: {
          select: {
            fullName: true,
            province: true,
            city: true,
            phone: true,
            bio: true,
            profileImage: true,
            collegiateNumber: true,
            yearsExperience: true,
            specialties: true,
            servicesOffered: true,
            cropExperience: true,
          },
        },
        encargadoProfile: {
          select: {
            fullName: true,
            province: true,
            city: true,
            phone: true,
            bio: true,
            profileImage: true,
            yearsExperience: true,
            canDriveTractor: true,
            cropExperience: true,
            warehouseExperience: true,
            hasFarmTransformation: true,
            hasOfficeSkills: true,
            hasReportSkills: true,
          },
        },
        tractoristProfile: {
          select: {
            fullName: true,
            province: true,
            city: true,
            phone: true,
            bio: true,
            profileImage: true,
            machineryTypes: true,
            toolTypes: true,
            yearsExperience: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Ocultar email parcialmente
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    return NextResponse.json({
      ...user,
      email: maskedEmail,
    });
  } catch (error) {
    console.error("Error al obtener perfil de usuario:", error);
    return NextResponse.json(
      { error: "Error al obtener el perfil" },
      { status: 500 }
    );
  }
}
