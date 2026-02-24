// src/components/CompanyVerification.tsx
// Componente para verificar empresas en el formulario

import { useState } from "react";

interface CompanyData {
  razonSocial: string;
  direccion?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
}

interface VerificationResult {
  success: boolean;
  method: "AEAT" | "LOCAL";
  company?: CompanyData;
  error?: string;
  aeatConfigured?: boolean;
}

interface CompanyVerificationProps {
  cif: string;
  onVerified: (data: CompanyData, method: "AEAT" | "LOCAL") => void;
  disabled?: boolean;
}

export function CompanyVerification({ cif, onVerified, disabled }: CompanyVerificationProps) {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string>("");

  const verifyCompany = async () => {
    if (!cif || cif.length < 9) {
      setError("Introduce un CIF válido primero");
      return;
    }

    setVerifying(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/companies/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cif }),
      });

      const data: VerificationResult = await response.json();

      setResult(data);

      if (data.success && data.company) {
        onVerified(data.company, data.method);
      } else if (!data.success) {
        setError(data.error || "No se pudo verificar la empresa");
      }
    } catch (err) {
      setError("Error de conexión al verificar la empresa");
    } finally {
      setVerifying(false);
    }
  };

  const getMethodBadge = () => {
    if (!result) return null;

    const isAeat = result.method === "AEAT";
    return (
      <span
        className={`text-xs px-2 py-1 rounded ${
          isAeat
            ? "bg-green-100 text-green-800"
            : "bg-yellow-100 text-yellow-800"
        }`}
      >
        {isAeat ? "✓ Verificado por AEAT" : "⚠ Verificación local"}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={verifyCompany}
          disabled={disabled || verifying || !cif || cif.length < 9}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${disabled || verifying || !cif || cif.length < 9
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
            }
          `}
        >
          {verifying ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Verificando...
            </span>
          ) : (
            "🔍 Verificar empresa"
          )}
        </button>

        {result && getMethodBadge()}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {result && result.success && result.company && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h4 className="font-semibold text-green-800">Empresa verificada</h4>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p><span className="font-medium">Razón social:</span> {result.company.razonSocial}</p>
                {result.company.direccion && (
                  <p><span className="font-medium">Dirección:</span> {result.company.direccion}</p>
                )}
                {result.company.localidad && result.company.provincia && (
                  <p><span className="font-medium">Localidad:</span> {result.company.localidad}, {result.company.provincia}</p>
                )}
                {result.company.codigoPostal && (
                  <p><span className="font-medium">CP:</span> {result.company.codigoPostal}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!result?.aeatConfigured && result?.method === "LOCAL" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          ℹ️ La verificación con AEAT no está configurada. Se usa validación local (formato del CIF).
          <br />
          <span className="text-xs">Para verificación completa, contacta con el administrador.</span>
        </div>
      )}
    </div>
  );
}

export default CompanyVerification;
