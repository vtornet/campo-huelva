import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Contar usuarios por rol
    const userCount = await prisma.user.count({ where: { role: "USER" } });
    const foremanCount = await prisma.user.count({ where: { role: "FOREMAN" } });
    const companyCount = await prisma.user.count({ where: { role: "COMPANY" } });

    // Contar perfiles
    const workerProfileCount = await prisma.workerProfile.count();
    const foremanProfileCount = await prisma.foremanProfile.count();
    const companyProfileCount = await prisma.companyProfile.count();

    // Obtener algunos usuarios con perfiles
    const workers = await prisma.user.findMany({
      where: { role: "USER" },
      include: { workerProfile: true },
      take: 5,
    });

    const foremen = await prisma.user.findMany({
      where: { role: "FOREMAN" },
      include: { foremanProfile: true },
      take: 5,
    });

    return NextResponse.json({
      counts: {
        users: userCount,
        foremen: foremanCount,
        companies: companyCount,
        workerProfiles: workerProfileCount,
        foremanProfiles: foremanProfileCount,
        companyProfiles: companyProfileCount,
      },
      sampleWorkers: workers.map(w => ({
        id: w.id,
        email: w.email,
        role: w.role,
        hasProfile: !!w.workerProfile,
        profileName: w.workerProfile?.fullName,
      })),
      sampleForemen: foremen.map(f => ({
        id: f.id,
        email: f.email,
        role: f.role,
        hasProfile: !!f.foremanProfile,
        profileName: f.foremanProfile?.fullName,
      })),
    });
  } catch (error) {
    console.error("Error en debug:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
