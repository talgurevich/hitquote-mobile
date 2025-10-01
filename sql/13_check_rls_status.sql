-- =====================================================
-- STEP 13: CHECK RLS STATUS AND PERMISSIONS
-- =====================================================
-- Check which tables have RLS enabled and what policies exist

-- 1. Check RLS status on all tables
SELECT 'RLS Status Check:' as status;

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  hasrlspolicy as has_policies
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename
WHERE schemaname = 'public'
  AND tablename IN ('customer', 'product', 'proposal', 'proposal_item', 'user_profiles', 'businesses', 'business_members', 'business_settings')
ORDER BY tablename;

-- 2. Check what policies exist on data tables
SELECT 'RLS Policies on Data Tables:' as status;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customer', 'product', 'proposal', 'proposal_item')
ORDER BY tablename, policyname;

-- 3. Test query as authenticated user
SELECT 'Testing Direct Query:' as status;

-- This should show data if RLS allows it
SELECT
  'customer' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN business_id = '82a30fd1-0e03-412a-af12-5bcf66bea56f' THEN 1 END) as business_count
FROM public.customer

UNION ALL

SELECT
  'product' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN business_id = '82a30fd1-0e03-412a-af12-5bcf66bea56f' THEN 1 END) as business_count
FROM public.product

UNION ALL

SELECT
  'proposal' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN business_id = '82a30fd1-0e03-412a-af12-5bcf66bea56f' THEN 1 END) as business_count
FROM public.proposal;