-- Delete orphaned account with proper cascade order
-- Replace with the actual email you want to delete

DO $$
DECLARE
  v_auth_user_id uuid;
  v_user_profile_id uuid;
  v_business_id uuid;
BEGIN
  -- Get the auth user ID
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = 'tal.gurevich2@gmail.com';

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE 'User not found in auth.users';
    RETURN;
  END IF;

  RAISE NOTICE 'Found auth user: %', v_auth_user_id;

  -- Get user profile ID
  SELECT id INTO v_user_profile_id
  FROM user_profiles
  WHERE supabase_auth_id = v_auth_user_id;

  IF v_user_profile_id IS NOT NULL THEN
    RAISE NOTICE 'Found user profile: %', v_user_profile_id;

    -- Get business ID
    SELECT id INTO v_business_id
    FROM businesses
    WHERE owner_id = v_user_profile_id;

    IF v_business_id IS NOT NULL THEN
      RAISE NOTICE 'Found business: %', v_business_id;

      -- Step 1: Delete from settings (references businesses)
      DELETE FROM settings WHERE business_id = v_business_id;
      RAISE NOTICE 'Deleted settings';

      -- Step 2: Delete proposals and related data (references businesses)
      DELETE FROM proposal_item WHERE business_id = v_business_id;
      RAISE NOTICE 'Deleted proposal items';

      DELETE FROM proposal WHERE business_id = v_business_id;
      RAISE NOTICE 'Deleted proposals';

      -- Step 3: Delete customers and products (references businesses)
      DELETE FROM customer WHERE business_id = v_business_id;
      RAISE NOTICE 'Deleted customers';

      DELETE FROM product WHERE business_id = v_business_id;
      RAISE NOTICE 'Deleted products';

      -- Step 4: Delete business (references user_profiles)
      DELETE FROM businesses WHERE id = v_business_id;
      RAISE NOTICE 'Deleted business';
    END IF;
  END IF;

  -- Step 5: Delete from account_tiers
  DELETE FROM account_tiers WHERE auth_user_id = v_auth_user_id;
  RAISE NOTICE 'Deleted account tier';

  -- Step 6: Delete from user_profiles
  DELETE FROM user_profiles WHERE supabase_auth_id = v_auth_user_id;
  RAISE NOTICE 'Deleted user profile';

  -- Step 7: Delete from auth.users (requires admin)
  DELETE FROM auth.users WHERE id = v_auth_user_id;
  RAISE NOTICE 'Deleted auth user';

  RAISE NOTICE '✅ Account deleted successfully';
END $$;

-- Verify deletion
SELECT
  au.id as auth_id,
  au.email,
  up.id as profile_id
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.supabase_auth_id
WHERE au.email = 'tal.gurevich2@gmail.com';
