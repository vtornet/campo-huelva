import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationsProvider } from "@/components/Notifications";
import ServiceWorkerProvider from "@/components/ServiceWorkerProvider";
import PWAInstaller from "@/components/PWAInstaller";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/config";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"] });

// URL base de la aplicación (actualizada al dominio de producción)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://agroredjob.com";

// Metadata para SEO y PWA
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Red Agro - Empleo Agrícola",
    template: "%s | Red Agro",
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
  authors: [{ name: "Red Agro", url: APP_URL }],
  creator: "Red Agro",
  publisher: "Red Agro",
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
    title: "Red Agro - Empleo Agrícola",
    description: "Plataforma de empleo agrícola que conecta trabajadores, manijeros, ingenieros y empresas del sector agrario español.",
    siteName: "Red Agro",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Red Agro - Empleo Agrícola",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Red Agro - Empleo Agrícola",
    description: "Plataforma de empleo agrícola que conecta trabajadores, manijeros, ingenieros y empresas del sector agrario español.",
    images: ["/twitter-image"],
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
    title: "Red Agro",
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

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validar que el locale sea válido
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Obtener mensajes de traducción
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* Meta tags adicionales para PWA */}
        <meta name="application-name" content="Red Agro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Red Agro" />
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
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <NotificationsProvider>
              {children}
              <ServiceWorkerProvider />
              <PWAInstaller />
            </NotificationsProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
