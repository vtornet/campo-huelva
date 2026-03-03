import { initializeApp, getApps } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence, inMemoryPersistence, GoogleAuthProvider } from "firebase/auth";
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
const authInstance = getAuth(app);

// Configurar persistencia una sola vez (importante para que funcione redirect en móviles)
let persistenceConfigured = false;

export const configureAuthPersistence = async () => {
  if (persistenceConfigured || typeof window === 'undefined') return;

  try {
    // Usar LOCAL persistence para móviles (más fiable con redirects)
    await setPersistence(authInstance, browserLocalPersistence);
    console.log("Firebase Auth persistencia configurada: browserLocalPersistence");
  } catch (err) {
    console.error("Error configurando persistencia local, usando inMemory:", err);
    try {
      await setPersistence(authInstance, inMemoryPersistence);
      console.log("Firebase Auth persistencia configurada: inMemoryPersistence");
    } catch (err2) {
      console.error("Error configurando persistencia inMemory:", err2);
    }
  }
  persistenceConfigured = true;
};

// Llamar a la configuración inmediatamente en el cliente
if (typeof window !== 'undefined') {
  configureAuthPersistence();
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = getStorage(app);

// Detectar si es dispositivo móvil
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
         (/Android/i.test(ua) && /Chrome/i.test(ua)); // Chrome Android específicamente
};

// Crear provider de Google con configuración correcta
export const createGoogleProvider = () => {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
};
