# Integrated Implementation Plan: Authentication Refactor + Account Tiers

## Overview
This document provides a unified implementation plan that combines both the Authentication Refactor and Account Tier System. These two systems will be implemented together to ensure compatibility and minimize disruption.

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Ready for Implementation

---

## Guest Mode Data Migration Flow

### What Happens to Guest Data When You Sign Up?

```
┌─────────────────────────────────────────────────────────────┐
│                    GUEST MODE (Unauthenticated)             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User creates:                                               │
│  • 5 customers → AsyncStorage (local device)                │
│  • 20 products → AsyncStorage (local device)                │
│                                                               │
│  User tries to create quote:                                │
│  ❌ BLOCKED → "Sign in to create quotes"                     │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ User clicks "Sign Up"
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    SIGN UP / SIGN IN                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User signs up with:                                         │
│  • Email/Password  OR                                        │
│  • Apple Sign-In   OR                                        │
│  • Google Sign-In                                            │
│                                                               │
│  Account created: user_id = abc-123-xyz                      │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Automatic migration triggered
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA MIGRATION                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Read AsyncStorage:                                       │
│     • 5 customers                                            │
│     • 20 products                                            │
│                                                               │
│  2. Insert into Supabase:                                    │
│     • 5 customers → customer table (user_id = abc-123-xyz)  │
│     • 20 products → product table (user_id = abc-123-xyz)   │
│                                                               │
│  3. Clear AsyncStorage:                                      │
│     • Remove local customers                                 │
│     • Remove local products                                  │
│                                                               │
│  4. Show success message:                                    │
│     "✅ 5 customers and 20 products migrated!"               │
│                                                               │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ User now authenticated
                   ▼
┌─────────────────────────────────────────────────────────────┐
│                 AUTHENTICATED USER                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ✅ All guest data now in cloud (Supabase)                   │
│  ✅ Can create quotes using migrated customers/products      │
│  ✅ Data syncs across devices                                │
│  ✅ Account tier assigned (Free: 10 quotes/month)            │
│                                                               │
│  Next quote creation → Quota check → Allow (if under limit) │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Edge Cases Handled

**Q: What if migration fails?**
- Guest data stays in AsyncStorage (not deleted)
- User can retry or manually re-enter data
- Error logged for debugging

**Q: What if user uninstalls app before signing up?**
- AsyncStorage is cleared on uninstall
- Guest data is lost (expected behavior for local-only data)
- No risk to existing users

**Q: What if user signs in on different device?**
- AsyncStorage is device-specific
- Each device has separate guest data
- Migration happens independently on each device

**Q: What if user already has a customer with same name?**
- Migration creates duplicate (both customers saved)
- User can delete duplicate manually
- Future enhancement: Merge duplicates by name/email

---

## Why Implement Together?

### Benefits of Combined Implementation
1. **Single migration** - Users experience one transition instead of two
2. **Consistent user IDs** - Both systems use `auth.users(id)` from the start
3. **Faster time to market** - No waiting for second migration
4. **Reduced risk** - Test both systems together before launch
5. **Apple compliance + monetization** - Submit to App Store with both features ready

### Dependencies Between Systems
- Account tiers **require** authentication system (can't have tiers without users)
- Authentication refactor **enables** tier system by providing stable user IDs
- Both systems need access to `auth.users(id)` and `user_profiles`
- Quote quota enforcement **requires** authentication to work properly

---

## Unified Database Schema

### Tables Created (in order)

#### 1. Authentication System Tables
```sql
-- Auth providers tracking
CREATE TABLE auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'apple', 'email'
  provider_user_id TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Modify user_profiles for new auth system
ALTER TABLE user_profiles
  ADD COLUMN auth_method TEXT DEFAULT 'google',
  ADD COLUMN email_verified BOOLEAN DEFAULT false,
  ADD COLUMN apple_user_id TEXT,
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deletion_scheduled_at TIMESTAMPTZ;

-- Local data cache for guest users
CREATE TABLE local_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  data_type TEXT NOT NULL,
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ,
  UNIQUE(device_id, data_type, (data_json->>'id'))
);
```

#### 2. Account Tier System Tables
```sql
-- Account tiers (uses auth.users ID)
CREATE TABLE account_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  monthly_quote_limit INTEGER NOT NULL DEFAULT 10,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  payment_provider TEXT,
  payment_customer_id TEXT,
  payment_subscription_id TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id),
  CHECK (tier IN ('free', 'premium', 'business')),
  CHECK (monthly_quote_limit >= 0)
);

-- monthly_quote_counters already exists, no changes needed
```

### Database Functions (Quota System)
```sql
-- Check quota using auth.users ID
CREATE OR REPLACE FUNCTION check_user_quota(p_auth_user_id UUID)
RETURNS TABLE(
  can_create_quote BOOLEAN,
  current_count INTEGER,
  monthly_limit INTEGER,
  tier_name TEXT,
  remaining_quotes INTEGER
) AS $$
DECLARE
  v_current_month INTEGER := EXTRACT(MONTH FROM NOW());
  v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
  v_count INTEGER := 0;
  v_limit INTEGER := 10;
  v_tier TEXT := 'free';
  v_legacy_user_id UUID;
BEGIN
  -- Get tier from account_tiers
  SELECT tier, monthly_quote_limit
  INTO v_tier, v_limit
  FROM account_tiers
  WHERE auth_user_id = p_auth_user_id AND is_active = true;

  -- Default to free tier
  IF v_tier IS NULL THEN
    v_tier := 'free';
    v_limit := 10;
  END IF;

  -- Business = unlimited
  IF v_tier = 'business' THEN
    v_limit := -1;
  END IF;

  -- Get legacy user_id for counter lookup
  SELECT id INTO v_legacy_user_id
  FROM user_profiles
  WHERE auth_user_id = p_auth_user_id;

  -- Get current count
  SELECT COALESCE(quote_count, 0)
  INTO v_count
  FROM monthly_quote_counters
  WHERE user_id = v_legacy_user_id
    AND year = v_current_year
    AND month = v_current_month;

  RETURN QUERY SELECT
    (v_limit = -1 OR v_count < v_limit) as can_create_quote,
    v_count as current_count,
    v_limit as monthly_limit,
    v_tier as tier_name,
    CASE
      WHEN v_limit = -1 THEN -1
      ELSE GREATEST(0, v_limit - v_count)
    END as remaining_quotes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enforce quota on quote creation
CREATE OR REPLACE FUNCTION enforce_quote_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_quota_check RECORD;
  v_auth_user_id UUID;
BEGIN
  SELECT auth_user_id INTO v_auth_user_id
  FROM user_profiles
  WHERE id = NEW.user_id;

  SELECT * INTO v_quota_check
  FROM check_user_quota(v_auth_user_id);

  IF NOT v_quota_check.can_create_quote THEN
    RAISE EXCEPTION 'Monthly quote limit exceeded. Current: %, Limit: %',
      v_quota_check.current_count,
      v_quota_check.monthly_limit
    USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_quota_before_proposal_insert
  BEFORE INSERT ON proposal
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quote_quota();
```

---

## Integrated Implementation Timeline

### Phase 1: Database & Auth Setup (4-5 days)
**Combines**: Auth Refactor Phase 1 + Account Tiers Phase 1

**Tasks:**
1. Backup all existing data (Tal and Moran)
2. Create all database tables:
   - `auth_providers`
   - Modify `user_profiles`
   - `local_data_cache`
   - `account_tiers`
3. Create all database functions:
   - `check_user_quota()`
   - `enforce_quote_quota()`
   - `get_user_tier()`
4. Configure Supabase:
   - Enable Email/Password auth
   - Configure Apple Sign-In
   - Set up email templates
5. Migrate existing users to Supabase auth:
   - Create auth.users entries for Tal and Moran
   - Link to existing user_profiles data
6. **Assign premium tiers to existing users**:
   - Tal: Premium (100 quotes/month)
   - Moran: Premium (100 quotes/month)
7. Test quota system with existing users

**Migration Files:**
- `migrations/05_integrated_auth_and_tiers.sql` (combined migration)

---

### Phase 2: Mobile App Implementation (6-8 days)
**Combines**: Auth Refactor Phase 2 + Account Tiers Phase 2

**Tasks:**
1. **Remove email approval system** (Auth)
   - Delete `lib/emailApproval.js`
   - Remove all approval checks from code

2. **Implement Apple Sign-In** (Auth)
   - Install `expo-apple-authentication`
   - Create `lib/appleAuth.js`
   - Add Apple button to login screen

3. **Implement Email/Password Auth** (Auth)
   - Create `lib/emailAuth.js`
   - Add email/password UI to login screen
   - Add registration flow
   - Add password reset flow

4. **Implement Guest Mode** (Auth)
   - Allow app to load without login
   - Store customers/products in AsyncStorage (local device only)
   - Block quote creation for guests → show "Sign in required" prompt
   - Create automatic data migration flow (AsyncStorage → Supabase on signup)
   - Show success message: "X customers and Y products migrated to your account"
   - Clear AsyncStorage after successful migration

5. **Implement Account Deletion** (Auth)
   - Add "Delete Account" button in Settings
   - Create confirmation flow
   - Implement data export

6. **Integrate Quota System** (Tiers)
   - Create `lib/accountTierUtils.js`
   - Add quota check before quote creation
   - Display quota in Settings and New Quote screen
   - Show simple error when limit reached (NO upgrade button - admin only)
   - Message: "כדי להגדיל את המכסה, אנא פנה לאתר הרשת שלנו"

7. **Update login screen UI**:
   - Apple Sign-In button
   - Google Sign-In button
   - Email/Password fields
   - "Continue as Guest" link

**New Files:**
- `lib/appleAuth.js`
- `lib/emailAuth.js`
- `lib/accountTierUtils.js`
- `lib/localDataManager.js`

**Modified Files:**
- `App.js` (extensive changes to login, settings, quote creation)
- `package.json` (add dependencies)
- `app.json` (configure Apple auth)

---

### Phase 3: Web App Implementation (5-6 days)
**Combines**: Auth Refactor Phase 3 + Account Tiers Phase 2 (web)

**Tasks:**
1. **Replace NextAuth with Supabase Auth**
   - Remove `next-auth` dependency
   - Install `@supabase/ssr`
   - Create auth utilities
   - Update all session checks

2. **Implement Apple + Email Auth**
   - Add Apple Sign-In button
   - Add email/password forms
   - Add registration page
   - Add password reset page

3. **Implement Account Deletion**
   - Add deletion section in Settings
   - Create API routes for deletion
   - Match mobile flow

4. **Integrate Quota System**
   - Create `lib/accountTierUtils.js`
   - Add quota widget to dashboard (shows usage only, NO upgrade CTA)
   - Add quota check to quote creation
   - **Build Admin Panel** at `/admin/tiers`:
     - List all users with tier, quota usage, signup date
     - Change tier dropdown (Free/Premium/Business)
     - Admin-only access (tal.gurevich@gmail.com)
     - Confirmation before tier changes
     - Audit log of all tier changes

5. **Auto-assign Free tier on signup**
   - Database trigger creates free tier for new users automatically
   - All new users start with 10 quotes/month

6. **Allow Guest Browsing** (optional)
   - Remove forced login redirect
   - Show limited features without auth

**New Files:**
- `lib/supabaseAuth.js`
- `lib/accountTierUtils.js`
- `app/auth/register/page.js`
- `app/auth/reset-password/page.js`
- `app/api/account/delete/route.js`
- `app/admin/tiers/page.js` (admin panel for tier management)
- `middleware.js`

**Deleted Files:**
- `app/api/auth/[...nextauth]/route.js`

---

### Phase 4: Testing & Quality Assurance (4-5 days)
**Combines**: Auth Refactor Phase 4 + Account Tiers Testing

**Critical Tests:**

#### Authentication Tests
- [ ] Google Sign-In works (mobile + web)
- [ ] Apple Sign-In works (mobile + web, iOS device required)
- [ ] Email/Password registration works
- [ ] Email/Password login works
- [ ] Password reset flow works
- [ ] Guest mode works (browse without login)
- [ ] Data migration works (guest → authenticated)
- [ ] Account deletion works (30-day grace period)

#### Account Tier Tests
- [ ] Free users blocked at 11th quote
- [ ] Premium users blocked at 101st quote
- [ ] Business users never blocked
- [ ] Quota counter shows correct usage
- [ ] Counter resets monthly
- [ ] Upgrade prompt appears when limit reached
- [ ] Quota syncs between mobile and web

#### Existing User Tests (CRITICAL)
- [ ] **Tal can sign in with Google (mobile + web)**
- [ ] **Tal sees all existing data (quotes, customers, products)**
- [ ] **Tal can create quotes (premium tier, 100/month limit)**
- [ ] **Tal's quota counter shows correct usage**
- [ ] **Moran can sign in with Google (mobile + web)**
- [ ] **Moran sees all existing data**
- [ ] **Moran can create quotes (premium tier)**
- [ ] **Moran's quota counter shows correct usage**

#### Apple Compliance Tests
- [ ] Can browse customers/products without login
- [ ] Sign in with Apple button present and working
- [ ] Email/Password option available
- [ ] Can delete account from Settings
- [ ] Account deletion completes within 30 days

---

## Existing Users: Zero-Loss Migration

### Pre-Migration (Phase 0)
```sql
-- Backup Tal's data
CREATE TABLE backup_tal_complete AS
SELECT * FROM user_profiles WHERE email = 'tal.gurevich@gmail.com';

CREATE TABLE backup_tal_proposals AS
SELECT * FROM proposal WHERE user_id IN (
  SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com'
);

-- Backup Moran's data
CREATE TABLE backup_moran_complete AS
SELECT * FROM user_profiles WHERE email = 'moran.marmus@gmail.com';

CREATE TABLE backup_moran_proposals AS
SELECT * FROM proposal WHERE user_id IN (
  SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com'
);
```

### Migration (Phase 1)
```sql
-- 1. Create Supabase auth users (preserves Google IDs)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, raw_user_meta_data)
SELECT
  auth_user_id,
  email,
  NOW(),
  created_at,
  '{"provider": "google", "migrated": true}'::jsonb
FROM user_profiles
WHERE email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');

-- 2. Assign premium tiers
INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active, payment_provider)
SELECT
  auth_user_id,
  'premium',
  100,
  true,
  'manual'
FROM user_profiles
WHERE email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');

-- 3. Verify everything is linked
SELECT
  up.email,
  up.id as legacy_id,
  up.auth_user_id,
  at.tier,
  at.monthly_quote_limit,
  COUNT(DISTINCT p.id) as quote_count
FROM user_profiles up
JOIN account_tiers at ON at.auth_user_id = up.auth_user_id
LEFT JOIN proposal p ON p.user_id = up.id
WHERE up.email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com')
GROUP BY up.email, up.id, up.auth_user_id, at.tier, at.monthly_quote_limit;
```

### Post-Migration Verification
```sql
-- Verify Tal's data
SELECT
  'tal.gurevich@gmail.com' as user,
  (SELECT COUNT(*) FROM proposal WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')) as proposals,
  (SELECT COUNT(*) FROM customer WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')) as customers,
  (SELECT COUNT(*) FROM product WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')) as products,
  (SELECT tier FROM account_tiers WHERE auth_user_id IN (SELECT auth_user_id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')) as tier;

-- Verify Moran's data
SELECT
  'moran.marmus@gmail.com' as user,
  (SELECT COUNT(*) FROM proposal WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')) as proposals,
  (SELECT COUNT(*) FROM customer WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')) as customers,
  (SELECT COUNT(*) FROM product WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')) as products,
  (SELECT tier FROM account_tiers WHERE auth_user_id IN (SELECT auth_user_id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')) as tier;
```

---

## Combined Timeline

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Phase 0**: Pre-Migration Backup | 1 day | Complete data backups |
| **Phase 1**: Database & Auth Setup | 4-5 days | All tables, functions, existing users migrated + tiered |
| **Phase 2**: Mobile App | 6-8 days | Apple/Email auth, guest mode, account deletion, quota system |
| **Phase 3**: Web App | 5-6 days | Supabase auth, account deletion, quota system |
| **Phase 4**: Testing & QA | 4-5 days | Full E2E tests, existing user verification |

**Total: 20-25 days (4-5 weeks)**

---

## Success Criteria

### Apple App Store Compliance ✅
- [ ] Can browse without login
- [ ] Sign in with Apple available
- [ ] Email/Password available
- [ ] Account deletion works

### Account Tier System ✅
- [ ] Free users limited to 10 quotes/month
- [ ] Premium users get 100 quotes/month
- [ ] Existing users (Tal, Moran) have premium tier
- [ ] Quota enforced at database level
- [ ] Quota displays correctly in mobile + web

### Existing Users ✅
- [ ] Zero data loss
- [ ] Zero disruption to workflow
- [ ] Premium tier assigned automatically
- [ ] All features work as before

---

## Rollback Plan

If critical issues occur:

### Immediate (< 1 hour)
1. Revert app to previous version (App Store)
2. Keep database changes (forward-compatible)
3. Disable quota trigger temporarily

### Partial (< 1 day)
1. Disable specific auth provider (Apple/Email)
2. Keep Google Sign-In working
3. Fix issues in staging

### Full (< 1 week)
1. Restore database from backup
2. Revert all code changes
3. Notify Tal and Moran personally
4. Re-plan migration

---

## Next Steps

1. **Review this plan** - Tal and team review and approve
2. **Schedule kick-off** - Set start date for Phase 1
3. **Prepare Apple credentials** - Apple Developer account setup
4. **Test in staging** - Run full migration in staging environment first
5. **Execute Phase 1** - Begin with database setup
6. **Iterate** - Complete phases 2-4 with daily check-ins

---

## Documentation References

For detailed information, see:
- `AUTHENTICATION_REFACTOR_PLAN.md` - Complete auth system details
- `ACCOUNT_TIER_SYSTEM.md` - Complete tier system details
- `QUOTE_PDF_REQUIREMENTS.md` - PDF generation requirements

---

**Status**: ✅ Ready for Implementation
**Approval Required**: Product Owner, Engineering Lead
**Estimated Start Date**: TBD
**Estimated Completion**: 4-5 weeks after start
