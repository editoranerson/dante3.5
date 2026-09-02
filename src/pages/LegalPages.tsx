import { useEffect, useState } from 'react';
import { supabase, type SiteContent } from '@/lib/supabase';
import { MarkdownBlock } from '@/components/Footer';
import { Sparkles } from 'lucide-react';

export function TermsPage() {
  return <ContentPage pageKey="terms_of_use" title="Termos de Uso" />;
}

export function PrivacyPage() {
  return <ContentPage pageKey="privacy_policy" title="Política de Privacidade" />;
}

function ContentPage({ pageKey, title }: { pageKey: string; title: string }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('*')
      .eq('key', pageKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setText((data as SiteContent).value);
        setLoading(false);
      });
  }, [pageKey]);

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <Sparkles size={14} className="text-rose-400" /> Legal
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50">{title}</h1>
      </div>
      <div className="card p-6 sm:p-8">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
          </div>
        ) : (
          <MarkdownBlock text={text} />
        )}
      </div>
    </div>
  );
}
