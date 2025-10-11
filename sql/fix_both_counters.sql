-- Fix the trigger function to increment BOTH counters
CREATE OR REPLACE FUNCTION increment_monthly_quotes_created()
RETURNS TRIGGER AS $$
DECLARE
  v_current_month DATE;
  v_last_reset DATE;
BEGIN
  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Get the last reset date for this business
  SELECT monthly_counter_reset_date
  INTO v_last_reset
  FROM settings
  WHERE business_id = NEW.business_id;

  -- If it's a new month, reset the monthly counter
  IF v_last_reset IS NULL OR v_last_reset < v_current_month THEN
    UPDATE settings
    SET monthly_quotes_created = 1,
        monthly_counter_reset_date = v_current_month,
        total_quotes_created = COALESCE(total_quotes_created, 0) + 1
    WHERE business_id = NEW.business_id;
  ELSE
    -- Same month, increment both counters
    UPDATE settings
    SET monthly_quotes_created = COALESCE(monthly_quotes_created, 0) + 1,
        total_quotes_created = COALESCE(total_quotes_created, 0) + 1
    WHERE business_id = NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify it's working - manually sync the total counter to match actual
UPDATE settings s
SET total_quotes_created = (
  SELECT COUNT(*) FROM proposal p WHERE p.business_id = s.business_id
)
WHERE s.business_id IS NOT NULL;
