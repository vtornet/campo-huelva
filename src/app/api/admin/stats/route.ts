import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [
      totalUsers,
      workers, // USER role
      foremen, // FOREMAN role
      totalCompanies,
      totalPosts,
      pendingReports,
      pendingVerifications,
      bannedUsers,
      silencedUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.user.count({ where: { role: "FOREMAN" } }),
      prisma.companyProfile.count(),
      prisma.post.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.companyProfile.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { isSilenced: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      workers,
      foremen,
      totalCompanies,
      totalPosts,
      pendingReports,
      pendingVerifications,
      bannedUsers,
      silencedUsers,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
