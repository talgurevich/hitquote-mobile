-- Delete BOTH orphaned tal.gurevich@gmail.com accounts
-- You have 2 duplicate auth.users entries with no settings records

DO $$
DECLARE
  v_deleted_count integer;
  v_record RECORD;
BEGIN
  -- Show what we're about to delete
  RAISE NOTICE '=== Orphaned tal.gurevich@gmail.com accounts to delete ===';

  FOR v_record IN (
    SELECT au.id, au.email, au.created_at
    FROM auth.users au
    LEFT JOIN settings s ON s.business_id = au.id
    WHERE au.email = 'tal.gurevich@gmail.com'
      AND s.business_id IS NULL
  ) LOOP
    RAISE NOTICE 'ID: %, Email: %, Created: %', v_record.id, v_record.email, v_record.created_at;
  END LOOP;

  -- First, delete related upgrade_requests records
  DELETE FROM upgrade_requests
  WHERE reviewed_by IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN settings s ON s.business_id = au.id
    WHERE au.email = 'tal.gurevich@gmail.com'
      AND s.business_id IS NULL
  );

  RAISE NOTICE 'Deleted related upgrade_requests records';

  -- Now delete all orphaned tal.gurevich@gmail.com accounts
  DELETE FROM auth.users
  WHERE email = 'tal.gurevich@gmail.com'
    AND id NOT IN (
      SELECT business_id FROM settings WHERE business_id IS NOT NULL
    );

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE '=== Deleted % orphaned accounts ===', v_deleted_count;
END $$;

-- Verify deletion
SELECT
  au.id as auth_id,
  au.email as auth_email,
  s.business_id as settings_business_id,
  CASE WHEN s.business_id IS NULL THEN 'ORPHANED' ELSE 'LINKED' END as status
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE au.email = 'tal.gurevich@gmail.com';
