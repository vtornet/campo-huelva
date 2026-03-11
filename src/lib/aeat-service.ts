// src/lib/aeat-service.ts
// Servicio de verificación de CIF con la Agencia Tributaria (AEAT)
// Implementa comunicación SOAP directa con certificado digital

import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { request as httpRequest } from 'https';

/**
 * Resultado de la verificación de una empresa
 */
export interface CompanyVerificationResult {
  /** Indica si la verificación fue exitosa */
  success: boolean;
  /** Método usado para la verificación */
  method: "AEAT" | "LOCAL";
  /** Datos de la empresa si se encontró */
  company?: {
    cif: string;
    razonSocial: string;
    direccion?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
    situacion?: string; // Activa, Baja, etc.
  };
  /** Error si falló la verificación */
  error?: string;
  /** Indica si el CIF tiene formato válido (verificación local) */
  validFormat?: boolean;
}

/**
 * Normaliza un certificado o clave PEM para asegurar que tenga el formato correcto
 */
function normalizePem(pem: string): string {
  // Limpiar espacios en blanco al inicio y final
  let cleaned = pem.trim();

  // Si contiene \n literales, convertirlos a saltos de línea
  cleaned = cleaned.replace(/\\n/g, '\n');

  // Asegurar que cada línea del PEM no tenga espacios extra
  const lines = cleaned.split('\n');
  const normalized = lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  // Verificar que tenga los marcadores correctos
  if (!normalized.includes('-----BEGIN')) {
    throw new Error('El certificado no tiene el formato PEM válido (falta BEGIN)');
  }
  if (!normalized.includes('-----END')) {
    throw new Error('El certificado no tiene el formato PEM válido (falta END)');
  }

  return normalized;
}

/**
 * Obtiene el certificado digital desde archivos
 */
function getAeatCredentials(): { cert: string; key: string } | null {
  // Primero intentar desde variables de entorno (Railway)
  const certEnv = process.env.AEAT_CERT_PEM;
  const keyEnv = process.env.AEAT_KEY_PEM;

  if (certEnv && keyEnv) {
    try {
      console.log("AEAT: Leyendo certificados desde variables de entorno");
      console.log("AEAT: Certificado length:", certEnv.length, "Key length:", keyEnv.length);

      // Normalizar ambos certificados
      const cert = normalizePem(certEnv);
      const key = normalizePem(keyEnv);

      console.log("AEAT: Certificados normalizados correctamente");
      return { cert, key };
    } catch (error: any) {
      console.error("AEAT: Error normalizando certificados desde variables de entorno:", error.message);
      // Continuar a intentar desde archivos
    }
  } else {
    console.log("AEAT: No hay variables de entorno AEAT_CERT_PEM o AEAT_KEY_PEM");
  }

  // Si no hay variables, intentar desde archivos
  const certPath = path.join(process.cwd(), 'certs', 'cert.pem');
  const keyPath = path.join(process.cwd(), 'certs', 'key.pem');

  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const cert = fs.readFileSync(certPath, 'utf-8');
      const key = fs.readFileSync(keyPath, 'utf-8');
      console.log("AEAT: Certificados leídos desde archivos");
      return { cert, key };
    }
  } catch (error: any) {
    console.error("AEAT: Error leyendo archivos de certificado:", error.message);
  }

  console.log("AEAT: No se encontraron credenciales");
  return null;
}

/**
 * Construye el envelope SOAP para la petición de verificación de NIF/CIF
 */
function buildSoapEnvelope(cif: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://www2.agenciatributaria.es/es13/ws/sgtific/V1/0/Service">
  <soapenv:Header/>
  <soapenv:Body>
    <ser:ContribuyentesES007_ObtenerNoObservaciones>
      <ser:Nif>${cif}</ser:Nif>
    </ser:ContribuyentesES007_ObtenerNoObservaciones>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parsea la respuesta XML de AEAT
 */
function parseAeatResponse(xmlText: string): {
  razonSocial: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  situacion?: string;
} | null {
  try {
    const matchNombre = xmlText.match(/<Nombre[^>]*>([^<]+)<\/Nombre>/);
    const matchRazon = xmlText.match(/<RazonSocial[^>]*>([^<]+)<\/RazonSocial>/);
    const matchDireccion = xmlText.match(/<Direccion[^>]*>([^<]+)<\/Direccion>/);
    const matchDomicilio = xmlText.match(/<Domicilio[^>]*>([^<]+)<\/Domicilio>/);
    const matchLocalidad = xmlText.match(/<Localidad[^>]*>([^<]+)<\/Localidad>/);
    const matchProvincia = xmlText.match(/<Provincia[^>]*>([^<]+)<\/Provincia>/);
    const matchCP = xmlText.match(/<CodigoPostal[^>]*>([^<]+)<\/CodigoPostal>/);
    const matchCP2 = xmlText.match(/<CP[^>]*>([^<]+)<\/CP>/);
    const matchSituacion = xmlText.match(/<Situacion[^>]*>([^<]+)<\/Situacion>/);
    const matchSituacionMercurial = xmlText.match(/<SituacionMercurial[^>]*>([^<]+)<\/SituacionMercurial>/);

    const razonSocial = matchNombre?.[1]?.trim() || matchRazon?.[1]?.trim();

    if (!razonSocial) {
      return null;
    }

    return {
      razonSocial,
      direccion: matchDireccion?.[1]?.trim() || matchDomicilio?.[1]?.trim(),
      localidad: matchLocalidad?.[1]?.trim(),
      provincia: matchProvincia?.[1]?.trim(),
      codigoPostal: matchCP?.[1]?.trim() || matchCP2?.[1]?.trim(),
      situacion: matchSituacion?.[1]?.trim() || matchSituacionMercurial?.[1]?.trim() || "Activa",
    };
  } catch (e) {
    console.error("Error parseando respuesta XML:", e);
    return null;
  }
}

/**
 * Hace una petición HTTPS con certificado cliente usando promesas
 */
function httpsRequest(options: https.RequestOptions, data: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(responseData);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Verifica una empresa con la AEAT usando su servicio SOAP
 */
export async function verifyCompanyWithAeat(cif: string): Promise<CompanyVerificationResult> {
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  const credentials = getAeatCredentials();
  if (!credentials) {
    console.warn("AEAT: No hay credenciales configuradas. Usando validación local.");
    return {
      success: false,
      method: "LOCAL",
      error: "No hay credenciales de AEAT configuradas",
    };
  }

  try {
    console.log("AEAT: Enviando petición SOAP...");

    const soapEnvelope = buildSoapEnvelope(cleanCif);

    const options: https.RequestOptions = {
      hostname: 'www1.agenciatributaria.es',
      port: 443,
      path: '/es13/ws/sgtific/V1/0/Service',
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '"http://www2.agenciatributaria.es/es13/ws/sgtific/V1/0/Service/ContribuyentesES007_ObtenerNoObservaciones"',
      },
      cert: credentials.cert,
      key: credentials.key,
      rejectUnauthorized: false,
    };

    const xmlText = await httpsRequest(options, soapEnvelope);
    console.log("AEAT: Respuesta recibida, longitud:", xmlText.length);

    const companyData = parseAeatResponse(xmlText);

    if (companyData) {
      console.log("AEAT: Empresa encontrada:", companyData.razonSocial);
      return {
        success: true,
        method: "AEAT",
        company: {
          cif: cleanCif,
          ...companyData,
        },
      };
    }

    console.warn("AEAT: Respuesta vacía, empresa no encontrada");
    return {
      success: false,
      method: "AEAT",
      error: "Empresa no encontrada en AEAT",
    };

  } catch (error: any) {
    console.error("AEAT: Error al verificar empresa:", error.message);
    console.error("AEAT: Stack:", error.stack);

    return {
      success: false,
      method: "AEAT",
      error: `Error de comunicación con AEAT: ${error.message}`,
    };
  }
}

/**
 * Verifica una empresa con el método híbrido
 */
export async function verifyCompany(cif: string): Promise<CompanyVerificationResult> {
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  console.log(`Verificando empresa: ${cleanCif}`);

  const credentials = getAeatCredentials();
  if (credentials) {
    console.log("AEAT: Intentando verificación con Agencia Tributaria...");
    const aeatResult = await verifyCompanyWithAeat(cleanCif);

    if (aeatResult.success) {
      return aeatResult;
    }

    console.warn(`AEAT: Fallback a validación local. Error: ${aeatResult.error}`);
  } else {
    console.log("AEAT: No configurado, usando validación local");
  }

  // Fallback: Validación local
  const { validateCIF } = await import("@/lib/cif-validator");
  const localValidation = validateCIF(cleanCif);

  return {
    success: localValidation.valid,
    method: "LOCAL",
    validFormat: localValidation.valid,
    error: localValidation.error,
    company: localValidation.valid
      ? {
          cif: cleanCif,
          razonSocial: "Verificación local (sin datos de AEAT)",
        }
      : undefined,
  };
}

/**
 * Verifica si el servicio AEAT está configurado
 */
export function isAeatConfigured(): boolean {
  return !!getAeatCredentials();
}

/**
 * Obtiene el estado del servicio AEAT
 */
export function getAeatStatus(): {
  configured: boolean;
  wsdlUrl: string;
} {
  return {
    configured: isAeatConfigured(),
    wsdlUrl: "https://www1.agenciatributaria.es/es13/ws/sgtific/V1/0/Service",
  };
}
