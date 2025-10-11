-- Backfill monthly_quotes_created and total_quotes_created for the business
-- This counts existing quotes and updates the counters

DO $$
DECLARE
  v_business_id uuid := '227b08b4-9039-4bfe-b79d-a4cd7c30491a';
  v_current_month date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_total_count int;
  v_monthly_count int;
BEGIN
  -- Count total quotes for this business
  SELECT COUNT(*) INTO v_total_count
  FROM proposal
  WHERE business_id = v_business_id;

  -- Count quotes created this month
  SELECT COUNT(*) INTO v_monthly_count
  FROM proposal
  WHERE business_id = v_business_id
    AND DATE_TRUNC('month', created_at) = v_current_month;

  RAISE NOTICE 'Business: %', v_business_id;
  RAISE NOTICE 'Total quotes: %', v_total_count;
  RAISE NOTICE 'Monthly quotes: %', v_monthly_count;

  -- Update the settings record
  UPDATE settings
  SET
    monthly_quotes_created = v_monthly_count,
    total_quotes_created = v_total_count,
    monthly_counter_reset_date = v_current_month
  WHERE business_id = v_business_id;

  RAISE NOTICE '✅ Counters updated successfully';
END $$;

-- Verify the update
SELECT
  business_id,
  monthly_quotes_created,
  total_quotes_created,
  monthly_counter_reset_date
FROM settings
WHERE business_id = '227b08b4-9039-4bfe-b79d-a4cd7c30491a';
