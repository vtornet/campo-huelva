import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: NextRequest) {
  try {
    const { oobCode, newPassword } = await request.json();

    if (!oobCode || !newPassword) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Mínimo 6 caracteres" }, { status: 400 });
    }

    const auth = getAuth();
    await auth.confirmPasswordReset(oobCode, newPassword);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reset error:", error);
    const msg = error.code === "auth/expired-action-code" ? "Enlace expirado"
      : error.code === "auth/invalid-action-code" ? "Enlace inválido"
      : "Error al cambiar la contraseña";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
