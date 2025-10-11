-- Simple direct queries without joins

-- 1. Show all tal.gurevich@gmail.com in auth.users
SELECT 'auth.users' as source, id, email, created_at
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';

-- 2. Show ALL settings records
SELECT 'all_settings' as source, business_id, business_name, business_email
FROM settings
ORDER BY business_id;

-- 3. For each tal account, check if business_id exists in settings
SELECT
  'check_1' as check_name,
  au.id as auth_id,
  au.email,
  (SELECT COUNT(*) FROM settings WHERE business_id = au.id) as settings_count
FROM auth.users au
WHERE au.email = 'tal.gurevich@gmail.com';
