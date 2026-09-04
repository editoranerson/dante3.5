import { useEffect, useState } from 'react';
import {
  Megaphone,
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Home as HomeIcon,
  MessageSquareCode,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/Toast';
import { navigateTo } from '@/lib/router';
import { ImageUpload } from '@/components/ImageUpload';
import {
  AD_PLANO_LABELS,
  HOME_BANNER_SIZES,
  HTML_BANNER_SIZES,
  INFEED_BANNER_SIZE,
  PROMO_TABLE,
  buildImageBannerHtml,
  invalidateBannerCache,
  type AdBanner,
  type AdPlacement,
  type AdPlano,
  type AdTipo,
} from '@/lib/promos';

type Tab = AdPlacement;

interface FormState {
  nome_interno: string;
  tipo_anuncio: AdTipo;
  plano: AdPlano | '';
  peso_sorteio: string;
  codigo_html_mobile: string;
  codigo_html_desktop: string;
  link_url: string;
  image_mobile_url: string;
  image_desktop_url: string;
  ativo: boolean;
}

const emptyForm: FormState = {
  nome_interno: '',
  tipo_anuncio: 'pub',
  plano: 'bronze',
  peso_sorteio: '10',
  codigo_html_mobile: '',
  codigo_html_desktop: '',
  link_url: '',
  image_mobile_url: '',
  image_desktop_url: '',
  ativo: true,
};

export function AnunciosPage() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div className="animate-fade-in mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigateTo({ name: 'profile' })}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-grape-200/60 hover:text-grape-50"
      >
        <ArrowLeft size={16} /> Meu perfil
      </button>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold-400/15">
          <Megaphone size={24} className="text-gold-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-grape-50">Anúncios</h1>
          <p className="text-sm text-grape-200/70">
            Painel central de banners da Home, do Chat do Dante e das Chatstorys.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            { id: 'home' as const, label: 'Banners da Home', icon: HomeIcon },
            { id: 'html' as const, label: 'Chat Dante e Chatstory', icon: MessageSquareCode },
            { id: 'infeed' as const, label: 'In-feed (Personagens e Cartas)', icon: LayoutGrid },
          ]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === t.id
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                : 'border border-white/10 text-grape-200/70 hover:bg-white/5'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      <BannersManager placement={tab} />
    </div>
  );
}

function BannersManager({ placement }: { placement: AdPlacement }) {
  const { toast } = useToast();
  const [items, setItems] = useState<AdBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const isHome = placement === 'home';
  const isFeed = placement === 'infeed';

  const load = () => {
    setLoading(true);
    supabase
      .from(PROMO_TABLE)
      .select('*')
      .eq('placement', placement)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error');
        setItems((data as AdBanner[]) ?? []);
        setLoading(false);
      });
  };
  useEffect(load, [placement]);

  const reset = () => {
    setEditingId(null);
    setForm({ ...emptyForm, tipo_anuncio: isHome ? 'pub' : 'pub' });
    setShowForm(false);
  };

  const startEdit = (b: AdBanner) => {
    setEditingId(b.id);
    setForm({
      nome_interno: b.nome_interno,
      tipo_anuncio: b.tipo_anuncio,
      plano: b.plano ?? '',
      peso_sorteio: String(b.peso_sorteio ?? 10),
      codigo_html_mobile: b.codigo_html_mobile ?? '',
      codigo_html_desktop: b.codigo_html_desktop ?? '',
      link_url: b.link_url ?? '',
      image_mobile_url: b.image_mobile_url ?? '',
      image_desktop_url: b.image_desktop_url ?? '',
      ativo: b.ativo,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.nome_interno.trim()) return toast('Informe a Tag / Nome interno.', 'error');

    let mobile = form.codigo_html_mobile.trim();
    let desktop = form.codigo_html_desktop.trim();

    if (isHome) {
      if (!form.image_mobile_url || !form.image_desktop_url)
        return toast('Envie as imagens mobile e desktop.', 'error');
      mobile = buildImageBannerHtml(form.image_mobile_url, form.link_url.trim());
      desktop = buildImageBannerHtml(form.image_desktop_url, form.link_url.trim());
    } else if (isFeed) {
      if (!mobile) return toast('Informe o código HTML do bloco in-feed.', 'error');
      desktop = mobile;
    } else {
      if (!mobile || !desktop)
        return toast('Os códigos HTML mobile e desktop são obrigatórios.', 'error');
    }

    const tipo: AdTipo = isHome ? 'pub' : form.tipo_anuncio;
    if (tipo === 'pub' && !form.plano) return toast('Selecione o plano do banner.', 'error');

    const payload = {
      nome_interno: form.nome_interno.trim(),
      placement,
      tipo_anuncio: tipo,
      plano: tipo === 'pub' ? (form.plano as AdPlano) : null,
      peso_sorteio: Math.max(1, parseInt(form.peso_sorteio, 10) || 10),
      codigo_html_mobile: mobile,
      codigo_html_desktop: desktop,
      link_url: isHome ? form.link_url.trim() || null : null,
      image_mobile_url: isHome ? form.image_mobile_url || null : null,
      image_desktop_url: isHome ? form.image_desktop_url || null : null,
      ativo: form.ativo,
    };

    setSaving(true);
    const { error } = editingId
      ? await supabase.from(PROMO_TABLE).update(payload).eq('id', editingId)
      : await supabase.from(PROMO_TABLE).insert(payload);
    setSaving(false);
    if (error) return toast(error.message, 'error');
    invalidateBannerCache();
    toast(editingId ? 'Banner atualizado!' : 'Banner criado!', 'success');
    reset();
    load();
  };

  const toggle = async (b: AdBanner) => {
    const { error } = await supabase.from(PROMO_TABLE).update({ ativo: !b.ativo }).eq('id', b.id);
    if (error) return toast(error.message, 'error');
    invalidateBannerCache();
    load();
  };

  const del = async (b: AdBanner) => {
    if (!window.confirm(`Excluir o banner "${b.nome_interno}"?`)) return;
    const { error } = await supabase.from(PROMO_TABLE).delete().eq('id', b.id);
    if (error) return toast(error.message, 'error');
    invalidateBannerCache();
    load();
  };

  return (
    <div>
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-grape-200/70">
        {isFeed ? (
          <>
            Tamanho único e responsivo —{' '}
            <b className="text-grape-50">{INFEED_BANNER_SIZE.label}</b>. O bloco ocupa exatamente
            uma célula do feed de Personagens e Cartas.
          </>
        ) : isHome ? (
          <>
            Tamanhos recomendados — <b className="text-grape-50">Mobile: {HOME_BANNER_SIZES.mobile.label}</b> ·{' '}
            <b className="text-grape-50">Desktop: {HOME_BANNER_SIZES.desktop.label}</b>
          </>
        ) : (
          <>
            Tamanhos padrão — <b className="text-grape-50">Mobile: {HTML_BANNER_SIZES.mobile}</b> ·{' '}
            <b className="text-grape-50">Desktop: {HTML_BANNER_SIZES.desktop}</b>. O Chat do Dante
            exibe somente o código mobile.
          </>
        )}
      </div>

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => (showForm ? reset() : setShowForm(true))}
          className={showForm ? 'btn-ghost' : 'btn-primary'}
        >
          {showForm ? 'Cancelar' : (
            <>
              <Plus size={16} /> Novo banner
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tag / Nome interno</label>
              <input
                className="input"
                value={form.nome_interno}
                onChange={(e) => setForm({ ...form, nome_interno: e.target.value })}
                placeholder="ex: parceiro-livraria-01"
              />
            </div>
            <div>
              <label className="label">Peso do sorteio</label>
              <input
                className="input"
                type="number"
                min={1}
                value={form.peso_sorteio}
                onChange={(e) => setForm({ ...form, peso_sorteio: e.target.value })}
              />
            </div>
          </div>

          {!isHome && (
            <div>
              <label className="label">Tipo de anúncio</label>
              <div className="flex gap-2">
                {(
                  [
                    { id: 'ad' as const, label: 'Ad (rede/HTML)' },
                    { id: 'pub' as const, label: 'Pub (patrocinado)' },
                  ]
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setForm({ ...form, tipo_anuncio: t.id })}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      form.tipo_anuncio === t.id
                        ? 'bg-white/15 text-grape-50'
                        : 'border border-white/10 text-grape-200/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isHome || form.tipo_anuncio === 'pub') && (
            <div>
              <label className="label">Plano do banner</label>
              <select
                className="input"
                value={form.plano}
                onChange={(e) => setForm({ ...form, plano: e.target.value as AdPlano })}
              >
                <option value="">Selecione...</option>
                {(Object.keys(AD_PLANO_LABELS) as AdPlano[]).map((p) => (
                  <option key={p} value={p}>
                    {AD_PLANO_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isHome ? (
            <div className="space-y-4">
              <div>
                <label className="label">Link de destino (clique)</label>
                <input
                  className="input"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ImageUpload
                  label={`Imagem mobile — ${HOME_BANNER_SIZES.mobile.label}`}
                  folder="ads"
                  currentUrl={form.image_mobile_url}
                  onUploaded={(url) => setForm((f) => ({ ...f, image_mobile_url: url }))}
                />
                <ImageUpload
                  label={`Imagem desktop — ${HOME_BANNER_SIZES.desktop.label}`}
                  folder="ads"
                  currentUrl={form.image_desktop_url}
                  onUploaded={(url) => setForm((f) => ({ ...f, image_desktop_url: url }))}
                />
              </div>
            </div>
          ) : isFeed ? (
            <div>
              <label className="label">Código HTML do bloco in-feed *</label>
              <textarea
                className="input min-h-[110px] resize-y font-mono text-xs"
                value={form.codigo_html_mobile}
                onChange={(e) => setForm({ ...form, codigo_html_mobile: e.target.value })}
                placeholder={`Imagem recomendada: ${INFEED_BANNER_SIZE.label}`}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Código HTML mobile *</label>
                <textarea
                  className="input min-h-[110px] resize-y font-mono text-xs"
                  value={form.codigo_html_mobile}
                  onChange={(e) => setForm({ ...form, codigo_html_mobile: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Código HTML desktop *</label>
                <textarea
                  className="input min-h-[110px] resize-y font-mono text-xs"
                  value={form.codigo_html_desktop}
                  onChange={(e) => setForm({ ...form, codigo_html_desktop: e.target.value })}
                />
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-grape-100/80">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
            />
            Banner ativo
          </label>

          <div className="flex justify-end gap-2">
            <button onClick={reset} className="btn-ghost">
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar banner'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-grape-200/50">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-grape-200/50">Nenhum banner cadastrado neste setor.</p>
      ) : (
        <div className="space-y-2">
          {items.map((b) => (
            <div key={b.id} className="card flex flex-wrap items-center gap-3 p-4">
              {b.image_mobile_url && (
                <img
                  src={b.image_mobile_url}
                  alt=""
                  className="h-10 w-24 flex-shrink-0 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-grape-50">{b.nome_interno}</p>
                <p className="text-xs text-grape-200/60">
                  {b.tipo_anuncio === 'ad' ? 'Ad' : `Pub · ${AD_PLANO_LABELS[b.plano as AdPlano]}`} ·
                  peso {b.peso_sorteio} · {b.ativo ? 'ativo' : 'inativo'}
                </p>
              </div>
              <button
                onClick={() => toggle(b)}
                className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
                title={b.ativo ? 'Desativar' : 'Ativar'}
              >
                {b.ativo ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                onClick={() => startEdit(b)}
                className="rounded-lg p-2 text-grape-200 hover:bg-white/10"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => del(b)}
                className="rounded-lg p-2 text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
