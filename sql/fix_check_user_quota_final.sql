-- Fix check_user_quota to count actual quotes from proposal table

DROP FUNCTION IF EXISTS public.check_user_quota(uuid);

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
  v_month_start timestamptz;
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

  -- Calculate start of current month
  v_month_start := date_trunc('month', CURRENT_TIMESTAMP);

  -- Count quotes created this month by this user
  SELECT COUNT(*)::integer
  INTO v_quote_count
  FROM proposal p
  JOIN user_profiles up ON p.business_id = up.id
  WHERE up.supabase_auth_id = p_auth_user_id
    AND p.created_at >= v_month_start;

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

-- Test it with tal's user ID
SELECT * FROM check_user_quota('58e079d4-c543-4485-9230-820a5715dbb4'::uuid);
