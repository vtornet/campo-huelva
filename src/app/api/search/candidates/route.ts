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
    const where: any = {};

    // Filtros comunes
    const province = searchParams.get("province");
    const city = searchParams.get("city");
    const cropExperienceStr = searchParams.get("cropExperience");
    const minYears = searchParams.get("minYears");
    const maxYears = searchParams.get("maxYears");

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

    // Filtros comunes de ubicación
    if (province) {
      if (city) {
        where.city = { equals: city, mode: "insensitive" };
      } else {
        where.province = { equals: province, mode: "insensitive" };
      }
    }

    // Filtro de experiencia en cultivos (array contains)
    if (cropExperienceStr) {
      const crops = cropExperienceStr.split(",");
      where.cropExperience = {
        hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
      };
    }

    // Filtro de años de experiencia
    if (minYears || maxYears) {
      where.yearsExperience = {};
      if (minYears) where.yearsExperience.gte = parseInt(minYears);
      if (maxYears) where.yearsExperience.lte = parseInt(maxYears);
    }

    let candidates: any[] = [];

    switch (category) {
      case "worker":
        const workerWhere: any = { ...where };
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
            cropExperience: true,
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

      case "foreman":
        const foremanWhere: any = { ...where };
        // Para manijeros, cropExperience se llama specialties
        if (cropExperienceStr) {
          delete foremanWhere.cropExperience;
          const crops = cropExperienceStr.split(",");
          foremanWhere.specialties = {
            hasSome: crops.map(c => ({ contains: c, mode: "insensitive" }))
          };
        }
        if (minCrew || maxCrew) {
          foremanWhere.crewSize = {};
          if (minCrew) foremanWhere.crewSize.gte = parseInt(minCrew);
          if (maxCrew) foremanWhere.crewSize.lte = parseInt(maxCrew);
        }
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
          orderBy: { crewSize: "desc" },
          take: 50,
        });
        break;

      case "encargado":
        const encargadoWhere: any = { ...where };
        if (canDriveTractor === "true") encargadoWhere.canDriveTractor = true;
        if (needsAccommodation === "true") encargadoWhere.needsAccommodation = true;
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

      case "tractorista":
        const tractoristaWhere: any = { ...where };
        if (machineryTypesStr) {
          const machines = machineryTypesStr.split(",");
          tractoristaWhere.machineryTypes = {
            hasSome: machines.map(m => ({ contains: m, mode: "insensitive" }))
          };
        }
        if (toolTypesStr) {
          const tools = toolTypesStr.split(",");
          tractoristaWhere.toolTypes = {
            hasSome: tools.map(t => ({ contains: t, mode: "insensitive" }))
          };
        }
        if (hasTractorLicense === "true") tractoristaWhere.hasTractorLicense = true;
        if (hasSprayerLicense === "true") tractoristaWhere.hasSprayerLicense = true;
        if (hasHarvesterLicense === "true") tractoristaWhere.hasHarvesterLicense = true;
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

      case "engineer":
        const engineerWhere: any = {};
        if (province) {
          if (city) {
            engineerWhere.city = { equals: city, mode: "insensitive" };
          } else {
            engineerWhere.province = { equals: province, mode: "insensitive" };
          }
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
            servicesOffered: true,
            profileImage: true,
          },
          orderBy: { yearsExperience: "desc" },
          take: 50,
        });
        break;

      default:
        return NextResponse.json({ error: "Categoría no válida" }, { status: 400 });
    }

    return NextResponse.json({ candidates });
  } catch (error) {
    console.error("Error searching candidates:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
