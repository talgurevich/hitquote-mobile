-- Fix the check_user_quota RPC to use correct joins
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
  -- FIX: Use proper join through businesses table
  SELECT
    CASE
      WHEN s.monthly_counter_reset_date = v_current_month
      THEN COALESCE(s.monthly_quotes_created, 0)
      ELSE 0  -- Different month, count is 0
    END
  INTO v_quote_count
  FROM settings s
  JOIN businesses b ON s.business_id = b.id
  JOIN user_profiles up ON b.owner_id = up.id
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
