-- Delete ONLY the orphaned tal.gurevich@gmail.com accounts
-- Will NOT touch any account that has settings records

DO $$
DECLARE
  v_deleted_count integer;
  v_record RECORD;
  v_orphaned_ids uuid[];
BEGIN
  -- Get list of orphaned IDs
  SELECT ARRAY_AGG(au.id) INTO v_orphaned_ids
  FROM auth.users au
  LEFT JOIN settings s ON s.business_id = au.id
  WHERE au.email = 'tal.gurevich@gmail.com'
    AND s.business_id IS NULL;

  IF v_orphaned_ids IS NULL THEN
    RAISE NOTICE 'No orphaned tal.gurevich@gmail.com accounts found';
    RETURN;
  END IF;

  -- Show what we're deleting
  RAISE NOTICE '=== Orphaned accounts to delete ===';
  FOR v_record IN (
    SELECT id, email, created_at
    FROM auth.users
    WHERE id = ANY(v_orphaned_ids)
  ) LOOP
    RAISE NOTICE 'ID: %, Email: %, Created: %', v_record.id, v_record.email, v_record.created_at;
  END LOOP;

  -- Delete upgrade_requests first
  DELETE FROM upgrade_requests
  WHERE reviewed_by = ANY(v_orphaned_ids);

  RAISE NOTICE 'Deleted related upgrade_requests';

  -- Delete ONLY orphaned accounts (those with NULL settings)
  DELETE FROM auth.users
  WHERE id = ANY(v_orphaned_ids);

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RAISE NOTICE '=== Deleted % orphaned accounts ===', v_deleted_count;
END $$;

-- Verify: Show remaining tal.gurevich@gmail.com accounts
SELECT
  au.id as auth_id,
  au.email as auth_email,
  s.business_id as settings_business_id,
  s.business_email as settings_email,
  CASE WHEN s.business_id IS NULL THEN 'ORPHANED' ELSE 'LINKED' END as status
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE au.email = 'tal.gurevich@gmail.com';
