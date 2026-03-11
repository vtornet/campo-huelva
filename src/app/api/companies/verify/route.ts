// src/app/api/companies/verify/route.ts
// API para verificar empresas usando validación local de CIF/NIF/NIE

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { verifyCompany, isAeatConfigured, getAeatStatus } from "@/lib/aeat-service";
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

    // Verificar empresa (validación local de formato)
    const result = await verifyCompany(cleanCif);

    // Si la verificación fue exitosa, guardar los datos
    if (result.success && result.company) {
      // Buscar si ya existe un perfil con este CIF
      const existingProfile = await prisma.companyProfile.findUnique({
        where: { cif: cleanCif },
      });

      if (existingProfile) {
        // Actualizar datos de verificación (solo validación local)
        await prisma.companyProfile.update({
          where: { id: existingProfile.id },
          data: {
            aeatRazonSocial: result.company.razonSocial,
            aeatLastCheck: new Date(),
          },
        });
      }

      return NextResponse.json({
        success: true,
        method: result.method,
        company: result.company,
        existingCompany: !!existingProfile,
      });
    }

    // Verificación falló
    return NextResponse.json({
      success: false,
      method: result.method,
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

// GET: Obtener estado del servicio de verificación
export async function GET() {
  const status = getAeatStatus();
  return NextResponse.json({
    aeatConfigured: status.configured,
    note: status.note,
    methods: {
      aeat: status.configured,
      local: true, // Siempre disponible
    },
  });
}
