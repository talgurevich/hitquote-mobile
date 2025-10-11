-- Show ALL auth users and their settings status

SELECT
  au.id as auth_id,
  au.email as auth_email,
  au.created_at,
  s.business_id as settings_business_id,
  s.business_email as settings_email,
  CASE WHEN s.business_id IS NULL THEN 'ORPHANED' ELSE 'LINKED' END as status
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
ORDER BY au.created_at DESC
LIMIT 20;

-- Also check if tal.gurevich@gmail.com exists anywhere
SELECT COUNT(*) as tal_gurevich_count
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';
