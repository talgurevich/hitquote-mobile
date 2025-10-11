-- Cleanup ALL Orphaned Auth Users
-- This script finds and removes ALL users who exist in auth.users but not in settings table

-- Step 1: Show orphaned users before deletion (DIAGNOSTIC)
DO $$
DECLARE
  orphaned_count integer;
BEGIN
  SELECT COUNT(*) INTO orphaned_count
  FROM auth.users au
  LEFT JOIN settings s ON s.business_id = au.id
  WHERE s.business_id IS NULL;

  RAISE NOTICE '=== ORPHANED USERS FOUND: % ===', orphaned_count;

  IF orphaned_count = 0 THEN
    RAISE NOTICE 'No orphaned users to delete.';
    RETURN;
  END IF;

  -- Show details of orphaned users
  FOR r IN (
    SELECT
      au.id,
      au.email,
      au.created_at,
      au.raw_user_meta_data->>'provider' as provider
    FROM auth.users au
    LEFT JOIN settings s ON s.business_id = au.id
    WHERE s.business_id IS NULL
    ORDER BY au.created_at DESC
  ) LOOP
    RAISE NOTICE 'Orphaned: % (%, created: %)', r.email, r.provider, r.created_at;
  END LOOP;

  -- Delete all orphaned users
  DELETE FROM auth.users
  WHERE id IN (
    SELECT au.id
    FROM auth.users au
    LEFT JOIN settings s ON s.business_id = au.id
    WHERE s.business_id IS NULL
  );

  RAISE NOTICE '=== Successfully deleted % orphaned users ===', orphaned_count;
END $$;

-- Step 2: Verify cleanup (should return 0)
SELECT COUNT(*) as remaining_orphaned_users
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE s.business_id IS NULL;
