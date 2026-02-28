"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "./ConfirmDialog";

interface AddContactButtonProps {
  userId: string;
  className?: string;
  variant?: "button" | "icon" | "text";
  label?: string;
  userRole?: string; // Rol del usuario actual (opcional, se obtiene de la API si no se proporciona)
}

export function AddContactButton({
  userId,
  className = "",
  variant = "button",
  label = "Añadir como contacto",
  userRole: propUserRole
}: AddContactButtonProps) {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [loading, setLoading] = useState(false);
  const [isContact, setIsContact] = useState<boolean | null>(null);
  const [fetchedRole, setFetchedRole] = useState<string | null>(null);

  // Obtener rol del usuario si no se proporciona como prop
  useEffect(() => {
    if (propUserRole) {
      setFetchedRole(propUserRole);
      return;
    }

    if (user) {
      fetch(`/api/user/me?uid=${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data.role) {
            setFetchedRole(data.role);
          }
        })
        .catch(err => console.error("Error fetching user role:", err));
    }
  }, [user, propUserRole]);

  if (!user || user.uid === userId) {
    return null; // No mostrar botón si es el propio usuario
  }

  // Las empresas no pueden añadir contactos
  const effectiveRole = propUserRole || fetchedRole;
  if (effectiveRole === "COMPANY") {
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

  // Icono de añadir usuario (UserCirclePlus de Heroicons)
  const UserPlusIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
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
