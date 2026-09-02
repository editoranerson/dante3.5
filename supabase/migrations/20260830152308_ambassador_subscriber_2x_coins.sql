/*
# Ambassador 2x Coins for subscribers

Modify all 5 reward functions to double the Coins awarded when the ambassador
has an active subscription (dante_plus, dante_premium, or dante_premium_plus).

The check is: ambassador's profile has plan != 'free' AND plan_expires_at > now().
*/

-- Helper: check if ambassador has active subscription
CREATE OR REPLACE FUNCTION public.is_subscriber(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT plan IS NOT NULL
    AND plan != 'free'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at > now()
  FROM profiles
  WHERE id = p_user_id;
$$;

-- 1. confirm_visit_retention: double batch_coins for subscribers
CREATE OR REPLACE FUNCTION public.confirm_visit_retention(p_visit_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
visit affiliate_visits;
batch_size integer;
batch_coins integer;
valid_visits_count integer;
custom_rule affiliate_custom_rules;
counted_visits integer;
already_counted integer;
final_coins integer;
BEGIN
SELECT * INTO visit FROM affiliate_visits WHERE id = p_visit_id;
IF NOT FOUND THEN
RETURN json_build_object('ok', false, 'error', 'visit_not_found');
END IF;

IF visit.retained THEN
RETURN json_build_object('ok', true, 'already_retained', true);
END IF;

UPDATE affiliate_visits SET retained = true WHERE id = p_visit_id;

SELECT value INTO batch_size FROM site_content WHERE key = 'affiliate_visit_batch_size';
SELECT value INTO batch_coins FROM site_content WHERE key = 'affiliate_visit_batch_coins';

SELECT * INTO custom_rule FROM affiliate_custom_rules WHERE ambassador_id = visit.ambassador_id;
IF custom_rule IS NOT NULL AND custom_rule.visit_batch_size IS NOT NULL THEN
batch_size := custom_rule.visit_batch_size;
batch_coins := COALESCE(custom_rule.visit_batch_coins, batch_coins);
END IF;

batch_size := COALESCE(batch_size::integer, 10);
batch_coins := COALESCE(batch_coins::integer, 5);

-- Double coins for subscribers
IF public.is_subscriber(visit.ambassador_id) THEN
  batch_coins := batch_coins * 2;
END IF;

-- Count total retained visits for this ambassador
SELECT count(*) INTO counted_visits
FROM affiliate_visits
WHERE ambassador_id = visit.ambassador_id
AND retained = true;

-- Count how many visits were already credited in previous batches
BEGIN
SELECT COALESCE(sum((source_description::json->>'visits')::integer), 0) INTO already_counted
FROM affiliate_earnings
WHERE ambassador_id = visit.ambassador_id
AND source_type = 'visit_batch'
AND source_description IS NOT NULL
AND source_description != '';
EXCEPTION WHEN OTHERS THEN
already_counted := 0;
END;

valid_visits_count := counted_visits - already_counted;

IF valid_visits_count >= batch_size THEN
final_coins := batch_coins;
UPDATE affiliate_accounts SET coins = coins + final_coins WHERE user_id = visit.ambassador_id;
INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
VALUES (visit.ambassador_id, final_coins, 'visit_batch',
json_build_object('visits', valid_visits_count, 'last_visit_id', visit.id)::text);
RETURN json_build_object('ok', true, 'retained', true, 'batch_credited', true, 'coins', final_coins, 'valid_visits', valid_visits_count);
END IF;

RETURN json_build_object('ok', true, 'retained', true, 'batch_credited', false, 'valid_visits', valid_visits_count);
END;
$function$;

-- 2. award_referral_signup: double signup_coins for subscribers
CREATE OR REPLACE FUNCTION public.award_referral_signup(p_referred_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
referral affiliate_referrals;
signup_coins integer;
custom_rule affiliate_custom_rules;
final_coins integer;
BEGIN
SELECT * INTO referral FROM affiliate_referrals WHERE referred_id = p_referred_id;
IF NOT FOUND THEN
RETURN json_build_object('ok', false, 'error', 'no_referral');
END IF;

SELECT value INTO signup_coins FROM site_content WHERE key = 'affiliate_signup_coins';
SELECT * INTO custom_rule FROM affiliate_custom_rules WHERE ambassador_id = referral.ambassador_id;
IF custom_rule IS NOT NULL AND custom_rule.signup_coins IS NOT NULL THEN
signup_coins := custom_rule.signup_coins::text;
END IF;
signup_coins := COALESCE(signup_coins::integer, 20);

-- Double coins for subscribers
IF public.is_subscriber(referral.ambassador_id) THEN
  signup_coins := signup_coins * 2;
END IF;

final_coins := signup_coins;

UPDATE affiliate_accounts SET coins = coins + final_coins
WHERE user_id = referral.ambassador_id AND NOT is_blocked;
INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
VALUES (referral.ambassador_id, final_coins, 'referral_signup', 'Indicado se cadastrou');

RETURN json_build_object('ok', true, 'coins', final_coins);
END;
$function$;

-- 3. award_referral_subscription: double plan_coins for subscribers
CREATE OR REPLACE FUNCTION public.award_referral_subscription(p_referred_id uuid, p_plan text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
referral affiliate_referrals;
plan_coins text;
custom_rule affiliate_custom_rules;
override jsonb;
final_coins integer;
BEGIN
SELECT * INTO referral FROM affiliate_referrals WHERE referred_id = p_referred_id;
IF NOT FOUND THEN
RETURN json_build_object('ok', false, 'error', 'no_referral');
END IF;

plan_coins := '0';
IF p_plan = 'dante_plus' THEN
SELECT value INTO plan_coins FROM site_content WHERE key = 'affiliate_plan_dante_plus_coins';
ELSIF p_plan = 'dante_premium' THEN
SELECT value INTO plan_coins FROM site_content WHERE key = 'affiliate_plan_dante_premium_coins';
ELSIF p_plan = 'dante_premium_plus' THEN
SELECT value INTO plan_coins FROM site_content WHERE key = 'affiliate_plan_dante_premium_plus_coins';
END IF;

SELECT * INTO custom_rule FROM affiliate_custom_rules WHERE ambassador_id = referral.ambassador_id;
IF custom_rule IS NOT NULL AND custom_rule.plan_coins_override IS NOT NULL THEN
override := custom_rule.plan_coins_override->p_plan;
IF override IS NOT NULL THEN
plan_coins := override::text;
END IF;
END IF;

IF COALESCE(plan_coins::integer, 0) = 0 THEN
RETURN json_build_object('ok', true, 'coins', 0, 'note', 'no_coins_for_plan');
END IF;

final_coins := plan_coins::integer;

-- Double coins for subscribers
IF public.is_subscriber(referral.ambassador_id) THEN
  final_coins := final_coins * 2;
END IF;

UPDATE affiliate_accounts SET coins = coins + final_coins
WHERE user_id = referral.ambassador_id AND NOT is_blocked;
INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
VALUES (referral.ambassador_id, final_coins, 'referral_subscription', 'Indicado assinou plano: ' || p_plan);

RETURN json_build_object('ok', true, 'coins', final_coins);
END;
$function$;

-- 4. award_referral_credits: double coins_to_award for subscribers
CREATE OR REPLACE FUNCTION public.award_referral_credits(p_referred_id uuid, p_credits_used integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
referral affiliate_referrals;
threshold text;
coins_per text;
custom_rule affiliate_custom_rules;
coins_to_award integer;
BEGIN
SELECT * INTO referral FROM affiliate_referrals WHERE referred_id = p_referred_id;
IF NOT FOUND THEN
RETURN json_build_object('ok', false, 'error', 'no_referral');
END IF;

SELECT value INTO threshold FROM site_content WHERE key = 'affiliate_credits_threshold';
SELECT value INTO coins_per FROM site_content WHERE key = 'affiliate_credits_coins_per';

SELECT * INTO custom_rule FROM affiliate_custom_rules WHERE ambassador_id = referral.ambassador_id;
IF custom_rule IS NOT NULL THEN
threshold := COALESCE(custom_rule.credits_threshold::text, threshold);
coins_per := COALESCE(custom_rule.credits_coins_per::text, coins_per);
END IF;

coins_to_award := (p_credits_used / COALESCE(threshold::integer, 10)) * COALESCE(coins_per::integer, 2);

-- Double coins for subscribers
IF public.is_subscriber(referral.ambassador_id) THEN
  coins_to_award := coins_to_award * 2;
END IF;

IF coins_to_award <= 0 THEN
RETURN json_build_object('ok', true, 'coins', 0, 'note', 'below_threshold');
END IF;

UPDATE affiliate_accounts SET coins = coins + coins_to_award
WHERE user_id = referral.ambassador_id AND NOT is_blocked;
INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
VALUES (referral.ambassador_id, coins_to_award, 'referral_credits',
'Indicado usou ' || p_credits_used || ' creditos');

RETURN json_build_object('ok', true, 'coins', coins_to_award);
END;
$function$;

-- 5. award_referral_dantes: double coins_to_award for subscribers
CREATE OR REPLACE FUNCTION public.award_referral_dantes(p_referred_id uuid, p_dantes_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
referral affiliate_referrals;
threshold text;
coins_per text;
custom_rule affiliate_custom_rules;
coins_to_award integer;
BEGIN
SELECT * INTO referral FROM affiliate_referrals WHERE referred_id = p_referred_id;
IF NOT FOUND THEN
RETURN json_build_object('ok', false, 'error', 'no_referral');
END IF;

SELECT value INTO threshold FROM site_content WHERE key = 'affiliate_dantes_threshold';
SELECT value INTO coins_per FROM site_content WHERE key = 'affiliate_dantes_coins_per';

SELECT * INTO custom_rule FROM affiliate_custom_rules WHERE ambassador_id = referral.ambassador_id;
IF custom_rule IS NOT NULL THEN
threshold := COALESCE(custom_rule.dantes_threshold::text, threshold);
coins_per := COALESCE(custom_rule.dantes_coins_per::text, coins_per);
END IF;

coins_to_award := (p_dantes_amount / COALESCE(threshold::integer, 50)) * COALESCE(coins_per::integer, 1);

-- Double coins for subscribers
IF public.is_subscriber(referral.ambassador_id) THEN
  coins_to_award := coins_to_award * 2;
END IF;

IF coins_to_award <= 0 THEN
RETURN json_build_object('ok', true, 'coins', 0, 'note', 'below_threshold');
END IF;

UPDATE affiliate_accounts SET coins = coins + coins_to_award
WHERE user_id = referral.ambassador_id AND NOT is_blocked;
INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
VALUES (referral.ambassador_id, coins_to_award, 'referral_dantes',
'Indicado ganhou ' || p_dantes_amount || ' Dantes');

RETURN json_build_object('ok', true, 'coins', coins_to_award);
END;
$function$;

-- Revoke EXECUTE on the new helper function from everyone except other functions
REVOKE EXECUTE ON FUNCTION public.is_subscriber(uuid) FROM anon, authenticated;
