-- Check the actual schema of account_tiers table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'account_tiers'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also show a sample row
SELECT * FROM account_tiers LIMIT 1;
