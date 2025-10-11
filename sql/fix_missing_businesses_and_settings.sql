-- Step 1: Create businesses for user_profiles that don't have one
INSERT INTO businesses (id, owner_id, business_name, business_email, vat_rate, default_payment_terms, created_at)
SELECT
  up.id as id,
  up.id as owner_id,
  COALESCE(up.display_name, up.email) as business_name,
  up.email as business_email,
  18 as vat_rate,
  'מזומן / העברה בנקאית / שוטף +30' as default_payment_terms,
  NOW() as created_at
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM businesses b WHERE b.owner_id = up.id
);

-- Step 2: Create settings for businesses that don't have settings
INSERT INTO settings (id, business_id, monthly_quotes_created, monthly_counter_reset_date, total_quotes_created, vat_rate, default_payment_terms, created_at)
SELECT
  gen_random_uuid()::text as id,
  b.id as business_id,
  COALESCE((SELECT COUNT(*) FROM proposal p WHERE p.business_id = b.id AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as monthly_quotes_created,
  DATE_TRUNC('month', CURRENT_DATE)::DATE as monthly_counter_reset_date,
  COALESCE((SELECT COUNT(*) FROM proposal p WHERE p.business_id = b.id), 0) as total_quotes_created,
  18 as vat_rate,
  'מזומן / העברה בנקאית / שוטף +30' as default_payment_terms,
  NOW() as created_at
FROM businesses b
WHERE NOT EXISTS (
  SELECT 1 FROM settings s WHERE s.business_id = b.id
);

-- Step 3: Verify all users now have businesses and settings
SELECT
  up.id as user_profile_id,
  up.email,
  b.id as business_id,
  s.business_id as settings_business_id,
  s.monthly_quotes_created,
  s.total_quotes_created
FROM user_profiles up
LEFT JOIN businesses b ON b.owner_id = up.id
LEFT JOIN settings s ON s.business_id = b.id
ORDER BY up.email
LIMIT 20;
