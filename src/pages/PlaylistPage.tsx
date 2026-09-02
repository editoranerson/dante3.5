import { useEffect, useState } from 'react';
import { Music, Play, Sparkles, User2, ExternalLink } from 'lucide-react';
import { supabase, type Song } from '@/lib/supabase';
import { Modal } from '@/components/Modal';

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

export function PlaylistPage() {
  const [items, setItems] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Song | null>(null);

  useEffect(() => {
    supabase
      .from('songs')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as Song[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Music size={14} className="text-rose-400" /> Trilha Sonora
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Playlist
        </h1>
        <p className="mt-3 text-grape-100/70">
          Músicas ouvidas pelos personagens do Universo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-grape-200/60">
          <Sparkles size={32} className="mx-auto mb-3 text-grape-300/50" />
          Nenhuma música cadastrada ainda.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="card group flex items-center gap-4 p-4 text-left transition hover:border-grape-400/40 hover:bg-ink-700/40"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-grape-200 transition group-hover:scale-110">
                <Music size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{s.title}</p>
                <p className="truncate text-sm text-grape-200/60">{s.composition}</p>
              </div>
              <Play size={18} className="flex-shrink-0 text-grape-300/40 transition group-hover:text-rose-400" />
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-2xl">
        {selected && (
          <div>
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold text-grape-50">{selected.title}</h2>
              <p className="mt-1 text-sm text-rose-300">{selected.composition}</p>
              {selected.listener && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-grape-200/70">
                  <User2 size={14} /> Ouvinte: {selected.listener}
                </p>
              )}
            </div>
            {selected.youtube_url ? (
              youtubeId(selected.youtube_url) ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${youtubeId(selected.youtube_url)}`}
                    title={selected.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={selected.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full"
                >
                  <ExternalLink size={18} /> Ouvir no Site Oficial
                </a>
              )
            ) : (
              <p className="text-sm text-grape-200/50">Player indisponível.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
