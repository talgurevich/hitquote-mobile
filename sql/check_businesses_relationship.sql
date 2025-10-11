-- Check businesses table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check relationship between user_profiles and businesses
SELECT
  up.id as user_profile_id,
  up.email,
  b.id as business_id,
  b.name as business_name
FROM user_profiles up
LEFT JOIN businesses b ON b.owner_id = up.id
LIMIT 10;

-- Check settings FK constraint
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
WHERE con.conrelid = 'settings'::regclass
  AND con.contype = 'f';
