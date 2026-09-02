import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';

interface DiagResult {
  step: string;
  ok: boolean;
  detail: string;
}

function extractRef(url: string): string {
  const m = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  return m ? m[1] : 'unknown';
}

export function DiagPage() {
  const { toast } = useToast();
  const [results, setResults] = useState<DiagResult[]>([]);
  const [running, setRunning] = useState(false);
  const [testEmail, setTestEmail] = useState('diag_test@test.com');
  const [testPassword, setTestPassword] = useState('DiagTest123!');

  const add = (r: DiagResult) => setResults((prev) => [...prev, r]);

  const runDiag = async () => {
    setRunning(true);
    setResults([]);
    const url = 'https://kpplssyiehosifuejobr.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcGxzc3lpZWhvc2lmdWVqb2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3OTAwOTUsImV4cCI6MjEwMTM2NjA5NX0.lFhMcypc7raL_LiBMdYsxbKPgK29tso0sDwwg-MOaVc';
    const clientRef = extractRef(url);

    // 1. Check env vars
    add({
      step: '1. Variáveis de ambiente (cliente)',
      ok: !!url && !!anonKey,
      detail: `URL: ${url || 'AUSENTE'}\nProject Ref: ${clientRef}\nAnon Key: ${anonKey ? anonKey.slice(0, 20) + '...' : 'AUSENTE'}`,
    });

    // 2. Decode JWT
    try {
      const parts = anonKey.split('.');
      const payload = JSON.parse(atob(parts[1]));
      const iat = new Date(payload.iat * 1000);
      const exp = new Date(payload.exp * 1000);
      const now = new Date();
      const expired = now > exp;
      add({
        step: '2. Decodificar anon key (JWT)',
        ok: !expired,
        detail: `role: ${payload.role}\nref: ${payload.ref}\niat: ${iat.toISOString()}\nexp: ${exp.toISOString()}\nnow: ${now.toISOString()}\nexp == iat: ${payload.iat === payload.exp}\nexpired: ${expired}`,
      });
    } catch (e) {
      add({ step: '2. Decodificar anon key', ok: false, detail: `Erro: ${e}` });
    }

    // 3. Test signUp
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });
      add({
        step: '3. signUp() (cliente)',
        ok: !error,
        detail: error
          ? `ERRO\nname: ${error.name}\nmessage: ${error.message}\nstatus: ${error.status}`
          : `OK\nuser_id: ${data.user?.id || 'null'}\nsession: ${!!data.session}\nemail_confirmed: ${data.user?.email_confirmed_at || 'null'}`,
      });
    } catch (e: any) {
      add({ step: '3. signUp() (cliente)', ok: false, detail: `Exception: ${e?.message || e}` });
    }

    // 4. Test signIn with admin credentials
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'qrddante@proton.me',
        password: 'D4nt3admin',
      });
      add({
        step: '4. signInWithPassword() [admin] (cliente)',
        ok: !error,
        detail: error
          ? `ERRO\nname: ${error.name}\nmessage: ${error.message}\nstatus: ${error.status}`
          : `OK\nuser_id: ${data.user?.id || 'null'}\nsession: ${!!data.session}`,
      });
    } catch (e: any) {
      add({ step: '4. signInWithPassword() (cliente)', ok: false, detail: `Exception: ${e?.message || e}` });
    }

    // 5. Test basic DB query (profiles select)
    try {
      const { data, error } = await supabase.from('profiles').select('id, role').limit(1);
      add({
        step: '5. Query profiles (anon)',
        ok: !error,
        detail: error
          ? `ERRO: ${error.message}`
          : `OK - ${data?.length || 0} rows`,
      });
    } catch (e: any) {
      add({ step: '5. Query profiles', ok: false, detail: `Exception: ${e?.message || e}` });
    }

    // 6. Test public query (characters)
    try {
      const { data, error } = await supabase.from('characters').select('id').limit(1);
      add({
        step: '6. Query characters (public, anon)',
        ok: !error,
        detail: error
          ? `ERRO: ${error.message}`
          : `OK - ${data?.length || 0} rows`,
      });
    } catch (e: any) {
      add({ step: '6. Query characters', ok: false, detail: `Exception: ${e?.message || e}` });
    }

    setRunning(false);
    toast('Diagnóstico concluído.', 'info');
  };

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 font-display text-3xl font-semibold text-grape-50">
        Diagnóstico de Autenticação
      </h1>
      <p className="mb-6 text-sm text-grape-200/60">
        Executa testes passo a passo para identificar onde o fluxo de autenticação falha.
      </p>

      <div className="card mb-6 p-5">
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">E-mail de teste (signUp)</label>
            <input className="input" value={testEmail} onChange={(e) => setTestEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">Senha de teste</label>
            <input className="input" value={testPassword} onChange={(e) => setTestPassword(e.target.value)} />
          </div>
        </div>
        <button onClick={runDiag} disabled={running} className="btn-primary w-full">
          {running ? 'Executando...' : 'Executar Diagnóstico'}
        </button>
      </div>

      <div className="space-y-3">
        {results.map((r, i) => (
          <div
            key={i}
            className={`card overflow-hidden border-l-4 ${
              r.ok ? 'border-l-mint-500' : 'border-l-rose-500'
            }`}
          >
            <div className="flex items-center gap-3 p-4">
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  r.ok ? 'bg-mint-500/20 text-mint-400' : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {r.ok ? 'OK' : 'X'}
              </span>
              <span className="font-semibold text-grape-50">{r.step}</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap border-t border-white/10 bg-ink-950/50 p-4 text-xs text-grape-100/70">
              {r.detail}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
