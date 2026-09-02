/*
# Webhook plan activation function

Creates a SECURITY DEFINER function that activates a user's plan
from the Mercado Pago webhook. This function uses the service role key
(security definer) to bypass RLS and update the profile directly.

Only callable via the service role key (not anon/authenticated).
*/

CREATE OR REPLACE FUNCTION public.activate_subscription_plan(
  p_user_id uuid,
  p_plan text,
  p_expires_at timestamptz
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF p_plan NOT IN ('free','dante_plus','dante_premium','dante_premium_plus') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_plan');
  END IF;

  UPDATE public.profiles
  SET plan = p_plan,
      plan_expires_at = p_expires_at
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Revoke EXECUTE from anon and authenticated (only service role can call)
REVOKE EXECUTE ON FUNCTION public.activate_subscription_plan(uuid, text, timestamptz) FROM anon, authenticated;
