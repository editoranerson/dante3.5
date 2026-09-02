import { useCallback, useEffect, useState } from 'react';
import { Power } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { fetchDantePower, setDantePower, type DantePowerState } from '@/lib/dantePower';

export function PowerAdmin() {
  const { toast } = useToast();
  const [state, setState] = useState<DantePowerState>({ enabled: true, message: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const s = await fetchDantePower();
    setState(s);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    setSaving(true);
    const next: DantePowerState = {
      enabled: !state.enabled,
      message: state.message,
    };
    const ok = await setDantePower(next);
    setSaving(false);
    if (!ok) {
      toast('Erro ao salvar.', 'error');
      return;
    }
    setState(next);
    toast(next.enabled ? 'Dante ligado.' : 'Dante desligado.', 'success');
  };

  const saveMessage = async () => {
    setSaving(true);
    const ok = await setDantePower(state);
    setSaving(false);
    if (!ok) {
      toast('Erro ao salvar mensagem.', 'error');
      return;
    }
    toast('Mensagem salva.', 'success');
  };

  if (loading) {
    return <p className="text-sm text-grape-200/60">Carregando...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-grape-50">Power do Dante</h2>
        <p className="text-sm text-grape-200/60">
          Desligue o chat para usuários comuns. Admins continuam conseguindo conversar
          normalmente. A conexão com a IA não é afetada.
        </p>
      </div>

      <div
        className={`card flex items-center justify-between gap-4 p-5 transition ${
          state.enabled ? 'border-mint-500/30 bg-mint-500/5' : 'border-rose-500/30 bg-rose-500/5'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              state.enabled
                ? 'bg-mint-500/20 text-mint-400'
                : 'bg-rose-500/20 text-rose-300'
            }`}
          >
            <Power size={24} />
          </div>
          <div>
            <p className="font-semibold text-grape-50">
              {state.enabled ? 'Dante Online' : 'Dante Offline'}
            </p>
            <p className="text-xs text-grape-200/60">
              {state.enabled
                ? 'Usuários podem enviar mensagens normalmente.'
                : 'Usuários não podem enviar mensagens.'}
            </p>
          </div>
        </div>
        <button
          onClick={toggle}
          disabled={saving}
          className={`flex-shrink-0 rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
            state.enabled
              ? 'border border-rose-400/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20'
              : 'bg-gradient-to-r from-mint-500 to-sky2-500 text-white hover:opacity-90'
          }`}
        >
          {saving ? 'Salvando...' : state.enabled ? 'Desligar' : 'Ligar'}
        </button>
      </div>

      <div className="card space-y-3 p-5">
        <div>
          <label className="label">Mensagem exibida quando offline</label>
          <p className="mb-2 text-xs text-grape-200/50">
            Suporta <strong>negrito</strong> e [link](https://exemplo.com).
          </p>
          <textarea
            className="input min-h-[100px] resize-y"
            value={state.message}
            onChange={(e) => setState({ ...state, message: e.target.value })}
            placeholder="Ex: O Dante está descansando agora. Volte mais tarde!"
          />
        </div>
        <button onClick={saveMessage} disabled={saving} className="btn-primary">
          Salvar mensagem
        </button>
      </div>
    </div>
  );
}
