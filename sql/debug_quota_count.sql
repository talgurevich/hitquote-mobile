-- Debug why quotes aren't being counted

-- 1. Get tal's auth user ID
SELECT id as auth_user_id, email FROM auth.users WHERE email = 'tal.gurevich@gmail.com';

-- 2. Get tal's user profile
SELECT id as profile_id, supabase_auth_id, email
FROM user_profiles
WHERE supabase_auth_id = (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com' ORDER BY created_at DESC LIMIT 1);

-- 3. Get tal's business ID
SELECT bm.business_id, up.id as profile_id, up.supabase_auth_id
FROM business_members bm
JOIN user_profiles up ON up.id = bm.user_id
WHERE up.supabase_auth_id = (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com' ORDER BY created_at DESC LIMIT 1);

-- 4. Count quotes directly
SELECT COUNT(*) as quote_count, p.business_id
FROM proposal p
JOIN user_profiles up ON p.business_id = up.id
WHERE up.supabase_auth_id = (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com' ORDER BY created_at DESC LIMIT 1)
GROUP BY p.business_id;

-- 5. Show all quotes for tal
SELECT p.id, p.proposal_number, p.business_id, p.created_at
FROM proposal p
JOIN user_profiles up ON p.business_id = up.id
WHERE up.supabase_auth_id = (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com' ORDER BY created_at DESC LIMIT 1)
ORDER BY p.created_at DESC;

-- 6. Test the function with tal's ID
SELECT * FROM check_user_quota(
  (SELECT id FROM auth.users WHERE email = 'tal.gurevich@gmail.com' ORDER BY created_at DESC LIMIT 1)::uuid
);
