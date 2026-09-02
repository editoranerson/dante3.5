import { useEffect, useState } from 'react';
import {
  Users,
  Gift,
  Coins,
  TrendingUp,
  Shield,
  ArrowRight,
  Star,
  Award,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { navigateTo } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { getAffiliateSettings } from '@/lib/affiliate';

export function AfiliadosPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<{
    visit_batch_size: number;
    visit_batch_coins: number;
    signup_coins: number;
    plan_dante_plus_coins: number;
    plan_dante_premium_coins: number;
    plan_dante_premium_plus_coins: number;
  } | null>(null);

  useEffect(() => {
    getAffiliateSettings().then(setSettings);
  }, []);

  const benefits = [
    {
      icon: Coins,
      title: 'Ganhe Coins',
      desc: 'A cada visita válida no seu link, você se aproxima de um lote de Coins. A cada ' + (settings?.visit_batch_size ?? 10) + ' visitas, ganhe ' + (settings?.visit_batch_coins ?? 5) + ' Coins.',
    },
    {
      icon: Users,
      title: 'Indique e Ganhe',
      desc: 'Quando alguém se cadastra através do seu link, você ganha ' + (settings?.signup_coins ?? 20) + ' Coins automaticamente.',
    },
    {
      icon: TrendingUp,
      title: 'Comissões Recorrentes',
      desc: 'Seu indicado assinou um plano? Você ganha Coins extras: Plus ' + (settings?.plan_dante_plus_coins ?? 30) + ', Premium ' + (settings?.plan_dante_premium_coins ?? 60) + ', Premium+ ' + (settings?.plan_dante_premium_plus_coins ?? 120) + '.',
    },
    {
      icon: Gift,
      title: 'Troque por Prêmios',
      desc: 'Use suas Coins para resgatar pacotes de Dantes ou solicitar saques via Pix.',
    },
    {
      icon: Shield,
      title: 'Programa Confiável',
      desc: 'Sistema 100% automático e transparente. Acompanhe suas métricas em tempo real no seu perfil.',
    },
    {
      icon: Award,
      title: 'Seja um Embaixador',
      desc: 'Todo usuário cadastrado já tem seu link exclusivo. Comece a divulgar agora mesmo!',
    },
  ];

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-500 to-rose-500 shadow-glow">
            <Star size={32} className="text-white" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-grape-400/20 bg-grape-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-300">
            <Sparkles size={14} /> Programa de Afiliados
          </div>
          <h1 className="font-display text-4xl font-bold text-grape-50 sm:text-5xl">
            Embaixadores <span className="text-rose-400">Dante</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-grape-200/70">
            Divulgue o Universo Dante, ganhe Coins por cada visita e indicação, e troque por prêmios reais.
            Comece agora — é grátis e automático!
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigateTo(user ? { name: 'profile' } : { name: 'signup' })}
              className="btn-primary inline-flex items-center gap-2 text-base"
            >
              {user ? 'Ver Meu Painel' : 'Quero ser um Embaixador'}
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigateTo({ name: 'afiliados_diretrizes' })}
              className="btn-ghost inline-flex items-center gap-2 text-base"
            >
              Ver Diretrizes do Programa
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center font-display text-3xl font-semibold text-grape-50">
          Por que ser um Embaixador?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="card border border-white/10 bg-ink-800/40 p-6 transition hover:border-grape-400/30"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-grape-500/10">
                  <Icon size={24} className="text-grape-400" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-grape-50">{b.title}</h3>
                <p className="text-sm text-grape-200/60">{b.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center font-display text-3xl font-semibold text-grape-50">
          Como Funciona
        </h2>
        <div className="space-y-6">
          {[
            { num: 1, title: 'Ganhe seu link exclusivo', desc: 'Todo usuário cadastrado recebe automaticamente um link de indicação único.' },
            { num: 2, title: 'Divulgue e gere visitas', desc: 'Compartilhe seu link nas redes sociais, grupos e com amigos. Visitas que permanecem na página contam como válidas.' },
            { num: 3, title: 'Acumule Coins', desc: 'A cada lote de visitas válidas, cadastros de indicados, assinaturas e uso do site, você ganha Coins.' },
            { num: 4, title: 'Troque por prêmios', desc: 'Resgate suas Coins por pacotes de Dantes ou solicite saques via Pix diretamente no seu painel.' },
          ].map((step) => (
            <div key={step.num} className="card flex items-start gap-4 border border-white/10 bg-ink-800/40 p-6">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-grape-500 to-rose-500 font-display text-lg font-bold text-white">
                {step.num}
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-grape-50">{step.title}</h3>
                <p className="mt-1 text-sm text-grape-200/60">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="card border border-grape-400/20 bg-gradient-to-br from-grape-500/10 to-rose-500/5 p-8 text-center">
          <DollarSign size={40} className="mx-auto mb-4 text-rose-400" />
          <h2 className="mb-4 font-display text-2xl font-semibold text-grape-50">
            Pronto para começar a ganhar?
          </h2>
          <p className="mb-6 text-grape-200/60">
            Junte-se ao programa e comece a transformar suas indicações em prêmios reais.
          </p>
          <button
            onClick={() => navigateTo(user ? { name: 'profile' } : { name: 'signup' })}
            className="btn-primary inline-flex items-center gap-2"
          >
            {user ? 'Acessar Meu Painel' : 'Criar Conta Gratuita'}
            <ArrowRight size={20} />
          </button>
        </div>
      </section>
    </div>
  );
}

export function AfiliadosDiretrizesPage() {
  const [guidelines, setGuidelines] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAffiliateSettings().then((s) => {
      setGuidelines(s.guidelines);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <button
          onClick={() => navigateTo({ name: 'afiliados' })}
          className="mb-4 text-sm text-grape-200/60 hover:text-grape-200"
        >
          ← Voltar para Embaixadores
        </button>
        <h1 className="font-display text-3xl font-semibold text-grape-50">
          Diretrizes do Programa
        </h1>
      </div>
      <div className="card bg-ink-800/60 p-6">
        {guidelines ? (
          <div className="prose prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-grape-100/80">
            {guidelines}
          </div>
        ) : (
          <p className="text-grape-200/50">Diretrizes não disponíveis no momento.</p>
        )}
      </div>
    </div>
  );
}
