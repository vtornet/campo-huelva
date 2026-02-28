"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "./ConfirmDialog";

interface AddContactButtonProps {
  userId: string;
  className?: string;
  variant?: "button" | "icon" | "text";
  label?: string;
}

export function AddContactButton({
  userId,
  className = "",
  variant = "button",
  label = "Añadir como contacto"
}: AddContactButtonProps) {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [isContact, setIsContact] = useState<boolean | null>(null);

  if (!user || user.uid === userId) {
    return null; // No mostrar botón si es el propio usuario
  }

  // Las empresas no pueden añadir contactos
  if (user.role === "COMPANY") {
    return null;
  }

  const handleAddContact = async () => {
    const confirmed = await confirm({
      title: "Añadir como contacto",
      message: "Esta persona recibirá una notificación y podrá ver tu perfil. ¿Deseas continuar?"
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requesterId: user.uid,
          recipientId: userId
        })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.message === "Ya sois contactos") {
          setIsContact(true);
          showNotification({
            type: "info",
            title: "Contacto",
            message: "Esta persona ya está en tu lista de contactos"
          });
        } else if (data.message === "Solicitud ya enviada") {
          showNotification({
            type: "info",
            title: "Solicitud enviada",
            message: "Ya has enviado una solicitud a esta persona"
          });
        } else {
          showNotification({
            type: "success",
            title: "Solicitud enviada",
            message: "La persona recibirá una notificación"
          });
        }
      } else {
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo enviar la solicitud"
        });
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo enviar la solicitud"
      });
    } finally {
      setLoading(false);
    }
  };

  // Icono de usuario con signo + (UserPlus)
  const UserPlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 9h6m-6 0h-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
    </svg>
  );

  // Ya es contacto
  if (isContact) {
    return (
      <span className={`text-emerald-600 text-sm flex items-center gap-1 ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Contacto
      </span>
    );
  }

  if (variant === "icon") {
    return (
      <>
        {ConfirmDialogComponent()}
        <button
          onClick={handleAddContact}
          disabled={loading}
          className={`p-2 hover:bg-emerald-50 rounded-lg transition-colors text-emerald-600 disabled:opacity-50 ${className}`}
          title={label}
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 4 0v8h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <UserPlusIcon />
          )}
        </button>
      </>
    );
  }

  if (variant === "text") {
    return (
      <>
        {ConfirmDialogComponent()}
        <button
          onClick={handleAddContact}
          disabled={loading}
          className={`text-emerald-600 hover:text-emerald-700 text-sm font-medium disabled:opacity-50 ${className}`}
        >
          {loading ? "Enviando..." : label}
        </button>
      </>
    );
  }

  // Por defecto: botón completo
  return (
    <>
      {ConfirmDialogComponent()}
      <button
        onClick={handleAddContact}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 0 4 0v8h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enviando...
          </>
        ) : (
          <>
            <UserPlusIcon />
            {label}
          </>
        )}
      </button>
    </>
  );
}
