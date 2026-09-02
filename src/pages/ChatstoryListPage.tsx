import { useEffect, useState } from 'react';
import { MessagesSquare, BookOpen } from 'lucide-react';
import { supabase, type Chatstory } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';

export function ChatstoryListPage() {
  const [stories, setStories] = useState<Chatstory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('chatstories')
      .select('*')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setStories((data as Chatstory[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <MessagesSquare size={14} className="text-rose-400" /> Chatstory
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">Chatstories</h1>
        <p className="mt-3 text-grape-100/70">
          Histórias contadas em formato de conversa. Toque para revelar cada mensagem.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : stories.length === 0 ? (
        <p className="text-center text-grape-200/50">Nenhuma chatstory publicada ainda.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((s) => (
            <button
              key={s.id}
              onClick={() => navigateTo({ name: 'chatstory', slug: s.slug })}
              className="card group overflow-hidden border border-white/10 bg-ink-800/40 text-left transition hover:border-grape-400/40"
            >
              <div className="aspect-[3/4] w-full overflow-hidden bg-ink-900">
                {s.cover_url ? (
                  <img
                    src={s.cover_url}
                    alt={`Capa da chatstory ${s.title}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-grape-300/30">
                    <BookOpen size={32} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="font-display text-lg font-semibold text-grape-50">{s.title}</h2>
                <p className="mt-1 line-clamp-3 text-sm text-grape-200/60">{s.synopsis}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
