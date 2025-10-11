# Authentication System Refactor - Implementation Plan

## Overview
Complete overhaul of authentication system for HitQuote mobile and web apps to comply with Apple App Store guidelines and implement modern auth patterns.

**Document Version**: 1.0
**Last Updated**: 2025-10-02
**Status**: Planning - Awaiting Approval

---

## Apple App Store Compliance Requirements

### ✅ Issue 1: Forced Login (Guideline 5.1.1)
**Current Problem**: App requires login before accessing any features
**Solution**: Allow browsing customers/products without login; require login only for quote creation

### ✅ Issue 2: Missing Sign in with Apple (Guideline 4.8)
**Current Problem**: Only Google Sign-In available
**Solution**: Add Sign in with Apple + Email/Password authentication

### ✅ Issue 3: No Account Deletion (Guideline 5.1.1(v))
**Current Problem**: Users cannot delete their accounts
**Solution**: Add "Delete Account" feature in Settings

---

## Current Authentication Architecture

### Mobile App (React Native + Expo)
- **Auth Provider**: Google Sign-In only (`@react-native-google-signin/google-signin`)
- **Session Management**: Custom session with Supabase
- **Approval System**: Email whitelist (`lib/emailApproval.js`)

### Web App (Next.js)
- **Auth Provider**: NextAuth with Google provider
- **Session Management**: NextAuth session + JWT
- **Approval System**: No approval - all Google users allowed
- **Database**: Supabase with RLS policies

### Key Issues to Address
1. ❌ Email approval system blocks legitimate users
2. ❌ No email/password option
3. ❌ No Apple Sign-In
4. ❌ No account deletion
5. ❌ Forced login before browsing
6. ❌ Different auth flows between mobile and web

---

## New Authentication Architecture

### 3-Tier Authentication System

```
┌─────────────────────────────────────────────────────────────┐
│                     Authentication Layer                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Google     │  │    Apple     │  │Email/Password│      │
│  │   Sign-In    │  │   Sign-In    │  │   Sign-In    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Supabase Auth │                        │
│                    │   (Unified)    │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │                                      │             │
│  ┌──────▼───────┐                    ┌────────▼─────┐       │
│  │  Mobile App  │                    │   Web App    │       │
│  │ (React Native)│                    │  (Next.js)   │       │
│  └──────────────┘                    └──────────────┘       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow Types

#### 1. **Guest/Unauthenticated Flow** (New)
- Browse app without login
- View/create customers (stored locally)
- View/create products (stored locally)
- **Blocked**: Cannot create quotes
- **Prompt**: "Sign in to create quotes" when attempting quote creation

#### 2. **Authenticated Flow**
- Full access to all features
- Data synced to Supabase
- Cross-device access
- Quote creation allowed

---

## Database Schema Changes

### New Table: `auth_providers`
Track which auth methods each user has used (for account linking)

```sql
CREATE TABLE auth_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'apple', 'email'
  provider_user_id TEXT, -- Provider's user ID (optional)
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- Index for fast lookups
CREATE INDEX idx_auth_providers_user_id ON auth_providers(user_id);
CREATE INDEX idx_auth_providers_email ON auth_providers(email);
```

### Modified Table: `users` or `user_profiles`
```sql
-- Add new fields to existing user_profiles table
ALTER TABLE user_profiles
  ADD COLUMN auth_method TEXT DEFAULT 'google', -- 'google', 'apple', 'email'
  ADD COLUMN email_verified BOOLEAN DEFAULT false,
  ADD COLUMN apple_user_id TEXT,
  ADD COLUMN deleted_at TIMESTAMPTZ, -- Soft delete for account deletion
  ADD COLUMN deletion_scheduled_at TIMESTAMPTZ; -- Grace period before deletion

-- Add indexes
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_apple_user_id ON user_profiles(apple_user_id) WHERE apple_user_id IS NOT NULL;
```

### New Table: `local_data_cache`
Store guest user data before authentication

```sql
CREATE TABLE local_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL, -- Unique device identifier
  data_type TEXT NOT NULL, -- 'customer', 'product'
  data_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  migrated_at TIMESTAMPTZ, -- When data was migrated to user account

  UNIQUE(device_id, data_type, (data_json->>'id'))
);

CREATE INDEX idx_local_data_cache_device ON local_data_cache(device_id);
```

---

## Implementation Phases

### Phase 1: Database & Backend Setup (3-4 days)
**Priority: HIGH**

#### Task 1.1: Database Schema Updates
- [ ] Create `auth_providers` table
- [ ] Modify `user_profiles` table with new fields
- [ ] Create `local_data_cache` table
- [ ] **Create `account_tiers` table** (integrated with account tier system)
- [ ] Set up RLS policies for new tables
- [ ] Create migration scripts

**Files to create:**
- `migrations/02_auth_system_refactor.sql`
- `migrations/03_account_deletion_support.sql`
- `migrations/04_account_tier_system.sql` (integrated from Account Tier System plan)

**Note**: This phase integrates with the Account Tier System - see `ACCOUNT_TIER_SYSTEM.md` for details

#### Task 1.2: Supabase Auth Configuration
- [ ] Enable Email/Password authentication in Supabase dashboard
- [ ] Configure Apple Sign-In provider in Supabase
- [ ] Set up email templates (verification, password reset)
- [ ] Configure auth callbacks and redirects

**Supabase Dashboard Settings:**
- Authentication > Providers > Enable Email
- Authentication > Providers > Enable Apple (with Apple Developer credentials)
- Authentication > Email Templates > Customize

#### Task 1.3: Account Deletion Functions
- [ ] Create database function for account deletion
- [ ] Implement soft delete (30-day grace period)
- [ ] Create cleanup job for permanent deletion
- [ ] Add data export function (GDPR compliance)

**Files to create:**
- `supabase/functions/delete-account.sql`
- `supabase/functions/export-user-data.sql`

---

### Phase 2: Mobile App Changes (5-7 days)
**Priority: HIGH**

#### Task 2.1: Remove Email Approval System
- [ ] Delete `lib/emailApproval.js`
- [ ] Remove all `isEmailApproved()` checks from `App.js`
- [ ] Remove hardcoded email whitelist
- [ ] Update Supabase RLS policies (remove approval checks)

**Files to modify:**
- `App.js` (remove ~50+ approval check calls)
- `supabase/check_email_approval.sql` (delete)

#### Task 2.2: Implement Apple Sign-In
- [ ] Install `expo-apple-authentication` package
- [ ] Create `lib/appleAuth.js` utility module
- [ ] Add Apple Sign-In button to login screen
- [ ] Handle Apple auth token with Supabase
- [ ] Test on iOS device (Apple Sign-In requires real device)

**New files:**
- `lib/appleAuth.js`

**Modified files:**
- `App.js` (login screen UI)
- `package.json` (add dependency)
- `app.json` (configure Apple auth capabilities)

**Code example:**
```javascript
// lib/appleAuth.js
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabaseClient';

export const signInWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // Sign in with Supabase using Apple ID token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};
```

#### Task 2.3: Implement Email/Password Authentication
- [ ] Create registration screen component
- [ ] Create `lib/emailAuth.js` utility module
- [ ] Add email/password login UI
- [ ] Implement email verification flow
- [ ] Add password reset flow
- [ ] Add validation (password strength, email format)

**New files:**
- `lib/emailAuth.js`
- `components/RegisterScreen.js` (or integrate into login screen)
- `components/PasswordResetScreen.js`

**Modified files:**
- `App.js` (navigation + login UI)

**Code example:**
```javascript
// lib/emailAuth.js
import { supabase } from './supabaseClient';

export const signUpWithEmail = async (email, password, name) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        emailRedirectTo: 'hitquote://auth/callback',
      },
    });

    if (error) throw error;

    // Migrate guest data if user was browsing as guest
    if (data.user) {
      const migrationResult = await migrateLocalDataToSupabase(data.user.id, supabase);
      return { data, error: null, migration: migrationResult };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'hitquote://auth/reset-password',
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};
```

#### Task 2.4: Implement Guest Mode / Unauthenticated Access
- [ ] Allow app to load without authentication
- [ ] Store customer/product data in AsyncStorage (local)
- [ ] Block quote creation with "Sign in required" dialog
- [ ] Create data migration flow (local → Supabase after login)
- [ ] Add persistent "Sign in" button in header/settings
- [ ] Show migration success message after sign-up/sign-in

**Modified files:**
- `App.js` (remove auth requirement, add conditional rendering)
- `lib/localDataManager.js` (new file for local storage)

**UI Flow for Migration:**
```javascript
// In App.js - After user signs up
const handleSignUp = async (email, password, name) => {
  setLoading(true);

  const { data, error, migration } = await signUpWithEmail(email, password, name);

  if (error) {
    Alert.alert('שגיאה', 'לא ניתן להירשם: ' + error.message);
    setLoading(false);
    return;
  }

  // Show migration success if there was guest data
  if (migration && migration.success && (migration.customersCount > 0 || migration.productsCount > 0)) {
    Alert.alert(
      '✅ ברוך הבא!',
      `חשבונך נוצר בהצלחה!\n\n` +
      `${migration.customersCount} לקוחות ו-${migration.productsCount} מוצרים הועברו לחשבון שלך.`,
      [{ text: 'אישור', onPress: () => onLogin(data) }]
    );
  } else {
    // No guest data to migrate
    onLogin(data);
  }

  setLoading(false);
};
```

**Code example:**
```javascript
// lib/localDataManager.js
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveLocalCustomer = async (customer) => {
  const customers = await getLocalCustomers();
  customers.push({ ...customer, _local: true, _id: generateLocalId() });
  await AsyncStorage.setItem('local_customers', JSON.stringify(customers));
};

export const getLocalCustomers = async () => {
  const data = await AsyncStorage.getItem('local_customers');
  return data ? JSON.parse(data) : [];
};

export const migrateLocalDataToSupabase = async (userId, supabase) => {
  try {
    console.log('🔄 Starting data migration from guest to authenticated user...');

    // Get local data
    const customers = await getLocalCustomers();
    const products = await getLocalProducts();

    console.log(`Found ${customers.length} customers and ${products.length} products to migrate`);

    // Skip if no data to migrate
    if (customers.length === 0 && products.length === 0) {
      console.log('✅ No guest data to migrate');
      return { success: true, customersCount: 0, productsCount: 0 };
    }

    let migratedCustomers = 0;
    let migratedProducts = 0;

    // Migrate customers
    for (const customer of customers) {
      const { _local, _id, ...customerData } = customer; // Remove local-only fields

      const { error } = await supabase.from('customer').insert({
        ...customerData,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to migrate customer:', error);
        // Continue with other customers even if one fails
      } else {
        migratedCustomers++;
      }
    }

    // Migrate products
    for (const product of products) {
      const { _local, _id, ...productData } = product; // Remove local-only fields

      const { error } = await supabase.from('product').insert({
        ...productData,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Failed to migrate product:', error);
      } else {
        migratedProducts++;
      }
    }

    // Clear local storage only after successful migration
    if (migratedCustomers === customers.length && migratedProducts === products.length) {
      await AsyncStorage.multiRemove(['local_customers', 'local_products']);
      console.log(`✅ Migration complete: ${migratedCustomers} customers, ${migratedProducts} products`);
      return { success: true, customersCount: migratedCustomers, productsCount: migratedProducts };
    } else {
      console.log(`⚠️ Partial migration: ${migratedCustomers}/${customers.length} customers, ${migratedProducts}/${products.length} products`);
      return { success: false, customersCount: migratedCustomers, productsCount: migratedProducts };
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    return { success: false, error: error.message };
  }
};
```

#### Task 2.5: Implement Account Deletion
- [ ] Add "Delete Account" button in Settings > Profile tab
- [ ] Create confirmation dialog (multiple steps to prevent accidents)
- [ ] Implement delete account API call
- [ ] Show 30-day grace period information
- [ ] Add data export option before deletion

**Modified files:**
- `App.js` (Settings screen)

**Code example:**
```javascript
const handleDeleteAccount = async () => {
  Alert.alert(
    'מחיקת חשבון',
    'האם אתה בטוח? פעולה זו תמחק את כל הנתונים שלך תוך 30 יום.',
    [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'ייצוא נתונים',
        onPress: async () => {
          // Export user data first
          await exportUserData();
          // Then show delete confirmation again
          confirmDelete();
        },
      },
      {
        text: 'מחק חשבון',
        style: 'destructive',
        onPress: confirmDelete,
      },
    ]
  );
};

const confirmDelete = () => {
  Alert.alert(
    'אישור אחרון',
    'זוהי הזדמנותך האחרונה. האם למחוק?',
    [
      { text: 'לא, חזור', style: 'cancel' },
      {
        text: 'כן, מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.rpc('delete_user_account');
            if (error) throw error;
            Alert.alert('חשבון נמחק', 'החשבון שלך יימחק תוך 30 יום');
            await signOut();
          } catch (error) {
            Alert.alert('שגיאה', 'לא ניתן למחוק חשבון');
          }
        },
      },
    ]
  );
};
```

---

### Phase 3: Web App Changes (4-5 days)
**Priority: HIGH**

#### Task 3.1: Replace NextAuth with Supabase Auth
- [ ] Remove NextAuth dependency
- [ ] Install `@supabase/ssr` for Next.js
- [ ] Create Supabase auth utilities for Next.js
- [ ] Update all session checks to use Supabase
- [ ] Migrate existing Google users to Supabase auth

**Files to delete:**
- `app/api/auth/[...nextauth]/route.js`

**New files:**
- `lib/supabaseAuth.js` (auth utilities)
- `middleware.js` (auth middleware)
- `app/api/auth/callback/route.js` (Supabase callback)

**Modified files:**
- `package.json` (remove next-auth, add @supabase/ssr)
- All pages with `getSession()` calls

**Code example:**
```javascript
// lib/supabaseAuth.js
import { createServerClient } from '@supabase/ssr';

export const createClient = (cookies) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookies().get(name)?.value;
        },
      },
    }
  );
};

// middleware.js
import { createMiddlewareClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Protect routes that require auth
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  return res;
}
```

#### Task 3.2: Implement Apple Sign-In (Web)
- [ ] Add Apple Sign-In button to login page
- [ ] Configure Apple OAuth in Supabase dashboard
- [ ] Handle Apple auth callback
- [ ] Test Apple Sign-In flow on web

**Modified files:**
- `app/auth/signin/page.js`
- `app/page.js` (home/landing)

#### Task 3.3: Implement Email/Password Auth (Web)
- [ ] Add email/password login form
- [ ] Add registration form
- [ ] Add password reset flow
- [ ] Add email verification page
- [ ] Match mobile app UI/UX

**New files:**
- `app/auth/register/page.js`
- `app/auth/reset-password/page.js`
- `app/auth/verify-email/page.js`

#### Task 3.4: Remove Email Approval System (Web)
- [ ] Remove any approval checks from API routes
- [ ] Update RLS policies in Supabase
- [ ] Allow all authenticated users

**Files to check:**
- `app/api/**/*.js` (all API routes)

#### Task 3.5: Implement Account Deletion (Web)
- [ ] Add "Delete Account" section in Settings page
- [ ] Create account deletion API route
- [ ] Match mobile app flow (confirmation + grace period)
- [ ] Add data export functionality

**Modified files:**
- `app/settings/page.js`

**New files:**
- `app/api/account/delete/route.js`
- `app/api/account/export/route.js`

#### Task 3.6: Allow Guest Browsing (Optional for Web)
- [ ] Remove forced redirect to login
- [ ] Show limited features without auth
- [ ] Prompt to sign in when creating quotes

**Modified files:**
- `app/page.js` (landing page)
- `middleware.js` (auth checks)

---

### Phase 4: Testing & Quality Assurance (3-4 days)
**Priority: CRITICAL**

#### Task 4.1: Unit Tests
- [ ] Test Google Sign-In flow (mobile + web)
- [ ] Test Apple Sign-In flow (mobile + web)
- [ ] Test Email/Password registration flow
- [ ] Test Email/Password login flow
- [ ] Test password reset flow
- [ ] Test account deletion flow
- [ ] Test guest mode data migration

#### Task 4.2: Integration Tests
- [ ] Test cross-platform auth sync
- [ ] Test account linking (same email, different providers)
- [ ] Test RLS policies with new auth system
- [ ] Test quote creation with different auth methods
- [ ] Test data migration from local to Supabase

#### Task 4.3: E2E Tests
- [ ] User signs up with email → creates quote → views on web
- [ ] User signs in with Google on mobile → signs in on web with same Google account
- [ ] User signs in with Apple → data syncs across devices
- [ ] Guest user creates customers → signs in → data migrates
- [ ] User deletes account → data removed after 30 days

#### Task 4.4: Apple App Store Compliance Testing
- [ ] ✅ Can browse customers/products without login
- [ ] ✅ Can create customers/products without login (local only)
- [ ] ✅ Prompted to sign in when creating quote
- [ ] ✅ Sign in with Apple button present
- [ ] ✅ Email/Password option available
- [ ] ✅ Can delete account from Settings
- [ ] ✅ Account deletion completes within 30 days

---

## UI/UX Design

### Mobile App - New Login Screen

```
┌─────────────────────────────────────┐
│                                     │
│          [HitQuote Logo]            │
│                                     │
│         מערכת הצעות מחיר             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐    │
│   │   🍎 Sign in with Apple   │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │   🔵 Sign in with Google  │    │
│   └───────────────────────────┘    │
│                                     │
│   ────────── או ──────────         │
│                                     │
│   ┌───────────────────────────┐    │
│   │  📧 Email                  │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │  🔒 Password               │    │
│   └───────────────────────────┘    │
│                                     │
│   ┌───────────────────────────┐    │
│   │      התחבר/י              │    │
│   └───────────────────────────┘    │
│                                     │
│       אין לך חשבון? הרשם/י         │
│                                     │
│   ────────────────────────────     │
│                                     │
│       המשך ללא התחברות             │
│                                     │
└─────────────────────────────────────┘
```

### Settings - Account Deletion Section

```
┌─────────────────────────────────────┐
│         ⚙️ הגדרות                    │
├─────────────────────────────────────┤
│                                     │
│  👤 פרופיל                          │
│  🏢 עסק                             │
│  🔔 התראות                          │
│  🌙 מצב לילה                        │
│  ❓ עזרה                             │
│                                     │
│  ────────────────────────────       │
│                                     │
│  🚨 אזור מסוכן                      │
│                                     │
│  ┌───────────────────────────┐     │
│  │  🗑️ מחק חשבון             │     │
│  │                            │     │
│  │  פעולה זו תמחק לצמיתות את  │     │
│  │  כל הנתונים שלך תוך 30 יום │     │
│  │                            │     │
│  │  ניתן לייצא נתונים לפני    │     │
│  │  המחיקה                    │     │
│  │                            │     │
│  │  [מחק חשבון]  [ייצוא נתונים]│     │
│  └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

---

## Migration Strategy

### For Existing Users

**Current Users**:
- `tal.gurevich@gmail.com` (admin/owner)
- `moran.marmus@gmail.com` (user)

**Priority**: Zero data loss, zero disruption for these users

#### Phase 0: Pre-Migration Preparation (CRITICAL)

1. **Complete data backup** (before any changes):
   ```sql
   -- Backup all user data
   CREATE TABLE backup_complete_migration_$(date +%Y%m%d) AS
   SELECT * FROM user_profiles WHERE email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');

   -- Backup all their business data
   CREATE TABLE backup_tal_data AS
   SELECT p.*, 'proposal' as table_name FROM proposal p WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')
   UNION ALL
   SELECT c.*, 'customer' FROM customer c WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com')
   UNION ALL
   SELECT pr.*, 'product' FROM product pr WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com');

   -- Same for Moran
   CREATE TABLE backup_moran_data AS
   SELECT p.*, 'proposal' as table_name FROM proposal p WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')
   UNION ALL
   SELECT c.*, 'customer' FROM customer c WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com')
   UNION ALL
   SELECT pr.*, 'product' FROM product pr WHERE user_id IN (SELECT id FROM user_profiles WHERE email = 'moran.marmus@gmail.com');
   ```

2. **Document current user IDs**:
   ```sql
   -- Record existing user IDs before migration
   SELECT id, email, auth_user_id, created_at
   FROM user_profiles
   WHERE email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');
   ```

#### Web App Users (NextAuth → Supabase Auth)

**Strategy**: Seamless migration with Google ID preservation

1. **Pre-migration**: Backup all users and sessions (see Phase 0)

2. **Create Supabase auth users** matching existing Google accounts:
   ```sql
   -- IMPORTANT: Use exact Google user IDs from NextAuth sessions
   -- This ensures continuity when they sign in with Google via Supabase

   -- For Tal
   INSERT INTO auth.users (
     id, -- Use existing Google ID from NextAuth
     email,
     email_confirmed_at,
     created_at,
     raw_user_meta_data
   )
   VALUES (
     (SELECT auth_user_id FROM user_profiles WHERE email = 'tal.gurevich@gmail.com'),
     'tal.gurevich@gmail.com',
     NOW(),
     (SELECT created_at FROM user_profiles WHERE email = 'tal.gurevich@gmail.com'),
     '{"provider": "google", "migrated_from_nextauth": true}'::jsonb
   );

   -- For Moran
   INSERT INTO auth.users (
     id,
     email,
     email_confirmed_at,
     created_at,
     raw_user_meta_data
   )
   VALUES (
     (SELECT auth_user_id FROM user_profiles WHERE email = 'moran.marmus@gmail.com'),
     'moran.marmus@gmail.com',
     NOW(),
     (SELECT created_at FROM user_profiles WHERE email = 'moran.marmus@gmail.com'),
     '{"provider": "google", "migrated_from_nextauth": true}'::jsonb
   );
   ```

3. **Verify data linkage** (NO changes to foreign keys needed):
   ```sql
   -- Confirm all data is still linked correctly
   SELECT
     up.email,
     COUNT(DISTINCT p.id) as proposals,
     COUNT(DISTINCT c.id) as customers,
     COUNT(DISTINCT pr.id) as products
   FROM user_profiles up
   LEFT JOIN proposal p ON p.user_id = up.id
   LEFT JOIN customer c ON c.user_id = up.id
   LEFT JOIN product pr ON pr.user_id = up.id
   WHERE up.email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com')
   GROUP BY up.email;

   -- Should show same counts as before migration
   ```

4. **Test authentication** in staging:
   - Tal signs in with Google → should see all existing data
   - Moran signs in with Google → should see all existing data
   - Verify no data missing in dashboard, quotes, customers, products

5. **Enable Google provider in Supabase** with same OAuth credentials as NextAuth

6. **Deploy new web app** with Supabase auth

7. **First login**: Users will be prompted to sign in with Google again (seamless, same Google account)

8. **Assign account tiers** (integrated with Account Tier System):
   ```sql
   -- Grant premium tier to existing users (100 quotes/month)
   INSERT INTO account_tiers (auth_user_id, tier, monthly_quote_limit, is_active, payment_provider)
   SELECT
     up.auth_user_id,
     'premium' as tier,
     100 as monthly_quote_limit,
     true as is_active,
     'manual' as payment_provider
   FROM user_profiles up
   WHERE up.email IN ('tal.gurevich@gmail.com', 'moran.marmus@gmail.com');
   ```

#### Mobile App Users (Google Only → Multi-provider)

**Strategy**: Zero changes required for existing mobile users

1. **No migration needed** - mobile already uses Supabase auth indirectly
2. **Existing Google Sign-In continues working** exactly as before
3. **User sessions remain valid** - no forced logout
4. **New options appear** (Apple Sign-In, Email/Password) but existing flow unchanged

#### Data Integrity Verification (Post-Migration Checklist)

After migration, verify for EACH existing user:

**For Tal (tal.gurevich@gmail.com):**
- [ ] Can sign in with Google on web
- [ ] Can sign in with Google on mobile
- [ ] All quotes visible and correct
- [ ] All customers visible and correct
- [ ] All products visible and correct
- [ ] Business settings preserved
- [ ] Can create new quotes
- [ ] Can edit existing quotes
- [ ] PDF generation works
- [ ] **Account tier shows "Premium" (100 quotes/month)**
- [ ] **Quota counter shows correct usage**

**For Moran (moran.marmus@gmail.com):**
- [ ] Can sign in with Google on web
- [ ] Can sign in with Google on mobile
- [ ] All quotes visible and correct
- [ ] All customers visible and correct
- [ ] All products visible and correct
- [ ] Business settings preserved
- [ ] Can create new quotes
- [ ] Can edit existing quotes
- [ ] PDF generation works
- [ ] **Account tier shows "Premium" (100 quotes/month)**
- [ ] **Quota counter shows correct usage**

#### Rollback for Existing Users (If Issues Occur)

If existing users lose data or cannot sign in:

1. **Immediate**: Restore from backup tables created in Phase 0
2. **Re-enable NextAuth** on web temporarily
3. **Keep mobile app working** with old auth flow
4. **Investigate issue** before re-attempting migration
5. **Personal notification** to Tal and Moran about any disruption

---

## Rollback Plan

### If Issues Arise During Migration

#### Immediate Fix (Stop the Bleeding)
1. **Revert to previous app version** on App Store
2. **Keep database changes** (forward-compatible)
3. **Re-enable NextAuth** on web (temporary)

#### Partial Rollback (Auth Provider Issues)
1. **Disable specific auth provider** (Apple/Email) if broken
2. **Keep Google Sign-In working** as fallback
3. **Fix issues** in staging environment
4. **Re-enable** after testing

#### Full Rollback (Nuclear Option)
1. Restore database backup
2. Deploy previous app version
3. Revert all code changes
4. Re-plan migration strategy

---

## Timeline Summary

| Phase | Duration | Dependencies | Risk Level |
|-------|----------|--------------|------------|
| Phase 1: Database Setup | 3-4 days | None | Low |
| Phase 2: Mobile App | 5-7 days | Phase 1 complete | Medium |
| Phase 3: Web App | 4-5 days | Phase 1 complete | Medium |
| Phase 4: Testing & QA | 3-4 days | Phases 2-3 complete | High |

**Total estimated time**: 15-20 days (3-4 weeks)

**Critical Path**: Phase 1 → Phase 2 → Apple Review Submission

---

## Success Criteria

### Apple App Store Approval
- [ ] App allows browsing without login
- [ ] Sign in with Apple is available and working
- [ ] Email/Password authentication is available
- [ ] Account deletion works from Settings

### Technical Success
- [ ] 99.9% auth success rate
- [ ] < 200ms auth response time
- [ ] Zero data loss during migration
- [ ] All existing users migrated successfully
- [ ] Cross-platform auth sync working

### User Experience Success
- [ ] < 5% user complaints about auth changes
- [ ] > 80% users re-authenticate successfully
- [ ] < 3 steps to sign up/login
- [ ] Clear error messages for auth failures

---

## Security Considerations

### Authentication Security
- [ ] Implement rate limiting on auth endpoints (prevent brute force)
- [ ] Use bcrypt/Argon2 for password hashing (Supabase default)
- [ ] Enforce minimum password strength (8+ chars, mixed case, numbers)
- [ ] Enable 2FA support (future enhancement)
- [ ] Implement session timeout (30 days default, configurable)

### Account Deletion Security
- [ ] Require re-authentication before deletion
- [ ] Implement 30-day grace period (soft delete)
- [ ] Send email notification when deletion scheduled
- [ ] Allow cancellation of deletion within grace period
- [ ] Permanently delete all user data after grace period

### Data Privacy (GDPR Compliance)
- [ ] Allow users to export all their data
- [ ] Delete all PII after account deletion
- [ ] Anonymize analytics data (keep aggregated stats only)
- [ ] Provide clear privacy policy
- [ ] Log all data access for audit trail

---

## Dependencies & Prerequisites

### Accounts & Services Needed
1. **Apple Developer Account** (for Apple Sign-In)
   - Enrolled in Apple Developer Program ($99/year)
   - App ID with Sign in with Apple capability
   - Service ID for web authentication
   - Private key for Apple auth

2. **Supabase Project**
   - Existing project can be used
   - Enable Email auth provider
   - Configure Apple auth provider
   - Set up email templates

3. **Email Service** (for verification emails)
   - Use Supabase's built-in SMTP (default)
   - OR configure custom SMTP (SendGrid, Postmark, etc.)

### Development Environment
- [ ] Xcode (for iOS testing)
- [ ] Physical iOS device (for Apple Sign-In testing)
- [ ] Expo EAS Build configured
- [ ] Node.js 18+ for web app
- [ ] Supabase CLI installed

---

## Questions to Resolve

### Product Decisions
1. **Guest data persistence**: How long to keep local data before prompting sign-in?
2. **Account linking**: Auto-link accounts with same email across providers?
3. **Email verification**: Require email verification before full access?
4. **Password policy**: Minimum password requirements?
5. **Session duration**: How long should sessions last (mobile vs web)?

### Technical Decisions
6. **Migration timing**: Migrate existing users all at once or gradually?
7. **Downtime**: Acceptable downtime for migration (if any)?
8. **Database backup**: Frequency and retention of backups during migration?
9. **Error handling**: How to handle partial migration failures?
10. **Monitoring**: What metrics to track for auth system health?

### Business Decisions
11. **User communication**: When to notify users about auth changes?
12. **Support**: Extra support staff needed during migration?
13. **App Store**: Submit update immediately or wait for more features?

---

## Post-Launch Monitoring

### Metrics to Track
- Auth success rate by provider (Google/Apple/Email)
- Auth failure rate and error types
- Time to authenticate (latency)
- User churn after auth changes
- Account deletion rate
- Data migration success rate

### Alerts to Configure
- Auth error rate > 5%
- Auth latency > 500ms
- Account deletion spike (> 10% of users in 24h)
- Database migration failures

---

## Future Enhancements (Post-MVP)

### v2.0 Features
- Two-factor authentication (2FA)
- Biometric authentication (Face ID, Touch ID)
- Social login (Facebook, Microsoft)
- SSO for enterprise customers
- Account recovery via phone number

### v3.0 Features
- Passwordless authentication (magic links)
- OAuth API for third-party integrations
- User session management (view/revoke active sessions)
- Account linking UI (manage connected providers)

---

## Resources & Documentation

### Apple Documentation
- [Sign in with Apple](https://developer.apple.com/sign-in-with-apple/)
- [App Store Review Guidelines 5.1.1](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Account Deletion Requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app)

### Supabase Documentation
- [Auth Overview](https://supabase.com/docs/guides/auth)
- [Apple Sign-In](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Email Auth](https://supabase.com/docs/guides/auth/auth-email)
- [Next.js SSR](https://supabase.com/docs/guides/auth/server-side-rendering)

### Expo Documentation
- [expo-apple-authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/)

---

## Approval & Sign-off

- [ ] Product Owner reviewed and approved
- [ ] Engineering Lead reviewed technical approach
- [ ] Security team reviewed authentication changes
- [ ] Legal reviewed account deletion compliance
- [ ] UX Designer approved UI/UX changes
- [ ] QA Lead reviewed testing plan

---

**Document Status**: ✅ Ready for Review
**Next Steps**: Schedule kick-off meeting, assign tasks, set deadlines
