// src/app/api/ai/improve-offer/route.ts
// API para mejorar la descripción de una oferta con IA + Caché

import { NextRequest, NextResponse } from 'next/server';
import { mejorarDescripcionOferta } from '@/lib/gemini';
import { withAICache } from '@/lib/ai-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, provincia, tipo } = body;

    if (!descripcion) {
      return NextResponse.json(
        { error: 'Falta la descripción a mejorar' },
        { status: 400 }
      );
    }

    const descripcionMejorada = await withAICache(
      'IMPROVE_OFFER',
      { titulo, descripcion, provincia, tipo },
      async () => {
        return await mejorarDescripcionOferta({
          titulo,
          descripcion,
          provincia,
          tipo,
        });
      }
    );

    return NextResponse.json({
      original: descripcion,
      improved: descripcionMejorada
    });

  } catch (error) {
    console.error('Error en /api/ai/improve-offer:', error);
    return NextResponse.json(
      { error: 'Error al mejorar la descripción' },
      { status: 500 }
    );
  }
}
