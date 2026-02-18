// src/app/api/ai/recommend-workers/route.ts
// API para recomendar trabajadores a una empresa basándose en una oferta + Caché

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { recomendarTrabajadores } from '@/lib/gemini';
import { withAICache } from '@/lib/ai-cache';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, companyId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Falta el postId' },
        { status: 400 }
      );
    }

    // 1. Obtener la oferta
    const oferta = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!oferta) {
      return NextResponse.json(
        { error: 'Oferta no encontrada' },
        { status: 404 }
      );
    }

    // 2. Verificar que la empresa es dueña de la oferta (si se proporciona companyId)
    if (companyId && oferta.companyId !== companyId) {
      return NextResponse.json(
        { error: 'No tienes permiso para ver recomendaciones de esta oferta' },
        { status: 403 }
      );
    }

    // 3. Obtener trabajadores y manijeros con perfil
    const trabajadores = await prisma.user.findMany({
      where: {
        role: { in: ['USER', 'FOREMAN'] },
        isBanned: false,
        OR: [
          { workerProfile: { isNot: null } },
          { foremanProfile: { isNot: null } }
        ]
      },
      include: {
        workerProfile: true,
        foremanProfile: true,
      },
      take: 50,
    });

    if (trabajadores.length === 0) {
      return NextResponse.json({ workers: [] });
    }

    // 4. Obtener los IDs de los trabajadores disponibles (para caché)
    const trabajadoresIds = trabajadores.map(t => t.id).sort();

    // 5. Preparar datos de la oferta para caché
    const ofertaHash = {
      titulo: oferta.title,
      descripcion: oferta.description,
      provincia: oferta.province,
      ubicacion: oferta.location,
      tipo: oferta.type,
    };

    // 6. Usar caché para la recomendación
    const trabajadoresRecomendadosIds = await withAICache(
      'RECOMMEND_WORKERS',
      {
        postId,
        ofertaHash: JSON.stringify(ofertaHash),
        trabajadoresIds: trabajadoresIds.join(','),
      },
      async () => {
        return await recomendarTrabajadores(oferta, trabajadores);
      }
    );

    if (trabajadoresRecomendadosIds.length === 0) {
      return NextResponse.json({ workers: [] });
    }

    // 7. Obtener los trabajadores recomendados completos
    const trabajadoresRecomendados = await prisma.user.findMany({
      where: {
        id: { in: trabajadoresRecomendadosIds }
      },
      select: {
        id: true,
        email: true,
        role: true,
        workerProfile: {
          select: {
            id: true,
            fullName: true,
            city: true,
            province: true,
            phone: true,
            experience: true,
            yearsExperience: true,
            hasVehicle: true,
            canRelocate: true,
            machineryExperience: true,
            phytosanitaryLevel: true,
            foodHandler: true,
            bio: true,
            profileImage: true,
          }
        },
        foremanProfile: {
          select: {
            id: true,
            fullName: true,
            city: true,
            province: true,
            phone: true,
            crewSize: true,
            specialties: true,
            yearsExperience: true,
            hasVan: true,
            ownTools: true,
            workArea: true,
            bio: true,
            profileImage: true,
          }
        }
      }
    });

    // 8. Ordenar según el orden de recomendación de la IA
    const trabajadoresOrdenados = trabajadoresRecomendadosIds
      .map(id => trabajadoresRecomendados.find(u => u.id === id))
      .filter(Boolean);

    return NextResponse.json({ workers: trabajadoresOrdenados });

  } catch (error) {
    console.error('Error en /api/ai/recommend-workers:', error);
    return NextResponse.json(
      { error: 'Error al generar recomendaciones de trabajadores' },
      { status: 500 }
    );
  }
}
