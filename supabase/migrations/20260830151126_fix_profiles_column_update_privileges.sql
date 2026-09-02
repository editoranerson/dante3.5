/*
# Fix: Restrict UPDATE on profiles to safe columns only

The previous attempt used column-level REVOKE but the grants persisted.
This approach revokes table-level UPDATE, then grants column-level UPDATE
only on safe columns.
*/

-- Revoke table-level UPDATE from anon and authenticated
REVOKE UPDATE ON profiles FROM anon, authenticated;

-- Grant column-level UPDATE only on safe user-editable columns
GRANT UPDATE (full_name, phone, birthdate) ON profiles TO authenticated;

-- Verify
DO $$
DECLARE
  col_record RECORD;
  has_update BOOLEAN;
BEGIN
  FOR col_record IN
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'profiles' AND table_schema = 'public'
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.column_privileges
      WHERE table_name = 'profiles' AND table_schema = 'public'
        AND column_name = col_record.column_name
        AND grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
    ) INTO has_update;
    
    IF has_update AND col_record.column_name NOT IN ('full_name', 'phone', 'birthdate') THEN
      RAISE NOTICE 'WARNING: authenticated still has UPDATE on %', col_record.column_name;
    END IF;
  END LOOP;
END $$;
