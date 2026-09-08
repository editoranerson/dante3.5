import { useLayoutEffect } from 'react';
import { Building2, DollarSign, Infinity, User } from 'lucide-react';
import { navigateTo } from '@/lib/router';

export function PaymentSuccessPage() {
  useLayoutEffect(() => {
    document.title = 'Pagamento Concluído — Querido Dante';
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center animate-fade-in">
        <div className="relative mx-auto mb-10 flex w-full max-w-xs items-center justify-between py-8">
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="qd-pay-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#a06bff" />
                <stop offset="100%" stopColor="#ff5e9d" />
              </linearGradient>
            </defs>
          </svg>

          <div className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-grape-400/40 to-rose-400/40" />

          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-ink-800/80 shadow-lg">
            <User stroke="url(#qd-pay-grad)" className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-ink-800/80 shadow-lg">
            <Building2 stroke="url(#qd-pay-grad)" className="h-7 w-7" strokeWidth={1.5} />
          </div>
          <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-ink-800/80 shadow-lg">
            <Infinity stroke="url(#qd-pay-grad)" className="h-7 w-7" strokeWidth={1.5} />
          </div>

          <div className="absolute top-1/2 z-20 -translate-y-1/2 animate-pay-flow">
            <div className="flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-mint-500 shadow-[0_0_20px_rgba(34,197,94,0.45)]">
              <DollarSign className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-grape-50">Pagamento Concluído</h1>
        <p className="mt-3 text-grape-100/80">Sua assinatura foi concluída com sucesso.</p>

        <button
          type="button"
          onClick={() => navigateTo({ name: 'home' })}
          className="btn-primary mt-8"
        >
          Voltar para o início
        </button>
      </div>
    </div>
  );
}
