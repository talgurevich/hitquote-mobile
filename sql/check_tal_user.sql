-- Check if tal.gurevich@gmail.com exists in all tables

-- Check auth.users
SELECT 'auth.users' as table_name, id, email, created_at, raw_user_meta_data
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';

-- Check settings by business_id
SELECT 'settings' as table_name, business_id, business_name, business_email
FROM settings
WHERE business_id IN (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com');

-- Check all settings records for this email directly
SELECT 'settings_by_email' as table_name, business_id, business_name, business_email
FROM settings
WHERE business_email = 'tal.gurevich@gmail.com';

-- Show all auth users and their settings (for debugging)
SELECT
  au.id as auth_id,
  au.email as auth_email,
  s.business_id as settings_business_id,
  s.business_email as settings_email,
  CASE WHEN s.business_id IS NULL THEN 'ORPHANED' ELSE 'LINKED' END as status
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE au.email = 'tal.gurevich@gmail.com';
