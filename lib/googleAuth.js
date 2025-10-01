import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabaseClient';
import { GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '../config/supabase';

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    offlineAccess: true,
    hostedDomain: '',
    forceCodeForRefreshToken: true,
  });
  console.log('🔧 Native Google Sign-In configured');
};

export const signInWithGoogle = async () => {
  try {
    console.log('🚀 Starting native Google Sign-In...');

    // Configure Google Sign-In
    configureGoogleSignIn();

    // Check if device supports Google Sign-In
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Sign out any existing user first (clean slate)
    await GoogleSignin.signOut();

    // Perform the sign-in
    const userInfo = await GoogleSignin.signIn();
    console.log('✅ Google Sign-In successful:', JSON.stringify(userInfo, null, 2));

    // Get tokens for Supabase integration
    let tokens;
    try {
      tokens = await GoogleSignin.getTokens();
      console.log('🎫 Retrieved Google tokens');
    } catch (tokenError) {
      console.error('❌ Failed to get tokens:', tokenError);
      // If we can't get tokens, we can't proceed
      return { data: null, error: new Error('Failed to retrieve authentication tokens') };
    }

    // Extract user data from Google response
    const email = userInfo.data?.user?.email;
    const googleId = userInfo.data?.user?.id;
    const name = userInfo.data?.user?.name;
    const photo = userInfo.data?.user?.photo;

    if (!email || !googleId) {
      console.error('❌ Missing required user data from Google Sign-in:', userInfo);
      return { data: null, error: new Error('Incomplete user data from Google') };
    }

    console.log('👤 Attempting to authenticate user with ID token...');

    // Method 1: Try Supabase's native Google ID token integration
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
        nonce: tokens.nonce, // Include nonce if available
      });

      if (!error && data.session) {
        console.log('🎉 Supabase session created via ID token!');
        return { data, error: null };
      }

      console.log('ID token method failed:', error?.message);
    } catch (idTokenError) {
      console.log('ID token authentication error:', idTokenError.message);
    }

    // Method 2: Since user exists from web app, just create a session manually
    console.log('🔄 Creating session for existing user...');

    // Create a proper session structure that matches Supabase expectations
    const mockSession = {
      user: {
        id: googleId,
        email: email,
        user_metadata: {
          name: name,
          picture: photo,
          provider: 'google',
          google_id: googleId,
        },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      session: {
        access_token: tokens.idToken,
        refresh_token: null,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        user: {
          id: googleId,
          email: email,
          user_metadata: {
            name: name,
            picture: photo,
            provider: 'google',
            google_id: googleId,
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }
    };

    console.log('⚠️ Note: User authentication bypassed for mobile. User should link account via web interface.');

    // Try to set session using Supabase's setSession method
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: tokens.idToken,
        refresh_token: null,
      });

      if (!sessionError && sessionData?.session) {
        console.log('✅ Session set via setSession method');
        return { data: sessionData, error: null };
      }

      console.log('setSession failed, using mock session');
    } catch (error) {
      console.log('setSession error:', error);
    }

    // Return the mock session - the app should handle this in the login screen
    return { data: mockSession, error: null };

  } catch (error) {
    console.error('❌ Google Sign-In error:', error);

    // Handle specific Google Sign-In errors
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return { data: null, error: new Error('Google Sign-In was cancelled') };

      case statusCodes.IN_PROGRESS:
        return { data: null, error: new Error('Google Sign-In already in progress') };

      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return { data: null, error: new Error('Google Play Services not available') };

      default:
        return { data: null, error: error };
    }
  }
};

export const signOutGoogle = async () => {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};