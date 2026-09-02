import { useEffect, useState } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'personagens' }
  | { name: 'segredos' }
  | { name: 'playlist' }
  | { name: 'album' }
  | { name: 'tarefas' }
  | { name: 'login' }
  | { name: 'signup' }
  | { name: 'admin' }
  | { name: 'profile' }
  | { name: 'terms' }
  | { name: 'privacy' }
  | { name: 'biblioteca'; cat?: string }
  | { name: 'biblioteca_cap'; cat: string; slug: string }
  | { name: 'sobre' }
  | { name: 'contato' }
  | { name: 'faq' }
  | { name: 'loja' }
  | { name: 'minijogos' }
  | { name: 'planos' }
  | { name: 'chatstorys' }
  | { name: 'chatstory'; slug: string }
  | { name: 'chatstory_cap'; slug: string; cap: string }
  | { name: 'diag' }
  | { name: 'afiliados' }
  | { name: 'afiliados_diretrizes' };

function parsePath(path: string): Route {
  if (path === '/' || !path) return { name: 'home' };
  if (path === '/personagens') return { name: 'personagens' };
  if (path === '/segredos') return { name: 'segredos' };
  if (path === '/playlist') return { name: 'playlist' };
  if (path === '/album') return { name: 'album' };
  if (path === '/tarefas') return { name: 'tarefas' };
  if (path === '/login') return { name: 'login' };
  if (path === '/cadastro') return { name: 'signup' };
  if (path === '/admin') return { name: 'admin' };
  if (path === '/perfil') return { name: 'profile' };
  if (path === '/termos') return { name: 'terms' };
  if (path === '/privacidade') return { name: 'privacy' };
  if (path === '/biblioteca' || path === '/capitulos-arquivados') return { name: 'biblioteca' };
  if (path === '/sobre') return { name: 'sobre' };
  if (path === '/contato') return { name: 'contato' };
  if (path === '/faq') return { name: 'faq' };
  if (path === '/loja') return { name: 'loja' };
  if (path === '/minijogos') return { name: 'minijogos' };
  if (path === '/planos') return { name: 'planos' };
  if (path === '/chatstorys' || path === '/chatstory') return { name: 'chatstorys' };
  if (path === '/diag') return { name: 'diag' };
  if (path === '/afiliados') return { name: 'afiliados' };
  if (path === '/afiliados/diretrizes') return { name: 'afiliados_diretrizes' };

  const csCap = path.match(/^\/chatstorys\/([^/]+)\/(.+)$/);
  if (csCap) return { name: 'chatstory_cap', slug: csCap[1], cap: csCap[2] };
  const csStory = path.match(/^\/chatstorys\/([^/]+)$/);
  if (csStory) return { name: 'chatstory', slug: csStory[1] };

  const capMatch = path.match(/^\/biblioteca\/([^/]+)\/(.+)$/);
  if (capMatch) return { name: 'biblioteca_cap', cat: capMatch[1], slug: capMatch[2] };
  const catMatch = path.match(/^\/biblioteca\/([^/]+)$/);
  if (catMatch) return { name: 'biblioteca', cat: catMatch[1] };

  return { name: 'home' };
}

function parseLocation(): Route {
  // Compatibilidade: se ainda houver um hash antigo (#/rota), converte para path real.
  const hash = window.location.hash.replace(/^#/, '');
  if (hash.startsWith('/')) {
    window.history.replaceState({}, '', hash);
    return parsePath(hash);
  }
  return parsePath(window.location.pathname || '/');
}

export function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'personagens':
      return '/personagens';
    case 'segredos':
      return '/segredos';
    case 'playlist':
      return '/playlist';
    case 'album':
      return '/album';
    case 'tarefas':
      return '/tarefas';
    case 'login':
      return '/login';
    case 'signup':
      return '/cadastro';
    case 'admin':
      return '/admin';
    case 'profile':
      return '/perfil';
    case 'terms':
      return '/termos';
    case 'privacy':
      return '/privacidade';
    case 'biblioteca':
      return route.cat ? `/biblioteca/${route.cat}` : '/biblioteca';
    case 'biblioteca_cap':
      return `/biblioteca/${route.cat}/${route.slug}`;
    case 'sobre':
      return '/sobre';
    case 'contato':
      return '/contato';
    case 'faq':
      return '/faq';
    case 'loja':
      return '/loja';
    case 'minijogos':
      return '/minijogos';
    case 'planos':
      return '/planos';
    case 'chatstorys':
      return '/chatstorys';
    case 'chatstory':
      return `/chatstorys/${route.slug}`;
    case 'chatstory_cap':
      return `/chatstorys/${route.slug}/${route.cap}`;
    case 'diag':
      return '/diag';
    case 'afiliados':
      return '/afiliados';
    case 'afiliados_diretrizes':
      return '/afiliados/diretrizes';
  }
}

const ROUTE_EVENT = 'app:navigate';

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseLocation());

  useEffect(() => {
    const onChange = () => {
      setRoute(parseLocation());
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('popstate', onChange);
    window.addEventListener(ROUTE_EVENT, onChange);
    window.addEventListener('hashchange', onChange);
    return () => {
      window.removeEventListener('popstate', onChange);
      window.removeEventListener(ROUTE_EVENT, onChange);
      window.removeEventListener('hashchange', onChange);
    };
  }, []);

  const navigate = (r: Route) => navigateTo(r);

  return { route, navigate };
}

export function navigateTo(r: Route) {
  const path = routeToPath(r);
  if (window.location.pathname !== path || window.location.hash) {
    window.history.pushState({}, '', path);
  }
  window.dispatchEvent(new Event(ROUTE_EVENT));
}

let returnRoute: Route | null = null;

export function setReturnTo(r: Route) {
  returnRoute = r;
}

export function consumeReturnTo(): Route | null {
  const r = returnRoute;
  returnRoute = null;
  return r;
}
