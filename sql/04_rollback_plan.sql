-- =====================================================
-- EMERGENCY ROLLBACK PLAN (IF NEEDED)
-- =====================================================
-- Only run this if something goes wrong and you need to revert
-- This restores your database to the original state

-- WARNING: This will undo all the security improvements
-- Only use in emergency situations

-- 1. Disable RLS on all new tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings DISABLE ROW LEVEL SECURITY;

-- 2. Drop all RLS policies
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can manage own businesses" ON public.businesses;
DROP POLICY IF EXISTS "Users can view business memberships" ON public.business_members;
DROP POLICY IF EXISTS "Business owners can manage members" ON public.business_members;
DROP POLICY IF EXISTS "Users can manage business settings" ON public.business_settings;
DROP POLICY IF EXISTS "Users can manage business customers" ON public.customer;
DROP POLICY IF EXISTS "Users can manage business products" ON public.product;
DROP POLICY IF EXISTS "Users can manage business proposals" ON public.proposal;
DROP POLICY IF EXISTS "Users can manage business proposal items" ON public.proposal_item;

-- 3. Drop helper functions
DROP FUNCTION IF EXISTS get_user_businesses();
DROP FUNCTION IF EXISTS get_current_user_profile();
DROP FUNCTION IF EXISTS migrate_existing_data();

-- 4. Restore original data from backups
TRUNCATE public.customer;
INSERT INTO public.customer SELECT * FROM backup_customer;

TRUNCATE public.product;
INSERT INTO public.product SELECT * FROM backup_product;

TRUNCATE public.proposal;
INSERT INTO public.proposal SELECT * FROM backup_proposal;

TRUNCATE public.proposal_item;
INSERT INTO public.proposal_item SELECT * FROM backup_proposal_item;

TRUNCATE public.settings;
INSERT INTO public.settings SELECT * FROM backup_settings;

TRUNCATE public.users;
INSERT INTO public.users SELECT * FROM backup_users;

-- 5. Remove new columns
ALTER TABLE public.customer DROP COLUMN IF EXISTS business_id;
ALTER TABLE public.product DROP COLUMN IF EXISTS business_id;
ALTER TABLE public.proposal DROP COLUMN IF EXISTS business_id;
ALTER TABLE public.proposal_item DROP COLUMN IF EXISTS business_id;

-- 6. Drop new tables
DROP TABLE IF EXISTS public.business_settings CASCADE;
DROP TABLE IF EXISTS public.business_members CASCADE;
DROP TABLE IF EXISTS public.businesses CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- 7. Drop backup tables
DROP TABLE IF EXISTS backup_customer;
DROP TABLE IF EXISTS backup_product;
DROP TABLE IF EXISTS backup_proposal;
DROP TABLE IF EXISTS backup_proposal_item;
DROP TABLE IF EXISTS backup_settings;
DROP TABLE IF EXISTS backup_users;

-- Success message
SELECT 'ROLLBACK COMPLETE: Database restored to original state' as status;