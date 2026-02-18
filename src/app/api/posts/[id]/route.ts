// src/app/api/posts/[id]/route.ts
// API para obtener una publicación individual por ID

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
      include: {
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
