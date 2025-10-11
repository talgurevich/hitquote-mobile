-- Delete orphaned account completely
-- Replace with the actual email you want to delete

-- First, check what exists
SELECT
  au.id as auth_id,
  au.email,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.supabase_auth_id
WHERE au.email = 'tal.gurevich2@gmail.com';

-- Delete from account_tiers if exists
DELETE FROM account_tiers
WHERE auth_user_id IN (
  SELECT id FROM auth.users WHERE email = 'tal.gurevich2@gmail.com'
);

-- Delete from user_profiles if exists
DELETE FROM user_profiles
WHERE supabase_auth_id IN (
  SELECT id FROM auth.users WHERE email = 'tal.gurevich2@gmail.com'
);

-- Delete from auth.users (requires admin access)
-- You need to run this in the SQL Editor with the "Run as admin" option enabled
DELETE FROM auth.users
WHERE email = 'tal.gurevich2@gmail.com';

-- Verify deletion
SELECT
  au.id as auth_id,
  au.email,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.supabase_auth_id
WHERE au.email = 'tal.gurevich2@gmail.com';
