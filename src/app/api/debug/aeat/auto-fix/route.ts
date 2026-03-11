// src/app/api/debug/aeat/auto-fix/route.ts
// Limpia automáticamente los certificados de las variables de entorno y prueba conexión

import { NextResponse } from "next/server";
import * as crypto from 'crypto';
import { request as httpRequest } from 'https';

/**
 * Limpia agresivamente el contenido base64
 */
function cleanBase64(content: string): string {
  return content.replace(/[^A-Za-z0-9+/=]/g, '');
}

/**
 * Reconstruye un PEM desde variables de entorno
 */
function rebuildPem(pem: string, type: 'CERTIFICATE' | 'PRIVATE KEY' | 'RSA PRIVATE KEY'): string {
  // Extraer solo el contenido base64
  const match = pem.match(new RegExp(`-----BEGIN ${type}-----([^-]+)-----END ${type}-----`, 's'));
  if (!match) {
    throw new Error(`No se encontraron marcadores ${type}`);
  }

  const base64Content = cleanBase64(match[1]);
  return `-----BEGIN ${type}-----\n${base64Content}\n-----END ${type}-----`;
}

/**
 * Prueba conexión con AEAT
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

  if (!certEnv || !keyEnv) {
    return NextResponse.json({ error: 'No hay variables de entorno configuradas' }, { status: 400 });
  }

  const results: any = {
    original: {
      certValid: false,
      keyValid: false,
    },
    rebuilt: {
      certValid: false,
      keyValid: false,
      certPreview: '',
      keyPreview: '',
    },
    connectionTest: null,
    fixedValues: null,
  };

  // 1. Probar valores originales
  try {
    crypto.createPublicKey(certEnv);
    results.original.certValid = true;
  } catch (e: any) {
    results.original.certError = String(e);
  }

  try {
    crypto.createPrivateKey(keyEnv);
    results.original.keyValid = true;
  } catch (e: any) {
    results.original.keyError = String(e);
  }

  // 2. Reconstruir PEMs limpiando el base64
  let rebuiltCert: string | null = null;
  let rebuiltKey: string | null = null;

  try {
    // Detectar tipo de clave
    const isRsa = keyEnv.includes('BEGIN RSA PRIVATE KEY');
    const keyType = isRsa ? 'RSA PRIVATE KEY' : 'PRIVATE KEY';

    rebuiltCert = rebuildPem(certEnv, 'CERTIFICATE');
    rebuiltKey = rebuildPem(keyEnv, keyType);

    results.rebuilt.certPreview = rebuiltCert.substring(0, 100) + '...';
    results.rebuilt.keyPreview = rebuiltKey.substring(0, 100) + '...';

    // Validar reconstruidos
    crypto.createPublicKey(rebuiltCert);
    results.rebuilt.certValid = true;

    crypto.createPrivateKey(rebuiltKey);
    results.rebuilt.keyValid = true;

    // 3. Probar conexión
    results.connectionTest = await testConnection(rebuiltCert, rebuiltKey);

    if (results.connectionTest.success) {
      // Devolver los valores limpios para que el usuario pueda copiarlos
      results.fixedValues = {
        AEAT_CERT_PEM: rebuiltCert,
        AEAT_KEY_PEM: rebuiltKey,
        message: '✅ Certificados limpiados. Copia estos valores a Railway.',
      };
    }
  } catch (e: any) {
    results.rebuiltError = String(e);
  }

  return NextResponse.json(results);
}
