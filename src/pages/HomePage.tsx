import { BookOpen, Layers, Gift, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { navigateTo } from '@/lib/router';

const BOOK_LINK = 'https://falou.me/qrddante';
const WHATSAPP_LINK =
  'https://chat.whatsapp.com/Lqkwjh1M6kP4rssou7ihBZ?s=cl&p=a&ilr=4';

const TOPICS = [
  { icon: BookOpen, title: 'Leia o livro de graça', desc: 'A história completa disponível para você sem custo.' },
  { icon: Layers, title: 'Colecione cartas do universo', desc: 'Descubra e desbloqueie cartas raras com códigos secretos.' },
  { icon: Gift, title: 'Ganhe recompensas', desc: 'Conclua tarefas e acumule Dantes para resgatar prêmios.' },
];

export function HomePage() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow" />
        <div className="relative mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
              <Sparkles size={14} className="text-rose-400" /> Universo Querido Dante
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-grape-50 sm:text-6xl">
              Bem vindo ao{' '}
              <span className="bg-gradient-to-r from-grape-400 to-rose-400 bg-clip-text text-transparent">
                Universo Querido Dante
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg text-grape-100/80">
              Muito mais que um livro, um universo único de entretenimento e diversão.
            </p>
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {TOPICS.map((t) => (
            <div
              key={t.title}
              className="card group p-6 transition hover:border-grape-400/40 hover:bg-ink-700/40"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-grape-200 transition group-hover:scale-110">
                <t.icon size={22} />
              </div>
              <h3 className="font-display text-lg font-semibold text-grape-50">{t.title}</h3>
              <p className="mt-1.5 text-sm text-grape-100/70">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTAs */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={BOOK_LINK} target="_blank" rel="noopener noreferrer" className="btn-primary w-full sm:w-auto">
            <BookOpen size={18} /> Leia o livro <ArrowRight size={16} />
          </a>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full sm:w-auto">
            <MessageCircle size={18} /> Entre no grupo de WhatsApp
          </a>
        </div>
      </section>

      {/* Explore */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-center font-display text-2xl font-semibold text-grape-50">
          Explore o universo
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Personagens', route: { name: 'personagens' as const }, emoji: '📚' },
            { label: 'Segredos', route: { name: 'segredos' as const }, emoji: '🤫' },
            { label: 'Playlist', route: { name: 'playlist' as const }, emoji: '🎵' },
            { label: 'Álbum de Cartas', route: { name: 'album' as const }, emoji: '🃏' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigateTo(item.route)}
              className="card group flex items-center gap-3 p-5 text-left transition hover:border-grape-400/40 hover:bg-ink-700/40"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="font-semibold text-grape-50">{item.label}</span>
              <ArrowRight size={16} className="ml-auto text-grape-300/50 transition group-hover:translate-x-1 group-hover:text-grape-200" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
