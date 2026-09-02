import { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Download, Gift, FileText, CreditCard, Sparkles, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import type { ShopItem, RewardType } from '@/lib/supabase';
import { Modal } from '@/components/Modal';
import { GuestBanner } from '@/components/GuestBanner';
import { navigateTo } from '@/lib/router';
import { getPendingDantes } from '@/lib/pendingRewards';

export function LojaPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [result, setResult] = useState<{ type: RewardType; fileUrl?: string; message: string } | null>(null);

  useEffect(() => {
    supabase
      .from('shop_items')
      .select('*')
      .eq('is_active', true)
      .order('price_dantes', { ascending: true })
      .then(({ data }) => {
        setItems((data as ShopItem[]) ?? []);
        setLoading(false);
      });
  }, []);

  const handleRedeem = async (item: ShopItem) => {
    if (!user) {
      toast('Faça login para resgatar itens da loja.', 'info');
      navigateTo({ name: 'login' });
      return;
    }
    if ((profile?.points ?? 0) < item.price_dantes) {
      toast('Dantes insuficientes para resgatar este item.', 'error');
      return;
    }

    setRedeeming(item.id);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast('Sessão expirada. Faça login novamente.', 'error');
        return;
      }

      const { data, error } = await supabase.rpc('redeem_shop_item', {
        p_item_id: item.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; reward_type: string; file_url?: string; credits_amount?: number };

      let message = '';
      if (item.reward_type === 'giftcard') {
        message = `Resgate solicitado! O código do gift-card será enviado em até 2 dias úteis para o e-mail cadastrado: ${user.email}`;
      } else if (item.reward_type === 'file') {
        message = 'Download liberado! Clique no botão abaixo para baixar seu arquivo.';
      } else if (item.reward_type === 'card') {
        message = 'Carta adicionada à sua coleção! Acesse o Álbum para visualizá-la.';
      } else if (item.reward_type === 'credits') {
        message = `${item.credits_amount} Créditos adicionados à sua conta! Agora você pode conversar mais com o Dante.`;
      }

      setResult({
        type: item.reward_type,
        fileUrl: item.reward_type === 'file' ? item.file_url : undefined,
        message,
      });

      toast('Item resgatado com sucesso!', 'success');
      await refreshProfile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao resgatar item.';
      toast(msg, 'error');
    } finally {
      setRedeeming(null);
    }
  };

  const rewardIcon = (type: RewardType) => {
    switch (type) {
      case 'giftcard': return <Gift size={18} className="text-rose-400" />;
      case 'file': return <FileText size={18} className="text-sky-400" />;
      case 'card': return <CreditCard size={18} className="text-gold-400" />;
      case 'credits': return <Sparkles size={18} className="text-emerald-400" />;
    }
  };

  const rewardLabel: Record<RewardType, string> = {
    giftcard: 'Gift-Card',
    file: 'Arquivo',
    card: 'Carta do Álbum',
    credits: 'Créditos Dante',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {!user && <GuestBanner />}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-gold-500">
          <ShoppingBag size={28} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-grape-50 sm:text-4xl">
          Loja de Recompensas
        </h1>
        <p className="mt-3 text-grape-200/60">
          Troque seus Dantes por prêmios incríveis
        </p>
      </div>

      {/* Balance bar */}
      <div className="mb-8 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-ink-800/40 px-6 py-4">
        <Coins size={24} className="text-gold-400" />
        <span className="text-lg font-semibold text-grape-50">
          Seu saldo: {user ? (profile?.points ?? 0) : getPendingDantes()} Dantes
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-grape-200/50">Nenhum item disponível na loja no momento.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="card flex flex-col border border-white/10 bg-ink-800/40 p-5 transition hover:border-grape-400/30 hover:shadow-lg"
            >
              <div className="mb-3 flex items-center gap-2">
                {rewardIcon(item.reward_type)}
                <span className="text-xs font-medium uppercase tracking-wider text-grape-200/50">
                  {rewardLabel[item.reward_type]}
                </span>
              </div>
              <h3 className="mb-1 font-display text-lg font-semibold text-grape-50">{item.name}</h3>
              <p className="mb-4 flex-1 text-sm text-grape-200/60">{item.description}</p>

              {item.stock === 0 ? (
                <div className="rounded-xl bg-red-500/10 px-4 py-2 text-center text-sm font-medium text-red-400">
                  Esgotado
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2 text-sm text-grape-200/50">
                    {item.stock > 0 && <span>Estoque: {item.stock}</span>}
                    {item.stock > 0 && item.reward_type !== 'credits' && <span>·</span>}
                    {item.reward_type === 'credits' && (
                      <span>{item.credits_amount} Créditos {item.credits_validity_days > 0 ? `(${item.credits_validity_days} dias)` : ''}</span>
                    )}
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <Coins size={18} className="text-gold-400" />
                    <span className="font-semibold text-gold-300">{item.price_dantes} Dantes</span>
                  </div>
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={redeeming === item.id || (user ? (profile?.points ?? 0) < item.price_dantes : getPendingDantes() < item.price_dantes)}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {redeeming === item.id ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>Resgatar</>
                    )}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Result Modal */}
      <Modal
        open={!!result}
        onClose={() => setResult(null)}
        title="Resgate Concluído!"
        maxWidth="max-w-md"
      >
        {result && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Check size={32} className="text-emerald-400" />
            </div>
            <p className="mb-6 text-sm leading-relaxed text-grape-200/70">{result.message}</p>
            {result.type === 'file' && result.fileUrl && (
              <a
                href={result.fileUrl}
                download
                className="btn-primary inline-flex w-full items-center justify-center gap-2"
              >
                <Download size={18} /> Baixar Arquivo
              </a>
            )}
            <button
              onClick={() => setResult(null)}
              className="mt-3 w-full text-sm text-grape-200/50 hover:text-grape-200"
            >
              Fechar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
