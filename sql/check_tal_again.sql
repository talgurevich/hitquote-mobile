-- Check how many tal.gurevich@gmail.com accounts exist now

SELECT
  id,
  email,
  created_at,
  confirmed_at,
  raw_user_meta_data
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com'
ORDER BY created_at DESC;

-- Count them
SELECT COUNT(*) as total_count
FROM auth.users
WHERE email = 'tal.gurevich@gmail.com';
