-- Delete these two specific orphaned accounts
-- 82174b31-359b-4045-aa70-433ae9978303
-- 58e079d4-c543-4485-9230-820a5715dbb4

DO $$
BEGIN
  RAISE NOTICE 'Deleting upgrade_requests for orphaned accounts...';

  -- Delete upgrade_requests first
  DELETE FROM upgrade_requests
  WHERE reviewed_by IN (
    '82174b31-359b-4045-aa70-433ae9978303',
    '58e079d4-c543-4485-9230-820a5715dbb4'
  );

  RAISE NOTICE 'Deleting auth.users accounts...';

  -- Delete the two specific orphaned accounts
  DELETE FROM auth.users
  WHERE id IN (
    '82174b31-359b-4045-aa70-433ae9978303',
    '58e079d4-c543-4485-9230-820a5715dbb4'
  );

  RAISE NOTICE 'Successfully deleted orphaned accounts';
END $$;

-- Verify deletion
SELECT COUNT(*) as remaining_tal_accounts
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';
