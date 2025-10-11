-- Debug the monthly counter issue
-- Check what's actually in the settings table

SELECT
  s.business_id,
  s.monthly_quotes_created,
  s.total_quotes_created,
  s.monthly_counter_reset_date,
  DATE_TRUNC('month', CURRENT_DATE)::DATE as current_month,
  s.monthly_counter_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE as dates_match
FROM settings s
WHERE s.business_id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';

-- Also check the actual quote count for this business
SELECT
  COUNT(*) as total_quotes,
  COUNT(*) FILTER (WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)) as monthly_quotes
FROM proposal
WHERE business_id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';
