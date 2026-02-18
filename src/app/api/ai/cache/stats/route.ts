// src/app/api/ai/cache/stats/route.ts
// API para obtener estadísticas del caché de IA (solo admin)

import { NextRequest, NextResponse } from 'next/server';
import { getAICacheStats } from '@/lib/ai-cache';

export async function GET(request: NextRequest) {
  try {
    // Verificar que sea admin (opcional pero recomendado)
    // Por ahora, solo para debug en desarrollo

    const stats = getAICacheStats();

    return NextResponse.json({
      size: stats.size,
      entries: stats.entries.map(e => ({
        key: e.key,
        ageMinutes: Math.round(e.age / 60000),
      })),
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de caché:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
