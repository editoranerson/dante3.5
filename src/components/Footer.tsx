import { Sparkles, FileText, ShieldCheck, Info, Mail, HelpCircle } from 'lucide-react';
import { navigateTo } from '@/lib/router';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-rose-400" />
            <span className="font-display text-lg font-semibold text-grape-50">
              Universo Querido Dante
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-grape-200/70">
            <button
              onClick={() => navigateTo({ name: 'sobre' })}
              className="inline-flex items-center gap-1.5 hover:text-grape-50"
            >
              <Info size={15} /> Sobre
            </button>
            <button
              onClick={() => navigateTo({ name: 'contato' })}
              className="inline-flex items-center gap-1.5 hover:text-grape-50"
            >
              <Mail size={15} /> Contato
            </button>
            <button
              onClick={() => navigateTo({ name: 'terms' })}
              className="inline-flex items-center gap-1.5 hover:text-grape-50"
            >
              <FileText size={15} /> Termos de Uso
            </button>
            <button
              onClick={() => navigateTo({ name: 'privacy' })}
              className="inline-flex items-center gap-1.5 hover:text-grape-50"
            >
              <ShieldCheck size={15} /> Política de Privacidade
            </button>
            <button
              onClick={() => navigateTo({ name: 'faq' })}
              className="inline-flex items-center gap-1.5 hover:text-grape-50"
            >
              <HelpCircle size={15} /> FAQ
            </button>
          </div>

          <p className="max-w-md text-sm italic text-grape-200/50">
            Anerson Pereira — Mente vazia, oficina de desocupado.
          </p>

          <button
            onClick={() => navigateTo({ name: 'home' })}
            className="text-xs text-grape-200/40 hover:text-grape-200/70"
          >
            Voltar ao topo
          </button>
        </div>
      </div>

    </footer>
  );
}

export function MarkdownBlock({ text }: { text: string }) {
  const lines = (text || '').split('\n');
  const elements: React.ReactNode[] = [];
  let list: Array<{ num?: string; content: string }> = [];
  let listType: 'ol' | 'ul' | null = null;

  const flushList = () => {
    if (!list.length) return;
    if (listType === 'ol') {
      const items = list.map((li, i) => (
        <li key={i} value={li.num ? Number(li.num) : undefined}>{li.content}</li>
      ));
      elements.push(<ol key={elements.length}>{items}</ol>);
    } else {
      const items = list.map((li, i) => (
        <li key={i}>{li.content}</li>
      ));
      elements.push(<ul key={elements.length}>{items}</ul>);
    }
    list = [];
    listType = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      return;
    }
    const h1 = line.match(/^#\s+(.*)/);
    const h2 = line.match(/^##\s+(.*)/);
    const ol = line.match(/^(\d+)\.\s+(.*)/);
    const ul = line.match(/^[-*]\s+(.*)/);
    if (h1) {
      flushList();
      elements.push(<h1 key={idx}>{h1[1]}</h1>);
    } else if (h2) {
      flushList();
      elements.push(<h2 key={idx}>{h2[1]}</h2>);
    } else if (ol) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      list.push({ num: ol[1], content: ol[2] });
    } else if (ul) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      list.push({ content: ul[1] });
    } else {
      flushList();
      elements.push(<p key={idx}>{line}</p>);
    }
  });
  flushList();

  return <div className="prose-md">{elements}</div>;
}
