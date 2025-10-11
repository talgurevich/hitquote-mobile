import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ImageBackground,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  signInWithApple,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  continueAsGuest,
  isAppleAuthAvailable,
} from '../lib/auth';
import { SlackUserActivity, SlackErrors } from '../lib/slackService';

const EmailFormComponent = ({
  isSignUp,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  emailLoading,
  handleEmailAuth,
  setIsSignUp,
  setShowEmailForm
}) => (
  <View style={styles.emailFormContainer}>
    {isSignUp && (
      <TextInput
        style={styles.input}
        placeholder="שם מלא"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        textAlign="right"
        editable={true}
        autoCorrect={false}
        returnKeyType="next"
      />
    )}
    <TextInput
      style={styles.input}
      placeholder="דוא״ל"
      placeholderTextColor="#999"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      autoCapitalize="none"
      textAlign="right"
      editable={true}
      autoCorrect={false}
      returnKeyType="next"
    />
    <TextInput
      style={styles.input}
      placeholder="סיסמה"
      placeholderTextColor="#999"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
      textAlign="right"
      editable={true}
      autoCorrect={false}
      returnKeyType="done"
    />

    <TouchableOpacity
      style={styles.primaryButton}
      onPress={handleEmailAuth}
      disabled={emailLoading}
    >
      {emailLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.primaryButtonText}>{isSignUp ? 'הרשמה' : 'התחברות'}</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
      <Text style={styles.switchAuthText}>
        {isSignUp ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון? הירשם'}
      </Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={() => setShowEmailForm(false)}>
      <Text style={styles.backText}>← חזרה</Text>
    </TouchableOpacity>
  </View>
);

export default function NewLoginScreen({ navigation }) {
  const [appleLoading, setAppleLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    checkAppleAuth();
  }, []);

  const checkAppleAuth = async () => {
    const available = await isAppleAuthAvailable();
    setAppleAvailable(available);
  };

  const handleAppleLogin = async () => {
    try {
      setAppleLoading(true);
      const result = await signInWithApple();

      if (result.error) {
        Alert.alert('שגיאה', result.error.message || 'שגיאה בהתחברות עם Apple');
        SlackErrors.authError(result.session?.user?.email || 'unknown', result.error.message, 'Apple Sign-In');
      } else if (result.session?.user) {
        // Send Slack notification for new user registration
        SlackUserActivity.newUserRegistration(
          result.session.user.email,
          result.session.user.user_metadata?.full_name || result.session.user.email,
          result.session.user.id
        );
      }
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות עם Apple');
      SlackErrors.authError('unknown', error.message, 'Apple Sign-In');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle();

      if (result.error) {
        Alert.alert('שגיאה', result.error.message || 'שגיאה בהתחברות עם Google');
        SlackErrors.authError(result.session?.user?.email || 'unknown', result.error.message, 'Google Sign-In');
      } else if (result.session?.user) {
        // Send Slack notification for new user registration
        SlackUserActivity.newUserRegistration(
          result.session.user.email,
          result.session.user.user_metadata?.full_name || result.session.user.email,
          result.session.user.id
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתחברות עם Google');
      SlackErrors.authError('unknown', error.message, 'Google Sign-In');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('שגיאה', 'אנא מלא את כל השדות');
      return;
    }

    if (isSignUp && !fullName) {
      Alert.alert('שגיאה', 'אנא הזן שם מלא');
      return;
    }

    try {
      setEmailLoading(true);
      const result = isSignUp
        ? await signUpWithEmail(email, password, fullName)
        : await signInWithEmail(email, password);

      if (result.error) {
        Alert.alert('שגיאה', result.error.message || `שגיאה ב${isSignUp ? 'הרשמה' : 'התחברות'}`);
        SlackErrors.authError(email, result.error.message, isSignUp ? 'Email Sign-Up' : 'Email Sign-In');
      } else if (isSignUp) {
        Alert.alert(
          'הרשמה הושלמה',
          'אנא בדוק את תיבת הדוא"ל שלך לאימות החשבון',
          [{ text: 'הבנתי', onPress: () => setShowEmailForm(false) }]
        );
        // Send Slack notification for new user registration
        if (result.session?.user) {
          SlackUserActivity.newUserRegistration(
            result.session.user.email,
            fullName || result.session.user.email,
            result.session.user.id
          );
        }
      } else if (result.session?.user) {
        // Sign-in success - send notification
        SlackUserActivity.newUserRegistration(
          result.session.user.email,
          result.session.user.user_metadata?.full_name || result.session.user.email,
          result.session.user.id
        );
      }
    } catch (error) {
      console.error('Email auth error:', error);
      Alert.alert('שגיאה', error.message || `שגיאה ב${isSignUp ? 'הרשמה' : 'התחברות'}`);
      SlackErrors.authError(email, error.message, isSignUp ? 'Email Sign-Up' : 'Email Sign-In');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGuestMode = async () => {
    console.log('🔘 Guest button pressed');
    try {
      setGuestLoading(true);
      console.log('⏳ Loading state set to true');
      const result = await continueAsGuest();
      console.log('✅ continueAsGuest returned:', result);
      // AuthContext will detect guest mode via interval check
    } catch (error) {
      console.error('❌ Guest mode error:', error);
      Alert.alert('שגיאה', 'שגיאה במעבר למצב אורח');
    } finally {
      console.log('✅ Setting loading state to false');
      setGuestLoading(false);
    }
  };


  return (
    <ImageBackground
      source={require('../assets/bg1.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.overlay}>
              <View style={styles.content}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require('../assets/logo2.png')}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                </View>

                <Text style={styles.heroTitle}>מערכת הצעות מחיר</Text>
                <Text style={styles.heroSubtitle}>נהל את העסק שלך בצורה חכמה ויעילה</Text>

                {!showEmailForm ? (
                  <>
                    {/* Apple Sign-In (iOS only) */}
                    {appleAvailable && (
                      <TouchableOpacity
                        style={styles.appleButton}
                        onPress={handleAppleLogin}
                        disabled={appleLoading}
                      >
                        {appleLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <View style={styles.buttonContent}>
                            <Image
                              source={require('../assets/applelogo.png')}
                              style={styles.appleLogo}
                              resizeMode="contain"
                            />
                            <Text style={styles.appleButtonText}>התחבר עם Apple</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Google Sign-In */}
                    <TouchableOpacity
                      style={styles.googleButton}
                      onPress={handleGoogleLogin}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <ActivityIndicator color="#1f2937" />
                      ) : (
                        <View style={styles.buttonContent}>
                          <Image
                            source={require('../google logo.png')}
                            style={styles.googleLogo}
                            resizeMode="contain"
                          />
                          <Text style={styles.googleButtonText}>התחבר עם Google</Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Email Sign-In */}
                    <TouchableOpacity
                      style={styles.emailButton}
                      onPress={() => setShowEmailForm(true)}
                      disabled={false}
                    >
                      <View style={styles.buttonContent}>
                        <Text style={styles.emailIcon}>📧</Text>
                        <Text style={styles.emailButtonText}>התחבר עם דוא״ל</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>או</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Guest Mode */}
                    <TouchableOpacity
                      style={styles.guestButton}
                      onPress={handleGuestMode}
                      disabled={guestLoading}
                    >
                      {guestLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Text style={styles.guestButtonText}>המשך כאורח</Text>
                          <Text style={styles.guestButtonSubtext}>
                            צפייה בלבד - ללא שמירה בענן
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <EmailFormComponent
                    isSignUp={isSignUp}
                    fullName={fullName}
                    setFullName={setFullName}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    emailLoading={emailLoading}
                    handleEmailAuth={handleEmailAuth}
                    setIsSignUp={setIsSignUp}
                    setShowEmailForm={setShowEmailForm}
                  />
                )}
              </View>

              <View style={styles.footer}>
                <View style={styles.legalLinks}>
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
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 240,
    height: 240,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
    marginBottom: 40,
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    minHeight: 50,
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleLogo: {
    width: 18,
    height: 18,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  appleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  googleLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleButtonText: {
    color: '#1f2937',
    fontSize: 16,
    fontWeight: '600',
  },
  emailIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  emailButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dividerText: {
    color: '#e5e7eb',
    marginHorizontal: 10,
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButtonSubtext: {
    color: '#e5e7eb',
    fontSize: 12,
    marginTop: 4,
  },
  emailFormContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    minHeight: 50,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  switchAuthText: {
    color: '#e5e7eb',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  backText: {
    color: '#e5e7eb',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 20,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  legalLink: {
    padding: 5,
  },
  legalLinkText: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  legalSeparator: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
  },
});
