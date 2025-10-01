-- =====================================================
-- STEP 11: VERIFY DATA FIX (CORRECTED)
-- =====================================================
-- Checks if data is now properly connected to your business

-- 1. Show your business info
SELECT 'Your Business Info:' as status;

SELECT
  up.auth_user_id,
  up.email,
  b.id as business_id,
  b.business_name,
  bm.role
FROM public.user_profiles up
JOIN public.business_members bm ON bm.user_id = up.id
JOIN public.businesses b ON b.id = bm.business_id
WHERE up.auth_user_id = '100019258193212857278';

-- 2. Count data now associated with your business
SELECT 'Data Count for Your Business:' as status;

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
WHERE pr.business_id = bi.business_id

UNION ALL

SELECT
  'proposal_items' as table_name,
  COUNT(*) as count
FROM public.proposal_item pi, business_info bi
WHERE pi.business_id = bi.business_id;

-- 3. Show sample data (first 3 records of each type)
SELECT 'Sample Customers:' as status;

WITH business_info AS (
  SELECT bm.business_id
  FROM public.user_profiles up
  JOIN public.business_members bm ON bm.user_id = up.id
  WHERE up.auth_user_id = '100019258193212857278'
  LIMIT 1
)
SELECT
  c.id,
  c.name,
  c.email,
  c.business_id
FROM public.customer c, business_info bi
WHERE c.business_id = bi.business_id
LIMIT 3;

SELECT 'Sample Products:' as status;

WITH business_info AS (
  SELECT bm.business_id
  FROM public.user_profiles up
  JOIN public.business_members bm ON bm.user_id = up.id
  WHERE up.auth_user_id = '100019258193212857278'
  LIMIT 1
)
SELECT
  p.id,
  p.name,
  p.category,
  p.price,
  p.business_id
FROM public.product p, business_info bi
WHERE p.business_id = bi.business_id
LIMIT 3;

SELECT 'Sample Proposals:' as status;

WITH business_info AS (
  SELECT bm.business_id
  FROM public.user_profiles up
  JOIN public.business_members bm ON bm.user_id = up.id
  WHERE up.auth_user_id = '100019258193212857278'
  LIMIT 1
)
SELECT
  pr.id,
  pr.status,
  pr.total,
  pr.created_at,
  pr.business_id
FROM public.proposal pr, business_info bi
WHERE pr.business_id = bi.business_id
LIMIT 3;

-- 4. Check for any remaining unmigrated data
SELECT 'Remaining Unmigrated Data:' as status;

SELECT
  'customers_without_business_id' as type,
  COUNT(*) as count
FROM public.customer
WHERE business_id IS NULL

UNION ALL

SELECT
  'products_without_business_id' as type,
  COUNT(*) as count
FROM public.product
WHERE business_id IS NULL

UNION ALL

SELECT
  'proposals_without_business_id' as type,
  COUNT(*) as count
FROM public.proposal
WHERE business_id IS NULL;

-- 5. Show total counts in all tables
SELECT 'Total Data Counts:' as status;

SELECT 'customers_total' as type, COUNT(*) as count FROM public.customer
UNION ALL
SELECT 'products_total' as type, COUNT(*) as count FROM public.product
UNION ALL
SELECT 'proposals_total' as type, COUNT(*) as count FROM public.proposal;