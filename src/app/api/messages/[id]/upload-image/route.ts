import { NextResponse } from "next/server";

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Configuración de ImgBB (servicio gratuito para hospedar imágenes)
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "";

export async function POST(request: Request) {
  try {
    console.log("[Upload] Iniciando subida de imagen");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log("[Upload] File:", file?.name, "Size:", file?.size, "UserId:", userId);

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Solo se permiten imágenes" }, { status: 400 });
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "La imagen excede los 5MB máximos" }, { status: 400 });
    }

    // Convertir a Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    console.log("[Upload] Base64 creado, tamaño:", base64.length);

    // Si hay API key de ImgBB, usar ImgBB
    if (IMGBB_API_KEY) {
      console.log("[Upload] Usando ImgBB");
      const imgbbFormData = new FormData();
      imgbbFormData.append("key", IMGBB_API_KEY);
      imgbbFormData.append("image", base64);

      const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: imgbbFormData
      });

      if (!imgbbResponse.ok) {
        throw new Error("Error en ImgBB");
      }

      const imgbbData = await imgbbResponse.json();
      console.log("[Upload] ImgBB response:", imgbbData.success);

      return NextResponse.json({
        success: true,
        url: imgbbData.data.url,
        path: imgbbData.data.id
      });
    }

    // Fallback: Devolver el Base64 directamente (no ideal pero funcional)
    console.log("[Upload] Usando Base64 directo (fallback)");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      path: "base64"
    });

  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json({
      error: "Error al subir la imagen",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
