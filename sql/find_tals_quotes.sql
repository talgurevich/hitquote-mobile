-- Find tal's quotes to understand the data structure

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

-- Show all proposals with business_id matching tal's business
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
SELECT
  p.id,
  p.proposal_number,
  p.business_id,
  p.created_at,
  'matches business_id' as source
FROM proposal p, tal_ids
WHERE p.business_id = tal_ids.business_id
ORDER BY p.created_at DESC;

-- Show ALL proposals (to see if they exist at all)
SELECT id, proposal_number, business_id, created_at
FROM proposal
ORDER BY created_at DESC
LIMIT 5;
