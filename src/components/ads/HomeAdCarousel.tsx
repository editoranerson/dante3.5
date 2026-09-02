import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AdHtml } from '@/components/ads/AdHtml';
import {
  filterAllowed,
  resolveUserPlan,
  useActiveBanners,
  useIsMobileDevice,
  type AdBanner,
} from '@/lib/ads';

const ROTATE_MS = 7000;

/** Ordena por peso (maior peso primeiro) e embaralha levemente dentro do peso. */
function orderByWeight(list: AdBanner[]): AdBanner[] {
  return [...list].sort(
    (a, b) => (b.peso_sorteio || 1) - (a.peso_sorteio || 1) || Math.random() - 0.5,
  );
}

export function HomeAdCarousel() {
  const { profile } = useAuth();
  const { banners } = useActiveBanners('home');
  const isMobile = useIsMobileDevice();
  const plan = resolveUserPlan(profile);
  const [index, setIndex] = useState(0);

  const list = useMemo(
    () => orderByWeight(filterAllowed(banners, plan, 'home')),
    [banners, plan],
  );

  useEffect(() => {
    setIndex(0);
  }, [list.length]);

  useEffect(() => {
    if (list.length <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [list.length]);

  if (list.length === 0) return null;
  const current = list[index % list.length];
  const html = isMobile ? current.codigo_html_mobile : current.codigo_html_desktop;
  const imageUrl = isMobile
    ? current.image_mobile_url || current.image_desktop_url
    : current.image_desktop_url || current.image_mobile_url;
  const href = normalizeUrl(current.link_url);

  const image = imageUrl ? (
    <img
      src={imageUrl}
      alt={current.nome_interno || 'Publicidade'}
      className="block h-auto w-full animate-fade-in"
    />
  ) : null;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-2 pt-4 sm:px-6">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-grape-200/40">Publicidade</p>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-ink-800/40">
        {image ? (
          href ? (
            <a key={current.id} href={href} target="_blank" rel="noopener sponsored">
              {image}
            </a>
          ) : (
            image
          )
        ) : (
          <AdHtml key={current.id} html={html} className="animate-fade-in" />
        )}
      </div>
      {list.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {list.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-5 bg-grape-400' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
