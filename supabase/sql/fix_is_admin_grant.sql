-- =====================================================================
-- CORREÇÃO: "permission denied for function is_admin"
-- Rode este script inteiro no SQL Editor do Supabase.
-- =====================================================================

-- Recria a função com SECURITY DEFINER e search_path fixo
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

-- O erro acontece porque os roles do Data API não têm EXECUTE na função,
-- que é usada dentro das policies de RLS (ad_banners, chatstory_elements, etc.)
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;

-- Garante leitura da própria linha de profiles (usada pela função)
grant select on public.profiles to authenticated;

-- Grants do Data API para os banners
grant select on public.ad_banners to anon, authenticated;
grant insert, update, delete on public.ad_banners to authenticated;
grant all on public.ad_banners to service_role;

-- Coluna de tags do bloco de anúncio na Chatstory (caso ainda não exista)
alter table public.chatstory_elements
  add column if not exists ad_tags text[] null;
