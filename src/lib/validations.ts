/**
 * Módulo de validaciones de formularios
 * Validaciones para teléfono, email, CIF/NIF y otros campos comunes
 */

// ==================== TELÉFONO ====================

/**
 * Valida un número de teléfono español
 * Formatos válidos: +34 XXX XXX XXX, +34XXXXXXXXX, 6XXXXXXXX, 9XXXXXXXX
 * @param phone - Número de teléfono a validar
 * @returns true si es válido
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Limpiar: espacios, guiones, paréntesis
  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Expresión regular para teléfonos españoles
  // - +34 seguido de 9 dígitos
  // - O directamente 9 dígitos (empezando por 6, 7, 8 o 9)
  const phoneRegex = /^(\+34)?[67-8]\d{8}$/;

  return phoneRegex.test(cleanPhone);
}

/**
 * Formatea un número de teléfono al formato español
 * @param phone - Número de teléfono
 * @returns Teléfono formateado: +34 XXX XXX XXX
 */
export function formatPhone(phone: string): string {
  if (!phone) return "";

  const cleanPhone = phone.replace(/[\s\-()]/g, "");

  // Si no tiene prefijo +34, añadirlo
  let formatted = cleanPhone;
  if (!formatted.startsWith("+34")) {
    formatted = "+34" + formatted;
  }

  // Formatear: +34 XXX XXX XXX
  if (formatted.length === 12) {
    return formatted.replace(/(\+34)(\d{3})(\d{3})(\d{3})/, "$1 $2 $3 $4");
  }

  return formatted;
}

/**
 * Extrae el número sin prefijo para almacenamiento
 * @param phone - Número de teléfono
 * @returns Número sin prefijo (+34)
 */
export function extractLocalPhone(phone: string): string {
  const cleanPhone = phone.replace(/[\s\-()]/g, "");
  return cleanPhone.replace(/^\+34/, "");
}

// ==================== EMAIL ====================

/**
 * Valida un email con una expresión regular más robusta que la del HTML5
 * @param email - Email a validar
 * @returns true si es válido
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  // Expresión regular para email (más permisiva que HTML5 pero válida)
  // - Permite letras, números, puntos, guiones, guiones bajos
  // - Dominio con al menos 2 letras para TLD
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailRegex.test(email);
}

/**
 * Normaliza un email (trim + minúsculas)
 * @param email - Email a normalizar
 * @returns Email normalizado
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ==================== CIF / NIF ====================

/**
 * Valida un CIF o NIF español
 * @param taxId - CIF o NIF a validar
 * @returns { valid: boolean, type: 'CIF' | 'NIF' | 'NIE' | null }
 */
export function validateTaxId(taxId: string): { valid: boolean; type: 'CIF' | 'NIF' | 'NIE' | null } {
  if (!taxId) return { valid: false, type: null };

  const clean = taxId.toUpperCase().replace(/[\s\-]/g, "");

  // NIF (8 dígitos + letra)
  if (/^[0-9]{8}[A-HJ-NP-TV-Z]$/.test(clean)) {
    return { valid: validateNIFLetter(clean), type: 'NIF' };
  }

  // NIE (X/Y/Z + 7 dígitos + letra)
  if (/^[XYZ][0-9]{7}[A-HJ-NP-TV-Z]$/.test(clean)) {
    return { valid: validateNIELetter(clean), type: 'NIE' };
  }

  // CIF (letra + 7 u 8 dígitos + letra/dígito de control)
  if (/^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/.test(clean)) {
    return { valid: validateCIFControl(clean), type: 'CIF' };
  }

  return { valid: false, type: null };
}

/**
 * Valida la letra de un NIF
 */
function validateNIFLetter(nif: string): boolean {
  const dni = nif.slice(0, 8);
  const letter = nif[8];

  const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const calculatedLetter = letters[parseInt(dni) % 23];

  return letter === calculatedLetter;
}

/**
 * Valida la letra de un NIE
 */
function validateNIELetter(nie: string): boolean {
  // Reemplazar X/Y/Z por 0/1/2
  const replaced = nie.replace(/^[XYZ]/, (match) => {
    if (match === 'X') return '0';
    if (match === 'Y') return '1';
    return '2';
  });

  return validateNIFLetter(replaced + nie[8]);
}

/**
 * Valida el dígito de control de un CIF
 */
function validateCIFControl(cif: string): boolean {
  const digits = cif.slice(1, 9);
  const control = cif[8];

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const digit = parseInt(digits[i]);
    // Posiciones impares (índice par) se multiplican por 2
    const value = (i % 2 === 0) ? digit * 2 : digit;
    // Sumar los dígitos del valor (si es >9, se suman las cifras)
    sum += value > 9 ? value - 9 : value;
  }

  const calculatedDigit = (10 - (sum % 10)) % 10;

  // El control puede ser un número o una letra
  if (/[0-9]/.test(control)) {
    return parseInt(control) === calculatedDigit;
  } else {
    // Si es letra: J=0, A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9
    const letters = 'JABCDEFGHI';
    return letters.indexOf(control) === calculatedDigit;
  }
}

/**
 * Formatea un CIF/NIF para mostrar (espaciado)
 */
export function formatTaxId(taxId: string): string {
  if (!taxId) return "";
  const clean = taxId.toUpperCase().replace(/[\s\-]/g, "");

  // CIF/NIE: 1 letra + 7 dígitos + 1 letra = 9 caracteres
  // NIF: 8 dígitos + 1 letra = 9 caracteres
  if (clean.length === 9) {
    // Formato: X 00000000 0
    if (/^[XYZ]/.test(clean) || /^[A-Z]/.test(clean)) {
      return `${clean[0]} ${clean.slice(1, 8)} ${clean[8]}`;
    }
    // NIF: 00 000000 0
    return `${clean.slice(0, 2)} ${clean.slice(2, 8)} ${clean[8]}`;
  }

  return clean;
}

// ==================== OTROS ====================

/**
 * Valida que un campo no esté vacío (después de trim)
 */
export function validateRequired(value: string): boolean {
  return value?.trim().length > 0;
}

/**
 * Valida una longitud mínima
 */
export function validateMinLength(value: string, min: number): boolean {
  return value?.length >= min;
}

/**
 * Valida una longitud máxima
 */
export function validateMaxLength(value: string, max: number): boolean {
  return !value || value.length <= max;
}

/**
 * Valida un código postal español (5 dígitos, 01-52 para las primeras dos cifras)
 */
export function validatePostalCode(code: string): boolean {
  const postalCodeRegex = /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/;
  return postalCodeRegex.test(code);
}

/**
 * Valida una URL
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ==================== MENSAJES DE ERROR ====================

export const validationErrors = {
  phone: "Teléfono no válido. Formato: +34 600 000 000 o 600 000 000",
  email: "Email no válido. Ejemplo: usuario@dominio.com",
  cif: "CIF no válido. Debe tener formato: B12345678 o B-12345678",
  nif: "NIF no válido. Debe tener 8 dígitos seguidos de una letra",
  nie: "NIE no válido. Debe empezar por X, Y o Z seguido de 7 dígitos y una letra",
  required: "Este campo es obligatorio",
  minLength: (min: number) => `Debe tener al menos ${min} caracteres`,
  maxLength: (max: number) => `No puede tener más de ${max} caracteres`,
  postalCode: "Código postal no válido. Debe tener 5 dígitos",
  url: "URL no válida. Debe empezar con http:// o https://",
};

// ==================== HOOK PARA VALIDACIÓN EN TIEMPO REAL ====================

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

export function useFieldValidation(
  value: string,
  validator: (value: string) => boolean,
  errorMessage: string
): ValidationResult {
  const isValid = validator(value);
  const error = value.length > 0 && !isValid ? errorMessage : null;

  return { isValid, error };
}
