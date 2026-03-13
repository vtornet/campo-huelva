import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const userId = await authenticateRequest(request);

    if (!userId) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "Código inválido" }, { status: 400 });
    }

    // Buscar el cupón
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado", valid: false });
    }

    // Verificar que el cupón esté activo
    if (coupon.status !== "ACTIVE") {
      return NextResponse.json({ error: "Este cupón no está activo", valid: false });
    }

    // Verificar que no haya expirado
    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      return NextResponse.json({ error: "Este cupón ha caducado", valid: false });
    }

    // Verificar que no haya superado el máximo de usos
    if (coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: "Este cupón ya ha sido usado completamente", valid: false });
    }

    // Verificar que no haya sido usado (usedBy contiene el companyId)
    if (coupon.usedBy) {
      return NextResponse.json({ error: "Este cupón ya ha sido usado", valid: false });
    }

    // Obtener el perfil de empresa del usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { companyProfile: true },
    });

    if (!user?.companyProfile) {
      return NextResponse.json({ error: "Solo empresas pueden usar cupones", valid: false });
    }

    // Cupón válido
    return NextResponse.json({
      valid: true,
      message: "Cupón válido",
      coupon: {
        code: coupon.code,
        maxUses: coupon.maxUses,
        expiresAt: coupon.expiresAt,
      },
    });
  } catch (error: any) {
    console.error("Error validating coupon:", error);
    return NextResponse.json({ error: "Error al validar el cupón" }, { status: 500 });
  }
}
