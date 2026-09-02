export const ADSENSE_CLIENT = 'ca-pub-8156784789940885';

/**
 * IDs dos blocos de anúncio criados no painel do AdSense.
 * Preencha com o "data-ad-slot" de cada bloco. Enquanto estiver vazio,
 * o componente <AdSlot /> não renderiza nada (evita blocos em branco).
 */
export const AD_SLOTS = {
  bibliotecaList: '',
  bibliotecaChapter: '',
  chatstoryDetail: '',
  chatstoryReader: '',
} as const;

export type AdSlotName = keyof typeof AD_SLOTS;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Garante que o script global do AdSense está presente (SPA / navegação client-side). */
export function ensureAdSenseScript() {
  if (typeof document === 'undefined') return;
  const src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  if (document.querySelector(`script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]`))
    return;
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
}

/** Dispara o preenchimento de um bloco de anúncio. */
export function pushAd() {
  if (typeof window === 'undefined') return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* AdSense ainda carregando ou bloqueado */
  }
}
