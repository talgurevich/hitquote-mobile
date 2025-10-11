-- Get tal's IDs
WITH tal_ids AS (
  SELECT
    au.id as auth_id,
    up.id as profile_id,
    bm.business_id
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.supabase_auth_id = au.id
  LEFT JOIN business_members bm ON bm.user_id = up.id
  WHERE au.email = 'tal.gurevich@gmail.com'
  ORDER BY au.created_at DESC
  LIMIT 1
)
SELECT * FROM tal_ids;
