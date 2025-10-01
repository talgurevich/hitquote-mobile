-- =====================================================
-- STEP 1: DATABASE BACKUP & NEW SCHEMA CREATION
-- =====================================================
-- Run this first - creates backups and new tables
-- Estimated time: 2-3 minutes

-- 1. Create backup tables (safety net)
CREATE TABLE backup_customer AS SELECT * FROM public.customer;
CREATE TABLE backup_product AS SELECT * FROM public.product;
CREATE TABLE backup_proposal AS SELECT * FROM public.proposal;
CREATE TABLE backup_proposal_item AS SELECT * FROM public.proposal_item;
CREATE TABLE backup_settings AS SELECT * FROM public.settings;
CREATE TABLE backup_users AS SELECT * FROM public.users;

-- 2. Create new user profile system
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create business context table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id),
  business_name TEXT NOT NULL,
  business_email TEXT,
  business_phone TEXT,
  business_address TEXT,
  business_license TEXT,
  logo_url TEXT,
  header_color TEXT DEFAULT '#1e3a8a',
  vat_rate DECIMAL(5,2) DEFAULT 18.00,
  default_payment_terms TEXT DEFAULT 'מזומן / המחאה / העברה בנקאית / שוטף +30',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User-business membership table (for teams later)
CREATE TABLE public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, user_id)
);

-- 5. Add business_id columns to existing tables
ALTER TABLE public.customer ADD COLUMN business_id UUID;
ALTER TABLE public.product ADD COLUMN business_id UUID;
ALTER TABLE public.proposal ADD COLUMN business_id UUID;
ALTER TABLE public.proposal_item ADD COLUMN business_id UUID;

-- 6. Create new settings table linked to businesses
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  vat_rate DECIMAL(5,2) DEFAULT 18.00,
  default_payment_terms TEXT DEFAULT 'מזומן / המחאה / העברה בנקאית / שוטף +30',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Success message
SELECT 'Step 1 Complete: Backup and new schema created successfully!' as status;