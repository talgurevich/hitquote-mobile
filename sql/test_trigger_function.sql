-- Check if the trigger function exists
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'increment_monthly_quotes_created';

-- Check trigger details
SELECT
  tgname,
  tgrelid::regclass as table_name,
  tgenabled,
  pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgname = 'trigger_increment_quotes_created';

-- Check your current counter values
SELECT
  s.business_id,
  s.monthly_quotes_created,
  s.monthly_counter_reset_date,
  s.total_quotes_created,
  up.email,
  (SELECT COUNT(*) FROM proposal p WHERE p.business_id = s.business_id) as actual_total_quotes,
  (SELECT COUNT(*) FROM proposal p WHERE p.business_id = s.business_id AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as actual_monthly_quotes
FROM settings s
JOIN businesses b ON s.business_id = b.id
JOIN user_profiles up ON b.owner_id = up.id
WHERE up.email = 'tal.gurevich@gmail.com';
