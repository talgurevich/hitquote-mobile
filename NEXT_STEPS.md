# Next Steps - Authentication System Implementation

## ✅ What's Been Done

All authentication infrastructure has been implemented:

1. **✅ New auth service** (`lib/auth.js`) with Apple, Google, Email, Guest mode
2. **✅ AuthContext** (`contexts/AuthContext.js`) for state management
3. **✅ Local storage** (`lib/localStorage.js`) for guest mode
4. **✅ Data migration** (`lib/dataMigration.js`) for guest → authenticated
5. **✅ New login screen** (`screens/NewLoginScreen.js`) with all auth options
6. **✅ Account deletion screen** (`screens/AccountDeletionScreen.js`)
7. **✅ App.js updated** to use AuthProvider and new navigation
8. **✅ Settings updated** with logout and delete account buttons
9. **✅ Edge Function** created for account deletion (`supabase/functions/delete-user/`)
10. **✅ SQL migration** created for user_profile trigger (`migrations/create_user_profile_trigger.sql`)

## 🚀 What You Need to Do Now

### Step 1: Run SQL Migration in Supabase

Run the SQL file `/Users/talgurevich/Documents/hitquote-mobile/migrations/create_user_profile_trigger.sql` in your Supabase SQL Editor:

```bash
# Or you can run it directly:
open /Users/talgurevich/Documents/hitquote-mobile/migrations/create_user_profile_trigger.sql
```

Copy the contents and paste into: **Supabase Dashboard > SQL Editor > New Query**

This will create the trigger that automatically creates user_profiles when someone signs up.

### Step 2: Deploy Supabase Edge Function

Deploy the account deletion function:

```bash
cd /Users/talgurevich/Documents/hitquote-mobile

# Install Supabase CLI if you haven't
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref exfzzadoqlumijmvgwch

# Deploy the delete-user function
supabase functions deploy delete-user
```

### Step 3: Rebuild the App

Since we added native modules (Apple Auth), you must rebuild:

```bash
# For iOS Simulator
npx expo prebuild --clean
npx expo run:ios

# Or for device via EAS Build
eas build --platform ios --profile development
```

### Step 4: Test All Auth Flows

**Test each flow:**

1. **Guest Mode**:
   - Open app → Click "המשך כאורח"
   - Try to create a customer/product
   - Should save to AsyncStorage (local only)

2. **Apple Sign-In** (iOS device/simulator):
   - Click Apple button
   - Should create account and auto-assign Free tier
   - If you were in guest mode, data should migrate

3. **Google Sign-In**:
   - Click Google button
   - Should work via Supabase Auth (not old custom auth)
   - Should create account and auto-assign Free tier

4. **Email Sign-Up**:
   - Click Email button → Fill form → Sign up
   - Check your email for verification link
   - After verification, sign in
   - Should create account and auto-assign Free tier

5. **Logout**:
   - Go to Settings → Profile tab → התנתק
   - Should return to login screen

6. **Account Deletion**:
   - Go to Settings → Profile tab → מחק חשבון
   - Follow prompts
   - All data should be deleted
   - Should return to login screen

### Step 5: Test Quota Enforcement

This is critical but NOT yet implemented in the UI. You need to add quota checks before creating proposals:

**Add this to CreateQuoteScreen (around line 2145):**

```javascript
import { useAuth } from '../contexts/AuthContext';

function CreateQuoteScreen({ navigation, session, route }) {
  const { checkQuota, isGuest } = useAuth();

  // ... existing code ...

  const handleCreateProposal = async () => {
    // Check quota before creating
    if (!isGuest) {
      const quota = await checkQuota();

      if (!quota.can_create_quote) {
        Alert.alert(
          'הגעת למכסת ההצעות',
          `השתמשת ב-${quota.current_count} מתוך ${quota.monthly_limit} הצעות החודש. לשדרוג לתוכנית Premium, בקר באתר hitquote.online`,
          [{ text: 'הבנתי' }]
        );
        return;
      }
    }

    // ... rest of create logic ...
  };
}
```

### Step 6: Update Data Fetching for Guest Mode (Optional but Recommended)

For a complete guest mode experience, update data fetching in:
- `CustomersScreen` (line ~5226)
- `CatalogScreen` (line ~1789)
- `QuotesScreen` (line ~933)

Example for CustomersScreen:

```javascript
import { useAuth } from '../contexts/AuthContext';
import { getLocalCustomers, saveLocalCustomer } from '../lib/localStorage';

function CustomersScreen({ session, navigation: navProp, route }) {
  const { isGuest, userProfile } = useAuth();

  const fetchCustomers = async () => {
    if (isGuest) {
      // Guest mode - use local storage
      const localCustomers = await getLocalCustomers();
      setCustomers(localCustomers);
    } else {
      // Authenticated - use Supabase
      const { data } = await supabase
        .from('customer')
        .select('*')
        .eq('user_id', userProfile.id);
      setCustomers(data);
    }
  };

  // Similar for save, update, delete operations
}
```

## 📋 Testing Checklist

- [ ] SQL trigger is deployed and working
- [ ] Edge function is deployed and working
- [ ] App rebuilds successfully with Apple Auth
- [ ] Guest mode works (can create local data)
- [ ] Apple Sign-In works
- [ ] Google Sign-In works (via Supabase, not old auth)
- [ ] Email sign-up works
- [ ] Guest data migrates to Supabase on signup
- [ ] Free tier is auto-assigned to new users (10 quotes/month)
- [ ] Tal & Moran have Premium tier (100 quotes/month)
- [ ] Quota enforcement blocks 11th quote for free users
- [ ] Logout works
- [ ] Account deletion works (all data removed)
- [ ] Settings screen shows delete account button
- [ ] Error messages are in Hebrew and user-friendly

## 🎯 Key Differences from Old System

| Feature | Old System | New System |
|---------|------------|------------|
| Login | Google only (mock sessions) | Apple + Google + Email + Guest |
| Sessions | Custom mock sessions | Real Supabase Auth sessions |
| Approval Check | Manual email approval | No approval needed (removed) |
| Demo Mode | Separate demo account | Guest mode (better UX) |
| Account Deletion | Not available | Full account deletion |
| Quota | Not enforced | Database-level enforcement |
| Guest Mode | Not available | Full local storage support |

## ⚠️ Important Notes

1. **The old LoginScreen and UnauthorizedScreen are still in App.js but are NOT used**. They can be removed later for cleanup.

2. **Email approval system is bypassed** - the new system uses Supabase Auth which handles all verification. The old `isEmailApproved` check is no longer used.

3. **Demo user (applereview@demo.com) still works** via the old system, but new Apple reviewers should use Guest mode instead.

4. **Quota enforcement happens at DATABASE level** via the trigger on the `proposal` table. The UI just needs to check and display friendly messages.

5. **Apple Sign-In only works on iOS devices and simulators**, not on Android or web.

## 🐛 If Something Goes Wrong

### "Can't find variable: useAuth"
- Make sure App.js imports are correct (line 21-23)
- Make sure AuthProvider wraps AppContent (line 6083)

### "Apple button doesn't show"
- Check Platform.OS === 'ios'
- Rebuild app with `npx expo prebuild --clean`

### "Google Sign-In fails with OAuth error"
- Go to Supabase Dashboard > Authentication > Providers
- Enable Google provider
- Add redirect URL: `https://exfzzadoqlumijmvgwch.supabase.co/auth/v1/callback`

### "Quota not enforced"
- Check trigger is installed: `SELECT * FROM pg_trigger WHERE tgname = 'check_quota_before_proposal_insert';`
- Check user has account_tiers entry
- Check user_profile.supabase_auth_id is linked

### "Guest data doesn't migrate"
- Check AsyncStorage has data before signup
- Check console logs during migration
- Check user_profile was created (trigger)

## 📚 Documentation

- Full implementation details: `/Users/talgurevich/Documents/hitquote-mobile/AUTH_IMPLEMENTATION_GUIDE.md`
- Account tier requirements: `/Users/talgurevich/Documents/hitquote-mobile/ACCOUNT_TIER_SYSTEM.md`
- Auth refactor plan: `/Users/talgurevich/Documents/hitquote-mobile/AUTHENTICATION_REFACTOR_PLAN.md`

## 🎉 When Everything is Working

You'll have:
- ✅ Apple App Store compliance (Apple Sign-In, account deletion, guest mode)
- ✅ Multiple sign-in options for users
- ✅ Quota enforcement (10 quotes/month for free, 100 for premium)
- ✅ Guest mode for users who don't want to sign up yet
- ✅ Automatic data migration from guest to authenticated
- ✅ Premium tier for you and Moran
- ✅ Ready to submit to App Store!

Good luck! 🚀
