-- =====================================================
-- STEP 10: FIX DATA MIGRATION FOR EXISTING USER
-- =====================================================
-- Connects existing data to the new business architecture

-- 1. Get the business ID for the current user
DO $$
DECLARE
  target_business_id UUID;
  user_profile_id UUID;
  rows_updated INT;
BEGIN
  -- Find the user profile and business for auth user 100019258193212857278
  SELECT up.id INTO user_profile_id
  FROM public.user_profiles up
  WHERE up.auth_user_id = '100019258193212857278';

  IF user_profile_id IS NULL THEN
    RAISE NOTICE 'No user profile found for auth user 100019258193212857278';
    RETURN;
  END IF;

  SELECT bm.business_id INTO target_business_id
  FROM public.business_members bm
  WHERE bm.user_id = user_profile_id
  LIMIT 1;

  IF target_business_id IS NULL THEN
    RAISE NOTICE 'No business found for user profile %', user_profile_id;
    RETURN;
  END IF;

  RAISE NOTICE 'Found business ID: %', target_business_id;

  -- 2. Update all data without business_id to use the target business_id

  -- Update customers
  UPDATE public.customer
  SET business_id = target_business_id
  WHERE business_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % customers with business_id', rows_updated;

  -- Update products
  UPDATE public.product
  SET business_id = target_business_id
  WHERE business_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % products with business_id', rows_updated;

  -- Update proposals
  UPDATE public.proposal
  SET business_id = target_business_id
  WHERE business_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % proposals with business_id', rows_updated;

  -- Update proposal items
  UPDATE public.proposal_item
  SET business_id = target_business_id
  WHERE business_id IS NULL;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % proposal items with business_id', rows_updated;

  -- 3. Alternative approach: If no data without business_id, copy from backup
  -- This handles the case where data migration created new records but user wants old data

  -- Check if we have any customers for this business
  IF NOT EXISTS (SELECT 1 FROM public.customer WHERE business_id = target_business_id) THEN
    RAISE NOTICE 'No customers found for business, restoring from backup...';

    -- Insert customers from backup
    INSERT INTO public.customer (id, name, email, phone, address, business_id)
    SELECT
      COALESCE(id, gen_random_uuid()),
      name,
      email,
      phone,
      address,
      target_business_id
    FROM backup_customer
    WHERE user_id IS NOT NULL
    ON CONFLICT (id) DO UPDATE SET
      business_id = target_business_id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Restored % customers from backup', rows_updated;
  END IF;

  -- Check if we have any products for this business
  IF NOT EXISTS (SELECT 1 FROM public.product WHERE business_id = target_business_id) THEN
    RAISE NOTICE 'No products found for business, restoring from backup...';

    -- Insert products from backup
    INSERT INTO public.product (id, name, category, unit_label, unit_price, notes, business_id, created_at)
    SELECT
      COALESCE(id, gen_random_uuid()),
      name,
      category,
      unit_label,
      unit_price,
      notes,
      target_business_id,
      COALESCE(created_at, NOW())
    FROM backup_product
    WHERE user_id IS NOT NULL
    ON CONFLICT (id) DO UPDATE SET
      business_id = target_business_id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Restored % products from backup', rows_updated;
  END IF;

  -- Check if we have any proposals for this business
  IF NOT EXISTS (SELECT 1 FROM public.proposal WHERE business_id = target_business_id) THEN
    RAISE NOTICE 'No proposals found for business, restoring from backup...';

    -- Insert proposals from backup
    INSERT INTO public.proposal (id, customer_id, status, total, created_at, business_id, notes, valid_until, payment_terms, header_color, quote_number)
    SELECT
      COALESCE(p.id, gen_random_uuid()),
      p.customer_id,
      p.status,
      p.total,
      COALESCE(p.created_at, NOW()),
      target_business_id,
      p.notes,
      p.valid_until,
      p.payment_terms,
      p.header_color,
      p.quote_number
    FROM backup_proposal p
    WHERE p.user_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.customer c WHERE c.id = p.customer_id AND c.business_id = target_business_id)
    ON CONFLICT (id) DO UPDATE SET
      business_id = target_business_id;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RAISE NOTICE 'Restored % proposals from backup', rows_updated;
  END IF;

  RAISE NOTICE 'Data migration fix completed for business %', target_business_id;
END $$;