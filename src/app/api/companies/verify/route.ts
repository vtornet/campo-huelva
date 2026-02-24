// src/app/api/companies/verify/route.ts
// API para verificar empresas usando AEAT (con fallback a validación local)

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyCompany, isAeatConfigured } from "@/lib/aeat-service";
import { rateLimitMiddleware } from "@/lib/rate-limit";

const prisma = new PrismaClient();

// POST: Verificar una empresa por CIF
export async function POST(request: NextRequest) {
  // Rate limiting (verificación es costosa)
  const rateLimitResponse = rateLimitMiddleware(request, "verify-company", {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 verificaciones por minuto
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { cif } = body;

    if (!cif) {
      return NextResponse.json(
        { error: "El CIF es obligatorio" },
        { status: 400 }
      );
    }

    // Limpiar CIF
    const cleanCif = cif.replace(/[\s-]/g, "").toUpperCase();

    // Verificar empresa con AEAT (o fallback a local)
    const result = await verifyCompany(cleanCif);

    // Si la verificación fue exitosa, guardar los datos
    if (result.success && result.company) {
      // Buscar si ya existe un perfil con este CIF
      const existingProfile = await prisma.companyProfile.findUnique({
        where: { cif: cleanCif },
      });

      if (existingProfile) {
        // Actualizar datos de verificación
        await prisma.companyProfile.update({
          where: { id: existingProfile.id },
          data: {
            isVerified: result.method === "AEAT",
            verificationMethod: result.method,
            aeatRazonSocial: result.company.razonSocial,
            aeatDireccion: result.company.direccion,
            aeatLocalidad: result.company.localidad,
            aeatProvincia: result.company.provincia,
            aeatCodigoPostal: result.company.codigoPostal,
            aeatSituacion: result.company.situacion,
            aeatVerifiedAt: result.method === "AEAT" ? new Date() : null,
            aeatLastCheck: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        method: result.method,
        aeatConfigured: isAeatConfigured(),
        company: result.company,
        existingCompany: !!existingProfile,
      });
    }

    // Verificación falló
    return NextResponse.json({
      success: false,
      method: result.method,
      aeatConfigured: isAeatConfigured(),
      error: result.error,
      validFormat: result.validFormat,
    });
  } catch (error: any) {
    console.error("Error verificando empresa:", error);
    return NextResponse.json(
      { error: "Error al verificar la empresa" },
      { status: 500 }
    );
  }
}

// GET: Obtener estado del servicio AEAT
export async function GET() {
  return NextResponse.json({
    aeatConfigured: isAeatConfigured(),
    aeatAvailable: true, // Siempre true mientras tengamos el servicio implementado
    methods: {
      aeat: isAeatConfigured(),
      local: true, // Siempre disponible como fallback
    },
  });
}
