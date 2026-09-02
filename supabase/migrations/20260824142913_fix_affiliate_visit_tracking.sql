-- Remove IP dedup check from track_affiliate_visit so visits are always counted
CREATE OR REPLACE FUNCTION track_affiliate_visit(p_code TEXT, p_ip_hash TEXT DEFAULT '', p_session TEXT DEFAULT '')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account affiliate_accounts;
  visit_id uuid;
BEGIN
  SELECT * INTO account FROM affiliate_accounts WHERE referral_code = UPPER(p_code) AND NOT is_blocked;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  -- No IP/session dedup: always count the visit
  INSERT INTO affiliate_visits (ambassador_id, visitor_ip, visitor_session, visit_date)
  VALUES (account.user_id, p_ip_hash, p_session, CURRENT_DATE)
  RETURNING id INTO visit_id;

  RETURN json_build_object('ok', true, 'visit_id', visit_id);
END;
$$;

-- Add a function to check if current user already has an affiliate account (without creating one)
CREATE OR REPLACE FUNCTION check_affiliate_account()
RETURNS affiliate_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account affiliate_accounts;
BEGIN
  SELECT * INTO account FROM affiliate_accounts WHERE user_id = auth.uid();
  RETURN account;
END;
$$;

-- Add a function to explicitly become an ambassador (creates the account)
CREATE OR REPLACE FUNCTION become_ambassador()
RETURNS affiliate_accounts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account affiliate_accounts;
BEGIN
  SELECT * INTO account FROM affiliate_accounts WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    INSERT INTO affiliate_accounts (user_id, referral_code, is_blocked)
    VALUES (auth.uid(), generate_referral_code(), false)
    RETURNING * INTO account;
  END IF;
  RETURN account;
END;
$$;
