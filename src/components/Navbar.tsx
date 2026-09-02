import { useState } from 'react';
import { Menu, X, Sparkles, LogOut, CircleUser as UserCircle, UserCog, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { navigateTo, type Route } from '@/lib/router';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { getEffectivePlan } from '@/lib/plans';
import { useTheme } from '@/lib/useTheme';

const NAV_ITEMS: { label: string; route: Route }[] = [
  { label: 'Home', route: { name: 'home' } },
  { label: 'Personagens', route: { name: 'personagens' } },
  { label: 'Segredos', route: { name: 'segredos' } },
  { label: 'Biblioteca', route: { name: 'biblioteca' } },
  { label: 'Chatstory', route: { name: 'chatstorys' } },
  { label: 'Playlist', route: { name: 'playlist' } },
  { label: 'Álbum de Cartas', route: { name: 'album' } },
  { label: 'Tarefas', route: { name: 'tarefas' } },
  { label: 'Minijogos', route: { name: 'minijogos' } },
  { label: 'Loja', route: { name: 'loja' } },
  { label: 'Planos', route: { name: 'planos' } },
  { label: 'Embaixadores', route: { name: 'afiliados' } },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  const go = (r: Route) => {
    navigateTo(r);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <button onClick={() => go({ name: 'home' })} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500 to-rose-500 shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="font-display text-lg font-semibold text-grape-50">
            Universo <span className="text-rose-400">Dante</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => go(item.route)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-grape-100/80 transition hover:bg-white/10 hover:text-grape-50"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={toggle}
            className="rounded-full p-2 text-grape-200/70 transition hover:bg-white/10 hover:text-grape-50"
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm">
                <UserCircle size={16} className="text-grape-300" />
                <span className="font-medium text-grape-50">
                  {profile?.full_name || 'Conta'}
                </span>
                {profile && (() => { const p = getEffectivePlan(profile); return p !== 'free' ? <SubscriptionBadge plan={p} /> : null; })()}
                <span className="text-rose-300">· {profile?.points ?? 0} Dantes</span>
              </div>
              <button
                onClick={() => go({ name: 'profile' })}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-grape-100 hover:bg-white/10 hover:text-grape-50"
                aria-label="Meu Perfil"
              >
                <UserCog size={16} /> Perfil
              </button>
              <button
                onClick={signOut}
                className="rounded-full p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                aria-label="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => go({ name: 'login' })}
                className="rounded-full px-4 py-2 text-sm font-semibold text-grape-100 hover:text-grape-50"
              >
                Entrar
              </button>
              <button
                onClick={() => go({ name: 'signup' })}
                className="btn-primary py-2"
              >
                Criar Conta
              </button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-grape-50 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-ink-900/95 px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => go(item.route)}
                className="rounded-lg px-4 py-2.5 text-left text-sm font-medium text-grape-100/90 hover:bg-white/10"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => go({ name: 'profile' })}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-grape-100 hover:bg-white/10"
            >
              <UserCog size={16} /> Meu Perfil
            </button>
            <button
              onClick={toggle}
              className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-grape-100 hover:bg-white/10"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </button>
            <div className="mt-2 border-t border-white/10 pt-3">
              {user ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle size={16} className="text-grape-300" />
                    <span className="font-medium text-grape-50">{profile?.full_name}</span>
                    {profile && (() => { const p = getEffectivePlan(profile); return p !== 'free' ? <SubscriptionBadge plan={p} /> : null; })()}
                    <span className="text-rose-300">· {profile?.points ?? 0} Dantes</span>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setOpen(false);
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-sm text-grape-200 hover:bg-white/10"
                  >
                    <LogOut size={14} /> Sair
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                <button
                  onClick={() => go({ name: 'login' })}
                  className="btn-ghost flex-1"
                >
                  Entrar
                </button>
                <button
                  onClick={() => go({ name: 'signup' })}
                  className="btn-primary flex-1"
                >
                  Criar Conta
                </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
