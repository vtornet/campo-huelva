import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// GET - Listar cupones (admin)
export async function GET(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const coupons = await prisma.coupon.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Procesar los cupones para extraer info de solicitudes pendientes
    // Formato definitivo: REQUEST:email|companyId|companyName|reason
    // Formato anterior: REQUEST:userId|companyId|reason|companySize
    // Formato viejo: REQUEST:companyId|reason|companySize
    const processedCoupons = coupons.map(coupon => {
      let requestData = null;
      if (coupon.notes?.startsWith("REQUEST:")) {
        const parts = coupon.notes.substring(9).split("|");
        if (parts[0]?.includes("@")) {
          // Formato definitivo: email|companyId|companyName|reason
          requestData = {
            email: parts[0] || "",
            companyId: parts[1] || "",
            companyName: parts[2] || "",
            reason: parts[3] || "",
          };
        } else if (parts.length >= 4) {
          // Formato anterior: userId|companyId|reason|companySize
          requestData = {
            email: "",
            companyId: parts[1] || "",
            companyName: "",
            reason: parts[2] || "",
          };
        } else {
          // Formato viejo: companyId|reason|companySize
          requestData = {
            email: "",
            companyId: parts[0] || "",
            companyName: "",
            reason: parts[1] || "",
          };
        }
      }

      return {
        ...coupon,
        requestData,
      };
    });

    return NextResponse.json({ coupons: processedCoupons });
  } catch (error: any) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Error al obtener cupones" },
      { status: 500 }
    );
  }
}

// POST - Crear cupón manualmente (admin)
export async function POST(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que es admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { code, maxUses = 1, expiresInDays = 30, notes } = body;

    // Generar código si no se proporciona
    const finalCode = code || `AGRO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Verificar que no existe
    const existing = await prisma.coupon.findUnique({
      where: { code: finalCode },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un cupón con ese código" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: finalCode,
        status: "ACTIVE",
        maxUses,
        expiresAt: expiresInDays
          ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
          : null,
        createdBy: userId,
        notes: notes || null,
      },
    });

    return NextResponse.json({
      success: true,
      coupon,
      message: `Cupón creado: ${finalCode}`,
    });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Error al crear cupón" },
      { status: 500 }
    );
  }
}
