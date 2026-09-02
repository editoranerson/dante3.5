-- =====================================================================
-- SISTEMA DE BANNERS DE ANÚNCIOS — Universo Querido Dante
-- Rode este script completo no SQL Editor do Supabase.
-- =====================================================================

-- ---------- Tipos enumerados ----------
do $$ begin
  create type public.ad_tipo as enum ('ad', 'pub');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ad_plano as enum ('bronze', 'prata', 'ouro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ad_placement as enum ('home', 'html');
exception when duplicate_object then null; end $$;

-- ---------- Função is_admin (caso ainda não exista) ----------
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id and p.role = 'admin'
  )
$$;

-- ---------- Tabela de banners ----------
create table if not exists public.ad_banners (
  id                   uuid primary key default gen_random_uuid(),
  nome_interno         text not null unique,                 -- funciona como a TAG do banner
  placement            public.ad_placement not null default 'html', -- 'home' = carrossel da Home | 'html' = Chat Dante / Chatstory
  tipo_anuncio         public.ad_tipo not null default 'pub',
  plano                public.ad_plano null,
  peso_sorteio         integer not null default 10 check (peso_sorteio > 0),
  codigo_html_mobile   text not null,
  codigo_html_desktop  text not null,
  -- campos exclusivos dos banners da Home (imagem + link)
  link_url             text null,
  image_mobile_url     text null,
  image_desktop_url    text null,
  ativo                boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  -- 'pub' exige plano; 'ad' não pode ter plano
  constraint ad_banners_plano_check check (
    (tipo_anuncio = 'pub' and plano is not null) or
    (tipo_anuncio = 'ad'  and plano is null)
  ),
  -- banners da Home são sempre 'pub'
  constraint ad_banners_home_pub_check check (
    placement <> 'home' or tipo_anuncio = 'pub'
  ),
  constraint ad_banners_html_check check (
    length(trim(codigo_html_mobile)) > 0 and length(trim(codigo_html_desktop)) > 0
  )
);

create index if not exists ad_banners_placement_ativo_idx on public.ad_banners (placement, ativo);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists ad_banners_set_updated_at on public.ad_banners;
create trigger ad_banners_set_updated_at
before update on public.ad_banners
for each row execute function public.set_updated_at();

-- ---------- Grants ----------
grant select on public.ad_banners to anon, authenticated;
grant insert, update, delete on public.ad_banners to authenticated;
grant all on public.ad_banners to service_role;

-- ---------- RLS ----------
alter table public.ad_banners enable row level security;

drop policy if exists "Banners ativos são públicos" on public.ad_banners;
create policy "Banners ativos são públicos"
on public.ad_banners for select
to anon, authenticated
using (ativo = true or public.is_admin(auth.uid()));

drop policy if exists "Admins gerenciam banners (insert)" on public.ad_banners;
create policy "Admins gerenciam banners (insert)"
on public.ad_banners for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins gerenciam banners (update)" on public.ad_banners;
create policy "Admins gerenciam banners (update)"
on public.ad_banners for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins gerenciam banners (delete)" on public.ad_banners;
create policy "Admins gerenciam banners (delete)"
on public.ad_banners for delete
to authenticated
using (public.is_admin(auth.uid()));

-- =====================================================================
-- CHATSTORY: bloco de anúncio <AdBlock /> como elemento do capítulo
-- =====================================================================

-- tags de banners associadas ao ponto da história
alter table public.chatstory_elements
  add column if not exists ad_tags text[] null;

-- permite kind = 'ad' (funciona tanto se 'kind' for enum quanto text+check)
do $$
declare
  v_udt text;
  v_is_enum boolean;
  r record;
begin
  select c.udt_name into v_udt
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = 'chatstory_elements' and c.column_name = 'kind';

  select exists (
    select 1 from pg_type t where t.typname = v_udt and t.typtype = 'e'
  ) into v_is_enum;

  if v_is_enum then
    execute format('alter type public.%I add value if not exists %L', v_udt, 'ad');
  else
    for r in
      select conname from pg_constraint
      where conrelid = 'public.chatstory_elements'::regclass
        and contype = 'c'
        and pg_get_constraintdef(oid) ilike '%kind%'
    loop
      execute format('alter table public.chatstory_elements drop constraint %I', r.conname);
    end loop;
    alter table public.chatstory_elements
      add constraint chatstory_elements_kind_check
      check (kind in ('message', 'narration', 'ad'));
  end if;
end $$;

-- =====================================================================
-- (Opcional) Exemplos para testar rapidamente — apague se não quiser.
-- =====================================================================
-- insert into public.ad_banners (nome_interno, placement, tipo_anuncio, plano, peso_sorteio, codigo_html_mobile, codigo_html_desktop, link_url, image_mobile_url, image_desktop_url)
-- values ('home-exemplo-ouro', 'home', 'pub', 'ouro', 50,
--   '<a href="https://exemplo.com" target="_blank" rel="noopener sponsored"><img src="https://placehold.co/720x240" alt=""/></a>',
--   '<a href="https://exemplo.com" target="_blank" rel="noopener sponsored"><img src="https://placehold.co/1200x300" alt=""/></a>',
--   'https://exemplo.com', 'https://placehold.co/720x240', 'https://placehold.co/1200x300');
--
-- insert into public.ad_banners (nome_interno, placement, tipo_anuncio, plano, peso_sorteio, codigo_html_mobile, codigo_html_desktop)
-- values ('chat-ad-exemplo', 'html', 'ad', null, 30,
--   '<a href="https://exemplo.com" target="_blank"><img src="https://placehold.co/320x50" alt=""/></a>',
--   '<a href="https://exemplo.com" target="_blank"><img src="https://placehold.co/728x90" alt=""/></a>');
