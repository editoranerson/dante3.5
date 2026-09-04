import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { HtmlUnit } from '@/components/promo/HtmlUnit';
import {
  drawBanner,
  fetchActiveBanners,
  getLastShown,
  resolveUserPlan,
  setLastShown,
  type AdBanner,
} from '@/lib/promos';

/**
 * Bloco in-feed: ocupa exatamente uma célula do grid (mesmo formato dos cards 3:4).
 * Sorteio ponderado + regras de plano, sem repetir o último exibido na sessão.
 */
export function FeedUnit({ sessionKey }: { sessionKey: string }) {
  const { profile } = useAuth();
  const plan = resolveUserPlan(profile);
  const [banner, setBanner] = useState<AdBanner | null>(null);

  useEffect(() => {
    let alive = true;
    fetchActiveBanners().then((rows) => {
      if (!alive) return;
      const pool = rows.filter((b) => b.placement === 'infeed');
      const chosen = drawBanner(pool, plan, 'feed', getLastShown(sessionKey.split('#')[0]));
      if (chosen) setLastShown(sessionKey.split('#')[0], chosen.id);
      setBanner(chosen);
    });
    return () => {
      alive = false;
    };
  }, [plan, sessionKey]);

  if (!banner) return null;

  return (
    <div className="flex w-full flex-col">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-grape-200/40">
        Publicidade
      </p>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-800/40">
        <HtmlUnit
          html={banner.codigo_html_mobile || banner.codigo_html_desktop}
          className="flex h-full w-full items-center justify-center [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
        />
      </div>
    </div>
  );
}
