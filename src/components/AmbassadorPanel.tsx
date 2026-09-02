import { useCallback, useEffect, useState } from 'react';
import { Coins, Copy, Check, Link2, TrendingUp, Gift, Bell, FileText, Users, CircleAlert as AlertCircle, Info, ShieldAlert, ShoppingBag, Crown, Sparkles, Star, Award, Loader as Loader2 } from 'lucide-react';
import {
  supabase,
  type AffiliateAccount,
  type AffiliateEarning,
  type AffiliateNotification,
  type AffiliateRedemption,
  type AffiliateShopItem,
  type AffiliateVisit,
  type AffiliateSettings,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { navigateTo } from '@/lib/router';
import { getReferralLink, getAffiliateSettings } from '@/lib/affiliate';

type SubTab = 'overview' | 'shop' | 'history' | 'notifications' | 'guidelines';

export function AmbassadorPanel() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<AffiliateAccount | null>(null);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [earnings, setEarnings] = useState<AffiliateEarning[]>([]);
  const [visits, setVisits] = useState<AffiliateVisit[]>([]);
  const [notifications, setNotifications] = useState<AffiliateNotification[]>([]);
  const [redemptions, setRedemptions] = useState<AffiliateRedemption[]>([]);
  const [shopItems, setShopItems] = useState<AffiliateShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [becoming, setBecoming] = useState(false);
  const [subTab, setSubTab] = useState<SubTab>('overview');
  const [copied, setCopied] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<AffiliateShopItem | null>(null);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');

  const loadAmbassadorData = useCallback(async () => {
    if (!user) return;
    const settingsData = await getAffiliateSettings();
    setSettings(settingsData);
    const { data: earnData } = await supabase
      .from('affiliate_earnings')
      .select('*')
      .eq('ambassador_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    const { data: visitData } = await supabase
      .from('affiliate_visits')
      .select('*')
      .eq('ambassador_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    const { data: notifData } = await supabase
      .from('affiliate_notifications')
      .select('*')
      .eq('ambassador_id', user.id)
      .order('created_at', { ascending: false });
    const { data: redeemData } = await supabase
      .from('affiliate_redemptions')
      .select('*')
      .eq('ambassador_id', user.id)
      .order('created_at', { ascending: false });
    const { data: shopData } = await supabase
      .from('affiliate_shop_items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    setEarnings((earnData as AffiliateEarning[]) ?? []);
    setVisits((visitData as AffiliateVisit[]) ?? []);
    setNotifications((notifData as AffiliateNotification[]) ?? []);
    setRedemptions((redeemData as AffiliateRedemption[]) ?? []);
    setShopItems((shopData as AffiliateShopItem[]) ?? []);
  }, [user]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: acctData } = await supabase.rpc('check_affiliate_account');
    setAccount(acctData as AffiliateAccount | null);
    if (acctData) {
      await loadAmbassadorData();
    }
    setLoading(false);
  }, [user, loadAmbassadorData]);

  useEffect(() => {
    load();
  }, [load]);

  const becomeAmbassador = async () => {
    if (!user) return;
    setBecoming(true);
    const { data, error } = await supabase.rpc('become_ambassador');
    setBecoming(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setAccount(data as AffiliateAccount);
    toast('Voce agora e um Embaixador Dante!', 'success');
    await loadAmbassadorData();
  };

  const referralLink = account ? getReferralLink(account.referral_code) : '';
  const retainedVisits = visits.filter((v) => v.retained).length;
  const totalEarned = earnings.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('affiliate_notifications').update({ is_read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleRedeem = async (item: AffiliateShopItem) => {
    if (item.redemption_type === 'pix_withdrawal') {
      setPixModal(item);
      return;
    }
    setRedeeming(item.id);
    const { data, error } = await supabase.rpc('affiliate_redeem', { p_item_id: item.id });
    setRedeeming(null);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) {
      toast(res.error || 'Erro ao resgatar.', 'error');
      return;
    }
    toast(`${item.name} resgatado com sucesso!`, 'success');
    await load();
    await refreshProfile();
  };

  const confirmPixRedeem = async () => {
    if (!pixModal || !pixKey.trim()) return;
    setRedeeming(pixModal.id);
    const { data, error } = await supabase.rpc('affiliate_redeem', {
      p_item_id: pixModal.id,
      p_pix_key: pixKey,
      p_pix_key_type: pixKeyType,
    });
    setRedeeming(null);
    setPixModal(null);
    setPixKey('');
    if (error) {
      toast(error.message, 'error');
      return;
    }
    const res = data as { ok: boolean; error?: string };
    if (!res.ok) {
      toast(res.error || 'Erro ao solicitar saque.', 'error');
      return;
    }
    toast('Solicitacao de saque enviada!', 'success');
    await load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  // Welcome screen: user has not become an ambassador yet
  if (!account) {
    return (
      <div className="animate-fade-in">
        <div className="card overflow-hidden border border-grape-400/20 bg-gradient-to-br from-grape-500/10 via-ink-800/60 to-rose-500/5 p-8 sm:p-12">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-gold-400 to-gold-600 shadow-glow">
              <Crown size={40} className="text-ink-900" />
            </div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-400/20 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400">
              <Sparkles size={14} /> Programa Exclusivo
            </div>
            <h2 className="mb-4 font-display text-3xl font-bold text-grape-50 sm:text-4xl">
              Seja um Embaixador Dante
            </h2>
            <p className="mb-8 text-grape-200/70">
              Divulgue o Universo Dante, ganhe Coins por cada visita e indicacao,
              e troque por premios reais. E tudo automatico!
            </p>

            <div className="mb-8 grid gap-4 text-left sm:grid-cols-2">
              <WelcomeBenefit icon={Link2} title="Link Exclusivo" desc="Receba seu link de indicacao unico automaticamente" />
              <WelcomeBenefit icon={Coins} title="Ganhe Coins" desc={`A cada ${settings?.visit_batch_size ?? 10} visitas, ganhe ${settings?.visit_batch_coins ?? 5} Coins`} />
              <WelcomeBenefit icon={Users} title="Indique e Ganhe" desc={`+${settings?.signup_coins ?? 20} Coins por cada cadastro de indicado`} />
              <WelcomeBenefit icon={Gift} title="Troque por Premios" desc="Resgate pacotes de Dantes ou solicite saques via Pix" />
            </div>

            <button
              onClick={becomeAmbassador}
              disabled={becoming}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4 text-lg font-bold text-ink-900 shadow-glow transition hover:brightness-110 disabled:opacity-50"
            >
              {becoming ? <Loader2 size={22} className="animate-spin" /> : <Crown size={22} />}
              {becoming ? 'Ativando...' : 'Tornar-se um Embaixador Dante'}
            </button>
            <p className="mt-4 text-xs text-grape-200/40">
              Acesso liberado imediatamente. Sem burocracia.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (account.is_blocked) {
    return (
      <div className="card border border-rose-500/20 bg-rose-500/5 p-6">
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} className="text-rose-400" />
          <div>
            <h3 className="font-display text-lg font-semibold text-rose-300">Conta Bloqueada</h3>
            <p className="mt-1 text-sm text-grape-200/60">
              {account.block_reason || 'Sua conta de embaixador foi bloqueada pelo administrador.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const subTabs: { id: SubTab; label: string; icon: typeof Coins; badge?: number }[] = [
    { id: 'overview', label: 'Visao Geral', icon: TrendingUp },
    { id: 'shop', label: 'Lojinha', icon: ShoppingBag },
    { id: 'history', label: 'Historico', icon: Coins },
    { id: 'notifications', label: 'Avisos', icon: Bell, badge: unreadCount },
    { id: 'guidelines', label: 'Diretrizes', icon: FileText },
  ];

  return (
    <div className="space-y-4">
      <div className="card border border-grape-400/20 bg-ink-800/60 p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-grape-300">
          <Link2 size={16} /> Seu Link de Indicacao
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded-xl border border-white/10 bg-ink-900/60 px-4 py-2.5 text-sm text-grape-100">
            {referralLink}
          </code>
          <button onClick={copyLink} className="btn-primary flex-shrink-0 text-sm">
            {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                subTab === t.id
                  ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                  : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
              }`}
            >
              <Icon size={15} />
              {t.label}
              {t.badge ? (
                <span className="rounded-full bg-rose-500 px-1.5 text-xs text-white">{t.badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {subTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Coins} label="Saldo de Coins" value={String(account.coins)} color="text-gold-400" />
            <StatCard icon={TrendingUp} label="Visitas Retidas" value={String(retainedVisits)} color="text-rose-400" />
            <StatCard icon={Users} label="Total Ganho" value={String(totalEarned)} color="text-sky-400" />
          </div>
          <div className="card p-5">
            <h3 className="mb-4 font-display text-lg font-semibold text-grape-50">Proximo Lote de Visitas</h3>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-grape-200/60">
                {retainedVisits % (settings?.visit_batch_size ?? 10)} / {settings?.visit_batch_size ?? 10} visitas retidas
              </span>
              <span className="font-semibold text-rose-400">+{settings?.visit_batch_coins ?? 5} Coins</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-grape-500 to-rose-500 transition-all duration-700"
                style={{
                  width: `${((retainedVisits % (settings?.visit_batch_size ?? 10)) / (settings?.visit_batch_size ?? 10)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {subTab === 'shop' && (
        <div className="space-y-4">
          <div className="card flex items-center gap-3 p-4">
            <Coins size={22} className="text-gold-400" />
            <span className="font-semibold text-grape-50">Seu saldo: {account.coins} Coins</span>
          </div>
          {shopItems.length === 0 ? (
            <p className="py-8 text-center text-grape-200/50">Nenhum item disponivel na lojinha.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {shopItems.map((item) => (
                <div key={item.id} className="card border border-white/10 bg-ink-800/40 p-5">
                  <h4 className="font-display font-semibold text-grape-50">{item.name}</h4>
                  <p className="mt-1 text-sm text-grape-200/60">{item.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="flex items-center gap-1 font-semibold text-gold-400">
                      <Coins size={16} /> {item.coins_cost} Coins
                    </span>
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={redeeming === item.id || account.coins < item.coins_cost}
                      className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {redeeming === item.id ? '...' : 'Resgatar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {redemptions.length > 0 && (
            <div className="card p-5">
              <h4 className="mb-3 font-display font-semibold text-grape-50">Meus Resgates</h4>
              <div className="space-y-2">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div>
                      <span className="font-medium text-grape-50">{r.item_name}</span>
                      <span className="ml-2 text-gold-400">{r.coins_cost} Coins</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.status === 'pago' ? 'bg-mint-500/15 text-mint-400' :
                      r.status === 'recusado' ? 'bg-rose-500/15 text-rose-300' :
                      'bg-gold-400/15 text-gold-400'
                    }`}>
                      {r.status === 'pago' ? 'Pago' : r.status === 'recusado' ? 'Recusado' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'history' && (
        <div className="card p-5">
          <h3 className="mb-4 font-display text-lg font-semibold text-grape-50">Historico de Ganhos</h3>
          {earnings.length === 0 ? (
            <p className="py-8 text-center text-grape-200/50">Nenhum ganho registrado ainda.</p>
          ) : (
            <div className="space-y-2">
              {earnings.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <div>
                    <span className="font-medium text-grape-50">{e.source_description}</span>
                    <span className="ml-2 text-xs text-grape-200/50">
                      {new Date(e.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <span className={`font-semibold ${e.amount > 0 ? 'text-mint-400' : 'text-rose-300'}`}>
                    {e.amount > 0 ? '+' : ''}{e.amount} Coins
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="card p-8 text-center text-grape-200/50">Nenhuma notificacao.</div>
          ) : (
            notifications.map((n) => {
              const Icon = n.type === 'infraction' ? ShieldAlert : n.type === 'warning' ? AlertCircle : Info;
              const color = n.type === 'infraction' ? 'text-rose-400' : n.type === 'warning' ? 'text-gold-400' : 'text-sky-400';
              return (
                <div key={n.id} className={`card p-4 ${!n.is_read ? 'border-grape-400/30' : 'border-white/10'} bg-ink-800/40`}>
                  <div className="flex items-start gap-3">
                    <Icon size={20} className={`mt-0.5 flex-shrink-0 ${color}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-grape-50">{n.title}</h4>
                        {!n.is_read && (
                          <button onClick={() => markAsRead(n.id)} className="text-xs text-grape-300 hover:text-grape-400">
                            Marcar como lida
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-grape-200/60">{n.message}</p>
                      <p className="mt-2 text-xs text-grape-200/40">{new Date(n.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {subTab === 'guidelines' && (
        <div className="card p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-grape-50">Diretrizes e Termos</h3>
          {settings?.guidelines ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-grape-100/80">{settings.guidelines}</div>
          ) : (
            <p className="text-grape-200/50">Diretrizes nao disponiveis.</p>
          )}
          <button onClick={() => navigateTo({ name: 'afiliados_diretrizes' })} className="btn-ghost mt-4 text-sm">
            Ver pagina completa
          </button>
        </div>
      )}

      {pixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPixModal(null)}>
          <div className="card w-full max-w-md space-y-4 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-grape-50">{pixModal.name}</h3>
            <div>
              <label className="label">Tipo de Chave Pix</label>
              <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} className="input">
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatoria</option>
              </select>
            </div>
            <div>
              <label className="label">Chave Pix</label>
              <input value={pixKey} onChange={(e) => setPixKey(e.target.value)} className="input" placeholder="Digite sua chave Pix" />
            </div>
            <div className="flex gap-2">
              <button onClick={confirmPixRedeem} disabled={redeeming === pixModal.id || !pixKey.trim()} className="btn-primary flex-1 disabled:opacity-50">
                {redeeming === pixModal.id ? 'Enviando...' : 'Confirmar Saque'}
              </button>
              <button onClick={() => setPixModal(null)} className="btn-ghost">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelcomeBenefit({ icon: Icon, title, desc }: { icon: typeof Coins; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-grape-500/10">
        <Icon size={20} className="text-grape-400" />
      </div>
      <div>
        <h4 className="font-semibold text-grape-50">{title}</h4>
        <p className="mt-0.5 text-sm text-grape-200/60">{desc}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Coins; label: string; value: string; color: string }) {
  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-grape-200/60">
        <Icon size={14} /> {label}
      </div>
      <p className={`font-display text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
