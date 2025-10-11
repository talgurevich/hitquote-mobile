-- Fix the monthly_counter_reset_date to be first of month instead of current date
UPDATE settings
SET monthly_counter_reset_date = DATE_TRUNC('month', monthly_counter_reset_date)::DATE
WHERE monthly_counter_reset_date != DATE_TRUNC('month', monthly_counter_reset_date)::DATE;

-- Verify the fix
SELECT
  business_id,
  monthly_quotes_created,
  total_quotes_created,
  monthly_counter_reset_date,
  DATE_TRUNC('month', CURRENT_DATE)::DATE as current_month,
  monthly_counter_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE as dates_match
FROM settings
WHERE business_id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';
