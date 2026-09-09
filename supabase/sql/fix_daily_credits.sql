-- =====================================================================
-- Créditos diários do Dante: recarga automática (não acumulativa)
-- Rode este script no SQL Editor do Supabase.
-- =====================================================================

-- Limite diário por plano (mesma tabela usada no frontend em src/lib/plans.ts)
CREATE OR REPLACE FUNCTION public.plan_daily_limit(p_plan text, p_expires timestamptz)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_plan IS NULL OR p_plan = 'free' THEN 10
    WHEN p_expires IS NULL OR p_expires <= now() THEN 10
    WHEN p_plan = 'dante_plus' THEN 20
    WHEN p_plan = 'dante_premium' THEN 40
    WHEN p_plan = 'dante_premium_plus' THEN 100
    ELSE 10
  END;
$$;

-- Recarga sob demanda: chamada pelo próprio usuário ao abrir o site / o chat.
-- Não acumula: no primeiro acesso do dia os créditos voltam ao limite do plano.
CREATE OR REPLACE FUNCTION public.ensure_daily_credits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_today date := (now() AT TIME ZONE 'America/Fortaleza')::date;
  v_credits integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.profiles p
     SET credits = public.plan_daily_limit(p.plan::text, p.plan_expires_at),
         messages_today = 0,
         last_message_date = v_today
   WHERE p.id = v_uid
     AND (p.last_message_date IS DISTINCT FROM v_today)
  RETURNING p.credits INTO v_credits;

  IF v_credits IS NULL THEN
    SELECT credits INTO v_credits FROM public.profiles WHERE id = v_uid;
  END IF;

  RETURN COALESCE(v_credits, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_daily_credits() FROM public;
GRANT EXECUTE ON FUNCTION public.ensure_daily_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_daily_credits() TO service_role;

-- Reset em massa (opcional, para pg_cron à meia-noite)
CREATE OR REPLACE FUNCTION public.reset_daily_credits()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET credits = public.plan_daily_limit(plan::text, plan_expires_at),
         messages_today = 0,
         last_message_date = (now() AT TIME ZONE 'America/Fortaleza')::date
   WHERE last_message_date IS DISTINCT FROM (now() AT TIME ZONE 'America/Fortaleza')::date;
$$;

REVOKE ALL ON FUNCTION public.reset_daily_credits() FROM public;
GRANT EXECUTE ON FUNCTION public.reset_daily_credits() TO service_role;

-- Correção imediata de quem está travado em 0 crédito sem recarga hoje
UPDATE public.profiles
   SET credits = public.plan_daily_limit(plan::text, plan_expires_at),
       messages_today = 0,
       last_message_date = (now() AT TIME ZONE 'America/Fortaleza')::date
 WHERE last_message_date IS DISTINCT FROM (now() AT TIME ZONE 'America/Fortaleza')::date;
