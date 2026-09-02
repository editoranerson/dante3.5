import { useState } from 'react';
import { Sparkles, Mail, Lock, User, Phone, Calendar, ArrowRight, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { useToast } from '@/components/Toast';
import { syncPendingRewards, hasPendingRewards } from '@/lib/pendingRewards';

export function SignupPage() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) {
      toast('Você precisa concordar com os Termos e a Política de Privacidade.', 'error');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setLoading(false);
      const msg = error.message.includes('already')
        ? 'E-mail já cadastrado.'
        : error.message;
      toast(msg, 'error');
      return;
    }
    const uid = data.user?.id;
    if (uid) {
      await supabase.from('profiles').update({
        full_name: fullName,
        phone,
        birthdate: birthdate || null,
      }).eq('id', uid);

      if (hasPendingRewards()) {
        try {
          const result = await syncPendingRewards();
          if (result.cardsSynced + result.gamesSynced > 0) {
            toast(
              `${result.cardsSynced} carta(s) e ${result.gamesSynced} recompensa(s) de jogos sincronizados!`,
              'success',
            );
          }
        } catch {
          // Sync errors are non-fatal for signup
        }
      }
    }
    setLoading(false);
    toast('Conta criada! Bem-vindo ao Universo Dante.', 'success');
    navigateTo({ name: 'home' });
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-500 to-rose-500 shadow-glow">
          <Sparkles size={26} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-grape-50">Criar Conta</h1>
        <p className="mt-2 text-sm text-grape-200/70">
          Junte-se ao Universo Querido Dante.
        </p>
      </div>

      <form onSubmit={submit} className="card w-full space-y-4 bg-ink-800/60 p-6">
        <div>
          <label className="label">Nome Completo</label>
          <div className="relative">
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
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
          <label className="label">E-mail</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="voce@email.com"
            />
          </div>
        </div>
        <div>
          <label className="label">Data de Nascimento</label>
          <div className="relative">
            <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input
              type="date"
              required
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <div>
          <label className="label">Senha</label>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-grape-100/80">
          <button
            type="button"
            onClick={() => setAgree((v) => !v)}
            className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border transition ${
              agree ? 'border-grape-400 bg-grape-500 text-white' : 'border-white/20 bg-transparent'
            }`}
            aria-checked={agree}
            role="checkbox"
          >
            {agree && <Check size={14} />}
          </button>
          <span>
            Li e concordo com os{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigateTo({ name: 'terms' });
              }}
              className="font-semibold text-rose-400 hover:text-rose-300"
            >
              Termos de Uso
            </button>{' '}
            e a{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                navigateTo({ name: 'privacy' });
              }}
              className="font-semibold text-rose-400 hover:text-rose-300"
            >
              Política de Privacidade
            </button>
            .
          </span>
        </label>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Criando...' : 'Criar Conta'}
          <ArrowRight size={18} />
        </button>
      </form>

      <p className="mt-6 text-sm text-grape-200/70">
        Já tem conta?{' '}
        <button
          onClick={() => navigateTo({ name: 'login' })}
          className="font-semibold text-rose-400 hover:text-rose-300"
        >
          Entrar
        </button>
      </p>
    </div>
  );
}
