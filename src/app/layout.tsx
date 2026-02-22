/**
 * Root Layout - Solo para rutas API y archivos estáticos
 * Las páginas de la aplicación están en [locale]/layout.tsx
 */
import { redirect } from "next/navigation";

export default function RootLayout() {
  // Redirigir al locale por defecto
  redirect("/es");
}
