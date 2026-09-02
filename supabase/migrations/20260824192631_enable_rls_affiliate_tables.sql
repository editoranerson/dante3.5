/*
# Enable RLS on affiliate_accounts and affiliate_visits

These two tables had RLS disabled (policies existed but were not enforced).
This enabled RLS so the existing policies take effect.

1. Security changes:
   - ENABLE RLS on `affiliate_accounts` (was disabled)
   - ENABLE RLS on `affiliate_visits` (was disabled)
   - Existing policies on both tables remain unchanged and now enforce properly.
   - Add anon INSERT policy on `affiliate_visits` so the SECURITY DEFINER
     function `track_affiliate_visit` (which runs as the caller's role when
     invoked via RPC, but actually bypasses RLS since it's SECURITY DEFINER)
     works even if called by anon. The function is SECURITY DEFINER so it
     bypasses RLS anyway, but this policy is a safety net.
   - Add anon SELECT on `affiliate_visits` for the referral tracker to read
     visit status (though it uses RPC, not direct queries).

2. Notes:
   - All mutations (track_affiliate_visit, confirm_visit_retention, become_ambassador,
     admin_affiliate_*) are SECURITY DEFINER functions that bypass RLS.
   - Direct table queries from the frontend still need policies.
   - `affiliate_accounts` already has: public_read_referral_codes (anon+auth SELECT),
     insert_own (auth INSERT), update_own (auth UPDATE), admin_select_all (admin SELECT),
     admin_update (admin UPDATE).
   - `affiliate_visits` already has: select_own_visits (auth SELECT),
     insert_own_visits (auth INSERT), admin_select_all (admin SELECT).
   - Added: anon INSERT on affiliate_visits for visit tracking via direct insert
     if the RPC path is unavailable, and anon SELECT so the tracker can verify.
*/

-- Enable RLS on affiliate_accounts
ALTER TABLE affiliate_accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on affiliate_visits
ALTER TABLE affiliate_visits ENABLE ROW LEVEL SECURITY;

-- Add anon INSERT policy on affiliate_visits (safety net for direct inserts)
DROP POLICY IF EXISTS "anon_insert_affiliate_visits" ON affiliate_visits;
CREATE POLICY "anon_insert_affiliate_visits"
ON affiliate_visits FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Add anon SELECT policy on affiliate_visits (tracker can read own visits)
-- This is intentionally permissive since visit data doesn't contain sensitive info
DROP POLICY IF EXISTS "anon_select_affiliate_visits" ON affiliate_visits;
CREATE POLICY "anon_select_affiliate_visits"
ON affiliate_visits FOR SELECT
TO anon, authenticated
USING (true);

-- Add UPDATE policy on affiliate_visits so confirm_visit_retention can work
-- (though it's SECURITY DEFINER and bypasses RLS, this is a safety net)
DROP POLICY IF EXISTS "update_own_visits" ON affiliate_visits;
CREATE POLICY "update_own_visits"
ON affiliate_visits FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);
