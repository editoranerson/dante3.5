import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { EmbedFrame } from '@/components/showcase/EmbedFrame';
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
export function GridTile({ sessionKey }: { sessionKey: string }) {
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
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-800/40">
      <span className="absolute left-2 top-2 z-10 rounded-md bg-ink-950/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-grape-100/70 backdrop-blur-sm">
        Publicidade
      </span>
      <EmbedFrame
        html={banner.codigo_html_mobile || banner.codigo_html_desktop}
        className="flex h-full w-full items-center justify-center [&_img]:h-full [&_img]:w-full [&_img]:object-cover"
      />
    </div>
  );
}
