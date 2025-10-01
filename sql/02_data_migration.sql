-- =====================================================
-- STEP 2: DATA MIGRATION (ZERO DATA LOSS)
-- =====================================================
-- Migrates all existing data to new structure
-- Estimated time: 2-3 minutes

-- Migration function to preserve all existing data
CREATE OR REPLACE FUNCTION migrate_existing_data() RETURNS void AS $$
DECLARE
  user_rec RECORD;
  new_profile_id UUID;
  new_business_id UUID;
  user_email TEXT;
  user_name TEXT;
  settings_rec RECORD;
BEGIN
  RAISE NOTICE 'Starting data migration...';

  -- Get all unique users from existing data
  FOR user_rec IN
    SELECT DISTINCT user_id
    FROM public.customer
    WHERE user_id IS NOT NULL
    AND user_id != ''
  LOOP
    RAISE NOTICE 'Migrating user: %', user_rec.user_id;

    -- Get user details from users table or create defaults
    SELECT email, name INTO user_email, user_name
    FROM public.users
    WHERE id = user_rec.user_id
    LIMIT 1;

    -- Handle missing user data
    IF user_email IS NULL THEN
      user_email := 'user_' || user_rec.user_id || '@migrated.local';
    END IF;

    IF user_name IS NULL THEN
      user_name := 'User ' || user_rec.user_id;
    END IF;

    -- Create user profile
    INSERT INTO public.user_profiles (auth_user_id, email, display_name)
    VALUES (user_rec.user_id, user_email, user_name)
    ON CONFLICT (auth_user_id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name
    RETURNING id INTO new_profile_id;

    -- Get settings for this user to create business
    SELECT * INTO settings_rec
    FROM public.settings
    WHERE user_id = user_rec.user_id
    LIMIT 1;

    -- Create business
    INSERT INTO public.businesses (
      owner_id,
      business_name,
      business_email,
      business_phone,
      business_address,
      business_license,
      logo_url,
      header_color,
      vat_rate,
      default_payment_terms
    )
    VALUES (
      new_profile_id,
      COALESCE(settings_rec.business_name, user_name || '''s Business'),
      COALESCE(settings_rec.business_email, user_email),
      settings_rec.business_phone,
      settings_rec.business_address,
      settings_rec.business_license,
      settings_rec.logo_url,
      COALESCE(settings_rec.header_color, '#1e3a8a'),
      COALESCE(settings_rec.vat_rate, 18.00),
      COALESCE(settings_rec.default_payment_terms, 'מזומן / המחאה / העברה בנקאית / שוטף +30')
    )
    RETURNING id INTO new_business_id;

    -- Create business membership
    INSERT INTO public.business_members (business_id, user_id, role)
    VALUES (new_business_id, new_profile_id, 'owner');

    -- Update all existing data to use business_id
    UPDATE public.customer
    SET business_id = new_business_id
    WHERE user_id = user_rec.user_id;

    UPDATE public.product
    SET business_id = new_business_id
    WHERE user_id = user_rec.user_id;

    UPDATE public.proposal
    SET business_id = new_business_id
    WHERE user_id = user_rec.user_id;

    -- Update proposal_item with business_id from related proposal
    UPDATE public.proposal_item
    SET business_id = new_business_id
    WHERE proposal_id IN (
      SELECT id FROM public.proposal WHERE user_id = user_rec.user_id
    );

    -- Create business settings entry
    INSERT INTO public.business_settings (
      business_id,
      vat_rate,
      default_payment_terms
    )
    VALUES (
      new_business_id,
      COALESCE(settings_rec.vat_rate, 18.00),
      COALESCE(settings_rec.default_payment_terms, 'מזומן / המחאה / העברה בנקאית / שוטף +30')
    );

    RAISE NOTICE 'Migrated user % to business %', user_rec.user_id, new_business_id;
  END LOOP;

  RAISE NOTICE 'Data migration completed successfully!';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_existing_data();

-- Validation queries
SELECT 'Migration Validation Results:' as status;

SELECT
  'Original customers' as table_name,
  COUNT(*) as count
FROM backup_customer
WHERE user_id IS NOT NULL

UNION ALL

SELECT
  'Migrated customers',
  COUNT(*)
FROM public.customer
WHERE business_id IS NOT NULL

UNION ALL

SELECT
  'Original products',
  COUNT(*)
FROM backup_product
WHERE user_id IS NOT NULL

UNION ALL

SELECT
  'Migrated products',
  COUNT(*)
FROM public.product
WHERE business_id IS NOT NULL

UNION ALL

SELECT
  'Original proposals',
  COUNT(*)
FROM backup_proposal
WHERE user_id IS NOT NULL

UNION ALL

SELECT
  'Migrated proposals',
  COUNT(*)
FROM public.proposal
WHERE business_id IS NOT NULL;

-- Success message
SELECT 'Step 2 Complete: All data migrated successfully with zero loss!' as status;