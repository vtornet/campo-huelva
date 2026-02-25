// Componente de casillas de aceptación legal para registro
// Cumple con RGPD: consentimiento explícito, informado, libre e inequívoco

"use client";

import { useState } from "react";
import Link from "next/link";

interface LegalCheckboxesProps {
  onConsentChange: (consents: {
    privacy: boolean;
    terms: boolean;
    age: boolean;
    communications: boolean;
  }) => void;
  disabled?: boolean;
}

export default function LegalCheckboxes({ onConsentChange, disabled = false }: LegalCheckboxesProps) {
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);
  const [communications, setCommunications] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Notificar al padre cuando cambian los consentimientos
  const handleChange = (key: string, value: boolean) => {
    const newConsents = {
      privacy: key === "privacy" ? value : privacy,
      terms: key === "terms" ? value : terms,
      age: key === "age" ? value : age,
      communications: key === "communications" ? value : communications,
    };
    onConsentChange(newConsents);
  };

  return (
    <div className="space-y-3">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Condiciones de uso</h3>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          {showDetails ? (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Menos
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Más info
            </>
          )}
        </button>
      </div>

      {/* Checkbox: Política de Privacidad (OBLIGATORIO) */}
      <label className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${disabled ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-emerald-300"}`}>
        <input
          type="checkbox"
          checked={privacy}
          disabled={disabled}
          onChange={(e) => {
            setPrivacy(e.target.checked);
            handleChange("privacy", e.target.checked);
          }}
          required
          className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
        />
        <div className="flex-1 text-sm text-gray-700">
          <span className="font-medium">He leído y acepto la </span>
          <Link href="/privacy" target="_blank" className="text-emerald-600 hover:underline font-medium">
            Política de Privacidad
          </Link>
          <span className="text-gray-500"> *</span>
          {showDetails && (
            <p className="text-xs text-gray-500 mt-1">
              Entiendo que mis datos serán tratados según el RGPD para gestionar mi cuenta y facilitar mi búsqueda de empleo.
            </p>
          )}
        </div>
      </label>

      {/* Checkbox: Términos y Condiciones (OBLIGATORIO) */}
      <label className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${disabled ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-emerald-300"}`}>
        <input
          type="checkbox"
          checked={terms}
          disabled={disabled}
          onChange={(e) => {
            setTerms(e.target.checked);
            handleChange("terms", e.target.checked);
          }}
          required
          className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
        />
        <div className="flex-1 text-sm text-gray-700">
          <span className="font-medium">He leído y acepto los </span>
          <Link href="/terms" target="_blank" className="text-emerald-600 hover:underline font-medium">
            Términos y Condiciones
          </Link>
          <span className="text-gray-500"> *</span>
          {showDetails && (
            <p className="text-xs text-gray-500 mt-1">
              Acepto las normas de uso de la plataforma y el compromiso de proporcionar información veraz.
            </p>
          )}
        </div>
      </label>

      {/* Checkbox: Edad mínima (OBLIGATORIO) */}
      <label className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${disabled ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-emerald-300"}`}>
        <input
          type="checkbox"
          checked={age}
          disabled={disabled}
          onChange={(e) => {
            setAge(e.target.checked);
            handleChange("age", e.target.checked);
          }}
          required
          className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
        />
        <div className="flex-1 text-sm text-gray-700">
          <span className="font-medium">Confirmo que tengo 16 años o más</span>
          <span className="text-gray-500"> *</span>
          {showDetails && (
            <p className="text-xs text-gray-500 mt-1">
              El uso de esta plataforma está reservado a personas mayores de 16 años según la legislación vigente.
            </p>
          )}
        </div>
      </label>

      {/* Checkbox: Comunicaciones comerciales (OPCIONAL) */}
      <label className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${disabled ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-gray-200 hover:border-emerald-300"}`}>
        <input
          type="checkbox"
          checked={communications}
          disabled={disabled}
          onChange={(e) => {
            setCommunications(e.target.checked);
            handleChange("communications", e.target.checked);
          }}
          className="mt-0.5 w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
        />
        <div className="flex-1 text-sm text-gray-700">
          <span className="font-medium">
            Acepto recibir comunicaciones sobre nuevas ofertas, recomendaciones y novedades de la plataforma
          </span>
          <span className="text-gray-500 text-xs block mt-0.5">(opcional, puedes darte de baja cuando quieras)</span>
          {showDetails && (
            <p className="text-xs text-gray-500 mt-1">
              Te enviaremos ofertas que se ajusten a tu perfil y mejoras de la plataforma. Puedes desactivarlo en tu perfil.
            </p>
          )}
        </div>
      </label>

      {/* Nota sobre cookies */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-700">
          Utilizamos <Link href="/cookies" target="_blank" className="underline font-medium">cookies</Link> para garantizar el correcto funcionamiento de la plataforma.
          Al continuar navegando, aceptas su uso.
        </p>
      </div>

      {/* Nota sobre campos obligatorios */}
      <p className="text-xs text-gray-500 text-right">
        * Campos obligatorios para completar el registro
      </p>
    </div>
  );
}
