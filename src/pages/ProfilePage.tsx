import { useState, useEffect } from 'react';
import { CircleUser as UserCircle, Mail, Phone, Calendar, Lock, LogOut, Shield, Save, ArrowRight, KeyRound, Sparkles, Loader as Loader2, Crown, Plus, Diamond, Star, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { navigateTo } from '@/lib/router';
import { useToast } from '@/components/Toast';
import { SubscriptionBadge } from '@/components/SubscriptionBadge';
import { getEffectivePlan, getPlanInfo, isSubscriptionActive } from '@/lib/plans';
import { AmbassadorPanel } from '@/components/AmbassadorPanel';
import { AmbassadorAdminPanel } from '@/components/AmbassadorAdminPanel';

type Tab = 'overview' | 'edit' | 'password' | 'embaixadores' | 'admin';

export function ProfilePage() {
  const { user, profile, isAdmin, refreshProfile, signOut } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('overview');

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setBirthdate(profile.birthdate ?? '');
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigateTo({ name: 'home' });
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-rose-500/15">
          <UserCircle size={32} className="text-rose-300" />
        </div>
        <h2 className="mb-2 font-display text-xl font-semibold text-grape-50">
          Perfil não encontrado
        </h2>
        <p className="mb-6 text-sm text-grape-200/70">
          Não foi possível carregar seu perfil. Tente recarregar a página ou sair
          e entrar novamente.
        </p>
        <button onClick={handleSignOut} className="btn-danger">
          <LogOut size={18} /> Sair e entrar novamente
        </button>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof UserCircle; show: boolean }[] = [
    { id: 'overview', label: 'Meus Dados', icon: UserCircle, show: true },
    { id: 'edit', label: 'Editar Perfil', icon: Save, show: true },
    { id: 'password', label: 'Alterar Senha', icon: KeyRound, show: true },
    { id: 'embaixadores', label: 'Embaixadores', icon: Star, show: true },
    { id: 'admin', label: 'Administração', icon: Shield, show: isAdmin },
  ];

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        birthdate: birthdate || null,
      })
      .eq('id', user.id);
    setSavingProfile(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    await refreshProfile();
    toast('Perfil atualizado com sucesso!', 'success');
    setTab('overview');
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('As senhas não coincidem.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('A senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast(error.message, 'error');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    toast('Senha alterada com sucesso!', 'success');
    setTab('overview');
  };

  const fmtDate = (d: string | null) => {
    if (!d) return '—';
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-500 to-rose-500 shadow-glow">
          <Sparkles size={28} className="text-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-grape-50">Meu Perfil</h1>
          <p className="text-sm text-grape-200/70">
            Gerencie sua conta e informações pessoais.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.filter((t) => t.show).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? t.id === 'admin'
                    ? 'bg-gold-400/15 text-gold-400 border border-gold-400/40'
                    : t.id === 'embaixadores'
                      ? 'bg-grape-500/15 text-grape-300 border border-grape-400/40'
                      : 'bg-grape-500/20 text-grape-50 border border-grape-400/40'
                  : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10 hover:text-grape-50'
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="card space-y-4 bg-ink-800/60 p-6">
            <h2 className="font-display text-lg font-semibold text-grape-50">Dados do Perfil</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow icon={UserCircle} label="Nome" value={profile.full_name || '—'} />
              <InfoRow icon={Mail} label="E-mail" value={user?.email ?? '—'} />
              <InfoRow icon={Phone} label="Telefone" value={profile.phone || '—'} />
              <InfoRow icon={Calendar} label="Nascimento" value={fmtDate(profile.birthdate)} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <Sparkles size={18} className="text-rose-300" />
              <span className="text-sm text-grape-100/80">
                <span className="font-semibold text-grape-50">{profile.points}</span> Dantes
                acumulados
              </span>
            </div>
          </div>

          {/* Subscription info card */}
          <div className="card space-y-4 bg-ink-800/60 p-6">
            <h2 className="font-display text-lg font-semibold text-grape-50">Assinatura do Dante</h2>
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                >
                  ∞
                </div>
                <div>
                  <p className="font-semibold text-grape-50">
                    {getPlanInfo(getEffectivePlan(profile)).name}
                  </p>
                  <p className="text-xs text-grape-200/60">
                    {getPlanInfo(getEffectivePlan(profile)).priceLabel}
                  </p>
                </div>
              </div>
              {getEffectivePlan(profile) !== 'free' && (
                <SubscriptionBadge plan={getEffectivePlan(profile)} size="md" />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-grape-200/60">
                  Créditos do Dante
                </p>
                <p className="mt-1 text-sm font-medium text-grape-50">
                  {isAdmin ? 'Ilimitado' : `${profile.credits ?? 0} Créditos`}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-grape-200/60">
                  Expira em
                </p>
                <p className="mt-1 text-sm font-medium text-grape-50">
                  {isSubscriptionActive(profile) && profile.plan_expires_at
                    ? new Date(profile.plan_expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                    : '—'}
                </p>
              </div>
            </div>
            {getEffectivePlan(profile) === 'free' && (
              <button
                onClick={() => navigateTo({ name: 'planos' })}
                className="w-full rounded-full bg-gradient-to-r from-sky2-400 to-rose-400 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Fazer upgrade do plano
              </button>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="btn-danger w-full"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      )}

      {tab === 'edit' && (
        <form onSubmit={saveProfile} className="card space-y-4 bg-ink-800/60 p-6">
          <h2 className="font-display text-lg font-semibold text-grape-50">Editar Informações</h2>
          <div>
            <label className="label">Nome Completo</label>
            <div className="relative">
              <UserCircle size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input pl-10"
                placeholder="Seu nome"
              />
            </div>
          </div>
          <div>
            <label className="label">Telefone</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input pl-10"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div>
            <label className="label">Data de Nascimento</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary w-full">
            {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
            <ArrowRight size={18} />
          </button>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={changePassword} className="card space-y-4 bg-ink-800/60 p-6">
          <h2 className="font-display text-lg font-semibold text-grape-50">Alterar Senha</h2>
          <div>
            <label className="label">Nova Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input pl-10"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>
          <div>
            <label className="label">Confirmar Nova Senha</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pl-10"
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary w-full">
            {savingPassword ? 'Alterando...' : 'Alterar Senha'}
            <KeyRound size={18} />
          </button>
        </form>
      )}

      {tab === 'embaixadores' && (
        <div className="space-y-4">
          <div className="card border border-grape-400/20 bg-ink-800/60 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-grape-500/15">
                <Star size={24} className="text-grape-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-grape-300">Programa Embaixadores</h2>
                <p className="text-sm text-grape-200/70">Seu painel de afiliados e indicações.</p>
              </div>
            </div>
          </div>
          <AmbassadorPanel />
          {isAdmin && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-t border-white/10 pt-4 text-sm font-semibold text-gold-400">
                <Settings size={16} /> Painel ADMIN
              </div>
              <AmbassadorAdminPanel />
            </div>
          )}
        </div>
      )}

      {tab === 'admin' && isAdmin && (
        <div className="space-y-4">
          <div className="card space-y-4 border-gold-400/20 bg-ink-800/60 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/15">
                <Shield size={24} className="text-gold-400" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-gold-400">
                  Administração
                </h2>
                <p className="text-sm text-grape-200/70">
                  Acesso restrito a administradores.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-grape-100/80">
                <span className="font-semibold text-grape-50">Nível de acesso:</span>{' '}
                Administrador
              </p>
              <p className="mt-1 text-sm text-grape-200/60">
                Você tem permissão para gerenciar personagens, segredos, músicas, cartas, tarefas
                e conteúdos do site através do painel administrativo.
              </p>
            </div>

            <button
              onClick={() => navigateTo({ name: 'admin' })}
              className="btn w-full border border-gold-400/40 bg-gold-400/10 text-gold-400 hover:bg-gold-400/20"
            >
              <Shield size={18} /> Abrir Painel Administrativo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserCircle;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-grape-200/60">
        <Icon size={14} />
        {label}
      </div>
      <p className="text-sm font-medium text-grape-50">{value}</p>
    </div>
  );
}
