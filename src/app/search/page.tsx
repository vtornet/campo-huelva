"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PROVINCIAS, CULTIVOS, EXPERIENCIAS_TRABAJADOR, ESPECIALIDADES_MANIJERO, NIVELES_FITOSANITARIO, RANGOS_CUADRILLA, RANGOS_EXPERIENCIA, TIPOS_MAQUINARIA, TIPOS_APEROS, EXPERIENCIAS_ENCARGADO } from "@/lib/constants";

type CategoryType = "worker" | "foreman" | "encargado" | "tractorista" | "engineer" | null;

interface FilterState {
  province?: string;
  city?: string;
  cropExperience?: string[];
  yearsExperience?: { min: number; max: number } | null;
  hasVehicle?: boolean;
  canRelocate?: boolean;
  phytosanitaryLevel?: string;
  foodHandler?: boolean;
  // Manijero
  crewSize?: { min: number; max: number } | null;
  hasVan?: boolean;
  ownTools?: boolean;
  // Encargado
  canDriveTractor?: boolean;
  needsAccommodation?: boolean;
  workArea?: string[];
  // Tractorista
  machineryTypes?: string[];
  toolTypes?: string[];
  hasTractorLicense?: boolean;
  hasSprayerLicense?: boolean;
  hasHarvesterLicense?: boolean;
  isAvailableSeason?: boolean;
  canTravel?: boolean;
  // Ingeniero
  collegiateNumber?: string;
  specialties?: string[];
  servicesOffered?: string[];
}

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(null);
  const [filters, setFilters] = useState<FilterState>({});
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Realizar búsqueda cuando cambia la categoría
  useEffect(() => {
    if (selectedCategory) {
      performSearch();
    }
  }, [selectedCategory]);

  const performSearch = async () => {
    if (!selectedCategory) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("category", selectedCategory);

      if (filters.province) params.append("province", filters.province);
      if (filters.city) params.append("city", filters.city);
      if (filters.cropExperience?.length) params.append("cropExperience", filters.cropExperience.join(","));
      if (filters.yearsExperience) {
        params.append("minYears", filters.yearsExperience.min.toString());
        params.append("maxYears", filters.yearsExperience.max.toString());
      }
      if (filters.hasVehicle !== undefined) params.append("hasVehicle", filters.hasVehicle.toString());
      if (filters.canRelocate !== undefined) params.append("canRelocate", filters.canRelocate.toString());
      if (filters.phytosanitaryLevel) params.append("phytosanitaryLevel", filters.phytosanitaryLevel);
      if (filters.foodHandler !== undefined) params.append("foodHandler", filters.foodHandler.toString());

      // Manijero
      if (selectedCategory === "foreman") {
        if (filters.crewSize) {
          params.append("minCrew", filters.crewSize.min.toString());
          params.append("maxCrew", filters.crewSize.max.toString());
        }
        if (filters.hasVan !== undefined) params.append("hasVan", filters.hasVan.toString());
        if (filters.ownTools !== undefined) params.append("ownTools", filters.ownTools.toString());
      }

      // Encargado
      if (selectedCategory === "encargado") {
        if (filters.canDriveTractor !== undefined) params.append("canDriveTractor", filters.canDriveTractor.toString());
        if (filters.needsAccommodation !== undefined) params.append("needsAccommodation", filters.needsAccommodation.toString());
        if (filters.workArea?.length) params.append("workArea", filters.workArea.join(","));
      }

      // Tractorista
      if (selectedCategory === "tractorista") {
        if (filters.machineryTypes?.length) params.append("machineryTypes", filters.machineryTypes.join(","));
        if (filters.toolTypes?.length) params.append("toolTypes", filters.toolTypes.join(","));
        if (filters.hasTractorLicense !== undefined) params.append("hasTractorLicense", filters.hasTractorLicense.toString());
        if (filters.hasSprayerLicense !== undefined) params.append("hasSprayerLicense", filters.hasSprayerLicense.toString());
        if (filters.hasHarvesterLicense !== undefined) params.append("hasHarvesterLicense", filters.hasHarvesterLicense.toString());
        if (filters.isAvailableSeason !== undefined) params.append("isAvailableSeason", filters.isAvailableSeason.toString());
        if (filters.canTravel !== undefined) params.append("canTravel", filters.canTravel.toString());
      }

      // Ingeniero
      if (selectedCategory === "engineer") {
        if (filters.specialties?.length) params.append("specialties", filters.specialties.join(","));
        if (filters.servicesOffered?.length) params.append("servicesOffered", filters.servicesOffered.join(","));
      }

      const response = await fetch(`/api/search/candidates?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.candidates || []);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error searching:", error);
      setResults([]);
    } finally {
      setLoading(false);
      setSearchPerformed(true);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof FilterState, item: string) => {
    setFilters(prev => {
      const currentArray = (prev[key] as string[]) || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      return { ...prev, [key]: newArray };
    });
  };

  const getCategoryInfo = () => {
    switch (selectedCategory) {
      case "worker": return { title: "Peón/Trabajador", color: "blue", icon: "👨‍🌾", bgColor: "bg-green-100", textColor: "text-green-700" };
      case "foreman": return { title: "Jefe de Cuadrilla", color: "orange", icon: "📋", bgColor: "bg-orange-100", textColor: "text-orange-700" };
      case "encargado": return { title: "Encargado/Capataz", color: "teal", icon: "👷", bgColor: "bg-teal-100", textColor: "text-teal-700" };
      case "tractorista": return { title: "Tractorista", color: "amber", icon: "🚜", bgColor: "bg-amber-100", textColor: "text-amber-700" };
      case "engineer": return { title: "Ingeniero Agrónomo", color: "purple", icon: "🎓", bgColor: "bg-purple-100", textColor: "text-purple-700" };
      default: return null;
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => selectedCategory ? setSelectedCategory(null) : router.push("/")}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Buscador de Candidatos</h1>
              <p className="text-sm text-slate-500">
                {selectedCategory ? categoryInfo?.title : "Selecciona una categoría"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </span>
            {selectedCategory && (
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setFilters({});
                  setResults([]);
                  setSearchPerformed(false);
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cambiar categoría
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedCategory ? (
          /* Selector de categoría */
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">¿Qué tipo de profesional buscas?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CategoryCard
                title="Peón/Trabajador"
                description="Trabajadores individuales para labores agrícolas"
                icon="👨‍🌾"
                color="blue"
                onClick={() => setSelectedCategory("worker")}
              />
              <CategoryCard
                title="Jefe de Cuadrilla"
                description="Manijeros con equipos completos formados"
                icon="📋"
                color="orange"
                onClick={() => setSelectedCategory("foreman")}
              />
              <CategoryCard
                title="Encargado/Capataz"
                description="Responsables de finca y organización"
                icon="👷"
                color="teal"
                onClick={() => setSelectedCategory("encargado")}
              />
              <CategoryCard
                title="Tractorista"
                description="Especialistas en maquinaria agrícola"
                icon="🚜"
                color="amber"
                onClick={() => setSelectedCategory("tractorista")}
              />
              <CategoryCard
                title="Ingeniero Agrónomo"
                description="Técnicos para asesoramiento y peritajes"
                icon="🎓"
                color="purple"
                onClick={() => setSelectedCategory("engineer")}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Panel de filtros */}
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">Filtros</h2>
                  <button
                    onClick={() => {
                      setFilters({});
                      performSearch();
                    }}
                    className="text-sm text-emerald-600 hover:text-emerald-700"
                  >
                    Limpiar
                  </button>
                </div>

                {/* Filtro de provincia */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
                  <select
                    value={filters.province || ""}
                    onChange={(e) => {
                      handleFilterChange("province", e.target.value || undefined);
                      handleFilterChange("city", undefined);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Todas las provincias</option>
                    {PROVINCIAS.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro de ciudad */}
                {filters.province && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Municipio</label>
                    <select
                      value={filters.city || ""}
                      onChange={(e) => handleFilterChange("city", e.target.value || undefined)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Todos los municipios</option>
                      {(require("@/lib/constants").MUNICIPIOS_POR_PROVINCIA[filters.province] || []).map((city: string) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Experiencia en cultivos */}
                {(selectedCategory === "worker" || selectedCategory === "foreman" || selectedCategory === "encargado") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Experiencia en cultivos</label>
                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                      {CULTIVOS.map(crop => (
                        <label key={crop} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.cropExperience?.includes(crop) || false}
                            onChange={() => toggleArrayItem("cropExperience", crop)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm">{crop}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Años de experiencia */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Años de experiencia</label>
                  <select
                    value={filters.yearsExperience ? `${filters.yearsExperience.min}-${filters.yearsExperience.max}` : ""}
                    onChange={(e) => {
                      const range = RANGOS_EXPERIENCIA.find(r => e.target.value === `${r.min}-${r.max}`);
                      handleFilterChange("yearsExperience", range || null);
                    }}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Cualquiera</option>
                    {RANGOS_EXPERIENCIA.map(range => (
                      <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtros específicos para trabajadores */}
                {selectedCategory === "worker" && (
                  <>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVehicle || false}
                          onChange={(e) => handleFilterChange("hasVehicle", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Tiene vehículo propio</span>
                      </label>
                    </div>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.canRelocate || false}
                          onChange={(e) => handleFilterChange("canRelocate", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Dispuesto a relocarse</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Carnet fitosanitario</label>
                      <select
                        value={filters.phytosanitaryLevel || ""}
                        onChange={(e) => handleFilterChange("phytosanitaryLevel", e.target.value || undefined)}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Cualquiera</option>
                        {NIVELES_FITOSANITARIO.map(nivel => (
                          <option key={nivel} value={nivel}>{nivel}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.foodHandler || false}
                          onChange={(e) => handleFilterChange("foodHandler", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Carnet manipulador</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para manijeros */}
                {selectedCategory === "foreman" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tamaño de cuadrilla</label>
                      <select
                        value={filters.crewSize ? `${filters.crewSize.min}-${filters.crewSize.max}` : ""}
                        onChange={(e) => {
                          const range = RANGOS_CUADRILLA.find(r => e.target.value === `${r.min}-${r.max}`);
                          handleFilterChange("crewSize", range || null);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Cualquier tamaño</option>
                        {RANGOS_CUADRILLA.map(range => (
                          <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVan || false}
                          onChange={(e) => handleFilterChange("hasVan", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Tiene furgoneta</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.ownTools || false}
                          onChange={(e) => handleFilterChange("ownTools", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Herramientas propias</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para encargados */}
                {selectedCategory === "encargado" && (
                  <>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.canDriveTractor || false}
                          onChange={(e) => handleFilterChange("canDriveTractor", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Sabe manejar tractor</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.needsAccommodation || false}
                          onChange={(e) => handleFilterChange("needsAccommodation", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Necesita alojamiento</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para tractoristas */}
                {selectedCategory === "tractorista" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de maquinaria</label>
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {TIPOS_MAQUINARIA.map(type => (
                          <label key={type} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.machineryTypes?.includes(type) || false}
                              onChange={() => toggleArrayItem("machineryTypes", type)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de aperos</label>
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {TIPOS_APEROS.map(type => (
                          <label key={type} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.toolTypes?.includes(type) || false}
                              onChange={() => toggleArrayItem("toolTypes", type)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.isAvailableSeason || false}
                          onChange={(e) => handleFilterChange("isAvailableSeason", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Disponible toda la temporada</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.canTravel || false}
                          onChange={(e) => handleFilterChange("canTravel", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Dispuesto a viajar</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para ingenieros */}
                {selectedCategory === "engineer" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Experiencia en cultivos</label>
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {CULTIVOS.map(crop => (
                          <label key={crop} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.cropExperience?.includes(crop) || false}
                              onChange={() => toggleArrayItem("cropExperience", crop)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm">{crop}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Especialidades técnicas</label>
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {[
                          "Gestión de riego", "Fitopatología", "Nutrición vegetal",
                          "Sistemas de drenaje", "Producción integrada", "Agricultura ecológica",
                          "Control de plagas", "Suelos y fertilización", "Variedades y portainjertos",
                          "Postcosecha", "Certificaciones (GlobalGAP, etc.)", "Gestión de explotaciones"
                        ].map((spec) => (
                          <label key={spec} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.specialties?.includes(spec) || false}
                              onChange={() => toggleArrayItem("specialties", spec)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm">{spec}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Servicios ofrecidos</label>
                      <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                        {[
                          "Asesoramiento técnico", "Peritajes y tasaciones", "Auditorías",
                          "Formación y capacitación", "Redacción de proyectos", "Gestión de subvenciones",
                          "Análisis de suelo y agua", "Diseño de instalaciones", "Planes de fertilización",
                          "Control de calidad", "Consultoría de inversión"
                        ].map((serv) => (
                          <label key={serv} className="flex items-center gap-2 py-1 px-2 hover:bg-slate-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.servicesOffered?.includes(serv) || false}
                              onChange={() => toggleArrayItem("servicesOffered", serv)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm">{serv}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Años de experiencia</label>
                      <select
                        value={filters.yearsExperience ? `${filters.yearsExperience.min}-${filters.yearsExperience.max}` : ""}
                        onChange={(e) => {
                          const range = RANGOS_EXPERIENCIA.find(r => e.target.value === `${r.min}-${r.max}`);
                          handleFilterChange("yearsExperience", range || null);
                        }}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Cualquiera</option>
                        {RANGOS_EXPERIENCIA.map(range => (
                          <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Botón de búsqueda */}
                <button
                  onClick={performSearch}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Aplicar filtros
                    </>
                  )}
                </button>
              </div>
            </aside>

            {/* Resultados */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-slate-600">Buscando candidatos...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {searchPerformed ? "No se encontraron candidatos" : "Busca profesionales usando los filtros"}
                  </h3>
                  <p className="text-slate-500">
                    {searchPerformed ? "Prueba con otros filtros de búsqueda" : "Usa los filtros de la izquierda para encontrar lo que necesitas"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((candidate) => (
                    <CandidateCard
                      key={candidate.userId}
                      candidate={candidate}
                      category={selectedCategory}
                      categoryInfo={categoryInfo!}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CategoryCard({ title, description, icon, color, onClick }: {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
}) {
  const colorClasses: Record<string, string> = {
    blue: "hover:border-blue-500 hover:bg-blue-50",
    orange: "hover:border-orange-500 hover:bg-orange-50",
    teal: "hover:border-teal-500 hover:bg-teal-50",
    amber: "hover:border-amber-500 hover:bg-amber-50",
    purple: "hover:border-purple-500 hover:bg-purple-50",
  };

  return (
    <button
      onClick={onClick}
      className={`bg-white border-2 border-slate-200 rounded-xl p-6 text-left transition-all ${colorClasses[color]}`}
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="font-bold text-slate-800 text-lg mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </button>
  );
}

function CandidateCard({ candidate, category, categoryInfo }: {
  candidate: any;
  category: CategoryType;
  categoryInfo: { title: string; bgColor: string; textColor: string; icon: string };
}) {
  // Renderizar tarjeta según categoría
  if (category === "worker") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${categoryInfo.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {candidate.fullName || "Sin nombre"}
              </h3>
              <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} font-medium`}>
                Trabajador
              </span>
            </div>
          </div>
          {candidate.yearsExperience !== undefined && candidate.yearsExperience > 0 && (
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
              {candidate.yearsExperience} {candidate.yearsExperience === 1 ? 'año' : 'años'}
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{candidate.bio}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province}</span>
          </div>

          {candidate.experience && candidate.experience.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.experience.slice(0, 5).map((exp: string) => (
                <span key={exp} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {exp}
                </span>
              ))}
              {candidate.experience.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  +{candidate.experience.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.hasVehicle && (
              <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Vehículo
              </span>
            )}
            {candidate.canRelocate && (
              <span className="text-xs px-2 py-1 rounded-md bg-purple-50 text-purple-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 014 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Se traslada
              </span>
            )}
            {candidate.foodHandler && (
              <span className="text-xs px-2 py-1 rounded-md bg-orange-50 text-orange-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Manipulador
              </span>
            )}
            {candidate.phytosanitaryLevel && (
              <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                {candidate.phytosanitaryLevel}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (category === "foreman") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${categoryInfo.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{candidate.fullName}</h3>
              <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} font-medium`}>
                Manijero
              </span>
            </div>
          </div>
          {candidate.crewSize && (
            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
              {candidate.crewSize} pers.
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{candidate.bio}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <strong>{candidate.crewSize}</strong> trabajadores
            </span>
            {candidate.yearsExperience !== null && candidate.yearsExperience > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>{candidate.yearsExperience}</strong> años
              </span>
            )}
          </div>

          {candidate.specialties && candidate.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.specialties.slice(0, 5).map((spec: string) => (
                <span key={spec} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {spec}
                </span>
              ))}
              {candidate.specialties.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  +{candidate.specialties.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.hasVan && (
              <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Furgoneta
              </span>
            )}
            {candidate.ownTools && (
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
  }

  if (category === "encargado") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${categoryInfo.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{candidate.fullName}</h3>
              <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} font-medium`}>
                Encargado
              </span>
            </div>
          </div>
          {candidate.yearsExperience !== undefined && candidate.yearsExperience > 0 && (
            <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full">
              {candidate.yearsExperience} {candidate.yearsExperience === 1 ? 'año' : 'años'}
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{candidate.bio}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province}</span>
          </div>

          {candidate.cropExperience && candidate.cropExperience.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.cropExperience.slice(0, 5).map((exp: string) => (
                <span key={exp} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {exp}
                </span>
              ))}
              {candidate.cropExperience.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  +{candidate.cropExperience.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.canDriveTractor && (
              <span className="text-xs px-2 py-1 rounded-md bg-teal-50 text-teal-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Maneja tractor
              </span>
            )}
            {candidate.needsAccommodation && (
              <span className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Necesita alojamiento
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (category === "tractorista") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${categoryInfo.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{candidate.fullName}</h3>
              <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} font-medium`}>
                Tractorista
              </span>
            </div>
          </div>
          {candidate.yearsExperience !== undefined && candidate.yearsExperience > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded-full">
              {candidate.yearsExperience} {candidate.yearsExperience === 1 ? 'año' : 'años'}
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{candidate.bio}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province}</span>
          </div>

          {candidate.cropExperience && candidate.cropExperience.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.cropExperience.slice(0, 5).map((exp: string) => (
                <span key={exp} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {exp}
                </span>
              ))}
              {candidate.cropExperience.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  +{candidate.cropExperience.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            {candidate.isAvailableSeason && (
              <span className="text-xs px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Temporada completa
              </span>
            )}
            {candidate.canTravel && (
              <span className="text-xs px-2 py-1 rounded-md bg-blue-50 text-blue-700 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Viaja
              </span>
            )}
            {candidate.machineryTypes && candidate.machineryTypes.slice(0, 2).map((m: string) => (
              <span key={m} className="text-xs px-2 py-1 rounded-md bg-amber-50 text-amber-700">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (category === "engineer") {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full ${categoryInfo.bgColor} flex items-center justify-center`}>
              <span className="text-2xl">{categoryInfo.icon}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                {candidate.fullName || "Sin nombre"}
              </h3>
              <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${categoryInfo.bgColor} ${categoryInfo.textColor} font-medium`}>
                Ingeniero Agrícola
              </span>
            </div>
          </div>
          {candidate.yearsExperience !== null && candidate.yearsExperience > 0 && (
            <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
              {candidate.yearsExperience} años
            </span>
          )}
        </div>

        {candidate.bio && (
          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{candidate.bio}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-600">
            {candidate.collegiateNumber && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-4 4h8" />
                </svg>
                <span className="text-xs">Colegiado: {candidate.collegiateNumber}</span>
              </span>
            )}
          </div>

          {candidate.specialties && candidate.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {candidate.specialties.slice(0, 5).map((spec: string) => (
                <span key={spec} className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  {spec}
                </span>
              ))}
              {candidate.specialties.length > 5 && (
                <span className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700">
                  +{candidate.specialties.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
