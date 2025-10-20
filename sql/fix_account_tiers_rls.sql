-- Allow users to upsert their own account tier (for RevenueCat sync)
-- This enables the mobile app to sync subscription status from RevenueCat to Supabase

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can upsert their own tier" ON account_tiers;

-- Create policy to allow users to insert/update their own tier
CREATE POLICY "Users can upsert their own tier"
ON account_tiers
FOR ALL
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'account_tiers';
