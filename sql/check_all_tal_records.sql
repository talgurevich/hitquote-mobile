-- Comprehensive check of all tal.gurevich@gmail.com data

-- 1. All auth.users with this email
SELECT 'auth.users' as source, id, email, created_at
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com'
ORDER BY created_at;

-- 2. All settings records for these auth IDs
SELECT 'settings_by_auth_id' as source, business_id, business_name, business_email
FROM settings
WHERE business_id IN (
  SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com'
);

-- 3. The problematic ID from the error
SELECT 'specific_id_in_auth' as source, id, email, created_at
FROM auth.users
WHERE id = '0a67bb8a-9f56-4d5c-80b5-298d14c336bb';

SELECT 'specific_id_in_settings' as source, business_id, business_name, business_email
FROM settings
WHERE business_id = '0a67bb8a-9f56-4d5c-80b5-298d14c336bb';

-- 4. All settings where business_email matches
SELECT 'settings_by_email' as source, business_id, business_name, business_email
FROM settings
WHERE business_email = 'tal.gurevich@gmail.com';
