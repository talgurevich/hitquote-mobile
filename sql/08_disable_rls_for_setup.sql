-- =====================================================
-- STEP 8: TEMPORARILY DISABLE RLS FOR USER SETUP
-- =====================================================
-- Temporarily disables RLS to allow initial user setup

-- 1. Disable RLS on tables needed for user creation
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings DISABLE ROW LEVEL SECURITY;

-- 2. Keep RLS enabled on data tables to maintain security
-- These will work once business context is established
-- ALTER TABLE public.customer DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.proposal DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.proposal_item DISABLE ROW LEVEL SECURITY;

-- Grant full permissions to authenticated users for setup tables
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.business_members TO authenticated;
GRANT ALL ON public.business_settings TO authenticated;

-- Success message
SELECT 'Step 8 Complete: RLS temporarily disabled for user setup!' as status;
SELECT 'Note: Data tables (customer, product, proposal) still have RLS enabled for security' as note;