import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { supabase } from './supabaseClient';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config/supabase';
import { Platform } from 'react-native';
import { migrateLocalDataToSupabase } from './dataMigration';
import { setGuestMode } from './localStorage';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

// Apple Sign-In
export const signInWithApple = async () => {
  try {
    console.log('🍎 Starting Apple Sign-In...');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('🍎 Apple credential received');

    // Try Supabase's native Apple Sign-In first
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: credential.nonce,
    });

    if (error) {
      console.error('❌ Apple Sign-In error:', error);
      console.log('🔄 Trying alternative Apple authentication...');

      // Fallback: Use email/password with Apple credentials
      const email = credential.email;
      const appleUserId = credential.user;

      if (!email) {
        // Returning Apple user - Apple doesn't provide email on subsequent sign-ins
        console.log('🔍 No email provided - this is a returning Apple user');
        console.log('Apple User ID:', appleUserId);

        // Since this is a returning user, Apple Sign-In should work with Supabase
        // If we're in the fallback, it means Supabase's Apple integration isn't configured
        // We can't proceed without email, so return a clear error
        return {
          data: null,
          error: new Error('Apple Sign-In configuration error.\n\nThis appears to be your first time signing in with Apple on this device.\n\nPlease use Google or Email/Password to sign in.')
        };
      }

      // Check if user exists by email
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('supabase_auth_id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // User exists - try to sign in with Apple-derived password
        console.log('👤 User exists, attempting to sign in with Apple credentials...');
        const applePassword = `apple_${appleUserId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: applePassword,
        });

        if (!signInError && signInData?.user) {
          console.log('✅ Signed in successfully with Apple-linked account');
          return { data: signInData, error: null };
        }

        // If sign-in failed, account exists but Apple isn't linked
        return {
          data: null,
          error: new Error(`חשבון זה קיים במערכת אך Apple לא מקושר.\n\nאנא התחבר באמצעות Google או דוא"ל/סיסמה.\n\nאו צור קשר עם התמיכה לקישור Apple.`)
        };
      }

      // User doesn't exist - create new account
      console.log('🆕 Creating new Apple user...');
      const applePassword = `apple_${appleUserId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: applePassword,
        options: {
          data: {
            name: credential.fullName ? `${credential.fullName.givenName} ${credential.fullName.familyName}` : email,
            provider: 'apple',
            apple_id: appleUserId,
          },
        },
      });

      if (signUpError) {
        console.error('❌ Failed to create Apple user:', signUpError);
        return { data: null, error: new Error('לא ניתן ליצור חשבון. אנא נסה שיטת התחברות אחרת.') };
      }

      console.log('✅ New Apple user created via fallback');

      // Check if user needs to confirm email (session will be null)
      if (!signUpData.session && signUpData.user) {
        console.log('⚠️ User created but needs email confirmation, signing in manually...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: applePassword,
        });

        if (signInError) {
          console.error('❌ Failed to sign in after signup:', signInError);
          return { data: null, error: new Error('החשבון נוצר אך ההתחברות נכשלה. אנא נסה להתחבר שוב.') };
        }

        console.log('✅ Signed in successfully after signup');

        // Migrate any guest data
        if (signInData.user) {
          await handlePostSignupMigration(signInData.user.id);
        }

        return { data: signInData, error: null };
      }

      // Migrate any guest data
      if (signUpData.user) {
        await handlePostSignupMigration(signUpData.user.id);
      }

      return { data: signUpData, error: null };
    }

    console.log('✅ Apple Sign-In successful');

    // Check if this is a new user and migrate data
    if (data.user && data.user.created_at) {
      const userAge = Date.now() - new Date(data.user.created_at).getTime();
      if (userAge < 60000) { // Created less than 1 minute ago = new user
        await handlePostSignupMigration(data.user.id);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Apple Sign-In failed:', error);
    return { data: null, error };
  }
};

// Google Sign-In via Supabase Auth
export const signInWithGoogle = async () => {
  try {
    console.log('🔵 Starting Google Sign-In...');

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    await GoogleSignin.signOut(); // Clean slate

    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In successful');

    const tokens = await GoogleSignin.getTokens();
    console.log('🔑 Got tokens');

    // Use access token to get user info and create/sign in with Supabase
    // We'll use the access token to exchange for a Supabase session
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: tokens.idToken,
      // Don't pass nonce - let Supabase handle it
    });

    if (error) {
      console.error('❌ Google Supabase auth error:', error);

      // If ID token fails, try creating user manually with email/password
      // This is a fallback for cases where signInWithIdToken doesn't work
      console.log('🔄 Trying alternative Google auth method...');
      console.log('📊 UserInfo structure:', JSON.stringify(userInfo, null, 2));

      // Get user email from userInfo (check both .user and direct properties)
      const email = userInfo.data?.user?.email || userInfo.user?.email || userInfo.email;
      const googleId = userInfo.data?.user?.id || userInfo.user?.id || userInfo.id;
      const name = userInfo.data?.user?.name || userInfo.user?.name || userInfo.name;
      const photo = userInfo.data?.user?.photo || userInfo.user?.photo || userInfo.photo;

      if (!email || !googleId) {
        console.error('❌ Could not extract email or ID from userInfo');
        return { data: null, error: new Error('Could not extract user information from Google') };
      }

      console.log('👤 Google user:', { email, googleId, name });

      // Check if user exists by querying user_profiles
      console.log('🔍 Checking if user exists in database...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('supabase_auth_id, email')
        .eq('email', email)
        .maybeSingle();

      if (existingProfile) {
        // User exists - try to sign in with Google-derived password
        console.log('👤 User exists, attempting to sign in with Google credentials...');
        const googlePassword = `google_${googleId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: googlePassword,
        });

        if (!signInError && signInData?.user) {
          console.log('✅ Signed in successfully with Google-linked account');
          return { data: signInData, error: null };
        }

        // If sign-in failed, the account exists but Google password isn't set
        console.log('⚠️ User exists but Google authentication is not linked yet');
        console.log('💡 Setting up Google authentication for existing user...');

        // For existing users (Tal and Moran), we need to update their password
        // This requires using the auth admin API or password reset flow
        // Since we can't do that from client, return helpful error
        return {
          data: null,
          error: new Error(`חשבון זה קיים במערכת אך Google לא מקושר.\n\nאנא התחבר באמצעות Apple Sign-In או דוא"ל/סיסמה.\n\nאו צור קשר עם התמיכה לקישור Google.`)
        };
      }

      // User doesn't exist in profiles - try to create new account
      console.log('🆕 No existing user found, creating new account...');

      // Use a special password pattern for Google users
      const googlePassword = `google_${googleId}_${email.replace(/[^a-zA-Z0-9]/g, '')}`;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: googlePassword,
        options: {
          data: {
            name: name || email,
            picture: photo,
            provider: 'google',
            google_id: googleId,
          },
          emailRedirectTo: undefined, // Skip email confirmation
        },
      });

      if (signUpError) {
        console.error('❌ Failed to create user:', signUpError);
        console.error('Error code:', signUpError.status, signUpError.code);

        // Check if it's an email confirmation issue
        if (signUpError.message?.includes('Database error') || signUpError.message?.includes('Email not confirmed')) {
          return {
            data: null,
            error: new Error('יצירת חשבון נכשלה. אנא וודא שאימות מייל מבוטל בהגדרות Supabase.\n\nלחלופין, השתמש ב-Apple Sign-In או הרשמה עם דוא"ל/סיסמה.')
          };
        }

        // If user already registered - this is an orphaned auth user (exists in auth.users but not in settings)
        if (signUpError.code === 'user_already_exists' || signUpError.status === 422) {
          console.log('⚠️ User already exists in auth.users - attempting to sign in and link to profile');

          // Try signing in with the password we would have used
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: email,
            password: googlePassword,
          });

          if (!signInError && signInData?.user) {
            console.log('✅ Signed in successfully - now user_profiles trigger will create the profile');

            // Migrate any guest data
            await handlePostSignupMigration(signInData.user.id);

            return { data: signInData, error: null };
          }

          // If password sign-in fails, the orphaned account has a different password
          // This is the real problem - we need to delete the orphaned account
          console.log('⚠️ Orphaned account detected with mismatched password - cleaning up...');

          // Call edge function to delete orphaned auth user
          try {
            const { error: deleteError } = await supabase.functions.invoke('cleanup-orphaned-user', {
              body: { email: email }
            });

            if (deleteError) {
              console.error('❌ Failed to cleanup orphaned user:', deleteError);
            } else {
              console.log('✅ Orphaned user cleaned up - retrying signup...');

              // Retry signup now that orphan is cleaned
              const { data: retryData, error: retryError } = await supabase.auth.signUp({
                email: email,
                password: googlePassword,
                options: {
                  data: {
                    name: name || email,
                    picture: photo,
                    provider: 'google',
                    google_id: googleId,
                  },
                },
              });

              if (!retryError && retryData?.user) {
                console.log('✅ Signup successful after cleanup');
                await handlePostSignupMigration(retryData.user.id);
                return { data: retryData, error: null };
              }
            }
          } catch (cleanupError) {
            console.error('❌ Cleanup error:', cleanupError);
          }

          return {
            data: null,
            error: new Error('חשבון קיים אך לא מקושר כראוי. אנא צור קשר עם התמיכה.')
          };
        }

        // If signup fails for other reasons, try signing in (maybe they were created in the meantime)
        console.log('🔄 Trying to sign in instead...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: googlePassword,
        });

        if (!signInError && signInData?.user) {
          console.log('✅ Successfully signed in with existing Google-linked account');
          return { data: signInData, error: null };
        }

        return { data: null, error: new Error('לא ניתן ליצור חשבון חדש. אנא נסה שיטת התחברות אחרת או צור קשר עם התמיכה.') };
      }

      console.log('✅ New user created successfully');

      // Check if user needs to confirm email (session will be null)
      if (!signUpData.session && signUpData.user) {
        console.log('⚠️ User created but needs email confirmation, signing in manually...');
        // Sign in immediately with the password we just created
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email,
          password: googlePassword,
        });

        if (signInError) {
          console.error('❌ Failed to sign in after signup:', signInError);
          return { data: null, error: new Error('החשבון נוצר אך ההתחברות נכשלה. אנא נסה להתחבר שוב.') };
        }

        console.log('✅ Signed in successfully after signup');

        // Migrate any guest data
        if (signInData.user) {
          await handlePostSignupMigration(signInData.user.id);
        }

        return { data: signInData, error: null };
      }

      // Migrate any guest data
      if (signUpData.user) {
        await handlePostSignupMigration(signUpData.user.id);
      }

      return { data: signUpData, error: null };
    }

    console.log('✅ Supabase session created via ID token');

    // Check if this is a new user and migrate data
    if (data.user) {
      const userAge = Date.now() - new Date(data.user.created_at).getTime();
      if (userAge < 60000) { // Created less than 1 minute ago = new user
        await handlePostSignupMigration(data.user.id);
      }
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Google Sign-In failed:', error);
    return { data: null, error };
  }
};

// Email/Password Sign Up
export const signUpWithEmail = async (email, password, fullName) => {
  try {
    console.log('📧 Starting email sign up...');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: fullName,
        },
      },
    });

    if (error) {
      console.error('❌ Email sign up error:', error);
      return { data: null, error };
    }

    console.log('✅ Email sign up successful');

    // Migrate local data if any
    if (data.user) {
      await handlePostSignupMigration(data.user.id);
    }

    return { data, error: null };
  } catch (error) {
    console.error('❌ Email sign up failed:', error);
    return { data: null, error };
  }
};

// Email/Password Sign In
export const signInWithEmail = async (email, password) => {
  try {
    console.log('📧 Starting email sign in...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Email sign in error:', error);
      return { data: null, error };
    }

    console.log('✅ Email sign in successful');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Email sign in failed:', error);
    return { data: null, error };
  }
};

// Sign Out
export const signOut = async () => {
  try {
    await supabase.auth.signOut();

    // Clear guest mode flag
    await setGuestMode(false);

    // Also sign out from Google if signed in (wrapped in try-catch)
    try {
      const isGoogleSignedIn = await GoogleSignin.isSignedIn();
      if (isGoogleSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch (googleError) {
      console.log('Google sign out not available:', googleError.message);
    }

    console.log('✅ Sign out successful');
  } catch (error) {
    console.error('❌ Sign out error:', error);
    throw error;
  }
};

// Delete Account
export const deleteAccount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('No user logged in');
    }

    // Delete user data from database
    await supabase.from('proposal').delete().eq('user_id', user.id);
    await supabase.from('customer').delete().eq('user_id', user.id);
    await supabase.from('product').delete().eq('user_id', user.id);

    // Delete account tier
    await supabase.from('account_tiers').delete().eq('auth_user_id', user.id);

    // Delete user profile
    await supabase.from('user_profiles').delete().eq('supabase_auth_id', user.id);

    // Delete auth user (requires admin API - will be done via Edge Function)
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { userId: user.id },
    });

    if (error) {
      console.error('❌ Delete account error:', error);
      throw error;
    }

    // Sign out
    await signOut();

    console.log('✅ Account deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Delete account failed:', error);
    return { success: false, error };
  }
};

// Continue as Guest
export const continueAsGuest = async () => {
  console.log('🎭 continueAsGuest called - setting guest mode...');
  await setGuestMode(true);
  console.log('✅ Guest mode set successfully');

  // Create a demo session object for guest mode
  // This allows demo data to be loaded properly
  const demoSession = {
    user: {
      id: 'demo-user-apple-review',
      email: 'applereview@demo.com',
      user_metadata: {
        provider: 'demo'
      }
    }
  };

  return { success: true, session: demoSession };
};

// Helper function to migrate data after signup
const handlePostSignupMigration = async (userId) => {
  try {
    // Get user_profile id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_auth_id', userId)
      .single();

    if (profile) {
      const result = await migrateLocalDataToSupabase(profile.id);
      console.log('📦 Migration result:', result);

      if (result.success) {
        await setGuestMode(false);
      }
    }
  } catch (error) {
    console.error('⚠️ Post-signup migration error:', error);
  }
};

// Check if Apple Sign-In is available
export const isAppleAuthAvailable = async () => {
  if (Platform.OS !== 'ios') return false;
  return await AppleAuthentication.isAvailableAsync();
};
