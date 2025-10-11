-- First, check if columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'settings'
  AND column_name IN ('monthly_quotes_created', 'monthly_counter_reset_date', 'total_quotes_created');

-- Check all settings records
SELECT
  business_id,
  monthly_quotes_created,
  monthly_counter_reset_date,
  total_quotes_created
FROM settings
LIMIT 10;
