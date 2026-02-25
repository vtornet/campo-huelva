/**
 * Componente de input con validación integrada
 * Muestra error en tiempo real y estados visuales
 */

"use client";

import { useState, useId } from "react";

interface ValidatedInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validator: (value: string) => boolean;
  errorMessage: string;
  type?: "text" | "email" | "tel" | "url" | "number";
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  disabled?: boolean;
  autoComplete?: string;
  helperText?: string;
  showFormat?: string; // Ejemplo: "Formato: +34 600 000 000"
  formatValue?: (value: string) => string; // Función para formatear el valor
}

export default function ValidatedInput({
  label,
  value,
  onChange,
  validator,
  errorMessage,
  type = "text",
  placeholder,
  required = false,
  minLength,
  maxLength,
  disabled = false,
  autoComplete,
  helperText,
  showFormat,
  formatValue,
}: ValidatedInputProps) {
  const [touched, setTouched] = useState(false);
  const id = useId();

  // Validar el valor actual
  const isValid = validator(value);
  const hasValue = value.length > 0;
  const showError = touched && hasValue && !isValid;
  const showSuccess = touched && hasValue && isValid;

  // Manejar cambio con formateo opcional
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Aplicar formateo si se proporciona
    if (formatValue) {
      newValue = formatValue(newValue);
    }

    onChange(newValue);
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input */}
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          autoComplete={autoComplete}
          className={`
            block w-full rounded-lg border px-3 py-2 pr-10 text-sm
            transition-colors duration-200
            ${disabled
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-white text-gray-900"
            }
            ${showError
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : showSuccess
              ? "border-green-300 focus:border-green-500 focus:ring-green-500"
              : "border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            }
            focus:outline-none focus:ring-2
          `}
        />

        {/* Icono de estado */}
        {hasValue && !disabled && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {showError ? (
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : showSuccess ? (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : null}
          </div>
        )}
      </div>

      {/* Textos de ayuda y error */}
      <div className="space-y-0.5">
        {/* Formato esperado */}
        {showFormat && !showError && (
          <p className="text-xs text-gray-500">{showFormat}</p>
        )}

        {/* Helper text */}
        {helperText && !showError && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}

        {/* Error */}
        {showError && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
