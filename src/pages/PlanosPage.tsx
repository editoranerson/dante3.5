import { useState } from 'react';
import { Check, Crown, Diamond, Plus, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/plans';
import type { PlanType } from '@/lib/supabase';
import { SubscribeModal } from '@/components/SubscribeModal';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { navigateTo } from '@/lib/router';
import { getEffectivePlan } from '@/lib/plans';

export function PlanosPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [checkoutPlan, setCheckoutPlan] = useState<PlanType | null>(null);

  const currentPlan = profile ? getEffectivePlan(profile) : 'free';

  const startCheckout = (planId: PlanType) => {
    if (planId === 'free') return;
    if (!user) {
      toast('Faça login para assinar um plano.', 'info');
      navigateTo({ name: 'login' });
      return;
    }
    setCheckoutPlan(planId);
  };

  const iconFor = (icon: string | null) => {
    if (icon === 'plus') return Plus;
    if (icon === 'crown') return Crown;
    if (icon === 'diamond') return Diamond;
    return Sparkles;
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-10 text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-glow"
          style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
        >
          ∞
        </div>
        <h1 className="font-display text-4xl font-bold text-grape-50">Planos do Dante</h1>
        <p className="mt-2 text-sm text-grape-200/70">
          Escolha o plano ideal e converse mais com o Dante todos os dias.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const Icon = iconFor(plan.badgeIcon);
          const isCurrent = plan.id === currentPlan;
          const isFree = plan.id === 'free';
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-6 transition ${
                plan.highlight
                  ? 'border-sky2-400/50 bg-sky2-400/10'
                  : 'border-white/10 bg-white/5'
              } ${isCurrent ? 'ring-2 ring-grape-400' : ''}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky2-400 to-rose-400 px-3 py-0.5 text-[10px] font-bold text-white">
                  MAIS POPULAR
                </span>
              )}

              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-white"
                style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
              >
                <Icon size={24} strokeWidth={2.5} />
              </div>

              <h3 className="font-display text-lg font-semibold text-grape-50">{plan.name}</h3>

              <p className="mt-1 text-3xl font-bold text-grape-50">
                {plan.price === 0 ? 'Grátis' : plan.priceLabel.split('/')[0]}
                {plan.price > 0 && (
                  <span className="text-sm font-normal text-grape-200/60">/mês</span>
                )}
              </p>

              <div className="mt-3 flex items-center gap-1.5 text-sm text-gold-400">
                <Sparkles size={14} />
                <span className="font-semibold">{plan.dailyLimit} créditos/dia</span>
              </div>

              <ul className="mt-4 flex-1 space-y-2 text-sm text-grape-200/70">
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  Chat com o Dante
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  {plan.dailyLimit} interações diárias
                </li>
                <li className="flex items-start gap-2">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                  Renovação diária à meia-noite
                </li>
                {plan.id !== 'free' && (
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-emerald-400" />
                    Dantes em dobro nos minijogos
                  </li>
                )}
                {plan.id !== 'free' && (
                  <li className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-gold-400" />
                    <span>
                      <span className="font-semibold text-gold-400">Embaixador:</span> dobro de Coins por visitas e indicações
                    </span>
                  </li>
                )}
              </ul>

              <button
                onClick={() => startCheckout(plan.id)}
                disabled={isCurrent || isFree}
                className={`mt-6 w-full rounded-full py-2.5 text-sm font-semibold transition ${
                  isCurrent
                    ? 'cursor-default border border-white/20 bg-white/5 text-grape-200/50'
                    : isFree
                      ? 'cursor-default border border-white/10 bg-white/5 text-grape-200/50'
                      : 'bg-gradient-to-r from-sky2-400 to-rose-400 text-white hover:brightness-110 active:scale-[0.98]'
                }`}
              >
                {isCurrent ? 'Plano atual' : isFree ? 'Plano padrão' : 'Assinar agora'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-sm text-grape-200/60">
          Os créditos do Dante são renovados todos os dias à meia-noite.
          Cada interação (mensagem + resposta) consome 1 crédito.
          Dantes acumulados nos minijogos e tarefas não são consumidos no chat.
        </p>
      </div>

      {!user && (
        <div className="mt-6 text-center">
          <button
            onClick={() => navigateTo({ name: 'login' })}
            className="text-sm text-grape-200/70 underline hover:text-grape-50"
          >
            Já tem conta? Faça login
          </button>
        </div>
      )}
      <SubscribeModal
        open={checkoutPlan !== null}
        plan={checkoutPlan}
        onClose={() => setCheckoutPlan(null)}
      />
    </div>
  );
}
