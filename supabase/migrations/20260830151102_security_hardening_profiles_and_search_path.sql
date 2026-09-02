/*
# Security hardening: profiles column privileges + search_path on SECURITY DEFINER functions

## Changes

1. CRITICAL FIX: Restrict UPDATE on profiles to safe columns only
   - The existing policy `profiles_update_self_limited` has a WITH CHECK that
     protects plan, plan_expires_at, messages_today, last_message_date.
   - BUT role, points, credits are NOT protected — any authenticated user
     could UPDATE their own profile and set role='admin', points=99999, etc.
   - Fix: Revoke UPDATE on sensitive columns from anon/authenticated, grant
     UPDATE only on safe columns (full_name, phone, birthdate).

2. Fix all SECURITY DEFINER functions: set search_path = public
   - Supabase advisor reported functions with mutable search_path.
   - Setting search_path prevents search_path injection attacks.
*/

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 1. PROTECT SENSITIVE COLUMNS ON profiles
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

-- Revoke all column-level UPDATE privileges from anon and authenticated
REVOKE UPDATE (id, full_name, phone, birthdate, role, points, created_at, plan, plan_expires_at, messages_today, last_message_date, credits)
ON profiles FROM anon, authenticated;

-- Grant UPDATE only on safe user-editable columns
GRANT UPDATE (full_name, phone, birthdate) ON profiles TO authenticated;

-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
-- 2. SET search_path ON ALL SECURITY DEFINER FUNCTIONS
-- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

DO $$
DECLARE
  fn_record RECORD;
BEGIN
  FOR fn_record IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true
  LOOP
    BEGIN
      EXECUTE format('ALTER FUNCTION %s SET search_path = public', fn_record.oid::regprocedure);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;
