"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useNotifications } from "@/components/Notifications";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

export default function Onboarding() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const params = useParams();
  const t = useTranslations("onboarding");
  const tNav = useTranslations("nav");
  const { showNotification } = useNotifications();
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSignOut = async () => {
    await auth.signOut();
    router.push(`/${locale}/login`);
  };

  // Proteger la página: si no hay usuario, ir a login
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/${locale}/login`);
      } else {
        setPageLoading(false);
      }
    }
  }, [user, loading, router, locale]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  // Aceptamos todos los roles incluyendo ENCARGADO y TRACTORISTA
  const handleSelectRole = async (role: "WORKER" | "COMPANY" | "FOREMAN" | "ENGINEER" | "ENCARGADO" | "TRACTORISTA") => {
    if (!user) return;
    setActionLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          role: role,
        }),
      });

      if (response.ok) {
        if (role === "WORKER") router.push(`/${locale}/profile/worker`);
        else if (role === "FOREMAN") router.push(`/${locale}/profile/foreman`);
        else if (role === "COMPANY") router.push(`/${locale}/profile/company`);
        else if (role === "ENGINEER") router.push(`/${locale}/profile/engineer`);
        else if (role === "ENCARGADO") router.push(`/${locale}/profile/encargado`);
        else if (role === "TRACTORISTA") router.push(`/${locale}/profile/tractorista`);
        else router.push(`/${locale}`);
      } else {
        showNotification({
          type: "error",
          title: t("errors.saveError"),
          message: t("errors.tryAgain"),
        });
      }
    } catch (error) {
      console.error(error);
      showNotification({
        type: "error",
        title: t("errors.connectionError"),
        message: t("errors.checkConnection"),
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      {/* Botón de cerrar sesión */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {tNav("logout")}
      </button>

      <div className="max-w-5xl w-full text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/logo.png"
            alt="Agro Red"
            width={200}
            height={58}
            priority
          />
        </div>
        <h1 className="text-3xl font-bold mb-4">
          {t("welcome")} <span className="text-emerald-600">Agro</span><span className="text-red-500"> Red</span>!
        </h1>
        <p className="text-xl text-gray-600 mb-10">{t("selectProfile")}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* TRABAJADOR */}
          <button onClick={() => handleSelectRole("WORKER")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-green-500 transition text-left h-full">
            <div className="text-4xl mb-4">👨‍🌾</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.worker.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.worker.description")}</p>
          </button>

          {/* MANIJERO */}
          <button onClick={() => handleSelectRole("FOREMAN")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-orange-500 transition text-left h-full">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.foreman.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.foreman.description")}</p>
          </button>

          {/* EMPRESA */}
          <button onClick={() => handleSelectRole("COMPANY")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-blue-500 transition text-left h-full">
            <div className="text-4xl mb-4">🚜</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.company.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.company.description")}</p>
          </button>

          {/* INGENIERO */}
          <button onClick={() => handleSelectRole("ENGINEER")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-purple-500 transition text-left h-full">
            <div className="text-4xl mb-4">👷‍♂️</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.engineer.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.engineer.description")}</p>
          </button>

          {/* ENCARGADO/CAPATAZ (NUEVO) */}
          <button onClick={() => handleSelectRole("ENCARGADO")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-teal-500 transition text-left h-full">
            <div className="text-4xl mb-4">👔</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.encargado.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.encargado.description")}</p>
          </button>

          {/* TRACTORISTA (NUEVO) */}
          <button onClick={() => handleSelectRole("TRACTORISTA")} disabled={actionLoading}
            className="group bg-white p-8 rounded-2xl shadow-lg border-2 border-transparent hover:border-amber-500 transition text-left h-full">
            <div className="text-4xl mb-4">🚜</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t("roles.tractorista.title")}</h3>
            <p className="text-gray-500 text-sm">{t("roles.tractorista.description")}</p>
          </button>

        </div>
      </div>
    </div>
  );
}
