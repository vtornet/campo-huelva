import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30"; // días

    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Usuarios activos diarios/semanales/mensuales
    const [totalUsers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          OR: [
            { posts: { some: { createdAt: { gte: startDate } } } },
            { applications: { some: { createdAt: { gte: startDate } } } },
            { sentMessages: { some: { createdAt: { gte: startDate } } } },
            { receivedMessages: { some: { createdAt: { gte: startDate } } } },
          ],
        },
      }),
    ]);

    // Usuarios activos por día (últimos 30 días)
    const dailyActiveUsers = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const count = await prisma.user.count({
        where: {
          OR: [
            { posts: { some: { createdAt: { gte: dayStart, lte: dayEnd } } } },
            { applications: { some: { createdAt: { gte: dayStart, lte: dayEnd } } } },
            { sentMessages: { some: { createdAt: { gte: dayStart, lte: dayEnd } } } },
            { receivedMessages: { some: { createdAt: { gte: dayStart, lte: dayEnd } } } },
          ],
        },
      });

      dailyActiveUsers.push({
        date: dayStart.toISOString().split('T')[0],
        count,
      });
    }

    // 2. Ofertas publicadas vs. cubiertas
    const [totalPosts, officialPosts, filledPosts] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { type: "OFFICIAL" } }),
      prisma.application.count({ where: { status: "ACCEPTED" } }),
    ]);

    // Ofertas por estado
    const postsByStatus = await prisma.post.groupBy({
      by: ['status'],
      _count: true,
    });

    // 3. Tiempo medio de contratación (en días)
    const acceptedApplications = await prisma.application.findMany({
      where: { status: "ACCEPTED" },
      include: {
        post: {
          select: { createdAt: true },
        },
      },
      take: 1000,
    });

    let avgHiringTime = 0;
    if (acceptedApplications.length > 0) {
      const totalDays = acceptedApplications.reduce((sum, app) => {
        const postCreated = new Date(app.post.createdAt).getTime();
        const appUpdated = new Date(app.updatedAt).getTime();
        return sum + (appUpdated - postCreated) / (1000 * 60 * 60 * 24);
      }, 0);
      avgHiringTime = Math.round((totalDays / acceptedApplications.length) * 10) / 10;
    }

    // 4. Roles más activos (últimos 30 días)
    const roleActivity = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        _all: true,
      },
      where: {
        OR: [
          { posts: { some: { createdAt: { gte: startDate } } } },
          { applications: { some: { createdAt: { gte: startDate } } } },
        ],
      },
      orderBy: {
        _count: {
          role: 'desc',
        },
      },
    });

    // Total de usuarios por rol (para contexto)
    const totalByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });

    // 5. Provincias con más actividad
    const activeProvinces = await prisma.post.groupBy({
      by: ['province'],
      _count: {
        _all: true,
      },
      where: {
        createdAt: { gte: startDate },
        province: { not: null },
      },
      orderBy: {
        _count: {
          province: 'desc',
        },
      },
      take: 10,
    });

    // Usuarios por provincia
    const usersByProvince = await prisma.workerProfile.groupBy({
      by: ['province'],
      _count: true,
      where: {
        province: { not: null },
      },
      orderBy: {
        _count: {
          province: 'desc',
        },
      },
      take: 10,
    });

    // Estadísticas adicionales
    const [totalApplications, pendingApplications, boardPosts] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({ where: { status: "PENDING" } }),
      prisma.boardPost.count(),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
        dailyActiveUsers,
      },
      posts: {
        total: totalPosts,
        official: officialPosts,
        board: boardPosts,
        filled: filledPosts,
        fillRate: officialPosts > 0 ? Math.round((filledPosts / officialPosts) * 100) : 0,
        byStatus: postsByStatus.map(s => ({
          status: s.status,
          count: s._count,
        })),
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        avgHiringTime,
      },
      roles: {
        active: roleActivity.map(r => ({
          role: r.role,
          active: (r._count as any)._all || 0,
          total: (totalByRole.find(t => t.role === r.role)?._count as any)?._all || 0,
        })),
        total: totalByRole.map(r => ({
          role: r.role,
          total: (r._count as any)._all || 0,
        })),
      },
      provinces: {
        posts: activeProvinces.filter(p => p.province).map(p => ({
          province: p.province!,
          count: (p._count as any)._all || 0,
        })),
        users: usersByProvince.filter(p => p.province).map(p => ({
          province: p.province!,
          count: (p._count as any)._all || 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
