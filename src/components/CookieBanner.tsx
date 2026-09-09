import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { navigateTo } from '@/lib/router';
import { applyConsent, getConsent, setConsent } from '@/lib/consent';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getConsent();
    if (consent) {
      applyConsent(consent);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const choose = (value: 'accepted' | 'rejected') => {
    setConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="animate-slide-up fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="card mx-auto flex max-w-3xl flex-col gap-3 border-white/15 p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <div className="flex items-start gap-3 sm:flex-1">
          <Cookie size={22} className="mt-0.5 flex-shrink-0 text-rose-400" />
          <p className="text-sm text-grape-100/80">
            Usamos cookies para melhorar sua experiência. Você pode recusar e continuar navegando
            normalmente. Saiba mais na nossa{' '}
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
          <button onClick={() => choose('accepted')} className="btn-primary py-2 text-sm">
            Aceitar
          </button>
          <button onClick={() => choose('rejected')} className="btn-ghost py-2 text-sm">
            Recusar
          </button>
        </div>
      </div>
    </div>
  );
}
