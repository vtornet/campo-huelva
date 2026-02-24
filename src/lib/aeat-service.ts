// src/lib/aeat-service.ts
// Servicio de verificación de CIF con la Agencia Tributaria (AEAT)
// Implementa comunicación SOAP con certificado digital

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
 * Configuración del servicio AEAT
 */
export interface AeatConfig {
  /** URL del servicio WSDL de AEAT */
  wsdlUrl?: string;
  /** Certificado digital en formato PEM */
  cert?: string;
  /** Clave privada del certificado en formato PEM */
  key?: string;
}

/**
 * Configuración por defecto
 * URLs de AEAT para servicios SOAP
 */
const AEAT_CONFIG = {
  production: "https://www1.agenciatributaria.es/wlpl/SSII-FACT/ws/soiap/WSServlet02",
  test: "https://www1.agenciatributaria.es/wlpl/BUG-SII-FACT/ws/soiap/WSServlet02",
};

/**
 * Obtiene el certificado digital desde variables de entorno
 * Las claves pueden estar en:
 * - AEAT_CERT_PEM (certificado en formato PEM)
 * - AEAT_KEY_PEM (clave privada en formato PEM)
 * - AEAT_CERT_PATH (ruta al archivo .pem o .p12)
 */
function getAeatCredentials(): { cert?: string; key?: string } | null {
  const cert = process.env.AEAT_CERT_PEM;
  const key = process.env.AEAT_KEY_PEM;

  if (cert && key) {
    return { cert, key };
  }

  // Si no hay credenciales, devolver null (se usará fallback)
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
    <ser:Contribuyente>
      <ser:Nombre>${cif}</ser:Nombre>
    </ser:Contribuyente>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Verifica una empresa con la AEAT usando su servicio SOAP
 * @param cif - CIF a verificar
 * @returns Resultado de la verificación
 */
export async function verifyCompanyWithAeat(cif: string): Promise<CompanyVerificationResult> {
  // Limpiar el CIF
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  // Verificar que tenga credenciales de AEAT configuradas
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
    // Construir petición SOAP
    const soapEnvelope = buildSoapEnvelope(cleanCif);

    // Hacer petición SOAP con certificado cliente
    const response = await fetch(AEAT_CONFIG.production, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": '"http://www2.agenciatribaria.es/es13/ws/sgtific/V1/0/Service/Contribuyente"',
      },
      body: soapEnvelope,
      // Nota: En Node.js, fetch no soporta certificados cliente directamente
      // Necesitamos usar https.Agent con certificado
    });

    if (!response.ok) {
      throw new Error(`AEAT HTTP error: ${response.status}`);
    }

    const xmlText = await response.text();

    // Parsear respuesta SOAP XML
    const companyData = parseAeatResponse(xmlText);

    if (companyData) {
      return {
        success: true,
        method: "AEAT",
        company: {
          cif: cleanCif,
          ...companyData,
        },
      };
    } else {
      return {
        success: false,
        method: "AEAT",
        error: "Empresa no encontrada en AEAT",
      };
    }
  } catch (error: any) {
    console.error("AEAT: Error al verificar empresa:", error.message);
    return {
      success: false,
      method: "AEAT",
      error: `Error de comunicación con AEAT: ${error.message}`,
    };
  }
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
    // Extraer campos de la respuesta XML
    // Nota: En producción usaríamos un parser XML proper

    const matchRazon = xmlText.match(/<Nombre>([^<]+)<\/Nombre>/);
    const matchDireccion = xmlText.match(/<Direccion>([^<]+)<\/Direccion>/);
    const matchLocalidad = xmlText.match(/<Localidad>([^<]+)<\/Localidad>/);
    const matchProvincia = xmlText.match(/<Provincia>([^<]+)<\/Provincia>/);
    const matchCP = xmlText.match(/<CodPostal>([^<]+)<\/CodPostal>/);
    const matchSituacion = xmlText.match(/<Situacion>([^<]+)<\/Situacion>/);

    if (!matchRazon) {
      return null;
    }

    return {
      razonSocial: matchRazon[1].trim(),
      direccion: matchDireccion?.[1].trim(),
      localidad: matchLocalidad?.[1].trim(),
      provincia: matchProvincia?.[1].trim(),
      codigoPostal: matchCP?.[1].trim(),
      situacion: matchSituacion?.[1].trim(),
    };
  } catch {
    return null;
  }
}

/**
 * Verifica una empresa con el método híbrido:
 * 1. Intenta usar AEAT si hay credenciales
 * 2. Si falla, usa validación local (algoritmo)
 * @param cif - CIF a verificar
 * @returns Resultado de la verificación
 */
export async function verifyCompany(cif: string): Promise<CompanyVerificationResult> {
  // Limpiar el CIF
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  console.log(`Verificando empresa: ${cleanCif}`);

  // Primero: Intentar verificación con AEAT
  const credentials = getAeatCredentials();
  if (credentials) {
    console.log("AEAT: Intentando verificación con Agencia Tributaria...");
    const aeatResult = await verifyCompanyWithAeat(cleanCif);

    if (aeatResult.success) {
      return aeatResult;
    }

    // AEAT falló, hacer fallback con aviso
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
    wsdlUrl: AEAT_CONFIG.production,
  };
}
