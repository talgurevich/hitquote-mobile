-- =====================================================
-- STEP 3: RLS IMPLEMENTATION (ENTERPRISE SECURITY)
-- =====================================================
-- Implements Row Level Security with proper user isolation
-- Estimated time: 3-4 minutes

-- 1. Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_item ENABLE ROW LEVEL SECURITY;

-- Keep old tables without RLS for now (we'll migrate away from them)
-- ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 2. Create helper function to get user's business IDs
CREATE OR REPLACE FUNCTION get_user_businesses() RETURNS TABLE(business_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT bm.business_id
  FROM public.business_members bm
  JOIN public.user_profiles up ON up.id = bm.user_id
  WHERE up.auth_user_id = auth.uid()::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create helper function to get current user profile
CREATE OR REPLACE FUNCTION get_current_user_profile() RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT id
    FROM public.user_profiles
    WHERE auth_user_id = auth.uid()::text
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RLS Policies for User Profiles
CREATE POLICY "Users can view and edit own profile"
ON public.user_profiles
FOR ALL
USING (auth_user_id = auth.uid()::text);

-- 5. RLS Policies for Businesses
CREATE POLICY "Users can manage own businesses"
ON public.businesses
FOR ALL
USING (id IN (SELECT business_id FROM get_user_businesses()));

-- 6. RLS Policies for Business Members
CREATE POLICY "Users can view business memberships"
ON public.business_members
FOR SELECT
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

CREATE POLICY "Business owners can manage members"
ON public.business_members
FOR ALL
USING (business_id IN (
  SELECT b.id FROM public.businesses b WHERE b.owner_id = get_current_user_profile()
));

-- 7. RLS Policies for Business Settings
CREATE POLICY "Users can manage business settings"
ON public.business_settings
FOR ALL
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

-- 8. RLS Policies for Customer Data
CREATE POLICY "Users can manage business customers"
ON public.customer
FOR ALL
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

-- 9. RLS Policies for Product Data
CREATE POLICY "Users can manage business products"
ON public.product
FOR ALL
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

-- 10. RLS Policies for Proposal Data
CREATE POLICY "Users can manage business proposals"
ON public.proposal
FOR ALL
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

-- 11. RLS Policies for Proposal Items
CREATE POLICY "Users can manage business proposal items"
ON public.proposal_item
FOR ALL
USING (business_id IN (SELECT business_id FROM get_user_businesses()));

-- 12. Create indexes for performance
CREATE INDEX idx_user_profiles_auth_user_id ON public.user_profiles(auth_user_id);
CREATE INDEX idx_business_members_business_id ON public.business_members(business_id);
CREATE INDEX idx_business_members_user_id ON public.business_members(user_id);
CREATE INDEX idx_customer_business_id ON public.customer(business_id);
CREATE INDEX idx_product_business_id ON public.product(business_id);
CREATE INDEX idx_proposal_business_id ON public.proposal(business_id);
CREATE INDEX idx_proposal_item_business_id ON public.proposal_item(business_id);

-- 13. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.businesses TO authenticated;
GRANT ALL ON public.business_members TO authenticated;
GRANT ALL ON public.business_settings TO authenticated;
GRANT ALL ON public.customer TO authenticated;
GRANT ALL ON public.product TO authenticated;
GRANT ALL ON public.proposal TO authenticated;
GRANT ALL ON public.proposal_item TO authenticated;

-- Success message
SELECT 'Step 3 Complete: Enterprise RLS security implemented!' as status;