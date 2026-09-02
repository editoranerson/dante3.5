import { useEffect, useState } from 'react';
import { supabase, type PlanType, type Profile } from '@/lib/supabase';
import { getEffectivePlan } from '@/lib/plans';

/* =====================================================================
 * Tipos
 * ===================================================================== */
export type AdTipo = 'ad' | 'pub';
export type AdPlano = 'bronze' | 'prata' | 'ouro';
export type AdPlacement = 'home' | 'html';
export type AdContext = 'home' | 'chat' | 'chatstory';

export interface AdBanner {
  id: string;
  nome_interno: string;
  placement: AdPlacement;
  tipo_anuncio: AdTipo;
  plano: AdPlano | null;
  peso_sorteio: number;
  codigo_html_mobile: string;
  codigo_html_desktop: string;
  link_url: string | null;
  image_mobile_url: string | null;
  image_desktop_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export const AD_PLANO_LABELS: Record<AdPlano, string> = {
  bronze: 'Bronze',
  prata: 'Prata',
  ouro: 'Ouro',
};

/** Tamanhos recomendados para os banners da Home (largura x altura em px). */
export const HOME_BANNER_SIZES = {
  mobile: { width: 720, height: 240, label: '720 x 240 px (proporção 3:1)' },
  desktop: { width: 1200, height: 300, label: '1200 x 300 px (proporção 4:1)' },
} as const;

/** Tamanhos padrão dos blocos HTML (Chat Dante / Chatstory). */
export const HTML_BANNER_SIZES = {
  mobile: '320 x 50 px (ou 300 x 50 px)',
  desktop: '728 x 90 px',
} as const;

/* =====================================================================
 * Carregamento (com cache curto em memória)
 * ===================================================================== */
let cache: { at: number; rows: AdBanner[] } | null = null;
const CACHE_MS = 60_000;

export async function fetchActiveBanners(force = false): Promise<AdBanner[]> {
  if (!force && cache && Date.now() - cache.at < CACHE_MS) return cache.rows;
  const { data, error } = await supabase
    .from('ad_banners')
    .select('*')
    .eq('ativo', true)
    .order('peso_sorteio', { ascending: false });
  if (error) {
    // Tabela ainda não criada ou sem permissão: falha silenciosa (sem anúncios).
    return cache?.rows ?? [];
  }
  const rows = (data as AdBanner[]) ?? [];
  cache = { at: Date.now(), rows };
  return rows;
}

export function invalidateBannerCache() {
  cache = null;
}

export function useActiveBanners(placement?: AdPlacement) {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchActiveBanners().then((rows) => {
      if (!alive) return;
      setBanners(placement ? rows.filter((b) => b.placement === placement) : rows);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, [placement]);
  return { banners, loaded };
}

/* =====================================================================
 * Regras de visibilidade por plano do usuário
 * ===================================================================== */

/** Plano efetivo do usuário — anônimo (deslogado) conta como free. */
export function resolveUserPlan(profile: Profile | null | undefined): PlanType {
  if (!profile) return 'free';
  return getEffectivePlan(profile);
}

/** Planos 'pub' ocultos para cada plano de usuário. */
const HIDDEN_PUB_PLANS: Record<PlanType, AdPlano[]> = {
  free: [],
  dante_plus: ['bronze'],
  dante_premium: ['bronze', 'prata'],
  dante_premium_plus: ['bronze', 'prata'],
};

/** Em quais contextos os banners HTML do tipo 'ad' ficam ocultos. */
const HIDE_AD_TYPE: Record<PlanType, AdContext[]> = {
  free: [],
  dante_plus: [],
  dante_premium: ['chatstory'],
  dante_premium_plus: ['chatstory', 'chat'],
};

export function isBannerAllowed(banner: AdBanner, plan: PlanType, ctx: AdContext): boolean {
  if (!banner.ativo) return false;
  if (banner.tipo_anuncio === 'ad') {
    return !HIDE_AD_TYPE[plan].includes(ctx);
  }
  // pub
  if (!banner.plano) return false;
  return !HIDDEN_PUB_PLANS[plan].includes(banner.plano);
}

export function filterAllowed(banners: AdBanner[], plan: PlanType, ctx: AdContext): AdBanner[] {
  return banners.filter((b) => isBannerAllowed(b, plan, ctx));
}

/* =====================================================================
 * Sorteio ponderado sem repetição do último exibido
 * ===================================================================== */
export function pickWeighted(banners: AdBanner[], lastId: string | null): AdBanner | null {
  if (banners.length === 0) return null;
  let pool = lastId ? banners.filter((b) => b.id !== lastId) : banners;
  if (pool.length === 0) pool = banners; // só existe um banner: repete
  const total = pool.reduce((s, b) => s + Math.max(1, b.peso_sorteio || 1), 0);
  let r = Math.random() * total;
  for (const b of pool) {
    r -= Math.max(1, b.peso_sorteio || 1);
    if (r <= 0) return b;
  }
  return pool[pool.length - 1];
}

/** Filtra por plano + contexto e sorteia. */
export function drawBanner(
  banners: AdBanner[],
  plan: PlanType,
  ctx: AdContext,
  lastId: string | null,
): AdBanner | null {
  return pickWeighted(filterAllowed(banners, plan, ctx), lastId);
}

/* =====================================================================
 * Intervalo de interações do Chat do Dante
 * ===================================================================== */
export const CHAT_AD_INTERVAL: Record<PlanType, number> = {
  free: 2,
  dante_plus: 4,
  dante_premium: 8,
  dante_premium_plus: 12,
};

/* =====================================================================
 * Detecção de dispositivo
 * ===================================================================== */
const MOBILE_BREAKPOINT = 768;

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return true;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth < MOBILE_BREAKPOINT;
  const ua = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return narrow || (coarse && ua);
}

export function useIsMobileDevice() {
  const [mobile, setMobile] = useState<boolean>(() => isMobileDevice());
  useEffect(() => {
    const onResize = () => setMobile(isMobileDevice());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
}

/** Gera o HTML padrão (imagem + link) para banners da Home. */
export function buildImageBannerHtml(imageUrl: string, linkUrl: string, alt = 'Publicidade') {
  const a = alt.replace(/"/g, '&quot;');
  const img = `<img src="${imageUrl}" alt="${a}" style="display:block;width:100%;height:auto;border-radius:12px" loading="lazy" />`;
  return linkUrl
    ? `<a href="${linkUrl}" target="_blank" rel="noopener sponsored">${img}</a>`
    : img;
}
