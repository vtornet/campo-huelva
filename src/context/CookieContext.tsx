'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type CookieCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookiePreferences {
  necessary: boolean;    // Siempre true, no se puede desactivar
  analytics: boolean;    // Google Analytics, etc.
  marketing: boolean;    // Futuras cookies de marketing
}

export interface CookieConsent {
  hasConsented: boolean;
  preferences: CookiePreferences;
  consentDate?: Date;
}

interface CookieContextType {
  consent: CookieConsent;
  acceptAll: () => void;
  rejectNonNecessary: () => void;
  savePreferences: (preferences: Omit<CookiePreferences, 'necessary'>) => void;
  resetConsent: () => void;
  showBanner: boolean;  // Controla si se muestra el banner inferior
  showSettings: boolean; // Controla si se muestra el modal lateral
  openSettings: () => void;
  closeSettings: () => void;
}

const CookieContext = createContext<CookieContextType | undefined>(undefined);

const CONSENT_STORAGE_KEY = 'cookie_consent';
const CONSENT_VERSION = '1.0'; // Para futuros cambios

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function loadConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Si la versión cambió, pedir nuevo consentimiento
    if (parsed.version !== CONSENT_VERSION) {
      return null;
    }

    return {
      hasConsented: parsed.hasConsented ?? false,
      preferences: { ...defaultPreferences, ...parsed.preferences },
      consentDate: parsed.consentDate ? new Date(parsed.consentDate) : undefined,
    };
  } catch {
    return null;
  }
}

function saveConsent(consent: CookieConsent): void {
  if (typeof window === 'undefined') return;

  const toStore = {
    ...consent,
    version: CONSENT_VERSION,
    consentDate: consent.consentDate?.toISOString(),
  };

  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(toStore));
}

interface CookieProviderProps {
  children: ReactNode;
}

export function CookieProvider({ children }: CookieProviderProps) {
  const [consent, setConsent] = useState<CookieConsent>({
    hasConsented: false,
    preferences: defaultPreferences,
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // El banner se muestra si NO hay consentimiento
  const showBanner = isInitialized && !consent.hasConsented;

  // Cargar consentimiento al montar
  useEffect(() => {
    const savedConsent = loadConsent();

    if (savedConsent?.hasConsented) {
      setConsent(savedConsent);
    }
    // No abrimos el modal automáticamente, solo el banner si no hay consentimiento

    setIsInitialized(true);
  }, []);

  // Aplicar preferencias de cookies cuando cambian
  useEffect(() => {
    if (!isInitialized || !consent.hasConsented) return;

    // Aquí se pueden inicializar/detener servicios según preferencias
    // Por ahora, solo documentamos en consola
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('🍪 Cookie preferences:', consent.preferences);
    }

    // Ejemplo futuro: Inicializar Google Analytics solo si consent.preferences.analytics
    // if (consent.preferences.analytics) { initializeGA(); }

  }, [consent, isInitialized]);

  const acceptAll = () => {
    const newConsent: CookieConsent = {
      hasConsented: true,
      preferences: {
        necessary: true,
        analytics: true,
        marketing: true,
      },
      consentDate: new Date(),
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowSettings(false);
  };

  const rejectNonNecessary = () => {
    const newConsent: CookieConsent = {
      hasConsented: true,
      preferences: defaultPreferences,
      consentDate: new Date(),
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowSettings(false);
  };

  const savePreferences = (userPreferences: Omit<CookiePreferences, 'necessary'>) => {
    const newConsent: CookieConsent = {
      hasConsented: true,
      preferences: {
        necessary: true,
        ...userPreferences,
      },
      consentDate: new Date(),
    };
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowSettings(false);
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent({
      hasConsented: false,
      preferences: defaultPreferences,
    });
  };

  const openSettings = () => setShowSettings(true);
  const closeSettings = () => setShowSettings(false);

  return (
    <CookieContext.Provider
      value={{
        consent,
        acceptAll,
        rejectNonNecessary,
        savePreferences,
        resetConsent,
        showBanner,
        showSettings,
        openSettings,
        closeSettings,
      }}
    >
      {children}
    </CookieContext.Provider>
  );
}

export function useCookies(): CookieContextType {
  const context = useContext(CookieContext);
  if (!context) {
    throw new Error('useCookies must be used within a CookieProvider');
  }
  return context;
}
