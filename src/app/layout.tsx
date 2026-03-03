import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/components/Notifications";
import { CookieProvider } from "@/context/CookieContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import PWAInstaller from "@/components/PWAInstaller";
import { PushNotificationManager } from "@/components/PushNotificationManager";
import Footer from "@/components/Footer";
import { CookieBannerWrapper } from "@/components/CookieBannerWrapper";
import { CookieSettings } from "@/components/CookieSettings";

const inter = Inter({ subsets: ["latin"] });

// URL base de la aplicación (actualizada al dominio de producción)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com"

// Metadata para SEO y PWA
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Agro Red - Empleo Agrícola",
    template: "%s | Agro Red",
  },
  description: "Plataforma de empleo agrícola que conecta trabajadores, manijeros, ingenieros y empresas del sector agrario español. Encuentra trabajo o talento en el campo.",
  keywords: [
    "empleo agrícola",
    "trabajo campo",
    "trabajadores agrícolas",
    "manijeros",
    "ingenieros agrónomos",
    "ofertas agricultura",
    "Huelva",
    "fresa",
    "frutos rojos",
    "recolección",
    "empresas agrícolas",
  ],
  authors: [{ name: "Agro Red", url: APP_URL }],
  creator: "Agro Red",
  publisher: "Agro Red",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: APP_URL,
    title: "Agro Red - Empleo Agrícola",
    description: "Plataforma de empleo agrícola que conecta trabajadores, manijeros, ingenieros y empresas del sector agrario español.",
    siteName: "Agro Red",
    // La imagen OG se genera dinámicamente con Next.js - URL absoluta para WhatsApp
    images: [
      {
        url: `${APP_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Agro Red - Empleo Agrícola",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agro Red - Empleo Agrícola",
    description: "Plataforma de empleo agrícola que conecta trabajadores, manijeros, ingenieros y empresas del sector agrario español.",
    // La imagen de Twitter se genera dinámicamente con Next.js - URL absoluta
    images: [`${APP_URL}/twitter-image`],
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Agro Red",
  },
};

// Viewport para PWA
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#059669" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags adicionales para WhatsApp/Open Graph */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:alt" content="Agro Red - Empleo Agrícola" />

        {/* Meta tags adicionales para PWA */}
        <meta name="application-name" content="Agro Red" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Agro Red" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-TileColor" content="#059669" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Preconexión a orígenes externos */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://firebase.googleapis.com" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" type="image/png" />
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <CookieProvider>
            <NotificationsProvider>
              <div className="flex flex-col min-h-screen">
                {children}
                <Footer />
              </div>
              {/* Service Worker desactivado temporalmente para probar Google Auth en móvil */}
              {/* <ServiceWorkerProvider /> */}
              {/* <ServiceWorkerRegister /> */}
              <PushNotificationManager />
              <PWAInstaller />
              <CookieBannerWrapper />
              <CookieSettings />
            </NotificationsProvider>
          </CookieProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
// Deploy con dominio definitivo
