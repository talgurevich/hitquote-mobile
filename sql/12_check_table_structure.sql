-- =====================================================
-- STEP 12: CHECK TABLE STRUCTURE
-- =====================================================
-- Find out what columns actually exist in each table

-- 1. Check product table columns
SELECT 'Product Table Columns:' as status;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'product'
ORDER BY ordinal_position;

-- 2. Check customer table columns
SELECT 'Customer Table Columns:' as status;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customer'
ORDER BY ordinal_position;

-- 3. Check proposal table columns
SELECT 'Proposal Table Columns:' as status;

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'proposal'
ORDER BY ordinal_position;

-- 4. Simple count of data for your business
SELECT 'Quick Data Count:' as status;

WITH business_info AS (
  SELECT bm.business_id
  FROM public.user_profiles up
  JOIN public.business_members bm ON bm.user_id = up.id
  WHERE up.auth_user_id = '100019258193212857278'
  LIMIT 1
)
SELECT
  'customers' as table_name,
  COUNT(*) as count
FROM public.customer c, business_info bi
WHERE c.business_id = bi.business_id

UNION ALL

SELECT
  'products' as table_name,
  COUNT(*) as count
FROM public.product p, business_info bi
WHERE p.business_id = bi.business_id

UNION ALL

SELECT
  'proposals' as table_name,
  COUNT(*) as count
FROM public.proposal pr, business_info bi
WHERE pr.business_id = bi.business_id;