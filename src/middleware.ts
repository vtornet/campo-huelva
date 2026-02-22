import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Matcher para todas las rutas excepto API, archivos estáticos y los que ya maneja next-intl
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)", "/"],
};
