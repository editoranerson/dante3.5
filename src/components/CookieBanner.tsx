import { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';
import { navigateTo } from '@/lib/router';

const STORAGE_KEY = 'uqd_cookie_consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'dismissed');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="card mx-auto flex max-w-3xl flex-col gap-3 border-white/15 p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-start gap-3 sm:flex-1">
          <Cookie size={22} className="mt-0.5 flex-shrink-0 text-rose-400" />
          <p className="text-sm text-grape-100/80">
            Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa{' '}
            <button
              onClick={() => navigateTo({ name: 'privacy' })}
              className="font-medium text-rose-300 underline hover:text-rose-200"
            >
              Política de Privacidade
            </button>
            .
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button onClick={accept} className="btn-primary py-2 text-sm">
            Aceitar
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg p-2 text-grape-200/60 hover:bg-white/10 hover:text-grape-50"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
