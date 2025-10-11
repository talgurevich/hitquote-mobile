# Account Tier System - Requirements & Architecture

## Overview
Multi-tier subscription system for HitQuote (web + mobile) with monthly quote limits, designed to work seamlessly across both platforms using Supabase as the central source of truth.

---

## Business Requirements

### Tier Definitions

| Tier | Monthly Quote Limit | Price | Features |
|------|-------------------|-------|----------|
| **Free** | 10 quotes/month | ₪0 | Basic quote creation, PDF export, customer management |
| **Premium** | 100 quotes/month | ₪99/month | Everything in Free + custom branding, priority support |
| **Business** | Unlimited | ₪299/month | Everything in Premium + team members, API access |

### Core Functionality
1. **Quote limit enforcement** - Prevent quote creation when limit exceeded
2. **Real-time counter** - Show "X of Y quotes used this month" across both apps
3. **Upgrade prompts** - Graceful UX when users hit limits
4. **Cross-platform sync** - Mobile and web share the same counter/limits
5. **Monthly reset** - Counters reset on the 1st of each month automatically

---

## Technical Architecture

### Database Schema

#### 1. New Table: `account_tiers`
```sql
CREATE TABLE account_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'premium', 'business'
  monthly_quote_limit INTEGER NOT NULL DEFAULT 10,
  billing_cycle_start DATE,
  billing_cycle_end DATE,
  payment_provider TEXT, -- 'payplus', 'manual', null for free tier
  payment_customer_id TEXT, -- PayPlus customer ID (when payment is integrated)
  payment_subscription_id TEXT, -- PayPlus subscription ID (when payment is integrated)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(auth_user_id),
  CHECK (tier IN ('free', 'premium', 'business')),
  CHECK (monthly_quote_limit >= 0)
);

-- Index for fast lookups
CREATE INDEX idx_account_tiers_auth_user_id ON account_tiers(auth_user_id);
CREATE INDEX idx_account_tiers_payment_customer ON account_tiers(payment_customer_id);

-- RLS Policies
ALTER TABLE account_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tier"
  ON account_tiers FOR SELECT
  USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own tier"
  ON account_tiers FOR UPDATE
  USING (auth_user_id = auth.uid());

-- Helper function to get tier by auth user ID
CREATE OR REPLACE FUNCTION get_user_tier(p_auth_user_id UUID)
RETURNS TABLE(
  tier TEXT,
  monthly_limit INTEGER,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT at.tier, at.monthly_quote_limit, at.is_active
  FROM account_tiers at
  WHERE at.auth_user_id = p_auth_user_id AND at.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Extend Existing Table: `monthly_quote_counters`
Already exists - no changes needed. This table tracks actual quote creation count per month.

#### 3. Database Function: Check Quota
```sql
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
  -- Get user's tier and limit from account_tiers (uses auth.users ID)
  SELECT tier, monthly_quote_limit
  INTO v_tier, v_limit
  FROM account_tiers
  WHERE auth_user_id = p_auth_user_id AND is_active = true;

  -- Default to free tier if no record exists
  IF v_tier IS NULL THEN
    v_tier := 'free';
    v_limit := 10;
  END IF;

  -- Business tier = unlimited
  IF v_tier = 'business' THEN
    v_limit := -1; -- -1 represents unlimited
  END IF;

  -- Get legacy user_id from user_profiles for counter lookup
  -- (monthly_quote_counters still uses legacy user_profiles.id)
  SELECT id INTO v_legacy_user_id
  FROM user_profiles
  WHERE auth_user_id = p_auth_user_id;

  -- Get current month's quote count
  SELECT COALESCE(quote_count, 0)
  INTO v_count
  FROM monthly_quote_counters
  WHERE user_id = v_legacy_user_id
    AND year = v_current_year
    AND month = v_current_month;

  -- Return quota check results
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
```

#### 4. Database Trigger: Enforce Quota on Quote Creation
```sql
CREATE OR REPLACE FUNCTION enforce_quote_quota()
RETURNS TRIGGER AS $$
DECLARE
  v_quota_check RECORD;
  v_auth_user_id UUID;
BEGIN
  -- Get auth_user_id from user_profiles using legacy user_id
  SELECT auth_user_id INTO v_auth_user_id
  FROM user_profiles
  WHERE id = NEW.user_id;

  -- Check quota before allowing insert
  SELECT * INTO v_quota_check
  FROM check_user_quota(v_auth_user_id);

  IF NOT v_quota_check.can_create_quote THEN
    RAISE EXCEPTION 'Monthly quote limit exceeded. Current: %, Limit: %. Please upgrade your plan.',
      v_quota_check.current_count,
      v_quota_check.monthly_limit
    USING ERRCODE = 'P0001'; -- Custom error code for quota exceeded
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_quota_before_proposal_insert
  BEFORE INSERT ON proposal
  FOR EACH ROW
  EXECUTE FUNCTION enforce_quote_quota();
```

#### 5. Auto-Assign Free Tier on User Creation
```sql
-- Automatically create free tier for new users
CREATE OR REPLACE FUNCTION create_default_tier_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert free tier for new auth user
  INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active)
  VALUES (NEW.id, 'free', 10, true)
  ON CONFLICT (auth_user_id) DO NOTHING; -- Skip if already exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table (Supabase auth)
CREATE TRIGGER create_tier_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_tier_for_new_user();
```

---

## Implementation Plan

### Phase 1: Database Setup (Week 1)
**Priority: HIGH**

- [ ] **Task 1.1**: Create `account_tiers` table
  - Run SQL migration
  - Set up RLS policies
  - Create indexes

- [ ] **Task 1.2**: Create quota checking function
  - Implement `check_user_quota()` function
  - Add proper error handling
  - Test with different tiers

- [ ] **Task 1.3**: Create quota enforcement trigger
  - Implement `enforce_quote_quota()` trigger
  - Test quota blocking behavior
  - Verify error messages

- [ ] **Task 1.4**: Backfill existing users with proper tier assignments
  - **CRITICAL**: Assign premium tier to existing users (Tal and Moran)
  - Set new users to 'free' tier by default
  - Initialize billing cycle dates
  - Verify data integrity

**SQL Migration File**: `migrations/01_create_account_tier_system.sql`

**Existing User Tier Assignments**:
```sql
-- Grant premium tier to existing users (100 quotes/month)
-- Run this AFTER creating account_tiers table and AFTER auth migration

-- For Tal Gurevich (admin/owner) - Premium tier
INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active, payment_provider)
SELECT
  auth_user_id,
  'premium' as tier,
  100 as monthly_quote_limit,
  true as is_active,
  'manual' as payment_provider
FROM user_profiles
WHERE email = 'tal.gurevich@gmail.com';

-- For Moran Marmus - Premium tier
INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active, payment_provider)
SELECT
  auth_user_id,
  'premium' as tier,
  100 as monthly_quote_limit,
  true as is_active,
  'manual' as payment_provider
FROM user_profiles
WHERE email = 'moran.marmus@gmail.com';

-- Verify tier assignments
SELECT
  up.email,
  at.tier,
  at.monthly_quote_limit,
  at.is_active
FROM user_profiles up
JOIN account_tiers at ON at.auth_user_id = up.auth_user_id
WHERE up.email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');
```

---

### Phase 2: Backend Integration (Week 1-2)
**Priority: HIGH**

#### Mobile App Changes

- [ ] **Task 2.1**: Create tier utility module
  - File: `lib/accountTierUtils.js`
  - Functions:
    - `getUserTier(userId)` - Get user's current tier
    - `checkQuotaBeforeCreate(userId)` - Pre-flight quota check
    - `getQuotaStatus(userId)` - Get usage stats for UI
    - **NOTE**: Tier changes ONLY via admin panel (web app), no upgrade functions in mobile

- [ ] **Task 2.2**: Integrate quota checks into quote creation flow
  - File: `App.js` (line ~2540, `saveQuote` function)
  - Before quote creation, call `checkQuotaBeforeCreate()`
  - Show user-friendly error if quota exceeded
  - **DO NOT** show upgrade button (admin-only tier changes)

- [ ] **Task 2.3**: Add quota display to UI
  - Settings screen: Show "X of Y quotes used this month"
  - New Quote screen: Show remaining quota at top
  - Update in real-time after quote creation

#### Web App Changes

- [ ] **Task 2.4**: Create matching tier utility module
  - File: `lib/accountTierUtils.js` (web app)
  - Mirror mobile app functions
  - Ensure consistency with mobile implementation

- [ ] **Task 2.5**: Integrate into web quote creation
  - Update quote creation endpoint
  - Add quota check before DB insert
  - Return proper error codes (429 for quota exceeded)

- [ ] **Task 2.6**: Add quota UI to web dashboard
  - Dashboard widget: "Quotes this month: X/Y"
  - Progress bar visualization
  - **DO NOT** show upgrade CTA (admin-only tier changes)

---

### Phase 3: Admin Panel for Tier Management (ONLY Way to Change Tiers)
**Priority: HIGH**

**Important**: This is the ONLY way users can change tiers. No self-service, no payment integration yet.

- [ ] **Task 3.1**: Create admin panel UI (web app only)
  - **Route**: `/admin/tiers` (protected, admin-only access)
  - **Features**:
    - Table showing all users:
      - Email
      - Name
      - Current Tier (Free/Premium/Business)
      - Quotes Used This Month (e.g., "7/10")
      - Signup Date
      - Action (dropdown to change tier)
    - Search bar: Filter by email
    - Filter dropdown: Show All / Free / Premium / Business
    - Tier change: Dropdown (Free/Premium/Business) + "Update" button
    - Confirmation dialog: "Change {email} from {old_tier} to {new_tier}?"
    - Success message: "Tier updated successfully"
    - Audit log section: Show last 20 tier changes (date, admin, user, old → new)

- [ ] **Task 3.2**: Admin authentication & authorization
  - Check if logged-in user is admin (email = 'tal.gurevich@gmail.com')
  - Redirect non-admins to dashboard
  - Add "Admin" link in navigation (only visible to admins)

- [ ] **Task 3.3**: Tier management API endpoints (web app)
  - `GET /api/admin/users` - List all users with tier info (admin only)
  - `POST /api/admin/update-tier` - Change user's tier (admin only)
  - `GET /api/admin/tier-audit-log` - View tier change history (admin only)
  - All endpoints require admin authentication

- [ ] **Task 3.4**: Default tier assignment on signup
  - **All new users → Free tier (10 quotes/month)**
  - Auto-create `account_tiers` row on user registration
  - No exceptions (admin can upgrade later via admin panel)

- [ ] **Task 3.5**: Remove all upgrade CTAs from user-facing UI
  - **Mobile app**: Remove "Upgrade Now" buttons
  - **Web app**: Remove "Upgrade to Premium" prompts
  - **Quota exceeded message**: Show simple error, no upgrade option
  - Users must contact admin to upgrade (future: contact form)

---

### Phase 4: Future Payment Integration with PayPlus (Deferred)
**Priority: DEFERRED**

When ready to integrate payments, implement:

- [ ] **Task 4.1**: PayPlus account setup
  - Create PayPlus merchant account
  - Get API credentials
  - Configure webhook URLs

- [ ] **Task 4.2**: PayPlus webhook handler
  - File: `api/webhooks/payplus.js` (web app)
  - Handle subscription lifecycle events
  - Update `account_tiers` table automatically
  - Handle payment failures/cancellations

- [ ] **Task 4.3**: Automated upgrade flow (web)
  - Pricing page with tier comparison
  - PayPlus checkout integration
  - Post-payment redirect and confirmation

- [ ] **Task 4.4**: Automated upgrade flow (mobile)
  - Deep link to web checkout flow
  - OR: Investigate PayPlus mobile SDK if available
  - Auto-sync tier after successful payment

- [ ] **Task 4.5**: Self-service billing portal
  - View current plan and usage
  - Upgrade/downgrade subscription
  - View payment history
  - Cancel subscription

---

### Phase 5: Admin & Analytics (Week 3-4)
**Priority: LOW**

- [ ] **Task 5.1**: Admin dashboard
  - View all users and their tiers
  - Manually upgrade/downgrade users
  - View quota usage statistics
  - Revenue metrics

- [ ] **Task 5.2**: Usage analytics
  - Track conversion rates (free → premium)
  - Monitor churn rates
  - Identify power users approaching limits
  - A/B test pricing tiers

- [ ] **Task 5.3**: Email notifications
  - Warning at 80% quota usage
  - Quota exceeded notification
  - Monthly usage summary
  - Payment receipts

---

## Code Examples

### Mobile App: Quota Check Before Quote Creation

```javascript
// lib/accountTierUtils.js

import { supabase } from '../config/supabase';

export async function checkQuotaBeforeCreate(userId) {
  try {
    const { data, error } = await supabase
      .rpc('check_user_quota', { p_user_id: userId });

    if (error) throw error;

    return {
      canCreate: data[0].can_create_quote,
      current: data[0].current_count,
      limit: data[0].monthly_limit,
      tier: data[0].tier_name,
      remaining: data[0].remaining_quotes
    };
  } catch (error) {
    console.error('Error checking quota:', error);
    // Fail open - allow quote creation if check fails
    return { canCreate: true, current: 0, limit: 10, tier: 'free', remaining: 10 };
  }
}

export async function getQuotaStatus(userId) {
  return await checkQuotaBeforeCreate(userId);
}

export function getQuotaDisplayText(quotaStatus) {
  if (quotaStatus.limit === -1) {
    return `${quotaStatus.current} quotes this month (Unlimited)`;
  }
  return `${quotaStatus.current} / ${quotaStatus.limit} quotes this month`;
}
```

### Mobile App: Integration in Quote Creation

```javascript
// App.js - Inside saveQuote function (before line 2548)

const saveQuote = async () => {
  setLoading(true);
  try {
    // ... existing validation code ...

    await validateSessionAndGetBusinessUserId(session);
    const legacyUserId = getCachedLegacyUserId();

    // NEW: Check quota before proceeding
    const quotaStatus = await checkQuotaBeforeCreate(legacyUserId);

    if (!quotaStatus.canCreate) {
      Alert.alert(
        'מכסת ההצעות התמלאה',
        `השתמשת ב-${quotaStatus.current} מתוך ${quotaStatus.limit} הצעות החודש.\n\nכדי להגדיל את המכסה, אנא פנה לאתר הרשת שלנו.`,
        [{ text: 'אישור', style: 'default' }]
      );
      setLoading(false);
      return;
    }

    // ... rest of existing quote creation code ...

  } catch (error) {
    // ... existing error handling ...
  }
};
```

### UI Component: Quota Display

```javascript
// Add to Settings screen or create QuotaWidget component

const QuotaWidget = ({ userId }) => {
  const [quotaStatus, setQuotaStatus] = useState(null);

  useEffect(() => {
    loadQuotaStatus();
  }, [userId]);

  const loadQuotaStatus = async () => {
    const status = await getQuotaStatus(userId);
    setQuotaStatus(status);
  };

  if (!quotaStatus) return null;

  const percentage = quotaStatus.limit === -1
    ? 100
    : (quotaStatus.current / quotaStatus.limit) * 100;

  return (
    <View style={styles.quotaWidget}>
      <Text style={styles.quotaTitle}>שימוש בהצעות חודש זה</Text>
      <Text style={styles.quotaText}>
        {getQuotaDisplayText(quotaStatus)}
      </Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      {quotaStatus.tier === 'free' && quotaStatus.remaining < 3 && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            נותרו לך {quotaStatus.remaining} הצעות בלבד החודש
          </Text>
        </View>
      )}
    </View>
  );
};
```

### Web App: Admin Panel (ONLY Place to Change Tiers)

```javascript
// app/admin/tiers/page.js

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseAuth';
import { useRouter } from 'next/navigation';

export default function AdminTiersPage() {
  const router = useRouter();
  const supabase = createClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, free, premium, business
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAdminAccess();
    loadUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    // Only tal.gurevich@gmail.com is admin
    if (!session || session.user.email !== 'tal.gurevich@gmail.com') {
      router.push('/dashboard');
      return;
    }
  };

  const loadUsers = async () => {
    setLoading(true);

    // Get all users with their tier info and quota usage
    const { data, error } = await supabase
      .rpc('get_all_users_with_tiers'); // Custom DB function

    if (error) {
      console.error('Error loading users:', error);
      setLoading(false);
      return;
    }

    setUsers(data);
    setLoading(false);
  };

  const handleTierChange = async (userId, email, oldTier, newTier) => {
    if (oldTier === newTier) return;

    const confirmed = confirm(
      `שנה את ${email} מ-${oldTier} ל-${newTier}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('account_tiers')
      .update({
        tier: newTier,
        monthly_quote_limit: newTier === 'free' ? 10 : newTier === 'premium' ? 100 : -1
      })
      .eq('auth_user_id', userId);

    if (error) {
      alert('שגיאה בשינוי רמת החשבון');
      console.error(error);
      return;
    }

    alert('רמת החשבון עודכנה בהצלחה!');
    loadUsers(); // Refresh list
  };

  const filteredUsers = users.filter(user => {
    // Filter by tier
    if (filter !== 'all' && user.tier !== filter) return false;

    // Filter by search query
    if (searchQuery && !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  if (loading) return <div>טוען...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>ניהול רמות חשבון (Admin Only)</h1>

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="חיפוש לפי אימייל..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '10px', flex: 1 }}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '10px' }}>
          <option value="all">הכל</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
          <option value="business">Business</option>
        </select>
      </div>

      {/* Users Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '12px', textAlign: 'right' }}>אימייל</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>שם</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>רמה נוכחית</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>שימוש החודש</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>תאריך הצטרפות</th>
            <th style={{ padding: '12px', textAlign: 'center' }}>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.auth_user_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
              <td style={{ padding: '12px' }}>{user.email}</td>
              <td style={{ padding: '12px' }}>{user.name || '-'}</td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <span style={{
                  backgroundColor: user.tier === 'free' ? '#e5e7eb' : user.tier === 'premium' ? '#dbeafe' : '#d1fae5',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '14px'
                }}>
                  {user.tier}
                </span>
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {user.quotes_this_month} / {user.monthly_limit === -1 ? '∞' : user.monthly_limit}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                {new Date(user.created_at).toLocaleDateString('he-IL')}
              </td>
              <td style={{ padding: '12px', textAlign: 'center' }}>
                <select
                  value={user.tier}
                  onChange={(e) => handleTierChange(user.auth_user_id, user.email, user.tier, e.target.value)}
                  style={{ padding: '6px 12px' }}
                >
                  <option value="free">Free (10)</option>
                  <option value="premium">Premium (100)</option>
                  <option value="business">Business (∞)</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredUsers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          לא נמצאו משתמשים
        </div>
      )}
    </div>
  );
}
```

```sql
-- Database function to get all users with tier info
-- Add this to migrations

CREATE OR REPLACE FUNCTION get_all_users_with_tiers()
RETURNS TABLE(
  auth_user_id UUID,
  email TEXT,
  name TEXT,
  tier TEXT,
  monthly_limit INTEGER,
  quotes_this_month INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id as auth_user_id,
    au.email::TEXT,
    au.raw_user_meta_data->>'name' as name,
    COALESCE(at.tier, 'free') as tier,
    COALESCE(at.monthly_quote_limit, 10) as monthly_limit,
    COALESCE(mqc.quote_count, 0) as quotes_this_month,
    au.created_at
  FROM auth.users au
  LEFT JOIN account_tiers at ON at.auth_user_id = au.id
  LEFT JOIN user_profiles up ON up.auth_user_id = au.id
  LEFT JOIN monthly_quote_counters mqc ON mqc.user_id = up.id
    AND mqc.year = EXTRACT(YEAR FROM NOW())
    AND mqc.month = EXTRACT(MONTH FROM NOW())
  ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Testing Plan

### Unit Tests
- [ ] Database function `check_user_quota()` returns correct results
- [ ] Quota trigger blocks inserts when limit exceeded
- [ ] Monthly counter increments properly
- [ ] Tier upgrades update limits correctly

### Integration Tests
- [ ] Free user blocked at 11th quote
- [ ] Premium user blocked at 101st quote
- [ ] Business user never blocked
- [ ] Counter resets on month boundary
- [ ] Mobile and web counters stay in sync
- [ ] Manual tier upgrade immediately allows more quotes

### E2E Tests
- [ ] User creates 10 free quotes, sees upgrade prompt on 11th
- [ ] Admin manually upgrades user, user immediately can create more quotes
- [ ] User's quota shown correctly in both mobile and web
- [ ] Manual tier downgrade immediately restricts quota

---

## Rollback Plan

If issues arise:

1. **Disable quota trigger** (immediate fix):
   ```sql
   DROP TRIGGER IF EXISTS check_quota_before_proposal_insert ON proposal;
   ```

2. **Remove quota checks from code** (deploy):
   - Comment out `checkQuotaBeforeCreate()` calls
   - Deploy mobile + web updates

3. **Full rollback** (if necessary):
   ```sql
   DROP TABLE account_tiers CASCADE;
   DROP FUNCTION check_user_quota CASCADE;
   DROP FUNCTION enforce_quote_quota CASCADE;
   ```

---

## Success Metrics

### Technical KPIs
- [ ] 99.9% uptime for quota check function
- [ ] < 100ms quota check latency
- [ ] Zero quota sync issues between platforms
- [ ] 100% of quota violations blocked

### Business KPIs
- [ ] 5% free → premium conversion rate (month 1)
- [ ] 15% free → premium conversion rate (month 6)
- [ ] < 2% monthly churn rate
- [ ] Average LTV > 6 months

---

## Future Enhancements

### v2.0 Features (3-6 months)
- Annual billing (20% discount)
- Custom tiers for enterprise
- Team seats for Business plan
- Usage-based pricing (pay per quote)
- White-label option for agencies

### v3.0 Features (6-12 months)
- Reseller/affiliate program
- API rate limiting tied to tiers
- Advanced analytics for Business tier
- Customer success automation
- Multi-language support for billing

---

## Dependencies

### External Services (Current)
- **SendGrid/Postmark**: Transactional emails
- **Sentry**: Error monitoring for quota system

### External Services (Future - When Payments are Integrated)
- **PayPlus**: Payment processing, subscription management

### Internal Dependencies
- Existing `monthly_quote_counters` table
- Existing `user_profiles` table
- Supabase RLS policies
- Mobile app auth system
- Web app auth system

---

## Timeline Summary

| Phase | Duration | Dependencies | Risk Level |
|-------|----------|--------------|------------|
| Phase 1: Database | 3-5 days | None | Low |
| Phase 2: Backend | 5-7 days | Phase 1 complete | Medium |
| Phase 3: Manual Management | 2-3 days | Phase 2 complete | Low |
| Phase 4: PayPlus Payment | 7-10 days | PayPlus account, Phase 3 | High (DEFERRED) |
| Phase 5: Admin & Analytics | 3-5 days | Phase 2 complete | Low |

**Total estimated time for MVP (no payments)**: 2-3 weeks (Phases 1-3)
**Total estimated time with PayPlus integration**: 4-5 weeks (all phases)

---

## Questions to Resolve

### Current Phase (Manual Management)
1. **Pricing**: Are ₪99/₪299 the final prices, or should we A/B test?
2. **Business tier**: Should unlimited really be unlimited, or cap at 1000/month?
3. **Grace period**: Allow 1-2 extra quotes beyond limit before hard block?
4. **Trial period**: Offer manual 14-day Premium trial for new users?
5. **Grandfathering**: Should early users get permanent discounts when payments launch?
6. **Data retention**: Keep quote history after downgrade to free?

### Future Phase (PayPlus Integration)
7. **Proration**: How to handle mid-month upgrades/downgrades?
8. **Failed payments**: How many retry attempts before downgrade?
9. **PayPlus webhook security**: How to verify webhook authenticity?
10. **Mobile payments**: Use PayPlus SDK or redirect to web checkout?

---

## Approval & Sign-off

- [ ] Product Owner reviewed and approved
- [ ] Engineering Lead reviewed technical approach
- [ ] Finance approved pricing structure
- [ ] Legal approved terms of service updates
- [ ] Security reviewed RLS policies and payment flow

---

**Document Version**: 1.1
**Last Updated**: 2025-10-02
**Author**: Claude (AI Assistant)
**Status**: Draft - Awaiting Review

**Notes**:
- Phase 3 updated to manual tier management (no payment integration yet)
- PayPlus integration moved to Phase 4 (deferred for future)
- Database schema includes payment provider fields for future use
- MVP timeline reduced to 2-3 weeks without payment integration
