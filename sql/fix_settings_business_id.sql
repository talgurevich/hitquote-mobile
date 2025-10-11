-- Fix settings records to have proper business_id
-- Link settings to user_profiles via the FK relationship

-- First, check current state
SELECT
  s.id as settings_id,
  s.business_id as current_business_id,
  up.id as user_profile_id,
  up.email
FROM settings s
LEFT JOIN user_profiles up ON s.id = up.id
WHERE s.business_id IS NULL
LIMIT 5;

-- Update settings to have the correct business_id
-- The business_id should match the user_profile id
UPDATE settings s
SET business_id = up.id
FROM user_profiles up
WHERE s.id = up.id
  AND s.business_id IS NULL;

-- Verify the fix
SELECT
  business_id,
  monthly_quotes_created,
  monthly_counter_reset_date,
  total_quotes_created
FROM settings
WHERE business_id IS NOT NULL;
