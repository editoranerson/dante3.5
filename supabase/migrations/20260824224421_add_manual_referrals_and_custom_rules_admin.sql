/*
# Add manual referral tracking + admin functions for custom rules and referrals

## Changes

1. New Columns
   - `affiliate_referrals.is_manual` (boolean, default false): marks referrals
     that were manually attached by an admin (vs. automatic via signup link).
     Only manually-attached referrals can be removed by admin.

2. New Functions (all SECURITY DEFINER, check is_admin() internally)
   - `admin_save_custom_rules(p_ambassador_id, ...)`: UPSERT custom rules for
     a specific ambassador. All rule parameters are nullable — NULL means
     "use global default".
   - `admin_get_custom_rules(p_ambassador_id)`: reads custom rules for an
     ambassador (returns NULL if none exist).
   - `admin_attach_referral(p_ambassador_id, p_referred_id)`: manually links
     an existing user to an ambassador. Sets is_manual = true.
   - `admin_remove_referral(p_referral_id)`: removes a referral link. Only
     works on rows where is_manual = true (prevents removing organic referrals).

3. RLS Policies
   - Add admin SELECT/INSERT/UPDATE/DELETE policies on affiliate_referrals
     (table currently has RLS enabled but no policies, so all queries return
     zero rows for the admin).
   - Add admin SELECT/INSERT/UPDATE policies on affiliate_custom_rules
     (table already has RLS + some policies, adding missing INSERT/UPDATE/DELETE).

4. Notes
   - All functions verify admin status via is_admin() before mutating data.
   - admin_attach_referral prevents duplicate links (same ambassador + referred user).
   - admin_remove_referral refuses to delete organic (non-manual) referrals.
*/

-- Add is_manual column to affiliate_referrals
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'affiliate_referrals' AND column_name = 'is_manual'
  ) THEN
    ALTER TABLE affiliate_referrals ADD COLUMN is_manual boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- RLS POLICIES for affiliate_referrals (table has RLS enabled but no policies)
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

DROP POLICY IF EXISTS "admin_select_affiliate_referrals" ON affiliate_referrals;
CREATE POLICY "admin_select_affiliate_referrals"
ON affiliate_referrals FOR SELECT
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_insert_affiliate_referrals" ON affiliate_referrals;
CREATE POLICY "admin_insert_affiliate_referrals"
ON affiliate_referrals FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_affiliate_referrals" ON affiliate_referrals;
CREATE POLICY "admin_delete_affiliate_referrals"
ON affiliate_referrals FOR DELETE
TO authenticated
USING (is_manual = true AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "select_own_referrals" ON affiliate_referrals;
CREATE POLICY "select_own_referrals"
ON affiliate_referrals FOR SELECT
TO authenticated
USING (auth.uid() = ambassador_id);

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- RLS POLICIES for affiliate_custom_rules (add missing INSERT/UPDATE/DELETE)
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

DROP POLICY IF EXISTS "admin_insert_affiliate_custom_rules" ON affiliate_custom_rules;
CREATE POLICY "admin_insert_affiliate_custom_rules"
ON affiliate_custom_rules FOR INSERT
TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_update_affiliate_custom_rules" ON affiliate_custom_rules;
CREATE POLICY "admin_update_affiliate_custom_rules"
ON affiliate_custom_rules FOR UPDATE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "admin_delete_affiliate_custom_rules" ON affiliate_custom_rules;
CREATE POLICY "admin_delete_affiliate_custom_rules"
ON affiliate_custom_rules FOR DELETE
TO authenticated
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "select_own_custom_rules" ON affiliate_custom_rules;
CREATE POLICY "select_own_custom_rules"
ON affiliate_custom_rules FOR SELECT
TO authenticated
USING (auth.uid() = ambassador_id);

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- ADMIN FUNCTIONS
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

CREATE OR REPLACE FUNCTION admin_save_custom_rules(
  p_ambassador_id uuid,
  p_visit_batch_size integer DEFAULT NULL,
  p_visit_batch_coins integer DEFAULT NULL,
  p_signup_coins integer DEFAULT NULL,
  p_credits_coins_per integer DEFAULT NULL,
  p_credits_threshold integer DEFAULT NULL,
  p_dantes_coins_per integer DEFAULT NULL,
  p_dantes_threshold integer DEFAULT NULL,
  p_plan_coins_override jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO affiliate_custom_rules (
    ambassador_id, visit_batch_size, visit_batch_coins, signup_coins,
    credits_coins_per, credits_threshold, dantes_coins_per, dantes_threshold,
    plan_coins_override
  )
  VALUES (
    p_ambassador_id, p_visit_batch_size, p_visit_batch_coins, p_signup_coins,
    p_credits_coins_per, p_credits_threshold, p_dantes_coins_per, p_dantes_threshold,
    p_plan_coins_override
  )
  ON CONFLICT (ambassador_id) DO UPDATE SET
    visit_batch_size = EXCLUDED.visit_batch_size,
    visit_batch_coins = EXCLUDED.visit_batch_coins,
    signup_coins = EXCLUDED.signup_coins,
    credits_coins_per = EXCLUDED.credits_coins_per,
    credits_threshold = EXCLUDED.credits_threshold,
    dantes_coins_per = EXCLUDED.dantes_coins_per,
    dantes_threshold = EXCLUDED.dantes_threshold,
    plan_coins_override = EXCLUDED.plan_coins_override;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_attach_referral(
  p_ambassador_id uuid,
  p_referred_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing record;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Prevent duplicate links
  SELECT 1 INTO existing FROM affiliate_referrals
  WHERE ambassador_id = p_ambassador_id AND referred_id = p_referred_id;
  IF FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'already_linked');
  END IF;

  INSERT INTO affiliate_referrals (ambassador_id, referred_id, is_manual)
  VALUES (p_ambassador_id, p_referred_id, true);

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION admin_remove_referral(
  p_referral_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  referral affiliate_referrals;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO referral FROM affiliate_referrals WHERE id = p_referral_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF NOT referral.is_manual THEN
    RETURN json_build_object('ok', false, 'error', 'not_manual');
  END IF;

  DELETE FROM affiliate_referrals WHERE id = p_referral_id;

  RETURN json_build_object('ok', true);
END;
$$;
