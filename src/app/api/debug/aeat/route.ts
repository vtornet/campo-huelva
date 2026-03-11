// src/app/api/debug/aeat/route.ts
// Endpoint de debug para verificar la configuración de AEAT

import { NextResponse } from "next/server";
import { request as httpRequest } from 'https';

/**
 * Normaliza un certificado o clave PEM
 */
function normalizePem(pem: string): string {
  let cleaned = pem.trim();
  cleaned = cleaned.replace(/\\n/g, '\n');
  const lines = cleaned.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

interface DebugInfo {
  environment: {
    hasCertEnv: boolean;
    hasKeyEnv: boolean;
    certLength: number;
    keyLength: number;
    certPreview: string;
    keyPreview: string;
  };
  normalization: {
    certBefore: number;
    certAfter: number;
    keyBefore: number;
    keyAfter: number;
    error?: string;
  };
  certificate: {
    readable: boolean;
    hasBegin: boolean;
    hasEnd: boolean;
    subject?: string;
    error?: string;
  };
  connection: {
    status: string;
    error?: string;
    response?: string;
  };
}

export async function GET() {
  const certEnv = process.env.AEAT_CERT_PEM || '';
  const keyEnv = process.env.AEAT_KEY_PEM || '';

  const debug: DebugInfo = {
    environment: {
      hasCertEnv: !!certEnv,
      hasKeyEnv: !!keyEnv,
      certLength: certEnv.length,
      keyLength: keyEnv.length,
      certPreview: certEnv.substring(0, 100) + '...',
      keyPreview: keyEnv.substring(0, 100) + '...',
    },
    normalization: {
      certBefore: certEnv.length,
      certAfter: 0,
      keyBefore: keyEnv.length,
      keyAfter: 0,
    },
    certificate: {
      readable: false,
      hasBegin: certEnv.includes('-----BEGIN'),
      hasEnd: certEnv.includes('-----END'),
    },
    connection: {
      status: 'not_attempted',
    },
  };

  // Obtener y normalizar certificado
  let cert: string | null = null;
  let key: string | null = null;

  if (certEnv && keyEnv) {
    try {
      cert = normalizePem(certEnv);
      key = normalizePem(keyEnv);

      debug.normalization.certAfter = cert.length;
      debug.normalization.keyAfter = key.length;

      debug.certificate.readable = true;
    } catch (e: any) {
      debug.normalization.error = e.message;
      debug.certificate.error = e.message;
    }
  }

  // Probar conexión con AEAT
  if (cert && key) {
    try {
      debug.connection.status = 'attempting';

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
        cert: cert,
        key: key,
        rejectUnauthorized: false,
      };

      const response = await new Promise<string>((resolve, reject) => {
        const req = httpRequest(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            const preview = data.length > 500 ? data.substring(0, 500) + '...' : data;
            resolve(`${res.statusCode}: ${res.statusMessage}\n\n${preview}`);
          });
        });
        req.on('error', (e: any) => reject(e));
        req.setTimeout(10000, () => reject(new Error('Timeout after 10s')));
        req.write(testSoap);
        req.end();
      });

      debug.connection.status = 'success';
      debug.connection.response = response;
    } catch (e: any) {
      debug.connection.status = 'error';
      debug.connection.error = e.message;
    }
  } else {
    debug.connection.status = 'no_credentials';
  }

  return NextResponse.json(debug);
}
