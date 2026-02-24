// src/components/CifInput.tsx
// Componente de input para CIF/NIF con validación en tiempo real

import { ChangeEvent, InputHTMLAttributes, useState, useEffect } from "react";
import { validateSpanishDocument, formatCIF, identifyDocumentType } from "@/lib/cif-validator";

interface CifInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  /** Label del input */
  label?: string;
  /** Callback cuando el CIF es válido */
  onValidChange?: (valid: boolean, cif: string) => void;
  /** Mostrar mensaje de error detallado */
  showErrorMessage?: boolean;
  /** Permitir solo CIF de empresas (no NIF/NIE de personas físicas) */
  companiesOnly?: boolean;
  /** Clases adicionales para el contenedor */
  containerClassName?: string;
  /** Callback personalizado para cambios (opcional, se usa internamente para validación) */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function CifInput({
  label = "CIF/NIF",
  onValidChange,
  showErrorMessage = true,
  companiesOnly = false,
  containerClassName = "",
  className = "",
  value: controlledValue,
  onChange,
  ...props
}: CifInputProps) {
  const [value, setValue] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [error, setError] = useState<string>("");
  const [documentType, setDocumentType] = useState<string>("");

  // Sincronizar con valor controlado
  const inputValue = controlledValue !== undefined ? controlledValue : value;

  useEffect(() => {
    if (inputValue) {
      const cleanValue = String(inputValue).replace(/[\s-]/g, "").toUpperCase();

      // Detectar tipo de documento
      const docType = identifyDocumentType(cleanValue);
      setDocumentType(docType);

      if (docType === "UNKNOWN" || cleanValue.length < 9) {
        setIsValid(null);
        setError("");
        onValidChange?.(false, cleanValue);
        return;
      }

      // Si solo se permiten empresas y es NIF/NIE
      if (companiesOnly && (docType === "NIF" || docType === "NIE")) {
        setIsValid(false);
        setError("Este campo es solo para empresas (CIF)");
        onValidChange?.(false, cleanValue);
        return;
      }

      // Validar documento
      const result = validateSpanishDocument(cleanValue);
      setIsValid(result.valid);
      setError(result.error || "");
      onValidChange?.(result.valid, cleanValue);
    } else {
      setIsValid(null);
      setError("");
      setDocumentType("");
      onValidChange?.(false, "");
    }
  }, [inputValue, companiesOnly, onValidChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.toUpperCase();

    // Permitir letras, números, espacios y guiones
    newValue = newValue.replace(/[^A-Z0-9\s-]/g, "");

    // Actualizar estado
    if (controlledValue === undefined) {
      setValue(newValue);
    }

    onChange?.(e);
  };

  const handleBlur = () => {
    // Formatear al perder el foco si es válido
    if (isValid && inputValue) {
      const formatted = formatCIF(String(inputValue));
      if (controlledValue === undefined) {
        setValue(formatted);
      }
      onChange?.({
        target: { value: formatted },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Icono de estado
  const StatusIcon = () => {
    if (isValid === null) return null;

    if (isValid) {
      return (
        <svg
          className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-5 h-5 text-red-500 absolute right-3 top-1/2 -translate-y-1/2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  };

  // Badge de tipo de documento
  const DocumentTypeBadge = () => {
    if (!documentType || documentType === "UNKNOWN") return null;

    const colors: Record<string, string> = {
      CIF: "bg-blue-100 text-blue-800",
      NIF: "bg-green-100 text-green-800",
      NIE: "bg-purple-100 text-purple-800",
    };

    return (
      <span
        className={`text-xs px-2 py-0.5 rounded font-medium ${colors[documentType] || "bg-gray-100 text-gray-800"}`}
      >
        {documentType}
      </span>
    );
  };

  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <DocumentTypeBadge />
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`
            w-full pr-10 px-3 py-2 border rounded-lg shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${isValid === false ? "border-red-500" : ""}
            ${isValid === true ? "border-green-500" : ""}
            ${className}
          `}
          placeholder={companiesOnly ? "B-12345678" : "B-12345678 / 12345678Z"}
          maxLength={12} // B-12345678 (10) + margen
          {...props}
        />
        <StatusIcon />
      </div>

      {showErrorMessage && isValid === false && error && (
        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {showErrorMessage && isValid === true && documentType === "CIF" && (
        <p className="mt-1 text-sm text-green-600">
          ✓ CIF válido
        </p>
      )}
    </div>
  );
}

export default CifInput;
