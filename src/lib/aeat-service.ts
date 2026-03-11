// src/lib/aeat-service.ts
// Servicio de verificación de CIF/NIF/NIE (validación local)
// La verificación con AEAT se ha deshabilitado debido a problemas de DNS en Railway

import { validateCIF } from "./cif-validator";

/**
 * Resultado de la verificación de una empresa
 */
export interface CompanyVerificationResult {
  /** Indica si la verificación fue exitosa */
  success: boolean;
  /** Método usado para la verificación (siempre LOCAL) */
  method: "LOCAL";
  /** Datos de la empresa si se encontró */
  company?: {
    cif: string;
    razonSocial: string;
  };
  /** Error si falló la verificación */
  error?: string;
  /** Indica si el CIF tiene formato válido */
  validFormat?: boolean;
}

/**
 * Verifica una empresa usando validación local de CIF/NIF/NIE
 *
 * NOTA: La verificación con AEAT está deshabilitada porque Railway
 * no puede resolver los DNS de www1.agenciatributaria.es.
 * Esta función solo valida el formato del CIF.
 */
export async function verifyCompany(cif: string): Promise<CompanyVerificationResult> {
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  console.log(`Verificando empresa: ${cleanCif}`);

  // Validación local del formato CIF/NIF/NIE
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
 * Verifica si el servicio AEAT está configurado (siempre false)
 */
export function isAeatConfigured(): boolean {
  return false;
}

/**
 * Obtiene el estado del servicio AEAT
 */
export function getAeatStatus(): {
  configured: boolean;
  note: string;
} {
  return {
    configured: false,
    note: "La verificación con AEAT está deshabilitada. Se usa validación local de formato CIF.",
  };
}
