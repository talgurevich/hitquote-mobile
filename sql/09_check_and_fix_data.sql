-- =====================================================
-- STEP 9: CHECK AND FIX DATA MIGRATION
-- =====================================================
-- Verifies data migration and fixes any missing associations

-- 1. Check what data exists and where
SELECT 'Data Migration Check:' as status;

-- Check backup data (original)
SELECT
  'BACKUP DATA' as source,
  'customers' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM backup_customer
WHERE user_id IS NOT NULL

UNION ALL

SELECT
  'BACKUP DATA' as source,
  'products' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM backup_product
WHERE user_id IS NOT NULL

UNION ALL

SELECT
  'BACKUP DATA' as source,
  'proposals' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM backup_proposal
WHERE user_id IS NOT NULL;

-- Check current data (should have business_id)
SELECT
  'CURRENT DATA' as source,
  'customers' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT business_id) as unique_businesses
FROM public.customer
WHERE business_id IS NOT NULL

UNION ALL

SELECT
  'CURRENT DATA' as source,
  'products' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT business_id) as unique_businesses
FROM public.product
WHERE business_id IS NOT NULL

UNION ALL

SELECT
  'CURRENT DATA' as source,
  'proposals' as table_name,
  COUNT(*) as count,
  COUNT(DISTINCT business_id) as unique_businesses
FROM public.proposal
WHERE business_id IS NOT NULL;

-- 2. Check specific user's data
SELECT 'Checking specific user data:' as status;

-- Find the user profile for auth user 100019258193212857278
SELECT
  'User Profile' as type,
  id as profile_id,
  auth_user_id,
  email,
  display_name
FROM public.user_profiles
WHERE auth_user_id = '100019258193212857278';

-- Find their business
SELECT
  'Business Info' as type,
  b.id as business_id,
  b.business_name,
  b.business_email,
  bm.role
FROM public.businesses b
JOIN public.business_members bm ON b.id = bm.business_id
JOIN public.user_profiles up ON up.id = bm.user_id
WHERE up.auth_user_id = '100019258193212857278';

-- 3. Check if their original data exists in backup
SELECT 'Original Data Check:' as status;

SELECT
  'Original Customer Data' as type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT user_id, ', ') as user_ids
FROM backup_customer
WHERE user_id IS NOT NULL;

SELECT
  'Original Product Data' as type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT user_id, ', ') as user_ids
FROM backup_product
WHERE user_id IS NOT NULL;

SELECT
  'Original Proposal Data' as type,
  COUNT(*) as count,
  STRING_AGG(DISTINCT user_id, ', ') as user_ids
FROM backup_proposal
WHERE user_id IS NOT NULL;

-- 4. Show sample of unmigrated data (data without business_id)
SELECT 'Unmigrated Data:' as status;

SELECT
  'Customers without business_id' as type,
  COUNT(*) as count
FROM public.customer
WHERE business_id IS NULL;

SELECT
  'Products without business_id' as type,
  COUNT(*) as count
FROM public.product
WHERE business_id IS NULL;

SELECT
  'Proposals without business_id' as type,
  COUNT(*) as count
FROM public.proposal
WHERE business_id IS NULL;