import { useEffect, useRef } from 'react';
import { ADSENSE_CLIENT, AD_SLOTS, ensureAdSenseScript, pushAd, type AdSlotName } from '@/lib/adsense';

interface AdSlotProps {
  name: AdSlotName;
  /** Chave que muda a cada rota/capítulo — força um novo anúncio na navegação SPA. */
  routeKey?: string;
  className?: string;
  format?: string;
}

/**
 * Bloco de anúncio do AdSense com re-injeção a cada troca de rota (SPA).
 */
export function AdSlot({ name, routeKey = '', className = '', format = 'auto' }: AdSlotProps) {
  const slot = AD_SLOTS[name];
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!slot) return;
    ensureAdSenseScript();
    const el = ref.current;
    if (!el) return;
    // limpa o estado do bloco anterior antes de pedir um novo anúncio
    el.innerHTML = '';
    el.removeAttribute('data-adsbygoogle-status');
    el.removeAttribute('data-ad-status');
    const t = window.setTimeout(pushAd, 0);
    return () => window.clearTimeout(t);
  }, [slot, name, routeKey]);

  if (!slot) return null;

  return (
    <div className={`my-8 w-full overflow-hidden text-center ${className}`} aria-hidden="true">
      <ins
        key={`${name}-${routeKey}`}
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
