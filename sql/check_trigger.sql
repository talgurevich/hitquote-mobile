-- Check if the trigger exists and is properly configured
SELECT
  t.tgname as trigger_name,
  t.tgenabled as enabled,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'proposal'
  AND t.tgname LIKE '%quota%';

-- Check if the trigger function exists
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
WHERE p.proname = 'increment_monthly_quotes_created';
