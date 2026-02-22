"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/components/Notifications";
import {
  PROVINCIAS,
  MUNICIPIOS_POR_PROVINCIA,
  EXPERIENCIAS_TRABAJADOR,
  ESPECIALIDADES_MANIJERO,
  NIVELES_FITOSANITARIO,
  RANGOS_CUADRILLA,
  RANGOS_EXPERIENCIA,
  CULTIVOS,
} from "@/lib/constants";

// Especialidades de ingeniero
const ESPECIALIDADES_INGENIERO = [
  "Gestión de riego", "Fitopatología", "Nutrición vegetal",
  "Sistemas de drenaje", "Producción integrada", "Agricultura ecológica",
  "Control de plagas", "Suelos y fertilización", "Variedades y portainjertos",
  "Postcosecha", "Certificaciones (GlobalGAP, etc.)", "Gestión de explotaciones"
];

// Servicios de ingeniero
const SERVICIOS_INGENIERO = [
  "Asesoramiento técnico", "Peritajes y tasaciones", "Auditorías",
  "Formación y capacitación", "Redacción de proyectos", "Gestión de subvenciones",
  "Análisis de suelo y agua", "Diseño de instalaciones", "Planes de fertilización",
  "Control de calidad", "Consultoría de inversión", "Gestión documental"
];

// Interfaces para los resultados
interface WorkerResult {
  id: string;
  role: "USER";
  fullName: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  experience: string[];
  bio: string | null;
  hasVehicle: boolean;
  canRelocate: boolean;
  foodHandler: boolean;
  phytosanitaryLevel: string | null;
}

interface ForemanResult {
  id: string;
  role: "FOREMAN";
  fullName: string;
  city: string | null;
  province: string;
  phone: string;
  crewSize: number;
  workArea: string[];
  hasVan: boolean;
  needsBus: boolean;
  ownTools: boolean;
  yearsExperience: number | null;
  specialties: string[];
  bio: string | null;
}

interface EngineerResult {
  id: string;
  role: "ENGINEER";
  fullName: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  collegiateNumber: string | null;
  yearsExperience: number | null;
  cropExperience: string[];
  specialties: string[];
  servicesOffered: string[];
  isAvailable: boolean;
  canTravel: boolean;
  bio: string | null;
}

type SearchResult = WorkerResult | ForemanResult | EngineerResult;

type RoleFilter = "all" | "USER" | "FOREMAN" | "ENGINEER";

export default function ProfileSearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showNotification } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);

  // Filtros principales
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  // Filtros de trabajadores
  const [workerFilters, setWorkerFilters] = useState({
    experience: [] as string[],
    hasVehicle: "" as "" | "true" | "false",
    canRelocate: "" as "" | "true" | "false",
    foodHandler: "" as "" | "true" | "false",
    phytosanitaryLevel: "",
  });

  // Filtros de manijeros
  const [foremanFilters, setForemanFilters] = useState({
    specialties: [] as string[],
    crewSizeMin: "",
    crewSizeMax: "",
    yearsExperienceMin: "",
    yearsExperienceMax: "",
    hasVan: "" as "" | "true" | "false",
    needsBus: "" as "" | "true" | "false",
    ownTools: "" as "" | "true" | "false",
  });

  // Filtros de ingenieros
  const [engineerFilters, setEngineerFilters] = useState({
    cropExperience: [] as string[],
    specialties: [] as string[],
    servicesOffered: [] as string[],
    yearsExperienceMin: "",
    yearsExperienceMax: "",
    isAvailable: "" as "" | "true" | "false",
    canTravel: "" as "" | "true" | "false",
  });

  // Control de visibilidad de filtros avanzados
  const [showWorkerFilters, setShowWorkerFilters] = useState(true);
  const [showForemanFilters, setShowForemanFilters] = useState(true);
  const [showEngineerFilters, setShowEngineerFilters] = useState(true);

  // Proteger la página: solo empresas pueden acceder
  useEffect(() => {
    if (!authLoading && user) {
      // Verificar rol
      fetch(`/api/user/me?uid=${user.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.role !== "COMPANY") {
            router.push("/");
          }
        })
        .catch(() => {
          router.push("/");
        });
    }
  }, [user, authLoading, router]);

  // Realizar búsqueda
  const performSearch = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (searchQuery) params.append("q", searchQuery);
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (provinceFilter) params.append("province", provinceFilter);
      if (cityFilter) params.append("city", cityFilter);

      // Filtros de trabajadores
      if (roleFilter === "all" || roleFilter === "USER") {
        if (workerFilters.experience.length > 0) {
          params.append("experience", workerFilters.experience.join(","));
        }
        if (workerFilters.hasVehicle) {
          params.append("hasVehicle", workerFilters.hasVehicle);
        }
        if (workerFilters.canRelocate) {
          params.append("canRelocate", workerFilters.canRelocate);
        }
        if (workerFilters.foodHandler) {
          params.append("foodHandler", workerFilters.foodHandler);
        }
        if (workerFilters.phytosanitaryLevel) {
          params.append("phytosanitaryLevel", workerFilters.phytosanitaryLevel);
        }
      }

      // Filtros de manijeros
      if (roleFilter === "all" || roleFilter === "FOREMAN") {
        if (foremanFilters.specialties.length > 0) {
          params.append("specialties", foremanFilters.specialties.join(","));
        }
        if (foremanFilters.crewSizeMin) {
          params.append("crewSizeMin", foremanFilters.crewSizeMin);
        }
        if (foremanFilters.crewSizeMax) {
          params.append("crewSizeMax", foremanFilters.crewSizeMax);
        }
        if (foremanFilters.yearsExperienceMin) {
          params.append("yearsExperienceMin", foremanFilters.yearsExperienceMin);
        }
        if (foremanFilters.yearsExperienceMax) {
          params.append("yearsExperienceMax", foremanFilters.yearsExperienceMax);
        }
        if (foremanFilters.hasVan) {
          params.append("hasVan", foremanFilters.hasVan);
        }
        if (foremanFilters.needsBus) {
          params.append("needsBus", foremanFilters.needsBus);
        }
        if (foremanFilters.ownTools) {
          params.append("ownTools", foremanFilters.ownTools);
        }
      }

      // Filtros de ingenieros
      if (roleFilter === "all" || roleFilter === "ENGINEER") {
        if (engineerFilters.cropExperience.length > 0) {
          params.append("cropExperience", engineerFilters.cropExperience.join(","));
        }
        if (engineerFilters.specialties.length > 0) {
          params.append("specialties", engineerFilters.specialties.join(","));
        }
        if (engineerFilters.servicesOffered.length > 0) {
          params.append("servicesOffered", engineerFilters.servicesOffered.join(","));
        }
        if (engineerFilters.yearsExperienceMin) {
          params.append("yearsExperienceMin", engineerFilters.yearsExperienceMin);
        }
        if (engineerFilters.yearsExperienceMax) {
          params.append("yearsExperienceMax", engineerFilters.yearsExperienceMax);
        }
        if (engineerFilters.isAvailable) {
          params.append("isAvailable", engineerFilters.isAvailable);
        }
        if (engineerFilters.canTravel) {
          params.append("canTravel", engineerFilters.canTravel);
        }
      }

      const res = await fetch(`/api/profiles/search?${params.toString()}`, {
        headers: {
          "x-user-id": user.uid,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotal(data.total || 0);
      } else {
        const data = await res.json();
        showNotification({
          type: "error",
          title: "Error al buscar",
          message: data.error || "Inténtalo de nuevo más tarde.",
        });
      }
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: "Error de conexión",
        message: "Verifica tu internet e inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setProvinceFilter("");
    setCityFilter("");
    setWorkerFilters({
      experience: [],
      hasVehicle: "",
      canRelocate: "",
      foodHandler: "",
      phytosanitaryLevel: "",
    });
    setForemanFilters({
      specialties: [],
      crewSizeMin: "",
      crewSizeMax: "",
      yearsExperienceMin: "",
      yearsExperienceMax: "",
      hasVan: "",
      needsBus: "",
      ownTools: "",
    });
    setEngineerFilters({
      cropExperience: [],
      specialties: [],
      servicesOffered: [],
      yearsExperienceMin: "",
      yearsExperienceMax: "",
      isAvailable: "",
      canTravel: "",
    });
    setResults([]);
    setTotal(0);
  };

  // Toggle checkbox para arrays (experiencia, especialidades)
  const toggleArrayFilter = (
    value: string,
    current: string[],
    setter: (val: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter((v) => v !== value));
    } else {
      setter([...current, value]);
    }
  };

  // Renderizar tarjeta de trabajador
  const renderWorkerCard = (worker: WorkerResult) => (
    <div
      key={worker.id}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {worker.fullName || "Sin nombre"}
            </h3>
            <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
              Trabajador
            </span>
          </div>
        </div>
      </div>

      {worker.bio && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{worker.bio}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            {worker.city}, {worker.province}
          </span>
        </div>

        {worker.experience.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {worker.experience.slice(0, 5).map((exp) => (
              <span
                key={exp}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700"
              >
                {exp}
              </span>
            ))}
            {worker.experience.length > 5 && (
              <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                +{worker.experience.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {worker.hasVehicle && (
            <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Vehículo
            </span>
          )}
          {worker.canRelocate && (
            <span className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Se traslada
            </span>
          )}
          {worker.foodHandler && (
            <span className="text-xs px-2 py-1 rounded-md bg-orange-50 text-orange-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Manipulador
            </span>
          )}
          {worker.phytosanitaryLevel && (
            <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              {worker.phytosanitaryLevel}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar tarjeta de manijero
  const renderForemanCard = (foreman: ForemanResult) => (
    <div
      key={foreman.id}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">{foreman.fullName}</h3>
            <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
              Manijero
            </span>
          </div>
        </div>
      </div>

      {foreman.bio && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{foreman.bio}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            {foreman.city}, {foreman.province}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <strong>{foreman.crewSize}</strong> trabajadores
          </span>
          {foreman.yearsExperience !== null && foreman.yearsExperience > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <strong>{foreman.yearsExperience}</strong> años experiencia
            </span>
          )}
        </div>

        {foreman.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {foreman.specialties.slice(0, 5).map((spec) => (
              <span
                key={spec}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700"
              >
                {spec}
              </span>
            ))}
            {foreman.specialties.length > 5 && (
              <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                +{foreman.specialties.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-3">
          {foreman.hasVan && (
            <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Furgoneta
            </span>
          )}
          {foreman.needsBus && (
            <span className="text-xs px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Necesita bus
            </span>
          )}
          {foreman.ownTools && (
            <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Herramientas
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Renderizar tarjeta de ingeniero
  const renderEngineerCard = (engineer: EngineerResult) => (
    <div
      key={engineer.id}
      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              {engineer.fullName || "Sin nombre"}
            </h3>
            <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              Ingeniero Agrícola
            </span>
          </div>
        </div>
      </div>

      {engineer.bio && (
        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{engineer.bio}</p>
      )}

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-slate-600">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span>
            {engineer.city}, {engineer.province}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-600">
          {engineer.collegiateNumber && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-4 4h8"
                />
              </svg>
              <span className="text-xs">Colegiado: {engineer.collegiateNumber}</span>
            </span>
          )}
          {engineer.yearsExperience !== null && engineer.yearsExperience > 0 && (
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <strong>{engineer.yearsExperience}</strong> años
            </span>
          )}
        </div>

        {engineer.cropExperience.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {engineer.cropExperience.slice(0, 5).map((crop) => (
              <span
                key={crop}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700"
              >
                {crop}
              </span>
            ))}
            {engineer.cropExperience.length > 5 && (
              <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                +{engineer.cropExperience.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {engineer.isAvailable && (
          <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Disponible
          </span>
        )}
        {engineer.canTravel && (
          <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Viaja
          </span>
        )}
        {engineer.servicesOffered.slice(0, 2).map((service) => (
          <span key={service} className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700">
            {service}
          </span>
        ))}
        {engineer.servicesOffered.length > 2 && (
          <span className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700">
            +{engineer.servicesOffered.length - 2}
          </span>
        )}
      </div>
    </div>
  );

  // Mostrar loading mientras verificamos autenticación
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no hay usuario, no mostramos nada (redirección en curso)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">
                Buscar Perfiles
              </h1>
              <p className="text-sm text-slate-500">
                Encuentra trabajadores, manijeros e ingenieros para tu empresa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {total} {total === 1 ? "resultado" : "resultados"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Panel de filtros */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">Filtros</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Limpiar
                </button>
              </div>

              <div className="space-y-4">
                {/* Búsqueda por texto */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Buscar por nombre o ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Juan, Huelva..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") performSearch();
                    }}
                  />
                </div>

                {/* Tipo de perfil */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de perfil
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={roleFilter}
                    onChange={(e) =>
                      setRoleFilter(e.target.value as RoleFilter)
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="USER">Trabajadores</option>
                    <option value="FOREMAN">Manijeros</option>
                    <option value="ENGINEER">Ingenieros</option>
                  </select>
                </div>

                {/* Provincia */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Provincia
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={provinceFilter}
                    onChange={(e) => {
                      setProvinceFilter(e.target.value);
                      setCityFilter("");
                    }}
                  >
                    <option value="">Todas las provincias</option>
                    {PROVINCIAS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                {provinceFilter && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Ciudad / Localidad
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {MUNICIPIOS_POR_PROVINCIA[provinceFilter]?.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <hr className="border-slate-200" />

                {/* Filtros de Trabajadores */}
                <div>
                  <button
                    onClick={() => setShowWorkerFilters(!showWorkerFilters)}
                    className="w-full flex items-center justify-between text-sm font-medium text-green-700"
                  >
                    <span>Filtros de Trabajadores</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showWorkerFilters ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showWorkerFilters && (
                    <div className="mt-3 space-y-3">
                      {/* Experiencia */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Experiencia
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                          {EXPERIENCIAS_TRABAJADOR.map((exp) => (
                            <label
                              key={exp}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-green-600 focus:ring-green-500"
                                checked={workerFilters.experience.includes(exp)}
                                onChange={() =>
                                  toggleArrayFilter(
                                    exp,
                                    workerFilters.experience,
                                    (val) =>
                                      setWorkerFilters({
                                        ...workerFilters,
                                        experience: val,
                                      })
                                  )
                                  }
                              />
                              {exp}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Vehículo propio */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Vehículo propio
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={workerFilters.hasVehicle}
                          onChange={(e) =>
                            setWorkerFilters({
                              ...workerFilters,
                              hasVehicle: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Disponible para trasladarse */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Disponible para trasladarse
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={workerFilters.canRelocate}
                          onChange={(e) =>
                            setWorkerFilters({
                              ...workerFilters,
                              canRelocate: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Manipulador de alimentos */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Carnet manipulador
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={workerFilters.foodHandler}
                          onChange={(e) =>
                            setWorkerFilters({
                              ...workerFilters,
                              foodHandler: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Nivel fitosanitario */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Nivel fitosanitario
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={workerFilters.phytosanitaryLevel}
                          onChange={(e) =>
                            setWorkerFilters({
                              ...workerFilters,
                              phytosanitaryLevel: e.target.value,
                            })
                          }
                        >
                          <option value="">Todos</option>
                          {NIVELES_FITOSANITARIO.map((n) => (
                            <option key={n} value={n}>
                              {n}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-slate-200" />

                {/* Filtros de Manijeros */}
                <div>
                  <button
                    onClick={() => setShowForemanFilters(!showForemanFilters)}
                    className="w-full flex items-center justify-between text-sm font-medium text-orange-700"
                  >
                    <span>Filtros de Manijeros</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showForemanFilters ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showForemanFilters && (
                    <div className="mt-3 space-y-3">
                      {/* Especialidades */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Especialidades
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                          {ESPECIALIDADES_MANIJERO.map((spec) => (
                            <label
                              key={spec}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-orange-600 focus:ring-orange-500"
                                checked={foremanFilters.specialties.includes(spec)}
                                onChange={() =>
                                  toggleArrayFilter(
                                    spec,
                                    foremanFilters.specialties,
                                    (val) =>
                                      setForemanFilters({
                                        ...foremanFilters,
                                        specialties: val,
                                      })
                                  )
                                  }
                              />
                              {spec}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Tamaño de cuadrilla */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Mín. trabajadores
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={foremanFilters.crewSizeMin}
                            onChange={(e) =>
                              setForemanFilters({
                                ...foremanFilters,
                                crewSizeMin: e.target.value,
                              })
                            }
                          >
                            <option value="">Min</option>
                            {RANGOS_CUADRILLA.map((r) => (
                              <option key={r.min} value={r.min.toString()}>
                                {r.min}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Máx. trabajadores
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={foremanFilters.crewSizeMax}
                            onChange={(e) =>
                              setForemanFilters({
                                ...foremanFilters,
                                crewSizeMax: e.target.value,
                              })
                            }
                          >
                            <option value="">Max</option>
                            {RANGOS_CUADRILLA.map((r) => (
                              <option key={r.max} value={r.max.toString()}>
                                {r.max}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Años de experiencia */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Mín. años exp.
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={foremanFilters.yearsExperienceMin}
                            onChange={(e) =>
                              setForemanFilters({
                                ...foremanFilters,
                                yearsExperienceMin: e.target.value,
                              })
                            }
                          >
                            <option value="">Min</option>
                            {RANGOS_EXPERIENCIA.map((r) => (
                              <option key={r.min} value={r.min.toString()}>
                                {r.min}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Máx. años exp.
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={foremanFilters.yearsExperienceMax}
                            onChange={(e) =>
                              setForemanFilters({
                                ...foremanFilters,
                                yearsExperienceMax: e.target.value,
                              })
                            }
                          >
                            <option value="">Max</option>
                            {RANGOS_EXPERIENCIA.map((r) => (
                              <option key={r.max} value={r.max.toString()}>
                                {r.max}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Furgoneta */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Tiene furgoneta
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={foremanFilters.hasVan}
                          onChange={(e) =>
                            setForemanFilters({
                              ...foremanFilters,
                              hasVan: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Necesita autobús */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Necesita autobús
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={foremanFilters.needsBus}
                          onChange={(e) =>
                            setForemanFilters({
                              ...foremanFilters,
                              needsBus: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Herramientas propias */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Herramientas propias
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={foremanFilters.ownTools}
                          onChange={(e) =>
                            setForemanFilters({
                              ...foremanFilters,
                              ownTools: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-slate-200" />

                {/* Filtros de Ingenieros */}
                <div>
                  <button
                    onClick={() => setShowEngineerFilters(!showEngineerFilters)}
                    className="w-full flex items-center justify-between text-sm font-medium text-purple-700"
                  >
                    <span>Filtros de Ingenieros</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showEngineerFilters ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showEngineerFilters && (
                    <div className="mt-3 space-y-3">
                      {/* Experiencia en cultivos */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Experiencia en cultivos
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                          {CULTIVOS.map((crop) => (
                            <label
                              key={crop}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-purple-600 focus:ring-purple-500"
                                checked={engineerFilters.cropExperience.includes(crop)}
                                onChange={() =>
                                  toggleArrayFilter(
                                    crop,
                                    engineerFilters.cropExperience,
                                    (val) =>
                                      setEngineerFilters({
                                        ...engineerFilters,
                                        cropExperience: val,
                                      })
                                  )
                                  }
                              />
                              {crop}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Especialidades técnicas */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Especialidades técnicas
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                          {ESPECIALIDADES_INGENIERO.map((spec) => (
                            <label
                              key={spec}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-purple-600 focus:ring-purple-500"
                                checked={engineerFilters.specialties.includes(spec)}
                                onChange={() =>
                                  toggleArrayFilter(
                                    spec,
                                    engineerFilters.specialties,
                                    (val) =>
                                      setEngineerFilters({
                                        ...engineerFilters,
                                        specialties: val,
                                      })
                                  )
                                  }
                              />
                              {spec}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Servicios ofrecidos */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Servicios ofrecidos
                        </label>
                        <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                          {SERVICIOS_INGENIERO.map((serv) => (
                            <label
                              key={serv}
                              className="flex items-center gap-2 text-xs py-1"
                            >
                              <input
                                type="checkbox"
                                className="rounded text-purple-600 focus:ring-purple-500"
                                checked={engineerFilters.servicesOffered.includes(serv)}
                                onChange={() =>
                                  toggleArrayFilter(
                                    serv,
                                    engineerFilters.servicesOffered,
                                    (val) =>
                                      setEngineerFilters({
                                        ...engineerFilters,
                                        servicesOffered: val,
                                      })
                                  )
                                  }
                              />
                              {serv}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Años de experiencia */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Mín. años exp.
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={engineerFilters.yearsExperienceMin}
                            onChange={(e) =>
                              setEngineerFilters({
                                ...engineerFilters,
                                yearsExperienceMin: e.target.value,
                              })
                            }
                          >
                            <option value="">Min</option>
                            {RANGOS_EXPERIENCIA.map((r) => (
                              <option key={r.min} value={r.min.toString()}>
                                {r.min}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">
                            Máx. años exp.
                          </label>
                          <select
                            className="w-full px-2 py-2 border border-slate-200 rounded-lg text-sm"
                            value={engineerFilters.yearsExperienceMax}
                            onChange={(e) =>
                              setEngineerFilters({
                                ...engineerFilters,
                                yearsExperienceMax: e.target.value,
                              })
                            }
                          >
                            <option value="">Max</option>
                            {RANGOS_EXPERIENCIA.map((r) => (
                              <option key={r.max} value={r.max.toString()}>
                                {r.max}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Disponible */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Disponible para nuevos proyectos
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={engineerFilters.isAvailable}
                          onChange={(e) =>
                            setEngineerFilters({
                              ...engineerFilters,
                              isAvailable: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>

                      {/* Puede viajar */}
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Puede desplazarse
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                          value={engineerFilters.canTravel}
                          onChange={(e) =>
                            setEngineerFilters({
                              ...engineerFilters,
                              canTravel: e.target.value as "" | "true" | "false",
                            })
                          }
                        >
                          <option value="">Todos</option>
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={performSearch}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
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
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Buscar
                    </>
                  )}
                </button>
              </div>
            </div>
          </aside>

          {/* Resultados */}
          <main className="flex-1">
            {results.length === 0 && !loading ? (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <svg
                  className="w-16 h-16 text-slate-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Busca perfiles de trabajadores, manijeros e ingenieros
                </h3>
                <p className="text-slate-500 mb-6">
                  Usa los filtros de la izquierda para encontrar exactly lo que necesitas
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((result) =>
                  result.role === "USER"
                    ? renderWorkerCard(result as WorkerResult)
                    : result.role === "FOREMAN"
                    ? renderForemanCard(result as ForemanResult)
                    : renderEngineerCard(result as EngineerResult)
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
