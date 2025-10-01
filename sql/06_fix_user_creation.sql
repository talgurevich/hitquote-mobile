-- =====================================================
-- STEP 6: FIX USER PROFILE CREATION
-- =====================================================
-- Fixes RLS policies to allow new user creation

-- 1. Update user_profiles policy to allow INSERT for authenticated users
DROP POLICY IF EXISTS "Users can view and edit own profile" ON public.user_profiles;

-- Create separate policies for different operations
CREATE POLICY "Users can view own profile"
ON public.user_profiles
FOR SELECT
USING (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can create own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth_user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (auth_user_id = auth.uid()::text)
WITH CHECK (auth_user_id = auth.uid()::text);

-- 2. Update businesses policy to allow creation
DROP POLICY IF EXISTS "Users can manage own businesses" ON public.businesses;

CREATE POLICY "Users can view own businesses"
ON public.businesses
FOR SELECT
USING (id IN (SELECT business_id FROM get_user_businesses()));

CREATE POLICY "Users can create businesses"
ON public.businesses
FOR INSERT
WITH CHECK (true); -- Allow creation, will be restricted by ownership

CREATE POLICY "Users can update own businesses"
ON public.businesses
FOR UPDATE
USING (id IN (SELECT business_id FROM get_user_businesses()))
WITH CHECK (id IN (SELECT business_id FROM get_user_businesses()));

-- 3. Update business_members policy to allow initial membership creation
DROP POLICY IF EXISTS "Business owners can manage members" ON public.business_members;
DROP POLICY IF EXISTS "Users can view business memberships" ON public.business_members;

CREATE POLICY "Users can view business memberships"
ON public.business_members
FOR SELECT
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

CREATE POLICY "Users can create business memberships"
ON public.business_members
FOR INSERT
WITH CHECK (true); -- Allow creation during business setup

CREATE POLICY "Business owners can manage members"
ON public.business_members
FOR ALL
USING (business_id IN (
  SELECT b.id FROM public.businesses b WHERE b.owner_id = get_current_user_profile()
));

-- 4. Update business_settings policy
DROP POLICY IF EXISTS "Users can manage business settings" ON public.business_settings;

CREATE POLICY "Users can view business settings"
ON public.business_settings
FOR SELECT
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

CREATE POLICY "Users can create business settings"
ON public.business_settings
FOR INSERT
WITH CHECK (business_id IN (SELECT business_id FROM get_user_businesses()) OR
            business_id IN (SELECT id FROM public.businesses WHERE owner_id = get_current_user_profile()));

CREATE POLICY "Users can update business settings"
ON public.business_settings
FOR UPDATE
USING (business_id IN (SELECT business_id FROM get_user_businesses()))
WITH CHECK (business_id IN (SELECT business_id FROM get_user_businesses()));

-- Success message
SELECT 'Step 6 Complete: User creation policies fixed!' as status;