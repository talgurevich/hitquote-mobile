-- Check the settings table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- Check user_profiles schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check how they're related
SELECT
  s.id as settings_id,
  s.business_id,
  up.id as user_profile_id,
  up.email
FROM settings s
FULL OUTER JOIN user_profiles up ON s.business_id = up.id
LIMIT 10;
