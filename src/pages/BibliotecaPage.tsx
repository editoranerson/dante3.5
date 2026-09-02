import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Library, Sparkles } from 'lucide-react';
import { supabase, type ArchivedChapter, type LibraryCategory } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { PageMeta } from '@/lib/seo';
import { AdSlot } from '@/components/AdSlot';

export function BibliotecaPage({ cat }: { cat?: string }) {
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [chapters, setChapters] = useState<ArchivedChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(cat ?? null);

  useEffect(() => {
    Promise.all([
      supabase
        .from('library_categories')
        .select('*')
        .order('sort_order', { ascending: true }),
      supabase
        .from('archived_chapters')
        .select('*')
        .order('chapter_number', { ascending: true }),
    ]).then(([c, ch]) => {
      const cats = (c.data as LibraryCategory[]) ?? [];
      setCategories(cats);
      setChapters((ch.data as ArchivedChapter[]) ?? []);
      setActive((prev) => prev ?? cats[0]?.slug ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (cat) setActive(cat);
  }, [cat]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === active) ?? null,
    [categories, active],
  );

  const visible = useMemo(() => {
    if (!activeCategory) return chapters.filter((c) => !c.category_id);
    return chapters.filter((c) => c.category_id === activeCategory.id);
  }, [chapters, activeCategory]);

  const selectCategory = (slug: string) => {
    setActive(slug);
    navigateTo({ name: 'biblioteca', cat: slug });
  };

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <PageMeta
        title={activeCategory ? `Biblioteca · ${activeCategory.name}` : 'Biblioteca'}
        description={
          activeCategory
            ? `Capítulos de ${activeCategory.name} no universo Querido Dante. Leia todos os capítulos arquivados.`
            : 'Todos os capítulos do universo Querido Dante, organizados por categoria.'
        }
      />
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Library size={14} className="text-rose-400" /> Biblioteca
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">Biblioteca</h1>
        <p className="mt-3 text-grape-100/70">
          Todos os capítulos do universo Dante, organizados por categoria.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCategory(c.slug)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active === c.slug
                  ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white shadow-glow'
                  : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {activeCategory?.description && (
        <div className="card mb-8 p-5 text-center text-sm text-grape-200/75">
          {activeCategory.description}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card mx-auto max-w-md p-10 text-center text-grape-200/60">
          <Sparkles size={32} className="mx-auto mb-3 text-grape-300/50" />
          Nenhum capítulo nesta categoria ainda.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((ch) => (
            <button
              key={ch.id}
              onClick={() =>
                navigateTo({
                  name: 'biblioteca_cap',
                  cat: activeCategory?.slug ?? 'geral',
                  slug: ch.slug || ch.id,
                })
              }
              className="card group flex flex-col gap-3 p-5 text-left transition hover:border-grape-400/40 hover:bg-white/5"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-sm font-bold text-grape-200">
                  {ch.chapter_number}
                </div>
                <BookOpen size={16} className="text-grape-300/50" />
              </div>
              <h3 className="font-display text-lg font-semibold text-grape-50 group-hover:text-white">
                {ch.title}
              </h3>
              <p className="line-clamp-3 text-sm text-grape-200/60">{ch.body}</p>
            </button>
          ))}
        </div>
      )}
      <AdSlot name="bibliotecaList" routeKey={active ?? "all"} />
    </div>
  );
}
