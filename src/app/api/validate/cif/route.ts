// src/app/api/validate/cif/route.ts
// API para validar CIF/NIF español

import { NextRequest, NextResponse } from "next/server";
import { validateSpanishDocument, identifyDocumentType, formatCIF, getEntityTypeName } from "@/lib/cif-validator";
import { rateLimitMiddleware } from "@/lib/rate-limit";

// GET: Validar un CIF/NIF
export async function GET(request: NextRequest) {
  // Rate limiting básico
  const rateLimitResponse = rateLimitMiddleware(request, "validate-cif", {
    maxRequests: 100,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const searchParams = request.nextUrl.searchParams;
  const cif = searchParams.get("cif");

  if (!cif) {
    return NextResponse.json(
      { error: "El parámetro 'cif' es obligatorio" },
      { status: 400 }
    );
  }

  try {
    // Identificar tipo de documento
    const docType = identifyDocumentType(cif);

    // Validar documento
    const result = validateSpanishDocument(cif);

    return NextResponse.json({
      valid: result.valid,
      documentType: docType,
      documentTypeName: docType === "CIF" ? "CIF" : docType === "NIF" ? "NIF" : docType === "NIE" ? "NIE" : "Desconocido",
      entityType: result.entityType,
      entityTypeName: result.entityType ? getEntityTypeName(result.entityType) : undefined,
      typeLetter: result.typeLetter,
      provinceCode: result.provinceCode,
      formattedCif: result.valid ? formatCIF(cif) : undefined,
      error: result.error,
    });
  } catch (error) {
    console.error("Error validando CIF:", error);
    return NextResponse.json(
      { error: "Error al validar el CIF" },
      { status: 500 }
    );
  }
}

// POST: Validar múltiples CIFs (batch)
export async function POST(request: NextRequest) {
  // Rate limiting más estricto para batch
  const rateLimitResponse = rateLimitMiddleware(request, "validate-cif-batch", {
    maxRequests: 20,
    windowMs: 60 * 1000,
  });
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { cifs } = body;

    if (!Array.isArray(cifs)) {
      return NextResponse.json(
        { error: "El parámetro 'cifs' debe ser un array" },
        { status: 400 }
      );
    }

    if (cifs.length > 100) {
      return NextResponse.json(
        { error: "Máximo 100 CIFs por petición" },
        { status: 400 }
      );
    }

    const results = cifs.map((cif: string) => {
      const docType = identifyDocumentType(cif);
      const result = validateSpanishDocument(cif);

      return {
        cif,
        valid: result.valid,
        documentType: docType,
        entityType: result.entityType,
        error: result.error,
      };
    });

    // Contar válidos e inválidos
    const validCount = results.filter((r) => r.valid).length;
    const invalidCount = results.filter((r) => !r.valid).length;

    return NextResponse.json({
      results,
      summary: {
        total: results.length,
        valid: validCount,
        invalid: invalidCount,
      },
    });
  } catch (error) {
    console.error("Error validando CIFs:", error);
    return NextResponse.json(
      { error: "Error al validar los CIFs" },
      { status: 500 }
    );
  }
}
