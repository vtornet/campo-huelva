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
      city?: string;
      profileImage?: string;
      phone?: string;
      bio?: string;
      email?: string;
    } | null;
  };
}

interface ProfileData {
  fullName?: string;
  companyName?: string;
  province?: string;
  city?: string;
  phone?: string;
  bio?: string;
  email?: string;
  role: string;
  experience?: string[];
  specialties?: string[];
  cropExperience?: string[];
  yearsExperience?: number;
  hasVehicle?: boolean;
  canRelocate?: boolean;
  phytosanitaryLevel?: string;
  foodHandler?: boolean;
  crewSize?: number;
  hasVan?: boolean;
  ownTools?: boolean;
  collegiateNumber?: string;
  machineryTypes?: string[];
  toolTypes?: string[];
  canDriveTractor?: boolean;
  needsAccommodation?: boolean;
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

  // Estados para el modal de perfil
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);

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

  const handleViewProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/search/user-by-id?id=${userId}`);
      if (res.ok) {
        const data = await res.json();

        // Construir objeto de perfil unificado
        const profileData: ProfileData = {
          role: data.role,
          fullName: data.profile?.fullName,
          companyName: data.profile?.companyName,
          province: data.profile?.province,
          city: data.profile?.city,
          phone: data.profile?.phone,
          bio: data.profile?.bio,
          email: data.profile?.email,
          // Campos según tipo de perfil
          experience: data.profile?.experience,
          specialties: data.profile?.specialties,
          cropExperience: data.profile?.cropExperience,
          yearsExperience: data.profile?.yearsExperience,
          hasVehicle: data.profile?.hasVehicle,
          canRelocate: data.profile?.canRelocate,
          phytosanitaryLevel: data.profile?.phytosanitaryLevel,
          foodHandler: data.profile?.foodHandler,
          crewSize: data.profile?.crewSize,
          hasVan: data.profile?.hasVan,
          ownTools: data.profile?.ownTools,
          collegiateNumber: data.profile?.collegiateNumber,
          machineryTypes: data.profile?.machineryTypes,
          toolTypes: data.profile?.toolTypes,
          canDriveTractor: data.profile?.canDriveTractor,
          needsAccommodation: data.profile?.needsAccommodation,
        };

        setSelectedProfile(profileData);
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo cargar el perfil"
      });
    } finally {
      setProfileLoading(false);
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
        fetchContacts();
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error",
          message: data.error || "No se pudo aceptar la solicitud"
        });
      }
    } catch (error) {
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
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo crear la conversación"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const displayName = (contact: any) => {
    const profile = contact.profile || contact.user?.profile;
    if (!profile) return "Usuario";
    return profile.fullName || profile.companyName || "Usuario";
  };

  const getLocation = (contact: any) => {
    const profile = contact.profile || contact.user?.profile;
    if (profile?.city) {
      return `${profile.city}, ${profile.province}`;
    }
    return profile?.province || "";
  };

  const getProfileImage = (contact: any) => {
    const profile = contact.profile || contact.user?.profile;
    return profile?.profileImage;
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'USER': return { title: 'Trabajador', icon: '👨‍🌾', bgColor: 'bg-green-100', textColor: 'text-green-700' };
      case 'FOREMAN': return { title: 'Jefe de Cuadrilla', icon: '📋', bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
      case 'ENGINEER': return { title: 'Ingeniero', icon: '🎓', bgColor: 'bg-purple-100', textColor: 'text-purple-700' };
      case 'COMPANY': return { title: 'Empresa', icon: '🏢', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
      case 'ENCARGADO': return { title: 'Encargado', icon: '👷', bgColor: 'bg-teal-100', textColor: 'text-teal-700' };
      case 'TRACTORISTA': return { title: 'Tractorista', icon: '🚜', bgColor: 'bg-amber-100', textColor: 'text-amber-700' };
      default: return { title: 'Usuario', icon: '👤', bgColor: 'bg-slate-100', textColor: 'text-slate-700' };
    }
  };

  const roleInfo = selectedProfile ? getRoleInfo(selectedProfile.role) : null;

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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{displayName(contact)}</h3>
                      <p className="text-sm text-slate-500">{getLocation(contact)}</p>
                      <p className="text-xs text-slate-400">
                        Solicitado hace {new Date(contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>
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
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-800">{displayName(contact)}</h3>
                      <p className="text-sm text-slate-500">{getLocation(contact)}</p>
                      <p className="text-xs text-slate-400">
                        Contacto desde {new Date(contact.acceptedAt || contact.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMessage(contact.user.id, displayName(contact))}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Enviar mensaje"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewProfile(contact.user.id)}
                        disabled={profileLoading}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Ver perfil"
                      >
                        {profileLoading ? (
                          <div className="w-5 h-5 animate-spin rounded-full border-b-2 border-slate-600"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
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

      {/* Modal de Perfil */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-slate-800">Perfil Completo</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6">
              {/* Info básica */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-full ${roleInfo?.bgColor} flex items-center justify-center`}>
                  <span className="text-3xl">{roleInfo?.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {selectedProfile.fullName || selectedProfile.companyName || "Sin nombre"}
                  </h3>
                  <span className={`text-sm inline-block px-2 py-0.5 rounded-full ${roleInfo?.bgColor} ${roleInfo?.textColor} font-medium`}>
                    {roleInfo?.title}
                  </span>
                  {selectedProfile.yearsExperience !== undefined && selectedProfile.yearsExperience > 0 && (
                    <span className="ml-2 text-sm text-slate-600">
                      • {selectedProfile.yearsExperience} {selectedProfile.yearsExperience === 1 ? 'año' : 'años'} de experiencia
                    </span>
                  )}
                </div>
              </div>

              {/* Ubicación */}
              {selectedProfile.province && (
                <div className="flex items-center gap-2 text-slate-600 mb-4">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{selectedProfile.city ? `${selectedProfile.city}, ${selectedProfile.province}` : selectedProfile.province}</span>
                </div>
              )}

              {/* Bio */}
              {selectedProfile.bio && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Sobre mí</h4>
                  <p className="text-slate-600">{selectedProfile.bio}</p>
                </div>
              )}

              {/* Experiencia en cultivos */}
              {(selectedProfile.experience?.length || selectedProfile.specialties?.length || selectedProfile.cropExperience?.length) ? (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">Experiencia en cultivos</h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedProfile.experience || selectedProfile.specialties || selectedProfile.cropExperience || []).slice(0, 20).map((exp: string, i: number) => (
                      <span key={i} className="text-sm px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Detalles adicionales */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProfile.hasVehicle && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span>Tiene vehículo</span>
                  </div>
                )}
                {selectedProfile.canRelocate && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 014 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Dispuesto a relocarse</span>
                  </div>
                )}
                {selectedProfile.phytosanitaryLevel && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Fitosanitario: {selectedProfile.phytosanitaryLevel}</span>
                  </div>
                )}
                {selectedProfile.foodHandler && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Manipulador de alimentos</span>
                  </div>
                )}
                {selectedProfile.crewSize && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{selectedProfile.crewSize} trabajadores en el equipo</span>
                  </div>
                )}
                {selectedProfile.hasVan && (
                  <span className="text-sm px-3 py-1 rounded-full bg-blue-50 text-blue-700">Furgoneta</span>
                )}
                {selectedProfile.ownTools && (
                  <span className="text-sm px-3 py-1 rounded-full bg-green-50 text-green-700">Herramientas propias</span>
                )}
                {selectedProfile.collegiateNumber && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Nº Colegiado: {selectedProfile.collegiateNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer del modal */}
            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition"
              >
                Cerrar
              </button>
              {selectedProfile.phone && (
                <a
                  href={`tel:${selectedProfile.phone}`}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Llamar
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
