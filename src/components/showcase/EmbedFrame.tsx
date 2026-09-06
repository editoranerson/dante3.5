import { useEffect, useRef } from 'react';
import { localMediaUrl } from '@/lib/showcase';

interface Props {
  html: string;
  className?: string;
}

/**
 * Renderiza um bloco de HTML de anúncio (imagem, iframe ou script de rede).
 * Recria as tags <script> para que elas realmente executem.
 */
export function EmbedFrame({ html, className = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const template = document.createElement('template');
    template.innerHTML = html || '';
    template.content.querySelectorAll('img').forEach((image) => {
      const source = image.getAttribute('src');
      if (source) image.setAttribute('src', localMediaUrl(source));
      image.removeAttribute('srcset');
    });
    el.replaceChildren(template.content.cloneNode(true));
    const scripts = Array.from(el.querySelectorAll('script'));
    scripts.forEach((old) => {
      const s = document.createElement('script');
      Array.from(old.attributes).forEach((a) => s.setAttribute(a.name, a.value));
      s.text = old.text;
      old.replaceWith(s);
    });
    return () => {
      el.innerHTML = '';
    };
  }, [html]);

  return (
    <div
      ref={ref}
      className={`qd-media mx-auto w-full max-w-full overflow-hidden text-center [&_img]:mx-auto [&_img]:h-auto [&_img]:max-w-full [&_iframe]:max-w-full ${className}`}
    />
  );
}
