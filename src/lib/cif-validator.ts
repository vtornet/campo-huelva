// src/lib/cif-validator.ts
// Validación de CIF (Código de Identificación Fiscal) español
// Basado en el algoritmo oficial de la Agencia Tributaria

/**
 * Tipo de entidad según la primera letra del CIF
 */
export type EntityType =
  | "SOCIEDAD_ANONIMA"      // A
  | "SOCIEDAD_LIMITADA"      // B
  | "SOCIEDAD_COMANDITARIA"  // C
  | "SOCIEDAD_COOPERATIVA"   // C (comparte)
  | "SOCIEDAD_CIVIL"         // C (comparte)
  | "SOCIEDAD_COLECTIVA"     // C (comparte)
  | "EMPRESARIO_INDIVIDUAL"  // C (comparte)
  | "SOCIEDAD_LABORAL"       // C (comparte)
  | "SOCIEDAD_LIMITADA_NUEVA_EMPRESA" // C (comparte)
  | "COMUNIDAD_DE_BIENES"    // C (comparte)
  | "FONDOS"                 // D
  | "FUNDACION"              // G
  | "ASOCIACION"             // G (comparte)
  | "UNION_TEMPORAL_EMPRESAS" // U
  | "EXTRANJERO"             // N
  | "CENTRO_DE_GESTION"      // Q
  | "ADMINISTRACION_PUBLICA" // P
  | "PERSONA_FISICA"         // (NIF/CIF)
  | "DESCONOCIDO";           // Otros

/**
 * Resultado de la validación del CIF
 */
export interface ValidationResult {
  /** Indica si el CIF es válido */
  valid: boolean;
  /** Mensaje de error si no es válido */
  error?: string;
  /** Tipo de entidad (si es válido) */
  entityType?: EntityType;
  /** Letra del tipo de entidad */
  typeLetter?: string;
  /** Provincia (dos primeros dígitos) si es nacional, o código de país si es extranjero */
  provinceCode?: string;
}

/**
 * Letras válidas para el inicio de un CIF y su tipo de entidad
 */
const ENTITY_TYPES: Record<string, EntityType> = {
  A: "SOCIEDAD_ANONIMA",
  B: "SOCIEDAD_LIMITADA",
  C: "SOCIEDAD_COMANDITARIA", // Puede ser varias: Comanditaria, Cooperativa, Civil, etc.
  D: "FONDOS",
  E: "COMUNIDAD_DE_BIENES",
  F: "FUNDACION",
  G: "ASOCIACION", // También Fundaciones
  H: "CENTRO_DE_GESTION",
  J: "SOCIEDAD_CIVIL",
  N: "EXTRANJERO",
  P: "ADMINISTRACION_PUBLICA",
  Q: "CENTRO_DE_GESTION",
  R: "SOCIEDAD_LIMITADA_NUEVA_EMPRESA",
  S: "SOCIEDAD_LABORAL",
  U: "UNION_TEMPORAL_EMPRESAS",
  V: "SOCIEDAD_COLECTIVA",
  W: "SOCIEDAD_LIMITADA_NUEVA_EMPRESA",
};

/**
 * Letras de control para CIFs numéricos
 */
const CONTROL_LETTERS = "JABCDEFGHI";

/**
 * Calcula el dígito de control de un CIF
 * @param cif - CIF sin letra de control (7 u 8 caracteres)
 * @returns Letra o número de control
 */
function calculateControlDigit(cif: string): string {
  // Sumar los dígitos en posiciones pares
  let sumEven = 0;
  for (let i = 1; i < cif.length; i += 2) {
    sumEven += parseInt(cif[i]);
  }

  // Sumar los dígitos en posiciones impares (multiplicados por 2)
  let sumOdd = 0;
  for (let i = 0; i < cif.length; i += 2) {
    const digit = parseInt(cif[i]);
    const doubled = digit * 2;
    sumOdd += Math.floor(doubled / 10) + (doubled % 10);
  }

  const total = sumEven + sumOdd;
  const units = total % 10;
  const control = (10 - units) % 10;

  return control.toString();
}

/**
 * Valida un CIF español usando el algoritmo oficial
 * @param cif - CIF a validar (puede incluir o no espacios, guiones, o ser minúsculas)
 * @returns Resultado de la validación
 */
export function validateCIF(cif: string): ValidationResult {
  if (!cif) {
    return { valid: false, error: "El CIF es obligatorio" };
  }

  // Limpiar el CIF: eliminar espacios, guiones, y convertir a mayúsculas
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  // El CIF debe tener 9 caracteres exactamente
  if (cleanCif.length !== 9) {
    return { valid: false, error: "El CIF debe tener 9 caracteres" };
  }

  // Validar formato: Letra + 7 dígitos + Letra/Número de control
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW]\d{7}[0-9A-J]$/;
  if (!cifRegex.test(cleanCif)) {
    return { valid: false, error: "Formato de CIF inválido" };
  }

  // Extraer componentes
  const typeLetter = cleanCif[0];
  const digits = cleanCif.substring(1, 8);
  const controlChar = cleanCif[8];

  // Verificar que todos los caracteres después de la primera letra son dígitos
  if (!/^\d{7}$/.test(digits)) {
    return { valid: false, error: "Los 7 dígitos del CIF deben ser numéricos" };
  }

  // Calcular el dígito de control esperado
  const calculatedControl = calculateControlDigit(digits);

  // Verificar el dígito de control
  let controlValid = false;
  if (/^\d$/.test(controlChar)) {
    // El control es un número
    controlValid = controlChar === calculatedControl;
  } else {
    // El control es una letra (para CIFs que empiezan por K, P, Q, S)
    // Para estos casos, la letra de control es J, A, B, C, D, E, F, G, H, I
    const controlIndex = parseInt(calculatedControl);
    const expectedLetter = CONTROL_LETTERS[controlIndex];
    controlValid = controlChar === expectedLetter;
  }

  if (!controlValid) {
    return { valid: false, error: "El dígito de control del CIF no es válido" };
  }

  // Extraer tipo de entidad
  const entityType = ENTITY_TYPES[typeLetter] || "DESCONOCIDO";

  // Extraer código de provincia
  const provinceCode = cleanCif.substring(1, 3);

  // Verificar código de provincia (para nacionales)
  // Códigos 01-52 y 99 para extranjero con NIF
  const provinceNum = parseInt(provinceCode);
  const validProvince = provinceNum >= 1 && provinceNum <= 52;

  return {
    valid: true,
    entityType,
    typeLetter,
    provinceCode: validProvince ? provinceCode : undefined,
  };
}

/**
 * Formatea un CIF para mostrarlo de forma estándar
 * @param cif - CIF a formatear
 * @returns CIF formateado (ej: "B-12345678")
 */
export function formatCIF(cif: string): string {
  const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

  if (cleanCif.length !== 9) {
    return cif; // Retornar original si no es válido
  }

  return `${cleanCif[0]}-${cleanCif.substring(1, 8)}-${cleanCif[8]}`;
}

/**
 * Verifica si un documento es un CIF, NIF o NIE
 * @param document - Documento a verificar
 * @returns Tipo de documento
 */
export type DocumentType = "CIF" | "NIF" | "NIE" | "UNKNOWN";

export function identifyDocumentType(document: string): DocumentType {
  const cleanDoc = document.replace(/[\s-]/g, "").toUpperCase();

  if (cleanDoc.length !== 9) {
    return "UNKNOWN";
  }

  const firstChar = cleanDoc[0];

  // CIF: Empieza por letra (excluyendo X, Y, Z que son para NIE)
  if (/^[ABCDEFGHJKLMNPQRSUVW]$/.test(firstChar)) {
    return "CIF";
  }

  // NIE: Empieza por X, Y, Z seguido de 7 dígitos y letra
  if (/^[XYZ]\d{7}[A-Z]$/.test(cleanDoc)) {
    return "NIE";
  }

  // NIF: Empieza por dígito y termina por letra
  if (/^\d{8}[A-Z]$/.test(cleanDoc)) {
    return "NIF";
  }

  return "UNKNOWN";
}

/**
 * Valida un NIF (DNI) español
 * @param nif - NIF a validar
 * @returns true si es válido
 */
export function validateNIF(nif: string): boolean {
  const cleanNif = nif.replace(/[\s-]/g, "").toUpperCase();

  if (!/^\d{8}[A-Z]$/.test(cleanNif)) {
    return false;
  }

  const digits = cleanNif.substring(0, 8);
  const controlLetter = cleanNif[8];

  // Calcular letra de control del NIF
  const nifNumber = parseInt(digits);
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";
  const calculatedLetter = letters[nifNumber % 23];

  return controlLetter === calculatedLetter;
}

/**
 * Valida un NIE (Documento de Identidad de Extranjero)
 * @param nie - NIE a validar
 * @returns true si es válido
 */
export function validateNIE(nie: string): boolean {
  const cleanNie = nie.replace(/[\s-]/g, "").toUpperCase();

  if (!/^[XYZ]\d{7}[A-Z]$/.test(cleanNie)) {
    return false;
  }

  // Reemplazar X, Y, Z por 0, 1, 2
  const replacement: Record<string, string> = { X: "0", Y: "1", Z: "2" };
  const nifEquivalent = replacement[cleanNie[0]] + cleanNie.substring(1);

  return validateNIF(nifEquivalent);
}

/**
 * Valida cualquier documento fiscal español (CIF, NIF o NIE)
 * @param document - Documento a validar
 * @returns true si es válido
 */
export function validateSpanishDocument(document: string): ValidationResult {
  const type = identifyDocumentType(document);

  switch (type) {
    case "CIF":
      return validateCIF(document);
    case "NIF":
      return validateNIF(document)
        ? { valid: true, entityType: "PERSONA_FISICA" as EntityType }
        : { valid: false, error: "NIF inválido" };
    case "NIE":
      return validateNIE(document)
        ? { valid: true, entityType: "PERSONA_FISICA" as EntityType }
        : { valid: false, error: "NIE inválido" };
    default:
      return { valid: false, error: "Documento no reconocido. Debe ser CIF, NIF o NIE" };
  }
}

/**
 * Obtiene el nombre completo del tipo de entidad
 * @param entityType - Tipo de entidad
 * @returns Nombre en español
 */
export function getEntityTypeName(entityType: EntityType): string {
  const names: Record<EntityType, string> = {
    SOCIEDAD_ANONIMA: "Sociedad Anónima (S.A.)",
    SOCIEDAD_LIMITADA: "Sociedad Limitada (S.L.)",
    SOCIEDAD_COMANDITARIA: "Sociedad Comanditaria",
    SOCIEDAD_COOPERATIVA: "Sociedad Cooperativa",
    SOCIEDAD_CIVIL: "Sociedad Civil",
    SOCIEDAD_COLECTIVA: "Sociedad Colectiva",
    EMPRESARIO_INDIVIDUAL: "Empresario Individual",
    SOCIEDAD_LABORAL: "Sociedad Laboral",
    SOCIEDAD_LIMITADA_NUEVA_EMPRESA: "S.L. Nueva Empresa",
    COMUNIDAD_DE_BIENES: "Comunidad de Bienes",
    FONDOS: "Fondos",
    FUNDACION: "Fundación",
    ASOCIACION: "Asociación",
    UNION_TEMPORAL_EMPRESAS: "Unión Temporal de Empresas (U.T.E.)",
    EXTRANJERO: "Entidad Extranjera",
    CENTRO_DE_GESTION: "Centro de Gestión",
    ADMINISTRACION_PUBLICA: "Administración Pública",
    PERSONA_FISICA: "Persona Física",
    DESCONOCIDO: "Tipo Desconocido",
  };

  return names[entityType] || entityType;
}
