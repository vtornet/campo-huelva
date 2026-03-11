// src/app/api/debug/aeat/detailed/route.ts
// Endpoint de debug detallado para certificados AEAT

import { NextResponse } from "next/server";
import * as crypto from 'crypto';
import { request as httpRequest } from 'https';

/**
 * Normaliza un certificado o clave PEM
 */
function normalizePem(pem: string): string {
  let cleaned = pem.replace(/\\n/g, '\n');
  const lines = cleaned.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Analiza una clave PEM para determinar su tipo
 */
function analyzeKey(keyPem: string): { type: string; info: string; valid?: boolean } {
  try {
    // Eliminar espacios y normalizar
    const normalized = normalizePem(keyPem);

    // Detectar tipo de clave
    if (normalized.includes('-----BEGIN RSA PRIVATE KEY-----')) {
      return { type: 'PKCS#1 (RSA)', info: 'Formato tradicional RSA. Debería funcionar con Node.js.' };
    }
    if (normalized.includes('-----BEGIN PRIVATE KEY-----')) {
      return { type: 'PKCS#8', info: 'Formato PKCS#8 sin cifrar. Debería funcionar con Node.js.' };
    }
    if (normalized.includes('-----BEGIN ENCRYPTED PRIVATE KEY-----')) {
      return { type: 'PKCS#8 Encrypted', info: 'Clave cifrada con contraseña. Necesita descifrarse.' };
    }
    if (normalized.includes('-----BEGIN EC PRIVATE KEY-----')) {
      return { type: 'EC Private Key', info: 'Clave para curvas elípticas. No compatible con certificados RSA.' };
    }

    // Intentar validar con crypto
    try {
      crypto.createPrivateKey(normalized);
      return { type: 'Unknown', info: 'Formato no reconocido pero crypto lo acepta', valid: true };
    } catch {
      return { type: 'Unknown', info: 'Formato no reconocido y crypto lo rechaza', valid: false };
    }
  } catch (e) {
    return { type: 'Error', info: String(e) };
  }
}

/**
 * Analiza un certificado PEM
 */
function analyzeCert(certPem: string): { type: string; subject?: string; issuer?: string; valid?: boolean; error?: string } {
  try {
    const normalized = normalizePem(certPem);

    try {
      const cert = crypto.createCertificate(normalized);

      return {
        type: 'X.509 Certificate',
        subject: cert.subject?.CN || cert.subject?.O || 'No disponible',
        issuer: cert.issuer?.O || cert.issuer?.CN || 'No disponible',
        valid: true,
      };
    } catch (cryptoError) {
      return {
        type: 'X.509 Certificate',
        error: `crypto.createCertificate falló: ${cryptoError}`,
        valid: false,
      };
    }
  } catch (e) {
    return { type: 'Error', error: String(e) };
  }
}

/**
 * Intenta probar diferentes combinaciones de cert/clave
 */
async function testConnection(cert: string, key: string): Promise<{ success: boolean; error?: string; response?: string }> {
  const testSoap = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://www2.agenciatributaria.es/es13/ws/sgtific/V1/0/Service">
  <soapenv:Header/>
  <soapenv:Body>
    <ser:ContribuyentesES007_ObtenerNoObservaciones>
      <ser:Nif>B12345678</ser:Nif>
    </ser:ContribuyentesES007_ObtenerNoObservaciones>
  </soapenv:Body>
</soapenv:Envelope>`;

  const options = {
    hostname: 'www1.agenciatributaria.es',
    port: 443,
    path: '/es13/ws/sgtific/V1/0/Service',
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'SOAPAction': '"http://www2.agenciatributaria.es/es13/ws/sgtific/V1/0/Service/ContribuyentesES007_ObtenerNoObservaciones"',
    },
    cert,
    key,
    rejectUnauthorized: false,
  };

  try {
    const response = await new Promise<string>((resolve, reject) => {
      const req = httpRequest(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          const preview = data.length > 300 ? data.substring(0, 300) + '...' : data;
          resolve(`${res.statusCode}: ${res.statusMessage}\n\n${preview}`);
        });
      });
      req.on('error', reject);
      req.setTimeout(10000, () => reject(new Error('Timeout')));
      req.write(testSoap);
      req.end();
    });

    return { success: true, response };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function GET() {
  const certEnv = process.env.AEAT_CERT_PEM || '';
  const keyEnv = process.env.AEAT_KEY_PEM || '';

  let cert: string | null = null;
  let key: string | null = null;
  let normalizationError: string | null = null;

  // Normalizar certificado
  try {
    if (certEnv) {
      cert = normalizePem(certEnv);
    }
  } catch (e: any) {
    normalizationError = `Cert: ${e.message}`;
  }

  // Normalizar clave
  try {
    if (keyEnv) {
      key = normalizePem(keyEnv);
    }
  } catch (e: any) {
    if (normalizationError) normalizationError += ', ';
    normalizationError += `Key: ${e.message}`;
  }

  // Analizar certificado
  const certAnalysis = cert ? analyzeCert(certEnv) : null;

  // Analizar clave
  const keyAnalysis = key ? analyzeKey(keyEnv) : null;

  // Probar conexión solo si tenemos ambos
  let connectionTest = null;
  if (cert && key) {
    connectionTest = await testConnection(cert, key);
  }

  return NextResponse.json({
    environment: {
      hasCertEnv: !!certEnv,
      hasKeyEnv: !!keyEnv,
      certLength: certEnv.length,
      keyLength: keyEnv.length,
    },
    normalization: {
      certBefore: certEnv.length,
      certAfter: cert?.length || 0,
      keyBefore: keyEnv.length,
      keyAfter: key?.length || 0,
      error: normalizationError,
    },
    certAnalysis,
    keyAnalysis,
    connectionTest,
  });
}
