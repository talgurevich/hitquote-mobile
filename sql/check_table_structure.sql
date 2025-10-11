-- Check businesses table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'businesses'
ORDER BY ordinal_position;

-- Check user_profiles table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check settings table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;
