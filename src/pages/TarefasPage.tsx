import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Send, Coins, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { supabase, type Task, type TaskSubmission } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import { GuestBanner } from '@/components/GuestBanner';
import { navigateTo } from '@/lib/router';

type Tab = 'disponiveis' | 'analise' | 'concluidas' | 'reprovadas';

export function TarefasPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('disponiveis');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [{ data: taskData }, { data: subData }] = await Promise.all([
      supabase.from('tasks').select('*').order('sort_order', { ascending: true }),
      user
        ? supabase.from('task_submissions').select('*').eq('user_id', user.id)
        : Promise.resolve({ data: null as TaskSubmission[] | null, error: null }),
    ]);
    setTasks((taskData as Task[]) ?? []);
    setSubmissions((subData as TaskSubmission[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const submittedTaskIds = new Set(submissions.map((s) => s.task_id));

  const statusFor = (taskId: string): TaskSubmission | undefined =>
    submissions.find((s) => s.task_id === taskId);

  const available = tasks.filter((t) => !submittedTaskIds.has(t.id));
  const pending = submissions.filter((s) => s.status === 'pendente');
  const approved = submissions.filter((s) => s.status === 'aprovada');
  const rejected = submissions.filter((s) => s.status === 'reprovada');

  const submitAnswer = async (taskId: string) => {
    if (!answer.trim()) return;
    if (!user) {
      toast('Faça login para enviar sua resposta.', 'info');
      navigateTo({ name: 'login' });
      return;
    }
    setSending(true);
    const { error } = await supabase.from('task_submissions').insert({
      task_id: taskId,
      user_id: user.id,
      answer: answer.trim(),
      status: 'pendente',
    });
    setSending(false);
    if (error) {
      toast('Erro ao enviar resposta.', 'error');
      return;
    }
    toast('Resposta enviada para análise!', 'success');
    setAnswer('');
    setAnswering(null);
    await load();
    await refreshProfile();
  };

  const tabs: { id: Tab; label: string; count: number; icon: typeof Clock }[] = [
    { id: 'disponiveis', label: 'Disponíveis', count: available.length, icon: ClipboardList },
    { id: 'analise', label: 'Em Análise', count: pending.length, icon: Clock },
    { id: 'concluidas', label: 'Concluídas', count: approved.length, icon: CheckCircle2 },
    { id: 'reprovadas', label: 'Reprovadas', count: rejected.length, icon: XCircle },
  ];

  return (
    <div className="animate-fade-in mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {!user && <GuestBanner />}
      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-grape-200/80">
          <ClipboardList size={14} className="text-rose-400" /> Missões
        </div>
        <h1 className="font-display text-4xl font-semibold text-grape-50 sm:text-5xl">Tarefas</h1>
        <p className="mt-3 text-grape-100/70">Conclua tarefas e ganhe Dantes.</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white shadow-glow'
                : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
            }`}
          >
            <t.icon size={15} />
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${tab === t.id ? 'bg-white/20' : 'bg-white/10'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {tab === 'disponiveis' &&
            (available.length === 0 ? (
              <Empty text="Nenhuma tarefa disponível no momento." />
            ) : (
              available.map((t) => (
                <div key={t.id} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold text-grape-50">{t.title}</h3>
                      {t.description && (
                        <p className="mt-1 text-sm text-grape-100/70">{t.description}</p>
                      )}
                    </div>
                    <span className="chip flex-shrink-0 bg-gold-400/15 text-gold-400">
                      <Coins size={13} /> {t.points} Dantes
                    </span>
                  </div>
                  {answering === t.id ? (
                    <div className="mt-4 space-y-3">
                      <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-grape-100/80">
                        <span className="font-semibold text-rose-300">Pergunta: </span>
                        {t.question}
                      </p>
                      <textarea
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        rows={4}
                        className="input resize-none"
                        placeholder="Escreva sua resposta..."
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitAnswer(t.id)}
                          disabled={sending || !answer.trim()}
                          className="btn-primary"
                        >
                          <Send size={16} /> {sending ? 'Enviando...' : 'Enviar Resposta'}
                        </button>
                        <button
                          onClick={() => {
                            setAnswering(null);
                            setAnswer('');
                          }}
                          className="btn-ghost"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAnswering(t.id);
                        setAnswer('');
                      }}
                      className="btn-primary mt-4"
                    >
                      Concluir Tarefa
                    </button>
                  )}
                </div>
              ))
            ))}

          {tab === 'analise' &&
            (pending.length === 0 ? (
              <Empty text="Nenhuma resposta em análise." />
            ) : (
              pending.map((s) => {
                const task = tasks.find((t) => t.id === s.task_id);
                return <SubmissionCard key={s.id} task={task} submission={s} />;
              })
            ))}

          {tab === 'concluidas' &&
            (approved.length === 0 ? (
              <Empty text="Nenhuma tarefa concluída ainda." />
            ) : (
              approved.map((s) => {
                const task = tasks.find((t) => t.id === s.task_id);
                return <SubmissionCard key={s.id} task={task} submission={s} approved />;
              })
            ))}

          {tab === 'reprovadas' &&
            (rejected.length === 0 ? (
              <Empty text="Nenhuma tarefa reprovada." />
            ) : (
              rejected.map((s) => {
                const task = tasks.find((t) => t.id === s.task_id);
                return <SubmissionCard key={s.id} task={task} submission={s} rejected />;
              })
            ))}
        </div>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card p-10 text-center text-grape-200/60">{text}</div>;
}

function SubmissionCard({
  task,
  submission,
  approved,
  rejected,
}: {
  task?: Task;
  submission: TaskSubmission;
  approved?: boolean;
  rejected?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold text-grape-50">
            {task?.title || 'Tarefa'}
          </h3>
          {task?.description && (
            <p className="mt-1 text-sm text-grape-100/70">{task.description}</p>
          )}
        </div>
        {approved && (
          <span className="chip bg-mint-500/15 text-mint-400">
            <CheckCircle2 size={13} /> Aprovada
          </span>
        )}
        {rejected && (
          <span className="chip bg-rose-500/15 text-rose-300">
            <XCircle size={13} /> Reprovada
          </span>
        )}
      </div>
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-grape-100/80">
        <span className="font-semibold text-grape-200">Sua resposta: </span>
        {submission.answer}
      </div>
      {rejected && submission.reviewer_feedback && (
        <div className="mt-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-200">
          <span className="font-semibold">Feedback: </span>
          {submission.reviewer_feedback}
        </div>
      )}
      {task && (
        <p className="mt-3 text-xs text-gold-400">
          <Coins size={12} className="inline" /> {task.points} Dantes
        </p>
      )}
    </div>
  );
}
