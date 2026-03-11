// src/app/api/debug/aeat/validate/route.ts
// Valida certificados de múltiples formas

import { NextResponse } from "next/server";
import * as crypto from 'crypto';
import * as fs from 'fs';

export async function GET() {
  const certEnv = process.env.AEAT_CERT_PEM || '';
  const keyEnv = process.env.AEAT_KEY_PEM || '';

  const results: any = {
    cert: {},
    key: {},
    match: false,
  };

  // 1. Analizar estructura del certificado
  try {
    // Extraer contenido base64
    const certMatch = certEnv.match(/-----BEGIN CERTIFICATE-----([^-]+)-----END CERTIFICATE-----/);
    if (certMatch) {
      const base64Content = certMatch[1].replace(/\s/g, '');
      results.cert.base64Length = base64Content.length;
      results.cert.base64Preview = base64Content.substring(0, 50) + '...';

      // Verificar que solo tenga caracteres base64 válidos
      const validBase64 = /^[A-Za-z0-9+/=]+$/.test(base64Content);
      results.cert.validBase64Chars = validBase64;

      if (!validBase64) {
        const invalidChars = base64Content.match(/[^A-Za-z0-9+/=]/g);
        results.cert.invalidChars = [...new Set(invalidChars)];
      }

      // Intentar decodificar base64
      try {
        const decoded = Buffer.from(base64Content, 'base64');
        results.cert.decodedLength = decoded.length;
        results.cert.decodedPreview = decoded.toString('hex').substring(0, 40) + '...';

        // Verificar que sea un certificado DER válido (debe empezar con ciertos bytes)
        const firstBytes = decoded.subarray(0, 4);
        results.cert.firstBytesHex = Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' ');

        // Un certificado X.509 DER válido empieza con 30 82 (SEQUENCE, long form)
        const isValidDer = firstBytes[0] === 0x30 && firstBytes[1] === 0x82;
        results.cert.isValidDer = isValidDer;
      } catch (e) {
        results.cert.decodeError = String(e);
      }
    }
  } catch (e) {
    results.cert.extractError = String(e);
  }

  // 2. Validar con crypto
  try {
    const pubKey = crypto.createPublicKey(certEnv);
    results.cert.cryptoValid = true;
    results.cert.keyInfo = {
      type: pubKey.asymmetricKeyType,
      modulusLength: (pubKey as any).asymmetricKeyDetails?.modulusLength,
    };
  } catch (e: any) {
    results.cert.cryptoError = e.message;
  }

  // 3. Validar clave
  try {
    const privKey = crypto.createPrivateKey(keyEnv);
    results.key.cryptoValid = true;
    results.key.keyInfo = {
      type: privKey.asymmetricKeyType,
      modulusLength: (privKey as any).asymmetricKeyDetails?.modulusLength,
    };
  } catch (e: any) {
    results.key.cryptoError = e.message;
  }

  // 4. Verificar que clave y certificado coinciden
  if (results.cert.cryptoValid && results.key.cryptoValid) {
    try {
      const pubKey = crypto.createPublicKey(certEnv);
      const privKey = crypto.createPrivateKey(keyEnv);

      // Extraer modulus de ambas
      const pubExport = pubKey.export({ format: 'jwk' });
      const privExport = privKey.export({ format: 'jwk' });

      results.match = (pubExport as any).n === (privExport as any).n;
    } catch (e) {
      results.matchError = String(e);
    }
  }

  // 5. Recomendaciones
  results.recommendations = [];

  if (results.cert.invalidChars) {
    results.recommendations.push(`El certificado tiene caracteres inválidos: ${results.cert.invalidChars.join(', ')}`);
  }

  if (results.cert.cryptoError) {
    results.recommendations.push(`Error crypto: ${results.cert.cryptoError}`);
  }

  if (results.key.cryptoError) {
    results.recommendations.push(`Error clave: ${results.key.cryptoError}`);
  }

  if (results.match === false) {
    results.recommendations.push('La clave y el certificado NO coinciden');
  }

  if (results.cert.cryptoValid && results.key.cryptoValid && results.match) {
    results.recommendations.push('✅ Certificado y clave válidos y coinciden');
  }

  return NextResponse.json(results);
}
