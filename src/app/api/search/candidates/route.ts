import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  if (!category) {
    return NextResponse.json({ error: "Categoría no especificada" }, { status: 400 });
  }

  try {
    // Filtros comunes de ubicación
    const province = searchParams.get("province");
    const city = searchParams.get("city");
    const minYears = searchParams.get("minYears");
    const maxYears = searchParams.get("maxYears");

    // Filtros de experiencia en cultivos (común para varios roles)
    const cropExperienceStr = searchParams.get("cropExperience");

    // Filtros para trabajadores
    const hasVehicle = searchParams.get("hasVehicle");
    const canRelocate = searchParams.get("canRelocate");
    const phytosanitaryLevel = searchParams.get("phytosanitaryLevel");
    const foodHandler = searchParams.get("foodHandler");

    // Filtros para manijeros
    const minCrew = searchParams.get("minCrew");
    const maxCrew = searchParams.get("maxCrew");
    const hasVan = searchParams.get("hasVan");
    const ownTools = searchParams.get("ownTools");

    // Filtros para encargados
    const canDriveTractor = searchParams.get("canDriveTractor");
    const needsAccommodation = searchParams.get("needsAccommodation");
    const workAreaStr = searchParams.get("workArea");

    // Filtros para tractoristas
    const machineryTypesStr = searchParams.get("machineryTypes");
    const toolTypesStr = searchParams.get("toolTypes");
    const hasTractorLicense = searchParams.get("hasTractorLicense");
    const hasSprayerLicense = searchParams.get("hasSprayerLicense");
    const hasHarvesterLicense = searchParams.get("hasHarvesterLicense");
    const isAvailableSeason = searchParams.get("isAvailableSeason");
    const canTravel = searchParams.get("canTravel");

    // Filtros para ingenieros
    const specialtiesStr = searchParams.get("specialties");
    const servicesOfferedStr = searchParams.get("servicesOffered");

    let candidates: any[] = [];

    switch (category) {
      case "worker": {
        const workerWhere: any = {};

        // Ubicación
        if (province) {
          if (city) {
            workerWhere.city = { equals: city, mode: "insensitive" };
          } else {
            workerWhere.province = { equals: province, mode: "insensitive" };
          }
        }

        // Experiencia en cultivos (se llama 'experience' en WorkerProfile)
        if (cropExperienceStr) {
          const crops = cropExperienceStr.split(",");
          workerWhere.experience = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }

        // Años de experiencia
        if (minYears || maxYears) {
          workerWhere.yearsExperience = {};
          if (minYears) workerWhere.yearsExperience.gte = parseInt(minYears);
          if (maxYears) workerWhere.yearsExperience.lte = parseInt(maxYears);
        }

        // Filtros específicos
        if (hasVehicle === "true") workerWhere.hasVehicle = true;
        if (canRelocate === "true") workerWhere.canRelocate = true;
        if (phytosanitaryLevel) workerWhere.phytosanitaryLevel = phytosanitaryLevel;
        if (foodHandler === "true") workerWhere.foodHandler = true;

        candidates = await prisma.workerProfile.findMany({
          where: workerWhere,
          select: {
            userId: true,
            fullName: true,
            province: true,
            city: true,
            bio: true,
            experience: true,
            yearsExperience: true,
            hasVehicle: true,
            canRelocate: true,
            phytosanitaryLevel: true,
            foodHandler: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;
      }

      case "foreman": {
        const foremanWhere: any = {};

        // Ubicación
        if (province) {
          if (city) {
            foremanWhere.city = { equals: city, mode: "insensitive" };
          } else {
            foremanWhere.province = { equals: province, mode: "insensitive" };
          }
        }

        // Experiencia en cultivos (se llama 'specialties' en ForemanProfile)
        if (cropExperienceStr) {
          const crops = cropExperienceStr.split(",");
          foremanWhere.specialties = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }

        // Años de experiencia
        if (minYears || maxYears) {
          foremanWhere.yearsExperience = {};
          if (minYears) foremanWhere.yearsExperience.gte = parseInt(minYears);
          if (maxYears) foremanWhere.yearsExperience.lte = parseInt(maxYears);
        }

        // Tamaño de cuadrilla
        if (minCrew || maxCrew) {
          foremanWhere.crewSize = {};
          if (minCrew) foremanWhere.crewSize.gte = parseInt(minCrew);
          if (maxCrew) foremanWhere.crewSize.lte = parseInt(maxCrew);
        }

        // Filtros específicos
        if (hasVan === "true") foremanWhere.hasVan = true;
        if (ownTools === "true") foremanWhere.ownTools = true;

        candidates = await prisma.foremanProfile.findMany({
          where: foremanWhere,
          select: {
            userId: true,
            fullName: true,
            province: true,
            city: true,
            bio: true,
            specialties: true,
            yearsExperience: true,
            crewSize: true,
            hasVan: true,
            ownTools: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;
      }

      case "encargado": {
        const encargadoWhere: any = {};

        // Ubicación
        if (province) {
          if (city) {
            encargadoWhere.city = { equals: city, mode: "insensitive" };
          } else {
            encargadoWhere.province = { equals: province, mode: "insensitive" };
          }
        }

        // Experiencia en cultivos (se llama 'cropExperience' en EncargadoProfile)
        if (cropExperienceStr) {
          const crops = cropExperienceStr.split(",");
          encargadoWhere.cropExperience = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }

        // Años de experiencia
        if (minYears || maxYears) {
          encargadoWhere.yearsExperience = {};
          if (minYears) encargadoWhere.yearsExperience.gte = parseInt(minYears);
          if (maxYears) encargadoWhere.yearsExperience.lte = parseInt(maxYears);
        }

        // Filtros específicos
        if (canDriveTractor === "true") encargadoWhere.canDriveTractor = true;
        if (needsAccommodation === "true") encargadoWhere.needsAccommodation = true;

        // Zona de trabajo
        if (workAreaStr) {
          const areas = workAreaStr.split(",");
          encargadoWhere.workArea = {
            hasSome: areas.map(a => ({ contains: a, mode: "insensitive" }))
          };
        }

        candidates = await prisma.encargadoProfile.findMany({
          where: encargadoWhere,
          select: {
            userId: true,
            fullName: true,
            province: true,
            city: true,
            bio: true,
            cropExperience: true,
            yearsExperience: true,
            canDriveTractor: true,
            needsAccommodation: true,
            workArea: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;
      }

      case "tractorista": {
        const tractoristaWhere: any = {};

        // Ubicación
        if (province) {
          if (city) {
            tractoristaWhere.city = { equals: city, mode: "insensitive" };
          } else {
            tractoristaWhere.province = { equals: province, mode: "insensitive" };
          }
        }

        // Experiencia en cultivos
        if (cropExperienceStr) {
          const crops = cropExperienceStr.split(",");
          tractoristaWhere.cropExperience = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }

        // Años de experiencia
        if (minYears || maxYears) {
          tractoristaWhere.yearsExperience = {};
          if (minYears) tractoristaWhere.yearsExperience.gte = parseInt(minYears);
          if (maxYears) tractoristaWhere.yearsExperience.lte = parseInt(maxYears);
        }

        // Tipos de maquinaria
        if (machineryTypesStr) {
          const machines = machineryTypesStr.split(",");
          tractoristaWhere.machineryTypes = {
            hasSome: machines.map(m => ({ contains: m, mode: "insensitive" }))
          };
        }

        // Tipos de aperos
        if (toolTypesStr) {
          const tools = toolTypesStr.split(",");
          tractoristaWhere.toolTypes = {
            hasSome: tools.map(t => ({ contains: t, mode: "insensitive" }))
          };
        }

        // Carnets
        if (hasTractorLicense === "true") tractoristaWhere.hasTractorLicense = true;
        if (hasSprayerLicense === "true") tractoristaWhere.hasSprayerLicense = true;
        if (hasHarvesterLicense === "true") tractoristaWhere.hasHarvesterLicense = true;

        // Disponibilidad
        if (isAvailableSeason === "true") tractoristaWhere.isAvailableSeason = true;
        if (canTravel === "true") tractoristaWhere.canTravel = true;

        candidates = await prisma.tractoristProfile.findMany({
          where: tractoristaWhere,
          select: {
            userId: true,
            fullName: true,
            province: true,
            city: true,
            bio: true,
            cropExperience: true,
            yearsExperience: true,
            machineryTypes: true,
            toolTypes: true,
            hasTractorLicense: true,
            hasSprayerLicense: true,
            hasHarvesterLicense: true,
            isAvailableSeason: true,
            canTravel: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;
      }

      case "engineer": {
        const engineerWhere: any = {};

        // Ubicación
        if (province) {
          if (city) {
            engineerWhere.city = { equals: city, mode: "insensitive" };
          } else {
            engineerWhere.province = { equals: province, mode: "insensitive" };
          }
        }

        // Experiencia en cultivos
        if (cropExperienceStr) {
          const crops = cropExperienceStr.split(",");
          engineerWhere.cropExperience = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }

        // Especialidades técnicas
        if (specialtiesStr) {
          const specs = specialtiesStr.split(",");
          engineerWhere.specialties = {
            hasSome: specs.map(s => ({ contains: s, mode: "insensitive" }))
          };
        }

        // Servicios ofrecidos
        if (servicesOfferedStr) {
          const services = servicesOfferedStr.split(",");
          engineerWhere.servicesOffered = {
            hasSome: services.map(s => ({ contains: s, mode: "insensitive" }))
          };
        }

        // Años de experiencia
        if (minYears || maxYears) {
          engineerWhere.yearsExperience = {};
          if (minYears) engineerWhere.yearsExperience.gte = parseInt(minYears);
          if (maxYears) engineerWhere.yearsExperience.lte = parseInt(maxYears);
        }

        candidates = await prisma.engineerProfile.findMany({
          where: engineerWhere,
          select: {
            userId: true,
            fullName: true,
            province: true,
            city: true,
            bio: true,
            specialties: true,
            collegiateNumber: true,
            yearsExperience: true,
            cropExperience: true,
            servicesOffered: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Error searching candidates:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
