// src/lib/aeat-service.ts
// Servicio de verificación de CIF con la Agencia Tributaria (AEAT)
// Implementa comunicación SOAP directa con certificado digital

import * as https from 'https';
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
 * Obtiene el certificado digital desde variables de entorno
 */
function getAeatCredentials(): { cert: string; key: string } | null {
  const cert = process.env.AEAT_CERT_PEM;
  const key = process.env.AEAT_KEY_PEM;

  if (cert && key) {
    // Railway añade espacios de indentación. Los eliminamos pero preservando el formato PEM.
    const cleanRailwayIndentation = (pem: string): string => {
      // Reemplazar \n literales primero
      let cleaned = pem.replace(/\\n/g, '\n');

      // Dividir en líneas
      const lines = cleaned.split(/\r?\n/);

      // Eliminar solo los espacios al inicio de cada línea (indentación de Railway)
      // NO eliminar espacios dentro del contenido base64
      const cleanedLines = lines.map(line => {
        // Buscar dónde empieza el contenido real (después de espacios)
        const firstNonSpace = line.search(/\S/);
        if (firstNonSpace > 0) {
          return line.substring(firstNonSpace);
        }
        return line;
      });

      // Filtrar líneas vacías y unir
      return cleanedLines.filter(line => line.trim() !== '').join('\n') + '\n';
    };

    return {
      cert: cleanRailwayIndentation(cert),
      key: cleanRailwayIndentation(key)
    };
  }

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
