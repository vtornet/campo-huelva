// src/app/api/ai/profile-description/route.ts
// API para generar descripciones de perfil con IA + Caché

import { NextRequest, NextResponse } from 'next/server';
import { generarDescripcionPerfil, generarDescripcionManijero, generarDescripcionIngeniero } from '@/lib/gemini';
import { withAICache } from '@/lib/ai-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rol, ...datos } = body;

    if (!rol) {
      return NextResponse.json(
        { error: 'Falta especificar el rol (USER, FOREMAN, ENGINEER)' },
        { status: 400 }
      );
    }

    const descripcion = await withAICache(
      'PROFILE_DESCRIPTION',
      { rol, ...datos },
      async () => {
        switch (rol) {
          case 'USER':
          case 'WORKER':
            return await generarDescripcionPerfil(datos);

          case 'FOREMAN':
            return await generarDescripcionManijero(datos);

          case 'ENGINEER':
            return await generarDescripcionIngeniero(datos);

          default:
            throw new Error('Rol no soportado');
        }
      }
    );

    return NextResponse.json({ descripcion });
  } catch (error) {
    console.error('Error en /api/ai/profile-description:', error);
    return NextResponse.json(
      { error: 'Error al generar la descripción' },
      { status: 500 }
    );
  }
}
