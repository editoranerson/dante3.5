-- =====================================================================
-- IN-FEED + VIEW NEUTRA (anti-bloqueadores) — Universo Querido Dante
-- Rode este script completo no SQL Editor do Supabase.
-- =====================================================================

-- 1) Novo placement 'infeed' (Personagens e Cartas colecionáveis)
alter type public.ad_placement add value if not exists 'infeed';

-- 2) View com nome neutro usada pelo site (evita filtros de adblock em
--    URLs contendo "ad_banners"). Simples => atualizável (insert/update/delete).
create or replace view public.spotlights
with (security_invoker = true)
as select * from public.ad_banners;

grant select on public.spotlights to anon, authenticated;
grant insert, update, delete on public.spotlights to authenticated;
grant all on public.spotlights to service_role;

-- 3) Garantias de permissão da tabela base (RLS continua valendo)
grant select on public.ad_banners to anon, authenticated;
grant insert, update, delete on public.ad_banners to authenticated;
grant all on public.ad_banners to service_role;

-- 4) is_admin acessível (usado pelas policies)
grant execute on function public.is_admin(uuid) to anon, authenticated, service_role;
