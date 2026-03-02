import React from "react";

type MessageStatus = "SENT" | "DELIVERED" | "READ" | "FAILED";

interface MessageStatusTickProps {
  status: MessageStatus;
  isMine: boolean;
  className?: string;
}

/**
 * Componente que muestra el estado de entrega/lectura de un mensaje
 * - ✓ (gris): Enviado al servidor (SENT)
 * - ✓✓ (grises): Entregado al dispositivo del destinatario (DELIVERED)
 * - ✓✓ (azules): Leído por el destinatario (READ)
 * - ⚠️: Error al enviar (FAILED)
 */
export function MessageStatusTick({ status, isMine, className = "" }: MessageStatusTickProps) {
  // No mostrar nada si no es mi mensaje
  if (!isMine) {
    return null;
  }

  const baseTickColor = "text-current";
  const blueTickColor = isMine ? "text-blue-300" : "text-blue-500"; // Azul para leído

  // Mensaje fallido
  if (status === "FAILED") {
    return (
      <span className={`inline-flex items-center ${className}`} title="Error al enviar">
        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }

  // Enviado (un tick)
  if (status === "SENT") {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`} title="Enviado">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  // Entregado (dos ticks grises)
  if (status === "DELIVERED") {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`} title="Entregado">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </span>
    );
  }

  // Leído (dos ticks azules)
  if (status === "READ") {
    return (
      <span className={`inline-flex items-center gap-0.5 ${className}`} title="Leído">
        <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} fill="none" />
        </svg>
        <svg className="w-3.5 h-3.5 text-blue-300" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth={2} fill="none" />
        </svg>
      </span>
    );
  }

  return null;
}
