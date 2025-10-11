# Apple Authentication Testing Guide

## What to Expect After Build Completes

When the iOS app launches, you should see the new login screen with **4 options**:

1. **🍎 התחבר עם Apple** - Black button at the top (iOS only)
2. **התחבר עם Google** - White button with Google logo
3. **📧 התחבר עם דוא״ל** - Blue button
4. **המשך כאורח** - Transparent button at the bottom

## Testing Apple Sign-In

### Step 1: Click the Apple Button
- Tap the black "🍎 התחבר עם Apple" button
- iOS will show the native Apple Sign-In sheet

### Step 2: Sign In
On a real device:
- Use your actual Apple ID
- Choose to share your email or hide it

On Simulator:
- Go to Settings → Sign in to your iPhone
- Sign in with any Apple ID
- Then try the Apple button in the app

### Step 3: What Should Happen
1. ✅ Apple authentication sheet appears
2. ✅ You authorize the app
3. ✅ App receives identity token
4. ✅ Supabase creates auth.users entry
5. ✅ Trigger creates user_profile automatically
6. ✅ Trigger creates Free tier (10 quotes/month)
7. ✅ You're logged in and see the main app

## Troubleshooting

### "Apple button doesn't appear"
**Cause**: Platform check failing or module not installed
**Fix**:
```bash
# Check if on iOS
# Should show the button if Platform.OS === 'ios'
```

### "AppleAuthentication.signInAsync failed"
**Cause**: Not signed in to iCloud on simulator
**Fix**:
1. Open iOS Simulator
2. Settings → Sign in to your iPhone
3. Sign in with any Apple ID
4. Try again

### "Supabase auth error: Invalid provider"
**Cause**: Apple provider not configured in Supabase
**Fix**:
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Apple provider
3. Add your credentials:
   - Client ID: `com.hitquote.auth`
   - Team ID: `V6VNWZWG64`
   - Key ID: `3SATCA4BL3`
   - Secret: (The JWT token we generated)

### "User created but no profile"
**Cause**: SQL trigger not deployed
**Fix**:
Run the SQL from `migrations/create_user_profile_trigger.sql` in Supabase SQL Editor

## What Happens Under the Hood

```
User taps Apple button
    ↓
AppleAuthentication.signInAsync()
    ↓
iOS shows native Apple Sign-In sheet
    ↓
User authorizes
    ↓
App receives identityToken + nonce
    ↓
supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })
    ↓
Supabase creates auth.users entry
    ↓
Trigger fires: create_profile_on_auth_signup
    ↓
user_profiles row created with supabase_auth_id
    ↓
Trigger fires: create_tier_on_user_signup
    ↓
account_tiers row created with tier='free', monthly_quote_limit=10
    ↓
AuthContext receives session
    ↓
User is logged in → sees main app
```

## Console Logs to Watch For

When testing, watch for these logs:

```
🍎 Starting Apple Sign-In...
🍎 Apple credential received
✅ Apple Sign-In successful
📦 Migration result: { success: true, customersCount: 0, productsCount: 0 }
```

Or if there's an error:
```
❌ Apple Sign-In error: [error message]
```

## Testing Guest → Apple Migration

1. **Start as guest**:
   - Tap "המשך כאורח"
   - Create a customer
   - Create a product

2. **Sign up with Apple**:
   - Tap Apple button
   - Authorize

3. **Verify migration**:
   - Check that your customer/product are now in Supabase
   - Check AsyncStorage is cleared
   - Check console logs for migration success

## Verifying in Supabase

After signing in with Apple, check:

1. **auth.users**:
   ```sql
   SELECT id, email, raw_user_meta_data
   FROM auth.users
   ORDER BY created_at DESC
   LIMIT 5;
   ```

2. **user_profiles**:
   ```sql
   SELECT * FROM user_profiles
   WHERE supabase_auth_id IN (
     SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
   );
   ```

3. **account_tiers**:
   ```sql
   SELECT * FROM account_tiers
   WHERE auth_user_id IN (
     SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1
   );
   ```

Should see:
- ✅ New auth.users entry
- ✅ Linked user_profiles entry
- ✅ Free tier with 10 quotes/month

## Success Criteria

Apple Sign-In is working correctly when:
- ✅ Button appears on iOS
- ✅ Native Apple sheet appears
- ✅ User can authorize
- ✅ Session is created
- ✅ User profile is created
- ✅ Free tier is assigned
- ✅ User sees main app
- ✅ Guest data migrates (if applicable)
- ✅ User can create quotes (up to 10/month)
- ✅ User can logout
- ✅ User can delete account

🎉 If all checks pass, Apple Sign-In is fully working!
