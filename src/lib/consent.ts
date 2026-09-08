export const CONSENT_KEY = 'uqd_cookie_consent';

export type ConsentValue = 'accepted' | 'rejected' | null;

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

export function getConsent(): ConsentValue {
  if (typeof localStorage === 'undefined') return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === 'accepted') return 'accepted';
  if (value === 'rejected' || value === 'dismissed') return 'rejected';
  return null;
}

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // usa a função global quando existir, senão empurra direto na fila
  if (typeof window.gtag === 'function') window.gtag(...args);
  else window.dataLayer.push(args);
}

/** Remove cookies de medição já gravados (analytics/ads). */
function clearTrackingCookies() {
  if (typeof document === 'undefined') return;
  const host = window.location.hostname;
  const domains = [host, '.' + host, '.' + host.split('.').slice(-2).join('.')];
  document.cookie.split(';').forEach((entry) => {
    const name = entry.split('=')[0]?.trim();
    if (!name) return;
    if (!/^(_ga|_gid|_gat|__gads|__gpi|_gcl)/.test(name)) return;
    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
    });
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
}

/** Aplica o estado de consentimento atual ao Google (Consent Mode v2). */
export function applyConsent(value: ConsentValue) {
  const granted = value === 'accepted';
  gtag('consent', 'update', {
    ad_storage: granted ? 'granted' : 'denied',
    ad_user_data: granted ? 'granted' : 'denied',
    ad_personalization: granted ? 'granted' : 'denied',
    analytics_storage: granted ? 'granted' : 'denied',
  });

  if (!granted) {
    clearTrackingCookies();
    if (typeof window !== 'undefined') {
      const ads = (window.adsbygoogle = window.adsbygoogle || []) as unknown[] & {
        requestNonPersonalizedAds?: number;
      };
      ads.requestNonPersonalizedAds = 1;
    }
  }
}

export function setConsent(value: Exclude<ConsentValue, null>) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(CONSENT_KEY, value);
  applyConsent(value);
}
