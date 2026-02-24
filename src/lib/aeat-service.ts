// src/lib/aeat-service.ts
// Servicio de verificación de CIF con la Agencia Tributaria (AEAT)
// Implementa comunicación SOAP real con certificado digital

import { createClientAsync } from 'soap';
import * as https from 'https';

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
 * URLs de AEAT para servicios SOAP
 */
const AEAT_WSDL_URL = "https://www1.agenciatributaria.es/es13/ws/sgtific/V1/0/Service?WSDL";
const AEAT_ENDPOINT = "https://www1.agenciatributaria.es/es13/ws/sgtific/V1/0/Service";

/**
 * Obtiene el certificado digital desde variables de entorno
 */
function getAeatCredentials(): { cert: string; key: string } | null {
  const cert = process.env.AEAT_CERT_PEM;
  const key = process.env.AEAT_KEY_PEM;

  if (cert && key) {
    return { cert, key };
  }

  return null;
}

/**
 * Crea un agente HTTPS con el certificado cliente
 */
function createHttpsAgent(cert: string, key: string): https.Agent {
  return new https.Agent({
    cert: cert,
    key: key,
    rejectUnauthorized: false, // AEAT usa certificados intermedios
  });
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
    console.log("AEAT: Creando cliente SOAP...");

    // Crear agente HTTPS con certificado cliente
    const httpsAgent = createHttpsAgent(credentials.cert, credentials.key);

    // Crear cliente SOAP con opciones de conexión personalizadas
    const client = await createClientAsync(AEAT_WSDL_URL, {
      endpoint: AEAT_ENDPOINT,
      request: {
        agent: httpsAgent,
      },
    } as any);

    console.log("AEAT: Cliente creado, llamando al servicio...");

    // Llamar al servicio de verificación de NIF
    // El servicio se llama "ES007" o "Contribuyentes"
    const args = {
      Nif: cleanCif,
    };

    // Llamar al método de verificación
    // Nota: El nombre exacto del método puede variar según la documentación de AEAT
    const [result] = await client.ContribuyentesES007_ObtenerNoObservaciones(args);

    console.log("AEAT: Respuesta recibida:", result?.ContribuyenteReturn);

    // Extraer datos de la respuesta
    if (result && result.ContribuyenteReturn) {
      const data = result.ContribuyenteReturn;

      return {
        success: true,
        method: "AEAT",
        company: {
          cif: cleanCif,
          razonSocial: data.Nombre || data.RazonSocial || "",
          direccion: data.Direccion || data.Domicilio,
          localidad: data.Localidad,
          provincia: data.Provincia,
          codigoPostal: data.CodigoPostal || data.CP,
          situacion: data.SituacionMercurial || "Activa",
        },
      };
    }

    // Si no hay resultado, intentar parsear la respuesta XML directamente
    console.warn("AEAT: Respuesta vacía, empresa no encontrada");
    return {
      success: false,
      method: "AEAT",
      error: "Empresa no encontrada en AEAT",
    };

  } catch (error: any) {
    console.error("AEAT: Error al verificar empresa:", error.message);
    console.error("AEAT: Stack:", error.stack);

    // Proporcionar información detallada del error
    let errorMsg = "Error de comunicación con AEAT";
    if (error.message) {
      errorMsg += `: ${error.message}`;
    }

    return {
      success: false,
      method: "AEAT",
      error: errorMsg,
    };
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
    wsdlUrl: AEAT_WSDL_URL,
  };
}
