import { useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { supabase, type SiteContent } from '@/lib/supabase';
import { MarkdownBlock } from '@/components/Footer';

export function SobrePage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('*')
      .eq('key', 'about')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setContent((data as SiteContent).value);
        setLoading(false);
      });
  }, []);

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Info size={14} className="text-rose-400" /> Sobre
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Sobre o Universo Dante
        </h1>
      </div>
      <div className="card p-6 sm:p-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
          </div>
        ) : content ? (
          <MarkdownBlock text={content} />
        ) : (
          <p className="text-center text-grape-200/50">
            Conteúdo em breve.
          </p>
        )}
      </div>
    </div>
  );
}
