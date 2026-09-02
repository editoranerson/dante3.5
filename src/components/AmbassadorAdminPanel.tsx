import { useCallback, useEffect, useState } from 'react';
import { Settings, Users, Bell, FileText, ShoppingBag, Coins, Save, Search, Ban, CircleCheck as CheckCircle, Circle as XCircle, Send, TriangleAlert as AlertTriangle, Loader as Loader2, SlidersHorizontal, UserPlus, Trash2, Link2 } from 'lucide-react';
import { supabase, type AffiliateAccount, type AffiliateRedemption, type AffiliateShopItem, type AffiliateSettings } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { getAffiliateSettings } from '@/lib/affiliate';
import { PLANS } from '@/lib/plans';

type AdminTab = 'settings' | 'ambassadors' | 'rules' | 'referrals' | 'notifications' | 'guidelines' | 'shop' | 'redemptions';

interface AmbassadorRow extends AffiliateAccount {
  full_name: string;
  email: string;
}

interface CustomRulesRow {
  ambassador_id: string;
  visit_batch_size: number | null;
  visit_batch_coins: number | null;
  signup_coins: number | null;
  credits_coins_per: number | null;
  credits_threshold: number | null;
  dantes_coins_per: number | null;
  dantes_threshold: number | null;
  plan_coins_override: Record<string, number> | null;
}

interface ReferralRow {
  id: string;
  ambassador_id: string;
  referred_id: string;
  is_manual: boolean;
  created_at: string;
  referred_name: string;
}

export function AmbassadorAdminPanel() {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>('settings');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [ambassadors, setAmbassadors] = useState<AmbassadorRow[]>([]);
  const [redemptions, setRedemptions] = useState<(AffiliateRedemption & { ambassador_name: string })[]>([]);
  const [shopItems, setShopItems] = useState<AffiliateShopItem[]>([]);
  const [search, setSearch] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [guidelinesText, setGuidelinesText] = useState('');
  const [savingGuidelines, setSavingGuidelines] = useState(false);

  // notification form
  const [notifAmbassadorId, setNotifAmbassadorId] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'warning' | 'infraction'>('info');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [sendingNotif, setSendingNotif] = useState(false);

  // shop form
  const [shopForm, setShopForm] = useState({ name: '', description: '', redemption_type: 'dantes_package' as 'dantes_package' | 'pix_withdrawal', coins_cost: 0, dantes_amount: 0, is_active: true, sort_order: 0 });
  const [savingShop, setSavingShop] = useState(false);
  const [editingShopId, setEditingShopId] = useState<string | null>(null);

  // custom rules state
  const [rulesAmbassadorId, setRulesAmbassadorId] = useState('');
  const [rulesForm, setRulesForm] = useState({
    visit_batch_size: '' as string | number,
    visit_batch_coins: '' as string | number,
    signup_coins: '' as string | number,
    credits_coins_per: '' as string | number,
    credits_threshold: '' as string | number,
    dantes_coins_per: '' as string | number,
    dantes_threshold: '' as string | number,
  });
  const [savingRules, setSavingRules] = useState(false);

  // referrals state
  const [referralsAmbassadorId, setReferralsAmbassadorId] = useState('');
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);
  const [attachUserId, setAttachUserId] = useState('');
  const [loadingReferrals, setLoadingReferrals] = useState(false);

  const load = useCallback(async () => {
    try {
      const settingsData = await getAffiliateSettings();
      setSettings(settingsData);
      setGuidelinesText(settingsData.guidelines);

      // Fetch affiliate accounts and profiles separately (no FK between them)
      const { data: ambData, error: ambError } = await supabase
        .from('affiliate_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (ambError) throw ambError;
      const ambUserIds = (ambData ?? []).map((r: Record<string, unknown>) => r.user_id as string);
      const { data: ambProfData } = ambUserIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', ambUserIds)
        : { data: [] };
      const ambProfileMap: Record<string, string> = {};
      ((ambProfData as { id: string; full_name: string }[]) ?? []).forEach((p) => { ambProfileMap[p.id] = p.full_name; });
      const ambRows: AmbassadorRow[] = (ambData ?? []).map((r: Record<string, unknown>) => ({
        user_id: r.user_id as string,
        referral_code: r.referral_code as string,
        coins: r.coins as number,
        is_blocked: r.is_blocked as boolean,
        block_reason: r.block_reason as string | null,
        created_at: r.created_at as string,
        full_name: ambProfileMap[r.user_id as string] ?? '—',
        email: '',
      }));
      setAmbassadors(ambRows);

      const { data: redeemData } = await supabase
        .from('affiliate_redemptions')
        .select('*')
        .order('created_at', { ascending: false });
      const redeemUserIds = [...new Set((redeemData ?? []).map((r: Record<string, unknown>) => r.ambassador_id as string))];
      const { data: redeemProfData } = redeemUserIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', redeemUserIds)
        : { data: [] };
      const redeemProfileMap: Record<string, string> = {};
      ((redeemProfData as { id: string; full_name: string }[]) ?? []).forEach((p) => { redeemProfileMap[p.id] = p.full_name; });
      const redeemRows = (redeemData ?? []).map((r: Record<string, unknown>) => ({
        id: r.id as string,
        ambassador_id: r.ambassador_id as string,
        redemption_type: r.redemption_type as AffiliateRedemption['redemption_type'],
        item_name: r.item_name as string,
        coins_cost: r.coins_cost as number,
        dantes_amount: r.dantes_amount as number | null,
        pix_key: r.pix_key as string | null,
        pix_key_type: r.pix_key_type as string | null,
        status: r.status as AffiliateRedemption['status'],
        admin_note: r.admin_note as string | null,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
        ambassador_name: redeemProfileMap[r.ambassador_id as string] ?? '—',
      }));
      setRedemptions(redeemRows);

      const { data: shopData } = await supabase
        .from('affiliate_shop_items')
        .select('*')
        .order('sort_order', { ascending: true });
      setShopItems((shopData as AffiliateShopItem[]) ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao carregar dados';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const updates = [
      { key: 'affiliate_visit_retention_seconds', value: String(settings.visit_retention_seconds) },
      { key: 'affiliate_visit_batch_size', value: String(settings.visit_batch_size) },
      { key: 'affiliate_visit_batch_coins', value: String(settings.visit_batch_coins) },
      { key: 'affiliate_signup_coins', value: String(settings.signup_coins) },
      { key: 'affiliate_credits_threshold', value: String(settings.credits_threshold) },
      { key: 'affiliate_credits_coins_per', value: String(settings.credits_coins_per) },
      { key: 'affiliate_dantes_threshold', value: String(settings.dantes_threshold) },
      { key: 'affiliate_dantes_coins_per', value: String(settings.dantes_coins_per) },
      { key: 'affiliate_plan_dante_plus_coins', value: String(settings.plan_dante_plus_coins) },
      { key: 'affiliate_plan_dante_premium_coins', value: String(settings.plan_dante_premium_coins) },
      { key: 'affiliate_plan_dante_premium_plus_coins', value: String(settings.plan_dante_premium_plus_coins) },
    ];
    await supabase.from('site_content').upsert(updates);
    setSavingSettings(false);
    toast('Configurações salvas!', 'success');
  };

  const saveGuidelines = async () => {
    setSavingGuidelines(true);
    await supabase.from('site_content').upsert({ key: 'affiliate_guidelines', value: guidelinesText });
    setSavingGuidelines(false);
    toast('Diretrizes atualizadas!', 'success');
  };

  const adjustCoins = async (ambassadorId: string, amount: number, reason: string) => {
    const { error } = await supabase.rpc('admin_affiliate_adjust_coins', {
      p_ambassador_id: ambassadorId,
      p_amount: amount,
      p_reason: reason,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast('Coins ajustados!', 'success');
    await load();
  };

  const toggleBlock = async (ambassadorId: string, blocked: boolean) => {
    const reason = blocked ? prompt('Motivo do bloqueio:') ?? '' : '';
    if (blocked && !reason) return;
    const { error } = await supabase.rpc('admin_affiliate_block', {
      p_ambassador_id: ambassadorId,
      p_blocked: blocked,
      p_reason: reason,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast(blocked ? 'Embaixador bloqueado.' : 'Embaixador desbloqueado.', 'success');
    await load();
  };

  const sendNotification = async () => {
    if (!notifAmbassadorId || !notifTitle || !notifMessage) return;
    setSendingNotif(true);
    const { error } = await supabase.rpc('admin_affiliate_send_notification', {
      p_ambassador_id: notifAmbassadorId,
      p_type: notifType,
      p_title: notifTitle,
      p_message: notifMessage,
    });
    setSendingNotif(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Notificação enviada!', 'success');
    setNotifTitle('');
    setNotifMessage('');
  };

  const updateRedemption = async (id: string, status: 'pago' | 'recusado') => {
    const { error } = await supabase.rpc('admin_affiliate_update_redemption', {
      p_redemption_id: id,
      p_status: status,
    });
    if (error) { toast(error.message, 'error'); return; }
    toast(`Resgate ${status === 'pago' ? 'aprovado' : 'recusado'}!`, 'success');
    await load();
  };

  const saveShopItem = async () => {
    if (!shopForm.name) return;
    setSavingShop(true);
    const payload = {
      name: shopForm.name,
      description: shopForm.description,
      redemption_type: shopForm.redemption_type,
      coins_cost: shopForm.coins_cost,
      dantes_amount: shopForm.redemption_type === 'dantes_package' ? shopForm.dantes_amount : null,
      is_active: shopForm.is_active,
      sort_order: shopForm.sort_order,
    };
    if (editingShopId) {
      await supabase.from('affiliate_shop_items').update(payload).eq('id', editingShopId);
    } else {
      await supabase.from('affiliate_shop_items').insert(payload);
    }
    setSavingShop(false);
    toast('Item salvo!', 'success');
    setShopForm({ name: '', description: '', redemption_type: 'dantes_package', coins_cost: 0, dantes_amount: 0, is_active: true, sort_order: 0 });
    setEditingShopId(null);
    await load();
  };

  const editShopItem = (item: AffiliateShopItem) => {
    setShopForm({
      name: item.name,
      description: item.description,
      redemption_type: item.redemption_type,
      coins_cost: item.coins_cost,
      dantes_amount: item.dantes_amount ?? 0,
      is_active: item.is_active,
      sort_order: item.sort_order,
    });
    setEditingShopId(item.id);
  };

  const deleteShopItem = async (id: string) => {
    await supabase.from('affiliate_shop_items').delete().eq('id', id);
    toast('Item removido.', 'success');
    await load();
  };

  // -- Custom Rules --
  const loadCustomRules = async (ambassadorId: string) => {
    const { data, error } = await supabase
      .from('affiliate_custom_rules')
      .select('*')
      .eq('ambassador_id', ambassadorId)
      .maybeSingle();

    if (error) {
      toast('Erro ao carregar regras: ' + error.message, 'error');
      return;
    }

    const r = data as CustomRulesRow | null;
    if (r) {
      setRulesForm({
        visit_batch_size: r.visit_batch_size ?? '',
        visit_batch_coins: r.visit_batch_coins ?? '',
        signup_coins: r.signup_coins ?? '',
        credits_coins_per: r.credits_coins_per ?? '',
        credits_threshold: r.credits_threshold ?? '',
        dantes_coins_per: r.dantes_coins_per ?? '',
        dantes_threshold: r.dantes_threshold ?? '',
      });
    } else {
      setRulesForm({
        visit_batch_size: '', visit_batch_coins: '', signup_coins: '',
        credits_coins_per: '', credits_threshold: '', dantes_coins_per: '', dantes_threshold: '',
      });
    }
  };

  const saveCustomRules = async () => {
    if (!rulesAmbassadorId) return;
    setSavingRules(true);
    const parseVal = (v: string | number) => (v === '' ? null : Number(v));
    const { error } = await supabase.rpc('admin_save_custom_rules', {
      p_ambassador_id: rulesAmbassadorId,
      p_visit_batch_size: parseVal(rulesForm.visit_batch_size),
      p_visit_batch_coins: parseVal(rulesForm.visit_batch_coins),
      p_signup_coins: parseVal(rulesForm.signup_coins),
      p_credits_coins_per: parseVal(rulesForm.credits_coins_per),
      p_credits_threshold: parseVal(rulesForm.credits_threshold),
      p_dantes_coins_per: parseVal(rulesForm.dantes_coins_per),
      p_dantes_threshold: parseVal(rulesForm.dantes_threshold),
    });
    setSavingRules(false);
    if (error) { toast(error.message, 'error'); return; }
    toast('Regras personalizadas salvas!', 'success');
  };

  // -- Referrals --
  const loadReferrals = async (ambassadorId: string) => {
    setLoadingReferrals(true);
    setReferrals([]);
    setAttachUserId('');

    // Load referrals for this ambassador
    const { data: refData, error: refError } = await supabase
      .from('affiliate_referrals')
      .select('*')
      .eq('ambassador_id', ambassadorId)
      .order('created_at', { ascending: false });

    if (refError) {
      toast('Erro ao carregar indicados: ' + refError.message, 'error');
      setLoadingReferrals(false);
      return;
    }

    const refRows = (refData ?? []) as Record<string, unknown>[];
    const referredIds = refRows.map((r) => r.referred_id as string);
    const { data: refProfiles } = referredIds.length > 0
      ? await supabase.from('profiles').select('id, full_name').in('id', referredIds)
      : { data: [] };

    const nameMap: Record<string, string> = {};
    ((refProfiles as { id: string; full_name: string }[]) ?? []).forEach((p) => { nameMap[p.id] = p.full_name; });

    setReferrals(refRows.map((r) => ({
      id: r.id as string,
      ambassador_id: r.ambassador_id as string,
      referred_id: r.referred_id as string,
      is_manual: r.is_manual as boolean,
      created_at: r.created_at as string,
      referred_name: nameMap[r.referred_id as string] ?? 'Usuário',
    })));

    // Load all users for the attach dropdown
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, full_name')
      .order('full_name', { ascending: true });

    // Exclude users already linked to this ambassador
    const linkedIds = new Set(referredIds);
    setAllUsers(((userData as { id: string; full_name: string }[]) ?? []).filter((u) => !linkedIds.has(u.id)));

    setLoadingReferrals(false);
  };

  const attachReferral = async () => {
    if (!referralsAmbassadorId || !attachUserId) return;
    const { error } = await supabase.rpc('admin_attach_referral', {
      p_ambassador_id: referralsAmbassadorId,
      p_referred_id: attachUserId,
    });
    if (error) {
      if (error.message.includes('already_linked')) {
        toast('Este usuário já está vinculado a este embaixador.', 'error');
      } else {
        toast(error.message, 'error');
      }
      return;
    }
    toast('Usuário vinculado com sucesso!', 'success');
    await loadReferrals(referralsAmbassadorId);
  };

  const removeReferral = async (referralId: string) => {
    const { data, error } = await supabase.rpc('admin_remove_referral', {
      p_referral_id: referralId,
    });
    if (error) { toast(error.message, 'error'); return; }
    const result = data as { ok?: boolean; error?: string };
    if (result && result.ok === false) {
      if (result.error === 'not_manual') {
        toast('Não é possível remover uma indicação automática.', 'error');
      } else if (result.error === 'not_found') {
        toast('Vínculo não encontrado.', 'error');
      } else {
        toast('Erro ao remover vínculo.', 'error');
      }
      return;
    }
    toast('Vínculo removido!', 'success');
    await loadReferrals(referralsAmbassadorId);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-gold-400" />
      </div>
    );
  }

  const tabs: { id: AdminTab; label: string; icon: typeof Settings }[] = [
    { id: 'settings', label: 'Configurações', icon: Settings },
    { id: 'ambassadors', label: 'Embaixadores', icon: Users },
    { id: 'rules', label: 'Regras', icon: SlidersHorizontal },
    { id: 'referrals', label: 'Indicados', icon: Link2 },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'guidelines', label: 'Diretrizes', icon: FileText },
    { id: 'shop', label: 'Lojinha', icon: ShoppingBag },
    { id: 'redemptions', label: 'Saques', icon: Coins },
  ];

  const filteredAmbassadors = ambassadors.filter((a) =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.referral_code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-gold-400/20 bg-gold-400/5 p-4">
        <Settings size={20} className="text-gold-400" />
        <h3 className="font-display text-lg font-semibold text-gold-400">Painel ADMIN - Embaixadores</h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t.id ? 'bg-gold-400/15 text-gold-400 border border-gold-400/40' : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* SETTINGS */}
      {tab === 'settings' && settings && (
        <div className="card space-y-4 bg-ink-800/60 p-6">
          <h3 className="font-display text-lg font-semibold text-grape-50">Regras de Recompensa (Global)</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <SettingInput label="Segundos de Retenção (visita válida)" value={settings.visit_retention_seconds} onChange={(v) => setSettings({ ...settings, visit_retention_seconds: v })} />
            <SettingInput label="Visitas por Lote (X)" value={settings.visit_batch_size} onChange={(v) => setSettings({ ...settings, visit_batch_size: v })} />
            <SettingInput label="Coins por Lote (Z)" value={settings.visit_batch_coins} onChange={(v) => setSettings({ ...settings, visit_batch_coins: v })} />
            <SettingInput label="Coins por Cadastro" value={settings.signup_coins} onChange={(v) => setSettings({ ...settings, signup_coins: v })} />
            <SettingInput label="Créditos Threshold (X)" value={settings.credits_threshold} onChange={(v) => setSettings({ ...settings, credits_threshold: v })} />
            <SettingInput label="Coins por X Créditos" value={settings.credits_coins_per} onChange={(v) => setSettings({ ...settings, credits_coins_per: v })} />
            <SettingInput label="Dantes Threshold (X)" value={settings.dantes_threshold} onChange={(v) => setSettings({ ...settings, dantes_threshold: v })} />
            <SettingInput label="Coins por X Dantes" value={settings.dantes_coins_per} onChange={(v) => setSettings({ ...settings, dantes_coins_per: v })} />
          </div>
          <h4 className="pt-2 font-display font-semibold text-grape-50">Coins por Plano de Assinatura</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <SettingInput label="Dante Plus" value={settings.plan_dante_plus_coins} onChange={(v) => setSettings({ ...settings, plan_dante_plus_coins: v })} />
            <SettingInput label="Dante Premium" value={settings.plan_dante_premium_coins} onChange={(v) => setSettings({ ...settings, plan_dante_premium_coins: v })} />
            <SettingInput label="Dante Premium+" value={settings.plan_dante_premium_plus_coins} onChange={(v) => setSettings({ ...settings, plan_dante_premium_plus_coins: v })} />
          </div>
          <button onClick={saveSettings} disabled={savingSettings} className="btn-primary w-full sm:w-auto">
            <Save size={18} /> {savingSettings ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      )}

      {/* AMBASSADORS */}
      {tab === 'ambassadors' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Buscar por nome ou código..." />
          </div>
          {filteredAmbassadors.length === 0 ? (
            <p className="py-8 text-center text-grape-200/50">Nenhum embaixador encontrado.</p>
          ) : (
            <div className="space-y-2">
              {filteredAmbassadors.map((a) => (
                <div key={a.user_id} className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${a.is_blocked ? 'border-rose-500/20' : 'border-white/10'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-grape-50">{a.full_name}</span>
                      {a.is_blocked && <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-300">Bloqueado</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-grape-200/60">
                      <span>Código: <code className="text-grape-300">{a.referral_code}</code></span>
                      <span className="text-gold-400">{a.coins} Coins</span>
                      <span>Criado: {new Date(a.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {a.block_reason && <p className="mt-1 text-xs text-rose-300/70">Motivo: {a.block_reason}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const amt = parseInt(prompt('Quantidade de Coins (+ ou -):') ?? '0', 10);
                        if (amt) { const reason = prompt('Motivo:') ?? ''; adjustCoins(a.user_id, amt, reason); }
                      }}
                      className="btn-ghost text-xs"
                    >
                      <Coins size={14} /> Ajustar
                    </button>
                    <button
                      onClick={() => { setTab('rules'); setRulesAmbassadorId(a.user_id); loadCustomRules(a.user_id); }}
                      className="btn-ghost text-xs"
                    >
                      <SlidersHorizontal size={14} /> Regras
                    </button>
                    <button
                      onClick={() => { setTab('referrals'); setReferralsAmbassadorId(a.user_id); loadReferrals(a.user_id); }}
                      className="btn-ghost text-xs"
                    >
                      <Link2 size={14} /> Indicados
                    </button>
                    {a.is_blocked ? (
                      <button onClick={() => toggleBlock(a.user_id, false)} className="btn-ghost text-xs text-mint-400">
                        <CheckCircle size={14} /> Desbloquear
                      </button>
                    ) : (
                      <button onClick={() => toggleBlock(a.user_id, true)} className="btn-ghost text-xs text-rose-300">
                        <Ban size={14} /> Bloquear
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOM RULES */}
      {tab === 'rules' && (
        <div className="card space-y-4 bg-ink-800/60 p-6">
          <h3 className="font-display text-lg font-semibold text-grape-50">Regras de Coins Personalizadas</h3>
          <p className="text-sm text-grape-200/60">
            Selecione um embaixador e defina regras exclusivas para ele. Campos vazios usam o valor global padrão.
          </p>
          <div>
            <label className="label">Embaixador</label>
            <select
              value={rulesAmbassadorId}
              onChange={(e) => { setRulesAmbassadorId(e.target.value); if (e.target.value) loadCustomRules(e.target.value); }}
              className="input"
            >
              <option value="">Selecione...</option>
              {ambassadors.map((a) => (
                <option key={a.user_id} value={a.user_id}>{a.full_name} ({a.referral_code})</option>
              ))}
            </select>
          </div>
          {rulesAmbassadorId && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <RulesInput label="Visitas por Lote" value={rulesForm.visit_batch_size} onChange={(v) => setRulesForm({ ...rulesForm, visit_batch_size: v })} />
                <RulesInput label="Coins por Lote" value={rulesForm.visit_batch_coins} onChange={(v) => setRulesForm({ ...rulesForm, visit_batch_coins: v })} />
                <RulesInput label="Coins por Cadastro" value={rulesForm.signup_coins} onChange={(v) => setRulesForm({ ...rulesForm, signup_coins: v })} />
                <RulesInput label="Créditos Threshold" value={rulesForm.credits_threshold} onChange={(v) => setRulesForm({ ...rulesForm, credits_threshold: v })} />
                <RulesInput label="Coins por X Créditos" value={rulesForm.credits_coins_per} onChange={(v) => setRulesForm({ ...rulesForm, credits_coins_per: v })} />
                <RulesInput label="Dantes Threshold" value={rulesForm.dantes_threshold} onChange={(v) => setRulesForm({ ...rulesForm, dantes_threshold: v })} />
                <RulesInput label="Coins por X Dantes" value={rulesForm.dantes_coins_per} onChange={(v) => setRulesForm({ ...rulesForm, dantes_coins_per: v })} />
              </div>
              <button onClick={saveCustomRules} disabled={savingRules} className="btn-primary w-full sm:w-auto disabled:opacity-50">
                <Save size={18} /> {savingRules ? 'Salvando...' : 'Salvar Regras Personalizadas'}
              </button>
            </>
          )}
        </div>
      )}

      {/* REFERRALS */}
      {tab === 'referrals' && (
        <div className="space-y-4">
          <div className="card space-y-4 bg-ink-800/60 p-6">
            <h3 className="font-display text-lg font-semibold text-grape-50">Indicados (Usuários Vinculados)</h3>
            <p className="text-sm text-grape-200/60">
              Selecione um embaixador para ver e gerenciar os usuários vinculados a ele. Indicações automáticas não podem ser removidas.
            </p>
            <div>
              <label className="label">Embaixador</label>
              <select
                value={referralsAmbassadorId}
                onChange={(e) => { setReferralsAmbassadorId(e.target.value); if (e.target.value) loadReferrals(e.target.value); }}
                className="input"
              >
                <option value="">Selecione...</option>
                {ambassadors.map((a) => (
                  <option key={a.user_id} value={a.user_id}>{a.full_name} ({a.referral_code})</option>
                ))}
              </select>
            </div>
            {referralsAmbassadorId && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="label">Vincular usuário existente</label>
                  <select value={attachUserId} onChange={(e) => setAttachUserId(e.target.value)} className="input">
                    <option value="">Selecione um usuário...</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name || 'Sem nome'}</option>
                    ))}
                  </select>
                </div>
                <button onClick={attachReferral} disabled={!attachUserId} className="btn-primary disabled:opacity-50">
                  <UserPlus size={18} /> Vincular
                </button>
              </div>
            )}
          </div>

          {referralsAmbassadorId && (
            <>
              {loadingReferrals ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-gold-400" />
                </div>
              ) : referrals.length === 0 ? (
                <p className="py-8 text-center text-grape-200/50">Nenhum usuário vinculado a este embaixador.</p>
              ) : (
                <div className="space-y-2">
                  {referrals.map((r) => (
                    <div key={r.id} className="card flex items-center justify-between border border-white/10 p-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-grape-50">{r.referred_name}</span>
                          <div className="flex items-center gap-2 text-xs text-grape-200/50">
                            <span>Vinculado em: {new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                            {r.is_manual ? (
                              <span className="rounded-full bg-gold-400/15 px-2 py-0.5 font-semibold text-gold-400">Manual</span>
                            ) : (
                              <span className="rounded-full bg-grape-400/15 px-2 py-0.5 font-semibold text-grape-300">Automático</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {r.is_manual && (
                        <button
                          onClick={() => removeReferral(r.id)}
                          className="btn-ghost text-xs text-rose-300"
                        >
                          <Trash2 size={14} /> Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* NOTIFICATIONS */}
      {tab === 'notifications' && (
        <div className="card space-y-4 bg-ink-800/60 p-6">
          <h3 className="font-display text-lg font-semibold text-grape-50">Enviar Notificação</h3>
          <div>
            <label className="label">Embaixador</label>
            <select value={notifAmbassadorId} onChange={(e) => setNotifAmbassadorId(e.target.value)} className="input">
              <option value="">Selecione...</option>
              {ambassadors.filter((a) => !a.is_blocked).map((a) => (
                <option key={a.user_id} value={a.user_id}>{a.full_name} ({a.referral_code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo</label>
            <select value={notifType} onChange={(e) => setNotifType(e.target.value as 'info' | 'warning' | 'infraction')} className="input">
              <option value="info">Informação</option>
              <option value="warning">Aviso</option>
              <option value="infraction">Infração</option>
            </select>
          </div>
          <div>
            <label className="label">Título</label>
            <input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="input" placeholder="Título da notificação" />
          </div>
          <div>
            <label className="label">Mensagem</label>
            <textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} className="input min-h-[100px]" placeholder="Mensagem..." />
          </div>
          <button onClick={sendNotification} disabled={sendingNotif || !notifAmbassadorId || !notifTitle || !notifMessage} className="btn-primary w-full sm:w-auto disabled:opacity-50">
            <Send size={18} /> {sendingNotif ? 'Enviando...' : 'Enviar Notificação'}
          </button>
        </div>
      )}

      {/* GUIDELINES */}
      {tab === 'guidelines' && (
        <div className="card space-y-4 bg-ink-800/60 p-6">
          <h3 className="font-display text-lg font-semibold text-grape-50">Editor de Diretrizes</h3>
          <p className="text-sm text-grape-200/60">Edite os termos e regras do programa. Suporta texto simples com quebras de linha.</p>
          <textarea value={guidelinesText} onChange={(e) => setGuidelinesText(e.target.value)} className="input min-h-[300px] font-mono text-sm" />
          <button onClick={saveGuidelines} disabled={savingGuidelines} className="btn-primary w-full sm:w-auto">
            <Save size={18} /> {savingGuidelines ? 'Salvando...' : 'Salvar Diretrizes'}
          </button>
        </div>
      )}

      {/* SHOP CRUD */}
      {tab === 'shop' && (
        <div className="space-y-4">
          <div className="card space-y-4 bg-ink-800/60 p-6">
            <h3 className="font-display text-lg font-semibold text-grape-50">
              {editingShopId ? 'Editar Item' : 'Novo Item da Lojinha'}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nome</label>
                <input value={shopForm.name} onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select value={shopForm.redemption_type} onChange={(e) => setShopForm({ ...shopForm, redemption_type: e.target.value as 'dantes_package' | 'pix_withdrawal' })} className="input">
                  <option value="dantes_package">Pacote de Dantes</option>
                  <option value="pix_withdrawal">Saque via Pix</option>
                </select>
              </div>
              <div>
                <label className="label">Custo (Coins)</label>
                <input type="number" value={shopForm.coins_cost} onChange={(e) => setShopForm({ ...shopForm, coins_cost: parseInt(e.target.value, 10) || 0 })} className="input" />
              </div>
              {shopForm.redemption_type === 'dantes_package' && (
                <div>
                  <label className="label">Quantidade de Dantes</label>
                  <input type="number" value={shopForm.dantes_amount} onChange={(e) => setShopForm({ ...shopForm, dantes_amount: parseInt(e.target.value, 10) || 0 })} className="input" />
                </div>
              )}
              <div>
                <label className="label">Ordem</label>
                <input type="number" value={shopForm.sort_order} onChange={(e) => setShopForm({ ...shopForm, sort_order: parseInt(e.target.value, 10) || 0 })} className="input" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-grape-200/70">
                  <input type="checkbox" checked={shopForm.is_active} onChange={(e) => setShopForm({ ...shopForm, is_active: e.target.checked })} />
                  Ativo
                </label>
              </div>
            </div>
            <div>
              <label className="label">Descrição</label>
              <input value={shopForm.description} onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })} className="input" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveShopItem} disabled={savingShop || !shopForm.name} className="btn-primary disabled:opacity-50">
                <Save size={18} /> {savingShop ? 'Salvando...' : 'Salvar'}
              </button>
              {editingShopId && (
                <button onClick={() => { setEditingShopId(null); setShopForm({ name: '', description: '', redemption_type: 'dantes_package', coins_cost: 0, dantes_amount: 0, is_active: true, sort_order: 0 }); }} className="btn-ghost">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {shopItems.map((item) => (
              <div key={item.id} className="card flex items-center justify-between border border-white/10 p-4">
                <div>
                  <span className="font-medium text-grape-50">{item.name}</span>
                  <span className="ml-2 text-gold-400">{item.coins_cost} Coins</span>
                  {item.dantes_amount && <span className="ml-2 text-sm text-grape-200/50">{item.dantes_amount} Dantes</span>}
                  {!item.is_active && <span className="ml-2 text-xs text-rose-300">Inativo</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editShopItem(item)} className="btn-ghost text-xs">Editar</button>
                  <button onClick={() => deleteShopItem(item.id)} className="btn-ghost text-xs text-rose-300">Excluir</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REDEMPTIONS */}
      {tab === 'redemptions' && (
        <div className="space-y-4">
          {redemptions.length === 0 ? (
            <p className="py-8 text-center text-grape-200/50">Nenhuma solicitação de resgate.</p>
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div key={r.id} className="card border border-white/10 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-grape-50">{r.item_name}</span>
                        <span className="text-gold-400">{r.coins_cost} Coins</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.status === 'pago' ? 'bg-mint-500/15 text-mint-400' :
                          r.status === 'recusado' ? 'bg-rose-500/15 text-rose-300' :
                          'bg-gold-400/15 text-gold-400'
                        }`}>
                          {r.status === 'pago' ? 'Pago' : r.status === 'recusado' ? 'Recusado' : 'Pendente'}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-grape-200/60">
                        <span>Embaixador: {r.ambassador_name}</span>
                        {r.pix_key && <span className="ml-3">Pix: {r.pix_key} ({r.pix_key_type})</span>}
                        <span className="ml-3">{new Date(r.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {r.admin_note && <p className="mt-1 text-xs text-grape-200/50">Nota: {r.admin_note}</p>}
                    </div>
                    {r.status === 'pendente' && (
                      <div className="flex gap-2">
                        <button onClick={() => updateRedemption(r.id, 'pago')} className="btn-ghost text-xs text-mint-400">
                          <CheckCircle size={14} /> Aprovar
                        </button>
                        <button onClick={() => updateRedemption(r.id, 'recusado')} className="btn-ghost text-xs text-rose-300">
                          <XCircle size={14} /> Recusar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className="input" />
    </div>
  );
}

function RulesInput({ label, value, onChange }: { label: string; value: string | number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        placeholder="Usar padrão global"
      />
    </div>
  );
}
