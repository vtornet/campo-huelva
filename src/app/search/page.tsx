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

  // Realizar búsqueda cuando cambia la categoría o filtros
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
      case "worker": return { title: "Peón/Trabajador", color: "blue", icon: "👨‍🌾" };
      case "foreman": return { title: "Jefe de Cuadrilla", color: "orange", icon: "📋" };
      case "encargado": return { title: "Encargado/Capataz", color: "teal", icon: "👷" };
      case "tractorista": return { title: "Tractorista", color: "amber", icon: "🚜" };
      case "engineer": return { title: "Ingeniero Agrónomo", color: "purple", icon: "🎓" };
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Buscador de Candidatos</h1>
          <button
            onClick={() => router.push("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {!selectedCategory ? (
          /* Selector de categoría */
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Qué tipo de profesional buscas?</h2>
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
            /* Panel de filtros */
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{categoryInfo?.icon}</span>
                    {categoryInfo?.title}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedCategory(null);
                      setFilters({});
                      setResults([]);
                      setSearchPerformed(false);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Filtro de provincia */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <select
                    value={filters.province || ""}
                    onChange={(e) => {
                      handleFilterChange("province", e.target.value || undefined);
                      handleFilterChange("city", undefined);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="">Todas las provincias</option>
                    {PROVINCIAS.map(prov => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                {/* Filtro de ciudad (si hay provincia seleccionada) */}
                {filters.province && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
                    <select
                      value={filters.city || ""}
                      onChange={(e) => handleFilterChange("city", e.target.value || undefined)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="">Todos los municipios</option>
                      {(require("@/lib/constants").MUNICIPIOS_POR_PROVINCIA[filters.province] || []).map((city: string) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Experiencia en cultivos (común para trabajadores, manijeros, encargados) */}
                {(selectedCategory === "worker" || selectedCategory === "foreman" || selectedCategory === "encargado") && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experiencia en cultivos</label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2">
                      {CULTIVOS.map(crop => (
                        <label key={crop} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Años de experiencia</label>
                  <select
                    value={filters.yearsExperience ? `${filters.yearsExperience.min}-${filters.yearsExperience.max}` : ""}
                    onChange={(e) => {
                      const range = RANGOS_EXPERIENCIA.find(r => e.target.value === `${r.min}-${r.max}`);
                      handleFilterChange("yearsExperience", range || null);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVehicle || false}
                          onChange={(e) => handleFilterChange("hasVehicle", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Tiene vehículo propio</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.canRelocate || false}
                          onChange={(e) => handleFilterChange("canRelocate", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Dispuesto a relocarse</span>
                      </label>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Carnet fitosanitario</label>
                      <select
                        value={filters.phytosanitaryLevel || ""}
                        onChange={(e) => handleFilterChange("phytosanitaryLevel", e.target.value || undefined)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        <span className="text-sm font-medium text-gray-700">Carnet manipulador de alimentos</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para manijeros */}
                {selectedCategory === "foreman" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño de cuadrilla</label>
                      <select
                        value={filters.crewSize ? `${filters.crewSize.min}-${filters.crewSize.max}` : ""}
                        onChange={(e) => {
                          const range = RANGOS_CUADRILLA.find(r => e.target.value === `${r.min}-${r.max}`);
                          handleFilterChange("crewSize", range || null);
                        }}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">Cualquier tamaño</option>
                        {RANGOS_CUADRILLA.map(range => (
                          <option key={`${range.min}-${range.max}`} value={`${range.min}-${range.max}`}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.hasVan || false}
                          onChange={(e) => handleFilterChange("hasVan", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Tiene furgoneta</span>
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
                        <span className="text-sm font-medium text-gray-700">Herramientas propias</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para encargados */}
                {selectedCategory === "encargado" && (
                  <>
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.canDriveTractor || false}
                          onChange={(e) => handleFilterChange("canDriveTractor", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Sabe manejar tractor</span>
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
                        <span className="text-sm font-medium text-gray-700">Necesita alojamiento</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Filtros específicos para tractoristas */}
                {selectedCategory === "tractorista" && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de maquinaria</label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {TIPOS_MAQUINARIA.map(type => (
                          <label key={type} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de aperos</label>
                      <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                        {TIPOS_APEROS.map(type => (
                          <label key={type} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer">
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
                    <div className="mb-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filters.isAvailableSeason || false}
                          onChange={(e) => handleFilterChange("isAvailableSeason", e.target.checked || undefined)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Disponible toda la temporada</span>
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
                        <span className="text-sm font-medium text-gray-700">Dispuesto a viajar</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Botón de búsqueda */}
                <button
                  onClick={performSearch}
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Buscando..." : "Aplicar filtros"}
                </button>
              </div>
            </aside>

            {/* Resultados */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Resultados ({results.length})
                </h2>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Buscando candidatos...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-600 text-lg">
                    {searchPerformed ? "No se encontraron candidatos con estos filtros" : "Selecciona los filtros y pulsa buscar"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.map((candidate) => (
                    <CandidateCard
                      key={candidate.userId}
                      candidate={candidate}
                      category={selectedCategory}
                      onViewProfile={() => router.push(`/profile?userId=${candidate.userId}`)}
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
      className={`bg-white border-2 border-gray-200 rounded-xl p-6 text-left transition-all ${colorClasses[color]}`}
    >
      <span className="text-4xl mb-3 block">{icon}</span>
      <h3 className="font-bold text-gray-900 text-lg mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </button>
  );
}

function CandidateCard({ candidate, category, onViewProfile }: {
  candidate: any;
  category: CategoryType;
  onViewProfile: () => void;
}) {
  const getProfileData = () => {
    switch (category) {
      case "worker":
        return {
          name: candidate.fullName,
          location: candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province,
          experience: candidate.experience || [],
          years: candidate.yearsExperience,
          vehicle: candidate.hasVehicle,
          relocate: candidate.canRelocate,
          bio: candidate.bio,
        };
      case "foreman":
        return {
          name: candidate.fullName,
          location: candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province,
          experience: candidate.specialties || [],
          years: candidate.yearsExperience,
          crewSize: candidate.crewSize,
          van: candidate.hasVan,
          tools: candidate.ownTools,
          bio: candidate.bio,
        };
      case "encargado":
        return {
          name: candidate.fullName,
          location: candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province,
          experience: candidate.cropExperience || [],
          years: candidate.yearsExperience,
          tractor: candidate.canDriveTractor,
          accommodation: candidate.needsAccommodation,
          bio: candidate.bio,
        };
      case "tractorista":
        return {
          name: candidate.fullName,
          location: candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province,
          experience: candidate.cropExperience || [],
          years: candidate.yearsExperience,
          machinery: candidate.machineryTypes || [],
          tools: candidate.toolTypes || [],
          available: candidate.isAvailableSeason,
          bio: candidate.bio,
        };
      case "engineer":
        return {
          name: candidate.fullName,
          location: candidate.city ? `${candidate.city}, ${candidate.province}` : candidate.province,
          specialties: candidate.specialties || [],
          collegiate: candidate.collegiateNumber,
          bio: candidate.bio,
        };
      default:
        return null;
    }
  };

  const profile = getProfileData();
  if (!profile) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-bold text-gray-900">{profile.name}</h4>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {profile.location}
          </p>
        </div>
        {profile.years !== undefined && (
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full">
            {profile.years} {profile.years === 1 ? 'año' : 'años'}
          </span>
        )}
      </div>

      {profile.bio && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{profile.bio}</p>
      )}

      {/* Badges específicos por categoría */}
      <div className="flex flex-wrap gap-1 mb-3">
        {category === "worker" && (
          <>
            {profile.vehicle && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Vehículo</span>}
            {profile.relocate && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">Relocación</span>}
          </>
        )}
        {category === "foreman" && (
          <>
            {profile.crewSize && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded">{profile.crewSize} pers.</span>}
            {profile.van && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Furgoneta</span>}
            {profile.tools && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded">Herramientas</span>}
          </>
        )}
        {category === "encargado" && (
          <>
            {profile.tractor && <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded">Tractor</span>}
            {profile.accommodation && <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">Necesita alojamiento</span>}
          </>
        )}
        {category === "tractorista" && (
          <>
            {profile.available && <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded">Temporada completa</span>}
            {profile.machinery.slice(0, 2).map((m: string) => (
              <span key={m} className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded">{m}</span>
            ))}
          </>
        )}
      </div>

      {/* Experiencia en cultivos (mostrar hasta 3) */}
      {profile.experience && profile.experience.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Experiencia en:</p>
          <div className="flex flex-wrap gap-1">
            {profile.experience.slice(0, 3).map((exp: string) => (
              <span key={exp} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded">
                {exp}
              </span>
            ))}
            {profile.experience.length > 3 && (
              <span className="text-xs text-gray-500">+{profile.experience.length - 3} más</span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={onViewProfile}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg text-sm font-medium transition"
      >
        Ver perfil completo
      </button>
    </div>
  );
}
