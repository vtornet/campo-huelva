import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getApps } from "firebase/app";

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Inicializar Firebase Admin si no está inicializado
if (!admin.apps.length) {
  // Usar las variables de entorno
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  // Si no hay credenciales de servicio, usar el método simplificado (para development)
  if (!clientEmail || !privateKey) {
    console.log("[Upload] Inicializando Firebase Admin sin credenciales de servicio");
    try {
      admin.initializeApp({
        projectId: projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (e) {
      console.log("[Upload] Error en inicialización simple:", e);
    }
  } else {
    console.log("[Upload] Inicializando Firebase Admin con credenciales de servicio");
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }
}

const bucket = admin.storage().bucket();

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

    console.log("[Upload] Validaciones pasadas, convirtiendo a buffer");

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.type.split("/")[1] || "jpg";
    const fileName = `${timestamp}-${random}.${extension}`;
    const storagePath = `chat-images/${userId}/${fileName}`;

    console.log("[Upload] Storage path:", storagePath);

    // Subir a Firebase Storage usando Admin SDK
    const fileRef = bucket.file(storagePath);

    console.log("[Upload] Iniciando upload a bucket...");
    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: { contentType: file.type }
    });
    console.log("[Upload] Upload completado");

    // Hacer el archivo público
    await fileRef.makePublic();
    console.log("[Upload] Archivo hecho público");

    // Generar URL pública
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    console.log("[Upload] URL pública:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath
    });

  } catch (error) {
    console.error("[Upload] Error:", error);
    return NextResponse.json({
      error: "Error al subir la imagen",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
