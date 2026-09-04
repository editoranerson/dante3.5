import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { AdHtml } from '@/components/ads/AdHtml';
import {
  drawBanner,
  fetchActiveBanners,
  filterByTags,
  getLastShown,
  resolveUserPlan,
  setLastShown,
  useIsMobileDevice,
  type AdBanner,
} from '@/lib/ads';

/**
 * Bloco <AdBlock /> da Chatstory: sorteia um banner entre as tags associadas
 * ao ponto da história, respeitando plano do usuário e sem repetir o último.
 */
export function StoryAdBlock({ tags, sessionKey }: { tags: string[]; sessionKey: string }) {
  const { profile } = useAuth();
  const isMobile = useIsMobileDevice();
  const plan = resolveUserPlan(profile);
  const [banner, setBanner] = useState<AdBanner | null>(null);

  useEffect(() => {
    let alive = true;
    fetchActiveBanners().then((rows) => {
      if (!alive) return;
      const pool = filterByTags(rows.filter((b) => b.placement === 'html'), tags);
      const chosen = drawBanner(pool, plan, 'chatstory', getLastShown(sessionKey));
      if (chosen) setLastShown(sessionKey, chosen.id);
      setBanner(chosen);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, sessionKey, tags.join(',')]);

  if (!banner) return null;
  const html = isMobile ? banner.codigo_html_mobile : banner.codigo_html_desktop;

  return (
    <div className="my-4 w-full">
      <p className="mb-1 text-center text-[10px] uppercase tracking-widest text-grape-200/40">
        Publicidade
      </p>
      <AdHtml html={html} />
    </div>
  );
}
