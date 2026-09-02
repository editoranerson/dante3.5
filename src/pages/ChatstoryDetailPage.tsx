import { useEffect, useState } from 'react';
import { ArrowLeft, MessagesSquare, Play } from 'lucide-react';
import { supabase, type Chatstory, type ChatstoryChapter } from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { PageMeta, excerpt } from '@/lib/seo';
import { AdSlot } from '@/components/AdSlot';

export function ChatstoryDetailPage({ slug }: { slug: string }) {
  const [story, setStory] = useState<Chatstory | null>(null);
  const [chapters, setChapters] = useState<ChatstoryChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('chatstories')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) {
          setStory(null);
          setLoading(false);
          return;
        }
        const s = data as Chatstory;
        setStory(s);
        const { data: chs } = await supabase
          .from('chatstory_chapters')
          .select('*')
          .eq('story_id', s.id)
          .eq('is_published', true)
          .order('sort_order', { ascending: true });
        setChapters((chs as ChatstoryChapter[]) ?? []);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-grape-50">Chatstory não encontrada</h1>
        <button onClick={() => navigateTo({ name: 'chatstorys' })} className="btn-ghost mt-6">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageMeta
        title={story.title}
        description={excerpt(story.synopsis)}
        image={story.cover_url}
        type="article"
      />
      <button
        onClick={() => navigateTo({ name: 'chatstorys' })}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-grape-200/60 hover:text-grape-50"
      >
        <ArrowLeft size={16} /> Todas as chatstories
      </button>

      <div className="grid gap-6 sm:grid-cols-[220px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
          {story.cover_url ? (
            <img src={story.cover_url} alt={`Capa de ${story.title}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-grape-300/30">
              <MessagesSquare size={32} />
            </div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-grape-50">{story.title}</h1>
          <article className="mt-3 text-grape-100/70">
            {(story.synopsis ?? '').split(/\n{2,}/).map((para, i) => (
              <p key={i} className="mb-3 whitespace-pre-wrap last:mb-0">
                {para}
              </p>
            ))}
          </article>
        </div>
      </div>

      <AdSlot name="chatstoryDetail" routeKey={story.id} />

      <h2 className="mb-3 mt-10 font-display text-xl font-semibold text-grape-50">Capítulos</h2>
      {chapters.length === 0 ? (
        <p className="text-grape-200/50">Nenhum capítulo publicado ainda.</p>
      ) : (
        <div className="space-y-3">
          {chapters.map((c, i) => (
            <button
              key={c.id}
              onClick={() => navigateTo({ name: 'chatstory_cap', slug: story.slug, cap: c.slug })}
              className="card flex w-full items-center justify-between border border-white/10 bg-ink-800/40 p-4 text-left transition hover:border-grape-400/40"
            >
              <span className="font-medium text-grape-50">
                {i + 1}. {c.title}
              </span>
              <Play size={16} className="text-rose-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
