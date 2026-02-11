// API de búsqueda de perfiles para empresas
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface para filtros de búsqueda
interface SearchFilters {
  query?: string;
  province?: string;
  city?: string;
  role?: "USER" | "FOREMAN" | "ENGINEER"; // Trabajadores, manijeros e ingenieros
  // Filtros específicos de trabajadores
  experience?: string[];
  hasVehicle?: boolean;
  canRelocate?: boolean;
  foodHandler?: boolean;
  phytosanitaryLevel?: string;
  // Filtros específicos de manijeros
  crewSizeMin?: number;
  crewSizeMax?: number;
  yearsExperienceMin?: number;
  yearsExperienceMax?: number;
  specialties?: string[];
  hasVan?: boolean;
  needsBus?: boolean;
  ownTools?: boolean;
  // Filtros específicos de ingenieros
  cropExperience?: string[];
  servicesOffered?: string[];
  isAvailable?: boolean;
  canTravel?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Obtener el UID del usuario desde el header (enviado por el cliente)
    const userId = request.headers.get("x-user-id");

    console.log("[SEARCH] UserId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que el usuario es una empresa
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    console.log("[SEARCH] User role:", user?.role);

    if (!user || user.role !== "COMPANY") {
      return NextResponse.json(
        { error: "Solo las empresas pueden buscar perfiles", debugRole: user?.role },
        { status: 403 }
      );
    }

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const filters: SearchFilters = {
      query: searchParams.get("q") || undefined,
      province: searchParams.get("province") || undefined,
      city: searchParams.get("city") || undefined,
      role: (searchParams.get("role") as "USER" | "FOREMAN" | "ENGINEER") || undefined,
      experience: searchParams.get("experience")?.split(",") || undefined,
      crewSizeMin: parseInt(searchParams.get("crewSizeMin") || "0"),
      crewSizeMax: parseInt(searchParams.get("crewSizeMax") || "999"),
      yearsExperienceMin: parseInt(searchParams.get("yearsExperienceMin") || "0"),
      yearsExperienceMax: parseInt(searchParams.get("yearsExperienceMax") || "999"),
      specialties: searchParams.get("specialties")?.split(",") || undefined,
      cropExperience: searchParams.get("cropExperience")?.split(",") || undefined,
      servicesOffered: searchParams.get("servicesOffered")?.split(",") || undefined,
    };

    console.log("[SEARCH] Filters:", filters);

    // Filtros booleanos especiales (necesitamos saber si fueron enviados)
    const hasVehicle = searchParams.get("hasVehicle");
    const canRelocate = searchParams.get("canRelocate");
    const foodHandler = searchParams.get("foodHandler");
    const phytosanitaryLevel = searchParams.get("phytosanitaryLevel");
    const hasVan = searchParams.get("hasVan");
    const needsBus = searchParams.get("needsBus");
    const ownTools = searchParams.get("ownTools");
    const isAvailable = searchParams.get("isAvailable");
    const canTravel = searchParams.get("canTravel");

    // Si no se especifica rol, buscar los tres tipos
    const roles = filters.role ? [filters.role] : ["USER", "FOREMAN", "ENGINEER"];

    const results: any[] = [];

    // Buscar trabajadores (USER)
    if (roles.includes("USER")) {
      const workers = await prisma.user.findMany({
        where: {
          role: "USER",
          isBanned: false,
          workerProfile: {
            isNot: null,
          },
        },
        include: {
          workerProfile: true,
        },
      });

      console.log("[SEARCH] Workers found:", workers.length);

      // Filtrar trabajadores
      const filteredWorkers = workers.filter((w) => {
        const p = w.workerProfile;
        if (!p) return false;

        // Filtro por provincia
        if (filters.province && p.province !== filters.province) return false;

        // Filtro por ciudad
        if (filters.city && p.city !== filters.city) return false;

        // Filtro por vehículo propio
        if (hasVehicle !== null && p.hasVehicle !== (hasVehicle === "true")) {
          return false;
        }

        // Filtro por disponibilidad para trasladarse
        if (canRelocate !== null && p.canRelocate !== (canRelocate === "true")) {
          return false;
        }

        // Filtro por manipulador de alimentos
        if (foodHandler !== null && p.foodHandler !== (foodHandler === "true")) {
          return false;
        }

        // Filtro por nivel fitosanitario
        if (phytosanitaryLevel && p.phytosanitaryLevel !== phytosanitaryLevel) {
          return false;
        }

        // Filtro por experiencia (al menos una coincidencia)
        if (filters.experience && filters.experience.length > 0) {
          const hasExperience = filters.experience.some((exp) =>
            p.experience?.includes(exp)
          );
          if (!hasExperience) return false;
        }

        // Búsqueda por texto
        if (filters.query) {
          const searchText = filters.query.toLowerCase();
          const matchesName = p.fullName?.toLowerCase().includes(searchText);
          const matchesCity = p.city?.toLowerCase().includes(searchText);
          const matchesProvince = p.province?.toLowerCase().includes(searchText);
          const matchesBio = p.bio?.toLowerCase().includes(searchText);
          if (!matchesName && !matchesCity && !matchesProvince && !matchesBio) {
            return false;
          }
        }

        return true;
      });

      console.log("[SEARCH] Workers after filtering:", filteredWorkers.length);

      // Formatear resultados de trabajadores
      for (const w of filteredWorkers) {
        results.push({
          id: w.id,
          role: "USER",
          fullName: w.workerProfile?.fullName,
          city: w.workerProfile?.city,
          province: w.workerProfile?.province,
          phone: w.workerProfile?.phone,
          experience: w.workerProfile?.experience || [],
          bio: w.workerProfile?.bio,
          hasVehicle: w.workerProfile?.hasVehicle,
          canRelocate: w.workerProfile?.canRelocate,
          foodHandler: w.workerProfile?.foodHandler,
          phytosanitaryLevel: w.workerProfile?.phytosanitaryLevel,
        });
      }
    }

    // Buscar manijeros (FOREMAN)
    if (roles.includes("FOREMAN")) {
      const foremen = await prisma.user.findMany({
        where: {
          role: "FOREMAN",
          isBanned: false,
          foremanProfile: {
            isNot: null,
          },
        },
        include: {
          foremanProfile: true,
        },
      });

      console.log("[SEARCH] Foremen found:", foremen.length);

      // Filtrar manijeros
      const filteredForemen = foremen.filter((f) => {
        const p = f.foremanProfile;
        if (!p) return false;

        // Filtro por provincia
        if (filters.province && p.province !== filters.province) return false;

        // Filtro por ciudad
        if (filters.city && p.city !== filters.city) return false;

        // Filtro por tamaño de cuadrilla
        if (searchParams.has("crewSizeMin") && p.crewSize < filters.crewSizeMin!) {
          return false;
        }
        if (searchParams.has("crewSizeMax") && p.crewSize > filters.crewSizeMax!) {
          return false;
        }

        // Filtro por años de experiencia
        const yearsExp = p.yearsExperience || 0;
        if (searchParams.has("yearsExperienceMin") && yearsExp < filters.yearsExperienceMin!) {
          return false;
        }
        if (searchParams.has("yearsExperienceMax") && yearsExp > filters.yearsExperienceMax!) {
          return false;
        }

        // Filtro por furgoneta
        if (hasVan !== null && p.hasVan !== (hasVan === "true")) {
          return false;
        }

        // Filtro por necesidad de autobús
        if (needsBus !== null && p.needsBus !== (needsBus === "true")) {
          return false;
        }

        // Filtro por herramientas propias
        if (ownTools !== null && p.ownTools !== (ownTools === "true")) {
          return false;
        }

        // Filtro por especialidades (al menos una coincidencia)
        if (filters.specialties && filters.specialties.length > 0) {
          const hasSpecialty = filters.specialties.some((spec) =>
            p.specialties?.includes(spec)
          );
          if (!hasSpecialty) return false;
        }

        // Búsqueda por texto
        if (filters.query) {
          const searchText = filters.query.toLowerCase();
          const matchesName = p.fullName?.toLowerCase().includes(searchText);
          const matchesCity = p.city?.toLowerCase().includes(searchText);
          const matchesProvince = p.province?.toLowerCase().includes(searchText);
          const matchesBio = p.bio?.toLowerCase().includes(searchText);
          if (!matchesName && !matchesCity && !matchesProvince && !matchesBio) {
            return false;
          }
        }

        return true;
      });

      console.log("[SEARCH] Foremen after filtering:", filteredForemen.length);

      // Formatear resultados de manijeros
      for (const f of filteredForemen) {
        results.push({
          id: f.id,
          role: "FOREMAN",
          fullName: f.foremanProfile?.fullName,
          city: f.foremanProfile?.city,
          province: f.foremanProfile?.province,
          phone: f.foremanProfile?.phone,
          crewSize: f.foremanProfile?.crewSize,
          workArea: f.foremanProfile?.workArea || [],
          hasVan: f.foremanProfile?.hasVan,
          needsBus: f.foremanProfile?.needsBus,
          ownTools: f.foremanProfile?.ownTools,
          yearsExperience: f.foremanProfile?.yearsExperience,
          specialties: f.foremanProfile?.specialties || [],
          bio: f.foremanProfile?.bio,
        });
      }
    }

    // Buscar ingenieros (ENGINEER)
    if (roles.includes("ENGINEER")) {
      const engineers = await prisma.user.findMany({
        where: {
          role: "ENGINEER",
          isBanned: false,
          engineerProfile: {
            isNot: null,
          },
        },
        include: {
          engineerProfile: true,
        },
      });

      console.log("[SEARCH] Engineers found:", engineers.length);

      // Filtrar ingenieros
      const filteredEngineers = engineers.filter((e) => {
        const p = e.engineerProfile;
        if (!p) return false;

        // Filtro por provincia
        if (filters.province && p.province !== filters.province) return false;

        // Filtro por ciudad
        if (filters.city && p.city !== filters.city) return false;

        // Filtro por años de experiencia
        const yearsExp = p.yearsExperience || 0;
        if (searchParams.has("yearsExperienceMin") && yearsExp < filters.yearsExperienceMin!) {
          return false;
        }
        if (searchParams.has("yearsExperienceMax") && yearsExp > filters.yearsExperienceMax!) {
          return false;
        }

        // Filtro por disponibilidad
        if (isAvailable !== null && p.isAvailable !== (isAvailable === "true")) {
          return false;
        }

        // Filtro por disponibilidad para viajar
        if (canTravel !== null && p.canTravel !== (canTravel === "true")) {
          return false;
        }

        // Filtro por experiencia en cultivos (al menos una coincidencia)
        if (filters.cropExperience && filters.cropExperience.length > 0) {
          const hasCrop = filters.cropExperience.some((crop) =>
            p.cropExperience?.includes(crop)
          );
          if (!hasCrop) return false;
        }

        // Filtro por especialidades (al menos una coincidencia)
        if (filters.specialties && filters.specialties.length > 0) {
          const hasSpecialty = filters.specialties.some((spec) =>
            p.specialties?.includes(spec)
          );
          if (!hasSpecialty) return false;
        }

        // Filtro por servicios ofrecidos (al menos una coincidencia)
        if (filters.servicesOffered && filters.servicesOffered.length > 0) {
          const hasService = filters.servicesOffered.some((serv) =>
            p.servicesOffered?.includes(serv)
          );
          if (!hasService) return false;
        }

        // Búsqueda por texto
        if (filters.query) {
          const searchText = filters.query.toLowerCase();
          const matchesName = p.fullName?.toLowerCase().includes(searchText);
          const matchesCity = p.city?.toLowerCase().includes(searchText);
          const matchesProvince = p.province?.toLowerCase().includes(searchText);
          const matchesBio = p.bio?.toLowerCase().includes(searchText);
          const matchesCollegiate = p.collegiateNumber?.toLowerCase().includes(searchText);
          if (!matchesName && !matchesCity && !matchesProvince && !matchesBio && !matchesCollegiate) {
            return false;
          }
        }

        return true;
      });

      console.log("[SEARCH] Engineers after filtering:", filteredEngineers.length);

      // Formatear resultados de ingenieros
      for (const e of filteredEngineers) {
        results.push({
          id: e.id,
          role: "ENGINEER",
          fullName: e.engineerProfile?.fullName,
          city: e.engineerProfile?.city,
          province: e.engineerProfile?.province,
          phone: e.engineerProfile?.phone,
          collegiateNumber: e.engineerProfile?.collegiateNumber,
          yearsExperience: e.engineerProfile?.yearsExperience,
          cropExperience: e.engineerProfile?.cropExperience || [],
          specialties: e.engineerProfile?.specialties || [],
          servicesOffered: e.engineerProfile?.servicesOffered || [],
          isAvailable: e.engineerProfile?.isAvailable,
          canTravel: e.engineerProfile?.canTravel,
          bio: e.engineerProfile?.bio,
        });
      }
    }

    // Ordenar resultados: primero por nombre
    results.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));

    console.log("[SEARCH] Total results:", results.length);

    return NextResponse.json({
      results,
      total: results.length,
    });
  } catch (error) {
    console.error("Error en búsqueda de perfiles:", error);
    return NextResponse.json(
      { error: "Error al buscar perfiles", details: String(error) },
      { status: 500 }
    );
  }
}
