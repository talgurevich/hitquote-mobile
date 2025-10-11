-- Add monotonic monthly quote counter to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS monthly_quotes_created INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_counter_reset_date DATE DEFAULT CURRENT_DATE;

-- Function to increment monthly counter and reset if new month
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

  -- If it's a new month, reset the counter
  IF v_last_reset IS NULL OR v_last_reset < v_current_month THEN
    UPDATE settings
    SET monthly_quotes_created = 1,
        monthly_counter_reset_date = v_current_month
    WHERE business_id = NEW.business_id;
  ELSE
    -- Same month, just increment
    UPDATE settings
    SET monthly_quotes_created = COALESCE(monthly_quotes_created, 0) + 1
    WHERE business_id = NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to also handle monthly counter
DROP TRIGGER IF EXISTS trigger_increment_quotes_created ON proposal;

CREATE TRIGGER trigger_increment_quotes_created
AFTER INSERT ON proposal
FOR EACH ROW
EXECUTE FUNCTION increment_monthly_quotes_created();

-- Initialize monthly counters for existing users
UPDATE settings s
SET
  monthly_quotes_created = (
    SELECT COUNT(*)
    FROM proposal p
    WHERE p.business_id = s.business_id
      AND p.created_at >= DATE_TRUNC('month', CURRENT_DATE)
  ),
  monthly_counter_reset_date = DATE_TRUNC('month', CURRENT_DATE)::DATE
WHERE s.business_id IS NOT NULL;

-- Update check_user_quota to use the monotonic monthly counter
CREATE OR REPLACE FUNCTION public.check_user_quota(p_auth_user_id uuid)
RETURNS TABLE(
  tier_name text,
  monthly_limit integer,
  current_count integer,
  remaining_quotes integer,
  can_create_quote boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_info record;
  v_quote_count integer;
  v_current_month DATE;
  v_reset_date DATE;
BEGIN
  -- Get tier information
  SELECT
    at.tier::text,
    at.monthly_quote_limit,
    at.is_active
  INTO v_tier_info
  FROM account_tiers at
  WHERE at.auth_user_id = p_auth_user_id
    AND at.is_active = true
  LIMIT 1;

  -- If no tier found, return empty result
  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;

  -- Get monthly quote count from settings (monotonic counter)
  SELECT
    CASE
      WHEN s.monthly_counter_reset_date = v_current_month
      THEN COALESCE(s.monthly_quotes_created, 0)
      ELSE 0  -- Different month, count is 0
    END
  INTO v_quote_count
  FROM settings s
  JOIN user_profiles up ON s.business_id = up.id
  WHERE up.supabase_auth_id = p_auth_user_id
  LIMIT 1;

  -- Return the quota information
  RETURN QUERY
  SELECT
    v_tier_info.tier as tier_name,
    v_tier_info.monthly_quote_limit as monthly_limit,
    COALESCE(v_quote_count, 0) as current_count,
    CASE
      WHEN v_tier_info.monthly_quote_limit = -1 THEN -1  -- Unlimited
      ELSE GREATEST(0, v_tier_info.monthly_quote_limit - COALESCE(v_quote_count, 0))
    END as remaining_quotes,
    CASE
      WHEN v_tier_info.monthly_quote_limit = -1 THEN true  -- Unlimited tier
      WHEN COALESCE(v_quote_count, 0) < v_tier_info.monthly_quote_limit THEN true
      ELSE false
    END as can_create_quote;
END;
$$;
