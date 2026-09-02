import { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { FaqEntry } from '@/lib/supabase';

export function FaqPage() {
  const [faqs, setFaqs] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('faq_entries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setFaqs((data as FaqEntry[]) ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-grape-500 to-rose-500">
          <HelpCircle size={28} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-grape-50 sm:text-4xl">
          Perguntas Frequentes
        </h1>
        <p className="mt-3 text-grape-200/60">
          Tudo o que você precisa saber sobre o Universo Querido Dante
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : faqs.length === 0 ? (
        <p className="text-center text-grape-200/50">Nenhuma pergunta cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.id}
              className="card overflow-hidden border border-white/10 bg-ink-800/40"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-white/5"
              >
                <span className="font-medium text-grape-50">{faq.question}</span>
                <ChevronDown
                  size={20}
                  className={`flex-shrink-0 text-grape-300 transition-transform duration-300 ${
                    openIndex === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`grid transition-all duration-300 ${
                  openIndex === i ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-5 pb-4 text-sm leading-relaxed text-grape-200/70">
                    {faq.answer}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
