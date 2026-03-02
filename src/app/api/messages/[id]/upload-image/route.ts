import { NextResponse } from "next/server";
import admin from "firebase-admin";

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  let bucket: any = null;

  try {
    console.log("[Upload] === Iniciando subida de imagen ===");

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    console.log("[Upload] File:", file?.name, "Size:", file?.size, "Type:", file?.type, "UserId:", userId);

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

    console.log("[Upload] Validaciones pasadas");

    // Inicializar Firebase Admin si no está inicializado
    if (!admin.apps.length) {
      console.log("[Upload] Inicializando Firebase Admin...");

      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

      console.log("[Upload] ProjectId:", projectId, "StorageBucket:", storageBucket);

      try {
        admin.initializeApp({
          projectId: projectId,
          storageBucket: storageBucket,
        });
        console.log("[Upload] Firebase Admin inicializado correctamente");
      } catch (initError) {
        console.error("[Upload] Error inicializando Firebase Admin:", initError);
        throw new Error(`Error iniciando Firebase: ${initError}`);
      }
    } else {
      console.log("[Upload] Firebase Admin ya estaba inicializado");
    }

    bucket = admin.storage().bucket();
    console.log("[Upload] Bucket obtenido:", bucket?.name);

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("[Upload] Buffer creado, tamaño:", buffer.length);

    // Generar nombre único
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.type.split("/")[1] || "jpg";
    const fileName = `${timestamp}-${random}.${extension}`;
    const storagePath = `chat-images/${userId}/${fileName}`;

    console.log("[Upload] Storage path:", storagePath);

    // Subir a Firebase Storage
    const fileRef = bucket.file(storagePath);
    console.log("[Upload] File ref creado");

    console.log("[Upload] Iniciando save()...");
    await fileRef.save(buffer, {
      contentType: file.type,
      resumable: false
    });
    console.log("[Upload] Save completado");

    // Hacer el archivo público
    console.log("[Upload] Haciendo archivo público...");
    await fileRef.makePublic();
    console.log("[Upload] Archivo público");

    // Generar URL pública
    const bucketName = bucket.name;
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    console.log("[Upload] URL pública:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: storagePath
    });

  } catch (error: any) {
    console.error("[Upload] ERROR completo:", error);
    console.error("[Upload] Error message:", error?.message);
    console.error("[Upload] Error stack:", error?.stack);

    return NextResponse.json({
      error: "Error al subir la imagen",
      details: error?.message || "Unknown error",
      stack: error?.stack
    }, { status: 500 });
  }
}
