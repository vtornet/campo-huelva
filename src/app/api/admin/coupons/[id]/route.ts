import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";
import { authenticateRequest } from "@/lib/firebase-admin";

const prisma = new PrismaClient();

// PUT - Actualizar cupón (aprobar solicitud, revocar, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { action } = body;
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });
    }

    // Si es una solicitud pendiente y se aprueba
    if (coupon.notes?.startsWith("REQUEST:") && action === "approve") {
      // Extraer companyId de las notas
      const parts = coupon.notes.substring(9).split("|");
      const requestCompanyId = parts[0];

      // Aprobar: marcar como activo y limpiar notas
      const updated = await prisma.coupon.update({
        where: { id },
        data: {
          status: "ACTIVE",
          notes: `Aprobado por ${userId}. Razón: ${parts[1] || ''}`,
        },
      });

      // Enviar email al usuario con el código
      // (opcional - se puede implementar después)

      return NextResponse.json({
        success: true,
        coupon: updated,
        message: "Solicitud aprobada. Código: " + coupon.code,
      });
    }

    // Otras acciones
    switch (action) {
      case "revoke":
        await prisma.coupon.update({
          where: { id },
          data: { status: "REVOKED" },
        });
        return NextResponse.json({ success: true, message: "Cupón revocado" });

      case "reactivate":
        await prisma.coupon.update({
          where: { id },
          data: { status: "ACTIVE" },
        });
        return NextResponse.json({ success: true, message: "Cupón reactivado" });

      case "extend":
        const { days } = body;
        await prisma.coupon.update({
          where: { id },
          data: {
            expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
          },
        });
        return NextResponse.json({ success: true, message: `Cupón extendido ${days} días` });

      default:
        return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Error al actualizar cupón" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cupón
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Cupón eliminado" });
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Error al eliminar cupón" },
      { status: 500 }
    );
  }
}
