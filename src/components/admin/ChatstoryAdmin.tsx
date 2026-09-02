import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, MessagesSquare, Users, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
  supabase,
  type Chatstory,
  type ChatstoryChapter,
  type ChatstoryCharacter,
  type ChatstoryElement,
} from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { ImageUpload } from '@/components/ImageUpload';

function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ChatstoryAdmin() {
  const [sub, setSub] = useState<'stories' | 'characters'>('stories');

  return (
    <div>
      <div className="mb-5 flex gap-2">
        {(
          [
            { id: 'stories', label: 'Chatstories', icon: MessagesSquare },
            { id: 'characters', label: 'Personagens', icon: Users },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              sub === t.id
                ? 'bg-white/15 text-grape-50'
                : 'border border-white/10 bg-white/5 text-grape-200/70 hover:bg-white/10'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {sub === 'stories' ? <StoriesAdmin /> : <CharactersChatAdmin />}
    </div>
  );
}

/* ------------------------- Personagens ------------------------- */
function CharactersChatAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<ChatstoryCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ChatstoryCharacter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', avatar_url: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    supabase
      .from('chatstory_characters')
      .select('*')
      .order('name', { ascending: true })
      .then(({ data }) => {
        setItems((data as ChatstoryCharacter[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const save = async () => {
    if (!form.name.trim()) return toast('Informe o nome do personagem.', 'error');
    setSaving(true);
    const payload = { name: form.name.trim(), avatar_url: form.avatar_url };
    const { error } = editing
      ? await supabase.from('chatstory_characters').update(payload).eq('id', editing.id)
      : await supabase.from('chatstory_characters').insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    setShowForm(false);
    toast('Personagem salvo!', 'success');
    load();
  };

  const del = async (c: ChatstoryCharacter) => {
    const { count } = await supabase
      .from('chatstory_elements')
      .select('id', { count: 'exact', head: true })
      .eq('character_id', c.id);
    if ((count ?? 0) > 0) {
      const ok = window.confirm(
        `"${c.name}" é usado em ${count} mensagem(ns). Ao excluir, essas mensagens ficarão sem personagem. Continuar?`,
      );
      if (!ok) return;
    } else if (!window.confirm(`Excluir o personagem "${c.name}"?`)) {
      return;
    }
    const { error } = await supabase.from('chatstory_characters').delete().eq('id', c.id);
    if (error) return toast(error.message, 'error');
    toast('Personagem excluído.', 'success');
    load();
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-grape-50">Personagens da Chatstory</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', avatar_url: '' });
            setShowForm(true);
          }}
          className="btn-primary py-2 text-sm"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      {loading ? (
        <p className="text-grape-200/50">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-grape-200/50">Nenhum personagem cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-ink-700">
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <span className="flex-1 font-semibold text-grape-50">{c.name}</span>
              <button
                onClick={() => {
                  setEditing(c);
                  setForm({ name: c.name, avatar_url: c.avatar_url ?? '' });
                  setShowForm(true);
                }}
                className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
              >
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
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Editar Personagem' : 'Novo Personagem'} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="label">Nome</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <ImageUpload
              label="Ícone / avatar"
              folder="chatstory/avatars"
              currentUrl={form.avatar_url}
              onUploaded={(url) => setForm({ ...form, avatar_url: url })}
            />
            <div>
              <label className="label">URL do avatar</label>
              <input
                className="input"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------- Chatstories ------------------------- */
function StoriesAdmin() {
  const { toast } = useToast();
  const [items, setItems] = useState<Chatstory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Chatstory | null>(null);
  const [editing, setEditing] = useState<Chatstory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    cover_url: '',
    synopsis: '',
    is_published: true,
    sort_order: '0',
  });

  const load = () => {
    setLoading(true);
    supabase
      .from('chatstories')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as Chatstory[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', slug: '', cover_url: '', synopsis: '', is_published: true, sort_order: String(items.length) });
    setShowForm(true);
  };

  const openEdit = (s: Chatstory) => {
    setEditing(s);
    setForm({
      title: s.title,
      slug: s.slug,
      cover_url: s.cover_url ?? '',
      synopsis: s.synopsis ?? '',
      is_published: s.is_published,
      sort_order: String(s.sort_order ?? 0),
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast('Informe o título.', 'error');
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      cover_url: form.cover_url,
      synopsis: form.synopsis,
      is_published: form.is_published,
      sort_order: parseInt(form.sort_order, 10) || 0,
    };
    const { error } = editing
      ? await supabase.from('chatstories').update(payload).eq('id', editing.id)
      : await supabase.from('chatstories').insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    setShowForm(false);
    toast('Chatstory salva!', 'success');
    load();
  };

  const del = async (s: Chatstory) => {
    if (!window.confirm(`Excluir a chatstory "${s.title}" e todos os seus capítulos?`)) return;
    const { error } = await supabase.from('chatstories').delete().eq('id', s.id);
    if (error) return toast(error.message, 'error');
    toast('Chatstory excluída.', 'success');
    setSelected(null);
    load();
  };

  if (selected) {
    return <ChaptersAdmin story={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-grape-50">Chatstories</h2>
        <button onClick={openNew} className="btn-primary py-2 text-sm">
          <Plus size={16} /> Criar Chatstory
        </button>
      </div>

      {loading ? (
        <p className="text-grape-200/50">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-grape-200/50">Nenhuma chatstory cadastrada.</p>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <div key={s.id} className="card flex items-center gap-4 p-4">
              <div className="h-14 w-11 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-ink-700">
                {s.cover_url ? <img src={s.cover_url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-grape-50">{s.title}</h3>
                <p className="truncate text-xs text-grape-200/50">
                  /chatstorys/{s.slug} · {s.is_published ? 'Publicada' : 'Rascunho'}
                </p>
              </div>
              <button onClick={() => setSelected(s)} className="btn-ghost py-1.5 text-xs">
                Capítulos <ChevronRight size={14} />
              </button>
              <button onClick={() => openEdit(s)} className="rounded-lg p-2 text-grape-200 hover:bg-white/10">
                <Pencil size={16} />
              </button>
              <button onClick={() => del(s)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Editar Chatstory' : 'Nova Chatstory'} maxWidth="max-w-xl">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Título</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                placeholder={slugify(form.title) || 'ex: minha-historia'}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <ImageUpload
              label="Capa"
              folder="chatstory/covers"
              currentUrl={form.cover_url}
              onUploaded={(url) => setForm({ ...form, cover_url: url })}
            />
            <div>
              <label className="label">Sinopse</label>
              <textarea
                className="input min-h-[110px] resize-y"
                value={form.synopsis}
                onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-grape-200">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Publicada
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------- Capítulos ------------------------- */
function ChaptersAdmin({ story, onBack }: { story: Chatstory; onBack: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<ChatstoryChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ChatstoryChapter | null>(null);
  const [editing, setEditing] = useState<ChatstoryChapter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', sort_order: '0', is_published: true });

  const load = () => {
    setLoading(true);
    supabase
      .from('chatstory_chapters')
      .select('*')
      .eq('story_id', story.id)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        setItems((data as ChatstoryChapter[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, [story.id]);

  const save = async () => {
    if (!form.title.trim()) return toast('Informe o título do capítulo.', 'error');
    setSaving(true);
    const payload = {
      story_id: story.id,
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_published: form.is_published,
    };
    const { error } = editing
      ? await supabase.from('chatstory_chapters').update(payload).eq('id', editing.id)
      : await supabase.from('chatstory_chapters').insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    setShowForm(false);
    toast('Capítulo salvo!', 'success');
    load();
  };

  const del = async (c: ChatstoryChapter) => {
    if (!window.confirm(`Excluir o capítulo "${c.title}" e todo o seu conteúdo?`)) return;
    const { error } = await supabase.from('chatstory_chapters').delete().eq('id', c.id);
    if (error) return toast(error.message, 'error');
    toast('Capítulo excluído.', 'success');
    load();
  };

  if (selected) {
    return <ElementsAdmin chapter={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-grape-200/60 hover:text-grape-50">
        <ArrowLeft size={16} /> Chatstories
      </button>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-grape-50">Capítulos · {story.title}</h2>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ title: '', slug: '', sort_order: String(items.length), is_published: true });
            setShowForm(true);
          }}
          className="btn-primary py-2 text-sm"
        >
          <Plus size={16} /> Adicionar capítulo
        </button>
      </div>

      {loading ? (
        <p className="text-grape-200/50">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-grape-200/50">Nenhum capítulo ainda.</p>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.id} className="card flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-grape-50">{c.title}</h3>
                <p className="truncate text-xs text-grape-200/50">
                  /chatstorys/{story.slug}/{c.slug} · {c.is_published ? 'Publicado' : 'Rascunho'}
                </p>
              </div>
              <button onClick={() => setSelected(c)} className="btn-ghost py-1.5 text-xs">
                Conteúdo <ChevronRight size={14} />
              </button>
              <button
                onClick={() => {
                  setEditing(c);
                  setForm({
                    title: c.title,
                    slug: c.slug,
                    sort_order: String(c.sort_order ?? 0),
                    is_published: c.is_published,
                  });
                  setShowForm(true);
                }}
                className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
              >
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
        <Modal open onClose={() => setShowForm(false)} title={editing ? 'Editar Capítulo' : 'Novo Capítulo'} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Título</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
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
                placeholder={slugify(form.title) || 'ex: capitulo-1'}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-grape-200">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
              />
              Publicado
            </label>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-ghost">
                Cancelar
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------- Elementos do capítulo ------------------------- */
function ElementsAdmin({ chapter, onBack }: { chapter: ChatstoryChapter; onBack: () => void }) {
  const { toast } = useToast();
  const [items, setItems] = useState<ChatstoryElement[]>([]);
  const [characters, setCharacters] = useState<ChatstoryCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<'message' | 'narration'>('message');
  const [characterId, setCharacterId] = useState('');
  const [side, setSide] = useState<'left' | 'right'>('left');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      supabase.from('chatstory_elements').select('*').eq('chapter_id', chapter.id).order('sort_order', { ascending: true }),
      supabase.from('chatstory_characters').select('*').order('name', { ascending: true }),
    ]).then(([e, c]) => {
      setItems((e.data as ChatstoryElement[]) ?? []);
      const chars = (c.data as ChatstoryCharacter[]) ?? [];
      setCharacters(chars);
      setCharacterId((prev) => prev || chars[0]?.id || '');
      setLoading(false);
    });
  };
  useEffect(load, [chapter.id]);

  const reset = () => {
    setEditingId(null);
    setContent('');
  };

  const save = async () => {
    if (!content.trim()) return toast('Escreva o texto.', 'error');
    if (kind === 'message' && !characterId) return toast('Selecione um personagem.', 'error');
    setSaving(true);
    const payload = {
      chapter_id: chapter.id,
      kind,
      character_id: kind === 'message' ? characterId : null,
      side: kind === 'message' ? side : null,
      content: content.trim(),
      sort_order: editingId ? items.find((i) => i.id === editingId)?.sort_order ?? items.length : items.length,
    };
    const { error } = editingId
      ? await supabase.from('chatstory_elements').update(payload).eq('id', editingId)
      : await supabase.from('chatstory_elements').insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    reset();
    load();
  };

  const del = async (el: ChatstoryElement) => {
    if (!window.confirm('Excluir este elemento?')) return;
    const { error } = await supabase.from('chatstory_elements').delete().eq('id', el.id);
    if (error) return toast(error.message, 'error');
    load();
  };

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await supabase.from('chatstory_elements').update({ sort_order: b.sort_order }).eq('id', a.id);
    await supabase.from('chatstory_elements').update({ sort_order: a.sort_order }).eq('id', b.id);
    load();
  };

  const charName = (id: string | null) => characters.find((c) => c.id === id)?.name ?? 'Sem personagem';

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-grape-200/60 hover:text-grape-50">
        <ArrowLeft size={16} /> Capítulos
      </button>
      <h2 className="mb-4 font-display text-xl font-semibold text-grape-50">Conteúdo · {chapter.title}</h2>

      <div className="card mb-6 space-y-3 p-4">
        <div className="flex gap-2">
          {(
            [
              { id: 'message', label: 'Mensagem de personagem' },
              { id: 'narration', label: 'Narração' },
            ] as const
          ).map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                kind === k.id ? 'bg-white/15 text-grape-50' : 'border border-white/10 text-grape-200/70'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {kind === 'message' && (
          <div>
            <label className="label">Personagem</label>
            <select className="input" value={characterId} onChange={(e) => setCharacterId(e.target.value)}>
              <option value="">Selecione...</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="label mt-3">Posição do balão</label>
            <div className="flex gap-2">
              {(
                [
                  { id: 'left', label: 'Esquerda' },
                  { id: 'right', label: 'Direita' },
                ] as const
              ).map((s2) => (
                <button
                  key={s2.id}
                  type="button"
                  onClick={() => setSide(s2.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    side === s2.id ? 'bg-white/15 text-grape-50' : 'border border-white/10 text-grape-200/70'
                  }`}
                >
                  {s2.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="label">{kind === 'message' ? 'Mensagem' : 'Texto da narração'}</label>
          <textarea className="input min-h-[90px] resize-y" value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          {editingId && (
            <button onClick={reset} className="btn-ghost">
              Cancelar edição
            </button>
          )}
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? 'Salvando...' : editingId ? 'Salvar alteração' : 'Adicionar'}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-grape-200/50">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-grape-200/50">Nenhum elemento neste capítulo.</p>
      ) : (
        <div className="space-y-2">
          {items.map((el, i) => (
            <div key={el.id} className="card flex items-start gap-3 p-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => move(i, -1)} className="rounded p-1 text-grape-200/70 hover:bg-white/10">
                  <ArrowUp size={14} />
                </button>
                <button onClick={() => move(i, 1)} className="rounded p-1 text-grape-200/70 hover:bg-white/10">
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-grape-200/50">
                  {el.kind === 'narration'
                    ? 'Narração'
                    : `${charName(el.character_id)} · ${el.side === 'right' ? 'direita' : 'esquerda'}`}
                </p>
                <p className="whitespace-pre-wrap text-sm text-grape-100/85">{el.content}</p>
              </div>
              <button
                onClick={() => {
                  setEditingId(el.id);
                  setKind(el.kind);
                  setCharacterId(el.character_id ?? '');
                  setSide(el.side ?? 'left');
                  setContent(el.content);
                }}
                className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => del(el)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
