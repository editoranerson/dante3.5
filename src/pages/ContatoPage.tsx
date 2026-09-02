import { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare, Send, User } from 'lucide-react';
import { supabase, type SiteContent } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { MarkdownBlock } from '@/components/Footer';

export function ContatoPage() {
  const { toast } = useToast();
  const [info, setInfo] = useState('');
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from('site_content')
      .select('*')
      .eq('key', 'contact_info')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setInfo((data as SiteContent).value);
        setLoadingInfo(false);
      });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast('Preencha nome, e-mail e mensagem.', 'error');
      return;
    }
    setSending(true);
    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      message: form.message.trim(),
    });
    setSending(false);
    if (error) {
      toast('Erro ao enviar mensagem. Tente novamente.', 'error');
      return;
    }
    toast('Mensagem enviada com sucesso!', 'success');
    setForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="animate-fade-in mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-10 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <MessageSquare size={14} className="text-rose-400" /> Contato
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">
          Fale Conosco
        </h1>
        <p className="mt-3 text-grape-100/70">
          Tem dúvidas, sugestões ou precisa de suporte? Envie uma mensagem.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="card p-6 sm:p-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">
            Envie sua mensagem
          </h2>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
                <input
                  className="input pl-10"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Seu nome"
                />
              </div>
            </div>
            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
                <input
                  type="email"
                  className="input pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>
            </div>
            <div>
              <label className="label">Telefone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-grape-300/60" />
                <input
                  className="input pl-10"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div>
              <label className="label">Mensagem</label>
              <textarea
                className="input min-h-[120px] resize-y"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Escreva sua mensagem..."
              />
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              <Send size={16} /> {sending ? 'Enviando...' : 'Enviar Mensagem'}
            </button>
          </form>
        </div>

        <div className="card p-6 sm:p-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">
            Informações
          </h2>
          {loadingInfo ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
            </div>
          ) : info ? (
            <MarkdownBlock text={info} />
          ) : (
            <p className="text-sm text-grape-200/50">
              Entre em contato através do formulário ao lado. Respondemos o mais breve possível.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
