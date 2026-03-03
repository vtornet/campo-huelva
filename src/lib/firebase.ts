import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Singleton: Evita que se conecte 2 veces si ya está conectado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Configurar auth con persistencia local para evitar problemas con redirect en PWAs
const authInstance = getAuth(app);

// Configurar persistencia local para móviles (más fiable con redirects)
if (typeof window !== 'undefined') {
  setPersistence(authInstance, browserLocalPersistence).catch((err) => {
    console.error("Error al configurar persistencia:", err);
    // Fallback a inMemory si falla
    setPersistence(authInstance, inMemoryPersistence).catch(console.error);
  });
}

export const auth = authInstance;

export const db = getFirestore(app);
export const storage = getStorage(app);

// Helper para detectar si es un dispositivo móvil
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};