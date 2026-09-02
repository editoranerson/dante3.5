import { useEffect } from 'react';

const SITE_NAME = 'Querido Dante';
const DEFAULT_TITLE = 'Querido Dante — O universo interativo do Dante';
const DEFAULT_DESCRIPTION =
  'Explore o universo de Querido Dante: biblioteca, chatstories, personagens, segredos, minijogos e muito mais.';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function excerpt(text: string | null | undefined, max = 155): string {
  if (!text) return DEFAULT_DESCRIPTION;
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

export interface PageMetaOptions {
  title?: string;
  description?: string;
  image?: string | null;
  type?: 'website' | 'article';
}

/**
 * Atualiza <title>, description, Open Graph e canonical a cada troca de rota.
 * Substitui o react-helmet-async (não suportado neste stack) com a mesma função:
 * o conteúdo real da rota fica no <head> para crawlers (Googlebot / AdSense).
 */
export function usePageMeta({ title, description, image, type = 'website' }: PageMetaOptions) {
  const fullTitle = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESCRIPTION;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:type', type);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:url', window.location.href);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    if (image) {
      upsertMeta('property', 'og:image', image);
      upsertMeta('name', 'twitter:image', image);
    }
    upsertCanonical(window.location.origin + window.location.pathname);
  }, [fullTitle, desc, image, type]);
}

export function PageMeta(props: PageMetaOptions) {
  usePageMeta(props);
  return null;
}
