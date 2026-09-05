-- Corrige o sistema de Embaixadores (afiliados)
-- Problema: check_affiliate_account() retornava uma linha com todos os campos NULL
-- quando o usuario nao tinha conta, fazendo o painel exibir o link como "null".
-- become_ambassador() tambem tentava inserir user_id NULL.

begin;

drop function if exists public.check_affiliate_account();
drop function if exists public.become_ambassador();
drop function if exists public.generate_referral_code();

-- Gera um codigo unico de 8 caracteres
create or replace function public.generate_referral_code()
returns text
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_code text;
  v_try int := 0;
begin
  loop
    v_try := v_try + 1;
    v_code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
    exit when not exists (select 1 from public.affiliate_accounts where referral_code = v_code);
    if v_try > 20 then
      raise exception 'nao foi possivel gerar codigo de indicacao';
    end if;
  end loop;
  return v_code;
end;
$$;

-- Retorna a conta do embaixador OU NULL (nunca uma linha vazia)
create or replace function public.check_affiliate_account()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(a) from public.affiliate_accounts a where a.user_id = auth.uid();
$$;

-- Cria a conta de embaixador do usuario autenticado (idempotente)
create or replace function public.become_ambassador()
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.affiliate_accounts;
begin
  if v_uid is null then
    raise exception 'usuario nao autenticado';
  end if;

  select * into v_row from public.affiliate_accounts where user_id = v_uid;
  if found then
    return to_jsonb(v_row);
  end if;

  insert into public.affiliate_accounts (user_id, referral_code, coins, is_blocked)
  values (v_uid, public.generate_referral_code(), 0, false)
  on conflict (user_id) do nothing;

  select * into v_row from public.affiliate_accounts where user_id = v_uid;
  return to_jsonb(v_row);
end;
$$;

revoke all on function public.generate_referral_code() from public;
grant execute on function public.check_affiliate_account() to anon, authenticated, service_role;
grant execute on function public.become_ambassador() to authenticated, service_role;
grant execute on function public.generate_referral_code() to service_role;

-- Repara contas antigas sem codigo valido
update public.affiliate_accounts
set referral_code = public.generate_referral_code()
where referral_code is null or referral_code = '';

commit;
