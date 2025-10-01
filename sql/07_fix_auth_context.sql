-- =====================================================
-- STEP 7: FIX AUTH CONTEXT FOR USER CREATION
-- =====================================================
-- Creates more permissive policies for initial user setup

-- 1. Temporarily disable RLS on user_profiles to allow creation
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Create a more permissive policy that allows any authenticated user to create profiles
-- We'll re-enable RLS with better policies

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies that work with the auth context
CREATE POLICY "Allow authenticated users to create profiles"
ON public.user_profiles
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow any authenticated user to create a profile

CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid()::text)
WITH CHECK (auth_user_id = auth.uid()::text);

-- 3. Also make businesses creation more permissive for initial setup
DROP POLICY IF EXISTS "Users can create businesses" ON public.businesses;

CREATE POLICY "Allow authenticated users to create businesses"
ON public.businesses
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow any authenticated user to create a business

-- 4. Make business_members creation permissive for initial setup
DROP POLICY IF EXISTS "Users can create business memberships" ON public.business_members;

CREATE POLICY "Allow authenticated users to create memberships"
ON public.business_members
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow any authenticated user to create memberships

-- 5. Make business_settings creation permissive
DROP POLICY IF EXISTS "Users can create business settings" ON public.business_settings;

CREATE POLICY "Allow authenticated users to create business settings"
ON public.business_settings
FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow any authenticated user to create settings

-- Grant permissions to authenticated role
GRANT INSERT ON public.user_profiles TO authenticated;
GRANT INSERT ON public.businesses TO authenticated;
GRANT INSERT ON public.business_members TO authenticated;
GRANT INSERT ON public.business_settings TO authenticated;

-- Success message
SELECT 'Step 7 Complete: Auth context fixed for user creation!' as status;