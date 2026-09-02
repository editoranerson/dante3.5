import { useEffect, useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase, type Secret } from '@/lib/supabase';

export function SegredosPage() {
  const [items, setItems] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('secrets')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as Secret[]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Sparkles size={14} className="text-rose-400" /> Bastidores
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Segredos dos bastidores
        </h1>
        <p className="mt-3 text-grape-100/70">
          Curiosidades e segredos escondidos por trás do universo.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-grape-200/60">
          Nenhum segredo revelado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((s) => {
            const isOpen = open === s.id;
            return (
              <div key={s.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-white/5"
                >
                  <span className="font-display text-lg font-semibold text-grape-50">
                    {s.title}
                  </span>
                  <span className="flex-shrink-0 text-grape-300/60">
                    {isOpen ? <EyeOff size={20} /> : <Eye size={20} />}
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-white/10 px-5 py-4 text-grape-100/80">
                      {s.body.split('\n').map((p, i) => (
                        <p key={i} className="mb-2 last:mb-0">{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
