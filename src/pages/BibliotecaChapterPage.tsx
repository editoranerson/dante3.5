import { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Library } from 'lucide-react';
import { supabase, type ArchivedChapter, type LibraryCategory } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { PageMeta, excerpt } from '@/lib/seo';
import { AdSlot } from '@/components/AdSlot';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function BibliotecaChapterPage({ cat, slug }: { cat: string; slug: string }) {
  const [chapter, setChapter] = useState<ArchivedChapter | null>(null);
  const [category, setCategory] = useState<LibraryCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const query = UUID.test(slug)
      ? supabase.from('archived_chapters').select('*').eq('id', slug)
      : supabase.from('archived_chapters').select('*').eq('slug', slug);

    query.maybeSingle().then(async ({ data, error }) => {
      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const ch = data as ArchivedChapter;
      setChapter(ch);
      if (ch.category_id) {
        const { data: c } = await supabase
          .from('library_categories')
          .select('*')
          .eq('id', ch.category_id)
          .maybeSingle();
        if (c) setCategory(c as LibraryCategory);
      }
      setLoading(false);
    });
  }, [slug]);

  const back = () => navigateTo({ name: 'biblioteca', cat: category?.slug ?? cat });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (notFound || !chapter) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <Library size={40} className="mx-auto mb-4 text-grape-300/50" />
        <h1 className="font-display text-2xl font-semibold text-grape-50">
          Capítulo não encontrado
        </h1>
        <button onClick={back} className="btn-ghost mt-6">
          <ArrowLeft size={16} /> Voltar à Biblioteca
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageMeta
        title={`${chapter.title} — Capítulo ${chapter.chapter_number}`}
        description={excerpt(chapter.body)}
        type="article"
      />
      <button
        onClick={back}
        className="mb-6 inline-flex items-center gap-2 text-sm text-grape-200/70 transition hover:text-grape-50"
      >
        <ArrowLeft size={16} /> Voltar à Biblioteca
      </button>

      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Library size={14} className="text-rose-400" /> {category?.name ?? 'Biblioteca'}
        </div>
        <div className="mb-2 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-lg font-bold text-grape-200">
            {chapter.chapter_number}
          </div>
          <BookOpen size={20} className="text-grape-300/50" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-grape-50 sm:text-4xl">
          {chapter.title}
        </h1>
      </div>

      <article className="card p-6 sm:p-8">
        <div className="prose-md leading-relaxed text-grape-100/90">
          {(chapter.body ?? '')
            .split(/\n{2,}/)
            .map((para, i) => (
              <p key={i} className="mb-4 whitespace-pre-wrap last:mb-0">
                {para}
              </p>
            ))}
        </div>
      </article>

      <AdSlot name="bibliotecaChapter" routeKey={chapter.id} />
    </div>
  );
}
