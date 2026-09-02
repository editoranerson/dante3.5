import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Moon, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import {
  fetchDanteBreaks,
  findActiveBreak,
  WEEKDAY_LABELS,
  type DanteBreak,
} from '@/lib/danteBreaks';

const EMPTY = {
  name: '',
  start_time: '22:00',
  end_time: '07:00',
  days: [0, 1, 2, 3, 4, 5, 6] as number[],
  message: 'O Dante está descansando agora. Volte mais tarde para conversarmos!',
  is_active: true,
};

export function BreaksAdmin() {
  const { toast } = useToast();
  const [breaks, setBreaks] = useState<DanteBreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DanteBreak | null>(null);
  const [form, setForm] = useState({ ...EMPTY });

  const load = useCallback(async () => {
    setLoading(true);
    setBreaks(await fetchDanteBreaks());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const openEdit = (b: DanteBreak) => {
    setEditing(b);
    setForm({
      name: b.name,
      start_time: b.start_time.slice(0, 5),
      end_time: b.end_time.slice(0, 5),
      days: b.days?.length ? b.days : [0, 1, 2, 3, 4, 5, 6],
      message: b.message,
      is_active: b.is_active,
    });
    setOpen(true);
  };

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d].sort(),
    }));

  const save = async () => {
    if (!form.name.trim() || !form.message.trim()) {
      toast('Preencha nome e mensagem.', 'error');
      return;
    }
    if (form.days.length === 0) {
      toast('Selecione ao menos um dia da semana.', 'error');
      return;
    }
    const payload = {
      name: form.name.trim(),
      start_time: form.start_time,
      end_time: form.end_time,
      days: form.days,
      message: form.message.trim(),
      is_active: form.is_active,
    };
    const { error } = editing
      ? await supabase.from('dante_breaks').update(payload).eq('id', editing.id)
      : await supabase.from('dante_breaks').insert(payload);
    if (error) {
      toast(`Erro ao salvar: ${error.message}`, 'error');
      return;
    }
    toast(editing ? 'Intervalo atualizado.' : 'Intervalo criado.', 'success');
    setOpen(false);
    load();
  };

  const remove = async (b: DanteBreak) => {
    if (!confirm(`Excluir o intervalo "${b.name}"?`)) return;
    const { error } = await supabase.from('dante_breaks').delete().eq('id', b.id);
    if (error) {
      toast(`Erro ao excluir: ${error.message}`, 'error');
      return;
    }
    toast('Intervalo excluído.', 'success');
    load();
  };

  const toggleActive = async (b: DanteBreak) => {
    const { error } = await supabase
      .from('dante_breaks')
      .update({ is_active: !b.is_active })
      .eq('id', b.id);
    if (error) {
      toast(`Erro: ${error.message}`, 'error');
      return;
    }
    load();
  };

  const active = findActiveBreak(breaks);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-grape-50">Intervalos do Dante</h2>
          <p className="text-sm text-grape-200/60">
            Durante um intervalo o chat fica indisponível para os usuários (admins não são
            afetados). Horários no fuso de Brasília.
          </p>
        </div>
        <button onClick={openNew} className="btn-primary flex-shrink-0">
          <Plus size={16} /> Novo intervalo
        </button>
      </div>

      {active && (
        <div className="mb-4 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          Intervalo em andamento agora: <strong>{active.name}</strong>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-grape-200/60">Carregando...</p>
      ) : breaks.length === 0 ? (
        <p className="text-sm text-grape-200/60">Nenhum intervalo cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {breaks.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-start gap-3 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-grape-200">
                <Moon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-grape-50">{b.name}</span>
                  <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-grape-200/70">
                    {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      b.is_active
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-white/5 text-grape-200/50'
                    }`}
                  >
                    {b.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-grape-200/50">
                  {(b.days?.length ? b.days : [0, 1, 2, 3, 4, 5, 6])
                    .map((d) => WEEKDAY_LABELS[d])
                    .join(', ')}
                </p>
                <p className="mt-1 text-sm text-grape-200/70">{b.message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(b)}
                  className="rounded-lg border border-white/10 p-2 text-grape-200/70 hover:bg-white/10"
                  aria-label="Ativar/desativar"
                >
                  {b.is_active ? <X size={16} /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => openEdit(b)}
                  className="rounded-lg border border-white/10 p-2 text-grape-200/70 hover:bg-white/10"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => remove(b)}
                  className="rounded-lg border border-white/10 p-2 text-rose-300 hover:bg-rose-500/10"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Editar intervalo' : 'Novo intervalo'}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-grape-200/70">Nome</label>
            <input
              className="input w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Intervalo de sono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-grape-200/70">Início</label>
              <input
                type="time"
                className="input w-full"
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-grape-200/70">Fim</label>
              <input
                type="time"
                className="input w-full"
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-grape-200/70">Dias da semana</label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.days.includes(d)
                      ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                      : 'border border-white/10 text-grape-200/60 hover:bg-white/5'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-grape-200/70">Mensagem exibida</label>
            <textarea
              className="input w-full"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-grape-200/70">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Intervalo ativo
          </label>
          <div className="flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={save} className="btn-primary">
              Salvar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
