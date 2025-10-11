# Authentication System Implementation Guide

## ✅ What's Been Created

### 1. Core Authentication Files

- **`lib/auth.js`** - Main auth service with all sign-in methods
  - Apple Sign-In
  - Google Sign-In (via Supabase Auth)
  - Email/Password Sign-Up
  - Email/Password Sign-In
  - Sign Out
  - Delete Account
  - Continue as Guest

- **`lib/localStorage.js`** - Guest mode local data management
  - Local customer storage
  - Local product storage
  - Guest mode flag management

- **`lib/dataMigration.js`** - Migrate local data to Supabase on signup
  - Migrates customers and products from AsyncStorage to Supabase
  - Clears local data after successful migration

- **`contexts/AuthContext.js`** - React Context for auth state
  - User session management
  - Auto-loads user profile and account tier
  - Provides `checkQuota()` function
  - Guest mode tracking

### 2. UI Screens

- **`screens/NewLoginScreen.js`** - Complete new login screen with:
  - Apple Sign-In button (iOS only)
  - Google Sign-In button
  - Email/Password form (sign up & sign in)
  - Guest mode option
  - Privacy & Terms links

- **`screens/AccountDeletionScreen.js`** - Account deletion screen
  - Warning messages
  - Confirmation checkbox
  - Deletes all user data
  - Complies with App Store requirements

### 3. Configuration

- **`app.json`** - Updated with `expo-apple-authentication` plugin
- **`package.json`** - Added `expo-apple-authentication` dependency

## 🔧 What You Need to Do Next

### Step 1: Create Supabase Edge Function for Account Deletion

The `deleteAccount()` function calls a Supabase Edge Function to delete the auth user. You need to create this function:

1. Go to Supabase Dashboard > Edge Functions
2. Create new function named `delete-user`
3. Use this code:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId } = await req.json()

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

4. Deploy the function

### Step 2: Create user_profiles Trigger

When a new user signs up via Supabase Auth, we need to automatically create their user_profile. Run this SQL in Supabase:

```sql
CREATE OR REPLACE FUNCTION create_user_profile_for_new_auth_user()
RETURNS TRIGGER AS $FUNC$
BEGIN
  INSERT INTO user_profiles (supabase_auth_id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (supabase_auth_id) DO NOTHING;

  RETURN NEW;
END;
$FUNC$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_profile_on_auth_signup ON auth.users;

CREATE TRIGGER create_profile_on_auth_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_for_new_auth_user();
```

### Step 3: Update App.js to Use New Auth System

You need to:

1. **Wrap your app with AuthProvider**:
```javascript
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      {/* Your existing app structure */}
    </AuthProvider>
  );
}
```

2. **Replace the old LoginScreen with NewLoginScreen**:
```javascript
import NewLoginScreen from './screens/NewLoginScreen';

// In your navigator:
<Stack.Screen name="Login" component={NewLoginScreen} />
```

3. **Use the AuthContext to manage navigation**:
```javascript
import { useAuth } from './contexts/AuthContext';

function AppNavigator() {
  const { user, isGuest, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user || isGuest ? (
        <MainTabNavigator /> // Your main app
      ) : (
        <Stack.Navigator>
          <Stack.Screen name="Login" component={NewLoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
```

4. **Add Account Deletion to Settings/Profile Screen**:
```javascript
import AccountDeletionScreen from './screens/AccountDeletionScreen';

// In your settings/profile navigator:
<Stack.Screen
  name="DeleteAccount"
  component={AccountDeletionScreen}
  options={{ title: 'מחיקת חשבון' }}
/>
```

### Step 4: Update Data Fetching Logic

For guest mode to work, you need to update all data fetching to check if user is in guest mode and use local storage instead:

```javascript
import { useAuth } from './contexts/AuthContext';
import { getLocalCustomers, saveLocalCustomer } from './lib/localStorage';

function CustomersScreen() {
  const { isGuest, userProfile } = useAuth();

  const fetchCustomers = async () => {
    if (isGuest) {
      return await getLocalCustomers();
    } else {
      const { data } = await supabase
        .from('customer')
        .select('*')
        .eq('user_id', userProfile.id);
      return data;
    }
  };

  // Similar for products and proposals
}
```

### Step 5: Add Quota Enforcement UI

Before creating a new proposal, check quota:

```javascript
import { useAuth } from './contexts/AuthContext';

function NewProposalScreen() {
  const { checkQuota, isGuest } = useAuth();

  const handleCreateProposal = async () => {
    if (!isGuest) {
      const quota = await checkQuota();

      if (!quota.can_create_quote) {
        Alert.alert(
          'הגעת למכסת ההצעות',
          `השתמשת ב-${quota.current_count} מתוך ${quota.monthly_limit} הצעות החודש. לשדרוג פנה לאתר hitquote.online`,
          [{ text: 'הבנתי' }]
        );
        return;
      }
    }

    // Proceed with creating proposal
    // For guests, proposals won't be saved to Supabase
  };
}
```

### Step 6: Rebuild the App

Since we added native modules (Apple Auth), you need to rebuild:

```bash
# For iOS
npx expo prebuild --clean
npx expo run:ios

# Or if using EAS Build
eas build --platform ios
```

### Step 7: Test the Flow

1. **Guest Mode**:
   - Click "המשך כאורח"
   - Create customers and products
   - They should save to AsyncStorage
   - Sign up with email/Apple/Google
   - Data should migrate to Supabase

2. **Apple Sign-In** (iOS only):
   - Click Apple button
   - Should create auth.users entry
   - Should create user_profile automatically
   - Should create free tier automatically

3. **Google Sign-In**:
   - Click Google button
   - Should work via Supabase Auth (not old custom auth)

4. **Email Sign-Up**:
   - Fill in email, password, name
   - Should receive verification email
   - After verification, can sign in

5. **Quota Enforcement**:
   - Create 10 proposals as free user
   - 11th should be blocked with error message
   - Tal & Moran (premium) should get 100/month

6. **Account Deletion**:
   - Go to settings
   - Click "מחיקת חשבון"
   - Confirm
   - All data should be deleted
   - Should be signed out

## 📝 Migration Notes

### For Existing Users (Tal & Moran)

You already have auth.users entries and premium tier assigned. When you:
1. Uninstall old app
2. Install new app
3. Sign in with Google/Apple

The system will:
- Recognize your existing account
- Load your premium tier (100 quotes/month)
- Load all your existing data

### For Other Existing Users

The 2 other users (Yaron & applereview) will need to:
1. Sign up as new users
2. Or you can manually create auth.users entries for them like you did for Tal & Moran

## 🎯 Key Differences from Old System

| Old System | New System |
|------------|------------|
| Custom Google auth with mock sessions | Real Supabase Auth sessions |
| No guest mode | Full guest mode with local storage |
| No Apple Sign-In | Apple Sign-In required for App Store |
| No email/password | Email/password signup |
| No account deletion | Account deletion feature |
| No quota enforcement | Database-level quota enforcement |
| Demo mode (removed) | Guest mode (better UX) |

## ⚠️ Important Security Notes

1. The old `lib/googleAuth.js` created mock sessions - this is now replaced with real Supabase sessions
2. Remove or deprecate the old `UnauthorizedScreen` - no longer needed
3. Remove demo mode logic - replaced by guest mode
4. All quota checks happen at database level via triggers - can't be bypassed

## 🐛 Troubleshooting

### "Apple Sign-In button doesn't show"
- Only works on iOS devices/simulators
- Check that app.json includes expo-apple-authentication plugin
- Rebuild the app after adding the plugin

### "Google Sign-In fails"
- Make sure Google OAuth is enabled in Supabase Dashboard
- Check redirect URLs are configured correctly

### "Guest data doesn't migrate"
- Check that user_profile was created (trigger)
- Check AsyncStorage has data before signup
- Check migration logs in console

### "Quota not enforced"
- Verify trigger is installed on proposal table
- Check user has account_tiers entry
- Check user_profile.supabase_auth_id is set correctly

## 📚 Next Steps After Implementation

1. Test all auth flows thoroughly
2. Update your web app to use same Supabase Auth
3. Build admin panel for tier management (web only)
4. Set up email templates in Supabase for verification emails
5. Configure password reset flow
6. Add analytics to track sign-up conversion rates
7. Monitor quota usage and upgrade patterns
