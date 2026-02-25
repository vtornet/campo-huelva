'use client';

import { useCookies } from '@/context/CookieContext';
import { CookieBanner } from './CookieBanner';

/**
 * Wrapper que solo muestra el banner si el usuario no ha dado consentimiento.
 */
export function CookieBannerWrapper() {
  const { showBanner } = useCookies();

  if (!showBanner) return null;

  return <CookieBanner />;
}
