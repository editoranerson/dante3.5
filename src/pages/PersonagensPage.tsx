import { useEffect, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';
import { supabase, type Character } from '@/lib/supabase';
import { Modal } from '@/components/Modal';

export function PersonagensPage() {
  const [items, setItems] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    supabase
      .from('characters')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as Character[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <BookOpen size={14} className="text-rose-400" /> Estante Virtual
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Personagens
        </h1>
        <p className="mt-3 text-grape-100/70">
          Clique em uma capa para conhecer cada personagem do universo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center text-grape-200/60">
          <Sparkles size={32} className="mx-auto mb-3 text-grape-300/50" />
          Nenhum personagem cadastrado ainda.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {items.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group flex flex-col items-center"
            >
              <div className="book-3d relative aspect-[3/4] w-full overflow-hidden rounded-r-lg rounded-l-sm border-l-[6px] border-grape-700/60">
                {c.photo_url ? (
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grape-600/40 to-rose-600/40">
                    <Sparkles size={28} className="text-grape-200/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-center sm:p-3">
                  <p className="font-display text-xs font-semibold text-white drop-shadow-lg sm:text-sm">
                    {c.name}
                  </p>
                </div>
              </div>
              <span className="mt-2 truncate text-xs font-medium text-grape-200/70 group-hover:text-grape-50 sm:mt-3 sm:text-sm">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} maxWidth="max-w-2xl">
        {selected && (
          <div>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row">
              {selected.photo_url && (
                <img
                  src={selected.photo_url}
                  alt={selected.name}
                  className="h-40 w-32 flex-shrink-0 rounded-xl object-cover shadow-lg"
                />
              )}
              <div>
                <h2 className="font-display text-2xl font-semibold text-grape-50">{selected.name}</h2>
                <p className="mt-1 text-sm text-rose-300">Personagem do Universo Dante</p>
              </div>
            </div>
            <div className="prose-md">
              {selected.presentation.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
