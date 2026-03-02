import { NextResponse } from "next/server";

// Tamaño máximo para PDFs: 2MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    console.log("[UploadDoc] Iniciando subida de documento");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log("[UploadDoc] File:", file?.name, "Size:", file?.size, "Type:", file?.type);

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Falta userId" }, { status: 400 });
    }

    // Validar tipo de archivo - solo PDF
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Solo se permiten archivos PDF" }, { status: 400 });
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo excede los 2MB máximos" }, { status: 400 });
    }

    // Convertir a Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString("base64");

    console.log("[UploadDoc] Base64 creado, tamaño:", base64.length);

    // Crear data URL para el PDF
    const dataUrl = `data:application/pdf;base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size
    });

  } catch (error) {
    console.error("[UploadDoc] Error:", error);
    return NextResponse.json({
      error: "Error al subir el documento",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
