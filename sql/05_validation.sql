-- =====================================================
-- STEP 5: VALIDATION AND TESTING
-- =====================================================
-- Validates the complete RLS implementation

-- 1. Check that all tables have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrlspolicy as has_policies
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public'
  AND tablename IN ('user_profiles', 'businesses', 'business_members', 'business_settings', 'customer', 'product', 'proposal', 'proposal_item')
ORDER BY tablename;

-- 2. List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verify data migration was successful
SELECT 'Data Migration Validation:' as status;

SELECT
  'Original vs Migrated Data' as check_type,
  table_name,
  original_count,
  migrated_count,
  CASE
    WHEN original_count = migrated_count THEN '✅ SUCCESS'
    ELSE '❌ MISMATCH'
  END as status
FROM (
  SELECT
    'customers' as table_name,
    (SELECT COUNT(*) FROM backup_customer WHERE user_id IS NOT NULL) as original_count,
    (SELECT COUNT(*) FROM public.customer WHERE business_id IS NOT NULL) as migrated_count

  UNION ALL

  SELECT
    'products' as table_name,
    (SELECT COUNT(*) FROM backup_product WHERE user_id IS NOT NULL) as original_count,
    (SELECT COUNT(*) FROM public.product WHERE business_id IS NOT NULL) as migrated_count

  UNION ALL

  SELECT
    'proposals' as table_name,
    (SELECT COUNT(*) FROM backup_proposal WHERE user_id IS NOT NULL) as original_count,
    (SELECT COUNT(*) FROM public.proposal WHERE business_id IS NOT NULL) as migrated_count
) validation_data;

-- 4. Check new table structure
SELECT 'New Business Architecture:' as status;

SELECT
  'user_profiles' as table_name,
  COUNT(*) as count
FROM public.user_profiles

UNION ALL

SELECT
  'businesses' as table_name,
  COUNT(*) as count
FROM public.businesses

UNION ALL

SELECT
  'business_members' as table_name,
  COUNT(*) as count
FROM public.business_members

UNION ALL

SELECT
  'business_settings' as table_name,
  COUNT(*) as count
FROM public.business_settings;

-- 5. Verify helper functions exist
SELECT 'Helper Functions:' as status;

SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_businesses', 'get_current_user_profile', 'migrate_existing_data')
ORDER BY routine_name;

-- 6. Test RLS enforcement (these should return 0 rows when not authenticated)
SELECT 'RLS Enforcement Test (should be 0 without auth):' as status;

-- Reset role to test RLS
RESET ROLE;

SELECT
  'customers_without_auth' as test,
  COUNT(*) as visible_rows
FROM public.customer

UNION ALL

SELECT
  'products_without_auth' as test,
  COUNT(*) as visible_rows
FROM public.product

UNION ALL

SELECT
  'proposals_without_auth' as test,
  COUNT(*) as visible_rows
FROM public.proposal;

-- Success message
SELECT 'Step 5 Complete: Enterprise RLS validation completed!' as status;