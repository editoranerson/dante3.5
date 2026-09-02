import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Rocket, LogIn, UserPlus, Coins, FlaskConical, Moon, Power } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { navigateTo } from '@/lib/router';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/supabase';
import { fetchDanteBreaks, findActiveBreak, type DanteBreak } from '@/lib/danteBreaks';
import { fetchDantePower, type DantePowerState } from '@/lib/dantePower';

interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const DANTE_GRADIENT = 'linear-gradient(135deg, #7F00FF, #FF007F)';

function Sarcasmometer({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, score));
  const gradient = 'linear-gradient(to right, #38BDF8, #B5E853, #FFC226, #FF8C42, #EF4444)';
  return (
    <div className="mt-1.5 flex items-center gap-1.5" aria-hidden="true">
      <div className="relative h-2 flex-1 overflow-hidden rounded-full" style={{ background: gradient }}>
        <div
          className="absolute top-1/2 -translate-y-1/2 text-xs leading-none transition-all duration-500 ease-out"
          style={{ left: `calc(${clamped}% - 8px)` }}
        >
          ⚡
        </div>
      </div>
    </div>
  );
}

export function DanteChat() {
  const { user, profile, isAdmin, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [breaks, setBreaks] = useState<DanteBreak[]>([]);
  const [activeBreak, setActiveBreak] = useState<DanteBreak | null>(null);
  const [powerState, setPowerState] = useState<DantePowerState>({ enabled: true, message: '' });
  const [sarcasmScore, setSarcasmScore] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      const rows = (data as ChatMessage[]).reverse();
      rows.sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        if (ta !== tb) return ta - tb;
        return a.role === 'user' ? -1 : 1;
      });
      setMessages(
        rows.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
        })),
      );
    }
  }, [user]);

  const historyLoadedRef = useRef(false);

  useEffect(() => {
    if (open && user) {
      if (!historyLoadedRef.current) {
        loadHistory();
        historyLoadedRef.current = true;
      }
      if (profile) setCredits(profile.credits ?? 0);
    }
    if (!open) {
      historyLoadedRef.current = false;
    }
  }, [open, user, profile, loadHistory]);

  useEffect(() => {
    if (!open || isAdmin) return;
    let cancelled = false;
    fetchDanteBreaks(true).then((rows) => {
      if (!cancelled) setBreaks(rows);
    });
    fetchDantePower().then((s) => {
      if (!cancelled) setPowerState(s);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      setActiveBreak(null);
      return;
    }
    const update = () => setActiveBreak(findActiveBreak(breaks));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [breaks, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const powerOff = !isAdmin && !powerState.enabled;

  const sendMessage = async () => {
    if (!input.trim() || loading || !user || activeBreak || powerOff) return;

    const userMsg: UIMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setSarcasmScore(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast('Sessão expirada. Faça login novamente.', 'error');
        return;
      }

      const now = new Date();
      const fmtDate = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(now);
      const fmtTime = new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(now);
      const weekday = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(now);
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const apiUrl = `${SUPABASE_URL}/functions/v1/chat-dante`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          message: userMsg.content,
          client_datetime: {
            iso: now.toISOString(),
            date: fmtDate,
            time: fmtTime,
            weekday,
            timezone: timeZone,
            context: `Hoje é ${fmtDate} (${weekday}), horário local: ${fmtTime} (fuso ${timeZone}).`,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error('[DanteChat] Edge function error:', res.status, errText);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          { id: `err-${Date.now()}`, role: 'assistant', content: `Erro (${res.status}): Falha na conexão com o Dante.` },
        ]);
        return;
      }

      const data = await res.json();

      if (data.error === 'no_credits') {
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        toast('Você não tem Créditos suficientes. Visite a Loja de Recompensas para comprar mais!', 'error');
        setCredits(0);
        return;
      }

      if (data.error) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== userMsg.id),
          { id: `err-${Date.now()}`, role: 'assistant', content: `Erro: ${data.error}` },
        ]);
        return;
      }

      const aiMsg: UIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (typeof data.sarcasm_score === 'number' && !Number.isNaN(data.sarcasm_score)) {
        setSarcasmScore(Math.max(0, Math.min(100, Math.round(data.sarcasm_score))));
      } else {
        setSarcasmScore(0);
      }

      if (typeof data.credits === 'number') {
        setCredits(data.credits);
        await refreshProfile();
      }
    } catch (error) {
      console.error('[DanteChat] Connection error:', error);
      const errMsg = error instanceof Error ? error.message : String(error);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== userMsg.id),
        { id: `err-${Date.now()}`, role: 'assistant', content: `Erro de conexão: ${errMsg}` },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleButtonClick = () => {
    if (user) {
      setOpen(true);
    } else {
      setShowLoginPrompt(true);
    }
  };

  const creditsLabel = isAdmin ? 'Ilimitado (Admin)' : `${credits} Crédito${credits === 1 ? '' : 's'}`;

  return (
    <>
      {!open && (
        <button
          onClick={handleButtonClick}
          className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl transition-transform hover:scale-110 active:scale-95"
          aria-label="Conversar com o Dante"
        >
          <span className="absolute inset-0 rounded-full p-[3px] dante-border-glow">
            <span className="block h-full w-full rounded-full bg-white" />
          </span>
          <span className="relative z-10 flex h-full w-full items-center justify-center text-2xl font-bold gradient-dante-text">∞</span>
        </button>
      )}

      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowLoginPrompt(false)}
          />
          <div className="relative z-10 w-full max-w-sm card bg-ink-800/95 p-6 animate-scale-in text-center">
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl font-bold"
              style={{ background: DANTE_GRADIENT }}
            >
              <span className="text-white">∞</span>
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-grape-50">
              Converse com o Dante
            </h3>
            <p className="mb-6 text-sm text-grape-200/70">
              O Dante está esperando para conversar com você! Faça login ou crie uma conta para começar.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigateTo({ name: 'login' });
                }}
                className="btn-primary w-full"
              >
                <LogIn size={18} /> Fazer Login
              </button>
              <button
                onClick={() => {
                  setShowLoginPrompt(false);
                  navigateTo({ name: 'signup' });
                }}
                className="btn-ghost w-full"
              >
                <UserPlus size={18} /> Criar Conta
              </button>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="text-sm text-grape-200/50 hover:text-grape-200"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-6 sm:items-end">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div className="dante-chat-window relative z-10 flex h-[100dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-ink-900/95 shadow-2xl animate-slide-up sm:h-auto sm:rounded-2xl">
            {/* Header */}
            <div className="dante-chat-bar flex items-center justify-between border-b border-white/10 bg-ink-800/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ background: DANTE_GRADIENT }}
                >
                  ∞
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-display text-base font-semibold text-grape-50">
                    Dante
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-grape-200/80">
                      <FlaskConical size={10} /> beta
                    </span>
                  </h3>
                  <p className="flex items-center gap-1 text-xs text-grape-200/60">
                    <Coins size={12} className="text-gold-400" />
                    {creditsLabel}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {activeBreak && (
                <div className="mb-2 flex flex-col items-center rounded-2xl border border-white/10 bg-ink-700/50 px-4 py-5 text-center">
                  <Moon size={22} className="mb-2 text-grape-300" />
                  <p className="text-sm text-grape-200/80">{activeBreak.message}</p>
                </div>
              )}
              {powerOff && (
                <div className="mb-2 flex flex-col items-center rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-5 text-center">
                  <Power size={22} className="mb-2 text-rose-300" />
                  {powerState.message ? (
                    <ReactMarkdown
                      components={{
                        p: ({ node, ...props }) => <p className="m-0 text-sm text-rose-100/90" {...props} />,
                      }}
                    >
                      {powerState.message}
                    </ReactMarkdown>
                  ) : (
                    <p className="text-sm text-rose-100/90">O Dante está offline no momento.</p>
                  )}
                </div>
              )}

              {messages.length === 0 && !loading && !activeBreak && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div
                    className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
                    style={{ background: DANTE_GRADIENT }}
                  >
                    ∞
                  </div>
                  <p className="text-sm text-grape-200/60">
                    Olá! Sou o Dante. Como posso te ajudar hoje?
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ background: DANTE_GRADIENT }}
                    >
                      ∞
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                        : 'dante-chat-bubble dante-bubble-border bg-ink-700/60 text-grape-50'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ node, ...props }) => <p className="m-0" {...props} />,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2.5 justify-start">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
                    style={{ background: DANTE_GRADIENT }}
                  >
                    ∞
                  </div>
                  <div className="dante-bubble-border flex flex-col gap-1 rounded-2xl bg-ink-700/60 px-4 py-2.5">
                    <div className="flex items-center">
                      <span className="text-sm text-grape-200/60">Dante está pensando</span>
                      <span className="ml-1 flex gap-0.5">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-grape-300 [animation-delay:300ms]" />
                      </span>
                    </div>
                    {sarcasmScore !== null && <Sarcasmometer score={sarcasmScore} />}
                  </div>
                </div>
              )}

              {!loading && sarcasmScore !== null && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-8 flex-shrink-0" />
                  <div className="max-w-[75%] flex-1">
                    <Sarcasmometer score={sarcasmScore} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="dante-chat-bar border-t border-white/10 bg-ink-800/80 p-3">
              {activeBreak && (
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-white/10 bg-ink-700/50 px-3 py-2 text-xs text-grape-200/70">
                  <Moon size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{activeBreak.message}</span>
                </div>
              )}
              {powerOff && (
                <div className="mb-2 flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200/80">
                  <Power size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    {powerState.message
                      ? powerState.message.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\[(.+?)\]\((.+?)\)/g, '$1')
                      : 'O Dante está offline no momento.'}
                  </span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    const isTouch =
                      typeof window !== 'undefined' &&
                      window.matchMedia('(pointer: coarse)').matches;
                    if (e.key === 'Enter' && !e.shiftKey && !isTouch) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={loading || !!activeBreak || powerOff}
                  placeholder={activeBreak || powerOff ? 'Dante indisponível no momento...' : 'Escreva sua mensagem...'}
                  rows={1}
                  className={`dante-chat-input flex-1 resize-none rounded-2xl border border-white/10 bg-ink-700/60 px-4 py-2.5 text-sm text-grape-50 placeholder:text-grape-200/40 outline-none transition ${activeBreak || powerOff ? 'cursor-not-allowed opacity-50' : ''}`}
                  style={{ maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim() || !!activeBreak || powerOff}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white transition disabled:opacity-50"
                  style={{ background: DANTE_GRADIENT }}
                  aria-label="Enviar"
                >
                  <Rocket size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
