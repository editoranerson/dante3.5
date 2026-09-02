import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Shield,
  Zap,
  BookOpen,
  Eye,
  Music,
  Layers,
  Ticket,
  ClipboardList,
  Users,
  FileText,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Coins,
  Gift,
  Brain,
  MessageSquare,
  Crown,
  Calendar,
  Power,
  Upload,
  AlertCircle,
  Archive,
  Mail,
  Phone,
  Clock,
  HelpCircle,
  Gamepad2,
  ShoppingBag,
  Heart,
  Puzzle,
  Moon,
} from 'lucide-react';
import {
  supabase,
  CARD_TYPE_LABELS,
  type CardType,
  type Character,
  type Secret,
  type Song,
  type Card,
  type CardCode,
  type Task,
  type TaskSubmission,
  type Profile,
  type SiteContent,
  type DanteKnowledge,
  type ChatMessage,
  type PlanType,
  type ArchivedChapter,
  type FaqEntry,
  type HangmanGame,
  type PuzzleGame,
  type QuizGroup,
  type QuizQuestion,
  type ShopItem,
  type ShopRedemption,
  type LibraryCategory,
  type RewardType,
  type RedemptionStatus,
} from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { ImageUpload } from '@/components/ImageUpload';
import { MarkdownBlock } from '@/components/Footer';
import { ChatstoryAdmin } from '@/components/admin/ChatstoryAdmin';
import { BreaksAdmin } from '@/components/admin/BreaksAdmin';
import { PowerAdmin } from '@/components/admin/PowerAdmin';

type AdminTab =
  | 'personagens'
  | 'segredos'
  | 'playlist'
  | 'cartas'
  | 'codigos'
  | 'tarefas'
  | 'respostas'
  | 'usuarios'
  | 'conversas'
  | 'conhecimento'
  | 'textos'
  | 'biblioteca'
  | 'chatstory'
  | 'mensagens'
  | 'faq'
  | 'minijogos'
  | 'loja'
  | 'resgates'
  | 'intervalos'
  | 'power'
  | 'estatisticas';

const TABS: { id: AdminTab; label: string; icon: typeof Shield }[] = [
  { id: 'personagens', label: 'Personagens', icon: BookOpen },
  { id: 'segredos', label: 'Segredos', icon: Eye },
  { id: 'playlist', label: 'Playlist', icon: Music },
 { id: 'cartas', label: 'Cartas', icon: Layers },
  { id: 'codigos', label: 'Códigos', icon: Ticket },
  { id: 'tarefas', label: 'Tarefas', icon: ClipboardList },
  { id: 'respostas', label: 'Respostas', icon: FileText },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'conversas', label: 'Conversas', icon: MessageSquare },
  { id: 'conhecimento', label: 'Conhecimento', icon: Brain },
  { id: 'textos', label: 'Textos do Site', icon: FileText },
  { id: 'biblioteca', label: 'Biblioteca', icon: Archive },
  { id: 'chatstory', label: 'Chatstory', icon: MessageSquare },
  { id: 'mensagens', label: 'Mensagens', icon: Mail },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'minijogos', label: 'Minijogos', icon: Gamepad2 },
  { id: 'loja', label: 'Loja', icon: ShoppingBag },
  { id: 'resgates', label: 'Resgates', icon: Gift },
  { id: 'intervalos', label: 'Intervalos do Dante', icon: Moon },
  { id: 'power', label: 'Power do Dante', icon: Power },
  { id: 'estatisticas', label: 'Estatísticas', icon: Zap },
];

export function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('personagens');

  return (
    <div className="animate-fade-in mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400 to-rose-500 shadow-glow">
          <Shield size={24} className="text-ink-950" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold text-grape-50">Painel Admin</h1>
          <p className="text-sm text-grape-200/60">Gerencie todo o conteúdo do Universo Dante.</p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white shadow-glow'
                : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'personagens' && <CharactersAdmin />}
      {tab === 'segredos' && <SecretsAdmin />}
      {tab === 'playlist' && <SongsAdmin />}
      {tab === 'cartas' && <CardsAdmin />}
      {tab === 'codigos' && <CodesAdmin />}
      {tab === 'tarefas' && <TasksAdmin />}
      {tab === 'respostas' && <SubmissionsAdmin />}
      {tab === 'usuarios' && <UsersAdmin />}
      {tab === 'conversas' && <ConversationsAdmin />}
      {tab === 'conhecimento' && <KnowledgeAdmin />}
      {tab === 'textos' && <ContentAdmin />}
      {tab === 'biblioteca' && <LibraryAdmin />}
      {tab === 'chatstory' && <ChatstoryAdmin />}
      {tab === 'mensagens' && <ContactMessagesAdmin />}
      {tab === 'faq' && <FaqAdmin />}
      {tab === 'minijogos' && <MinijogosAdmin />}
      {tab === 'loja' && <ShopAdmin />}
      {tab === 'resgates' && <RedemptionsAdmin />}
      {tab === 'intervalos' && <BreaksAdmin />}
      {tab === 'power' && <PowerAdmin />}
      {tab === 'estatisticas' && <ChatStatsAdmin />}
    </div>
  );
}

/* ---------- shared ---------- */
function SectionHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-display text-xl font-semibold text-grape-50">{title}</h2>
      <button onClick={onAdd} className="btn-primary py-2">
        <Plus size={16} /> Adicionar
      </button>
    </div>
  );
}

function ConfirmDelete({ name, onConfirm }: { name: string; onConfirm: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
      <span className="text-rose-200">Excluir "{name}"?</span>
      <button onClick={onConfirm} className="btn-danger py-1.5">
        <Trash2 size={14} /> Excluir
      </button>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="card p-8 text-center text-grape-200/60">{text}</div>;
}

/* ---------- Characters ---------- */
function CharactersAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Character | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('characters')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as Character[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string, name: string) => {
    const { error } = await supabase.from('characters').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Personagem excluído.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="Personagens" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhum personagem cadastrado." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-4">
              {c.photo_url ? (
                <img src={c.photo_url} alt="" className="h-16 w-12 flex-shrink-0 rounded object-cover" />
              ) : (
                <div className="h-16 w-12 flex-shrink-0 rounded bg-ink-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{c.name}</p>
                <p className="truncate text-xs text-grape-200/50">Ordem: {c.sort_order}</p>
              </div>
              <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(c.id, c.name)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CharacterForm
          character={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CharacterForm({
  character,
  onClose,
  onSaved,
}: {
  character: Character | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [name, setName] = useState(character?.name || '');
  const [photo, setPhoto] = useState(character?.photo_url || '');
  const [presentation, setPresentation] = useState(character?.presentation || '');
  const [sort, setSort] = useState(character?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast('Informe o nome.', 'error');
    setSaving(true);
    const payload = { name, photo_url: photo, presentation, sort_order: sort };
    const { error } = character
      ? await supabase.from('characters').update(payload).eq('id', character.id)
      : await supabase.from('characters').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Personagem salvo!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={character ? 'Editar Personagem' : 'Novo Personagem'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <ImageUpload onUploaded={setPhoto} currentUrl={photo} folder="characters" label="Foto Capa" />
        <div>
          <label className="label">Nome</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Apresentação</label>
          <textarea className="input min-h-[120px] resize-y" value={presentation} onChange={(e) => setPresentation(e.target.value)} />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Secrets ---------- */
function SecretsAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Secret[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Secret | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('secrets')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as Secret[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('secrets').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Segredo excluído.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="Segredos" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhum segredo cadastrado." />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{s.title}</p>
                <p className="truncate text-xs text-grape-200/50">{s.body.slice(0, 80)}...</p>
              </div>
              <button onClick={() => setEditing(s)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SecretForm
          secret={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SecretForm({ secret, onClose, onSaved }: { secret: Secret | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(secret?.title || '');
  const [body, setBody] = useState(secret?.body || '');
  const [sort, setSort] = useState(secret?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast('Informe o título.', 'error');
    setSaving(true);
    const payload = { title, body, sort_order: sort };
    const { error } = secret
      ? await supabase.from('secrets').update(payload).eq('id', secret.id)
      : await supabase.from('secrets').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Segredo salvo!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={secret ? 'Editar Segredo' : 'Novo Segredo'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Texto</label>
          <textarea className="input min-h-[140px] resize-y" value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Songs ---------- */
function SongsAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Song | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('songs')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as Song[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Música excluída.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="Playlist" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhuma música cadastrada." />
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{s.title}</p>
                <p className="truncate text-xs text-grape-200/50">{s.composition} · {s.listener}</p>
              </div>
              <button onClick={() => setEditing(s)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(s.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <SongForm
          song={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function SongForm({ song, onClose, onSaved }: { song: Song | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(song?.title || '');
  const [composition, setComposition] = useState(song?.composition || '');
  const [listener, setListener] = useState(song?.listener || '');
  const [youtube, setYoutube] = useState(song?.youtube_url || '');
  const [sort, setSort] = useState(song?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return toast('Informe o título.', 'error');
    setSaving(true);
    const payload = { title, composition, listener, youtube_url: youtube, sort_order: sort };
    const { error } = song
      ? await supabase.from('songs').update(payload).eq('id', song.id)
      : await supabase.from('songs').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Música salva!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={song ? 'Editar Música' : 'Nova Música'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="label">Nome da Música</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Composição</label>
          <input className="input" value={composition} onChange={(e) => setComposition(e.target.value)} />
        </div>
        <div>
          <label className="label">Personagem Ouvinte</label>
          <input className="input" value={listener} onChange={(e) => setListener(e.target.value)} />
        </div>
        <div>
          <label className="label">Link do YouTube</label>
          <input className="input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div>
          <label className="label">Ordem</label>
          <input type="number" className="input" value={sort} onChange={(e) => setSort(Number(e.target.value))} />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Cards ---------- */
function CardsAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Card | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('cards')
      .select('*')
      .order('number', { ascending: true })
      .then(({ data }) => {
        setItems((data as Card[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Carta excluída.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="Cartas" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhuma carta cadastrada." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-3 p-4">
              {c.photo_url ? (
                <img src={c.photo_url} alt="" className="h-16 w-12 flex-shrink-0 rounded object-cover" />
              ) : (
                <div className="h-16 w-12 flex-shrink-0 rounded bg-ink-700" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">#{c.number} {c.name}</p>
                <p className="truncate text-xs text-grape-200/50">
                  {CARD_TYPE_LABELS[c.type]} · {c.points} Dantes
                </p>
              </div>
              <button onClick={() => setEditing(c)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(c.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CardForm
          card={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CardForm({ card, onClose, onSaved }: { card: Card | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(card?.name || '');
  const [number, setNumber] = useState(card?.number ?? 0);
  const [description, setDescription] = useState(card?.description || '');
  const [type, setType] = useState<CardType>(card?.type || 'comum');
  const [hint, setHint] = useState(card?.locked_hint || '');
  const [points, setPoints] = useState(card?.points ?? 0);
  const [photo, setPhoto] = useState(card?.photo_url || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast('Informe o nome.', 'error');
    setSaving(true);
    const payload = {
      name,
      number,
      description,
      type,
      locked_hint: hint,
      points,
      photo_url: photo,
    };
    const { error } = card
      ? await supabase.from('cards').update(payload).eq('id', card.id)
      : await supabase.from('cards').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Carta salva!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={card ? 'Editar Carta' : 'Nova Carta'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <ImageUpload onUploaded={setPhoto} currentUrl={photo} folder="cards" label="Foto da Carta" />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Número</label>
            <input type="number" className="input" value={number} onChange={(e) => setNumber(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-[80px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as CardType)}>
              {Object.entries(CARD_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Valor em Dantes</label>
            <input type="number" className="input" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <label className="label">Dica (carta bloqueada)</label>
          <input className="input" value={hint} onChange={(e) => setHint(e.target.value)} placeholder="Como conseguir esta carta" />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Codes ---------- */
function CodesAdmin() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<CardCode[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');
  const [cardId, setCardId] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    Promise.all([
      supabase.from('card_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*').order('number', { ascending: true }),
    ]).then(([codeRes, cardRes]) => {
      setCodes((codeRes.data as CardCode[]) ?? []);
      setCards((cardRes.data as Card[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const create = async () => {
    if (!newCode.trim() || !cardId) return toast('Preencha código e carta.', 'error');
    setSaving(true);
    const { error } = await supabase.from('card_codes').insert({
      code: newCode.trim().toUpperCase(),
      card_id: cardId,
    });
    setSaving(false);
    if (error) return toast('Erro: código já existe ou inválido.', 'error');
    toast('Código criado!', 'success');
    setNewCode('');
    load();
  };

  const remove = async (code: string) => {
    const { error } = await supabase.from('card_codes').delete().eq('code', code);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Código excluído.', 'success');
    load();
  };

  const gen = () => setNewCode(Math.random().toString(36).slice(2, 8).toUpperCase());

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">Gerador de Códigos</h2>
      <div className="card mb-6 space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Código</label>
            <div className="flex gap-2">
              <input className="input" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} placeholder="ABC123" />
              <button onClick={gen} className="btn-ghost px-3" title="Gerar aleatório">
                <Ticket size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Carta Vinculada</label>
            <select className="input" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">Selecione...</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>#{c.number} {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button onClick={create} disabled={saving} className="btn-primary">
          <Plus size={16} /> {saving ? 'Criando...' : 'Criar Código'}
        </button>
      </div>

      {loading ? (
        <Empty text="Carregando..." />
      ) : codes.length === 0 ? (
        <Empty text="Nenhum código criado." />
      ) : (
        <div className="space-y-2">
          {codes.map((c) => {
            const card = cards.find((x) => x.id === c.card_id);
            return (
              <div key={c.code} className="card flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-grape-500/20 font-mono text-sm font-bold text-grape-200">
                  {c.code.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-semibold text-grape-50">{c.code}</p>
                  <p className="truncate text-xs text-grape-200/50">
                    {card ? `#${card.number} ${card.name}` : 'Carta removida'}
                    {c.redeemed_by ? ' · Resgatado' : ' · Disponível'}
                  </p>
                </div>
                <button onClick={() => remove(c.code)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Tasks ---------- */
function TasksAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('tasks')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as Task[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Tarefa excluída.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="Tarefas" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhuma tarefa cadastrada." />
      ) : (
        <div className="space-y-2">
          {items.map((t) => (
            <div key={t.id} className="card flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{t.title}</p>
                <p className="truncate text-xs text-grape-200/50">
                  {t.points} Dantes · {t.question.slice(0, 60)}
                </p>
              </div>
              <button onClick={() => remove(t.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <TaskForm
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TaskForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [points, setPoints] = useState(0);
  const [question, setQuestion] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !question.trim()) return toast('Preencha título e pergunta.', 'error');
    setSaving(true);
    const { error } = await supabase.from('tasks').insert({
      title,
      description,
      points,
      question,
    });
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Tarefa criada!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Nova Tarefa" maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-[80px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Valor em Dantes</label>
          <input type="number" className="input" value={points} onChange={(e) => setPoints(Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Pergunta Obrigatória</label>
          <textarea className="input min-h-[80px] resize-y" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="O que o usuário deve responder?" />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary w-full">
          {saving ? 'Salvando...' : 'Criar Tarefa'}
        </button>
      </div>
    </Modal>
  );
}

/* ---------- Submissions (pending answers) ---------- */
function SubmissionsAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<(TaskSubmission & { task?: Task; user?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('task_submissions')
      .select('*, task:tasks(*), user:profiles!task_submissions_user_id_fkey(*)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false });
    setItems((data as (TaskSubmission & { task?: Task; user?: Profile })[]) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const approve = async (id: string) => {
    const { data } = await supabase.rpc('approve_task', { p_submission_id: id });
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast(res?.error || 'Erro.', 'error');
    toast('Resposta aprovada e Dantes creditados!', 'success');
    load();
  };

  const reject = async (id: string) => {
    const { data } = await supabase.rpc('reject_task', { p_submission_id: id, p_feedback: 'Reprovado pelo administrador.' });
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast(res?.error || 'Erro.', 'error');
    toast('Resposta reprovada.', 'info');
    load();
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">Respostas Pendentes</h2>
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhuma resposta pendente." />
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold text-grape-50">
                    {s.task?.title || 'Tarefa'}
                  </h3>
                  <p className="text-xs text-grape-200/50">
                    {s.user?.full_name || 'Usuário'} · {s.task?.points ?? 0} Dantes
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approve(s.id)} className="btn-primary py-2">
                    <Check size={16} /> Aprovar
                  </button>
                  <button onClick={() => reject(s.id)} className="btn-danger py-2">
                    <X size={16} /> Reprovar
                  </button>
                </div>
              </div>
              {s.task?.question && (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-grape-200/70">
                  <span className="font-semibold text-rose-300">Pergunta: </span>
                  {s.task.question}
                </p>
              )}
              <p className="mt-2 rounded-xl border border-white/10 bg-ink-700/50 p-3 text-sm text-grape-100/80">
                <span className="font-semibold text-grape-200">Resposta: </span>
                {s.answer}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Users (manual grants) ---------- */
function UsersAdmin() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [points, setPoints] = useState(0);
  const [cardId, setCardId] = useState('');
  const [granting, setGranting] = useState(false);
  const [planGrant, setPlanGrant] = useState<PlanType>('free');
  const [planExpiry, setPlanExpiry] = useState('');

  const load = () => {
    Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('cards').select('*').order('number', { ascending: true }),
    ]).then(([u, c]) => {
      setUsers((u.data as Profile[]) ?? []);
      setCards((c.data as Card[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const grantPoints = async () => {
    if (!selected || !points) return;
    setGranting(true);
    const { data } = await supabase.rpc('admin_grant_points', {
      p_user_id: selected.id,
      p_amount: points,
    });
    setGranting(false);
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast(res?.error || 'Erro.', 'error');
    toast(`${points} Dantes concedidos a ${selected.full_name}!`, 'success');
    setPoints(0);
    load();
  };

  const grantCard = async () => {
    if (!selected || !cardId) return;
    setGranting(true);
    const { data } = await supabase.rpc('admin_grant_card', {
      p_user_id: selected.id,
      p_card_id: cardId,
    });
    setGranting(false);
    const res = data as { ok: boolean; error?: string };
    if (!res?.ok) return toast(res?.error || 'Erro.', 'error');
    const card = cards.find((c) => c.id === cardId);
    toast(`Carta "${card?.name}" liberada para ${selected.full_name}!`, 'success');
    setCardId('');
    load();
  };

  const grantPlan = async () => {
    if (!selected) return;
    setGranting(true);
    const expiry = planExpiry
      ? new Date(planExpiry + 'T23:59:59').toISOString()
      : null;
    const { data, error } = await supabase
      .from('profiles')
      .update({
        plan: planGrant,
        plan_expires_at: planGrant === 'free' ? null : expiry,
      })
      .eq('id', selected.id)
      .select('id, plan, plan_expires_at');
    setGranting(false);
    if (error) return toast(`Erro ao atualizar plano: ${error.message}`, 'error');
    if (!data || data.length === 0) {
      return toast(
        'O plano NÃO foi alterado: o banco bloqueou a atualização (RLS). Aplique a policy de admin em profiles.',
        'error',
      );
    }
    toast(`Plano de ${selected.full_name} atualizado!`, 'success');
    setPlanExpiry('');
    load();
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">Controle de Usuários</h2>
      {loading ? (
        <Empty text="Carregando..." />
      ) : users.length === 0 ? (
        <Empty text="Nenhum usuário cadastrado." />
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className={`card flex items-center gap-3 p-4 transition ${
                selected?.id === u.id ? 'border-grape-400/60 bg-grape-500/10' : ''
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">
                  {u.full_name}
                  {u.role === 'admin' && <span className="ml-2 chip bg-gold-400/15 text-gold-400 text-[10px]">ADMIN</span>}
                </p>
                <p className="truncate text-xs text-grape-200/50">{u.points} Dantes</p>
              </div>
              <button
                onClick={() => setSelected(u)}
                className="btn-ghost py-1.5"
              >
                Gerenciar
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Gerenciar Usuário" maxWidth="max-w-md">
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold text-grape-50">{selected.full_name}</p>
              <p className="text-sm text-grape-200/60">Saldo atual: {selected.points} Dantes</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className="label">Adicionar Dantes</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input"
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                />
                <button onClick={grantPoints} disabled={granting} className="btn-primary">
                  <Coins size={16} /> Conceder
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <label className="label">Liberar Carta</label>
              <div className="flex gap-2">
                <select className="input" value={cardId} onChange={(e) => setCardId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>#{c.number} {c.name}</option>
                  ))}
                </select>
                <button onClick={grantCard} disabled={granting} className="btn-primary">
                  <Gift size={16} /> Liberar
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-sky2-400/20 bg-sky2-400/5 p-4">
              <label className="label flex items-center gap-1.5">
                <Crown size={14} className="text-sky2-300" /> Plano de Assinatura
              </label>
              <p className="mb-3 text-xs text-grape-200/60">
                Plano atual: <span className="font-semibold text-grape-50">{selected.plan || 'free'}</span>
                {selected.plan_expires_at && (
                  <> · Expira em {new Date(selected.plan_expires_at).toLocaleDateString('pt-BR')}</>
                )}
              </p>
              <div className="flex flex-col gap-2">
                <select
                  className="input"
                  value={planGrant}
                  onChange={(e) => setPlanGrant(e.target.value as PlanType)}
                >
                  <option value="free">Free (Gratuito)</option>
                  <option value="dante_plus">Dante Plus (R$ 4,90)</option>
                  <option value="dante_premium">Dante Premium (R$ 9,90)</option>
                  <option value="dante_premium_plus">Dante Premium+ (R$ 19,90)</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="date"
                    className="input"
                    value={planExpiry}
                    onChange={(e) => setPlanExpiry(e.target.value)}
                  />
                  <button onClick={grantPlan} disabled={granting} className="btn-primary whitespace-nowrap">
                    <Crown size={16} /> Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------- Site Content (texts) ---------- */
function ContentAdmin() {
  const { toast } = useToast();
  const [terms, setTerms] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [about, setAbout] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    supabase
      .from('site_content')
      .select('*')
      .in('key', ['terms_of_use', 'privacy_policy', 'about', 'contact_info'])
      .then(({ data }) => {
        const rows = (data as SiteContent[]) ?? [];
        const t = rows.find((r) => r.key === 'terms_of_use');
        const p = rows.find((r) => r.key === 'privacy_policy');
        const a = rows.find((r) => r.key === 'about');
        const c = rows.find((r) => r.key === 'contact_info');
        if (t) setTerms(t.value);
        if (p) setPrivacy(p.value);
        if (a) setAbout(a.value);
        if (c) setContactInfo(c.value);
        setLoading(false);
      });
  }, []);

  const save = async (key: string, value: string, label: string) => {
    setSaving(key);
    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    setSaving('');
    if (error) return toast('Erro ao salvar.', 'error');
    toast(`${label} salvo!`, 'success');
  };

  if (loading) return <Empty text="Carregando..." />;

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-grape-50">Termos de Uso</h3>
        <textarea
          className="input min-h-[200px] resize-y font-mono text-xs"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
        />
        <button onClick={() => save('terms_of_use', terms, 'Termos de Uso')} disabled={saving === 'terms_of_use'} className="btn-primary mt-4">
          {saving === 'terms_of_use' ? 'Salvando...' : 'Salvar Termos'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-grape-50">Política de Privacidade</h3>
        <textarea
          className="input min-h-[200px] resize-y font-mono text-xs"
          value={privacy}
          onChange={(e) => setPrivacy(e.target.value)}
        />
        <button onClick={() => save('privacy_policy', privacy, 'Política de Privacidade')} disabled={saving === 'privacy_policy'} className="btn-primary mt-4">
          {saving === 'privacy_policy' ? 'Salvando...' : 'Salvar Política'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-grape-50">Página Sobre</h3>
        <p className="mb-2 text-xs text-grape-200/50">Conteúdo exibido na página /sobre</p>
        <textarea
          className="input min-h-[200px] resize-y font-mono text-xs"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
        <button onClick={() => save('about', about, 'Página Sobre')} disabled={saving === 'about'} className="btn-primary mt-4">
          {saving === 'about' ? 'Salvando...' : 'Salvar Sobre'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-grape-50">Informações de Contato</h3>
        <p className="mb-2 text-xs text-grape-200/50">Bloco informativo exibido na página /contato</p>
        <textarea
          className="input min-h-[200px] resize-y font-mono text-xs"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
        <button onClick={() => save('contact_info', contactInfo, 'Informações de Contato')} disabled={saving === 'contact_info'} className="btn-primary mt-4">
          {saving === 'contact_info' ? 'Salvando...' : 'Salvar Contato'}
        </button>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-display text-lg font-semibold text-grape-50">Pré-visualização (Termos)</h3>
        <div className="rounded-xl border border-white/10 bg-ink-700/30 p-4">
          <MarkdownBlock text={terms} />
        </div>
      </div>
    </div>
  );
}

function KnowledgeAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<DanteKnowledge[]>([]);
  const [editing, setEditing] = useState<DanteKnowledge | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [instruction, setInstruction] = useState('');
  const [isActive, setIsActive] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('dante_knowledge')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setItems(data as DanteKnowledge[]);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setTitle('');
    setInstruction('');
    setIsActive(true);
    setEditing(null);
    setShowForm(false);
  };

  const save = async () => {
    if (!title.trim() || !instruction.trim()) {
      toast('Preencha título e conteúdo.', 'error');
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from('dante_knowledge')
        .update({ title: title.trim(), instruction: instruction.trim(), is_active: isActive })
        .eq('id', editing.id);
      if (error) return toast('Erro ao atualizar.', 'error');
      toast('Conhecimento atualizado!', 'success');
    } else {
      const { error } = await supabase
        .from('dante_knowledge')
        .insert({ title: title.trim(), instruction: instruction.trim(), is_active: isActive });
      if (error) return toast('Erro ao criar.', 'error');
      toast('Conhecimento adicionado!', 'success');
    }
    resetForm();
    load();
  };

  const toggle = async (item: DanteKnowledge) => {
    const { error } = await supabase
      .from('dante_knowledge')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    if (error) return toast('Erro ao alternar.', 'error');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('dante_knowledge').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Excluído.', 'success');
    load();
  };

  const startEdit = (item: DanteKnowledge) => {
    setEditing(item);
    setTitle(item.title);
    setInstruction(item.instruction);
    setIsActive(item.is_active);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold text-grape-50">Conhecimento do Dante</h2>
          <p className="text-sm text-grape-200/60">
            Gerencie as instruções e personalidades que definem o comportamento da IA.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary"
        >
          <Plus size={18} /> Adicionar
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4 border-sky2-400/20 bg-ink-800/60 p-6">
          <h3 className="font-display text-lg font-semibold text-grape-50">
            {editing ? 'Editar Conhecimento' : 'Novo Conhecimento'}
          </h3>
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Personalidade principal do Dante"
            />
          </div>
          <div>
            <label className="label">Conteúdo / Instruções</label>
            <textarea
              className="input min-h-[120px] resize-y"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Você é o Dante, um guia espiritual que fala com sabedoria e empatia..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-grape-100/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5"
            />
            Ativo (será enviado ao Gemini)
          </label>
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">
              <Check size={16} /> Salvar
            </button>
            <button onClick={resetForm} className="btn-ghost">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-grape-200/50">
            Nenhuma instrução cadastrada. Adicione a primeira!
          </p>
        )}
        {items.map((item) => (
          <div
            key={item.id}
            className={`card flex items-start justify-between gap-4 p-4 ${
              item.is_active ? 'border-sky2-400/20 bg-ink-800/60' : 'border-white/5 bg-white/[0.02] opacity-60'
            }`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-grape-50">{item.title}</h4>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.is_active
                      ? 'bg-mint-500/20 text-mint-400'
                      : 'bg-white/10 text-grape-200/50'
                  }`}
                >
                  {item.is_active ? 'ATIVO' : 'INATIVO'}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-grape-200/60">{item.instruction}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(item)}
                className="rounded-lg p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                title={item.is_active ? 'Desativar' : 'Ativar'}
              >
                <Power size={16} />
              </button>
              <button
                onClick={() => startEdit(item)}
                className="rounded-lg p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                title="Editar"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => remove(item.id)}
                className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/20"
                title="Excluir"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConversationsAdmin() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedMessages, setParsedMessages] = useState<{ role: string; content: string; created_at?: string }[] | null>(null);
  const [parsedFileName, setParsedFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: boolean; count: number; error?: string } | null>(null);
  const [parseError, setParseError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setUsers(data as Profile[]);
    })();
  }, []);

  const selectUser = async (p: Profile) => {
    setSelectedUser(p);
    setLoadingMsgs(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', p.id)
      .order('created_at', { ascending: true });
    setLoadingMsgs(false);
    if (data) setMessages(data as ChatMessage[]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError('');
    setImportResult(null);

    if (!file.name.endsWith('.json')) {
      setParseError('Apenas arquivos JSON são aceitos.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        let msgArray: unknown[] | null = null;

        if (Array.isArray(raw) && raw.length > 0) {
          msgArray = raw;
        } else if (typeof raw === 'object' && raw !== null) {
          const keys = Object.keys(raw);
          if (keys.length === 1 && Array.isArray((raw as Record<string, unknown[]>)[keys[0]])) {
            msgArray = (raw as Record<string, unknown[]>)[keys[0]];
          }
        }

        if (!msgArray || msgArray.length === 0) {
          setParseError('Nenhuma mensagem encontrada no arquivo.');
          return;
        }

        const cleaned: { role: string; content: string; created_at?: string }[] = [];
        for (const m of msgArray) {
          const obj = m as Record<string, unknown>;
          const role = typeof obj.role === 'string' ? obj.role.toLowerCase() : '';
          const content = typeof obj.content === 'string' ? obj.content : '';
          const createdAt = typeof obj.created_at === 'string' ? obj.created_at : undefined;
          if ((role === 'user' || role === 'assistant') && content.trim() !== '') {
            cleaned.push({ role, content, created_at: createdAt });
          }
        }

        if (cleaned.length === 0) {
          setParseError('Nenhuma mensagem válida encontrada. Verifique a estrutura do arquivo.');
          return;
        }

        setParsedMessages(cleaned);
        setParsedFileName(file.name);
      } catch {
        setParseError('Arquivo JSON inválido ou corrompido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!selectedUser || !parsedMessages) return;
    setImporting(true);
    setImportResult(null);
    try {
      const { data, error } = await supabase.rpc('import_lovable_conversation', {
        p_user_id: selectedUser.id,
        p_messages: parsedMessages,
      });
      if (error) {
        setImportResult({ ok: false, count: 0, error: error.message });
      } else {
        const result = data as { ok: boolean; imported_count?: number; error?: string };
        if (result.ok) {
          setImportResult({ ok: true, count: result.imported_count ?? 0 });
          toast(`${result.imported_count ?? 0} mensagens importadas com sucesso.`, 'success');
          selectUser(selectedUser);
        } else {
          setImportResult({ ok: false, count: 0, error: result.error ?? 'Erro desconhecido.' });
        }
      }
    } catch (err) {
      setImportResult({ ok: false, count: 0, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setParsedMessages(null);
    setParsedFileName('');
    setImportResult(null);
    setParseError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-grape-50">Histórico de Conversas</h2>
          <p className="text-sm text-grape-200/60">
            Selecione um usuário para ver o histórico de mensagens com o Dante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={!selectedUser}
          className="flex items-center gap-2 rounded-lg bg-sky2-500/20 px-4 py-2 text-sm font-medium text-sky2-200 transition hover:bg-sky2-500/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Upload className="h-4 w-4" />
          Importar conversa antiga
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* User list */}
        <div className="card max-h-[500px] space-y-1 overflow-y-auto bg-ink-800/60 p-3">
          {users.length === 0 && (
            <p className="py-4 text-center text-sm text-grape-200/50">Nenhum usuário.</p>
          )}
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => selectUser(u)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedUser?.id === u.id
                  ? 'bg-sky2-400/20 text-sky2-200'
                  : 'text-grape-100/80 hover:bg-white/5'
              }`}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-grape-500 to-rose-500 text-xs font-bold text-white"
              >
                {(u.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{u.full_name || 'Sem nome'}</p>
                <p className="truncate text-xs text-grape-200/50">{u.email || ''}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="card max-h-[500px] overflow-y-auto bg-ink-800/60 p-4">
          {!selectedUser && (
            <p className="py-12 text-center text-sm text-grape-200/50">
              Selecione um usuário para ver as mensagens.
            </p>
          )}
          {selectedUser && loadingMsgs && (
            <p className="py-12 text-center text-sm text-grape-200/50">Carregando...</p>
          )}
          {selectedUser && !loadingMsgs && messages.length === 0 && (
            <p className="py-12 text-center text-sm text-grape-200/50">
              Nenhuma mensagem trocada com o Dante.
            </p>
          )}
          {selectedUser && !loadingMsgs && messages.length > 0 && (
            <div className="space-y-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-grape-200/60">
                Conversa com {selectedUser.full_name || 'Usuário'}
              </p>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #80D8FF, #FF80AB)' }}
                    >
                      ∞
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                        : 'border border-white/10 bg-ink-700/60 text-grape-50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import error popup */}
      {parseError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-ink-800 p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
              <div>
                <h3 className="font-display text-lg font-semibold text-grape-50">Erro no arquivo</h3>
                <p className="mt-1 text-sm text-grape-200/70">{parseError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setParseError('')}
              className="mt-4 w-full rounded-lg border border-white/10 bg-ink-700 px-4 py-2 text-sm font-medium text-grape-100 transition hover:bg-ink-600"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Import confirmation modal */}
      {parsedMessages && !importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
            <h3 className="font-display text-lg font-semibold text-grape-50">Importar conversa</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-grape-200/60">Arquivo:</span>
                <span className="font-medium text-grape-50">{parsedFileName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grape-200/60">Mensagens encontradas:</span>
                <span className="font-medium text-grape-50">{parsedMessages.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-grape-200/60">Usuário de destino:</span>
                <span className="font-medium text-grape-50">{selectedUser?.full_name || selectedUser?.email || '—'}</span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-grape-200/70">Deseja importar?</p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={closeImportModal}
                disabled={importing}
                className="flex-1 rounded-lg border border-white/10 bg-ink-700 px-4 py-2 text-sm font-medium text-grape-100 transition hover:bg-ink-600 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={importing}
                className="flex-1 rounded-lg bg-gradient-to-r from-sky2-500 to-grape-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Confirmar importação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import result modal */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 shadow-2xl">
            {importResult.ok ? (
              <>
                <h3 className="font-display text-lg font-semibold text-emerald-400">Importação concluída</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-grape-200/60">Usuário:</span>
                    <span className="font-medium text-grape-50">{selectedUser?.full_name || selectedUser?.email || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grape-200/60">Mensagens importadas:</span>
                    <span className="font-medium text-grape-50">{importResult.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-grape-200/60">Origem:</span>
                    <span className="font-medium text-grape-50">Lovable Migration</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display text-lg font-semibold text-red-400">Falha na importação</h3>
                <p className="mt-3 text-sm text-grape-200/70">{importResult.error}</p>
              </>
            )}
            <button
              type="button"
              onClick={closeImportModal}
              className="mt-5 w-full rounded-lg bg-gradient-to-r from-sky2-500 to-grape-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function LibraryAdmin() {
  const [sub, setSub] = useState<'capitulos' | 'categorias'>('capitulos');
  const [categories, setCategories] = useState<LibraryCategory[]>([]);

  const loadCategories = useCallback(() => {
    supabase
      .from('library_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => setCategories((data as LibraryCategory[]) ?? []));
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['capitulos', 'categorias'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              sub === s
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                : 'border border-white/10 text-grape-200/60 hover:bg-white/5'
            }`}
          >
            {s === 'capitulos' ? 'Capítulos' : 'Categorias'}
          </button>
        ))}
      </div>
      {sub === 'categorias' ? (
        <CategoriesAdmin categories={categories} reload={loadCategories} />
      ) : (
        <ChaptersAdmin categories={categories} />
      )}
    </div>
  );
}

function CategoriesAdmin({
  categories,
  reload,
}: {
  categories: LibraryCategory[];
  reload: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<LibraryCategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', slug: '', description: '', sort_order: '0' });
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', sort_order: String(categories.length) });
    setShowForm(true);
  };

  const openEdit = (c: LibraryCategory) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      sort_order: String(c.sort_order ?? 0),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast('Informe o nome da categoria.', 'error');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      slug: slugify(form.slug || form.name),
      description: form.description,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    const { error } = editing
      ? await supabase.from('library_categories').update(payload).eq('id', editing.id)
      : await supabase.from('library_categories').insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    toast('Categoria salva!', 'success');
    setShowForm(false);
    reload();
  };

  const del = async (c: LibraryCategory) => {
    const { error } = await supabase.from('library_categories').delete().eq('id', c.id);
    if (error) return toast(error.message, 'error');
    toast('Categoria excluída.', 'success');
    reload();
  };

  return (
    <div>
      <SectionHeader title="Categorias da Biblioteca" onAdd={openNew} />
      {categories.length === 0 ? (
        <Empty text="Nenhuma categoria cadastrada." />
      ) : (
        <div className="space-y-3">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-grape-50">{c.name}</h3>
                <p className="truncate text-xs text-grape-200/50">
                  /{c.slug} · {c.description || 'Sem anotação'}
                </p>
              </div>
              <button onClick={() => openEdit(c)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => del(c)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Editar Categoria' : 'Nova Categoria'}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Ordem</label>
                <input
                  type="number"
                  className="input"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Slug (URL)</label>
              <input
                className="input"
                value={form.slug}
                placeholder={slugify(form.name) || 'ex: contos'}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Anotação / Sinopse (exibida no site)</label>
              <textarea
                className="input min-h-[120px] resize-y"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving} className="btn-primary flex-1 py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1 py-2.5 text-sm font-semibold">
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ChaptersAdmin({ categories }: { categories: LibraryCategory[] }) {
  const [items, setItems] = useState<ArchivedChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ArchivedChapter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ArchivedChapter | null>(null);
  const [form, setForm] = useState({
    chapter_number: '',
    title: '',
    slug: '',
    body: '',
    category_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    supabase
      .from('archived_chapters')
      .select('*')
      .order('chapter_number', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setItems(data as ArchivedChapter[]);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ chapter_number: '', title: '', slug: '', body: '', category_id: categories[0]?.id ?? '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (ch: ArchivedChapter) => {
    setEditing(ch);
    setForm({
      chapter_number: String(ch.chapter_number),
      title: ch.title,
      slug: ch.slug ?? '',
      body: ch.body,
      category_id: ch.category_id ?? '',
    });
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    const num = parseInt(form.chapter_number, 10);
    if (!form.title.trim() || !form.body.trim() || isNaN(num)) {
      setError('Preencha ordem, título e texto.');
      return;
    }
    setSaving(true);
    const payload = {
      chapter_number: num,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      body: form.body,
      category_id: form.category_id || null,
    };
    const res = editing
      ? await supabase.from('archived_chapters').update(payload).eq('id', editing.id)
      : await supabase.from('archived_chapters').insert(payload);
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setShowForm(false);
    load();
  };

  const del = async (ch: ArchivedChapter) => {
    const { error } = await supabase.from('archived_chapters').delete().eq('id', ch.id);
    if (!error) {
      setConfirmDelete(null);
      load();
    }
  };

  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? 'Sem categoria';

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-grape-50">Capítulos da Biblioteca</h2>
        <button onClick={openNew} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus size={16} /> Novo Capítulo
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-grape-200/60">Nenhum capítulo cadastrado ainda.</div>
      ) : (
        <div className="space-y-3">
          {items.map((ch) => (
            <div key={ch.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-sm font-bold text-grape-200">
                {ch.chapter_number}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-grape-50">{ch.title}</h3>
                <p className="truncate text-sm text-grape-200/50">{catName(ch.category_id)}</p>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <button
                  onClick={() => openEdit(ch)}
                  className="rounded-lg p-2 text-grape-200/70 hover:bg-white/10 hover:text-grape-50"
                  aria-label="Editar"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setConfirmDelete(ch)}
                  className="rounded-lg p-2 text-rose-300/70 hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label="Excluir"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Editar Capítulo' : 'Novo Capítulo'}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-grape-200">Número de ordem</label>
                <input
                  type="number"
                  value={form.chapter_number}
                  onChange={(e) => setForm({ ...form, chapter_number: e.target.value })}
                  className="input"
                  placeholder="Ex: 1"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-grape-200">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="Título do capítulo"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-grape-200">Categoria</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="input"
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-grape-200">Slug (URL)</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="input"
                placeholder={slugify(form.title) || 'ex: capitulo-1'}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-grape-200">Texto do capítulo</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                className="input min-h-[200px] resize-y"
                placeholder="Texto completo do capítulo..."
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={save}
                disabled={saving}
                className="btn-primary flex-1 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="btn-ghost flex-1 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmDelete && (
        <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmar exclusão">
          <div className="space-y-4">
            <p className="text-grape-200">
              Deseja realmente excluir o capítulo <strong>{confirmDelete.title}</strong> (nº{' '}
              {confirmDelete.chapter_number})?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => del(confirmDelete)}
                className="flex-1 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                Excluir
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-ghost flex-1 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Contact Messages ---------- */
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  created_at: string;
  read: boolean;
}

function ContactMessagesAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const load = useCallback(() => {
    setLoading(true);
    supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          toast('Erro ao carregar mensagens.', 'error');
        } else {
          setItems((data as ContactMessage[]) ?? []);
        }
        setLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleRead = async (msg: ContactMessage) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ read: !msg.read })
      .eq('id', msg.id);
    if (error) return toast('Erro ao atualizar.', 'error');
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Mensagem excluída.', 'success');
    load();
  };

  const filtered = items.filter((m) =>
    filter === 'unread' ? !m.read : filter === 'read' ? m.read : true,
  );
  const unreadCount = items.filter((m) => !m.read).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-grape-50">Mensagens de Contato</h2>
        <div className="flex gap-2">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                filter === f
                  ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                  : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
              }`}
            >
              {f === 'all' ? `Todas (${items.length})` : f === 'unread' ? `Não lidas (${unreadCount})` : 'Lidas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Empty text="Carregando..." />
      ) : filtered.length === 0 ? (
        <Empty text="Nenhuma mensagem encontrada." />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`card p-5 ${m.read ? 'opacity-70' : 'border-grape-400/40'}`}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-grape-500/30 to-rose-500/30 text-grape-200">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-grape-50">{m.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-grape-200/60">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={12} /> {m.email}
                      </span>
                      {m.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone size={12} /> {m.phone}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} /> {new Date(m.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleRead(m)}
                    className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
                    title={m.read ? 'Marcar como não lida' : 'Marcar como lida'}
                  >
                    {m.read ? <Mail size={16} /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => remove(m.id)}
                    className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-ink-700/30 p-4 text-sm text-grape-100/80">
                {m.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- FAQ Admin ---------- */
function FaqAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<FaqEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FaqEntry | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase
      .from('faq_entries')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as FaqEntry[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('faq_entries').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Pergunta excluída.', 'success');
    load();
  };

  return (
    <div>
      <SectionHeader title="FAQ" onAdd={() => setCreating(true)} />
      {loading ? (
        <Empty text="Carregando..." />
      ) : items.length === 0 ? (
        <Empty text="Nenhuma pergunta cadastrada." />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="card flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-grape-50">{f.question}</p>
                <p className="mt-1 text-sm text-grape-200/60 line-clamp-2">{f.answer}</p>
                <p className="mt-1 text-xs text-grape-200/40">Ordem: {f.sort_order} · {f.is_active ? 'Ativa' : 'Inativa'}</p>
              </div>
              <button onClick={() => setEditing(f)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => remove(f.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <FaqForm
          entry={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function FaqForm({ entry, onClose, onSaved }: { entry: FaqEntry | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [question, setQuestion] = useState(entry?.question || '');
  const [answer, setAnswer] = useState(entry?.answer || '');
  const [sortOrder, setSortOrder] = useState(entry?.sort_order ?? 0);
  const [isActive, setIsActive] = useState(entry?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!question.trim() || !answer.trim()) return toast('Preencha pergunta e resposta.', 'error');
    setSaving(true);
    const payload = { question, answer, sort_order: sortOrder, is_active: isActive };
    const { error } = entry
      ? await supabase.from('faq_entries').update(payload).eq('id', entry.id)
      : await supabase.from('faq_entries').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Pergunta salva!', 'success');
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={entry ? 'Editar Pergunta' : 'Nova Pergunta'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="label">Pergunta</label>
          <input className="input" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <div>
          <label className="label">Resposta</label>
          <textarea className="input min-h-[100px] resize-y" value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </div>
        <div className="flex gap-4">
          <div>
            <label className="label">Ordem</label>
            <input type="number" className="input w-24" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <input type="checkbox" id="faq-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
            <label htmlFor="faq-active" className="text-sm text-grape-200">Ativa</label>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Minijogos Admin ---------- */
function MinijogosAdmin() {
  const { toast } = useToast();
  const [hangmans, setHangmans] = useState<HangmanGame[]>([]);
  const [puzzles, setPuzzles] = useState<PuzzleGame[]>([]);
  const [quizzes, setQuizzes] = useState<QuizGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'forca' | 'quebra' | 'quiz'>('forca');
  const [editingHangman, setEditingHangman] = useState<HangmanGame | null>(null);
  const [creatingHangman, setCreatingHangman] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState<PuzzleGame | null>(null);
  const [creatingPuzzle, setCreatingPuzzle] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizGroup | null>(null);
  const [creatingQuiz, setCreatingQuiz] = useState(false);

  const load = () => {
    Promise.all([
      supabase.from('hangman_games').select('*').order('created_at', { ascending: true }),
      supabase.from('puzzle_games').select('*').order('created_at', { ascending: true }),
      supabase.from('quiz_groups').select('*').order('created_at', { ascending: true }),
    ]).then(([h, p, q]) => {
      setHangmans((h.data as HangmanGame[]) ?? []);
      setPuzzles((p.data as PuzzleGame[]) ?? []);
      setQuizzes((q.data as QuizGroup[]) ?? []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const removeHangman = async (id: string) => {
    const { error } = await supabase.from('hangman_games').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Jogo excluído.', 'success'); load();
  };
  const removePuzzle = async (id: string) => {
    const { error } = await supabase.from('puzzle_games').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Quebra-cabeça excluído.', 'success'); load();
  };
  const removeQuiz = async (id: string) => {
    const { error } = await supabase.from('quiz_groups').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Quiz excluído.', 'success'); load();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {(['forca', 'quebra', 'quiz'] as const).map((st) => (
          <button key={st} onClick={() => setSubTab(st)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${subTab === st ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white' : 'border border-white/10 text-grape-200/60 hover:bg-white/5'}`}>
            {st === 'forca' ? 'Forca' : st === 'quebra' ? 'Quebra-Cabeça' : 'Quiz'}
          </button>
        ))}
      </div>

      {subTab === 'forca' && (
        <div>
          <SectionHeader title="Jogos da Forca" onAdd={() => setCreatingHangman(true)} />
          {loading ? <Empty text="Carregando..." /> : hangmans.length === 0 ? <Empty text="Nenhum jogo cadastrado." /> : (
            <div className="space-y-3">
              {hangmans.map((h) => (
                <div key={h.id} className="card flex items-center gap-3 p-4">
                  <Heart size={18} className="text-rose-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-grape-50">Palavra: {h.secret_word}</p>
                    <p className="truncate text-xs text-grape-200/50">Dica: {h.hint} · {h.reward_dantes} Dantes · {h.is_active ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <button onClick={() => setEditingHangman(h)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10"><Pencil size={16} /></button>
                  <button onClick={() => removeHangman(h.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          {(creatingHangman || editingHangman) && (
            <HangmanForm item={editingHangman} onClose={() => { setCreatingHangman(false); setEditingHangman(null); }} onSaved={() => { setCreatingHangman(false); setEditingHangman(null); load(); }} />
          )}
        </div>
      )}

      {subTab === 'quebra' && (
        <div>
          <SectionHeader title="Quebra-Cabeças" onAdd={() => setCreatingPuzzle(true)} />
          {loading ? <Empty text="Carregando..." /> : puzzles.length === 0 ? <Empty text="Nenhum quebra-cabeça cadastrado." /> : (
            <div className="space-y-3">
              {puzzles.map((p) => (
                <div key={p.id} className="card flex items-center gap-3 p-4">
                  <Puzzle size={18} className="text-sky-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-grape-50">{p.piece_count} peças</p>
                    <p className="truncate text-xs text-grape-200/50">{p.reward_dantes} Dantes · {p.is_active ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <button onClick={() => setEditingPuzzle(p)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10"><Pencil size={16} /></button>
                  <button onClick={() => removePuzzle(p.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          {(creatingPuzzle || editingPuzzle) && (
            <PuzzleForm item={editingPuzzle} onClose={() => { setCreatingPuzzle(false); setEditingPuzzle(null); }} onSaved={() => { setCreatingPuzzle(false); setEditingPuzzle(null); load(); }} />
          )}
        </div>
      )}

      {subTab === 'quiz' && (
        <div>
          <SectionHeader title="Quizzes" onAdd={() => setCreatingQuiz(true)} />
          {loading ? <Empty text="Carregando..." /> : quizzes.length === 0 ? <Empty text="Nenhum quiz cadastrado." /> : (
            <div className="space-y-3">
              {quizzes.map((q) => (
                <div key={q.id} className="card flex items-center gap-3 p-4">
                  <Brain size={18} className="text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-grape-50">{q.title}</p>
                    <p className="truncate text-xs text-grape-200/50">{q.reward_dantes} Dantes · {q.is_active ? 'Ativo' : 'Inativo'}</p>
                  </div>
                  <button onClick={() => setEditingQuiz(q)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10"><Pencil size={16} /></button>
                  <button onClick={() => removeQuiz(q.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
          )}
          {(creatingQuiz || editingQuiz) && (
            <QuizForm item={editingQuiz} onClose={() => { setCreatingQuiz(false); setEditingQuiz(null); }} onSaved={() => { setCreatingQuiz(false); setEditingQuiz(null); load(); }} />
          )}
        </div>
      )}
    </div>
  );
}

function HangmanForm({ item, onClose, onSaved }: { item: HangmanGame | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [word, setWord] = useState(item?.secret_word || '');
  const [hint, setHint] = useState(item?.hint || '');
  const [reward, setReward] = useState(item?.reward_dantes ?? 10);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!word.trim()) return toast('Informe a palavra secreta.', 'error');
    setSaving(true);
    const payload = { secret_word: word.toUpperCase(), hint, reward_dantes: reward, is_active: isActive };
    const { error } = item ? await supabase.from('hangman_games').update(payload).eq('id', item.id) : await supabase.from('hangman_games').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Jogo salvo!', 'success'); onSaved();
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Editar Forca' : 'Nova Forca'} maxWidth="max-w-md">
      <div className="space-y-4">
        <div><label className="label">Palavra Secreta</label><input className="input" value={word} onChange={(e) => setWord(e.target.value)} /></div>
        <div><label className="label">Dica</label><input className="input" value={hint} onChange={(e) => setHint(e.target.value)} /></div>
        <div><label className="label">Recompensa (Dantes)</label><input type="number" className="input w-32" value={reward} onChange={(e) => setReward(Number(e.target.value))} /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="hm-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="hm-active" className="text-sm text-grape-200">Ativo</label></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </div>
    </Modal>
  );
}

function PuzzleForm({ item, onClose, onSaved }: { item: PuzzleGame | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [pieces, setPieces] = useState(item?.piece_count ?? 9);
  const [reward, setReward] = useState(item?.reward_dantes ?? 15);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!imageUrl.trim()) return toast('Envie ou informe a imagem do quebra-cabeça.', 'error');
    setSaving(true);
    const payload = { piece_count: pieces, reward_dantes: reward, is_active: isActive, image_url: imageUrl.trim() };
    const { error } = item ? await supabase.from('puzzle_games').update(payload).eq('id', item.id) : await supabase.from('puzzle_games').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Quebra-cabeça salvo!', 'success'); onSaved();
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Editar Quebra-Cabeça' : 'Novo Quebra-Cabeça'} maxWidth="max-w-md">
      <div className="space-y-4">
        <ImageUpload
          label="Imagem do quebra-cabeça"
          folder="puzzles"
          currentUrl={imageUrl}
          onUploaded={(url) => setImageUrl(url)}
        />
        <div><label className="label">URL da imagem</label><input type="text" className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." /></div>
        <div><label className="label">Quantidade de Peças</label><input type="number" className="input w-32" value={pieces} onChange={(e) => setPieces(Number(e.target.value))} /></div>
        <div><label className="label">Recompensa (Dantes)</label><input type="number" className="input w-32" value={reward} onChange={(e) => setReward(Number(e.target.value))} /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="pz-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="pz-active" className="text-sm text-grape-200">Ativo</label></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </div>
    </Modal>
  );
}

function QuizForm({ item, onClose, onSaved }: { item: QuizGroup | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [reward, setReward] = useState(item?.reward_dantes ?? 20);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQ, setEditingQ] = useState<QuizQuestion | null>(null);

  useEffect(() => {
    if (item) {
      setQLoading(true);
      supabase.from('quiz_questions').select('*').eq('group_id', item.id).order('sort_order', { ascending: true })
        .then(({ data }) => { setQuestions((data as QuizQuestion[]) ?? []); setQLoading(false); });
    }
  }, [item]);

  const save = async () => {
    if (!title.trim()) return toast('Informe o título.', 'error');
    setSaving(true);
    const payload = { title, description, reward_dantes: reward, is_active: isActive };
    const { data, error } = item ? await supabase.from('quiz_groups').update(payload).eq('id', item.id).select() : await supabase.from('quiz_groups').insert(payload).select();
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Quiz salvo!', 'success'); onSaved();
  };

  const removeQuestion = async (id: string) => {
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id);
    if (error) return toast('Erro ao excluir pergunta.', 'error');
    setQuestions(questions.filter(q => q.id !== id));
    toast('Pergunta excluída.', 'success');
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Editar Quiz' : 'Novo Quiz'} maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div><label className="label">Título</label><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><label className="label">Descrição</label><input className="input" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><label className="label">Recompensa (Dantes)</label><input type="number" className="input w-32" value={reward} onChange={(e) => setReward(Number(e.target.value))} /></div>
        <div className="flex items-center gap-2"><input type="checkbox" id="qz-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="qz-active" className="text-sm text-grape-200">Ativo</label></div>

        {item && (
          <div className="border-t border-white/10 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-grape-50">Perguntas</h4>
              <button onClick={() => setShowQForm(true)} className="btn-primary py-1.5 text-sm"><Plus size={14} /> Adicionar Pergunta</button>
            </div>
            {qLoading ? <p className="text-sm text-grape-200/50">Carregando...</p> : questions.length === 0 ? <p className="text-sm text-grape-200/40">Nenhuma pergunta cadastrada.</p> : (
              <div className="space-y-2">
                {questions.map((q, i) => (
                  <div key={q.id} className="flex items-start gap-2 rounded-lg border border-white/10 bg-ink-700/30 p-3">
                    <span className="text-xs font-bold text-grape-300">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-grape-50">{q.question}</p>
                      <p className="text-xs text-emerald-400">Resposta: {String.fromCharCode(65 + q.correct_index)}) {q.options[q.correct_index]}</p>
                    </div>
                    <button onClick={() => setEditingQ(q)} className="rounded p-1.5 text-grape-200 hover:bg-white/10"><Pencil size={14} /></button>
                    <button onClick={() => removeQuestion(q.id)} className="rounded p-1.5 text-rose-300 hover:bg-rose-500/10"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </div>
      {(showQForm || editingQ) && item && (
        <QuizQuestionForm groupId={item.id} question={editingQ} onClose={() => { setShowQForm(false); setEditingQ(null); }} onSaved={() => {
          setShowQForm(false); setEditingQ(null);
          supabase.from('quiz_questions').select('*').eq('group_id', item.id).order('sort_order', { ascending: true })
            .then(({ data }) => setQuestions((data as QuizQuestion[]) ?? []));
        }} />
      )}
    </Modal>
  );
}

function QuizQuestionForm({ groupId, question, onClose, onSaved }: { groupId: string; question: QuizQuestion | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [qtext, setQtext] = useState(question?.question || '');
  const [options, setOptions] = useState<string[]>(question?.options ?? ['', '', '', '']);
  const [correct, setCorrect] = useState(question?.correct_index ?? 0);
  const [sortOrder, setSortOrder] = useState(question?.sort_order ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!qtext.trim()) return toast('Informe a pergunta.', 'error');
    if (options.filter(o => o.trim()).length < 2) return toast('Informe pelo menos 2 opções.', 'error');
    setSaving(true);
    const payload = { group_id: groupId, question: qtext, options, correct_index: correct, sort_order: sortOrder };
    const { error } = question ? await supabase.from('quiz_questions').update(payload).eq('id', question.id) : await supabase.from('quiz_questions').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar pergunta.', 'error');
    toast('Pergunta salva!', 'success'); onSaved();
  };

  return (
    <Modal open onClose={onClose} title={question ? 'Editar Pergunta' : 'Nova Pergunta'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div><label className="label">Pergunta</label><input className="input" value={qtext} onChange={(e) => setQtext(e.target.value)} /></div>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} className="h-4 w-4" />
            <input className="input flex-1" placeholder={`Opção ${String.fromCharCode(65 + i)}`} value={opt} onChange={(e) => { const o = [...options]; o[i] = e.target.value; setOptions(o); }} />
          </div>
        ))}
        <p className="text-xs text-grape-200/50">Selecione o botão ao lado da resposta correta.</p>
        <div><label className="label">Ordem</label><input type="number" className="input w-24" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} /></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </div>
    </Modal>
  );
}

/* ---------- Shop Admin ---------- */
function ShopAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [creating, setCreating] = useState(false);

  const load = () => {
    supabase.from('shop_items').select('*').order('price_dantes', { ascending: true })
      .then(({ data }) => { setItems((data as ShopItem[]) ?? []); setLoading(false); });
  };
  useEffect(load, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from('shop_items').delete().eq('id', id);
    if (error) return toast('Erro ao excluir.', 'error');
    toast('Item excluído.', 'success'); load();
  };

  const rewardLabels: Record<RewardType, string> = { giftcard: 'Gift-Card', file: 'Arquivo', card: 'Carta', credits: 'Créditos' };

  return (
    <div>
      <SectionHeader title="Loja de Recompensas" onAdd={() => setCreating(true)} />
      {loading ? <Empty text="Carregando..." /> : items.length === 0 ? <Empty text="Nenhum item cadastrado." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((s) => (
            <div key={s.id} className="card flex flex-col p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-grape-200/50">{rewardLabels[s.reward_type]}</span>
                <span className="text-xs text-gold-400">{s.price_dantes} Dantes</span>
              </div>
              <p className="font-semibold text-grape-50">{s.name}</p>
              <p className="mt-1 text-xs text-grape-200/50 line-clamp-2">{s.description}</p>
              <p className="mt-2 text-xs text-grape-200/40">Estoque: {s.stock === 0 ? 'Esgotado' : s.stock === -1 ? 'Ilimitado' : s.stock} · {s.is_active ? 'Ativo' : 'Inativo'}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(s)} className="flex-1 rounded-lg border border-white/10 py-1.5 text-sm text-grape-200 hover:bg-white/10"><Pencil size={14} className="inline" /></button>
                <button onClick={() => remove(s.id)} className="flex-1 rounded-lg border border-rose-500/20 py-1.5 text-sm text-rose-300 hover:bg-rose-500/10"><Trash2 size={14} className="inline" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {(creating || editing) && (
        <ShopItemForm item={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); load(); }} />
      )}
    </div>
  );
}

function ShopItemForm({ item, onClose, onSaved }: { item: ShopItem | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [rewardType, setRewardType] = useState<RewardType>(item?.reward_type || 'giftcard');
  const [price, setPrice] = useState(item?.price_dantes ?? 50);
  const [stock, setStock] = useState(item?.stock ?? -1);
  const [isActive, setIsActive] = useState(item?.is_active ?? true);
  const [fileUrl, setFileUrl] = useState(item?.file_url || '');
  const [cardId, setCardId] = useState(item?.card_id || '');
  const [creditsAmount, setCreditsAmount] = useState(item?.credits_amount ?? 10);
  const [creditsValidity, setCreditsValidity] = useState(item?.credits_validity_days ?? 30);
  const [saving, setSaving] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    supabase.from('cards').select('id,name').order('name', { ascending: true })
      .then(({ data }) => setCards((data as Card[]) ?? []));
  }, []);

  const save = async () => {
    if (!name.trim()) return toast('Informe o nome.', 'error');
    setSaving(true);
    const payload: Record<string, unknown> = {
      name, description, reward_type: rewardType, price_dantes: price,
      stock, is_active: isActive,
      file_url: rewardType === 'file' ? fileUrl : null,
      card_id: rewardType === 'card' ? cardId || null : null,
      credits_amount: rewardType === 'credits' ? creditsAmount : null,
      credits_validity_days: rewardType === 'credits' ? creditsValidity : null,
    };
    const { error } = item ? await supabase.from('shop_items').update(payload).eq('id', item.id) : await supabase.from('shop_items').insert(payload);
    setSaving(false);
    if (error) return toast('Erro ao salvar.', 'error');
    toast('Item salvo!', 'success'); onSaved();
  };

  return (
    <Modal open onClose={onClose} title={item ? 'Editar Item' : 'Novo Item'} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div><label className="label">Nome</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="label">Descrição</label><textarea className="input min-h-[60px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div>
          <label className="label">Tipo de Recompensa</label>
          <select className="input" value={rewardType} onChange={(e) => setRewardType(e.target.value as RewardType)}>
            <option value="giftcard">Gift-Card</option>
            <option value="file">Arquivo</option>
            <option value="card">Carta do Álbum</option>
            <option value="credits">Créditos Dante</option>
          </select>
        </div>
        <div className="flex gap-4">
          <div><label className="label">Preço (Dantes)</label><input type="number" className="input w-32" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
          <div><label className="label">Estoque (-1 = ilimitado)</label><input type="number" className="input w-32" value={stock} onChange={(e) => setStock(Number(e.target.value))} /></div>
        </div>
        {rewardType === 'file' && (
          <div><label className="label">URL do Arquivo</label><input className="input" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} placeholder="https://..." /></div>
        )}
        {rewardType === 'card' && (
          <div>
            <label className="label">Carta Associada</label>
            <select className="input" value={cardId} onChange={(e) => setCardId(e.target.value)}>
              <option value="">Selecione...</option>
              {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        {rewardType === 'credits' && (
          <div className="flex gap-4">
            <div><label className="label">Qtd. Créditos</label><input type="number" className="input w-32" value={creditsAmount} onChange={(e) => setCreditsAmount(Number(e.target.value))} /></div>
            <div><label className="label">Validade (dias)</label><input type="number" className="input w-32" value={creditsValidity} onChange={(e) => setCreditsValidity(Number(e.target.value))} /></div>
          </div>
        )}
        <div className="flex items-center gap-2"><input type="checkbox" id="shop-active" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" /><label htmlFor="shop-active" className="text-sm text-grape-200">Ativo</label></div>
        <div className="flex justify-end gap-2"><button onClick={onClose} className="btn-ghost">Cancelar</button><button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar'}</button></div>
      </div>
    </Modal>
  );
}

/* ---------- Redemptions Admin ---------- */
function RedemptionsAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<(ShopRedemption & { shop_item?: Pick<ShopItem, 'name' | 'reward_type'>, user_profile?: Pick<Profile, 'full_name' | 'email'> })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    supabase
      .from('shop_redemptions')
      .select('*, shop_item:shop_items(name,reward_type), user_profile:profiles!shop_redemptions_user_id_fkey(full_name,email)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { console.error(error); }
        setItems((data as any) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const updateStatus = async (id: string, status: RedemptionStatus) => {
    const { error } = await supabase.from('shop_redemptions').update({ status }).eq('id', id);
    if (error) return toast('Erro ao atualizar status.', 'error');
    toast('Status atualizado!', 'success'); load();
  };

  const statusColors: Record<RedemptionStatus, string> = {
    pendente: 'bg-amber-500/15 text-amber-400',
    reivindicado: 'bg-sky-500/15 text-sky-400',
    pago: 'bg-emerald-500/15 text-emerald-400',
  };

  const statusLabels: Record<RedemptionStatus, string> = {
    pendente: 'Pendente',
    reivindicado: 'Reivindicado',
    pago: 'Pago',
  };

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">Resgates de Recompensas</h2>
      {loading ? <Empty text="Carregando..." /> : items.length === 0 ? <Empty text="Nenhum resgate registrado." /> : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-grape-50">{r.shop_item?.name ?? 'Item removido'}</p>
                  <p className="text-xs text-grape-200/50">
                    {r.user_profile?.full_name ?? 'Usuário'} · {r.user_profile?.email ?? ''} · {new Date(r.created_at ?? r.redeemed_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
              </div>
              <div className="mt-3 flex gap-2">
                {(['pendente', 'reivindicado', 'pago'] as RedemptionStatus[]).map((s) => (
                  <button key={s} onClick={() => updateStatus(r.id, s)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${r.status === s ? 'border-grape-400/50 bg-grape-500/15 text-grape-100' : 'border-white/10 text-grape-200/50 hover:bg-white/5'}`}>
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Chat Statistics ---------- */
type StatsRange = 'today' | 'week' | 'month' | 'all';

function ChatStatsAdmin() {
  const [range, setRange] = useState<StatsRange>('all');
  const [stats, setStats] = useState<{ count: number; totalScore: number; avg: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const now = new Date();
      let since: string | null = null;

      if (range === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        since = start.toISOString();
      } else if (range === 'week') {
        const start = new Date(now);
        start.setDate(start.getDate() - 7);
        since = start.toISOString();
      } else if (range === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        since = start.toISOString();
      }

      let query = supabase
        .from('chat_messages')
        .select('sarcasm_score, created_at')
        .eq('role', 'assistant');

      if (since) {
        query = query.gte('created_at', since);
      }

      const { data, error } = await query;
      setLoading(false);

      if (error || !data) {
        setStats({ count: 0, totalScore: 0, avg: 0 });
        return;
      }

      const rows = data as { sarcasm_score: number | null; created_at: string }[];
      const count = rows.length;
      const validScores = rows.filter((r) => r.sarcasm_score != null);
      const totalScore = validScores.reduce((sum, r) => sum + (r.sarcasm_score ?? 0), 0);
      const avg = validScores.length > 0 ? totalScore / validScores.length : 0;

      setStats({ count, totalScore, avg });
    })();
  }, [range]);

  const ranges: { id: StatsRange; label: string }[] = [
    { id: 'today', label: 'Hoje' },
    { id: 'week', label: '7 dias' },
    { id: 'month', label: 'Este mês' },
    { id: 'all', label: 'Tudo' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-semibold text-grape-50">Estatísticas do Dante</h2>
        <p className="text-sm text-grape-200/60">Mensagens e sarcasmo do chat.</p>
      </div>

      <div className="flex gap-2">
        {ranges.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              range === r.id
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                : 'border border-white/10 text-grape-200/60 hover:bg-white/5'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Empty text="Carregando..." />
      ) : stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="card p-5 text-center">
            <MessageSquare size={24} className="mx-auto mb-2 text-grape-300" />
            <p className="text-3xl font-bold text-grape-50">{stats.count}</p>
            <p className="text-sm text-grape-200/60">Mensagens do Dante</p>
          </div>
          <div className="card p-5 text-center">
            <Zap size={24} className="mx-auto mb-2 text-gold-400" />
            <p className="text-3xl font-bold text-grape-50">{stats.totalScore}</p>
            <p className="text-sm text-grape-200/60">Sarcasmômetro total</p>
          </div>
          <div className="card p-5 text-center">
            <Brain size={24} className="mx-auto mb-2 text-mint-400" />
            <p className="text-3xl font-bold text-grape-50">{stats.avg.toFixed(1)}</p>
            <p className="text-sm text-grape-200/60">Média de sarcasmo</p>
          </div>
        </div>
      ) : (
        <Empty text="Sem dados." />
      )}
    </div>
  );
}
