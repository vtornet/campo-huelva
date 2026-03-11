// src/app/api/debug/aeat/route.ts
// Endpoint de debug para verificar la configuración de AEAT

import { NextResponse } from "next/server";
import * as fs from 'fs';
import * as path from 'path';
import { request as httpRequest } from 'https';

interface DebugInfo {
  environment: {
    hasCertEnv: boolean;
    hasKeyEnv: boolean;
    certLength: number;
    keyLength: number;
  };
  files: {
    certExists: boolean;
    keyExists: boolean;
  };
  certificate: {
    readable: boolean;
    subject?: string;
    issuer?: string;
    validFrom?: string;
    validTo?: string;
    expired?: boolean;
    error?: string;
  };
  connection: {
    status: string;
    error?: string;
    response?: string;
  };
}

export async function GET() {
  const debug: DebugInfo = {
    environment: {
      hasCertEnv: !!process.env.AEAT_CERT_PEM,
      hasKeyEnv: !!process.env.AEAT_KEY_PEM,
      certLength: process.env.AEAT_CERT_PEM?.length || 0,
      keyLength: process.env.AEAT_KEY_PEM?.length || 0,
    },
    files: {
      certExists: fs.existsSync(path.join(process.cwd(), 'certs', 'cert.pem')),
      keyExists: fs.existsSync(path.join(process.cwd(), 'certs', 'key.pem')),
    },
    certificate: {
      readable: false,
    },
    connection: {
      status: 'not_attempted',
    },
  };

  // Obtener certificado desde variables de entorno
  let cert: string | null = null;
  let key: string | null = null;

  const certEnv = process.env.AEAT_CERT_PEM;
  const keyEnv = process.env.AEAT_KEY_PEM;

  if (certEnv && keyEnv) {
    // Convertir \n a saltos de línea
    cert = certEnv.replace(/\\n/g, '\n');
    key = keyEnv.replace(/\\n/g, '\n');
  }

  // Intentar leer certificado para extraer información
  if (cert) {
    try {
      // Extraer información básica del certificado PEM
      const certMatch = cert.match(/-----BEGIN CERTIFICATE-----([^-]+)-----END CERTIFICATE-----/);
      if (certMatch) {
        debug.certificate.readable = true;

        // Intentar decodificar el certificado para obtener información
        try {
          const base64Cert = certMatch[1].replace(/\s/g, '');
          const buffer = Buffer.from(base64Cert, 'base64');

          // Extraer campos del certificado (formato DER/PEM básico)
          const certStr = buffer.toString('latin1');

          // Buscar patrones comunes en certificados
          const cnMatch = cert.match(/CN=([^,\n]+)/i);
          const oMatch = cert.match(/O=([^,\n]+)/i);
          const ouMatch = cert.match(/OU=([^,\n]+)/i);

          if (cnMatch || oMatch) {
            debug.certificate.subject = `${oMatch?.[1] || ''} ${cnMatch?.[1] || ''}`.trim();
          }
        } catch (e) {
          debug.certificate.error = `No se pudo decodificar: ${e}`;
        }
      }
    } catch (e: any) {
      debug.certificate.error = e.message;
    }
  } else {
    debug.certificate.error = 'No hay certificado configurado';
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
          res.on('end', () => resolve(`${res.statusCode}: ${res.statusMessage}\n\n${data.substring(0, 500)}`));
          res.on('error', reject);
        });
        req.on('error', reject);
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

  // No incluir el certificado completo en la respuesta por seguridad
  return NextResponse.json(debug);
}
