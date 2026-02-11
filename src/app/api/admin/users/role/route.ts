import { NextResponse } from "next/server";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Validar que el rol es uno de los valores permitidos
const isValidRole = (role: string): role is Role => {
  return ["USER", "FOREMAN", "COMPANY", "ADMIN"].includes(role);
};

export async function POST(request: Request) {
  const body = await request.json();
  const { userId, role, adminId } = body;

  // Validacion de campos requeridos
  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }
  if (!role) {
    return NextResponse.json({ error: "Falta role" }, { status: 400 });
  }
  if (!isValidRole(role)) {
    return NextResponse.json(
      { error: "Rol inválido. Debe ser USER, FOREMAN, COMPANY o ADMIN" },
      { status: 400 }
    );
  }

  try {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: true,
        foremanProfile: true,
        companyProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Evitar que un admin cambie su propio rol
    if (userId === adminId) {
      return NextResponse.json(
        { error: "No puedes cambiar tu propio rol" },
        { status: 400 }
      );
    }

    const previousRole = user.role;

    // Actualizar el rol del usuario
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Crear log de la accion
    await prisma.adminLog.create({
      data: {
        adminId: adminId || "system",
        action: "CHANGE_ROLE",
        targetType: "USER",
        targetId: userId,
        details: JSON.stringify({
          previousRole,
          newRole: role,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("Error changing user role:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
