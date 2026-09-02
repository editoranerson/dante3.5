import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, MessagesSquare, RotateCcw } from 'lucide-react';
import {
  supabase,
  type Chatstory,
  type ChatstoryChapter,
  type ChatstoryCharacter,
  type ChatstoryElement,
} from '@/lib/supabase';
import { navigateTo } from '@/lib/router';
import { PageMeta, excerpt } from '@/lib/seo';
import { AdSlot } from '@/components/AdSlot';

export function ChatstoryReaderPage({ slug, cap }: { slug: string; cap: string }) {
  const [story, setStory] = useState<Chatstory | null>(null);
  const [chapter, setChapter] = useState<ChatstoryChapter | null>(null);
  const [chapters, setChapters] = useState<ChatstoryChapter[]>([]);
  const [elements, setElements] = useState<ChatstoryElement[]>([]);
  const [characters, setCharacters] = useState<ChatstoryCharacter[]>([]);
  const [visible, setVisible] = useState(1);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setVisible(1);

    (async () => {
      const { data: s } = await supabase
        .from('chatstories')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (cancelled) return;
      if (!s) {
        setStory(null);
        setLoading(false);
        return;
      }
      const st = s as Chatstory;
      setStory(st);

      const [{ data: chs }, { data: chars }] = await Promise.all([
        supabase
          .from('chatstory_chapters')
          .select('*')
          .eq('story_id', st.id)
          .eq('is_published', true)
          .order('sort_order', { ascending: true }),
        supabase.from('chatstory_characters').select('*').order('name', { ascending: true }),
      ]);
      if (cancelled) return;
      const list = (chs as ChatstoryChapter[]) ?? [];
      setChapters(list);
      setCharacters((chars as ChatstoryCharacter[]) ?? []);

      const ch = list.find((c) => c.slug === cap) ?? null;
      setChapter(ch);
      if (ch) {
        const { data: els } = await supabase
          .from('chatstory_elements')
          .select('*')
          .eq('chapter_id', ch.id)
          .order('sort_order', { ascending: true });
        if (cancelled) return;
        setElements((els as ChatstoryElement[]) ?? []);
      } else {
        setElements([]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, cap]);

  const charMap = useMemo(() => {
    const m: Record<string, ChatstoryCharacter> = {};
    characters.forEach((c) => (m[c.id] = c));
    return m;
  }, [characters]);

  const total = elements.length;
  const finished = visible >= total;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [visible]);

  const advance = () => {
    if (!finished) setVisible((v) => Math.min(v + 1, total));
  };

  const nextChapter = useMemo(() => {
    if (!chapter) return null;
    const i = chapters.findIndex((c) => c.id === chapter.id);
    return i >= 0 ? chapters[i + 1] ?? null : null;
  }, [chapters, chapter]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!story || !chapter) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-grape-50">Capítulo não encontrado</h1>
        <button onClick={() => navigateTo({ name: 'chatstorys' })} className="btn-ghost mt-6">
          <ArrowLeft size={16} /> Voltar
        </button>
      </div>
    );
  }

  // fallback: se o admin não definiu o lado, o primeiro personagem a falar fica à esquerda
  const firstSpeaker = elements.find((e) => e.kind === 'message')?.character_id ?? null;

  return (
    <div className="animate-fade-in mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <PageMeta
        title={`${chapter.title} — ${story.title}`}
        description={excerpt(
          elements.map((e) => e.content).join(' ') || story.synopsis,
        )}
        image={story.cover_url}
        type="article"
      />
      <button
        onClick={() => navigateTo({ name: 'chatstory', slug: story.slug })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-grape-200/60 hover:text-grape-50"
      >
        <ArrowLeft size={16} /> {story.title}
      </button>

      <div className="mb-4 flex items-center gap-2 text-grape-50">
        <MessagesSquare size={18} className="text-rose-400" />
        <h1 className="font-display text-xl font-semibold">{chapter.title}</h1>
      </div>

      <div
        onClick={advance}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') advance();
        }}
        className="chatstory-reader min-h-[60vh] cursor-pointer select-none space-y-4 rounded-2xl border border-white/10 bg-ink-900/50 p-4 sm:p-6"
      >
        {elements.slice(0, visible).map((el) => {
          if (el.kind === 'narration') {
            return (
              <p
                key={el.id}
                className="chatstory-narration animate-fade-in px-2 py-3 text-center text-sm italic leading-relaxed text-grape-200/70"
              >
                {el.content}
              </p>
            );
          }
          const c = el.character_id ? charMap[el.character_id] : undefined;
          const mine = el.side
            ? el.side === 'left'
            : Boolean(el.character_id && el.character_id === firstSpeaker);
          return (
            <div
              key={el.id}
              className={`animate-fade-in flex items-end gap-2 ${mine ? 'justify-start' : 'flex-row-reverse'}`}
            >
              <div className="chatstory-avatar h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-white/10 bg-ink-700">
                {c?.avatar_url ? (
                  <img src={c.avatar_url} alt={c.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="chatstory-avatar-text flex h-full w-full items-center justify-center text-xs font-bold text-grape-200/70">
                    {(c?.name ?? '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className={`max-w-[78%] ${mine ? 'text-left' : 'text-right'}`}>
                <span className="chatstory-char-name mb-1 block text-xs font-semibold text-grape-200/60">{c?.name ?? 'Alguém'}</span>
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-white ${
                    mine
                      ? 'chatstory-bubble-left rounded-bl-sm bg-white/10'
                      : 'chatstory-bubble-right rounded-br-sm bg-gradient-to-br from-grape-500 to-rose-500'
                  }`}
                >
                  {el.content}
                </div>
              </div>
            </div>
          );
        })}

        {total === 0 && <p className="chatstory-narration text-center text-grape-200/50">Este capítulo ainda não tem conteúdo.</p>}

        <div ref={endRef} />

        {!finished && total > 0 && (
          <div className="pt-2 text-center text-xs text-grape-200/40">
            <ChevronDown size={16} className="mx-auto animate-bounce" />
            Toque para continuar ({visible}/{total})
          </div>
        )}
      </div>

      {/* Fallback de texto: transcrição completa no DOM para crawlers (Googlebot / AdSense),
          já que a leitura interativa revela as falas por toque. */}
      <article className="sr-only">
        <h2>{`${chapter.title} — ${story.title}`}</h2>
        {elements.map((el) => {
          const c = el.character_id ? charMap[el.character_id] : undefined;
          return (
            <p key={`t-${el.id}`}>
              {el.kind === 'narration' ? el.content : `${c?.name ?? 'Alguém'}: ${el.content}`}
            </p>
          );
        })}
      </article>

      <AdSlot name="chatstoryReader" routeKey={chapter.id} />

      {finished && total > 0 && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => setVisible(1)} className="btn-ghost">
            <RotateCcw size={16} /> Reler
          </button>
          {nextChapter && (
            <button
              onClick={() => navigateTo({ name: 'chatstory_cap', slug: story.slug, cap: nextChapter.slug })}
              className="btn-primary"
            >
              Próximo capítulo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
