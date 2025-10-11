-- Create settings records for user_profiles that don't have them
INSERT INTO settings (id, business_id, monthly_quotes_created, monthly_counter_reset_date, total_quotes_created)
SELECT
  gen_random_uuid() as id,
  up.id as business_id,
  COALESCE((SELECT COUNT(*) FROM proposal p WHERE p.business_id = up.id AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_quotes_created,
  DATE_TRUNC('month', CURRENT_DATE)::DATE as monthly_counter_reset_date,
  COALESCE((SELECT COUNT(*) FROM proposal p WHERE p.business_id = up.id), 0) as total_quotes_created
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM settings s WHERE s.business_id = up.id
);

-- Verify all users now have settings
SELECT
  up.id as user_id,
  up.email,
  s.business_id,
  s.monthly_quotes_created,
  s.total_quotes_created
FROM user_profiles up
LEFT JOIN settings s ON s.business_id = up.id
ORDER BY up.email
LIMIT 20;
