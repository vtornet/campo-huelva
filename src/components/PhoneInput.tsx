/**
 * Componente de input para teléfono español con validación y formateo
 */

"use client";

import { useState, useId } from "react";
import { validatePhone, formatPhone, validationErrors } from "@/lib/validations";

interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  showSuccessIcon?: boolean;
}

export default function PhoneInput({
  label = "Teléfono",
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder,
  helperText,
  showSuccessIcon = true,
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const id = useId();

  const isValid = validatePhone(value);
  const hasValue = value.length > 0;
  const showError = touched && hasValue && !isValid;
  const showSuccess = touched && hasValue && isValid && showSuccessIcon;

  // Formatear al escribir
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Solo permitir números, + y espacios
    newValue = newValue.replace(/[^\d\s+]/g, "");

    onChange(newValue);
  };

  // Formatear al perder el foco
  const handleBlur = () => {
    setTouched(true);
    if (hasValue && isValid) {
      const formatted = formatPhone(value);
      if (formatted !== value) {
        onChange(formatted);
      }
    }
  };

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          id={id}
          type="tel"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || "+34 600 000 000"}
          required={required}
          className={`
            block w-full rounded-lg border px-3 py-2 pl-10 pr-10 text-sm
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

        {/* Icono de teléfono (izquierda) */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>

        {/* Icono de estado (derecha) */}
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

      {/* Textos de ayuda */}
      <div className="space-y-0.5">
        {!showError && (
          <>
            {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
            {!helperText && !touched && (
              <p className="text-xs text-gray-500">Formato español: +34 600 000 000 o 600 000 000</p>
            )}
          </>
        )}

        {/* Error */}
        {showError && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {validationErrors.phone}
          </p>
        )}

        {/* Éxito */}
        {showSuccess && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Teléfono válido
          </p>
        )}
      </div>
    </div>
  );
}
