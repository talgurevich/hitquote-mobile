-- Test the RPC with your auth user ID
-- Replace with your actual auth user ID from the user_profiles query
SELECT * FROM check_user_quota('261a4db9-86bd-4d0a-9fcb-744e625cb54e'::uuid);

-- Also check what the settings table shows
SELECT
  s.business_id,
  s.monthly_quotes_created,
  s.monthly_counter_reset_date,
  up.email
FROM settings s
JOIN businesses b ON s.business_id = b.id
JOIN user_profiles up ON b.owner_id = up.id
WHERE up.email = 'tal.gurevich@gmail.com';
