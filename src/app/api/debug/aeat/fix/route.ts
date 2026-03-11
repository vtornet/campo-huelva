// src/app/api/debug/aeat/fix/route.ts
// Endpoint para intentar limpiar y arreglar certificados AEAT

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import * as crypto from 'crypto';

/**
 * Limpia agresivamente un certificado PEM
 */
function aggressiveClean(pem: string): string {
  // 1. Convertir \n literales a saltos de línea
  let cleaned = pem.replace(/\\n/g, '\n');

  // 2. Eliminar TODOS los espacios en blanco (incluyendo tabs, etc.)
  // Esto es más agresivo que trim()
  cleaned = cleaned.replace(/\s+/g, ' ');

  // 3. Restaurar los saltos de línea que necesitamos
  const lines = cleaned.split('\n');
  const cleanedLines: string[] = [];

  for (let line of lines) {
    // Para líneas de contenido base64, eliminar absolutamente todos los espacios
    if (!line.includes('-----')) {
      line = line.replace(/\s/g, '');
    } else {
      // Para líneas de marcadores, solo hacer trim
      line = line.trim();
    }

    if (line.length > 0) {
      cleanedLines.push(line);
    }
  }

  return cleanedLines.join('\n');
}

/**
 * Extrae y limpia el contenido base64 del certificado
 */
function extractAndCleanCert(pem: string): { success: boolean; cert?: string; error?: string } {
  try {
    // Buscar el contenido entre BEGIN y END
    const match = pem.match(/-----BEGIN CERTIFICATE-----([^-]+)-----END CERTIFICATE-----/);
    if (!match) {
      return { success: false, error: 'No se encontraron marcadores CERTIFICATE' };
    }

    // Obtener el contenido base64 y limpiarlo agresivamente
    let base64Content = match[1];
    // Eliminar ABSOLUTAMENTE todo lo que no sea base64 válido
    base64Content = base64Content.replace(/[^A-Za-z0-9+/=]/g, '');

    // Reconstruir el PEM
    const cert = `-----BEGIN CERTIFICATE-----\n${base64Content}\n-----END CERTIFICATE-----`;

    // Validar que pueda ser usado
    try {
      crypto.createPublicKey(cert);
      return { success: true, cert };
    } catch (e) {
      return { success: false, error: `Validación falló: ${e}` };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Extrae y limpia la clave privada
 */
function extractAndCleanKey(pem: string): { success: boolean; key?: string; error?: string } {
  try {
    // Buscar el contenido entre BEGIN y END (soportar diferentes tipos)
    const match = pem.match(/-----BEGIN (?:RSA )?PRIVATE KEY-----([^-]+)-----END (?:RSA )?PRIVATE KEY-----/);
    if (!match) {
      return { success: false, error: 'No se encontraron marcadores PRIVATE KEY' };
    }

    // Obtener el contenido base64 y limpiarlo
    let base64Content = match[1];
    base64Content = base64Content.replace(/[^A-Za-z0-9+/=]/g, '');

    // Determinar el tipo de clave
    const isRsa = pem.includes('BEGIN RSA PRIVATE KEY');
    const header = isRsa ? '-----BEGIN RSA PRIVATE KEY-----' : '-----BEGIN PRIVATE KEY-----';
    const footer = isRsa ? '-----END RSA PRIVATE KEY-----' : '-----END PRIVATE KEY-----';

    const key = `${header}\n${base64Content}\n${footer}`;

    // Validar
    try {
      crypto.createPrivateKey(key);
      return { success: true, key };
    } catch (e) {
      return { success: false, error: `Validación falló: ${e}` };
    }
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cert, key } = body;

  if (!cert || !key) {
    return NextResponse.json({ error: 'Se necesitan cert y key en el body' }, { status: 400 });
  }

  const results = {
    cert: {
      original: cert.substring(0, 100) + '...',
      originalLength: cert.length,
      aggressiveClean: null as string | null,
      extractClean: null as { success: boolean; cert?: string; error?: string } | null,
    },
    key: {
      original: key.substring(0, 100) + '...',
      originalLength: key.length,
      aggressiveClean: null as string | null,
      extractClean: null as { success: boolean; key?: string; error?: string } | null,
    },
    tests: {
      originalCombination: false,
      cleanedCombination: false,
      extractedCombination: false,
    }
  };

  // 1. Probar combinación original
  try {
    crypto.createPublicKey(cert);
    crypto.createPrivateKey(key);
    results.tests.originalCombination = true;
  } catch {}

  // 2. Limpieza agresiva
  const cleanedCert = aggressiveClean(cert);
  const cleanedKey = aggressiveClean(key);

  results.cert.aggressiveClean = cleanedCert.substring(0, 100) + '...';
  results.key.aggressiveClean = cleanedKey.substring(0, 100) + '...';

  try {
    crypto.createPublicKey(cleanedCert);
    crypto.createPrivateKey(cleanedKey);
    results.tests.cleanedCombination = true;
  } catch {}

  // 3. Extracción y limpieza
  const extractedCert = extractAndCleanCert(cert);
  const extractedKey = extractAndCleanKey(key);

  results.cert.extractClean = extractedCert;
  results.key.extractClean = extractedKey;

  if (extractedCert.success && extractedKey.success) {
    results.tests.extractedCombination = true;

    // Devolver los certificados limpios para que el usuario pueda copiarlos
    return NextResponse.json({
      ...results,
      fixed: {
        cert: extractedCert.cert,
        key: extractedKey.key,
        message: '✅ Certificados limpiados correctamente. Copia estos valores a Railway.',
      }
    });
  }

  return NextResponse.json(results);
}
