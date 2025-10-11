-- Cleanup Orphaned Auth Users
-- This script finds and removes users who exist in auth.users but not in the application database

-- Step 1: Find orphaned users (auth users with no settings record)
-- DIAGNOSTIC QUERY - Run this first to see who will be deleted
SELECT
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at,
  au.confirmed_at,
  au.raw_user_meta_data->>'provider' as provider
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE s.business_id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Delete orphaned auth users
-- WARNING: This will permanently delete these users from auth.users
-- Uncomment the following lines to execute the deletion:

/*
DELETE FROM auth.users
WHERE id IN (
  SELECT au.id
  FROM auth.users au
  LEFT JOIN settings s ON s.business_id = au.id
  WHERE s.business_id IS NULL
);
*/

-- Step 3: Verify deletion (should return 0 rows)
-- Run this after deletion to confirm cleanup
/*
SELECT
  au.id as auth_user_id,
  au.email,
  au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN settings s ON s.business_id = au.id
WHERE s.business_id IS NULL;
*/

-- Alternative: Delete specific user by email
-- Use this if you only want to delete one specific orphaned user
/*
DELETE FROM auth.users
WHERE email = 'info@wallaura.art'
  AND id NOT IN (SELECT business_id FROM settings WHERE business_id IS NOT NULL);
*/
