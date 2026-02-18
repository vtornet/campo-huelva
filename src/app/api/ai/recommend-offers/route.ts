// src/app/api/ai/recommend-offers/route.ts
// API para recomendar ofertas a un trabajador basándose en su perfil + Caché

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recomendarOfertas } from '@/lib/gemini';
import { withAICache } from '@/lib/ai-cache';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Falta el userId' },
        { status: 400 }
      );
    }

    // 1. Obtener el perfil completo del trabajador
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        foremanProfile: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // 2. Obtener ofertas activas (OFICIAL y SHARED)
    const ofertas = await prisma.post.findMany({
      where: {
        type: { in: ['OFFICIAL', 'SHARED'] },
      },
      take: 20,
      orderBy: { id: 'desc' } // Usamos id para consistencia
    });

    if (ofertas.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    // 3. Preparar el perfil para enviar a la IA
    let perfilParaIA: any = {
      rol: user.role,
      email: user.email,
    };

    if (user.workerProfile) {
      perfilParaIA = {
        ...perfilParaIA,
        nombre: user.workerProfile.fullName,
        provincia: user.workerProfile.province,
        ciudad: user.workerProfile.city,
        experiencia: user.workerProfile.experience,
        anyosExperiencia: user.workerProfile.yearsExperience,
        tieneVehiculo: user.workerProfile.hasVehicle,
        puedeRelocarse: user.workerProfile.canRelocate,
        maquinaria: user.workerProfile.machineryExperience,
        fitosanitario: user.workerProfile.phytosanitaryLevel,
        manipuladorAlimentos: user.workerProfile.foodHandler,
      };
    } else if (user.foremanProfile) {
      perfilParaIA = {
        ...perfilParaIA,
        nombre: user.foremanProfile.fullName,
        provincia: user.foremanProfile.province,
        ciudad: user.foremanProfile.city,
        tamanoCuadrilla: user.foremanProfile.crewSize,
        especialidades: user.foremanProfile.specialties,
        anyosExperiencia: user.foremanProfile.yearsExperience,
        tieneFurgoneta: user.foremanProfile.hasVan,
        herramientasPropias: user.foremanProfile.ownTools,
        zonaTrabajo: user.foremanProfile.workArea,
      };
    }

    // 4. Obtener los IDs de las ofertas disponibles (para caché)
    const ofertasIds = ofertas.map(o => o.id).sort();

    // 5. Usar caché para la recomendación (basado en perfil + ofertas disponibles)
    const ofertasRecomendadasIds = await withAICache(
      'RECOMMEND_OFFERS',
      {
        userId,
        perfilHash: JSON.stringify(perfilParaIA),
        ofertasIds: ofertasIds.join(','),
      },
      async () => {
        return await recomendarOfertas(perfilParaIA, ofertas);
      }
    );

    // 6. Si no hay recomendaciones, devolver array vacío
    if (ofertasRecomendadasIds.length === 0) {
      return NextResponse.json({ offers: [] });
    }

    // 7. Obtener las ofertas recomendadas completas
    const ofertasRecomendadas = await prisma.post.findMany({
      where: {
        id: { in: ofertasRecomendadasIds }
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            profileImage: true,
            isApproved: true,
          }
        },
        publisher: {
          select: {
            id: true,
            role: true,
            workerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            foremanProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                crewSize: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    // 8. Ordenar según el orden de recomendación de la IA
    const ofertasOrdenadas = ofertasRecomendadasIds
      .map(id => ofertasRecomendadas.find(o => o.id === id))
      .filter(Boolean);

    return NextResponse.json({ offers: ofertasOrdenadas });

  } catch (error) {
    console.error('Error en /api/ai/recommend-offers:', error);
    return NextResponse.json(
      { error: 'Error al generar recomendaciones' },
      { status: 500 }
    );
  }
}
