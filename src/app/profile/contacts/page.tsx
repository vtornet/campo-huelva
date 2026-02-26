"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { PageBackButton } from "@/components/BackButton";
import { useConfirmDialog } from "@/components/ConfirmDialog";

interface Contact {
  id: string;
  status: string;
  createdAt: string;
  acceptedAt?: string;
  user: {
    id: string;
    role: string;
    profile: {
      fullName?: string;
      companyName?: string;
      province?: string;
      profileImage?: string;
    } | null;
  };
}

export default function ContactsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRequestsView = searchParams.get("requests") === "true";
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch contactos aceptados
      const contactsRes = await fetch(`/api/contacts?uid=${user.uid}`);
      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data);
      }

      // Fetch solicitudes pendientes
      const requestsRes = await fetch(`/api/contacts?uid=${user.uid}&requests=true`);
      if (requestsRes.ok) {
        const data = await requestsRes.json();
        setPendingRequests(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Aceptar solicitud",
      message: "¿Quieres añadir a esta persona como contacto? Podrán enviarse mensajes privados entre vosotros."
    });

    if (!confirmed) return;

    setActionLoading(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          action: "accept"
        })
      });

      if (res.ok) {
        showNotification({
          type: "success",
          title: "Contacto añadido",
          message: "Ahora podéis enviaros mensajes privados"
        });
        fetchContacts(); // Recargar lista
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo aceptar la solicitud"
        });
      }
    } catch (error) {
      console.error("Error accepting contact:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo aceptar la solicitud"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Rechazar solicitud",
      message: "¿Seguro que quieres rechazar esta solicitud de contacto?"
    });

    if (!confirmed) return;

    setActionLoading(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          action: "reject"
        })
      });

      if (res.ok) {
        showNotification({
          type: "info",
          title: "Solicitud rechazada",
          message: "La solicitud ha sido eliminada"
        });
        fetchContacts();
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo rechazar la solicitud"
        });
      }
    } catch (error) {
      console.error("Error rejecting contact:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo rechazar la solicitud"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!user) return;

    const confirmed = await confirm({
      title: "Eliminar contacto",
      message: "¿Seguro que quieres eliminar a este contacto? Ya no podréis enviar mensajes privados."
    });

    if (!confirmed) return;

    setActionLoading(contactId);
    try {
      const res = await fetch(`/api/contacts/${contactId}?uid=${user.uid}`, {
        method: "DELETE"
      });

      if (res.ok) {
        showNotification({
          type: "info",
          title: "Contacto eliminado",
          message: "El contacto ha sido eliminado de tu lista"
        });
        fetchContacts();
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo eliminar el contacto"
        });
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo eliminar el contacto"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMessage = async (contactUserId: string, name: string) => {
    if (!user) return;

    // Crear conversación con el contacto
    try {
      const res = await fetch("/api/messages/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantIds: [user.uid, contactUserId]
        })
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/messages/${data.conversationId}`);
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo crear la conversación"
        });
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo crear la conversación"
      });
    }
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/search?userId=${userId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const displayName = (contact: any) => {
    // Para solicitudes pendientes, el perfil está en contact.profile
    // Para contactos aceptados, el perfil está en contact.user.profile
    const profile = contact.profile || contact.user?.profile;
    if (!profile) return "Usuario";
    return profile.fullName || profile.companyName || "Usuario";
  };

  const getLocation = (contact: any) => {
    const profile = contact.profile || contact.user?.profile;
    return profile?.province || "";
  };

  const getProfileImage = (contact: any) => {
    const profile = contact.profile || contact.user?.profile;
    return profile?.profileImage;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <PageBackButton />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">Mis Contactos</h1>
          </div>
          <button
            onClick={() => {
              router.push(isRequestsView ? "/profile/contacts" : "/profile/contacts?requests=true");
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isRequestsView
                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 relative"
            }`}
          >
            {isRequestsView ? (
              "Ver contactos"
            ) : (
              <>
                Ver solicitudes
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {ConfirmDialogComponent()}

        {/* Vista de solicitudes pendientes */}
        {isRequestsView ? (
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Solicitudes pendientes ({pendingRequests.length})
            </h2>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500">No tienes solicitudes pendientes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((contact) => (
                  <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      {getProfileImage(contact) ? (
                        <img
                          src={getProfileImage(contact)!}
                          alt={displayName(contact)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{displayName(contact)}</h3>
                      <p className="text-sm text-slate-500">{getLocation(contact)}</p>
                      <p className="text-xs text-slate-400">
                        Solicitado hace {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(contact.id)}
                        disabled={actionLoading === contact.id}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 text-sm font-medium"
                      >
                        {actionLoading === contact.id ? "..." : "Aceptar"}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(contact.id)}
                        disabled={actionLoading === contact.id}
                        className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-50 text-sm"
                      >
                        {actionLoading === contact.id ? "..." : "Rechazar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Vista de contactos aceptados */
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Mis contactos ({contacts.length})
            </h2>
            {contacts.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-500 mb-4">Aún no tienes contactos</p>
                <p className="text-sm text-slate-400">
                  Añade personas como contacto desde sus publicaciones o el tablón
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div key={contact.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {getProfileImage(contact) ? (
                        <img
                          src={getProfileImage(contact)!}
                          alt={displayName(contact)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xl">👤</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{displayName(contact)}</h3>
                      <p className="text-sm text-slate-500">{getLocation(contact)}</p>
                      <p className="text-xs text-slate-400">
                        Contacto desde {new Date(contact.acceptedAt || contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMessage(contact.user.id, displayName(contact))}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Enviar mensaje"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 21h9m-7.538-.483.484-1.369-1.485a3.5 3.5 0 01-5.174 2.804 3.5 3.5 0 015.174 2.804 1.485 1.369.484 1.485 1.369H21M12 17.75V19" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewProfile(contact.user.id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Ver perfil"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        disabled={actionLoading === contact.id}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar contacto"
                      >
                        {actionLoading === contact.id ? (
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 011-1h1m-1 1l-3 3m5 4l-3 3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
