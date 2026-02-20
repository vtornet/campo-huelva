// src/app/api/ai/profile-description/route.ts
// API para generar descripciones de perfil con IA + Caché

import { NextRequest, NextResponse } from 'next/server';
import {
  generarDescripcionPerfil,
  generarDescripcionManijero,
  generarDescripcionIngeniero,
  generarDescripcionEncargado,
  generarDescripcionTractorista
} from '@/lib/gemini';
import { withAICache } from '@/lib/ai-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rol, ...datos } = body;

    if (!rol) {
      return NextResponse.json(
        { error: 'Falta especificar el rol (USER, FOREMAN, ENGINEER, ENCARGADO, TRACTORISTA)' },
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

          case 'ENCARGADO':
            return await generarDescripcionEncargado(datos);

          case 'TRACTORISTA':
            return await generarDescripcionTractorista(datos);

          default:
            throw new Error('Rol no soportado');
        }
      }
    );

    return NextResponse.json({ descripcion });
  } catch (error: any) {
    console.error('Error en /api/ai/profile-description:', error);

    // Mejorar mensaje de error para IA no disponible
    const errorMessage = error.message || '';
    if (errorMessage.includes('IA no disponible') || errorMessage.includes('GEMINI_API_KEY')) {
      return NextResponse.json(
        { error: 'IA no disponible. Configura GEMINI_API_KEY en el servidor.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Error al generar la descripción' },
      { status: 500 }
    );
  }
}
