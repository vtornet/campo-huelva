// src/app/api/posts/[id]/route.ts
// API para obtener, editar y eliminar una publicación individual por ID

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const currentUserId = searchParams.get('currentUserId'); // Usuario autenticado actual

    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        province: true,
        type: true,
        status: true,
        taskType: true,
        contractType: true,
        salaryAmount: true,
        salaryPeriod: true,
        hoursPerWeek: true,
        providesAccommodation: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        publisherId: true, // Importante para verificar permisos
        companyId: true, // Importante para verificar permisos
        company: {
          select: {
            id: true,
            companyName: true,
            profileImage: true,
            isApproved: true,
            user: {
              select: {
                id: true,
                email: true,
                role: true
              }
            }
          }
        },
        publisher: {
          select: {
            id: true,
            email: true,
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
            },
            engineerProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            encargadoProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            },
            tractoristProfile: {
              select: {
                fullName: true,
                city: true,
                province: true,
                profileImage: true
              }
            }
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

    // Si hay un usuario autenticado, verificamos si dio like a este post
    let liked = false;
    if (currentUserId) {
      const existingLike = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: currentUserId
          }
        }
      });
      liked = !!existingLike;
    }

    return NextResponse.json({
      ...post,
      liked
    });
  } catch (error) {
    console.error('Error cargando publicación:', error);
    return NextResponse.json(
      { error: 'Error al cargar la publicación' },
      { status: 500 }
    );
  }
}

// PUT: Editar una publicación
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const userId = body.userId; // ID del usuario que hace la petición

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que la publicación existe y pertenece al usuario
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        publisherId: true,
        companyId: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el dueño de la publicación
    if (post.publisherId !== userId && post.companyId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta publicación' },
        { status: 403 }
      );
    }

    // Campos permitidos para editar
    const allowedUpdates = [
      'title',
      'description',
      'location',
      'province',
      'taskType',
      'contractType',
      'providesAccommodation',
      'salaryAmount',
      'salaryPeriod',
      'hoursPerWeek',
      'startDate',
      'endDate'
    ];

    const updateData: any = {};
    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Actualizar la publicación
    const updatedPost = await prisma.post.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error editando publicación:', error);
    return NextResponse.json(
      { error: 'Error al editar la publicación' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar (o archivar) una publicación
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'delete'; // 'delete' o 'archive'

    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verificar que la publicación existe y pertenece al usuario
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        publisherId: true,
        companyId: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Publicación no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el usuario es el dueño de la publicación
    if (post.publisherId !== userId && post.companyId !== userId) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta publicación' },
        { status: 403 }
      );
    }

    if (action === 'archive') {
      // Archivar (cambiar status a HIDDEN)
      await prisma.post.update({
        where: { id },
        data: { status: 'HIDDEN' }
      });
      return NextResponse.json({ success: true, message: 'Publicación archivada' });
    } else {
      // Eliminar permanentemente
      await prisma.post.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, message: 'Publicación eliminada' });
    }
  } catch (error) {
    console.error('Error eliminando publicación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la publicación' },
      { status: 500 }
    );
  }
}
