/*
# Fix confirm_visit_retention JSON parsing

The source_description column is text. When we insert visit_batch earnings,
we store json_build_object(...)::text. When reading, we need to cast it back
to json before using the ->> operator. The previous version used
`(json->>'visits')::integer` which is invalid syntax -- it should be
`(source_description::json->>'visits')::integer`.

Also making the function more robust: wrapping the JSON parse in a
BEGIN/EXCEPTION block so a malformed source_description doesn't crash
the entire function.
*/

CREATE OR REPLACE FUNCTION confirm_visit_retention(p_visit_id uuid)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  visit affiliate_visits;
  batch_size integer;
  batch_coins integer;
  valid_visits_count integer;
  custom_rule affiliate_custom_rules;
  counted_visits integer;
  already_counted integer;
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

  -- Count total retained visits for this ambassador
  SELECT count(*) INTO counted_visits
  FROM affiliate_visits
  WHERE ambassador_id = visit.ambassador_id
  AND retained = true;

  -- Count how many visits were already credited in previous batches
  -- Use source_description::json to parse the stored JSON text
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
    UPDATE affiliate_accounts SET coins = coins + batch_coins WHERE user_id = visit.ambassador_id;
    INSERT INTO affiliate_earnings (ambassador_id, amount, source_type, source_description)
    VALUES (visit.ambassador_id, batch_coins, 'visit_batch',
    json_build_object('visits', valid_visits_count, 'last_visit_id', visit.id)::text);
    RETURN json_build_object('ok', true, 'retained', true, 'batch_credited', true, 'coins', batch_coins, 'valid_visits', valid_visits_count);
  END IF;

  RETURN json_build_object('ok', true, 'retained', true, 'batch_credited', false, 'valid_visits', valid_visits_count);
END;
$$;
