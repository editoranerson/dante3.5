import { useCallback, useEffect, useState } from 'react';
import { Lock, Sparkles, Ticket, Coins } from 'lucide-react';
import {
  supabase,
  CARD_TYPE_BORDER,
  CARD_TYPE_LABELS,
  type Card,
  type UserCard,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { GuestBanner } from '@/components/GuestBanner';
import { addPendingCard, getPendingCards, getPendingDantes } from '@/lib/pendingRewards';

export function AlbumPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [cards, setCards] = useState<Card[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [detail, setDetail] = useState<Card | null>(null);

  const load = useCallback(async () => {
    const [{ data: cardData }, { data: ownedData }] = await Promise.all([
      supabase.from('cards').select('*').order('number', { ascending: true }),
      user
        ? supabase.from('user_cards').select('card_id').eq('user_id', user.id)
        : Promise.resolve({ data: null as UserCard[] | null, error: null }),
    ]);
    setCards((cardData as Card[]) ?? []);
    setOwned(new Set(((ownedData as UserCard[]) ?? []).map((u) => u.card_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const total = cards.length;
  const unlocked = cards.filter((c) => owned.has(c.id)).length;
  const pct = total ? Math.round((unlocked / total) * 100) : 0;
  const displayPoints = user ? (profile?.points ?? 0) : getPendingDantes();

  const redeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (!user) {
      addPendingCard(code);
      toast('Carta salva! Faça login para confirmar no seu álbum.', 'info');
      setCode('');
      return;
    }

    setRedeeming(true);
    const { data, error } = await supabase.rpc('redeem_card_code', { p_code: code });
    setRedeeming(false);
    if (error) {
      toast(error.message || 'Erro ao resgatar código.', 'error');
      return;
    }
    const res = data as { ok: boolean; error?: string; card_name?: string; points?: number };
    if (!res.ok) {
      toast(res.error || 'Código inválido.', 'error');
      return;
    }
    toast(`Carta "${res.card_name}" desbloqueada! +${res.points} Dantes`, 'success');
    setCode('');
    await load();
    await refreshProfile();
  };

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {!user && <GuestBanner />}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Sparkles size={14} className="text-rose-400" /> Coleção
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Álbum de Cartas
        </h1>
      </div>

      {/* Progress + points + redeem */}
      <div className="card mb-8 space-y-5 p-6">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-grape-50">Progresso da coleção</span>
            <span className="text-grape-200/70">
              {unlocked}/{total} cartas · {pct}%
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full rounded-full bg-progress-grad transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3">
            <Coins size={22} className="text-gold-400" />
            <div>
              <p className="text-xs uppercase tracking-wider text-gold-400/70">Saldo de Dantes</p>
              <p className="font-display text-xl font-semibold text-gold-400">{displayPoints}</p>
            </div>
          </div>

          <form onSubmit={redeem} className="flex flex-1 gap-2 sm:max-w-md">
            <div className="relative flex-1">
              <Ticket size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input pl-10"
                placeholder="Digite o código da carta"
              />
            </div>
            <button type="submit" disabled={redeeming} className="btn-primary">
              {redeeming ? '...' : 'Resgatar'}
            </button>
          </form>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : cards.length === 0 ? (
        <div className="card p-10 text-center text-grape-200/60">
          Nenhuma carta cadastrada ainda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {cards.map((card) => {
            const isOwned = owned.has(card.id);
            return (
              <div
                key={card.id}
                className={`group relative overflow-hidden rounded-2xl p-[3px] transition ${
                  CARD_TYPE_BORDER[card.type]
                } ${isOwned ? '' : 'opacity-60 grayscale'}`}
              >
                <button
                  onClick={() => setDetail(card)}
                  className="relative block h-full w-full overflow-hidden rounded-[14px] bg-ink-800"
                >
                  {card.photo_url ? (
                    <img
                      src={card.photo_url}
                      alt={card.name}
                      className="aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[3/4] w-full items-center justify-center bg-gradient-to-br from-grape-600/30 to-rose-600/30">
                      <Sparkles size={28} className="text-grape-200/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
                  {!isOwned && (
                    <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40">
                      <Lock size={28} className="text-white/80" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2">
                    <span className="chip bg-ink-950/70 text-[10px] text-grape-100">
                      #{card.number}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                    <p className="truncate font-display text-sm font-semibold text-white drop-shadow">
                      {card.name}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-grape-200/70">
                      {CARD_TYPE_LABELS[card.type]} · {card.points} Dantes
                    </p>
                  </div>
                </button>
                {!isOwned && card.locked_hint && (
                  <div className="absolute inset-x-0 bottom-0 translate-y-full rounded-b-[14px] bg-ink-950/95 p-2 text-center text-[11px] text-grape-200/70 transition group-hover:translate-y-0">
                    {card.locked_hint}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} maxWidth="max-w-md">
        {detail && (
          <div>
            {detail.photo_url && (
              <img
                src={detail.photo_url}
                alt={detail.name}
                className="mb-4 aspect-[3/4] w-full rounded-xl object-cover"
              />
            )}
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-grape-50">{detail.name}</h2>
              <span className="chip bg-white/10 text-grape-100">#{detail.number}</span>
            </div>
            <p className="mt-1 text-sm text-rose-300">
              {CARD_TYPE_LABELS[detail.type]} · {detail.points} Dantes
            </p>
            {detail.description && (
              <p className="mt-3 text-sm text-grape-100/80">{detail.description}</p>
            )}
            {!owned.has(detail.id) && detail.locked_hint && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-grape-200/70">
                <span className="font-semibold text-grape-100">Dica: </span>
                {detail.locked_hint}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
