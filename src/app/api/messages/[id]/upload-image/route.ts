import { NextResponse } from "next/server";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializar Firebase app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const storage = getStorage(app);

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

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

    // Convertir File a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre único: chat-images/{userId}/{timestamp}-{random}.jpg
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${timestamp}-${random}.${file.type.split("/")[1]}`;
    const storagePath = `chat-images/${userId}/${fileName}`;

    // Subir a Firebase Storage
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, buffer, {
      contentType: file.type
    });

    // Obtener URL pública
    const downloadUrl = await getDownloadURL(storageRef);

    return NextResponse.json({
      success: true,
      url: downloadUrl,
      path: storagePath
    });

  } catch (error) {
    console.error("Error uploading image:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}
