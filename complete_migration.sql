-- ============================================================================
-- COMPLETE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ============================================================================

-- STEP 1: Add new column to user_profiles for Supabase auth
-- ============================================================================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS supabase_auth_id UUID;

CREATE INDEX IF NOT EXISTS idx_user_profiles_supabase_auth_id
  ON user_profiles(supabase_auth_id);


-- STEP 2: Create account_tiers table
-- ============================================================================
CREATE TABLE IF NOT EXISTS account_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL,  -- Will link to user_profiles.supabase_auth_id
  tier TEXT NOT NULL DEFAULT 'free',
  monthly_quote_limit INTEGER NOT NULL DEFAULT 10,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  payment_provider TEXT,
  payment_customer_id TEXT,
  payment_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(auth_user_id),
  CHECK (tier IN ('free', 'premium', 'business')),
  CHECK (monthly_quote_limit >= 0)
);

CREATE INDEX IF NOT EXISTS idx_account_tiers_auth_user_id ON account_tiers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_account_tiers_payment_customer ON account_tiers(payment_customer_id);

-- RLS Policies
ALTER TABLE account_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own tier" ON account_tiers;

CREATE POLICY "Users can read their own tier"
  ON account_tiers FOR SELECT
  USING (auth_user_id = auth.uid());


-- STEP 3: Create quota check function
-- ============================================================================
CREATE OR REPLACE FUNCTION check_user_quota(p_auth_user_id UUID)
RETURNS TABLE(
  can_create_quote BOOLEAN,
  current_count INTEGER,
  monthly_limit INTEGER,
  tier_name TEXT,
  remaining_quotes INTEGER
) AS $FUNC$
DECLARE
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW());
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
  v_count INTEGER := 0;
  v_limit INTEGER := 10;
  v_tier TEXT := 'free';
  v_legacy_user_id UUID;
BEGIN
  -- Get user tier and limit
  SELECT tier, monthly_quote_limit
  INTO v_tier, v_limit
  FROM account_tiers
  WHERE auth_user_id = p_auth_user_id AND is_active = true;

  -- Default to free tier if no record
  IF v_tier IS NULL THEN
    v_tier := 'free';
    v_limit := 10;
  END IF;

  -- Business tier = unlimited
  IF v_tier = 'business' THEN
    v_limit := -1;
  END IF;

  -- Get legacy user_id from user_profiles for counter lookup
  SELECT id INTO v_legacy_user_id
  FROM user_profiles
  WHERE supabase_auth_id = p_auth_user_id;

  -- Get current month quote count
  IF v_legacy_user_id IS NOT NULL THEN
    SELECT COALESCE(quote_count, 0)
    INTO v_count
    FROM monthly_quote_counters
    WHERE user_id = v_legacy_user_id
      AND year = v_current_year
      AND month = v_current_month;
  END IF;

  -- Return quota check results
  RETURN QUERY SELECT
    (v_limit = -1 OR v_count < v_limit) as can_create_quote,
    v_count as current_count,
    v_limit as monthly_limit,
    v_tier as tier_name,
    CASE
      WHEN v_limit = -1 THEN -1
      ELSE GREATEST(0, v_limit - v_count)
    END as remaining_quotes;
END;
$FUNC$ LANGUAGE plpgsql SECURITY DEFINER;


-- STEP 4: Create quota enforcement trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION enforce_quote_quota()
RETURNS TRIGGER AS $FUNC$
DECLARE
  v_quota_check RECORD;
  v_auth_user_id UUID;
BEGIN
  -- Get auth_user_id from user_profiles using legacy user_id
  SELECT supabase_auth_id INTO v_auth_user_id
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Only enforce if user has supabase_auth_id (migrated users)
  IF v_auth_user_id IS NOT NULL THEN
    -- Check quota
    SELECT * INTO v_quota_check
    FROM check_user_quota(v_auth_user_id);

    IF NOT v_quota_check.can_create_quote THEN
      RAISE EXCEPTION 'Monthly quote limit exceeded. Current: %, Limit: %. Please contact admin to upgrade.',
        v_quota_check.current_count,
        v_quota_check.monthly_limit
      USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$FUNC$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS check_quota_before_proposal_insert ON proposal;

CREATE TRIGGER check_quota_before_proposal_insert
  BEFORE INSERT ON proposal
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quote_quota();


-- STEP 5: Auto-assign free tier for new users
-- ============================================================================
CREATE OR REPLACE FUNCTION create_default_tier_for_new_user()
RETURNS TRIGGER AS $FUNC$
BEGIN
  -- Insert free tier for new auth user
  INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active)
  VALUES (NEW.id, 'free', 10, true)
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (drop first if exists)
DROP TRIGGER IF EXISTS create_tier_on_user_signup ON auth.users;

CREATE TRIGGER create_tier_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tier_for_new_user();


-- STEP 6: Function to get all users with tier info (for admin panel)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_all_users_with_tiers()
RETURNS TABLE(
  auth_user_id UUID,
  email TEXT,
  name TEXT,
  tier TEXT,
  monthly_limit INTEGER,
  quotes_this_month INTEGER,
  created_at TIMESTAMPTZ
) AS $FUNC$
BEGIN
  RETURN QUERY
  SELECT
    au.id as auth_user_id,
    au.email::TEXT,
    au.raw_user_meta_data->>'name' as name,
    COALESCE(at.tier, 'free') as tier,
    COALESCE(at.monthly_quote_limit, 10) as monthly_limit,
    COALESCE(mqc.quote_count, 0) as quotes_this_month,
    au.created_at
  FROM auth.users au
  LEFT JOIN account_tiers at ON at.auth_user_id = au.id
  LEFT JOIN user_profiles up ON up.supabase_auth_id = au.id
  LEFT JOIN monthly_quote_counters mqc ON mqc.user_id = up.id
    AND mqc.year = EXTRACT(YEAR FROM NOW())
    AND mqc.month = EXTRACT(MONTH FROM NOW())
  ORDER BY au.created_at DESC;
END;
$FUNC$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Now you need to:
-- 1. Enable Email authentication in Supabase Dashboard > Authentication > Providers
-- 2. Enable Google authentication in Supabase Dashboard > Authentication > Providers
-- 3. Configure Apple authentication when ready
-- 4. Create auth.users entries for Tal and Moran (manually or via signup flow)
-- 5. Link them by running the queries below after they sign in with Google

SELECT 'Migration schema created successfully!' as status;
