"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import { useConfirmDialog } from "@/components/ConfirmDialog";
import { BackButton } from "@/components/BackButton";
import { AddContactButton } from "@/components/AddContactButton";

type ProfileType = "worker" | "foreman" | "engineer" | "encargado" | "tractorist";

// Tipo base para todos los perfiles
interface BaseProfile {
  fullName: string;
  province?: string;
  city?: string;
  bio?: string;
  profileImage?: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
  workerProfile?: BaseProfile & {
    experience: string[];
    toolsExperience: string[];
    hasVehicle: boolean;
    yearsExperience: number;
  };
  foremanProfile?: BaseProfile & {
    crewSize: number;
    hasVan: boolean;
    yearsExperience: number;
    specialties: string[];
  };
  engineerProfile?: BaseProfile & {
    collegiateNumber?: string;
    yearsExperience?: number;
    specialties?: string[];
    servicesOffered?: string[];
    cropExperience?: string[];
  };
  encargadoProfile?: BaseProfile & {
    yearsExperience?: number;
    canDriveTractor?: boolean;
    cropExperience?: string[];
    warehouseExperience?: string[];
    hasFarmTransformation?: boolean;
    hasOfficeSkills?: boolean;
    hasReportSkills?: boolean;
  };
  tractoristProfile?: BaseProfile & {
    machineryTypes: string[];
    toolTypes: string[];
    yearsExperience: number;
  };
}

type ProfileData = UserProfile;
type ProfileTypeData = BaseProfile & Record<string, any>;

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotifications();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        if (!res.ok) {
          throw new Error("Error al cargar el perfil");
        }
        const data = await res.json();
        setProfile(data);
        setIsOwnProfile(user?.uid === params.id);
      } catch (error) {
        console.error("Error fetching profile:", error);
        showNotification({
          type: "error",
          title: "Error",
          message: "No se pudo cargar el perfil del usuario.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProfile();
    }
  }, [params.id, user, showNotification]);

  const getProfileType = (): ProfileType | null => {
    if (!profile) return null;
    if (profile.workerProfile) return "worker";
    if (profile.foremanProfile) return "foreman";
    if (profile.engineerProfile) return "engineer";
    if (profile.encargadoProfile) return "encargado";
    if (profile.tractoristProfile) return "tractorist";
    return null;
  };

  const getProfileData = (): ProfileTypeData | null => {
    const type = getProfileType();
    if (!type || !profile) return null;
    return profile[`${type}Profile` as keyof typeof profile] as ProfileTypeData | null;
  };

  const getRoleInfo = () => {
    const roleMap = {
      worker: { name: "Trabajador/Peón", color: "green", icon: "👨‍🌾" },
      foreman: { name: "Jefe de Cuadrilla", color: "orange", icon: "📋" },
      engineer: { name: "Ingeniero Agrónomo", color: "purple", icon: "🎓" },
      encargado: { name: "Encargado/Capataz", color: "teal", icon: "👷" },
      tractorist: { name: "Tractorista", color: "amber", icon: "🚜" },
    };
    const type = getProfileType();
    return type ? roleMap[type] : { name: "Usuario", color: "slate", icon: "👤" };
  };

  const handleBlock = async () => {
    const confirmed = await confirm({
      title: "Bloquear usuario",
      message: "¿Estás seguro de que quieres bloquear a este usuario? No podrás ver sus publicaciones ni contactarle.",
      confirmText: "Bloquear",
      type: "danger",
    });

    if (!confirmed) return;

    setBlocking(true);
    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockedUserId: profile!.id }),
      });

      if (!res.ok) {
        throw new Error("Error al bloquear usuario");
      }

      showNotification({
        type: "success",
        title: "Usuario bloqueado",
        message: "Has bloqueado a este usuario correctamente.",
      });
      router.push("/");
    } catch (error) {
      console.error("Error blocking user:", error);
      showNotification({
        type: "error",
        title: "Error",
        message: "No se pudo bloquear al usuario.",
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleReport = () => {
    // Navegar a la página principal con el modal de denuncia abierto
    router.push(`/?reportUser=${profile!.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Usuario no encontrado</h1>
          <p className="text-slate-500 mb-4">El perfil que buscas no existe o ha sido eliminado.</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (profile.isBanned) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12 0a9 9 0 01-9 9 9 9 0 01-9-9m9 9c0 4.994-4.05 9-9 9" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Usuario suspendido</h1>
          <p className="text-slate-500">
            {profile.banReason || "Este usuario ha sido suspendido por violating las normas de la comunidad."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const profileData = getProfileData();
  const roleInfo = getRoleInfo();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className={`bg-gradient-to-r from-${roleInfo.color}-600 to-${roleInfo.color}-500 text-white`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          <BackButton className="text-white hover:text-indigo-100 mb-4" />
          <div className="flex items-start gap-4">
            {profileData?.profileImage ? (
              <img
                src={profileData.profileImage}
                alt={profileData.fullName}
                className="w-20 h-20 rounded-xl object-cover bg-white/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-3xl">{roleInfo.icon}</span>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profileData?.fullName}</h1>
              <p className="text-indigo-100">{roleInfo.name}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-indigo-100">
                {profileData?.province && profileData?.city && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profileData.city}, {profileData.province}
                  </span>
                )}
                {profileData?.yearsExperience !== undefined && profileData.yearsExperience > 0 && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profileData.yearsExperience} año{profileData.yearsExperience !== 1 ? "s" : ""} de experiencia
                  </span>
                )}
                {profileData?.hasVehicle !== undefined && profileData.hasVehicle && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 11l7-7 7 7M5 18l7-7 7M19 13h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Tiene vehículo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Acciones */}
        {!isOwnProfile && user && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <AddContactButton userId={profile.id} />
              <button
                onClick={handleReport}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
              >
                Denunciar perfil
              </button>
              <button
                onClick={handleBlock}
                disabled={blocking}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                {blocking ? "Bloqueando..." : "Bloquear usuario"}
              </button>
            </div>
          </div>
        )}

        {/* Información básica */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Información</h2>
          {profileData?.bio && (
            <p className="text-slate-700 mb-4">{profileData.bio}</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {profileData?.province && (
              <div>
                <span className="text-slate-500">Provincia</span>
                <p className="font-medium text-slate-800">{profileData.province}</p>
              </div>
            )}
            {profileData?.city && (
              <div>
                <span className="text-slate-500">Localidad</span>
                <p className="font-medium text-slate-800">{profileData.city}</p>
              </div>
            )}
            {profileData?.yearsExperience !== undefined && profileData.yearsExperience > 0 && (
              <div>
                <span className="text-slate-500">Experiencia</span>
                <p className="font-medium text-slate-800">{profileData.yearsExperience} año{profileData.yearsExperience !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalles específicos por rol */}
        {profile.workerProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Experiencia Laboral</h2>
            {profile.workerProfile.experience && profile.workerProfile.experience.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {profile.workerProfile.experience.map((exp) => (
                  <span key={exp} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                    {exp}
                  </span>
                ))}
              </div>
            )}
            {profile.workerProfile.toolsExperience && profile.workerProfile.toolsExperience.length > 0 && (
              <div>
                <span className="text-sm text-slate-500 mb-2 block">Herramientas manuales</span>
                <div className="flex flex-wrap gap-2">
                  {profile.workerProfile.toolsExperience.map((tool) => (
                    <span key={tool} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {profile.foremanProfile && profile.foremanProfile.specialties && profile.foremanProfile.specialties.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Especialidades</h2>
            <div className="flex flex-wrap gap-2">
              {profile.foremanProfile.specialties.map((spec) => (
                <span key={spec} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.tractoristProfile && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Maquinaria y Herramientas</h2>
            {profile.tractoristProfile.machineryTypes && profile.tractoristProfile.machineryTypes.length > 0 && (
              <div className="mb-4">
                <span className="text-sm text-slate-500 mb-2 block">Tipos de maquinaria</span>
                <div className="flex flex-wrap gap-2">
                  {profile.tractoristProfile.machineryTypes.map((machine) => (
                    <span key={machine} className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm">
                      {machine}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.tractoristProfile.toolTypes && profile.tractoristProfile.toolTypes.length > 0 && (
              <div>
                <span className="text-sm text-slate-500 mb-2 block">Tipos de aperos</span>
                <div className="flex flex-wrap gap-2">
                  {profile.tractoristProfile.toolTypes.map((tool) => (
                    <span key={tool} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {ConfirmDialogComponent}
    </div>
  );
}
