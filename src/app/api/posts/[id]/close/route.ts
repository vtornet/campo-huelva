// src/app/api/posts/[id]/close/route.ts
// API para cerrar o reabrir una oferta de empleo

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST: Alternar estado cerrado/abierto de una oferta
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, action } = body; // action: 'close' o 'reopen'

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que la publicación existe
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        publisherId: true,
        companyId: true,
        type: true,
        company: {
          select: {
            userId: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Solo las empresas pueden cerrar sus ofertas OFICIALES
    if (post.type !== 'OFFICIAL') {
      return NextResponse.json(
        { error: 'Solo se pueden cerrar ofertas oficiales de empresas' },
        { status: 403 }
      );
    }

    // Verificar que el usuario es el dueño (empresa)
    // companyId es el ID del CompanyProfile, necesitamos comparar con el userId del User
    const companyUserId = post.company?.userId;
    if (companyUserId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para modificar esta oferta' },
        { status: 403 }
      );
    }

    // Determinar nuevo estado
    const willClose = action === 'close';

    // Actualizar la oferta
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        isClosed: willClose,
        closedAt: willClose ? new Date() : null
      },
      select: {
        id: true,
        isClosed: true,
        closedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      isClosed: updatedPost.isClosed,
      message: willClose ? 'Oferta cerrada correctamente' : 'Oferta reabierta correctamente'
    });
  } catch (error) {
    console.error('Error al cerrar/reabrir oferta:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la oferta' },
      { status: 500 }
    );
  }
}
