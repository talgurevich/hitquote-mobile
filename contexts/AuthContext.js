import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { isGuestMode } from '../lib/localStorage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [accountTier, setAccountTier] = useState(null);
  const hasCreatedDemoSessionRef = useRef(false);
  const guestCheckIntervalRef = useRef(null);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      // First check if in guest mode
      const guestStatus = await isGuestMode();
      setIsGuest(guestStatus);

      if (guestStatus) {
        // Create demo session for guest mode
        hasCreatedDemoSessionRef.current = true;
        const demoSession = {
          user: {
            id: 'demo-user-apple-review',
            email: 'applereview@demo.com',
            user_metadata: {
              provider: 'demo'
            }
          }
        };
        setSession(demoSession);
        setUser(demoSession.user);
        setLoading(false);
      } else {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
          loadAccountTier(session.user.id);
        }
        setLoading(false);
      }
    };

    initAuth();

    // Check guest mode and set up interval to recheck
    const checkGuest = async () => {
      const guestStatus = await isGuestMode();
      setIsGuest(guestStatus);

      // If in guest mode and haven't created demo session yet, create it
      if (guestStatus && !hasCreatedDemoSessionRef.current) {
        console.log('🎭 Creating demo session for guest mode');
        hasCreatedDemoSessionRef.current = true;
        const demoSession = {
          user: {
            id: 'demo-user-apple-review',
            email: 'applereview@demo.com',
            user_metadata: {
              provider: 'demo'
            }
          }
        };
        setSession(demoSession);
        setUser(demoSession.user);
        setLoading(false);
        console.log('✅ Guest session created');
      } else if (!guestStatus && hasCreatedDemoSessionRef.current) {
        // User logged out of guest mode, reset the flag
        console.log('👋 Guest mode ended');
        hasCreatedDemoSessionRef.current = false;
      }
    };

    // NOTE: This AuthContext is not currently used by App.js
    // Disabled the interval to reduce unnecessary checks
    // guestCheckIntervalRef.current = setInterval(checkGuest, 500);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Check if in guest mode - don't override demo session
      const guestStatus = await isGuestMode();

      if (guestStatus) {
        // In guest mode, keep the demo session
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        loadUserProfile(session.user.id);
        loadAccountTier(session.user.id);
        setIsGuest(false);
      } else {
        setUserProfile(null);
        setAccountTier(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      if (guestCheckIntervalRef.current) {
        clearInterval(guestCheckIntervalRef.current);
      }
    };
  }, []);

  const loadUserProfile = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('supabase_auth_id', authUserId)
        .single();

      if (error && error.code === 'PGRST116') {
        // User profile doesn't exist, create one
        const { data: newProfile, error: insertError } = await supabase
          .from('user_profiles')
          .insert({
            supabase_auth_id: authUserId,
            email: user?.email,
            display_name: user?.user_metadata?.name || user?.email,
          })
          .select()
          .single();

        if (!insertError) {
          setUserProfile(newProfile);
        }
      } else if (!error) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAccountTier = async (authUserId) => {
    try {
      const { data, error } = await supabase
        .from('account_tiers')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (!error) {
        setAccountTier(data);
      }
    } catch (error) {
      console.error('Error loading account tier:', error);
    }
  };

  const checkQuota = async () => {
    if (!user || isGuest) {
      return {
        can_create_quote: true, // Guests can't save quotes anyway
        current_count: 0,
        monthly_limit: -1,
        tier_name: 'guest',
        remaining_quotes: -1,
      };
    }

    try {
      const { data, error } = await supabase.rpc('check_user_quota', {
        p_auth_user_id: user.id,
      });

      if (error) {
        console.error('Error checking quota:', error);
        return null;
      }

      return data[0];
    } catch (error) {
      console.error('Error checking quota:', error);
      return null;
    }
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    userProfile,
    accountTier,
    checkQuota,
    isAuthenticated: !!user && !isGuest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
