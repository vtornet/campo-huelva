import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Matcher para todas las rutas excepto API, archivos estáticos, y rutas internas de Next.js
  matcher: [
    // Match todas las rutas que NO empiezan con api, _next, _vercel, o tengan una extensión de archivo
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // También match la raíz
    "/",
  ],
};
