import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Image, Linking, FlatList, RefreshControl, TextInput, ScrollView, ImageBackground, Dimensions, Platform, Modal, Share, Keyboard, TouchableWithoutFeedback } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './lib/supabaseClient';
import { SUPABASE_URL } from './config/supabase';
import { validateSessionAndGetBusinessUserId } from './lib/businessUserUtils';
import { signInWithGoogle, signOutGoogle } from './lib/googleAuth';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import ColorPalette from 'react-native-color-palette';
import { isEmailApproved, isAdminEmail } from './lib/emailApproval';
import { isDemoUser, getDemoData } from './lib/demoData';
import { generatePDFTemplate, TEMPLATES } from './lib/pdfTemplates';
import { initializeReviewTracking, trackQuoteCreated, trackSignatureReceived, checkSevenDayMilestone } from './lib/reviewManager';
import AnimatedSplashScreen from './components/AnimatedSplashScreen';
import NewLoginScreen from './screens/NewLoginScreen';
import RevenueCatService from './lib/revenueCatService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Icon Components
const IconEdit = ({ size = 20, color = '#fff' }) => (
  <View>
    <Text style={{ fontSize: size, color }}>✎</Text>
  </View>
);

// Google Logo Component
const GoogleLogo = ({ size = 20 }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
      elevation: 2,
    }}>
      <View style={{
        width: size * 0.7,
        height: size * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Google G */}
        <View style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: size * 0.1,
          borderWidth: size * 0.05,
          borderColor: '#4285f4',
          borderRightColor: 'transparent',
          position: 'relative',
        }}>
          <View style={{
            position: 'absolute',
            right: -size * 0.05,
            top: size * 0.15,
            width: size * 0.25,
            height: size * 0.05,
            backgroundColor: '#4285f4',
          }} />
          <View style={{
            position: 'absolute',
            right: -size * 0.05,
            top: size * 0.2,
            width: size * 0.05,
            height: size * 0.15,
            backgroundColor: '#4285f4',
          }} />
        </View>
      </View>
    </View>
  </View>
);

// Tab Icon Components
const IconDashboard = ({ size = 20, color = '#999' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.9,
      height: size * 0.9,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: size * 0.15,
      position: 'relative'
    }}>
      {/* Dashboard grid */}
      <View style={{
        position: 'absolute',
        top: size * 0.15,
        left: size * 0.15,
        width: size * 0.25,
        height: size * 0.25,
        backgroundColor: color
      }} />
      <View style={{
        position: 'absolute',
        top: size * 0.15,
        right: size * 0.15,
        width: size * 0.25,
        height: size * 0.25,
        backgroundColor: color
      }} />
      <View style={{
        position: 'absolute',
        bottom: size * 0.15,
        left: size * 0.15,
        width: size * 0.25,
        height: size * 0.25,
        backgroundColor: color
      }} />
      <View style={{
        position: 'absolute',
        bottom: size * 0.15,
        right: size * 0.15,
        width: size * 0.25,
        height: size * 0.25,
        backgroundColor: color
      }} />
    </View>
  </View>
);

// Dashboard Action Icons
const IconCreateQuote = ({ size = 24, color = '#374151' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.8,
      height: size * 0.6,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 2,
      position: 'relative'
    }}>
      {/* Document lines */}
      <View style={{
        position: 'absolute',
        top: size * 0.15,
        left: size * 0.1,
        width: size * 0.5,
        height: 1.5,
        backgroundColor: color
      }} />
      <View style={{
        position: 'absolute',
        top: size * 0.25,
        left: size * 0.1,
        width: size * 0.4,
        height: 1.5,
        backgroundColor: color
      }} />
      <View style={{
        position: 'absolute',
        top: size * 0.35,
        left: size * 0.1,
        width: size * 0.3,
        height: 1.5,
        backgroundColor: color
      }} />
      {/* Dollar sign */}
      <View style={{
        position: 'absolute',
        bottom: size * 0.08,
        right: size * 0.08,
        width: size * 0.15,
        height: size * 0.15,
        borderRadius: size * 0.075,
        backgroundColor: color
      }} />
    </View>
  </View>
);

const IconAddCustomer = ({ size = 24, color = '#374151' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Person icon */}
    <View style={{
      width: size * 0.35,
      height: size * 0.35,
      borderRadius: size * 0.175,
      borderWidth: 1.5,
      borderColor: color,
      marginBottom: size * 0.1
    }} />
    <View style={{
      width: size * 0.7,
      height: size * 0.4,
      borderTopLeftRadius: size * 0.2,
      borderTopRightRadius: size * 0.2,
      borderWidth: 1.5,
      borderColor: color,
      borderBottomWidth: 0
    }} />
    {/* Plus sign */}
    <View style={{
      position: 'absolute',
      top: size * 0.1,
      right: 0,
      width: size * 0.25,
      height: size * 0.25,
      backgroundColor: '#10b981',
      borderRadius: size * 0.125,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        width: size * 0.12,
        height: 1.5,
        backgroundColor: '#fff'
      }} />
      <View style={{
        position: 'absolute',
        width: 1.5,
        height: size * 0.12,
        backgroundColor: '#fff'
      }} />
    </View>
  </View>
);

const IconAddProduct = ({ size = 24, color = '#374151' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    {/* Box icon */}
    <View style={{
      width: size * 0.7,
      height: size * 0.7,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 3,
      position: 'relative'
    }}>
      {/* Box top */}
      <View style={{
        position: 'absolute',
        top: -1.5,
        left: size * 0.1,
        right: size * 0.1,
        height: size * 0.2,
        borderWidth: 1.5,
        borderColor: color,
        borderBottomWidth: 0,
        borderTopLeftRadius: 2,
        borderTopRightRadius: 2
      }} />
      {/* Box center line */}
      <View style={{
        position: 'absolute',
        top: size * 0.15,
        left: '48%',
        width: 1.5,
        height: size * 0.4,
        backgroundColor: color
      }} />
    </View>
    {/* Plus sign */}
    <View style={{
      position: 'absolute',
      top: 0,
      right: 0,
      width: size * 0.25,
      height: size * 0.25,
      backgroundColor: '#10b981',
      borderRadius: size * 0.125,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{
        width: size * 0.12,
        height: 1.5,
        backgroundColor: '#fff'
      }} />
      <View style={{
        position: 'absolute',
        width: 1.5,
        height: size * 0.12,
        backgroundColor: '#fff'
      }} />
    </View>
  </View>
);

const IconQuotes = ({ size = 20, color = '#999' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.6, borderWidth: 1, borderColor: color, borderRadius: 2 }}>
      <View style={{ position: 'absolute', top: size * 0.15, left: size * 0.1, width: size * 0.6, height: 1, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.3, left: size * 0.1, width: size * 0.4, height: 1, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.45, left: size * 0.1, width: size * 0.5, height: 1, backgroundColor: color }} />
    </View>
  </View>
);

const IconCustomers = ({ size = 20, color = '#999' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.4, height: size * 0.4, borderRadius: size * 0.2, borderWidth: 1, borderColor: color, marginBottom: 2 }} />
    <View style={{ width: size * 0.8, height: size * 0.4, borderTopLeftRadius: size * 0.4, borderTopRightRadius: size * 0.4, borderWidth: 1, borderColor: color }} />
  </View>
);

const IconCatalog = ({ size = 20, color = '#999' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.8, borderWidth: 1, borderColor: color, borderRadius: 2 }}>
      <View style={{ position: 'absolute', top: size * 0.2, left: size * 0.1, width: size * 0.6, height: 1, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.4, left: size * 0.1, width: size * 0.4, height: 1, backgroundColor: color }} />
      <View style={{ position: 'absolute', top: size * 0.6, left: size * 0.1, width: size * 0.5, height: 1, backgroundColor: color }} />
    </View>
  </View>
);

const IconSettings = ({ size = 20, color = '#999' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.8, borderRadius: size * 0.4, borderWidth: 1, borderColor: color }}>
      <View style={{ position: 'absolute', top: size * 0.35, left: size * 0.35, width: size * 0.1, height: size * 0.1, borderRadius: size * 0.05, backgroundColor: color }} />
    </View>
    <View style={{ position: 'absolute', top: 0, left: size * 0.45, width: 1, height: size * 0.15, backgroundColor: color }} />
    <View style={{ position: 'absolute', bottom: 0, left: size * 0.45, width: 1, height: size * 0.15, backgroundColor: color }} />
    <View style={{ position: 'absolute', left: 0, top: size * 0.45, width: size * 0.15, height: 1, backgroundColor: color }} />
    <View style={{ position: 'absolute', right: 0, top: size * 0.45, width: size * 0.15, height: 1, backgroundColor: color }} />
  </View>
);

const IconDelete = ({ size = 20, color = '#fff' }) => (
  <View>
    <Text style={{ fontSize: size, color }}>✕</Text>
  </View>
);

const IconDuplicate = ({ size = 20, color = '#fff' }) => (
  <View>
    <Text style={{ fontSize: size, color }}>⧉</Text>
  </View>
);

const IconShare = ({ size = 20, color = '#fff' }) => (
  <View>
    <Text style={{ fontSize: size, color }}>↗</Text>
  </View>
);

const IconPDF = ({ size = 20, color = '#fff' }) => (
  <View>
    <Text style={{ fontSize: size, color }}>▭</Text>
  </View>
);

const IconPhone = ({ size = 20, color = '#666' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.65,
      height: size * 0.8,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: size * 0.15,
      transform: [{ rotate: '-10deg' }]
    }}>
      <View style={{
        position: 'absolute',
        bottom: size * 0.15,
        left: size * 0.1,
        width: size * 0.45,
        height: size * 0.08,
        backgroundColor: color,
        borderRadius: size * 0.04
      }} />
    </View>
  </View>
);

const IconMessage = ({ size = 20, color = '#666' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.8,
      height: size * 0.65,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: size * 0.12,
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <View style={{ width: size * 0.5, height: 1, backgroundColor: color, marginBottom: 2 }} />
      <View style={{ width: size * 0.4, height: 1, backgroundColor: color }} />
    </View>
    <View style={{
      position: 'absolute',
      bottom: size * 0.12,
      left: size * 0.15,
      width: 0,
      height: 0,
      borderLeftWidth: size * 0.12,
      borderLeftColor: 'transparent',
      borderRightWidth: size * 0.12,
      borderRightColor: 'transparent',
      borderTopWidth: size * 0.12,
      borderTopColor: color,
    }} />
  </View>
);

const IconEmail = ({ size = 20, color = '#666' }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{
      width: size * 0.8,
      height: size * 0.6,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 2
    }}>
      <View style={{
        position: 'absolute',
        top: -1,
        left: -1,
        width: 0,
        height: 0,
        borderLeftWidth: size * 0.4,
        borderLeftColor: 'transparent',
        borderRightWidth: size * 0.4,
        borderRightColor: 'transparent',
        borderTopWidth: size * 0.3,
        borderTopColor: color,
      }} />
    </View>
  </View>
);

// Utility function to parse product options
const parseOptions = (optStr) => {
  if (!optStr) return [];
  const cleaned = optStr.replace(/^.*?:\s*/, '').trim();
  return cleaned.split('|').map((s) => s.trim()).filter(Boolean);
};

// Login Screen
function LoginScreen({ navigation, onLogin }) {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithGoogle();

      if (result.error) {
        if (result.error.message?.includes('OAuth') || result.error.message?.includes('provider')) {
          Alert.alert(
            'הגדרת OAuth נדרשת',
            'לשימוש באימות Google, יש להפעיל את ספק Google OAuth בפאנל הניהול של Supabase ולהגדיר Redirect URLs. לבדיקת האפליקציה השתמש בכניסה הזמנית.',
            [{ text: 'הבנתי' }]
          );
        } else {
          Alert.alert('שגיאה', result.error.message || 'שגיאה בהתחברות עם Google');
        }
      } else if (result.data) {
        // Authentication successful - if setSession didn't work, manually trigger navigation
        console.log('Login successful, checking session...');

        // Check if session was automatically set
        const { data: currentSession } = await supabase.auth.getSession();

        if (!currentSession?.session) {
          // Session wasn't set automatically, manually call the parent's onLogin
          console.log('Session not set automatically, calling onLogin callback');

          // Use the returned data as our session
          const mockSession = result.data.session || result.data;

          // Call the parent component's login handler
          if (onLogin) {
            onLogin(mockSession);
          }
        }
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות עם Google');
    } finally {
      setLoading(false);
    }
  };

  // Demo Mode for Apple TestFlight Review
  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      console.log('🍎 DEMO MODE: Creating demo session for Apple Review');

      // Create a demo session with pre-populated data
      const demoSession = {
        user: {
          id: 'demo-user-apple-review',
          email: 'applereview@demo.com',
          user_metadata: {
            name: 'Apple Reviewer',
            picture: '',
            provider: 'demo',
            google_id: 'demo-user-apple-review',
          },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        session: {
          access_token: 'demo-access-token-apple-review',
          refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
          user: {
            id: 'demo-user-apple-review',
            email: 'applereview@demo.com',
            user_metadata: {
              name: 'Apple Reviewer',
              picture: '',
              provider: 'demo',
              google_id: 'demo-user-apple-review',
            },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      };

      console.log('🍎 DEMO MODE: Calling onLogin with demo session');
      if (onLogin) {
        onLogin(demoSession);
      }
    } catch (error) {
      console.error('Demo login error:', error);
      Alert.alert('Demo Error', 'Error creating demo session');
    } finally {
      setLoading(false);
    }
  };


  return (
    <ImageBackground
      source={require('./assets/bg1.jpg')}
      style={styles.loginScreenContainer}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loginOverlay}>
          <View style={styles.loginContent}>
            <View style={styles.logoContainer}>
              <Image
                source={require('./assets/logo2.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.heroTitle}>מערכת הצעות מחיר</Text>
            <Text style={styles.heroSubtitle}>נהל את העסק שלך בצורה חכמה ויעילה</Text>

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <View style={styles.googleButtonContent}>
                  <Image
                    source={require('./google logo.png')}
                    style={styles.googleLogoImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.googleButtonText}>התחבר עם Google</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Demo Mode Button for Apple TestFlight Review */}
            <TouchableOpacity
              style={styles.demoButton}
              onPress={handleDemoLogin}
              disabled={loading}
            >
              <View style={styles.demoButtonContent}>
                <Text style={styles.demoButtonTitle}>🍎 Apple TestFlight Review</Text>
                <Text style={styles.demoButtonSubtitle}>Demo Mode - Full Access</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.demoInstructions}>
              <Text style={styles.demoInstructionsTitle}>For Apple Reviewers:</Text>
              <Text style={styles.demoInstructionsText}>
                • Use the "Demo Mode" button above for full app access{'\n'}
                • Or login with: applereview@demo.com{'\n'}
                • Demo account includes sample customers, products & quotes
              </Text>
            </View>
          </View>

          <View style={styles.loginFooter}>
            <View style={styles.legalLinksContainer}>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://hitquote.online/privacy')}
              >
                <Text style={styles.legalLinkText}>מדיניות פרטיות</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}>  •  </Text>
              <TouchableOpacity
                style={styles.legalLink}
                onPress={() => Linking.openURL('https://hitquote.online/terms')}
              >
                <Text style={styles.legalLinkText}>תנאי שירות</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.footerText}>הפלטפורמה המובילה לניהול הצעות מחיר</Text>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Unauthorized Access Screen
function UnauthorizedScreen({ session, onLogout }) {
  const handleLogout = async () => {
    try {
      const { setGuestMode } = require('./lib/localStorage');
      const { signOut } = require('./lib/auth');

      console.log('🚪 Unauthorized screen logout');

      // Clear guest mode
      await setGuestMode(false);

      // Sign out
      await signOut();

      // Call parent logout handler
      if (onLogout) onLogout();

      console.log('✅ Logout complete');
    } catch (error) {
      console.error('❌ Logout error:', error);
      Alert.alert('שגיאה', 'שגיאה בהתנתקות');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.unauthorizedContainer}>
        <View style={styles.unauthorizedContent}>
          <Text style={styles.unauthorizedTitle}>גישה לא מורשית</Text>
          <Text style={styles.unauthorizedMessage}>
            החשבון שלך ({session.user.email}) אינו רשום במערכת.
          </Text>
          <Text style={styles.unauthorizedSubmessage}>
            כדי לקבל גישה לאפליקציה, אנא הירשם באתר האינטרנט שלנו ובקש אישור.
          </Text>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>התנתק</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// Dashboard Screen
function DashboardScreen({ session, navigation: navProp }) {
  const navigation = navProp || useNavigation();
  const [dashboardData, setDashboardData] = useState({
    totalQuotes: 0,
    totalCustomers: 0,
    monthlyRevenue: 0,
    pendingQuotes: 0,
    recentQuotes: [],
    topCustomers: [],
    topProducts: [],
    loading: true,
    quotaInfo: null
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadDashboardData();
    }
  }, [session]);

  useFocusEffect(
    React.useCallback(() => {
      if (session?.user?.id) {
        loadDashboardData();
      }
    }, [session])
  );

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo dashboard data');
        const demoData = getDemoData(session);

        // Calculate demo metrics with safety checks
        const quotes = demoData?.quotes || [];
        const customers = demoData?.customers || [];
        const products = demoData?.products || [];

        const totalQuotes = quotes.length;
        const pendingQuotes = quotes.filter(q => q.status === 'pending').length;
        const approvedQuotes = quotes.filter(q => q.status === 'approved').length;
        const totalRevenue = quotes.reduce((sum, q) => sum + (q.total || 0), 0);
        const totalCustomers = customers.length;
        const totalProducts = products.length;

        setDashboardData({
          loading: false,
          error: null,
          totalQuotes,
          pendingQuotes,
          approvedQuotes,
          totalRevenue,
          monthlyRevenue: totalRevenue * 0.7, // 70% of total as "this month"
          totalCustomers,
          totalProducts,
          recentQuotes: quotes.slice(0, 5),
          topCustomers: customers.slice(0, 3), // Top 3 customers for demo
          quotaInfo: {
            current_count: 0,
            monthly_limit: -1,
            remaining_quotes: -1,
            tier_name: 'demo'
          }
        });
        return;
      }

      // Get business user ID
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      console.log('=== DASHBOARD DEBUG ===');
      console.log('Session user ID:', session?.user?.id);
      console.log('Business user ID:', businessUserId);

      if (!businessUserId) {
        throw new Error('Could not find business user');
      }

      // Get current month start and end dates
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      console.log('Date range:', {
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString()
      });

      // Fetch dashboard metrics in parallel
      const [quotesData, customersData, monthlyQuotesData, quotaData, settingsData] = await Promise.all([
        // Total quotes
        supabase
          .from('proposal')
          .select('id, status, total')
          .eq('business_id', businessUserId),

        // Total customers
        supabase
          .from('customer')
          .select('id, name')
          .eq('business_id', businessUserId),

        // Monthly quotes for revenue and recent activity
        supabase
          .from('proposal')
          .select('id, status, total, created_at, customer!inner(name)')
          .eq('business_id', businessUserId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString())
          .order('created_at', { ascending: false }),

        // Quota information
        supabase.rpc('check_user_quota', {
          p_auth_user_id: session.user.id
        }),

        // Get total quotes created (monotonic counter)
        supabase
          .from('settings')
          .select('total_quotes_created')
          .eq('business_id', businessUserId)
          .single()
      ]);

      console.log('Quotes data:', {
        error: quotesData.error,
        count: quotesData.data?.length,
        sample: quotesData.data?.slice(0, 2)
      });
      console.log('Customers data:', {
        error: customersData.error,
        count: customersData.data?.length
      });
      console.log('Monthly quotes data:', {
        error: monthlyQuotesData.error,
        count: monthlyQuotesData.data?.length,
        sample: monthlyQuotesData.data?.slice(0, 2)
      });
      console.log('Quota data:', {
        error: quotaData.error,
        data: quotaData.data
      });

      // Calculate metrics
      console.log('📊 Settings data for total quotes:', {
        settingsData: settingsData.data,
        total_quotes_created: settingsData.data?.total_quotes_created,
        businessUserId
      });
      const totalQuotes = settingsData.data?.total_quotes_created || 0;
      const totalCustomers = customersData.data?.length || 0;
      const monthlyQuotes = monthlyQuotesData.data || [];
      const monthlyRevenue = monthlyQuotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
      const pendingQuotes = quotesData.data?.filter(q => q.status === 'pending').length || 0;
      const recentQuotes = monthlyQuotes.slice(0, 5);

      console.log('Calculated metrics:', {
        totalQuotes,
        totalCustomers,
        monthlyRevenue,
        pendingQuotes,
        recentQuotesCount: recentQuotes.length
      });

      // Get top customers by quote value
      const customerTotals = {};
      quotesData.data?.forEach(quote => {
        const customerName = quote.customer?.name;
        if (customerName && quote.total) {
          customerTotals[customerName] = (customerTotals[customerName] || 0) + quote.total;
        }
      });
      const topCustomers = Object.entries(customerTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([name, total]) => ({ name, total }));

      setDashboardData({
        totalQuotes,
        totalCustomers,
        monthlyRevenue,
        pendingQuotes,
        recentQuotes,
        topCustomers,
        topProducts: [], // Will implement later
        loading: false,
        quotaInfo: quotaData?.data?.[0] || null
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return `₪${Number(amount || 0).toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'sent': return '#3b82f6';
      case 'approved': return '#10b981';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'ממתין';
      case 'sent': return 'נשלח';
      case 'approved': return 'נחתם';
      case 'accepted': return 'נחתם';
      case 'rejected': return 'נדחה';
      default: return status;
    }
  };

  if (dashboardData.loading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.dashboardHeader}>
            <View style={styles.dashboardHeaderOverlay} />
            <View style={styles.headerTitleContainer}>
              <IconDashboard size={26} color="#fff" />
              <Text style={styles.themedHeaderTitle}>לוח בקרה</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1e3a8a" />
          <Text style={styles.loadingText}>טוען נתונים...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.dashboardHeader}>
          <View style={styles.dashboardHeaderOverlay} />
          <View style={styles.headerTitleContainer}>
            <IconDashboard size={26} color="#fff" />
            <Text style={styles.themedHeaderTitle}>לוח בקרה</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Key Metrics Cards */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.totalQuotes}</Text>
            <Text style={styles.metricLabel}>סה"כ הצעות מחיר</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.totalCustomers}</Text>
            <Text style={styles.metricLabel}>לקוחות</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(dashboardData.monthlyRevenue)}</Text>
            <Text style={styles.metricLabel}>הכנסות החודש</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{dashboardData.pendingQuotes}</Text>
            <Text style={styles.metricLabel}>הצעות ממתינות</Text>
          </View>
        </View>

        {/* Monthly Quota Counter */}
        {dashboardData.quotaInfo && dashboardData.quotaInfo.monthly_limit > 0 && (
          <View style={styles.quotaContainer}>
            <View style={styles.quotaHeader}>
              <Text style={styles.quotaTitle}>הצעות מחיר החודש</Text>
              <Text style={styles.quotaTier}>{dashboardData.quotaInfo.tier_name}</Text>
            </View>
            <View style={styles.quotaProgress}>
              <View style={styles.quotaProgressBar}>
                <View
                  style={[
                    styles.quotaProgressFill,
                    {
                      width: `${Math.min((dashboardData.quotaInfo.current_count / dashboardData.quotaInfo.monthly_limit) * 100, 100)}%`,
                      backgroundColor: dashboardData.quotaInfo.remaining_quotes < 5 ? '#ef4444' : '#3b82f6'
                    }
                  ]}
                />
              </View>
              <Text style={styles.quotaText}>
                {dashboardData.quotaInfo.current_count} / {dashboardData.quotaInfo.monthly_limit}
                {' '}
                <Text style={styles.quotaRemainingText}>
                  ({dashboardData.quotaInfo.remaining_quotes} נותרו)
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעולות מהירות</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('CreateQuote')}
            >
              <IconCreateQuote size={24} color="#374151" />
              <Text style={styles.quickActionText}>הצעת מחיר חדשה</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Customers', { openAddModal: true })}
            >
              <IconAddCustomer size={24} color="#374151" />
              <Text style={styles.quickActionText}>הוסף לקוח</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Catalog')}
            >
              <IconAddProduct size={24} color="#374151" />
              <Text style={styles.quickActionText}>הוסף מוצר</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעילות אחרונה</Text>
          {dashboardData.recentQuotes?.length > 0 ? (
            dashboardData.recentQuotes.map((quote, index) => (
              <TouchableOpacity
                key={quote.id}
                style={styles.recentItem}
                onPress={() => navigation.navigate('ViewQuote', { quoteId: quote.id })}
              >
                <View style={styles.recentItemContent}>
                  <Text style={styles.recentItemTitle}>{quote.customer?.name || 'לקוח לא ידוע'}</Text>
                  <Text style={styles.recentItemDate}>
                    {new Date(quote.created_at).toLocaleDateString('he-IL')}
                  </Text>
                </View>
                <View style={styles.recentItemRight}>
                  <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(quote.status) }]}>
                    {getStatusText(quote.status)}
                  </Text>
                  <Text style={styles.recentItemValue}>{formatCurrency(quote.total)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>אין פעילות החודש</Text>
          )}
        </View>

        {/* Top Customers */}
        {dashboardData.topCustomers?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>לקוחות מובילים</Text>
            {dashboardData.topCustomers.map((customer, index) => (
              <View key={customer.name} style={styles.topItem}>
                <Text style={styles.topItemRank}>#{index + 1}</Text>
                <Text style={styles.topItemName}>{customer.name}</Text>
                <Text style={styles.topItemValue}>{formatCurrency(customer.total)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Quotes List Screen
function QuotesScreen({ session, navigation: navProp }) {
  const navigation = navProp || useNavigation();
  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, signed

  useEffect(() => {
    if (session?.user?.id) {
      loadQuotes();
    }
  }, [session]);

  // Reload quotes when screen comes into focus (e.g., after creating a new quote)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 QUOTES SCREEN FOCUSED - Reloading quotes...');
      if (session?.user?.id) {
        loadQuotes();
      } else {
        console.log('❌ No session user ID in useFocusEffect');
      }
    }, [session])
  );

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchQuery, filterStatus]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo quotes data');
        const demoData = getDemoData(session);
        setQuotes(demoData?.quotes || []);
        setLoading(false);
        return;
      }

      // Get business user ID and apply same safety logic as quote creation
      const rawBusinessUserId = await validateSessionAndGetBusinessUserId(session);
      const safeBusinessUserId = rawBusinessUserId === '100019258193212857278' ? null : rawBusinessUserId;

      console.log('Loading quotes with safe user ID:', safeBusinessUserId);
      console.log('Raw business user ID:', rawBusinessUserId);


      if (!rawBusinessUserId) {
        throw new Error('Could not find business user');
      }

      // Load quotes with customer information using safe user ID
      let quotesQuery = supabase
        .from('proposal')
        .select(`
          id,
          proposal_number,
          created_at,
          delivery_date,
          total,
          status,
          signature_status,
          signature_timestamp,
          signer_name,
          customer:customer (name, email, phone)
        `);

      // Filter by safe user ID (handle null case)
      if (safeBusinessUserId === null) {
        quotesQuery = quotesQuery.is('business_id', null);
      } else {
        quotesQuery = quotesQuery.eq('business_id', safeBusinessUserId);
      }

      const { data: quotesData, error: quotesError } = await quotesQuery
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error loading quotes from database:', quotesError);
        throw quotesError;
      }

      console.log('📋 Quotes loaded from database:', quotesData?.length || 0, 'quotes');
      console.log('📋 Quote data preview:', quotesData?.slice(0, 2));

      setQuotes(quotesData || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadQuotes();
  };

  const filterQuotes = () => {
    let filtered = quotes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(quote =>
        quote.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quote.proposal_number?.toString().includes(searchQuery) ||
        quote.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus === 'signed') {
      filtered = filtered.filter(quote => quote.signature_status === 'signed');
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(quote => !quote.signature_status || quote.signature_status === 'pending');
    }

    setFilteredQuotes(filtered);
  };

  const duplicateQuote = async (quoteId) => {
    try {
      // Get the quote to duplicate
      const { data: originalQuote, error: fetchError } = await supabase
        .from('proposal')
        .select('*, proposal_item(*)')
        .eq('id', quoteId)
        .single();

      if (fetchError) throw fetchError;

      // Get business user ID
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      // Create new quote
      const { data: newQuote, error: quoteError } = await supabase
        .from('proposal')
        .insert({
          business_id: businessUserId,
          customer_id: originalQuote.customer_id,
          total: originalQuote.total,
          status: 'pending',
          delivery_date: originalQuote.delivery_date,
          vat_percentage: originalQuote.vat_percentage
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // Duplicate quote items
      if (originalQuote.proposal_item && originalQuote.proposal_item.length > 0) {
        const newItems = originalQuote.proposal_item.map(item => ({
          proposal_id: newQuote.id,
          product_id: item.product_id,
          product_name: item.product_name,
          custom_name: item.custom_name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.notes
        }));

        const { error: itemsError } = await supabase
          .from('proposal_item')
          .insert(newItems);

        if (itemsError) throw itemsError;
      }

      Alert.alert('הצלחה', 'הצעת המחיר שוכפלה בהצלחה');
      loadQuotes();
    } catch (error) {
      console.error('Error duplicating quote:', error);
      Alert.alert('שגיאה', 'שגיאה בשכפול הצעת המחיר');
    }
  };

  const deleteQuote = async (quoteId) => {
    Alert.alert(
      'מחיקת הצעת מחיר',
      'האם אתה בטוח שברצונך למחוק הצעת מחיר זו?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete quote items first
              await supabase
                .from('proposal_item')
                .delete()
                .eq('proposal_id', quoteId);

              // Delete the quote
              const { error } = await supabase
                .from('proposal')
                .delete()
                .eq('id', quoteId);

              if (error) throw error;

              Alert.alert('הצלחה', 'הצעת המחיר נמחקה בהצלחה');
              loadQuotes();
            } catch (error) {
              console.error('Error deleting quote:', error);
              Alert.alert('שגיאה', 'שגיאה במחיקת הצעת המחיר');
            }
          }
        }
      ]
    );
  };

  const editQuote = (quoteId) => {
    navigation.navigate('EditQuote', { quoteId });
  };

  const toggleQuoteStatus = async (quoteId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'signed' ? 'pending' : 'signed';
      const updates = {
        signature_status: newStatus
      };

      // If marking as signed, add timestamp and signer name
      if (newStatus === 'signed') {
        updates.signature_timestamp = new Date().toISOString();
        updates.signer_name = 'אישור ידני';
      } else {
        // If marking as pending, clear signature info
        updates.signature_timestamp = null;
        updates.signer_name = null;
      }

      const { error } = await supabase
        .from('proposal')
        .update(updates)
        .eq('id', quoteId);

      if (error) throw error;

      Alert.alert('הצלחה', `הצעת המחיר עודכנה ל-${newStatus === 'signed' ? 'נחתם' : 'ממתין'}`);
      loadQuotes();
    } catch (error) {
      console.error('Error toggling quote status:', error);
      Alert.alert('שגיאה', 'שגיאה בעדכון סטטוס הצעת המחיר');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#62929e" />
        <Text style={styles.loadingText}>טוען הצעות מחיר...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.quotesHeader}>
            <View style={styles.quotesHeaderOverlay} />
            <View style={styles.headerTitleContainer}>
              <IconQuotes size={26} color="#fff" />
              <Text style={styles.themedHeaderTitle}>הצעות מחיר</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.centered}>
          <Text style={styles.errorText}>שגיאה: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuotes}>
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderRightActions = (progress, dragX, quote) => {
    const isSigned = quote.signature_status === 'signed';

    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, isSigned ? styles.swipeActionPending : styles.swipeActionSigned]}
          onPress={() => toggleQuoteStatus(quote.id, quote.signature_status)}
        >
          {isSigned ? (
            <>
              <Text style={styles.swipeActionIcon}>⏱</Text>
              <Text style={styles.swipeActionText}>ממתין</Text>
            </>
          ) : (
            <>
              <Text style={styles.swipeActionIcon}>✓</Text>
              <Text style={styles.swipeActionText}>נחתם</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionEdit]}
          onPress={() => editQuote(quote.id)}
        >
          <IconEdit color="#fff" size={24} />
          <Text style={styles.swipeActionText}>עריכה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDuplicate]}
          onPress={() => duplicateQuote(quote.id)}
        >
          <IconDuplicate color="#fff" size={24} />
          <Text style={styles.swipeActionText}>שכפול</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDelete]}
          onPress={() => deleteQuote(quote.id)}
        >
          <IconDelete color="#fff" size={24} />
          <Text style={styles.swipeActionText}>מחיקה</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderQuoteCard = ({ item: quote }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, quote)}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={styles.quoteCard}
        onPress={() => navigation.navigate('ViewQuote', { quoteId: quote.id })}
        activeOpacity={0.95}
      >
        <View style={styles.quoteCardContent}>
          <Text style={styles.quoteTotal}>
            ₪{Number(quote.total || 0).toLocaleString()}
          </Text>

          <View style={styles.quoteInfo}>
            <Text style={styles.quoteNumber}>
              #{quote.proposal_number || quote.id.slice(0,8)}
            </Text>
            <Text style={styles.quoteCustomer}>
              לקוח: {quote.customer?.name || 'לא צוין'}
            </Text>
            <Text style={styles.quoteDate}>
              נוצר: {new Date(quote.created_at).toLocaleDateString('he-IL')}
            </Text>
            {quote.delivery_date && (
              <Text style={styles.quoteDeliveryDate}>
                אספקה: {new Date(quote.delivery_date).toLocaleDateString('he-IL')}
              </Text>
            )}
            <Text style={[
              styles.quoteStatus,
              quote.signature_status === 'signed' ? styles.quoteStatusSigned : styles.quoteStatusPending
            ]}>
              סטטוס: {quote.signature_status === 'signed' ? 'נחתם ✓' : 'ממתין'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.quotesHeader}>
          <View style={styles.quotesHeaderOverlay} />
          <View style={styles.headerTitleContainer}>
            <IconQuotes size={26} color="#fff" />
            <Text style={styles.themedHeaderTitle}>הצעות מחיר</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateQuote')}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש הצעות מחיר..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'הכל' },
            { key: 'pending', label: 'ממתין' },
            { key: 'signed', label: 'נחתם' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterButton, filterStatus === filter.key && styles.filterButtonActive]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text style={[styles.filterButtonText, filterStatus === filter.key && styles.filterButtonTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredQuotes.length === 0 && !loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>אין הצעות מחיר</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'נסה חיפוש אחר' : 'צור הצעת מחיר ראשונה'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredQuotes}
          renderItem={renderQuoteCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.quotesList}
        />
      )}
    </View>
  );
}

// Settings Screen
function SettingsScreen({ session, onLogout }) {
  // ORIGINAL STATE (for rollback):
  // Just scroll view with both sections visible
  const [activeTab, setActiveTab] = useState('business'); // 'business' or 'profile'
  const [businessUser, setBusinessUser] = useState(null);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSettings, setEditedSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [accountTier, setAccountTier] = useState(null);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [totalQuotesCreated, setTotalQuotesCreated] = useState(0);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [upgradeRequest, setUpgradeRequest] = useState(null);
  const [requestingUpgrade, setRequestingUpgrade] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadBusinessUser();
      loadBusinessSettings();
      loadUserProfile();
      loadAccountTier();
      loadQuotaInfo();
      loadUpgradeRequestStatus();
      loadOfferings();
      // Initialize RevenueCat with user ID
      RevenueCatService.initialize(session.user.id);
    }
  }, [session]);

  const loadOfferings = async () => {
    try {
      const currentOffering = await RevenueCatService.getOfferings();
      setOfferings(currentOffering);
      console.log('RevenueCat offerings loaded:', currentOffering);
    } catch (error) {
      console.error('Error loading offerings:', error);
    }
  };

  const loadBusinessUser = async () => {
    try {
      console.log('🔍 loadBusinessUser: Starting...');
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      console.log('🔍 loadBusinessUser: businessUserId =', businessUserId);

      const { data: userData, error } = await supabase
        .from('settings')
        .select('business_name, business_email')
        .eq('business_id', businessUserId)
        .limit(1)
        .single();

      console.log('🔍 loadBusinessUser: userData =', userData, 'error =', error);

      if (!error && userData) {
        setBusinessUser({
          name: userData.business_name,
          email: userData.business_email
        });
      }
      console.log('🔍 loadBusinessUser: Complete');
    } catch (error) {
      console.error('❌ Error loading business user:', error);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      console.log('🔍 loadBusinessSettings: Starting...');
      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 Loading demo business settings for Apple Review');
        const demoData = getDemoData(session);
        if (demoData?.businessSettings) {
          setBusinessSettings(demoData.businessSettings);
          setEditedSettings(demoData.businessSettings);
        }
        return;
      }

      console.log('🔍 loadBusinessSettings: Calling validateSessionAndGetBusinessUserId...');
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      console.log('🔍 loadBusinessSettings: businessUserId =', businessUserId);
      if (!businessUserId) {
        console.log('⚠️ loadBusinessSettings: No businessUserId, returning early');
        return;
      }

      console.log('🔍 loadBusinessSettings: Querying settings table...');
      // Load from settings table (same as web app)
      const { data: businessData, error } = await supabase
        .from('settings')
        .select('business_name, business_email, business_phone, business_address, business_license, logo_url, header_color, pdf_template, total_quotes_created')
        .eq('business_id', businessUserId)
        .limit(1)
        .single();

      console.log('📊 Business settings loaded from settings table:', {
        error,
        hasData: !!businessData,
        logo_url: businessData?.logo_url,
        businessName: businessData?.business_name,
        totalQuotesCreated: businessData?.total_quotes_created,
        businessUserId
      });

      if (!error && businessData) {
        setBusinessSettings(businessData);
        setEditedSettings(businessData);
        setTotalQuotesCreated(businessData.total_quotes_created || 0);
      } else if (error) {
        console.error('Error loading settings:', error);
      }
      console.log('🔍 loadBusinessSettings: Complete');
    } catch (error) {
      console.error('❌ Error loading business settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      if (!businessUserId) {
        Alert.alert('שגיאה', 'לא ניתן לזהות את המשתמש');
        return;
      }

      const { error } = await supabase
        .from('settings')
        .update({
          business_name: editedSettings.business_name,
          business_email: editedSettings.business_email,
          business_phone: editedSettings.business_phone,
          business_address: editedSettings.business_address,
          business_license: editedSettings.business_license,
          header_color: editedSettings.header_color,
          logo_url: editedSettings.logo_url,
          pdf_template: editedSettings.pdf_template,
        })
        .eq('business_id', businessUserId);

      if (error) throw error;

      setBusinessSettings(editedSettings);
      setIsEditing(false);

      // Send Slack notification for profile completion
      const { SlackUserActivity } = require('./lib/slackService');
      SlackUserActivity.profileCompleted(
        session.user.email,
        editedSettings.business_name || 'לא צוין',
        !!editedSettings.logo_url
      );

      Alert.alert('הצלחה', 'הפרטים עודכנו בהצלחה');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('שגיאה', 'שגיאה בשמירת הפרטים');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSettings(businessSettings);
    setIsEditing(false);
  };

  const loadUserProfile = async () => {
    try {
      // Check if demo user
      if (isDemoUser(session)) {
        setUserProfile({
          email: session.user.email,
          display_name: 'Demo User',
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('supabase_auth_id', session.user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadAccountTier = async () => {
    try {
      // Check if demo user
      if (isDemoUser(session)) {
        setAccountTier({
          tier: 'demo',
          tier_name: 'demo',
          monthly_quote_limit: -1,
        });
        return;
      }

      const { data, error } = await supabase
        .from('account_tiers')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      console.log('Account tier query result:', { data, error });

      if (!error && data) {
        // Map tier to tier_name for consistency
        setAccountTier({
          ...data,
          tier_name: data.tier,
        });
      } else if (!data) {
        // No tier found - user might not have a tier assigned yet
        console.log('No account tier found for user - using default');
        setAccountTier({
          tier: 'free',
          tier_name: 'free',
          monthly_quote_limit: 10,
        });
      }
    } catch (error) {
      console.error('Error loading account tier:', error);
    }
  };

  const loadQuotaInfo = async () => {
    try {
      // Check if demo user
      if (isDemoUser(session)) {
        setQuotaInfo({
          current_count: 0,
          monthly_limit: -1,
          remaining_quotes: -1,
        });
        return;
      }

      const { data, error } = await supabase.rpc('check_user_quota', {
        p_auth_user_id: session.user.id,
      });

      if (!error && data && data[0]) {
        setQuotaInfo(data[0]);
      }
    } catch (error) {
      console.error('Error loading quota info:', error);
    }
  };

  const loadUpgradeRequestStatus = async () => {
    try {
      if (!session?.user?.id) return;

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/upgrade-request?authUserId=${session.user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpgradeRequest(data.request);
      }
    } catch (err) {
      console.error('Error loading upgrade request status:', err);
      // Don't show error to user, just fail silently
    }
  };

  const handlePurchase = async (packageId) => {
    setPurchasing(true);

    try {
      if (!offerings) {
        Alert.alert('שגיאה', 'החבילות לא נטענו. נסה שוב.');
        return;
      }

      // Get the package from offerings
      const pkg = offerings.availablePackages.find(p => p.identifier === packageId);
      if (!pkg) {
        Alert.alert('שגיאה', 'החבילה המבוקשת לא נמצאה.');
        return;
      }

      // Purchase the package
      const customerInfo = await RevenueCatService.purchasePackage(pkg);

      // Update account tier based on purchase
      const activeTier = RevenueCatService.getActiveSubscription(customerInfo);
      if (activeTier) {
        const tierName = activeTier === 'premium' ? 'Premium' : 'Business';
        Alert.alert('הצלחה', `המנוי ${tierName} הופעל בהצלחה!`);
        await loadAccountTier();
        await loadQuotaInfo();
      }
    } catch (err) {
      if (!err.userCancelled) {
        console.error('Error purchasing:', err);
        Alert.alert('שגיאה', 'שגיאה ברכישה: ' + err.message);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await RevenueCatService.restorePurchases();
      const activeTier = RevenueCatService.getActiveSubscription(customerInfo);

      if (activeTier) {
        const tierName = activeTier === 'premium' ? 'Premium' : 'Business';
        Alert.alert('הצלחה', `המנוי ${tierName} שוחזר בהצלחה!`);
        await loadAccountTier();
        await loadQuotaInfo();
      } else {
        Alert.alert('מידע', 'לא נמצאו רכישות קיימות.');
      }
    } catch (err) {
      console.error('Error restoring purchases:', err);
      Alert.alert('שגיאה', 'שגיאה בשחזור רכישות: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  const handleRequestUpgrade = async (tier) => {
    setRequestingUpgrade(true);

    try {
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/upgrade-request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            authUserId: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.full_name || session.user.email,
            requestedPlan: tier,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit upgrade request');
      }

      const tierName = tier === 'premium' ? 'Premium' : 'Business';
      Alert.alert('הצלחה', `בקשת השדרוג ל-${tierName} נשלחה בהצלחה! נחזור אליך בהקדם.`);
      await loadUpgradeRequestStatus();
    } catch (err) {
      console.error('Error requesting upgrade:', err);
      Alert.alert('שגיאה', 'שגיאה בשליחת בקשת השדרוג: ' + err.message);
    } finally {
      setRequestingUpgrade(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'מחיקת חשבון',
      'האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו אינה ניתנת לביטול.',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              const { deleteAccount } = require('./lib/auth');
              const result = await deleteAccount();

              if (result.success) {
                Alert.alert('הצלחה', 'החשבון נמחק בהצלחה');
              } else {
                Alert.alert('שגיאה', result.error?.message || 'שגיאה במחיקת החשבון');
              }
            } catch (error) {
              console.error('Delete account error:', error);
              Alert.alert('שגיאה', 'שגיאה במחיקת החשבון');
            }
          },
        },
      ]
    );
  };

  const handlePreviewTemplate = (templateId) => {
    // Generate sample quote data for preview
    const sampleQuote = {
      id: '12345',
      proposal_number: 'DEMO-001',
      created_at: new Date().toISOString(),
      delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      subtotal: 4274,
      vat_amount: 726,
      total: 5000,
      notes: 'זוהי הצעת מחיר לדוגמה',
      payment_terms: '30 יום',
      customer: {
        name: 'לקוח לדוגמה',
        email: 'customer@example.com',
        phone: '050-1234567',
        address: 'רחוב הדוגמה 1, תל אביב'
      },
      items: [
        { custom_name: 'מוצר לדוגמה 1', qty: 2, unit_price: 1000, line_total: 2000 },
        { custom_name: 'שירות לדוגמה 2', qty: 1, unit_price: 3000, line_total: 3000 }
      ]
    };

    const sampleBusiness = {
      business_name: businessSettings?.business_name || editedSettings?.business_name || 'שם העסק שלך',
      business_email: businessSettings?.business_email || editedSettings?.business_email || 'info@business.com',
      business_phone: businessSettings?.business_phone || editedSettings?.business_phone || '03-1234567',
      business_address: businessSettings?.business_address || editedSettings?.business_address || 'כתובת העסק',
      business_license: businessSettings?.business_license || editedSettings?.business_license || '123456789'
    };

    const html = generatePDFTemplate(
      templateId,
      sampleQuote,
      sampleBusiness,
      businessSettings?.logo_url || editedSettings?.logo_url || null,
      businessSettings?.header_color || editedSettings?.header_color || '#FDDC33'
    );

    setPreviewTemplate({ id: templateId, html });
  };

  const handleUploadLogo = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('שגיאה', 'נדרשת הרשאה לגישה לגלריה');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const imageUri = result.assets[0].uri;

      // Show loading
      Alert.alert('מעלה', 'מעלה לוגו...');

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Upload to Supabase Storage
      const fileExt = imageUri.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Convert base64 to blob for Supabase
      const base64Data = base64.split(',')[1];
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      const uploadBlob = new Blob([bytes], { type: `image/${fileExt}` });

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-logos')
        .upload(filePath, uploadBlob, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-logos')
        .getPublicUrl(filePath);

      // Update settings with new logo URL
      setEditedSettings({ ...editedSettings, logo_url: publicUrl });

      Alert.alert('הצלחה', 'הלוגו הועלה בהצלחה!');
    } catch (error) {
      console.error('Logo upload error:', error);
      Alert.alert('שגיאה', 'שגיאה בהעלאת הלוגו: ' + error.message);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.settingsHeader}>
          <View style={styles.settingsHeaderOverlay} />
          <View style={styles.headerTitleContainer}>
            <IconSettings size={26} color="#fff" />
            <Text style={styles.themedHeaderTitle}>הגדרות</Text>
          </View>
        {businessSettings && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            disabled={saving}
          >
            <Text style={styles.editButtonText}>
              {saving ? 'שומר...' : (isEditing ? 'שמור' : 'ערוך')}
            </Text>
          </TouchableOpacity>
        )}
        {isEditing && (
          <TouchableOpacity
            style={[styles.editButton, styles.cancelButton]}
            onPress={handleCancel}
            disabled={saving}
          >
            <Text style={styles.editButtonText}>ביטול</Text>
          </TouchableOpacity>
        )}
        </View>
      </SafeAreaView>

      {/* Tab Buttons */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'business' && styles.tabActive]}
          onPress={() => setActiveTab('business')}
        >
          <Text style={[styles.tabText, activeTab === 'business' && styles.tabTextActive]}>פרטי העסק</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>פרופיל משתמש</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        {/* Business Details Tab */}
        {activeTab === 'business' && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>פרטי העסק</Text>
          {businessSettings ? (
            <View style={styles.businessDetailsContainer}>
              {/* Business Logo */}
              <View style={styles.logoSection}>
                <Text style={styles.businessDetailLabel}>לוגו העסק:</Text>
                <View style={styles.logoContainer}>
                  {(editedSettings.logo_url || businessSettings.logo_url) ? (
                    <View style={styles.logoDisplayContainer}>
                      <Image
                        source={{ uri: editedSettings.logo_url || businessSettings.logo_url }}
                        style={styles.businessLogo}
                        resizeMode="contain"
                        onError={(e) => console.log('Logo load error:', e.nativeEvent.error)}
                        onLoad={() => console.log('Logo loaded successfully:', editedSettings.logo_url || businessSettings.logo_url)}
                      />
                    </View>
                  ) : (
                    <View style={styles.logoPlaceholder}>
                      <Text style={styles.logoPlaceholderText}>אין לוגו</Text>
                    </View>
                  )}
                  {isEditing && (
                    <TouchableOpacity
                      style={styles.uploadLogoButton}
                      onPress={handleUploadLogo}
                    >
                      <Text style={styles.uploadLogoButtonText}>
                        {(editedSettings.logo_url || businessSettings.logo_url) ? '📷 שנה לוגו' : '📷 העלה לוגו'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>שם העסק:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.businessDetailInput}
                    value={editedSettings.business_name || ''}
                    onChangeText={(text) => setEditedSettings({...editedSettings, business_name: text})}
                    placeholder="הכנס שם עסק"
                  />
                ) : (
                  <Text style={styles.businessDetailValue}>{businessSettings.business_name || 'לא צוין'}</Text>
                )}
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>אימייל:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.businessDetailInput}
                    value={editedSettings.business_email || ''}
                    onChangeText={(text) => setEditedSettings({...editedSettings, business_email: text})}
                    placeholder="הכנס אימייל"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.businessDetailValue}>{businessSettings.business_email || 'לא צוין'}</Text>
                )}
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>טלפון:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.businessDetailInput}
                    value={editedSettings.business_phone || ''}
                    onChangeText={(text) => setEditedSettings({...editedSettings, business_phone: text})}
                    placeholder="הכנס טלפון"
                    keyboardType="default"
                  />
                ) : (
                  <Text style={styles.businessDetailValue}>{businessSettings.business_phone || 'לא צוין'}</Text>
                )}
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>כתובת:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.businessDetailInput}
                    value={editedSettings.business_address || ''}
                    onChangeText={(text) => setEditedSettings({...editedSettings, business_address: text})}
                    placeholder="הכנס כתובת"
                  />
                ) : (
                  <Text style={styles.businessDetailValue}>{businessSettings.business_address || 'לא צוין'}</Text>
                )}
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>מס' רישיון:</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.businessDetailInput}
                    value={editedSettings.business_license || ''}
                    onChangeText={(text) => setEditedSettings({...editedSettings, business_license: text})}
                    placeholder="הכנס מספר רישיון"
                  />
                ) : (
                  <Text style={styles.businessDetailValue}>{businessSettings.business_license || 'לא צוין'}</Text>
                )}
              </View>

              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>צבע כותרת:</Text>
                {isEditing ? (
                  <View style={styles.colorPickerContainer}>
                    <ColorPalette
                      onChange={(color) => setEditedSettings({...editedSettings, header_color: color})}
                      value={editedSettings.header_color || '#FDDC33'}
                      colors={['#FDDC33', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#6c5ce7']}
                      title=""
                      icon=""
                      scaleToWindow={true}
                      paletteStyles={styles.colorPalette}
                    />
                    <View style={styles.selectedColorDisplay}>
                      <View style={[styles.colorPreview, { backgroundColor: editedSettings.header_color || '#FDDC33' }]} />
                      <Text style={styles.selectedColorText}>{editedSettings.header_color || '#FDDC33'}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={[styles.colorPreview, { backgroundColor: businessSettings.header_color }]} />
                    <Text style={styles.businessDetailValue}>{businessSettings.header_color || '#FDDC33'}</Text>
                  </>
                )}
              </View>

              {/* PDF Template Selection */}
              <View style={styles.businessDetailRow}>
                <Text style={styles.businessDetailLabel}>תבנית PDF:</Text>
                {isEditing ? (
                  <View style={styles.templateSelectionContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {Object.values(TEMPLATES).map((template) => (
                        <TouchableOpacity
                          key={template.id}
                          style={[
                            styles.templateOption,
                            editedSettings.pdf_template === template.id && styles.templateOptionSelected
                          ]}
                          onPress={() => setEditedSettings({...editedSettings, pdf_template: template.id})}
                        >
                          <Text style={[
                            styles.templateOptionName,
                            editedSettings.pdf_template === template.id && styles.templateOptionNameSelected
                          ]}>
                            {template.name}
                          </Text>
                          <Text style={styles.templateOptionDesc}>{template.description}</Text>

                          <TouchableOpacity
                            style={styles.previewButtonSmall}
                            onPress={() => handlePreviewTemplate(template.id)}
                          >
                            <Text style={styles.previewButtonSmallText}>👁 תצוגה</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <Text style={styles.businessDetailValue}>
                    {TEMPLATES[businessSettings.pdf_template || 'template1']?.name || 'קלאסי'}
                  </Text>
                )}
              </View>


              {!isEditing && (
                <View style={styles.desktopNotice}>
                  <Text style={styles.desktopNoticeSubtext}>
                    לחץ על "ערוך" כדי לעדכן את פרטי העסק
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.desktopNotice}>
              <Text style={styles.desktopNoticeText}>
                טוען פרטי העסק...
              </Text>
            </View>
          )}
          </View>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && session?.user && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>פרופיל משתמש</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>אימייל:</Text>
                <Text style={styles.profileValue}>{session.user.email}</Text>
              </View>

              {userProfile?.display_name && (
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>שם:</Text>
                  <Text style={styles.profileValue}>{userProfile.display_name}</Text>
                </View>
              )}

              {accountTier && (
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>רמת חשבון:</Text>
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierBadgeText}>
                      {accountTier.tier_name === 'free' ? 'חינם' :
                       accountTier.tier_name === 'pro' ? 'מקצועי' :
                       accountTier.tier_name === 'business' ? 'עסקי' :
                       accountTier.tier_name === 'demo' ? 'דמו' :
                       accountTier.tier_name}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>סה״כ הצעות מחיר שנוצרו:</Text>
                <Text style={styles.profileValue}>{totalQuotesCreated}</Text>
              </View>

              {quotaInfo && quotaInfo.monthly_limit > 0 && (
                <View style={styles.profileRow}>
                  <Text style={styles.profileLabel}>הצעות מחיר החודש:</Text>
                  <Text style={styles.profileValue}>
                    {quotaInfo.current_count} / {quotaInfo.monthly_limit}
                    {' '}
                    <Text style={styles.quotaRemainingSmall}>
                      ({quotaInfo.remaining_quotes} נותרו)
                    </Text>
                  </Text>
                </View>
              )}

              {/* Tier Selection / Upgrade Request Section */}
              {accountTier && !isDemoUser(session) && (
                <View style={styles.tierSelectionSection}>
                  <Text style={styles.tierSelectionTitle}>🚀 שדרוג חשבון</Text>
                  <Text style={styles.tierSelectionSubtitle}>
                    בחר את החבילה המתאימה לעסק שלך
                  </Text>

                  {/* Rejected Request Alert */}
                  {upgradeRequest?.status === 'rejected' && upgradeRequest.admin_notes && (
                    <View style={styles.rejectedAlert}>
                      <Text style={styles.rejectedAlertTitle}>הבקשה הקודמת נדחתה</Text>
                      <Text style={styles.rejectedAlertText}>{upgradeRequest.admin_notes}</Text>
                    </View>
                  )}

                  {/* Pending Request Alert */}
                  {upgradeRequest?.status === 'pending' && (
                    <View style={styles.pendingAlert}>
                      <Text style={styles.pendingAlertTitle}>
                        ⏳ בקשתך לשדרוג ל-{upgradeRequest.requested_plan === 'premium' ? 'Premium' : 'Business'} נבדקת על ידי האדמין
                      </Text>
                      <Text style={styles.pendingAlertText}>
                        תאריך שליחה: {new Date(upgradeRequest.created_at).toLocaleDateString('he-IL')}
                      </Text>
                      <Text style={styles.pendingAlertSubtext}>נחזור אליך בהקדם</Text>
                    </View>
                  )}

                  {/* Tier Cards - Horizontal Scroll */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tierCardsContainer}
                    style={styles.tierCardsScroll}
                  >
                    {/* Free Tier Card */}
                    <View style={[
                      styles.tierCard,
                      {
                        backgroundColor: '#f9fafb',
                        borderColor: accountTier.tier === 'free' ? '#6b7280' : '#e5e7eb',
                        borderWidth: accountTier.tier === 'free' ? 3 : 2,
                      }
                    ]}>
                      <Text style={[styles.tierName, { color: '#6b7280' }]}>Free</Text>
                      {accountTier.tier === 'free' && (
                        <View style={[styles.tierBadge, { backgroundColor: '#6b728020' }]}>
                          <Text style={[styles.tierBadgeText, { color: '#6b7280' }]}>
                            החבילה הנוכחית שלך ✓
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.tierPrice, { color: '#6b7280' }]}>₪0 / חודש</Text>
                      <View style={styles.tierDivider} />
                      <Text style={styles.tierQuota}>10 הצעות מחיר</Text>
                      <View style={styles.tierFeatures}>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>10 הצעות מחיר בחודש</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>יצוא PDF</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>ניהול לקוחות</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>קטלוג מוצרים</Text>
                        </View>
                      </View>
                      <Text style={styles.tierDescription}>מתאים למתחילים וטסטים</Text>
                      {accountTier.tier === 'free' && (
                        <View style={styles.currentTierBadge}>
                          <Text style={styles.currentTierText}>✓ בשימוש כעת</Text>
                        </View>
                      )}
                    </View>

                    {/* Premium Tier Card */}
                    <View style={[
                      styles.tierCard,
                      {
                        backgroundColor: '#f8f9ff',
                        borderColor: '#667eea',
                        borderWidth: accountTier.tier === 'premium' ? 3 : 2,
                      }
                    ]}>
                      <Text style={[styles.tierName, { color: '#667eea' }]}>Premium</Text>
                      <View style={[styles.tierBadge, { backgroundColor: '#667eea20' }]}>
                        <Text style={[styles.tierBadgeText, { color: '#667eea' }]}>
                          {accountTier.tier === 'premium' ? 'החבילה הנוכחית שלך ✓' : 'מומלץ 🔥'}
                        </Text>
                      </View>
                      <Text style={[styles.tierPrice, { color: '#667eea' }]}>₪59.90 / חודש</Text>
                      <View style={styles.tierDivider} />
                      <Text style={styles.tierQuota}>100 הצעות מחיר</Text>
                      <View style={styles.tierFeatures}>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>100 הצעות מחיר בחודש</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>כל תכונות Free</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>לוגו מותאם אישית</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>תבניות PDF מתקדמות</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>תמיכה מועדפת</Text>
                        </View>
                      </View>
                      <Text style={styles.tierDescription}>מתאים לעסקים קטנים-בינוניים</Text>
                      {accountTier.tier !== 'premium' && upgradeRequest?.status !== 'pending' && (
                        <TouchableOpacity
                          onPress={() => handlePurchase('premium')}
                          disabled={purchasing}
                          style={[
                            styles.tierButton,
                            { backgroundColor: purchasing ? '#ccc' : '#667eea' }
                          ]}
                        >
                          <Text style={styles.tierButtonText}>
                            {purchasing ? 'מעבד...' : 'רכישת Premium - ₪59.90/חודש'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {accountTier.tier === 'premium' && (
                        <View style={styles.currentTierBadge}>
                          <Text style={styles.currentTierText}>✓ בשימוש כעת</Text>
                        </View>
                      )}
                    </View>

                    {/* Business Tier Card */}
                    <View style={[
                      styles.tierCard,
                      {
                        backgroundColor: '#f0fdf4',
                        borderColor: '#22c55e',
                        borderWidth: accountTier.tier === 'business' ? 3 : 2,
                      }
                    ]}>
                      <Text style={[styles.tierName, { color: '#22c55e' }]}>Business</Text>
                      <View style={[styles.tierBadge, { backgroundColor: '#22c55e20' }]}>
                        <Text style={[styles.tierBadgeText, { color: '#22c55e' }]}>
                          {accountTier.tier === 'business' ? 'החבילה הנוכחית שלך ✓' : 'הכי משתלם 💎'}
                        </Text>
                      </View>
                      <Text style={[styles.tierPrice, { color: '#22c55e' }]}>₪149.90 / חודש</Text>
                      <View style={styles.tierDivider} />
                      <Text style={styles.tierQuota}>הצעות ללא הגבלה ∞</Text>
                      <View style={styles.tierFeatures}>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>הצעות ללא הגבלה ∞</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>כל תכונות Premium</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>ניהול צוות (בקרוב)</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>API גישה (בקרוב)</Text>
                        </View>
                        <View style={styles.tierFeatureRow}>
                          <Text style={styles.tierFeatureCheck}>✓</Text>
                          <Text style={styles.tierFeatureText}>תמיכה VIP</Text>
                        </View>
                      </View>
                      <Text style={styles.tierDescription}>מתאים לעסקים גדולים</Text>
                      {accountTier.tier !== 'business' && upgradeRequest?.status !== 'pending' && (
                        <TouchableOpacity
                          onPress={() => handlePurchase('business')}
                          disabled={purchasing}
                          style={[
                            styles.tierButton,
                            { backgroundColor: purchasing ? '#ccc' : '#22c55e' }
                          ]}
                        >
                          <Text style={styles.tierButtonText}>
                            {purchasing ? 'מעבד...' : 'רכישת Business - ₪149.90/חודש'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      {accountTier.tier === 'business' && (
                        <View style={styles.currentTierBadge}>
                          <Text style={styles.currentTierText}>✓ בשימוש כעת</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>

                  {/* Value Proposition */}
                  <View style={styles.valueProposition}>
                    <Text style={styles.valueText}>
                      💡 כל התשלומים מאובטחים | ביטול בכל עת | אין התחייבות
                    </Text>
                  </View>
                </View>
              )}

              {!isDemoUser(session) && (
                <TouchableOpacity
                  style={styles.deleteAccountButton}
                  onPress={handleDeleteAccount}
                >
                  <Text style={styles.deleteAccountText}>מחק חשבון</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          גרסה {Constants.expoConfig?.version || '1.0.0'} (Build {Constants.expoConfig?.ios?.buildNumber || '1'})
        </Text>
      </View>
      <TouchableOpacity
        style={[styles.settingItem, styles.logoutItem]}
        onPress={handleLogout}
      >
        <Text style={[styles.settingText, styles.logoutText]}>התנתק</Text>
      </TouchableOpacity>

      {/* Template Preview Modal */}
      {previewTemplate && (
        <Modal
          visible={true}
          animationType="slide"
          onRequestClose={() => setPreviewTemplate(null)}
        >
          <View style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'ios' ? 50 : 20 }}>
            <View style={{
              flexDirection: 'row-reverse',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 15,
              paddingTop: 15,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
              backgroundColor: '#fff'
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                textAlign: 'right',
                flex: 1
              }}>
                תצוגה מקדימה: {TEMPLATES[previewTemplate.id]?.name}
              </Text>
              <TouchableOpacity
                onPress={() => setPreviewTemplate(null)}
                style={{
                  padding: 12,
                  marginLeft: 10,
                  minWidth: 44,
                  minHeight: 44,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontSize: 24, color: '#666' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{ html: previewTemplate.html }}
              style={{ flex: 1 }}
              originWhitelist={['*']}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

// Catalog Screen
function CatalogScreen({ session, navigation: navProp }) {
  const navigation = navProp || useNavigation();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState(['all']);

  useEffect(() => {
    if (session?.user?.id) {
      loadProducts();
    }
  }, [session]);

  useFocusEffect(
    React.useCallback(() => {
      if (session?.user?.id) {
        loadProducts();
      }
    }, [session])
  );

  useEffect(() => {
    filterProducts();
  }, [products, searchQuery, selectedCategory]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo catalog data');
        const demoData = getDemoData(session);
        setProducts(demoData?.products || []);
        setLoading(false);
        return;
      }

      // Get business user ID
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      if (!businessUserId) {
        throw new Error('Could not find business user');
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('product')
        .select('id, category, name, unit_label, base_price, notes, options')
        .eq('business_id', businessUserId)
        .order('name', { ascending: true });

      if (productsError) {
        throw productsError;
      }

      setProducts(productsData || []);

      // Extract unique categories
      const uniqueCategories = ['all', ...new Set(productsData
        ?.map(p => p.category)
        .filter(c => c && c.trim())
        .sort() || [])];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error loading products:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };

  const deleteProduct = async (productId) => {
    Alert.alert(
      'מחיקת מוצר',
      'האם אתה בטוח שברצונך למחוק מוצר זה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('product')
                .delete()
                .eq('id', productId);

              if (error) throw error;

              Alert.alert('הצלחה', 'המוצר נמחק בהצלחה');
              loadProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('שגיאה', 'שגיאה במחיקת המוצר');
            }
          }
        }
      ]
    );
  };

  const editProduct = (productId) => {
    navigation.navigate('ProductEditor', { productId });
  };

  const duplicateProduct = async (productId) => {
    try {
      const { data: originalProduct, error: fetchError } = await supabase
        .from('product')
        .select('*')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      const { data: newProduct, error: insertError } = await supabase
        .from('product')
        .insert({
          name: `${originalProduct.name} (עותק)`,
          category: originalProduct.category,
          unit_label: originalProduct.unit_label,
          base_price: originalProduct.base_price,
          notes: originalProduct.notes,
          options: originalProduct.options,
          business_id: businessUserId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      Alert.alert('הצלחה', 'המוצר שוכפל בהצלחה');
      loadProducts();
    } catch (error) {
      console.error('Error duplicating product:', error);
      Alert.alert('שגיאה', 'שגיאה בשכפול המוצר');
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };


  const renderCatalogRightActions = (progress, dragX, productId) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionEdit]}
          onPress={() => editProduct(productId)}
        >
          <IconEdit color="#fff" size={24} />
          <Text style={styles.swipeActionText}>עריכה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDuplicate]}
          onPress={() => duplicateProduct(productId)}
        >
          <IconDuplicate color="#fff" size={24} />
          <Text style={styles.swipeActionText}>שכפול</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDelete]}
          onPress={() => deleteProduct(productId)}
        >
          <IconDelete color="#fff" size={24} />
          <Text style={styles.swipeActionText}>מחיקה</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductCard = ({ item: product }) => {
    const availableOptions = parseOptions(product.options);

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderCatalogRightActions(progress, dragX, product.id)}
        overshootRight={false}
        rightThreshold={40}
      >
        <TouchableOpacity style={styles.productCard} activeOpacity={0.95}>
          <View style={styles.productHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.notes && (
                <Text style={styles.productDescription} numberOfLines={2}>
                  {product.notes}
                </Text>
              )}
              {product.category && (
                <Text style={styles.productCategory}>{product.category}</Text>
              )}
              {availableOptions.length > 0 && (
                <View style={styles.optionsContainer}>
                  <Text style={styles.optionsLabel}>אפשרויות זמינות:</Text>
                  <View style={styles.optionsTags}>
                    {availableOptions.slice(0, 3).map((option, index) => (
                      <Text key={index} style={styles.optionTag}>
                        {option}
                      </Text>
                    ))}
                    {availableOptions.length > 3 && (
                      <Text style={styles.optionTag}>
                        +{availableOptions.length - 3} נוספות
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productPrice}>
              ₪{Number(product.base_price || 0).toLocaleString()}
            </Text>
            {product.unit_label && (
              <Text style={styles.productUnit}>יחידה: {product.unit_label}</Text>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#62929e" />
        <Text style={styles.loadingText}>טוען מוצרים...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeHeader}>
          <View style={styles.catalogHeader}>
            <View style={styles.catalogHeaderOverlay} />
            <View style={styles.headerTitleContainer}>
              <IconCatalog size={26} color="#fff" />
              <Text style={styles.themedHeaderTitle}>קטלוג מוצרים</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.centered}>
          <Text style={styles.errorText}>שגיאה: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProducts}>
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.catalogHeader}>
          <View style={styles.catalogHeaderOverlay} />
          <View style={styles.headerTitleContainer}>
            <IconCatalog size={26} color="#fff" />
            <Text style={styles.themedHeaderTitle}>קטלוג מוצרים</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ProductEditor', {})}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש מוצרים..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <ScrollView horizontal style={styles.filterContainer} showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.filterButton, selectedCategory === category && styles.filterButtonActive]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.filterButtonText, selectedCategory === category && styles.filterButtonTextActive]}>
                {category === 'all' ? 'הכל' : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredProducts.length === 0 && !loading ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>אין מוצרים</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery ? 'נסה חיפוש אחר' : 'הוסף מוצר ראשון'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.productsList}
        />
      )}
    </View>
  );
}

// Create Quote Screen
function CreateQuoteScreen({ navigation, session, route }) {
  const preselectedCustomer = route?.params?.preselectedCustomer;
  const [step, setStep] = useState(preselectedCustomer ? 2 : 1); // 1: Customer, 2: Products, 3: Review
  const [customer, setCustomer] = useState(
    preselectedCustomer
      ? {
          name: preselectedCustomer.name || '',
          email: preselectedCustomer.email || '',
          phone: preselectedCustomer.phone || '',
          address: preselectedCustomer.address || ''
        }
      : { name: '', email: '', phone: '', address: '' }
  );
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [showGeneralItemModal, setShowGeneralItemModal] = useState(false);
  const [editingGeneralItem, setEditingGeneralItem] = useState(null);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [generalItemForm, setGeneralItemForm] = useState({ name: '', price: 0, quantity: 1, notes: '' });
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomer?.id || null);
  const [isNewCustomer, setIsNewCustomer] = useState(!preselectedCustomer);

  // Quote fields
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryDateObject, setDeliveryDateObject] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('מזומן / העברה בנקאית / שוטף +30');
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [vatRate, setVatRate] = useState(18);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  const loadProducts = async () => {
    try {
      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo products for quote creation');
        const demoData = getDemoData(session);
        setProducts(demoData?.products || []);
        return;
      }

      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      const { data: productsData, error } = await supabase
        .from('product')
        .select('id, category, name, unit_label, base_price, notes, options')
        .eq('business_id', businessUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      Alert.alert('שגיאה', 'שגיאה בטעינת המוצרים');
    }
  };

  const loadCustomers = async () => {
    try {
      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo customers data');
        const demoData = getDemoData(session);
        setCustomers(demoData?.customers || []);
        return;
      }

      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      const { data: customersData, error } = await supabase
        .from('customer')
        .select('id, name, email, phone')
        .eq('business_id', businessUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(customersData || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectExistingCustomer = (customerId) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setCustomer({
        name: selectedCustomer.name,
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone || ''
      });
      setSelectedCustomerId(customerId);
      setIsNewCustomer(false);
    }
  };

  const selectNewCustomer = () => {
    setCustomer({ name: '', email: '', phone: '' });
    setSelectedCustomerId(null);
    setIsNewCustomer(true);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setDeliveryDateObject(selectedDate);
      setDeliveryDate(selectedDate.toISOString().split('T')[0]);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const getNextProposalNumber = async (businessUserId) => {
    try {
      console.log('Generating proposal number for user:', businessUserId);

      // Get count of existing proposals for this user
      const { count, error: countError } = await supabase
        .from('proposal')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessUserId);

      if (countError) {
        console.error('Error counting existing proposals:', countError);
        // Fallback to simple timestamp
        const simpleNum = Math.floor(Date.now() / 1000) % 1000000; // Keep it small
        return simpleNum.toString();
      }

      // Use simple sequential numbering: 1, 2, 3, etc.
      const nextNumber = (count || 0) + 1;
      console.log('Generated simple proposal number:', nextNumber);

      // Ensure it fits in integer range (it definitely will with sequential numbers)
      if (nextNumber > 2147483647) {
        console.warn('Sequential number somehow too large, using fallback');
        const simpleNum = Math.floor(Date.now() / 1000) % 1000000;
        return simpleNum.toString();
      }

      return nextNumber.toString();
    } catch (error) {
      console.error('Error in getNextProposalNumber:', error);
      // Use a small timestamp-based number
      const simpleNum = Math.floor(Date.now() / 1000) % 1000000;
      return simpleNum.toString();
    }
  };

  const addProduct = (product) => {
    // Check if product has options
    const availableOptions = parseOptions(product.options);
    if (availableOptions.length > 0) {
      // Show options modal for selection
      setSelectedProduct(product);
      setSelectedOptions([]);
      setShowOptionsModal(true);
    } else {
      // Add product directly without options
      addProductWithOptions(product, []);
    }
  };

  const addGeneralItem = () => {
    setGeneralItemForm({ name: 'פריט כללי', price: 0, quantity: 1, notes: '' });
    setEditingGeneralItem(null);
    setShowGeneralItemModal(true);
  };

  const handleSaveGeneralItem = () => {
    if (!generalItemForm.name.trim()) {
      Alert.alert('שגיאה', 'יש להזין שם למוצר');
      return;
    }

    if (editingGeneralItem !== null) {
      // Editing existing item
      const updated = [...selectedProducts];
      updated[editingGeneralItem] = {
        ...updated[editingGeneralItem],
        name: generalItemForm.name,
        base_price: generalItemForm.price,
        quantity: generalItemForm.quantity,
        notes: generalItemForm.notes
      };
      setSelectedProducts(updated);
    } else {
      // Adding new item
      const generalItem = {
        id: generateUUID(),
        name: generalItemForm.name,
        base_price: generalItemForm.price,
        quantity: generalItemForm.quantity,
        notes: generalItemForm.notes,
        isGeneral: true,
        isCustom: true,
        selectedOptions: [],
        optionsText: ''
      };
      setSelectedProducts([...selectedProducts, generalItem]);
    }

    setShowGeneralItemModal(false);
    setGeneralItemForm({ name: '', price: 0, quantity: 1, notes: '' });
    setEditingGeneralItem(null);
  };

  const editGeneralItem = (index) => {
    const item = selectedProducts[index];
    if (item.isGeneral) {
      setGeneralItemForm({
        name: item.name,
        price: item.base_price,
        quantity: item.quantity,
        notes: item.notes || ''
      });
      setEditingGeneralItem(index);
      setShowGeneralItemModal(true);
    }
  };

  const editProduct = (index) => {
    const item = selectedProducts[index];
    if (!item.isGeneral) {
      // Set up for editing
      setEditingProductIndex(index);
      setSelectedProduct(item);
      setSelectedOptions(item.selectedOptions || []);
      setNotes(item.notes || '');
      setShowOptionsModal(true);
    }
  };

  const addProductWithOptions = (product, selectedOpts) => {
    if (editingProductIndex !== null) {
      // Editing existing product
      const updated = [...selectedProducts];
      updated[editingProductIndex] = {
        ...updated[editingProductIndex],
        selectedOptions: selectedOpts,
        optionsText: selectedOpts.length > 0 ? selectedOpts.join(', ') : '',
        notes: notes
      };
      setSelectedProducts(updated);
      setEditingProductIndex(null);
    } else {
      // Adding new product
      const existingIndex = selectedProducts.findIndex(p =>
        p.id === product.id &&
        JSON.stringify(p.selectedOptions || []) === JSON.stringify(selectedOpts) &&
        (p.notes || '') === (notes || '')
      );

      if (existingIndex >= 0) {
        const updated = [...selectedProducts];
        updated[existingIndex].quantity += 1;
        setSelectedProducts(updated);
      } else {
        setSelectedProducts([...selectedProducts, {
          ...product,
          quantity: 1,
          selectedOptions: selectedOpts,
          optionsText: selectedOpts.length > 0 ? selectedOpts.join(', ') : '',
          notes: notes
        }]);
      }
    }

    // Close options modal
    setShowOptionsModal(false);
    setSelectedProduct(null);
    setSelectedOptions([]);
    setNotes('');
    setEditingProductIndex(null);
  };

  const toggleOption = (option) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(opt => opt !== option)
        : [...prev, option]
    );
  };

  const updateProductQuantity = (productKey, quantity) => {
    if (quantity <= 0) {
      const index = parseInt(productKey.split('-').pop());
      setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    } else {
      const index = parseInt(productKey.split('-').pop());
      setSelectedProducts(selectedProducts.map((p, i) =>
        i === index ? { ...p, quantity } : p
      ));
    }
  };

  // Calculations
  const grossSubtotal = selectedProducts.reduce((sum, item) => sum + (item.base_price * item.quantity), 0);
  const vatFactor = 1 + (vatRate / 100);
  const netSubtotal = grossSubtotal / vatFactor;
  const discountValue = discountType === 'percentage'
    ? netSubtotal * (discountPct / 100)
    : discountAmount;
  const netAfterDiscount = Math.max(0, netSubtotal - discountValue);
  const vatAmount = netAfterDiscount * (vatRate / 100);
  const total = netAfterDiscount + vatAmount;

  // Generate proper UUID helper
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const createQuote = async () => {
    console.log('🔥 CREATE QUOTE BUTTON PRESSED 🔥');
    try {
      setLoading(true);

      console.log('=== CREATE QUOTE DEBUG START ===');
      console.log('Customer:', customer);
      console.log('Selected products:', selectedProducts);
      console.log('VAT rate:', vatRate);
      console.log('Discount type:', discountType);
      console.log('Discount percentage:', discountPct);
      console.log('Discount amount:', discountAmount);
      console.log('Total calculated:', total);
      console.log('Selected customer ID:', selectedCustomerId);
      console.log('Is new customer:', isNewCustomer);

      // Validation checks
      if (!session?.user?.id) {
        console.log('ERROR: No session user ID');
        Alert.alert('שגיאה', 'אנא התחבר מחדש למערכת');
        setLoading(false);
        return;
      }

      if (isNewCustomer && (!customer.name || customer.name.trim() === '')) {
        console.log('ERROR: New customer missing name');
        Alert.alert('שגיאה', 'יש למלא שם לקוח');
        setLoading(false);
        return;
      }

      if (!isNewCustomer && !selectedCustomerId) {
        console.log('ERROR: No customer selected');
        Alert.alert('שגיאה', 'יש לבחור לקוח');
        setLoading(false);
        return;
      }

      if (selectedProducts.length === 0) {
        console.log('ERROR: No products selected');
        Alert.alert('שגיאה', 'יש לבחור לפחות מוצר אחד');
        setLoading(false);
        return;
      }

      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      let customerData;

      if (selectedCustomerId && !isNewCustomer) {
        // Use existing customer
        const { data: existingCustomer, error: customerError } = await supabase
          .from('customer')
          .select('*')
          .eq('id', selectedCustomerId)
          .single();

        if (customerError) throw customerError;
        customerData = existingCustomer;
      } else {
        // Create new customer with explicit UUID
        const customerUUID = generateUUID();
        console.log('Creating customer with UUID:', customerUUID);

        // Check if businessUserId is the problematic value
        console.log('Creating customer with businessUserId:', businessUserId);
        console.log('businessUserId type:', typeof businessUserId);
        console.log('businessUserId length:', businessUserId?.toString().length);

        const safeUserId = businessUserId === '100019258193212857278' ? null : businessUserId;
        console.log('Using safe user ID:', safeUserId);

        const { data: newCustomer, error: customerError } = await supabase
          .from('customer')
          .insert({
            id: customerUUID, // Use explicit UUID
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            business_id: safeUserId // Use safe user ID
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerData = newCustomer;
      }

      if (!deliveryDate) {
        Alert.alert('שגיאה', 'יש לבחור תאריך משלוח');
        setLoading(false);
        return;
      }

      // Generate simple string-based proposal number
      const proposalNumber = `Q${Date.now().toString().slice(-5)}`;
      console.log('Using string proposal number:', proposalNumber);

      // Debug values before inserting
      console.log('=== QUOTE INSERT DEBUG ===');
      console.log('business_id:', businessUserId, typeof businessUserId);
      console.log('customer_id:', customerData.id, typeof customerData.id);
      console.log('customer_id length:', customerData.id?.toString().length);
      console.log('customer_id equals problem number?', customerData.id?.toString() === '100019258193212857278');
      console.log('customerData full:', customerData);
      console.log('proposal_number:', proposalNumber, typeof proposalNumber);
      console.log('netSubtotal:', netSubtotal);
      console.log('discountValue:', discountValue);
      console.log('vatRate:', vatRate);
      console.log('vatAmount:', vatAmount);
      console.log('total:', total);

      // Ensure all numerical values are within MUCH smaller integer range to be super safe
      const safeSubtotal = Math.min(Math.max(0, Math.floor(netSubtotal || 0)), 1000000);
      const safeDiscountValue = Math.min(Math.max(0, Math.floor(discountValue || 0)), 1000000);
      const safeVatAmount = Math.min(Math.max(0, Math.floor(vatAmount || 0)), 1000000);
      const safeTotal = Math.min(Math.max(0, Math.floor(total || 0)), 1000000);
      const safeVatRate = Math.min(Math.max(0, Math.floor(vatRate || 18)), 100);

      console.log('Safe values:');
      console.log('safeSubtotal:', safeSubtotal);
      console.log('safeDiscountValue:', safeDiscountValue);
      console.log('safeVatAmount:', safeVatAmount);
      console.log('safeTotal:', safeTotal);

      // Check if any of these values are the problematic 21-digit number
      const problemValue = '100019258193212857278';
      console.log('=== CHECKING FOR PROBLEM VALUE ===');
      console.log('businessUserId equals problem?', businessUserId === problemValue);
      console.log('customerData.id equals problem?', customerData.id === problemValue);
      console.log('proposalNumber equals problem?', proposalNumber === problemValue);
      console.log('safeSubtotal equals problem?', safeSubtotal.toString() === problemValue);
      console.log('safeTotal equals problem?', safeTotal.toString() === problemValue);

      // Generate proper UUID for the proposal
      const proposalId = generateUUID();
      console.log('Using proper UUID:', proposalId);

      // Use safe user ID for proposal as well
      const safeBusinessUserId = businessUserId === '100019258193212857278' ? null : businessUserId;
      console.log('Using safe business user ID for proposal:', safeBusinessUserId);


      console.log('📝 About to insert proposal with business_id:', safeBusinessUserId);

      const { data: quoteData, error: quoteError } = await supabase
        .from('proposal')
        .insert({
          id: proposalId, // Use proper UUID
          business_id: safeBusinessUserId,
          customer_id: customerData.id,
          proposal_number: proposalNumber,
          delivery_date: deliveryDate,
          payment_terms: paymentTerms,
          notes: notes,
          subtotal: safeSubtotal,
          discount_value: safeDiscountValue,
          include_discount_row: discountValue > 0,
          vat_rate: safeVatRate,
          vat_amount: safeVatAmount,
          total: safeTotal,
          status: 'pending'
        })
        .select()
        .single();

      console.log('✅ Proposal inserted, checking counter...');

      // Check if the counter was incremented
      const { data: settingsCheck, error: settingsError } = await supabase
        .from('settings')
        .select('monthly_quotes_created, total_quotes_created, business_id')
        .eq('business_id', safeBusinessUserId)
        .limit(1)
        .single();

      console.log('📊 Settings after quote creation:', {
        business_id: settingsCheck?.business_id,
        monthly_quotes_created: settingsCheck?.monthly_quotes_created,
        total_quotes_created: settingsCheck?.total_quotes_created,
        settingsError
      });

      if (quoteError) {
        console.error('=== QUOTE INSERT ERROR ===');
        console.error('Error:', quoteError);
        console.error('Error code:', quoteError.code);
        console.error('Error message:', quoteError.message);
        console.error('Error details:', quoteError.details);
        console.error('Error hint:', quoteError.hint);

        // Try absolutely minimal insertion
        console.log('Attempting ultra-minimal quote creation...');
        try {
          const { data: minimalQuote, error: minimalError } = await supabase
            .from('proposal')
            .insert({
              status: 'pending',
              total: 1
            })
            .select()
            .single();

          console.log('Minimal quote creation result:', minimalQuote, minimalError);
        } catch (testError) {
          console.error('Even minimal quote failed:', testError);
        }

        // Try inserting into a different table to test if it's proposal-specific
        console.log('Testing customer table insertion...');
        console.log('businessUserId for customer test:', businessUserId, typeof businessUserId);
        console.log('businessUserId length:', businessUserId?.toString().length);
        console.log('businessUserId equals problem?', businessUserId?.toString() === '100019258193212857278');

        try {
          const { data: testCustomer, error: customerError } = await supabase
            .from('customer')
            .insert({
              name: 'Test Customer',
              business_id: businessUserId === '100019258193212857278' ? null : businessUserId // Block specific problematic value
            })
            .select()
            .single();

          console.log('Customer test result:', testCustomer, customerError);
        } catch (testError) {
          console.error('Customer test failed:', testError);
        }

        throw quoteError;
      }

      // Ensure all products exist in the database before creating quote items
      console.log('🔍 Checking if products exist in database...');
      const productIds = await Promise.all(selectedProducts.map(async (item) => {
        // If product has no ID or invalid ID, create it in the database
        if (!item.id || item.id.toString().length >= 50) {
          console.log('⚠️ Product has no valid ID, creating in database:', item.name);
          const { data: newProduct, error: createError } = await supabase
            .from('product')
            .insert({
              business_id: businessUserId,
              category: item.category || 'כללי',
              name: item.name,
              unit_label: item.unit_label || 'יחידה',
              base_price: item.base_price || 0,
              notes: item.notes || '',
              options: item.options || []
            })
            .select('id')
            .single();

          if (createError) {
            console.error('❌ Failed to create product:', createError);
            throw createError;
          }

          console.log('✅ Created product with ID:', newProduct.id);
          return { originalItem: item, productId: newProduct.id };
        }

        // Check if product exists in database
        const { data: existingProduct, error: checkError } = await supabase
          .from('product')
          .select('id')
          .eq('id', item.id)
          .eq('business_id', businessUserId)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Error checking product:', checkError);
          throw checkError;
        }

        if (!existingProduct) {
          // Product doesn't exist, create it
          console.log('⚠️ Product ID not found in database, creating:', item.id, item.name);
          const { data: newProduct, error: createError } = await supabase
            .from('product')
            .insert({
              business_id: businessUserId,
              category: item.category || 'כללי',
              name: item.name,
              unit_label: item.unit_label || 'יחידה',
              base_price: item.base_price || 0,
              notes: item.notes || '',
              options: item.options || []
            })
            .select('id')
            .single();

          if (createError) {
            console.error('❌ Failed to create product:', createError);
            throw createError;
          }

          console.log('✅ Created product with new ID:', newProduct.id);
          return { originalItem: item, productId: newProduct.id };
        }

        console.log('✅ Product exists:', existingProduct.id);
        return { originalItem: item, productId: existingProduct.id };
      }));

      // Add quote items with safe numerical values and verified product IDs
      const items = productIds.map(({ originalItem: item, productId }) => {
        const optionsText = item.optionsText || '';
        const itemNotes = item.notes || '';
        const safeUnitPrice = Math.min(Math.max(0, Math.floor(item.base_price || 0)), 2147483647);
        const safeQuantity = Math.min(Math.max(1, Math.floor(item.quantity || 1)), 10000);
        const safeLineTotal = Math.min(safeUnitPrice * safeQuantity, 2147483647);

        // Combine item notes with options text
        let combinedNotes = '';
        if (itemNotes && optionsText) {
          combinedNotes = `${itemNotes}\nאפשרויות: ${optionsText}`;
        } else if (itemNotes) {
          combinedNotes = itemNotes;
        } else if (optionsText) {
          combinedNotes = `אפשרויות: ${optionsText}`;
        }

        console.log('Item debug:', {
          name: item.name,
          productId,
          originalPrice: item.base_price,
          safeUnitPrice,
          originalQuantity: item.quantity,
          safeQuantity,
          safeLineTotal,
          itemNotes,
          optionsText,
          combinedNotes
        });

        return {
          proposal_id: quoteData.id,
          product_id: productId,
          product_name: item.name,
          custom_name: item.name,
          qty: safeQuantity,
          unit_price: safeUnitPrice,
          line_total: safeLineTotal,
          notes: combinedNotes
        };
      });

      console.log('=== ITEMS DEBUG ===');
      console.log('Quote data ID:', quoteData.id, typeof quoteData.id);
      console.log('Quote data:', quoteData);
      console.log('About to insert items:', items);
      console.log('Number of items to insert:', items.length);
      console.log('Sample item being saved:', items[0]);
      console.log('Item field names:', items[0] ? Object.keys(items[0]) : 'No items');

      const { error: itemsError } = await supabase
        .from('proposal_item')
        .insert(items);

      if (itemsError) {
        console.error('=== ITEMS INSERT ERROR ===');
        console.error('Error:', itemsError);
        console.error('Error code:', itemsError.code);
        console.error('Error message:', itemsError.message);
        console.error('Error details:', itemsError.details);
        throw itemsError;
      }

      console.log('✅ Quote created successfully! Quote ID:', quoteData.id);
      console.log('✅ Quote data:', quoteData);

      // Send Slack notification for quote creation
      const { SlackQuoteActivity } = require('./lib/slackService');
      SlackQuoteActivity.quoteCreated(
        session.user.email,
        proposalNumber,
        customerData.name,
        safeTotal
      );

      // Track quote creation for review prompt
      trackQuoteCreated();

      Alert.alert('הצלחה', 'הצעת המחיר נוצרה בהצלחה!');
      navigation.goBack();

    } catch (error) {
      console.error('=== FINAL CATCH ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error object:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה ביצירת הצעת המחיר');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>פרטי לקוח</Text>

      {customers.length > 0 && (
        <View style={styles.customerSelectionContainer}>
          <Text style={styles.fieldLabel}>בחר לקוח קיים או צור חדש:</Text>

          <View style={styles.customerOptionsContainer}>
            <TouchableOpacity
              style={[
                styles.customerOptionButton,
                !isNewCustomer && selectedCustomerId === null && styles.customerOptionButtonActive
              ]}
              onPress={selectNewCustomer}
            >
              <Text style={[
                styles.customerOptionText,
                !isNewCustomer && selectedCustomerId === null && styles.customerOptionTextActive
              ]}>
                לקוח חדש
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.existingCustomersContainer} showsVerticalScrollIndicator={false}>
            {customers.map((existingCustomer) => (
              <TouchableOpacity
                key={existingCustomer.id}
                style={[
                  styles.existingCustomerItem,
                  selectedCustomerId === existingCustomer.id && styles.existingCustomerItemSelected
                ]}
                onPress={() => selectExistingCustomer(existingCustomer.id)}
              >
                <Text style={[
                  styles.existingCustomerName,
                  selectedCustomerId === existingCustomer.id && styles.existingCustomerNameSelected
                ]}>
                  {existingCustomer.name}
                </Text>
                {existingCustomer.email && (
                  <Text style={[
                    styles.existingCustomerDetails,
                    selectedCustomerId === existingCustomer.id && styles.existingCustomerDetailsSelected
                  ]}>
                    {existingCustomer.email}
                  </Text>
                )}
                {existingCustomer.phone && (
                  <Text style={[
                    styles.existingCustomerDetails,
                    selectedCustomerId === existingCustomer.id && styles.existingCustomerDetailsSelected
                  ]}>
                    {existingCustomer.phone}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {(isNewCustomer || customers.length === 0) && (
        <View>
          <Text style={styles.fieldLabel}>פרטי לקוח חדש:</Text>
          <TextInput
            style={styles.input}
            placeholder="שם הלקוח"
            value={customer.name}
            onChangeText={(text) => setCustomer({...customer, name: text})}
          />
          <TextInput
            style={styles.input}
            placeholder="אימייל"
            value={customer.email}
            onChangeText={(text) => setCustomer({...customer, email: text})}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="טלפון"
            value={customer.phone}
            onChangeText={(text) => setCustomer({...customer, phone: text})}
            keyboardType="default"
          />
          <TextInput
            style={styles.input}
            placeholder="כתובת"
            value={customer.address}
            onChangeText={(text) => setCustomer({...customer, address: text})}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.nextButton, (!customer.name && !selectedCustomerId) && styles.nextButtonDisabled]}
        onPress={() => setStep(2)}
        disabled={!customer.name && !selectedCustomerId}
      >
        <Text style={styles.nextButtonText}>הבא</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>בחירת מוצרים</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="חיפוש מוצרים..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.step2Content}>
        {/* Selected Products Section - Fixed Height */}
        <View style={styles.selectedProductsSection}>
          <Text style={styles.selectedTitle}>מוצרים נבחרים ({selectedProducts.length})</Text>
          <ScrollView style={styles.selectedProductsScrollView}>
            {selectedProducts.map((item, index) => (
              <TouchableOpacity
                key={`${item.id}-${index}`}
                style={styles.selectedProductItem}
                onPress={() => item.isGeneral ? editGeneralItem(index) : editProduct(index)}
              >
                <View style={styles.selectedProductInfo}>
                  <Text style={[styles.selectedProductName, item.isGeneral && styles.generalItemText]}>
                    {item.name}
                    <Text style={styles.editHint}> (לחץ לעריכה)</Text>
                  </Text>
                  {item.optionsText && (
                    <Text style={styles.selectedProductOptions}>
                      אפשרויות: {item.optionsText}
                    </Text>
                  )}
                  {item.notes && (
                    <Text style={styles.selectedProductNotes}>
                      הערות: {item.notes}
                    </Text>
                  )}
                </View>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity
                    onPress={() => updateProductQuantity(`${item.id}-${index}`, item.quantity - 1)}
                    style={styles.quantityButton}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  <TouchableOpacity
                    onPress={() => updateProductQuantity(`${item.id}-${index}`, item.quantity + 1)}
                    style={styles.quantityButton}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                  <Text style={styles.itemTotal}>₪{(item.base_price * item.quantity).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Catalog Section - Flexible Height */}
        <View style={styles.catalogSection}>
          <Text style={styles.catalogTitle}>קטלוג מוצרים</Text>
          <TouchableOpacity
            style={styles.addGeneralItemButton}
            onPress={addGeneralItem}
          >
            <Text style={styles.addGeneralItemButtonText}>+ פריט כללי</Text>
          </TouchableOpacity>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productItem}
                onPress={() => addProduct(item)}
              >
                <Text style={styles.productItemName}>{item.name}</Text>
                <Text style={styles.productItemPrice}>₪{item.base_price.toLocaleString()}</Text>
              </TouchableOpacity>
            )}
            style={styles.productsList}
          />
        </View>
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
          <Text style={styles.backButtonText}>חזור</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, styles.stepNextButton, selectedProducts.length === 0 && styles.nextButtonDisabled]}
          onPress={() => setStep(3)}
          disabled={selectedProducts.length === 0}
        >
          <Text style={styles.nextButtonText}>הבא</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={styles.stepTitle}>סיכום הצעת מחיר</Text>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>פרטי לקוח:</Text>
        <Text>{customer.name}</Text>
        <Text>{customer.email}</Text>
        <Text>{customer.phone}</Text>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>מוצרים:</Text>
        {selectedProducts.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.summaryItem}>
            <Text>{item.name} x {item.quantity}</Text>
            <Text>₪{(item.base_price * item.quantity).toLocaleString()}</Text>
          </View>
        ))}
        <View style={styles.totalContainer}>
          <View style={styles.totalBreakdown}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>סה"כ לפני מע"מ:</Text>
              <Text style={styles.totalValue}>₪{netSubtotal.toFixed(2)}</Text>
            </View>

            {discountValue > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>הנחה:</Text>
                <Text style={styles.totalValue}>-₪{discountValue.toFixed(2)}</Text>
              </View>
            )}

            {discountValue > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>אחרי הנחה:</Text>
                <Text style={styles.totalValue}>₪{netAfterDiscount.toFixed(2)}</Text>
              </View>
            )}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>מע"מ ({vatRate}%):</Text>
              <Text style={styles.totalValue}>₪{vatAmount.toFixed(2)}</Text>
            </View>

            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalTextFinal}>סה"כ לתשלום:</Text>
              <Text style={styles.totalValueFinal}>₪{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>פרטים נוספים:</Text>

        <Text style={styles.fieldLabel}>תאריך משלוח *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateStr = tomorrow.toISOString().split('T')[0];

            Alert.prompt(
              'תאריך משלוח',
              'הכנס תאריך במבנה YYYY-MM-DD (למשל: 2025-01-15)',
              [
                {
                  text: 'ביטול',
                  style: 'cancel'
                },
                {
                  text: 'אישור',
                  onPress: (inputDate) => {
                    if (inputDate && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
                      const selectedDate = new Date(inputDate + 'T00:00:00');
                      if (selectedDate >= today) {
                        setDeliveryDate(inputDate);
                        setDeliveryDateObject(selectedDate);
                      } else {
                        Alert.alert('שגיאה', 'לא ניתן לבחור תאריך בעבר');
                      }
                    } else {
                      Alert.alert('שגיאה', 'תאריך לא תקין. השתמש בפורמט YYYY-MM-DD');
                    }
                  }
                }
              ],
              'plain-text',
              dateStr
            );
          }}
        >
          <Text style={styles.datePickerText}>
            {deliveryDate || 'בחר תאריך משלוח'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.fieldLabel}>תנאי תשלום</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={paymentTerms}
          onChangeText={setPaymentTerms}
          placeholder="מזומן / העברה בנקאית / שוטף +30"
          multiline
          numberOfLines={2}
        />

        <Text style={styles.fieldLabel}>הנחה</Text>
        <View style={styles.discountContainer}>
          <View style={styles.discountTypeSelector}>
            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                discountType === 'percentage' && styles.discountTypeButtonActive
              ]}
              onPress={() => setDiscountType('percentage')}
            >
              <Text style={[
                styles.discountTypeText,
                discountType === 'percentage' && styles.discountTypeTextActive
              ]}>
                אחוז %
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.discountTypeButton,
                discountType === 'absolute' && styles.discountTypeButtonActive
              ]}
              onPress={() => setDiscountType('absolute')}
            >
              <Text style={[
                styles.discountTypeText,
                discountType === 'absolute' && styles.discountTypeTextActive
              ]}>
                סכום ₪
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.discountInput}
            value={discountType === 'percentage' ? discountPct.toString() : discountAmount.toString()}
            onChangeText={(text) => {
              const value = parseFloat(text) || 0;
              if (discountType === 'percentage') {
                setDiscountPct(Math.min(100, Math.max(0, value)));
              } else {
                setDiscountAmount(Math.max(0, value));
              }
            }}
            placeholder={discountType === 'percentage' ? '0' : '0'}
            keyboardType="numeric"
          />

          {discountValue > 0 && (
            <Text style={styles.discountPreview}>
              הנחה: ₪{discountValue.toLocaleString()}
            </Text>
          )}
        </View>

        <Text style={styles.fieldLabel}>הערות</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="הערות נוספות..."
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.stepButtons}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep(2)}>
          <Text style={styles.backButtonText}>חזור</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={createQuote}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'יוצר...' : 'צור הצעת מחיר'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]} />
          <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]} />
        </View>
      </View>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      {/* Options Selection Modal */}
      {showOptionsModal && selectedProduct && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.optionsModal}>
                <Text style={styles.optionsModalTitle}>
                  בחר אפשרויות עבור: {selectedProduct.name}
                </Text>

            <ScrollView style={styles.optionsScrollView}>
              {parseOptions(selectedProduct.options).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOptions.includes(option) && styles.optionButtonSelected
                  ]}
                  onPress={() => toggleOption(option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    selectedOptions.includes(option) && styles.optionButtonTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedOptions.includes(option) && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.formLabel}>הערות</Text>
              <TextInput
                style={[styles.generalItemInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="הזן הערות (אופציונלי)"
                multiline
                numberOfLines={3}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>

            <View style={styles.optionsModalButtons}>
              <TouchableOpacity
                style={styles.cancelOptionsButton}
                onPress={() => {
                  setShowOptionsModal(false);
                  setSelectedProduct(null);
                  setSelectedOptions([]);
                  setNotes('');
                  setEditingProductIndex(null);
                }}
              >
                <Text style={styles.cancelOptionsButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addOptionsButton}
                onPress={() => addProductWithOptions(selectedProduct, selectedOptions)}
              >
                <Text style={styles.addOptionsButtonText}>
                  {editingProductIndex !== null ? 'עדכן מוצר' : 'הוסף מוצר'}
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* General Item Modal */}
      {showGeneralItemModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.generalItemModal}>
                <Text style={styles.generalItemModalTitle}>
                  {editingGeneralItem !== null ? 'עריכת פריט כללי' : 'הוספת פריט כללי'}
                </Text>

                <View style={styles.generalItemForm}>
              <Text style={styles.formLabel}>שם המוצר *</Text>
              <TextInput
                style={styles.generalItemInput}
                value={generalItemForm.name}
                onChangeText={(text) => setGeneralItemForm({...generalItemForm, name: text})}
                placeholder="הזן שם מוצר"
                multiline
                blurOnSubmit={true}
                returnKeyType="done"
              />

              <Text style={styles.formLabel}>מחיר ליחידה *</Text>
              <TextInput
                style={styles.generalItemInput}
                value={generalItemForm.price.toString()}
                onChangeText={(text) => setGeneralItemForm({...generalItemForm, price: parseFloat(text) || 0})}
                placeholder="0"
                keyboardType="numeric"
                blurOnSubmit={true}
                returnKeyType="done"
              />

              <Text style={styles.formLabel}>כמות</Text>
              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setGeneralItemForm({...generalItemForm, quantity: Math.max(1, generalItemForm.quantity - 1)})}
                >
                  <Text>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityDisplay}>{generalItemForm.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setGeneralItemForm({...generalItemForm, quantity: generalItemForm.quantity + 1})}
                >
                  <Text>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.formLabel}>הערות</Text>
              <TextInput
                style={[styles.generalItemInput, styles.notesInput]}
                value={generalItemForm.notes}
                onChangeText={(text) => setGeneralItemForm({...generalItemForm, notes: text})}
                placeholder="הזן הערות (אופציונלי)"
                multiline
                numberOfLines={3}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>

            <View style={styles.generalItemModalButtons}>
              <TouchableOpacity
                style={styles.cancelGeneralItemButton}
                onPress={() => {
                  setShowGeneralItemModal(false);
                  setGeneralItemForm({ name: '', price: 0, quantity: 1, notes: '' });
                  setEditingGeneralItem(null);
                }}
              >
                <Text style={styles.cancelGeneralItemButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveGeneralItemButton}
                onPress={handleSaveGeneralItem}
              >
                <Text style={styles.saveGeneralItemButtonText}>
                  {editingGeneralItem !== null ? 'עדכן' : 'הוסף'}
                </Text>
              </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

    </SafeAreaView>
  );
}

// View Quote Screen
function ViewQuoteScreen({ navigation, route, session }) {
  const { quoteId } = route.params;
  const [quote, setQuote] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuote();
  }, [quoteId]);

  const loadQuote = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 DEMO MODE: Loading demo quote data for quoteId:', quoteId);
        const demoData = getDemoData(session);

        // Find the specific quote by ID
        const demoQuote = demoData?.quotes?.find(q => q.id === quoteId);
        if (!demoQuote) {
          throw new Error('Demo quote not found');
        }

        // Find the customer for this quote
        const demoCustomer = demoData?.customers?.find(c => c.id === demoQuote.customer_id);

        // Attach customer data to quote
        const quoteWithCustomer = {
          ...demoQuote,
          customer: demoCustomer
        };

        // Find quote items for this quote
        const demoQuoteItems = demoData?.quoteItems?.filter(item => item.proposal_id === quoteId) || [];

        // Attach product data to each quote item
        const itemsWithProducts = demoQuoteItems.map(item => {
          const product = demoData?.products?.find(p => p.id === item.product_id);
          return {
            ...item,
            product: product
          };
        });

        setQuote(quoteWithCustomer);
        setQuoteItems(itemsWithProducts);

        // Load business settings for demo
        await loadBusinessSettings();

        setLoading(false);
        return;
      }

      // Load quote with customer information
      const { data: quoteData, error: quoteError } = await supabase
        .from('proposal')
        .select(`
          *,
          customer:customer (*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Load quote items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('proposal_item')
        .select('id, product_id, product_name, custom_name, qty, unit_price, line_total, notes')
        .eq('proposal_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      // Load business settings using the same multi-strategy approach
      await loadBusinessSettings();

      setQuote(quoteData);
      setQuoteItems(itemsData || []);

      // Track if this is a signed quote (for review prompt)
      if (quoteData?.signature_status === 'signed') {
        trackSignatureReceived();
      }

    } catch (error) {
      console.error('Error loading quote:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBusinessSettings = async () => {
    try {
      if (!session?.user?.id) return;

      // Check if demo user and return demo data
      if (isDemoUser(session)) {
        console.log('🍎 Loading demo business settings for Apple Review');
        const demoData = getDemoData(session);
        if (demoData?.businessSettings) {
          setBusinessSettings(demoData.businessSettings);
        }
        return;
      }

      // Use the same business user lookup as everything else
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      if (!businessUserId) {
        console.log('No business user ID found for loading settings');
        return;
      }

      // Load settings with the business user ID (from settings table)
      const { data: businessData, error } = await supabase
        .from('settings')
        .select('business_name, business_email, business_phone, business_address, business_license, logo_url, header_color, pdf_template')
        .eq('business_id', businessUserId)
        .maybeSingle();

      if (error) {
        console.error('Error loading business settings:', error);
        console.error('Error details:', error.message, error.code, error.details);
      }

      if (businessData) {
        console.log('Business settings loaded:', businessData.business_name);
        console.log('Logo URL:', businessData.logo_url);
        setBusinessSettings(businessData);
      } else {
        console.log('No business settings found for user ID:', businessUserId);
      }
    } catch (error) {
      console.error('Error loading business settings:', error);
      console.error('Error details:', error.message, error.code);
    }
  };

  const shareQuote = async () => {
    try {
      if (!quote?.id) {
        Alert.alert('שגיאה', 'לא ניתן לשתף הצעת מחיר זו');
        return;
      }

      const customerName = quote.customer?.name || 'לקוח יקר';
      const total = quote.total || 0;
      const proposalNumber = quote.proposal_number || quote.id;

      // Generate link for online viewing
      const webAppDomain = 'https://hitquote.online';
      const viewUrl = `${webAppDomain}/sign/${quote.id}`;

      // Show sharing options
      Alert.alert(
        'שיתוף הצעת מחיר',
        'כיצד תרצה לשתף את ההצעה?',
        [
          {
            text: 'WhatsApp',
            onPress: () => {
              const message = `🧾 הצעת מחיר מספר ${proposalNumber}

👤 לקוח: ${customerName}
💰 סה"כ: ₪${total.toLocaleString()}

📱 נוצר באמצעות HitQuote - מערכת ניהול הצעות מחיר`;
              shareViaWhatsApp(message);
            }
          },
          {
            text: 'שתף PDF',
            onPress: async () => {
              // Generate PDF first
              await generatePDF(true); // Pass true to indicate sharing mode
            }
          },
          {
            text: 'ביטול',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error sharing quote:', error);
      Alert.alert('שגיאה', 'שגיאה בשיתוף הצעת המחיר');
    }
  };

  const sendForSignature = async () => {
    try {
      if (!quote?.id) {
        Alert.alert('שגיאה', 'לא ניתן ליצור קישור חתימה עבור הצעת מחיר זו');
        return;
      }

      // Generate signature link based on web app domain
      const webAppDomain = 'https://hitquote.online'; // Web app production URL
      const signatureUrl = `${webAppDomain}/sign/${quote.id}`;

      // Show sharing options
      Alert.alert(
        'שליחה לחתימה',
        'כיצד תרצה לשלוח את קישור החתימה ללקוח?',
        [
          {
            text: 'WhatsApp',
            onPress: () => {
              const customerName = quote.customer?.name || 'לקוח יקר';
              const signatureMessage = `שלום ${customerName},\n\nמצורף קישור לחתימה על הצעת מחיר ${quote.proposal_number || quote.id}:\n\n${signatureUrl}\n\nאנא לחץ על הקישור כדי לצפות בהצעת המחיר ולחתום עליה.\n\nתודה!`;
              shareViaWhatsApp(signatureMessage);
            }
          },
          {
            text: 'הצג קישור',
            onPress: () => copySignatureLink(signatureUrl)
          },
          {
            text: 'ביטול',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error generating signature link:', error);
      Alert.alert('שגיאה', 'שגיאה ביצירת קישור החתימה');
    }
  };

  const shareViaWhatsApp = (message) => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;

    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('שגיאה', 'לא ניתן לפתוח את WhatsApp. אנא ודא שהאפליקציה מותקנת');
    });
  };

  const shareViaGeneric = async (message) => {
    try {
      await Share.share({
        message: message,
        title: `הצעת מחיר ${quote.proposal_number || quote.id}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('שגיאה', 'שגיאה בשיתוף');
    }
  };

  const copyToClipboard = async (message) => {
    // Show the message in an alert for manual copying
    Alert.alert(
      'העתק טקסט',
      message,
      [
        { text: 'סגור', style: 'cancel' }
      ]
    );
  };

  const copySignatureLink = (signatureUrl) => {
    Alert.alert(
      'קישור חתימה',
      signatureUrl,
      [
        {
          text: 'סגור',
          style: 'cancel'
        }
      ],
      {
        cancelable: true,
        // Allow user to select and copy the URL
      }
    );
  };

  const generatePDF = async (forSharing = false) => {
    try {
      setLoading(true);

      if (!session?.user?.id) {
        Alert.alert('שגיאה', 'אנא התחבר מחדש למערכת');
        return;
      }

      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      if (!businessUserId) {
        Alert.alert('שגיאה', 'לא ניתן לטעון את פרטי העסק');
        return;
      }

      // Load business settings for the current user only (from settings table)
      const { data: businessData, error: businessError } = await supabase
        .from('settings')
        .select('business_name, business_email, business_phone, business_address, business_license, logo_url, header_color, pdf_template')
        .eq('business_id', businessUserId)
        .maybeSingle();

      if (businessError) {
        console.error('Error loading business settings:', businessError);
      }

      // If no business data found, create a basic settings record for the current user
      if (!businessData) {
        const { data: newSettingsData, error: createError } = await supabase
          .from('settings')
          .insert({
            business_id: businessUserId,
            business_name: 'שם העסק',
            business_email: '',
            business_phone: '',
            business_address: '',
            business_license: '',
            logo_url: null,
            header_color: '#FDDC33',
            pdf_template: 'template1'
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating default settings:', createError);
        } else {
          businessData = newSettingsData;
        }
      }

      const business = businessData || {};
      console.log('=== BUSINESS DATA DEBUG ===');
      console.log('Business data loaded:', business);
      console.log('Business name:', business.business_name);
      console.log('Business email:', business.business_email);
      console.log('Business phone:', business.business_phone);
      console.log('Business address:', business.business_address);
      console.log('Business license:', business.business_license);
      console.log('=== LOGO DEBUG ===');
      console.log('Logo URL from database:', business.logo_url);
      console.log('Logo URL type:', typeof business.logo_url);
      console.log('Logo URL is null:', business.logo_url === null);
      console.log('Logo URL is undefined:', business.logo_url === undefined);
      console.log('Logo URL is empty string:', business.logo_url === '');
      console.log('Logo URL starts with data:', business.logo_url?.startsWith('data:'));

      // Enhanced logo validation and formatting
      let logoUrl = business.logo_url;
      const userColor = business.header_color || '#8fa0a6'; // Fallback to default grey
      console.log('User selected color:', userColor);
      console.log('User color type:', typeof userColor);
      console.log('User color length:', userColor.length);

      // Create a lighter version of the user color for table headers
      const lightenColor = (color, percent) => {
        const f = parseInt(color.slice(1), 16);
        const t = percent < 0 ? 0 : 255;
        const p = percent < 0 ? percent * -1 : percent;
        const R = f >> 16;
        const G = f >> 8 & 0x00FF;
        const B = f & 0x0000FF;
        return "#" + (0x1000000 + (Math.round((t - R) * p) + R) * 0x10000 +
          (Math.round((t - G) * p) + G) * 0x100 +
          (Math.round((t - B) * p) + B)).toString(16).slice(1);
      };
      const lightUserColor = lightenColor(userColor, 0.7); // 70% lighter
      console.log('Light user color:', lightUserColor);

      if (logoUrl) {
        console.log('Logo found, URL length:', logoUrl.length);
        console.log('Logo URL first 100 chars:', logoUrl.substring(0, 100));

        // Ensure proper data URL format
        if (logoUrl.startsWith('data:image/') && logoUrl.includes('base64,')) {
          console.log('Logo appears to be a valid base64 data URL');
        } else if (logoUrl.startsWith('http')) {
          console.log('Logo appears to be a regular HTTP URL');
        } else {
          console.log('Warning: Logo URL format might not be valid for PDF generation');
        }
      } else {
        console.log('No logo found in business settings');
        logoUrl = null;
      }

      // Calculate totals (same logic as quote page)
      const grossSubtotal = quoteItems.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
      const vatRate = 18;
      const vatFactor = 1 + (vatRate / 100);
      const netSubtotal = grossSubtotal / vatFactor;

      // Apply discount if exists
      let discountValue = 0;
      if (quote.include_discount_row && quote.discount_value > 0) {
        discountValue = quote.discount_value;
      }

      const netAfterDiscount = Math.max(0, netSubtotal - discountValue);
      const vatAmount = netAfterDiscount * (vatRate / 100);
      const total = netAfterDiscount + vatAmount;

      // Format dates
      const createdDate = new Date(quote.created_at).toLocaleDateString('he-IL');
      const deliveryDate = quote.delivery_date ? new Date(quote.delivery_date).toLocaleDateString('he-IL') : 'לא צוין';

      // Get selected PDF template (default to template1 if not set)
      const selectedTemplate = business.pdf_template || 'template1';

      // Prepare quote data for template system
      const quoteData = {
        id: quote.id,
        proposal_number: quote.proposal_number,
        created_at: quote.created_at,
        delivery_date: quote.delivery_date,
        payment_terms: quote.payment_terms,
        notes: quote.notes,
        include_discount_row: quote.include_discount_row,
        discount_value: discountValue,
        customer: quote.customer,
        items: quoteItems,
        valid_until: quote.valid_until,
        // Add calculated totals for PDF
        subtotal: netAfterDiscount,
        vat_amount: vatAmount,
        total: total
      };

      // Generate HTML using the selected template
      const htmlContent = generatePDFTemplate(selectedTemplate, quoteData, business, logoUrl, userColor);


      // Debug: Log HTML content structure
      console.log('=== PDF HTML GENERATION DEBUG ===');
      console.log('Final logoUrl value:', logoUrl);
      console.log('Business name for HTML:', business.business_name);
      console.log('HTML content length:', htmlContent.length);

      // Debug: Check if colors are interpolated in the CSS
      const cssSection = htmlContent.substring(htmlContent.indexOf('background'), htmlContent.indexOf('background') + 100);
      console.log('CSS color sample:', cssSection);
      console.log('HTML includes userColor:', htmlContent.includes(userColor));
      console.log('HTML includes lightUserColor:', htmlContent.includes(lightUserColor));

      // Test: Log the actual user color being used
      console.log('Actual userColor value being interpolated:', userColor);
      console.log('Sample of quote title section HTML:', htmlContent.substring(htmlContent.indexOf('quote-title-section'), htmlContent.indexOf('quote-title-section') + 200));

      // Generate PDF optimized for single continuous page
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        margins: {
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
        },
        printerUrl: undefined, // Force single page mode
      });

      // Share the PDF - different behavior based on sharing mode
      if (forSharing) {
        // When explicitly sharing, show the share sheet with the PDF
        await shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `הצעת מחיר ${quote.proposal_number || quote.id}`,
        });

        Alert.alert(
          'PDF נשלח',
          'קובץ ה-PDF של הצעת המחיר נשלח בהצלחה',
          [{ text: 'אישור' }]
        );
      } else {
        // Normal PDF generation - navigate to PDF preview screen
        navigation.navigate('PDFPreview', {
          pdfUri: uri,
          quoteData: {
            id: quote.id,
            proposal_number: quote.proposal_number
          }
        });
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('שגיאה', 'שגיאה ביצירת קובץ PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#62929e" />
        <Text style={styles.loadingText}>טוען הצעת מחיר...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>שגיאה: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuote}>
            <Text style={styles.retryButtonText}>נסה שוב</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!quote) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>הצעת מחיר לא נמצאה</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.quoteViewContainer}>
        {/* Business Header with Logo */}
        {businessSettings && (
          <View style={[
            styles.businessHeader,
            { backgroundColor: businessSettings.header_color || '#FDDC33' }
          ]}>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{businessSettings.business_name}</Text>
              {businessSettings.business_email && (
                <Text style={styles.businessDetail}>{businessSettings.business_email}</Text>
              )}
              {businessSettings.business_phone && (
                <Text style={styles.businessDetail}>{businessSettings.business_phone}</Text>
              )}
              {businessSettings.business_address && (
                <Text style={styles.businessDetail}>{businessSettings.business_address}</Text>
              )}
            </View>
            {businessSettings.logo_url && (
              <Image
                source={{ uri: businessSettings.logo_url }}
                style={styles.businessLogo}
                resizeMode="contain"
              />
            )}
          </View>
        )}

        {/* Quote Header */}
        <View style={styles.quoteViewHeader}>
          <View style={styles.quoteViewTitleContainer}>
            <Text style={styles.quoteViewTitle}>
              הצעת מחיר #{quote.proposal_number || quote.id.slice(0,8)}
            </Text>
            {quote.signature_status === 'signed' && (
              <View style={styles.signedBadgeLarge}>
                <Text style={styles.signedTextLarge}>✓ נחתם</Text>
              </View>
            )}
          </View>
          <Text style={styles.quoteViewDate}>
            תאריך: {new Date(quote.created_at).toLocaleDateString('he-IL')}
          </Text>
        </View>

        {/* Customer Details */}
        <View style={styles.quoteSection}>
          <Text style={styles.quoteSectionTitle}>פרטי לקוח</Text>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{quote.customer?.name}</Text>
            {quote.customer?.email && (
              <Text style={styles.customerInfo}>{quote.customer.email}</Text>
            )}
            {quote.customer?.phone && (
              <Text style={styles.customerInfo}>{quote.customer.phone}</Text>
            )}
            {quote.customer?.address && (
              <Text style={styles.customerInfo}>{quote.customer.address}</Text>
            )}
            {quote.customer?.city && quote.customer?.city.trim() !== '' && (
              <Text style={styles.customerInfo}>{quote.customer.city}</Text>
            )}
            {quote.customer?.postal_code && quote.customer?.postal_code.trim() !== '' && (
              <Text style={styles.customerInfo}>מיקוד: {quote.customer.postal_code}</Text>
            )}
            {quote.customer?.tax_id && quote.customer?.tax_id.trim() !== '' && (
              <Text style={styles.customerInfo}>ח.פ./ע.מ.: {quote.customer.tax_id}</Text>
            )}
          </View>
        </View>

        {/* Quote Items */}
        <View style={styles.quoteSection}>
          <Text style={styles.quoteSectionTitle}>פריטים</Text>
          {quoteItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.quoteItemRow}>
              <View style={styles.quoteItemPrices}>
                <Text style={styles.quoteItemPrice}>
                  ₪{Number(item.unit_price || 0).toLocaleString()}
                </Text>
                <Text style={styles.quoteItemTotal}>
                  ₪{Number(item.line_total || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.quoteItemInfo}>
                <Text style={styles.quoteItemName}>
                  {item.custom_name || item.product_name || `פריט ${index + 1}`}
                </Text>
                <Text style={styles.quoteItemDetails}>
                  כמות: {item.qty}
                </Text>
                {item.notes && item.notes.trim() !== '' && (
                  <Text style={styles.quoteItemNotes}>
                    {item.notes}
                  </Text>
                )}
              </View>
            </View>
          ))}

          {/* Quote Totals Breakdown */}
          <View style={styles.quoteTotalsBreakdown}>
            <View style={styles.totalBreakdownRow}>
              <Text style={styles.totalBreakdownValue}>
                ₪{Number(quote.subtotal || 0).toLocaleString()}
              </Text>
              <Text style={styles.totalBreakdownLabel}>סה"כ לפני מע"מ:</Text>
            </View>

            {(quote.include_discount_row && quote.discount_value > 0) && (
              <View style={styles.totalBreakdownRow}>
                <Text style={styles.totalBreakdownValue}>
                  -₪{Number(quote.discount_value || 0).toLocaleString()}
                </Text>
                <Text style={styles.totalBreakdownLabel}>הנחה:</Text>
              </View>
            )}

            {(quote.include_discount_row && quote.discount_value > 0) && (
              <View style={styles.totalBreakdownRow}>
                <Text style={styles.totalBreakdownValue}>
                  ₪{Number((quote.subtotal || 0) - (quote.discount_value || 0)).toLocaleString()}
                </Text>
                <Text style={styles.totalBreakdownLabel}>אחרי הנחה:</Text>
              </View>
            )}

            <View style={styles.totalBreakdownRow}>
              <Text style={styles.totalBreakdownValue}>
                ₪{Number(quote.vat_amount || 0).toLocaleString()}
              </Text>
              <Text style={styles.totalBreakdownLabel}>מע"מ ({quote.vat_rate || 18}%):</Text>
            </View>
          </View>

          <View style={styles.quoteTotalContainer}>
            <Text style={styles.quoteTotalText}>
              ₪{Number(quote.total || 0).toLocaleString()}
            </Text>
            <Text style={styles.quoteTotalLabel}>
              סה"כ לתשלום:
            </Text>
          </View>
        </View>

        {/* Signature Status */}
        {quote.signature_status && (
          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionTitle}>סטטוס חתימה</Text>
            <Text style={styles.signatureStatus}>
              {quote.signature_status === 'signed'
                ? `נחתם על ידי ${quote.signer_name || 'לא ידוע'}`
                : 'ממתין לחתימה'
              }
            </Text>
            {quote.signature_timestamp && (
              <Text style={styles.signatureDate}>
                תאריך חתימה: {new Date(quote.signature_timestamp).toLocaleDateString('he-IL')}
              </Text>
            )}
          </View>
        )}

        {/* General Quote Notes */}
        {quote.notes && quote.notes.trim() !== '' && (
          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionTitle}>הערות</Text>
            <Text style={styles.quoteNotesText}>{quote.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.quoteActions}>
        <TouchableOpacity style={styles.actionButtonLarge} onPress={shareQuote}>
          <Text style={styles.actionButtonLargeText}>שתף 📤</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonLarge} onPress={sendForSignature}>
          <Text style={styles.actionButtonLargeText}>חתימה ✍️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonLarge} onPress={generatePDF}>
          <Text style={styles.actionButtonLargeText}>PDF 📄</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// PDF Preview Screen
function PDFPreviewScreen({ navigation, route }) {
  const { pdfUri, quoteData } = route.params;
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPDFAsBase64();
  }, [pdfUri]);

  const loadPDFAsBase64 = async () => {
    try {
      setLoading(true);
      // Read PDF file as base64
      const base64 = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPdfBase64(base64);
    } catch (error) {
      console.error('Error loading PDF:', error);
      Alert.alert('שגיאה', 'שגיאה בטעינת ה-PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pdfPreviewContainer}>
        <View style={styles.pdfPreviewHeader}>
          <TouchableOpacity
            style={styles.pdfPreviewBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.pdfPreviewBackButtonText}>← חזור</Text>
          </TouchableOpacity>
          <Text style={styles.pdfPreviewTitle}>תצוגת PDF</Text>
          <TouchableOpacity
            style={styles.pdfPreviewShareButton}
            onPress={async () => {
              try {
                await shareAsync(pdfUri, {
                  UTI: '.pdf',
                  mimeType: 'application/pdf',
                  dialogTitle: `הצעת מחיר ${quoteData?.proposal_number || quoteData?.id}`,
                });
              } catch (error) {
                console.error('Error sharing PDF:', error);
                Alert.alert('שגיאה', 'שגיאה בשיתוף הקובץ');
              }
            }}
          >
            <Text style={styles.pdfPreviewShareButtonText}>שתף 📤</Text>
          </TouchableOpacity>
        </View>

        {/* PDF in WebView using base64 */}
        <View style={styles.pdfPreviewWebViewContainer}>
          {loading && (
            <View style={styles.pdfPreviewLoadingOverlay}>
              <ActivityIndicator size="large" color="#FDDC33" />
              <Text style={styles.pdfPreviewLoadingText}>טוען PDF...</Text>
            </View>
          )}
          {!loading && pdfBase64 && (
            <WebView
              source={{
                uri: `data:application/pdf;base64,${pdfBase64}`,
              }}
              style={styles.pdfPreviewWebView}
              onError={(error) => {
                console.error('WebView error:', error);
                Alert.alert('שגיאה', 'שגיאה בהצגת ה-PDF');
              }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Edit Quote Screen
function EditQuoteScreen({ navigation, route, session }) {
  const { quoteId } = route.params;
  const [quote, setQuote] = useState(null);
  const [quoteItems, setQuoteItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Quote fields
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryDateObject, setDeliveryDateObject] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'absolute'
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [vatRate, setVatRate] = useState(18);

  // Add product modal
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [editingProductIndex, setEditingProductIndex] = useState(null);

  useEffect(() => {
    loadQuoteData();
    loadProducts();
  }, [quoteId]);

  const loadProducts = async () => {
    try {
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      const { data: productsData, error } = await supabase
        .from('product')
        .select('id, category, name, unit_label, base_price, notes, options')
        .eq('business_id', businessUserId)
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadQuoteData = async () => {
    try {
      // Load quote with customer information
      const { data: quoteData, error: quoteError } = await supabase
        .from('proposal')
        .select(`
          *,
          customer:customer (*)
        `)
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;

      // Load quote items
      const { data: itemsData, error: itemsError } = await supabase
        .from('proposal_item')
        .select('*')
        .eq('proposal_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) throw itemsError;

      setQuote(quoteData);
      setQuoteItems(itemsData || []);

      // Set quote fields
      const deliveryDateStr = quoteData.delivery_date || '';
      setDeliveryDate(deliveryDateStr);
      if (deliveryDateStr) {
        setDeliveryDateObject(new Date(deliveryDateStr));
      }
      setPaymentTerms(quoteData.payment_terms || '');
      setNotes(quoteData.notes || '');
      setVatRate(quoteData.vat_rate || 18);

      // Set discount
      const discountVal = Number(quoteData.discount_value || 0);
      if (discountVal > 0) {
        const pct = quoteData.subtotal ? (discountVal / Number(quoteData.subtotal)) * 100 : 0;
        if (pct <= 100) {
          setDiscountType('percentage');
          setDiscountPct(pct);
        } else {
          setDiscountType('absolute');
          setDiscountAmount(discountVal);
        }
      }
    } catch (error) {
      Alert.alert('שגיאה', 'שגיאה בטעינת הצעת המחיר');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const updateItemQuantity = (itemId, newQty) => {
    if (newQty <= 0) {
      setQuoteItems(quoteItems.filter(item => item.id !== itemId));
    } else {
      setQuoteItems(quoteItems.map(item => {
        if (item.id === itemId) {
          const newLineTotal = item.unit_price * newQty;
          return { ...item, qty: newQty, line_total: newLineTotal };
        }
        return item;
      }));
    }
  };

  const removeItem = (itemId) => {
    Alert.alert(
      'מחיקת פריט',
      'האם אתה בטוח שברצונך למחוק פריט זה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'מחק',
          style: 'destructive',
          onPress: () => setQuoteItems(quoteItems.filter(item => item.id !== itemId))
        }
      ]
    );
  };

  const addProductToQuote = (product) => {
    const availableOptions = parseOptions(product.options);
    if (availableOptions.length > 0) {
      setSelectedProduct(product);
      setSelectedOptions([]);
      setShowOptionsModal(true);
    } else {
      addProductWithOptions(product, []);
    }
  };

  const addProductWithOptions = (product, selectedOpts) => {
    const optionsText = selectedOpts.length > 0 ? selectedOpts.join(', ') : '';
    const optionsPart = optionsText ? `אפשרויות: ${optionsText}` : '';
    const userNotesPart = notes ? notes : '';
    const combinedNotes = [optionsPart, userNotesPart].filter(Boolean).join('\n');

    const newItem = {
      id: `new_${Date.now()}`,
      product_id: product.id,
      product_name: product.name,
      qty: 1,
      unit_price: product.base_price,
      line_total: product.base_price,
      notes: combinedNotes,
      isNew: true
    };

    setQuoteItems([...quoteItems, newItem]);
    setShowAddProductModal(false);
    setShowOptionsModal(false);
    setSelectedProduct(null);
    setSelectedOptions([]);
    setNotes('');
  };

  const toggleOption = (option) => {
    setSelectedOptions(prev =>
      prev.includes(option)
        ? prev.filter(opt => opt !== option)
        : [...prev, option]
    );
  };

  const addCustomItem = () => {
    const newItem = {
      id: `new_${Date.now()}`,
      product_id: null,
      product_name: 'פריט כללי',
      custom_name: 'פריט כללי',
      qty: 1,
      unit_price: 0,
      line_total: 0,
      notes: '',
      isNew: true,
      isCustom: true
    };
    setQuoteItems([...quoteItems, newItem]);
  };

  const handleEditDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (selectedDate) {
      setDeliveryDateObject(selectedDate);
      setDeliveryDate(selectedDate.toISOString().split('T')[0]);
      if (Platform.OS === 'ios') {
        setShowDatePicker(false);
      }
    }
  };

  const updateItem = (itemId, updates) => {
    setQuoteItems(quoteItems.map(item => {
      if ((item.id === itemId) || (item.id === itemId)) {
        const updatedItem = { ...item, ...updates };
        if ('qty' in updates || 'unit_price' in updates) {
          updatedItem.line_total = (updatedItem.qty || 0) * (updatedItem.unit_price || 0);
        }
        return updatedItem;
      }
      return item;
    }));
  };

  // Calculations
  const grossSubtotal = quoteItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);
  const vatFactor = 1 + (vatRate / 100);
  const netSubtotal = grossSubtotal / vatFactor;
  const discountValue = discountType === 'percentage'
    ? netSubtotal * (discountPct / 100)
    : discountAmount;
  const netAfterDiscount = Math.max(0, netSubtotal - discountValue);
  const vatAmount = netAfterDiscount * (vatRate / 100);
  const total = netAfterDiscount + vatAmount;

  const saveChanges = async () => {
    try {
      setSaving(true);

      if (!deliveryDate) {
        Alert.alert('שגיאה', 'יש לבחור תאריך משלוח');
        setSaving(false);
        return;
      }

      // Update quote
      const { error: quoteError } = await supabase
        .from('proposal')
        .update({
          delivery_date: deliveryDate,
          payment_terms: paymentTerms,
          notes: notes,
          subtotal: netSubtotal,
          discount_value: discountValue,
          include_discount_row: discountValue > 0,
          vat_rate: vatRate,
          vat_amount: vatAmount,
          total: total
        })
        .eq('id', quoteId);

      if (quoteError) throw quoteError;

      // Get business user ID for new items
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      // Handle items
      const existingItems = quoteItems.filter(item => !item.isNew);
      const newItems = quoteItems.filter(item => item.isNew);

      // Delete removed items
      const currentItemIds = existingItems.map(item => item.id);
      if (currentItemIds.length > 0) {
        await supabase
          .from('proposal_item')
          .delete()
          .eq('proposal_id', quoteId)
          .not('id', 'in', `(${currentItemIds.join(',')})`);
      }

      // Update existing items
      for (const item of existingItems) {
        const { error } = await supabase
          .from('proposal_item')
          .update({
            qty: item.qty,
            unit_price: item.unit_price,
            line_total: item.line_total,
            notes: item.notes
          })
          .eq('id', item.id);

        if (error) throw error;
      }

      // Add new items
      if (newItems.length > 0) {
        const itemsToInsert = newItems.map(item => ({
          proposal_id: quoteId,
          product_id: item.product_id,
          product_name: item.product_name,
          custom_name: item.custom_name || item.product_name,
          qty: item.qty,
          unit_price: item.unit_price,
          line_total: item.line_total,
          notes: item.notes,
          business_id: businessUserId
        }));

        const { error: insertError } = await supabase
          .from('proposal_item')
          .insert(itemsToInsert);

        if (insertError) throw insertError;
      }

      Alert.alert('הצלחה', 'השינויים נשמרו בהצלחה');
      navigation.goBack();
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('שגיאה', 'שגיאה בשמירת השינויים');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#62929e" />
      </View>
    );
  }

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.quoteEditContainer}>
        <View style={styles.quoteEditHeader}>
          <Text style={styles.quoteEditTitle}>
            עריכת הצעה #{quote?.proposal_number || quote?.id.slice(0,8)}
          </Text>
          <Text style={styles.quoteEditCustomer}>
            {quote?.customer?.name}
          </Text>
        </View>

        {/* Quote Details Section */}
        <View style={styles.quoteEditSection}>
          <Text style={styles.quoteSectionTitle}>פרטי הצעה</Text>

          <Text style={styles.fieldLabel}>תאריך משלוח *</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => {
              const today = new Date();
              const currentDate = deliveryDate || today.toISOString().split('T')[0];

              Alert.prompt(
                'תאריך משלוח',
                'הכנס תאריך במבנה YYYY-MM-DD (למשל: 2025-01-15)',
                [
                  {
                    text: 'ביטול',
                    style: 'cancel'
                  },
                  {
                    text: 'אישור',
                    onPress: (inputDate) => {
                      if (inputDate && /^\d{4}-\d{2}-\d{2}$/.test(inputDate)) {
                        const selectedDate = new Date(inputDate + 'T00:00:00');
                        if (selectedDate >= today) {
                          setDeliveryDate(inputDate);
                          setDeliveryDateObject(selectedDate);
                        } else {
                          Alert.alert('שגיאה', 'לא ניתן לבחור תאריך בעבר');
                        }
                      } else {
                        Alert.alert('שגיאה', 'תאריך לא תקין. השתמש בפורמט YYYY-MM-DD');
                      }
                    }
                  }
                ],
                'plain-text',
                currentDate
              );
            }}
          >
            <Text style={styles.datePickerText}>
              {deliveryDate || 'בחר תאריך משלוח'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.fieldLabel}>תנאי תשלום</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={paymentTerms}
            onChangeText={setPaymentTerms}
            placeholder="מזומן / העברה בנקאית / שוטף +30"
            multiline
            numberOfLines={2}
          />

          <Text style={styles.fieldLabel}>הערות</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="הערות להצעת המחיר..."
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Items Section */}
        <View style={styles.quoteEditSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.quoteSectionTitle}>פריטים</Text>
            <View style={styles.addButtonsContainer}>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => setShowAddProductModal(true)}
              >
                <Text style={styles.addItemButtonText}>+ מוצר</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={addCustomItem}
              >
                <Text style={styles.addItemButtonText}>+ פריט כללי</Text>
              </TouchableOpacity>
            </View>
          </View>

          {quoteItems.map((item, index) => (
            <View key={`${item.id}-${index}`} style={styles.editableItem}>
              <View style={styles.editableItemInfo}>
                {item.isCustom ? (
                  <TextInput
                    style={styles.itemNameInput}
                    value={item.custom_name || item.product_name}
                    onChangeText={(text) => updateItem(item.id, { custom_name: text, product_name: text })}
                    placeholder="שם הפריט"
                  />
                ) : (
                  <Text style={styles.editableItemName}>
                    {item.custom_name || item.product_name}
                  </Text>
                )}

                {item.isCustom ? (
                  <TextInput
                    style={styles.priceInput}
                    value={String(item.unit_price || '')}
                    onChangeText={(text) => updateItem(item.id, { unit_price: Number(text) || 0 })}
                    placeholder="מחיר"
                    keyboardType="numeric"
                  />
                ) : (
                  <Text style={styles.editableItemPrice}>
                    ₪{Number(item.unit_price || 0).toLocaleString()} ליחידה
                  </Text>
                )}
              </View>

              <TextInput
                style={styles.itemNotesInput}
                value={item.notes || ''}
                onChangeText={(text) => updateItem(item.id, { notes: text })}
                placeholder="הערות לפריט..."
              />

              <View style={styles.editableItemControls}>
                <TouchableOpacity
                  onPress={() => updateItemQuantity(item.id, item.qty - 1)}
                  style={styles.quantityButton}
                >
                  <Text>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{item.qty}</Text>
                <TouchableOpacity
                  onPress={() => updateItemQuantity(item.id, item.qty + 1)}
                  style={styles.quantityButton}
                >
                  <Text>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => removeItem(item.id)}
                  style={styles.removeButton}
                >
                  <IconDelete size={16} color="#e74c3c" />
                </TouchableOpacity>
              </View>

              <Text style={styles.editableItemTotal}>
                סה"כ: ₪{Number(item.line_total || 0).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Discount and Totals Section */}
        <View style={styles.quoteEditSection}>
          <Text style={styles.quoteSectionTitle}>סיכום</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>סה"כ לפני הנחה:</Text>
            <Text style={styles.summaryValue}>₪{netSubtotal.toFixed(2)}</Text>
          </View>

          <View style={styles.discountContainer}>
            <Text style={styles.summaryLabel}>הנחה:</Text>
            <View style={styles.discountControls}>
              <TouchableOpacity
                style={[styles.discountTypeButton, discountType === 'percentage' && styles.discountTypeActive]}
                onPress={() => setDiscountType('percentage')}
              >
                <Text style={[styles.discountTypeText, discountType === 'percentage' && styles.discountTypeTextActive]}>%</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.discountTypeButton, discountType === 'absolute' && styles.discountTypeActive]}
                onPress={() => setDiscountType('absolute')}
              >
                <Text style={[styles.discountTypeText, discountType === 'absolute' && styles.discountTypeTextActive]}>₪</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.discountInput}
                value={String(discountType === 'percentage' ? discountPct : discountAmount)}
                onChangeText={(text) => {
                  const val = Number(text) || 0;
                  if (discountType === 'percentage') {
                    setDiscountPct(Math.min(100, val));
                  } else {
                    setDiscountAmount(val);
                  }
                }}
                keyboardType="numeric"
                placeholder="0"
              />
            </View>
          </View>

          {discountValue > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>סה"כ הנחה:</Text>
              <Text style={styles.summaryValue}>-₪{discountValue.toFixed(2)}</Text>
            </View>
          )}

          {discountValue > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>סה"כ אחרי הנחה:</Text>
              <Text style={styles.summaryValue}>₪{netAfterDiscount.toFixed(2)}</Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>מע"מ ({vatRate}%):</Text>
            <Text style={styles.summaryValue}>₪{vatAmount.toFixed(2)}</Text>
          </View>

          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>סה"כ לתשלום:</Text>
            <Text style={styles.totalValue}>₪{total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.addProductModal}>
            <Text style={styles.modalTitle}>הוסף מוצר</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="חיפוש מוצרים..."
              value={productSearchQuery}
              onChangeText={setProductSearchQuery}
            />

            <ScrollView style={styles.productsList}>
              {filteredProducts.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productListItem}
                  onPress={() => addProductToQuote(product)}
                >
                  <Text style={styles.productListName}>{product.name}</Text>
                  <Text style={styles.productListPrice}>₪{product.base_price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => {
                setShowAddProductModal(false);
                setProductSearchQuery('');
              }}
            >
              <Text style={styles.closeModalButtonText}>סגור</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Options Modal */}
      {showOptionsModal && selectedProduct && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.optionsModal}>
                <Text style={styles.optionsModalTitle}>
                  בחר אפשרויות עבור: {selectedProduct.name}
                </Text>

            <ScrollView style={styles.optionsScrollView}>
              {parseOptions(selectedProduct.options).map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOptions.includes(option) && styles.optionButtonSelected
                  ]}
                  onPress={() => toggleOption(option)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    selectedOptions.includes(option) && styles.optionButtonTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedOptions.includes(option) && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Notes Section */}
            <View style={styles.notesSection}>
              <Text style={styles.formLabel}>הערות</Text>
              <TextInput
                style={[styles.generalItemInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="הזן הערות (אופציונלי)"
                multiline
                numberOfLines={3}
                blurOnSubmit={true}
                returnKeyType="done"
              />
            </View>

            <View style={styles.optionsModalButtons}>
              <TouchableOpacity
                style={styles.cancelOptionsButton}
                onPress={() => {
                  setShowOptionsModal(false);
                  setSelectedProduct(null);
                  setSelectedOptions([]);
                  setNotes('');
                  setEditingProductIndex(null);
                }}
              >
                <Text style={styles.cancelOptionsButtonText}>ביטול</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addOptionsButton}
                onPress={() => addProductWithOptions(selectedProduct, selectedOptions)}
              >
                <Text style={styles.addOptionsButtonText}>
                  {editingProductIndex !== null ? 'עדכן מוצר' : 'הוסף מוצר'}
                </Text>
              </TouchableOpacity>
            </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <View style={styles.editQuoteActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>ביטול</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveChangesButton, saving && styles.saveButtonDisabled]}
          onPress={saveChanges}
          disabled={saving}
        >
          <Text style={styles.saveChangesButtonText}>
            {saving ? 'שומר...' : 'שמור שינויים'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// Product Editor Screen
function ProductEditorScreen({ navigation, route, session }) {
  const { productId } = route.params || {};
  const [product, setProduct] = useState({
    name: '',
    notes: '',
    base_price: '',
    category: '',
    unit_label: '',
    options: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(!!productId);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('product')
        .select('id, category, name, unit_label, base_price, notes, options')
        .eq('id', productId)
        .single();

      if (error) throw error;

      setProduct({
        name: data.name || '',
        notes: data.notes || '',
        base_price: data.base_price?.toString() || '',
        category: data.category || '',
        unit_label: data.unit_label || '',
        options: data.options || ''
      });
    } catch (error) {
      Alert.alert('שגיאה', 'שגיאה בטעינת המוצר');
      navigation.goBack();
    }
  };

  const saveProduct = async () => {
    try {
      console.log('=== SAVING PRODUCT ===');
      setLoading(true);
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      console.log('Business User ID:', businessUserId);

      const productData = {
        name: product.name,
        notes: product.notes,
        base_price: parseFloat(product.base_price) || 0,
        category: product.category,
        unit_label: product.unit_label,
        options: product.options,
        business_id: businessUserId
      };

      if (isEdit) {
        const { error } = await supabase
          .from('product')
          .update(productData)
          .eq('id', productId);

        if (error) throw error;
        Alert.alert('הצלחה', 'המוצר עודכן בהצלחה!');
      } else {
        const { error } = await supabase
          .from('product')
          .insert(productData);

        if (error) throw error;
        Alert.alert('הצלחה', 'המוצר נוסף בהצלחה!');
      }

      navigation.goBack();

    } catch (error) {
      Alert.alert('שגיאה', error.message || 'שגיאה בשמירת המוצר');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={styles.formTitle}>
          {isEdit ? 'עריכת מוצר' : 'מוצר חדש'}
        </Text>

        <Text style={styles.fieldLabel}>שם המוצר *</Text>
        <TextInput
          style={styles.input}
          placeholder="שם המוצר"
          value={product.name}
          onChangeText={(text) => setProduct({...product, name: text})}
        />

        <Text style={styles.fieldLabel}>הערות</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="הערות למוצר"
          value={product.notes}
          onChangeText={(text) => setProduct({...product, notes: text})}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.fieldLabel}>מחיר בסיס *</Text>
        <TextInput
          style={styles.input}
          placeholder="מחיר בסיס"
          value={product.base_price}
          onChangeText={(text) => setProduct({...product, base_price: text})}
          keyboardType="numeric"
        />

        <Text style={styles.fieldLabel}>קטגוריה</Text>
        <TextInput
          style={styles.input}
          placeholder="קטגוריה"
          value={product.category}
          onChangeText={(text) => setProduct({...product, category: text})}
        />

        <Text style={styles.fieldLabel}>יחידת מידה</Text>
        <TextInput
          style={styles.input}
          placeholder="יח', ק״ג, מ׳ וכו'"
          value={product.unit_label}
          onChangeText={(text) => setProduct({...product, unit_label: text})}
        />

        <Text style={styles.fieldLabel}>אפשרויות</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="הפרד אפשרויות עם | (לדוגמה: צבע אדום|צבע כחול|מידה קטנה)"
          value={product.options}
          onChangeText={(text) => setProduct({...product, options: text})}
          multiline
          numberOfLines={3}
        />

      </ScrollView>
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[
            styles.productSaveButton,
            (loading || !product.name || !product.base_price) ? styles.productSaveButtonDisabled : null
          ]}
          onPress={saveProduct}
          disabled={loading || !product.name || !product.base_price}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'שומר...' : isEdit ? 'עדכן מוצר' : 'הוסף מוצר'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Customers Screen with Management Features
function CustomersScreen({ session, navigation: navProp, route }) {
  const navigation = navProp || useNavigation();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [customerQuotes, setCustomerQuotes] = useState([]);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' });
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Open add modal if navigated with openAddModal parameter
  useEffect(() => {
    if (route?.params?.openAddModal) {
      setShowAddCustomerModal(true);
      // Reset the parameter to prevent reopening
      if (navigation.setParams) {
        navigation.setParams({ openAddModal: false });
      }
    }
  }, [route?.params?.openAddModal]);

  useEffect(() => {
    if (session?.user?.id) {
      loadCustomers();
    }
  }, [session]);

  useFocusEffect(
    React.useCallback(() => {
      if (session?.user?.id) {
        loadCustomers();
      }
    }, [session])
  );

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      if (!businessUserId) {
        Alert.alert('שגיאה', 'לא נמצא משתמש עסקי');
        return;
      }

      // Load customers with their quote counts
      const { data: customersData, error: customersError } = await supabase
        .from('customer')
        .select(`
          *,
          proposal!customer_id (
            id,
            total
          )
        `)
        .eq('business_id', businessUserId)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      // Calculate total revenue per customer
      const customersWithStats = customersData?.map(customer => {
        const quotes = customer.proposal || [];
        const totalRevenue = quotes.reduce((sum, quote) => sum + (quote.total || 0), 0);
        const quoteCount = quotes.length;

        return {
          ...customer,
          totalRevenue,
          quoteCount,
          proposal: undefined // Remove raw proposal data
        };
      }) || [];

      setCustomers(customersWithStats);
      setFilteredCustomers(customersWithStats);
      setLoading(false);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('שגיאה', 'שגיאה בטעינת לקוחות');
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchQuery) {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query)
      );
      setFilteredCustomers(filtered);
    }
  };

  const loadCustomerQuotes = async (customerId) => {
    try {
      const businessUserId = await validateSessionAndGetBusinessUserId(session);

      const { data, error } = await supabase
        .from('proposal')
        .select('*')
        .eq('business_id', businessUserId)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerQuotes(data || []);
    } catch (error) {
      console.error('Error loading customer quotes:', error);
    }
  };

  const handleCustomerPress = async (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetail(true);
    await loadCustomerQuotes(customer.id);
  };

  const handleCall = (phone) => {
    if (!phone) {
      Alert.alert('שגיאה', 'לא נמצא מספר טלפון');
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const handleWhatsApp = (phone) => {
    if (!phone) {
      Alert.alert('שגיאה', 'לא נמצא מספר טלפון');
      return;
    }
    const whatsappUrl = `whatsapp://send?phone=${phone.startsWith('+972') ? phone : '+972' + phone.replace(/^0/, '')}`;
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('שגיאה', 'WhatsApp לא מותקן');
    });
  };

  const handleEmail = (email) => {
    if (!email) {
      Alert.alert('שגיאה', 'לא נמצא אימייל');
      return;
    }
    Linking.openURL(`mailto:${email}`);
  };

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim()) {
      Alert.alert('שגיאה', 'יש למלא שם לקוח');
      return;
    }

    try {
      const businessUserId = await validateSessionAndGetBusinessUserId(session);
      if (!businessUserId) {
        Alert.alert('שגיאה', 'לא נמצא משתמש עסקי');
        return;
      }

      const { data, error } = await supabase
        .from('customer')
        .insert({
          name: newCustomer.name.trim(),
          email: newCustomer.email.trim() || null,
          phone: newCustomer.phone.trim() || null,
          address: newCustomer.address.trim() || null,
          business_id: businessUserId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding customer:', error);
        Alert.alert('שגיאה', 'שגיאה בהוספת הלקוח');
        return;
      }

      Alert.alert('הצלחה', 'הלקוח נוסף בהצלחה');
      setNewCustomer({ name: '', email: '', phone: '', address: '' });
      setShowAddCustomerModal(false);
      loadCustomers(); // Refresh the customer list
    } catch (error) {
      console.error('Error adding customer:', error);
      Alert.alert('שגיאה', 'שגיאה בהוספת הלקוח');
    }
  };

  const editCustomer = (customer) => {
    setEditingCustomer({
      id: customer.id,
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || ''
    });
    setShowEditCustomerModal(true);
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer.name.trim()) {
      Alert.alert('שגיאה', 'יש למלא שם לקוח');
      return;
    }

    try {
      const { error } = await supabase
        .from('customer')
        .update({
          name: editingCustomer.name.trim(),
          email: editingCustomer.email.trim() || null,
          phone: editingCustomer.phone.trim() || null,
          address: editingCustomer.address.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCustomer.id);

      if (error) {
        console.error('Error updating customer:', error);
        Alert.alert('שגיאה', 'שגיאה בעדכון הלקוח');
        return;
      }

      Alert.alert('הצלחה', 'הלקוח עודכן בהצלחה');
      setEditingCustomer(null);
      setShowEditCustomerModal(false);
      loadCustomers(); // Refresh the customer list
    } catch (error) {
      console.error('Error updating customer:', error);
      Alert.alert('שגיאה', 'שגיאה בעדכון הלקוח');
    }
  };

  const deleteCustomer = async (customerId) => {
    // First check if customer has any quotes
    try {
      const { data: quotes, error: checkError } = await supabase
        .from('proposal')
        .select('id')
        .eq('customer_id', customerId)
        .limit(1);

      if (checkError) {
        console.error('Error checking customer quotes:', checkError);
        Alert.alert('שגיאה', 'שגיאה בבדיקת הלקוח');
        return;
      }

      if (quotes && quotes.length > 0) {
        Alert.alert(
          'לא ניתן למחוק',
          'לא ניתן למחוק לקוח שיש לו הצעות מחיר קיימות. יש למחוק קודם את כל ההצעות של הלקוח.',
          [{ text: 'הבנתי', style: 'default' }]
        );
        return;
      }

      // If no quotes, proceed with deletion
      Alert.alert(
        'מחיקת לקוח',
        'האם אתה בטוח שברצונך למחוק את הלקוח? פעולה זו לא ניתנת לביטול.',
        [
          { text: 'ביטול', style: 'cancel' },
          {
            text: 'מחק',
            style: 'destructive',
            onPress: async () => {
              try {
                const { error } = await supabase
                  .from('customer')
                  .delete()
                  .eq('id', customerId);

                if (error) {
                  console.error('Error deleting customer:', error);
                  if (error.code === '23503') {
                    Alert.alert('שגיאה', 'לא ניתן למחוק לקוח שיש לו הצעות מחיר קיימות');
                  } else {
                    Alert.alert('שגיאה', 'שגיאה במחיקת הלקוח');
                  }
                  return;
                }

                Alert.alert('הצלחה', 'הלקוח נמחק בהצלחה');
                loadCustomers(); // Refresh the customer list
              } catch (error) {
                console.error('Error deleting customer:', error);
                Alert.alert('שגיאה', 'שגיאה במחיקת הלקוח');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in deleteCustomer:', error);
      Alert.alert('שגיאה', 'שגיאה במחיקת הלקוח');
    }
  };

  const renderCustomerRightActions = (progress, dragX, customer) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionEdit]}
          onPress={() => editCustomer(customer)}
        >
          <IconEdit color="#fff" size={24} />
          <Text style={styles.swipeActionText}>עריכה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDelete]}
          onPress={() => deleteCustomer(customer.id)}
        >
          <IconDelete color="#fff" size={24} />
          <Text style={styles.swipeActionText}>מחיקה</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCustomerItem = ({ item }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderCustomerRightActions(progress, dragX, item)}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity
        style={styles.customerCard}
        onPress={() => handleCustomerPress(item)}
      >
        <View style={styles.customerHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{item.name}</Text>
            {item.email && <Text style={styles.customerEmail}>{item.email}</Text>}
            {item.phone && <Text style={styles.customerPhone}>{item.phone}</Text>}
          </View>
          <View style={styles.customerStats}>
            <Text style={styles.customerStatLabel}>הצעות</Text>
            <Text style={styles.customerStatValue}>{item.quoteCount || 0}</Text>
            <Text style={styles.customerStatLabel}>סה"כ</Text>
            <Text style={styles.customerStatRevenue}>₪{(item.totalRevenue || 0).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.customerActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleCall(item.phone);
            }}
          >
            <IconPhone size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleWhatsApp(item.phone);
            }}
          >
            <IconMessage size={20} color="#25D366" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEmail(item.email);
            }}
          >
            <IconEmail size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const renderCustomerDetail = () => (
    <Modal
      visible={showCustomerDetail}
      animationType="slide"
      onRequestClose={() => setShowCustomerDetail(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButtonTouchable}
            onPress={() => setShowCustomerDetail(false)}
          >
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>פרטי לקוח</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={styles.modalContent}>
          {selectedCustomer && (
            <>
              <View style={styles.customerDetailSection}>
                <Text style={styles.detailSectionTitle}>פרטי יצירת קשר</Text>
                <Text style={styles.detailName}>{selectedCustomer.name}</Text>
                {selectedCustomer.email && (
                  <TouchableOpacity onPress={() => handleEmail(selectedCustomer.email)}>
                    <Text style={styles.detailLink}>{selectedCustomer.email}</Text>
                  </TouchableOpacity>
                )}
                {selectedCustomer.phone && (
                  <TouchableOpacity onPress={() => handleCall(selectedCustomer.phone)}>
                    <Text style={styles.detailLink}>{selectedCustomer.phone}</Text>
                  </TouchableOpacity>
                )}
                {selectedCustomer.address && (
                  <Text style={styles.detailText}>כתובת: {selectedCustomer.address}</Text>
                )}
              </View>

              <View style={styles.customerDetailSection}>
                <Text style={styles.detailSectionTitle}>סטטיסטיקה</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{selectedCustomer.quoteCount || 0}</Text>
                    <Text style={styles.statLabel}>הצעות מחיר</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>₪{(selectedCustomer.totalRevenue || 0).toLocaleString()}</Text>
                    <Text style={styles.statLabel}>סה"כ מכירות</Text>
                  </View>
                </View>
              </View>

              <View style={styles.customerDetailSection}>
                <TouchableOpacity
                  style={styles.createQuoteButton}
                  onPress={() => {
                    setShowCustomerDetail(false);
                    navigation.navigate('CreateQuote', { preselectedCustomer: selectedCustomer });
                  }}
                >
                  <Text style={styles.createQuoteButtonText}>יצירת הצעת מחיר חדשה</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.customerDetailSection}>
                <Text style={styles.detailSectionTitle}>היסטוריית הצעות מחיר</Text>
                {customerQuotes.length > 0 ? (
                  customerQuotes.map((quote) => (
                    <TouchableOpacity
                      key={quote.id}
                      style={styles.quoteHistoryItem}
                      activeOpacity={0.7}
                      onPress={() => {
                        setShowCustomerDetail(false);
                        navigation.navigate('ViewQuote', { quoteId: quote.id });
                      }}
                    >
                      <Text style={styles.quoteHistoryNumber}>#{quote.proposal_number || quote.id.slice(0, 8)}</Text>
                      <Text style={styles.quoteHistoryDate}>
                        {new Date(quote.created_at).toLocaleDateString('he-IL')}
                      </Text>
                      <Text style={styles.quoteHistoryTotal}>₪{(quote.total || 0).toLocaleString()}</Text>
                      <Text style={[
                        styles.quoteHistoryStatus,
                        quote.signature_status === 'signed' && styles.statusSigned
                      ]}>
                        {quote.signature_status === 'signed' ? '✓ נחתם' : 'ממתין'}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noQuotesText}>אין הצעות מחיר עדיין</Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#62929e" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeHeader}>
        <View style={styles.customersHeader}>
          <View style={styles.customersHeaderOverlay} />
          <View style={styles.headerTitleContainer}>
            <IconCustomers size={26} color="#fff" />
            <Text style={styles.themedHeaderTitle}>לקוחות</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddCustomerModal(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="חיפוש לפי שם, אימייל או טלפון..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        renderItem={renderCustomerItem}
        contentContainerStyle={styles.customersList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadCustomers().then(() => setRefreshing(false));
            }}
            colors={['#62929e']}
            tintColor="#62929e"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'לא נמצאו לקוחות תואמים' : 'אין לקוחות עדיין'}
            </Text>
          </View>
        }
      />

      {renderCustomerDetail()}

      {/* Add Customer Modal */}
      <Modal
        visible={showAddCustomerModal}
        animationType="slide"
        onRequestClose={() => setShowAddCustomerModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButtonTouchable}
              onPress={() => setShowAddCustomerModal(false)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>לקוח חדש</Text>
            <TouchableOpacity
              style={styles.saveButtonTouchable}
              onPress={handleAddCustomer}
            >
              <Text style={styles.saveButtonText}>שמור</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>שם הלקוח *</Text>
              <TextInput
                style={styles.input}
                placeholder="שם מלא"
                value={newCustomer.name}
                onChangeText={(text) => setNewCustomer({...newCustomer, name: text})}
              />

              <Text style={styles.fieldLabel}>אימייל</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={newCustomer.email}
                onChangeText={(text) => setNewCustomer({...newCustomer, email: text})}
                keyboardType="email-address"
              />

              <Text style={styles.fieldLabel}>טלפון</Text>
              <TextInput
                style={styles.input}
                placeholder="050-1234567"
                value={newCustomer.phone}
                onChangeText={(text) => setNewCustomer({...newCustomer, phone: text})}
                keyboardType="default"
              />

              <Text style={styles.fieldLabel}>כתובת</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="כתובת מלאה"
                value={newCustomer.address}
                onChangeText={(text) => setNewCustomer({...newCustomer, address: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Customer Modal */}
      <Modal
        visible={showEditCustomerModal}
        animationType="slide"
        onRequestClose={() => setShowEditCustomerModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButtonTouchable}
              onPress={() => setShowEditCustomerModal(false)}
            >
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>עריכת לקוח</Text>
            <TouchableOpacity
              style={styles.saveButtonTouchable}
              onPress={handleEditCustomer}
            >
              <Text style={styles.saveButtonText}>שמור</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={styles.formContainer}>
              <Text style={styles.fieldLabel}>שם הלקוח *</Text>
              <TextInput
                style={styles.input}
                placeholder="שם מלא"
                value={editingCustomer?.name || ''}
                onChangeText={(text) => setEditingCustomer({...editingCustomer, name: text})}
              />

              <Text style={styles.fieldLabel}>אימייל</Text>
              <TextInput
                style={styles.input}
                placeholder="example@email.com"
                value={editingCustomer?.email || ''}
                onChangeText={(text) => setEditingCustomer({...editingCustomer, email: text})}
                keyboardType="email-address"
              />

              <Text style={styles.fieldLabel}>טלפון</Text>
              <TextInput
                style={styles.input}
                placeholder="050-1234567"
                value={editingCustomer?.phone || ''}
                onChangeText={(text) => setEditingCustomer({...editingCustomer, phone: text})}
                keyboardType="default"
              />

              <Text style={styles.fieldLabel}>כתובת</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="כתובת מלאה"
                value={editingCustomer?.address || ''}
                onChangeText={(text) => setEditingCustomer({...editingCustomer, address: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// Tab Navigator
function MainTabs({ session, onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#fff' },
        tabBarActiveTintColor: '#62929e',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          tabBarLabel: 'לוח בקרה',
          tabBarIcon: ({ color, size }) => <IconDashboard color={color} size={size} />,
        }}
      >
        {(props) => <DashboardScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Quotes"
        options={{
          tabBarLabel: 'הצעות מחיר',
          tabBarIcon: ({ color, size }) => <IconQuotes color={color} size={size} />,
        }}
      >
        {(props) => <QuotesScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Customers"
        options={{
          tabBarLabel: 'לקוחות',
          tabBarIcon: ({ color, size }) => <IconCustomers color={color} size={size} />,
        }}
      >
        {(props) => <CustomersScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Catalog"
        options={{
          tabBarLabel: 'קטלוג',
          tabBarIcon: ({ color, size }) => <IconCatalog color={color} size={size} />,
        }}
      >
        {(props) => <CatalogScreen {...props} session={session} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        options={{
          tabBarLabel: 'הגדרות',
          tabBarIcon: ({ color, size }) => <IconSettings color={color} size={size} />,
        }}
      >
        {(props) => <SettingsScreen {...props} session={session} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

// Main App Component
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [session, setSession] = useState(null);
  const [isApprovalChecking, setIsApprovalChecking] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isGuestSession, setIsGuestSession] = useState(false);

  const checkApprovalStatus = async (email) => {
    console.log('🔍 Auto-approving user:', email);
    // Auto-approve all users - no manual approval required
    return true;
  };

  const handleManualLogin = async (mockSession) => {
    console.log('Handling manual login with session:', mockSession);
    console.log('🔍 MANUAL LOGIN - Starting authorization check...');

    if (mockSession?.user?.email) {
      setIsApprovalChecking(true);
      const approved = await checkApprovalStatus(mockSession.user.email);
      console.log('🔍 MANUAL LOGIN - Authorization result:', approved);
      setIsApproved(approved);
      setIsApprovalChecking(false);
    }

    setSession(mockSession);
  };

  const handleLogout = async () => {
    try {
      const { setGuestMode } = require('./lib/localStorage');
      const { signOut } = require('./lib/auth');
      console.log('🚪 Main App handleLogout called');

      // Clear guest mode
      await setGuestMode(false);

      // Sign out from Supabase (this will trigger the auth state listener)
      await signOut();

      // Clear session state
      setSession(null);
      setIsApproved(false);
      setIsGuestSession(false);

      console.log('✅ Logout complete - should return to login screen');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  useEffect(() => {
    // Import guest mode check
    const { isGuestMode } = require('./lib/localStorage');

    // Check for existing session
    const initAuth = async () => {
      // First check if in guest mode
      const guestStatus = await isGuestMode();

      if (guestStatus) {
        console.log('🎭 Guest mode detected - creating demo session');
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
        setIsApproved(true); // Auto-approve demo user
        setIsGuestSession(true);
        setInitializing(false);
        return;
      }

      // Otherwise check for real session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsApprovalChecking(true);
        const approved = await checkApprovalStatus(session.user.email);
        setIsApproved(approved);
        setIsApprovalChecking(false);
      }
      setSession(session);
      setIsGuestSession(false);
      setInitializing(false);
    };

    initAuth();

    // Initialize review tracking and check milestones
    initializeReviewTracking();

    // Initialize RevenueCat when user is logged in
    if (session?.user?.id) {
      RevenueCatService.initialize(session.user.id);
    }

    // Check 7-day milestone after a short delay (to not block app startup)
    setTimeout(() => {
      checkSevenDayMilestone();
    }, 3000);

    // Check guest mode periodically using a ref to track if we should create session
    let hasCreatedGuestSession = false;

    const guestCheckInterval = setInterval(async () => {
      const guestStatus = await isGuestMode();

      // Only create guest session once when guest mode is enabled
      if (guestStatus && !hasCreatedGuestSession) {
        console.log('🎭 Guest mode activated - creating demo session');
        hasCreatedGuestSession = true;
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
        setIsApproved(true);
        setIsGuestSession(true);
      } else if (!guestStatus && hasCreatedGuestSession) {
        // Guest mode was turned off, clear the session
        console.log('👋 Guest mode deactivated - clearing session');
        hasCreatedGuestSession = false;
        setSession(null);
        setIsApproved(false);
        setIsGuestSession(false);
      }
    }, 500);

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);

      // Don't override demo session
      const guestStatus = await isGuestMode();
      if (guestStatus) {
        console.log('🎭 In guest mode - ignoring auth state change');
        return;
      }

      if (session) {
        setIsApprovalChecking(true);
        const approved = await checkApprovalStatus(session.user.email);
        setIsApproved(approved);
        setIsApprovalChecking(false);
      } else {
        setIsApproved(false);
      }
      setSession(session);
      setIsGuestSession(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearInterval(guestCheckInterval);
    };
  }, []);

  if (initializing || isApprovalChecking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#62929e" />
      </View>
    );
  }

  // Show splash screen for 3 seconds
  if (showSplash) {
    return <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session?.user ? (
            !isApproved ? (
              <Stack.Screen name="Unauthorized">
                {() => <UnauthorizedScreen session={session} onLogout={handleLogout} />}
              </Stack.Screen>
            ) : (
            <>
              <Stack.Screen name="Main">
                {() => <MainTabs session={session} onLogout={handleLogout} />}
              </Stack.Screen>
              <Stack.Screen
                name="CreateQuote"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'הצעת מחיר חדשה',
                  headerBackTitle: 'חזור'
                }}
              >
                {(props) => <CreateQuoteScreen {...props} session={session} />}
              </Stack.Screen>
              <Stack.Screen
                name="ViewQuote"
                options={({ navigation, route }) => ({
                  presentation: 'modal',
                  headerShown: true,
                  title: 'צפייה בהצעת מחיר',
                  headerBackTitle: 'חזור',
                  headerRight: () => (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('EditQuote', { quoteId: route.params.quoteId })}
                      style={{ marginRight: 15 }}
                    >
                      <Text style={{ color: '#62929e', fontSize: 16, fontWeight: '500' }}>
                        ערוך
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              >
                {(props) => <ViewQuoteScreen {...props} session={session} />}
              </Stack.Screen>
              <Stack.Screen
                name="EditQuote"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'עריכת הצעת מחיר',
                  headerBackTitle: 'חזור'
                }}
              >
                {(props) => <EditQuoteScreen {...props} session={session} />}
              </Stack.Screen>
              <Stack.Screen
                name="ProductEditor"
                options={{
                  presentation: 'modal',
                  headerShown: true,
                  title: 'עריכת מוצר',
                  headerBackTitle: 'חזור'
                }}
              >
                {(props) => <ProductEditorScreen {...props} session={session} />}
              </Stack.Screen>
              <Stack.Screen
                name="PDFPreview"
                options={{
                  presentation: 'modal',
                  headerShown: false
                }}
              >
                {(props) => <PDFPreviewScreen {...props} />}
              </Stack.Screen>
            </>
            )
          ) : (
            <Stack.Screen name="Login">
              {(props) => <NewLoginScreen {...props} onLogin={handleManualLogin} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // New Login Screen Styles with City Background
  loginScreenContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  safeHeader: {
    backgroundColor: '#f5f5f5',
  },
  loginOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  loginContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logo: {
    width: 266,
    height: 160,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 60,
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  googleButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingVertical: 20,
    paddingHorizontal: 60,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    minWidth: 280,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  googleLogoImage: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Demo Button Styles for Apple Review
  demoButton: {
    backgroundColor: 'rgba(255, 153, 0, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#ff9900',
    shadowColor: '#ff9900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minWidth: 280,
  },
  demoButtonContent: {
    alignItems: 'center',
  },
  demoButtonTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  demoButtonSubtitle: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 2,
  },
  demoInstructions: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9900',
  },
  demoInstructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  demoInstructionsText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    textAlign: 'left',
  },
  loginFooter: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  legalLinksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  legalLink: {
    paddingVertical: 5,
    paddingHorizontal: 2,
  },
  legalLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  legalSeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  header: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Unified themed header with gradient
  unifiedHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  headerGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  // Keep legacy headers for backward compatibility, but use unified color
  quotesHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  quotesHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  customersHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  customersHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  catalogHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  catalogHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  settingsHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  settingsHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  tabsContainer: {
    flexDirection: 'row-reverse',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  dashboardHeader: {
    backgroundColor: '#62929e',
    padding: 20,
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    position: 'relative',
  },
  dashboardHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(98, 146, 158, 0.1)',
    borderBottomWidth: 3,
    borderBottomColor: '#4a7c7e',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  themedHeaderTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
    zIndex: 1,
    marginLeft: 12,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    textAlign: 'right',
  },
  filterContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  filterButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#62929e',
    borderColor: '#62929e',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  quotesList: {
    paddingBottom: 20,
  },
  quoteCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  quoteCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  quoteInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  quoteActions: {
    flexDirection: 'row',
    gap: 5,
  },
  actionButton: {
    backgroundColor: '#f8f9fa',
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  quoteDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'right',
  },
  quoteCustomer: {
    fontSize: 16,
    color: '#333',
    marginVertical: 5,
    textAlign: 'right',
  },
  quoteTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#62929e',
    alignSelf: 'center',
  },
  settingItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#62929e',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#62929e',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  refreshButtonText: {
    fontSize: 20,
    color: '#fff',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  quoteDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    textAlign: 'right',
  },
  quoteDeliveryDate: {
    fontSize: 14,
    color: '#8B4513',
    marginTop: 3,
    fontWeight: '500',
    textAlign: 'right',
  },
  quoteStatus: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
    textAlign: 'right',
  },
  quoteStatusSigned: {
    color: '#27ae60',
  },
  quoteStatusPending: {
    color: '#e67e22',
  },
  signedBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#27ae60',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  signedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  userInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderRightWidth: 4,
    borderRightColor: '#62929e',
  },
  userInfoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  logoutItem: {
    borderTopWidth: 1,
    borderTopColor: '#e74c3c',
    marginTop: 20,
  },
  logoutText: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  profileSection: {
    marginVertical: 10,
  },
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  profileLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
    textAlign: 'right',
  },
  profileValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginRight: 10,
  },
  tierBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  quotaRemainingSmall: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '400',
  },
  deleteAccountButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  deleteAccountText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#62929e',
    marginHorizontal: 20,
    marginBottom: 10,
    textAlign: 'right',
  },
  productsList: {
    paddingBottom: 100,
    flexGrow: 1,
  },
  productCard: {
    backgroundColor: '#fff',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  productInfo: {
    flex: 1,
    paddingRight: 10,
    alignItems: 'flex-end',
  },
  productActions: {
    flexDirection: 'row',
    gap: 5,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
  },
  productDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right',
  },
  productCategory: {
    fontSize: 12,
    color: '#62929e',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-end',
    marginBottom: 8,
    textAlign: 'right',
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'right',
  },
  productUnit: {
    fontSize: 12,
    color: '#999',
  },
  // Create Quote Styles
  progressContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  progressStep: {
    width: 30,
    height: 6,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  progressStepActive: {
    backgroundColor: '#62929e',
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
    textAlign: 'right',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  nextButton: {
    backgroundColor: '#62929e',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonDisabled: {
    backgroundColor: '#ccc',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  backButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepButtons: {
    flexDirection: 'row',
    marginTop: 30,
  },
  stepNextButton: {
    backgroundColor: '#62929e',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  selectedProductsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    maxHeight: 200,
  },
  step2Content: {
    flex: 1,
    flexDirection: 'column',
  },
  selectedProductsSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    maxHeight: 180,
  },
  selectedProductsScrollView: {
    maxHeight: 120,
  },
  catalogSection: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    minHeight: 200,
  },
  catalogTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addGeneralItemButton: {
    backgroundColor: '#62929e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 1,
  },
  addGeneralItemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  generalItemText: {
    color: '#62929e',
    fontWeight: '500',
  },
  editHint: {
    color: '#999',
    fontSize: 12,
    fontWeight: 'normal',
  },
  // General Item Modal Styles
  generalItemModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    margin: 10,
    maxHeight: '80%',
    width: '95%',
    alignSelf: 'center',
  },
  generalItemModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  generalItemForm: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    textAlign: 'right',
  },
  generalItemInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'right',
  },
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  notesSection: {
    marginBottom: 15,
  },
  quantityDisplay: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  generalItemModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelGeneralItemButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelGeneralItemButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  saveGeneralItemButton: {
    flex: 1,
    backgroundColor: '#62929e',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveGeneralItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  selectedProductItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProductName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#62929e',
    minWidth: 70,
    textAlign: 'left',
  },
  productItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    padding: 12,
    marginBottom: 8,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginRight: 15,
    paddingRight: 10,
  },
  productItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'left',
    minWidth: 70,
    paddingLeft: 5,
  },
  summarySection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  totalContainer: {
    borderTopWidth: 2,
    borderTopColor: '#62929e',
    paddingTop: 15,
    marginTop: 15,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'center',
  },
  totalBreakdown: {
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRowFinal: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 10,
    marginTop: 5,
  },
  totalTextFinal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#62929e',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#62929e',
  },
  createButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // View Quote Styles
  quoteViewContainer: {
    flex: 1,
    padding: 20,
  },
  businessHeader: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  businessLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 8,
  },
  businessInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  quoteViewHeader: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteViewTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  quoteViewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#62929e',
  },
  quoteViewDate: {
    fontSize: 14,
    color: '#666',
  },
  signedBadgeLarge: {
    backgroundColor: '#27ae60',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  signedTextLarge: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quoteSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  customerDetails: {
    gap: 5,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#62929e',
  },
  customerInfo: {
    fontSize: 16,
    color: '#666',
  },
  quoteItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quoteItemInfo: {
    flex: 1,
    paddingRight: 15,
  },
  quoteItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteItemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteItemNotes: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteItemPrices: {
    alignItems: 'flex-end',
    minWidth: 100,
  },
  quoteItemPrice: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
  },
  quoteItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'left',
    marginTop: 2,
  },
  quoteTotalsBreakdown: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalBreakdownLabel: {
    fontSize: 16,
    color: '#333',
    textAlign: 'right',
    writingDirection: 'rtl',
    flex: 1,
  },
  totalBreakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'left',
    minWidth: 100,
  },
  quoteTotalContainer: {
    borderTopWidth: 2,
    borderTopColor: '#62929e',
    paddingTop: 15,
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteTotalLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteTotalText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'left',
  },
  signatureStatus: {
    fontSize: 16,
    color: '#333',
  },
  signatureDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  quoteNotesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  quoteActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    backgroundColor: '#f8f9fa',
  },
  actionButtonLarge: {
    backgroundColor: '#62929e',
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Product Editor Styles
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'right',
  },
  saveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 1,
  },
  productSaveButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minHeight: 50,
    width: '100%',
  },
  productSaveButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  // Product Options Styles
  optionsContainer: {
    marginTop: 8,
  },
  optionsLabel: {
    fontSize: 12,
    color: '#62929e',
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
  },
  optionsTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  optionTag: {
    backgroundColor: '#e8f4f8',
    color: '#62929e',
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Selected Products with Options
  selectedProductInfo: {
    flex: 1,
  },
  selectedProductOptions: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  selectedProductNotes: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  // Options Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  optionsModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
    minWidth: '80%',
  },
  optionsModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionsScrollView: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionButtonSelected: {
    backgroundColor: '#e8f4f8',
    borderColor: '#62929e',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionButtonTextSelected: {
    color: '#62929e',
    fontWeight: 'bold',
  },
  checkMark: {
    fontSize: 16,
    color: '#62929e',
    fontWeight: 'bold',
  },
  optionsModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelOptionsButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelOptionsButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  addOptionsButton: {
    backgroundColor: '#62929e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
  },
  addOptionsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Customer Selection Styles
  customerSelectionContainer: {
    marginBottom: 20,
  },
  customerOptionsContainer: {
    marginBottom: 15,
  },
  customerOptionButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#dee2e6',
    marginBottom: 10,
  },
  customerOptionButtonActive: {
    backgroundColor: '#e8f4f8',
    borderColor: '#62929e',
  },
  customerOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  customerOptionTextActive: {
    color: '#62929e',
  },
  existingCustomersContainer: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  existingCustomerItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  existingCustomerItemSelected: {
    backgroundColor: '#e8f4f8',
    borderColor: '#62929e',
  },
  existingCustomerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  existingCustomerNameSelected: {
    color: '#62929e',
  },
  existingCustomerDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  existingCustomerDetailsSelected: {
    color: '#546a7b',
  },
  // Desktop Notice Styles
  desktopNotice: {
    backgroundColor: '#e8f4f8',
    padding: 20,
    margin: 10,
    borderRadius: 8,
    borderRightWidth: 4,
    borderRightColor: '#62929e',
  },
  desktopNoticeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  desktopNoticeSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Swipe Actions Styles
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 75,
    height: '100%',
    paddingVertical: 20,
  },
  swipeActionSigned: {
    backgroundColor: '#27ae60',
  },
  swipeActionPending: {
    backgroundColor: '#e67e22',
  },
  swipeActionEdit: {
    backgroundColor: '#62929e',
  },
  swipeActionDuplicate: {
    backgroundColor: '#546a7b',
  },
  swipeActionDelete: {
    backgroundColor: '#e74c3c',
  },
  swipeActionIcon: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  swipeActionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  // Edit Quote Screen Styles
  quoteEditContainer: {
    flex: 1,
    padding: 20,
  },
  quoteEditHeader: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quoteEditTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#62929e',
    marginBottom: 5,
  },
  quoteEditCustomer: {
    fontSize: 16,
    color: '#666',
  },
  quoteEditSection: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editableItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  editableItemInfo: {
    marginBottom: 10,
  },
  editableItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  editableItemPrice: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
  },
  editableItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  removeButton: {
    marginLeft: 20,
    padding: 5,
  },
  editableItemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#62929e',
    textAlign: 'left',
  },
  editQuoteActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dee2e6',
    minHeight: 50,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveChangesButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveChangesButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Additional Edit Quote Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  addItemButton: {
    backgroundColor: '#62929e',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemNameInput: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    borderBottomWidth: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
    borderBottomColor: '#e0e0e0',
    paddingVertical: 4,
  },
  priceInput: {
    fontSize: 14,
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 4,
  },
  itemNotesInput: {
    fontSize: 14,
    color: '#666',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginVertical: 8,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  totalRow: {
    borderBottomWidth: 0,
    paddingTop: 15,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#62929e',
  },
  discountContainer: {
    paddingVertical: 10,
  },
  discountControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  discountTypeButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#dee2e6',
  },
  discountTypeActive: {
    backgroundColor: '#62929e',
    borderColor: '#62929e',
  },
  discountTypeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  discountTypeTextActive: {
    color: '#fff',
  },
  discountInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  discountValueText: {
    fontSize: 14,
    color: '#e74c3c',
    fontWeight: 'bold',
    marginTop: 8,
  },
  addProductModal: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    maxHeight: '80%',
    width: '90%',
  },
  productListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
  },
  productListName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  productListPrice: {
    fontSize: 16,
    color: '#62929e',
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#546a7b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Date Picker Styles
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerModal: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    minWidth: 80,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#62929e',
    minWidth: 80,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  discountContainer: {
    marginBottom: 15,
  },
  discountTypeSelector: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    padding: 2,
  },
  discountTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  discountTypeButtonActive: {
    backgroundColor: '#62929e',
  },
  discountTypeText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  discountTypeTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  discountInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  discountPreview: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  datePickerWrapper: {
    height: 200,
    width: '100%',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  businessDetailsContainer: {
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  logoSection: {
    marginBottom: 20,
    alignItems: 'center',
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
  },
  logoDisplayContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
  businessLogo: {
    width: 150,
    height: 150,
    backgroundColor: 'transparent',
  },
  logoPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  logoPlaceholderText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  uploadLogoButton: {
    backgroundColor: '#FDDC33',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadLogoButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  businessDetailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 5,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  businessDetailLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 80,
    textAlign: 'right',
    paddingRight: 15,
  },
  businessDetailValue: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    textAlign: 'left',
    marginLeft: 10,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  businessDetailInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 10,
    textAlign: 'left',
    backgroundColor: '#fff',
  },
  colorInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  colorInput: {
    flex: 1,
    marginLeft: 0,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#62929e',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  colorPickerContainer: {
    flex: 1,
    marginLeft: 10,
  },
  colorPalette: {
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedColorDisplay: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 5,
  },
  selectedColorText: {
    fontSize: 12,
    color: '#666',
    marginRight: 8,
    textAlign: 'right',
  },
  logoInputContainer: {
    flex: 1,
    marginLeft: 10,
    alignItems: 'flex-end',
  },
  uploadButton: {
    backgroundColor: '#62929e',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  // Unauthorized Access Screen Styles
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  unauthorizedContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  unauthorizedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#e74c3c',
  },
  unauthorizedMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#666',
    lineHeight: 24,
  },
  unauthorizedSubmessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#888',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  logoutButtonText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  // Customer Management Styles
  customerCard: {
    backgroundColor: '#fff',
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  customerEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
  },
  customerStats: {
    alignItems: 'center',
    paddingLeft: 15,
  },
  customerStatLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  customerStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#62929e',
    marginBottom: 4,
  },
  customerStatRevenue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  customerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 6,
    marginTop: 6,
  },
  actionButton: {
    padding: 6,
  },
  actionIcon: {
    fontSize: 24,
  },
  customersList: {
    paddingBottom: 20,
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButtonTouchable: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
  },
  saveButtonTouchable: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  createQuoteButton: {
    backgroundColor: '#62929e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
  },
  createQuoteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  customerDetailSection: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 15,
    borderRadius: 10,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#62929e',
    marginBottom: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  detailLink: {
    fontSize: 16,
    color: '#007bff',
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  detailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    padding: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#62929e',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  quoteHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    minHeight: 60,
  },
  quoteHistoryNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  quoteHistoryDate: {
    fontSize: 12,
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  quoteHistoryTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  quoteHistoryStatus: {
    fontSize: 12,
    color: '#999',
    flex: 1,
    textAlign: 'left',
  },
  statusSigned: {
    color: '#28a745',
    fontWeight: 'bold',
  },
  noQuotesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },

  // Dashboard Styles
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  quotaContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quotaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  quotaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quotaTier: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  quotaProgress: {
    gap: 10,
  },
  quotaProgressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  quotaProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  quotaText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  quotaRemainingText: {
    color: '#6b7280',
    fontWeight: '400',
  },
  section: {
    marginHorizontal: 15,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    textAlign: 'right',
    writingDirection: 'rtl',
    borderRightWidth: 4,
    borderRightColor: '#FDDC33',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 3,
    borderTopColor: '#10b981',
  },
  quickActionIcon: {
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '600',
  },
  recentItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  recentItemDate: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
  recentItemRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 11,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    minWidth: 60,
  },
  recentItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  topItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  topItemRank: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginRight: 15,
    width: 30,
  },
  topItemName: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  topItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },

  // Template selector styles
  templateSelectionContainer: {
    flex: 1,
    marginLeft: 10,
  },
  templateOption: {
    minWidth: 140,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    padding: 12,
    alignItems: 'center',
  },
  templateOptionSelected: {
    borderColor: '#FDDC33',
    borderWidth: 2,
    backgroundColor: '#fffef0',
  },
  templateOptionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateOptionNameSelected: {
    color: '#d4a900',
  },
  templateOptionDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 14,
  },
  previewButtonSmall: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  previewButtonSmallText: {
    fontSize: 11,
    color: '#555',
    fontWeight: '600',
  },
  pdfPreviewContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  pdfPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pdfPreviewBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  pdfPreviewBackButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  pdfPreviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  pdfPreviewShareButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FDDC33',
  },
  pdfPreviewShareButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  pdfPreviewWebViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfPreviewWebView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdfPreviewLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    zIndex: 10,
  },
  pdfPreviewLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '600',
  },
  // Tier Selection Styles
  tierSelectionSection: {
    marginBottom: 24,
  },
  tierSelectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
    textAlign: 'center',
  },
  tierSelectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  rejectedAlert: {
    backgroundColor: '#fee',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcc',
  },
  rejectedAlertTitle: {
    fontSize: 14,
    color: '#c33',
    fontWeight: '600',
    marginBottom: 4,
  },
  rejectedAlertText: {
    fontSize: 12,
    color: '#666',
  },
  pendingAlert: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffd966',
  },
  pendingAlertTitle: {
    fontSize: 14,
    color: '#856404',
    fontWeight: '600',
    marginBottom: 4,
  },
  pendingAlertText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  pendingAlertSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  tierCardsContainer: {
    paddingHorizontal: 4,
  },
  tierCardsScroll: {
    marginBottom: 16,
  },
  tierCard: {
    width: 280,
    marginRight: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  tierName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tierPrice: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  tierDivider: {
    height: 2,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  tierQuota: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  tierFeatures: {
    marginBottom: 16,
  },
  tierFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tierFeatureCheck: {
    fontSize: 14,
    color: '#22c55e',
    marginRight: 8,
    marginTop: 2,
  },
  tierFeatureText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  tierDescription: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  tierButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
  },
  tierButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  currentTierBadge: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#22c55e20',
    borderRadius: 8,
    alignItems: 'center',
  },
  currentTierText: {
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '600',
  },
  valueProposition: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  valueText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});
