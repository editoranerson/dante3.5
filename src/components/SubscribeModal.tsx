import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Loader2, Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { supabase, SUPABASE_URL, type PlanType } from '@/lib/supabase';
import { getPlanInfo } from '@/lib/plans';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import {
  createCardToken,
  formatCardNumber,
  formatCpf,
  formatExpiry,
  getMercadoPago,
  onlyDigits,
} from '@/lib/mercadopago';

interface SubscribeModalProps {
  open: boolean;
  plan: PlanType | null;
  onClose: () => void;
}

export function SubscribeModal({ open, plan, onClose }: SubscribeModalProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [cardNumber, setCardNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planInfo = useMemo(() => (plan ? getPlanInfo(plan) : null), [plan]);

  useEffect(() => {
    if (!open) return;
    setDone(false);
    setError(null);
    setSubmitting(false);
    setEmail(user?.email ?? '');
    // Pré-carrega o SDK para a tokenização ser instantânea.
    getMercadoPago().catch(() => setError('Não foi possível carregar o pagamento seguro.'));
  }, [open, user?.email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan || !planInfo || submitting) return;

    const [expMonth, expYear] = expiry.split('/');
    const digitsCard = onlyDigits(cardNumber);
    const digitsCpf = onlyDigits(cpf);

    if (digitsCard.length < 13) return setError('Número do cartão inválido.');
    if (!holder.trim()) return setError('Informe o nome impresso no cartão.');
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length < 2) {
      return setError('Validade inválida. Use MM/AA.');
    }
    if (cvv.length < 3) return setError('CVV inválido.');
    if (digitsCpf.length !== 11) return setError('CPF inválido.');
    if (!email.trim()) return setError('Informe um e-mail.');

    setError(null);
    setSubmitting(true);
    try {
      const cardTokenId = await createCardToken({
        cardNumber: digitsCard,
        cardholderName: holder.trim(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: digitsCpf,
      });

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/mercadopago-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          plan,
          card_token_id: cardTokenId,
          payer_email: email.trim(),
          success_url: window.location.origin,
        }),
      });

      const raw = await res.text();
      let data: { status?: string; activated?: boolean; error?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        setError(data.error || `Não foi possível concluir o pagamento (${res.status}).`);
        return;
      }

      await refreshProfile();
      setDone(true);
      setCardNumber('');
      setHolder('');
      setExpiry('');
      setCvv('');
      toast(
        data.activated
          ? 'Assinatura ativada! Aproveite seu novo plano.'
          : 'Assinatura registrada. Vamos liberar seu plano em instantes.',
        'success',
      );
    } catch {
      setError('Não foi possível validar o cartão. Confira os dados e tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-grape-50 placeholder:text-grape-200/40 outline-none focus:border-sky2-400/60';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={planInfo ? `Assinar ${planInfo.name}` : 'Assinar'}
      maxWidth="max-w-md"
    >
      {done ? (
        <div className="py-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400" />
          <h4 className="mt-4 font-display text-xl font-semibold text-grape-50">
            Pagamento concluído
          </h4>
          <p className="mt-2 text-sm text-grape-200/70">
            Sua assinatura mensal do {planInfo?.name} está ativa. A renovação é automática e você
            pode cancelar quando quiser.
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-gradient-to-r from-sky2-400 to-rose-400 py-2.5 text-sm font-semibold text-white hover:brightness-110"
          >
            Voltar para o site
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-sm text-grape-200/70">Cobrança mensal</span>
            <span className="font-display text-lg font-bold text-grape-50">
              {planInfo?.priceLabel}
            </span>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-grape-200/70">
              Número do cartão
            </label>
            <div className="relative">
              <CreditCard
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-grape-200/50"
              />
              <input
                className={`${inputClass} pl-9`}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-grape-200/70">
              Nome impresso no cartão
            </label>
            <input
              className={inputClass}
              autoComplete="cc-name"
              placeholder="Como está no cartão"
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-grape-200/70">Validade</label>
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/AA"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-grape-200/70">CVV</label>
              <input
                className={inputClass}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                value={cvv}
                onChange={(e) => setCvv(onlyDigits(e.target.value).slice(0, 4))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-grape-200/70">CPF</label>
              <input
                className={inputClass}
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-grape-200/70">E-mail</label>
              <input
                className={inputClass}
                type="email"
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky2-400 to-rose-400 py-3 text-sm font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Processando...
              </>
            ) : (
              <>
                <Lock size={16} /> Pagar {planInfo?.priceLabel}
              </>
            )}
          </button>

          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-grape-200/50">
            <ShieldCheck size={13} /> Pagamento seguro processado pelo Mercado Pago. Os dados do
            cartão não passam pelos nossos servidores.
          </p>
        </form>
      )}
    </Modal>
  );
}
