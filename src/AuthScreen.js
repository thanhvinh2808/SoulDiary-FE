import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  Linking,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, getThemeColors } from './theme';
import { authService } from './services/authService';
import { useTheme } from './context/ThemeContext';

// Components
import FormInput from './components/Auth/FormInput';
import SocialButtons from './components/Auth/SocialButtons';
import { FormLabel, ErrorMessage, Divider } from './components/Auth/FormElements';

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLoginSuccess, onForgotPassword: onForgotPasswordCallback }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const oauthTimeoutRef = useRef(null);

  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpModalSource, setOtpModalSource] = useState('auto'); // 'auto' for after register, 'manual' for manual verify
  const [otpType, setOtpType] = useState(''); // 'register' or 'forgotPassword'

  // OAuth Flow
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      if (!url) return;
      
      // Clear timeout if we get a valid callback
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }

      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const error = urlObj.searchParams.get('error');
        const provider = urlObj.searchParams.get('provider');

        if (error) {
          setLoading(false);
          Alert.alert('Login Failed', decodeURIComponent(error));
          return;
        }

        if (token) {
          handleSocialLogin(provider, token);
        }
      } catch (error) {
        console.error('⚠️ Error parsing OAuth callback:', error.message);
        setLoading(false);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => {
      subscription.remove();
      // Cleanup timeout on unmount
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
      }
    };
  }, []);

  // OAuth Handlers
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { API_URL } = require('./config');
      const oauthUrl = `${API_URL}/auth?action=google-oauth&redirect=souldiary://oauth-callback`;
      
      oauthTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        Alert.alert('Login Cancelled', 'OAuth flow was not completed. Please try again.');
        oauthTimeoutRef.current = null;
      }, 120000);
      
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      if (result.type === 'cancel' || result.type === 'dismiss') {
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current);
          oauthTimeoutRef.current = null;
        }
        setLoading(false);
      }
    } catch (error) {
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
      setLoading(false);
      Alert.alert('Google Login Failed', error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const { API_URL } = require('./config');
      const oauthUrl = `${API_URL}/auth?action=facebook-oauth&redirect=souldiary://oauth-callback`;
      
      oauthTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        Alert.alert('Login Cancelled', 'OAuth flow was not completed. Please try again.');
        oauthTimeoutRef.current = null;
      }, 120000);
      
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      if (result.type === 'cancel' || result.type === 'dismiss') {
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current);
          oauthTimeoutRef.current = null;
        }
        setLoading(false);
      }
    } catch (error) {
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
      setLoading(false);
      Alert.alert('Facebook Login Failed', error.message);
    }
  };

  const handleSocialLogin = async (provider, token) => {
    if (oauthTimeoutRef.current) {
      clearTimeout(oauthTimeoutRef.current);
      oauthTimeoutRef.current = null;
    }
    
    setLoading(true);
    try {
      await authService.saveToken(token);
      let currentUser = await authService.getCurrentUser();
      
      if (!currentUser.name || currentUser.name.trim() === '') {
        const nameFromEmail = currentUser.email?.split('@')[0] || 'User';
        currentUser.name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
      }

      onLoginSuccess(currentUser);
    } catch (error) {
      console.error(`❌ ${provider} login critical error:`, error);
      Alert.alert('Login Failed', error.message || 'Could not complete login');
      setLoading(false);
    }
  };

  // Email/Password Auth
  const handleAuth = async () => {
    if (!emailInput || !passwordInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isRegister && !fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (passwordInput.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await authService.register(fullName, emailInput, passwordInput);
        setRegistrationEmail(emailInput);
        setOtpType('register');
        setOtpModalSource('auto');
        setShowOtpModal(true);
      } else {
        const responseData = await authService.login(emailInput, passwordInput);
        onLoginSuccess(responseData.data?.user || responseData.user);
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message || 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (!registrationEmail || !registrationEmail.trim()) {
      setOtpError('Please enter your email address');
      return;
    }

    if (!otp || otp.trim().length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      await authService.verifyOtp(registrationEmail, otp, otpType);
      setShowOtpModal(false);
      setOtp('');

      if (otpType === 'register') {
        setIsRegister(false);
        setFullName('');
        setEmailInput('');
        setPasswordInput('');
        Alert.alert('Email Verified!', 'Your email has been verified successfully. You can now log in.');
      } else if (otpType === 'forgotPassword') {
        setEmailInput(registrationEmail);
        Alert.alert('Email Verified!', 'A new password has been sent to your email.');
      }
    } catch (error) {
      setOtpError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPasswordCallback) {
      onForgotPasswordCallback();
    } else {
      setRegistrationEmail(emailInput);
      setOtpType('forgotPassword');
      setOtpModalSource('manual');
      setOtp('');
      setOtpError('');
      setShowOtpModal(true);
    }
  };

  const handleResendOtp = async () => {
    if (!registrationEmail) {
      Alert.alert('Email Required', 'Please enter your email address');
      return;
    }

    try {
      setOtpLoading(true);
      await authService.resendOtp(registrationEmail, otpType);
      Alert.alert('Success', 'OTP has been resent to your email.');
    } catch (error) {
      Alert.alert('Resend Failed', error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="edit-note" size={95} color={COLORS.primary} />
              </View>
              <Text style={[styles.appName, { color: themeColors.text }]}>SoulDiary</Text>
              <Text style={[styles.title, { color: themeColors.text }]}>
                {isRegister ? 'Create Account' : 'Hi, My Friend!'}
              </Text>
              <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>
                {isRegister
                  ? 'Sign up to start your journaling journey'
                  : 'Log in to continue your story'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              {isRegister && (
                <View style={styles.inputWrapper}>
                  <FormLabel label="Full Name" themeColors={themeColors} />
                  <FormInput
                    icon="person-outline"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    themeColors={themeColors}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <FormLabel label="Email Address" themeColors={themeColors} />
                <FormInput
                  icon="mail-outline"
                  placeholder="name@example.com"
                  value={emailInput}
                  onChangeText={setEmailInput}
                  keyboardType="email-address"
                  autoComplete="email"
                  themeColors={themeColors}
                />
              </View>

              <View style={styles.inputWrapper}>
                <FormLabel label="Password" themeColors={themeColors} />
                <FormInput
                  icon="lock-outline"
                  placeholder="Enter password"
                  value={passwordInput}
                  onChangeText={setPasswordInput}
                  secureTextEntry
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                  autoComplete="password"
                  themeColors={themeColors}
                />
              </View>

              {/* Main Button */}
              <TouchableOpacity
                style={[styles.mainButton, loading && styles.buttonDisabled]}
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.mainButtonText}>
                  {loading ? 'Loading...' : (isRegister ? 'Sign Up' : 'Log In')}
                </Text>
              </TouchableOpacity>

              {/* Forgot Password */}
              {!isRegister && (
                <TouchableOpacity 
                  style={{ marginTop: 12 }}
                  onPress={handleForgotPassword}
                  disabled={loading}
                >
                  <Text style={[styles.forgotPasswordLink, loading && { opacity: 0.5 }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Divider text="OR CONTINUE WITH" themeColors={themeColors} />

            <SocialButtons
              onFacebookPress={handleFacebookLogin}
              onGooglePress={handleGoogleLogin}
              disabled={loading}
              themeColors={themeColors}
            />

            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => {
                  setIsRegister(!isRegister);
                  setFullName('');
                  setEmailInput('');
                  setPasswordInput('');
                }}
              >
                <Text style={[styles.linkText, { color: COLORS.primary }]}>
                  {isRegister
                    ? 'Already have an account? Log In'
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
              
              {!isRegister && (
                <TouchableOpacity
                  onPress={() => {
                    setOtpModalSource('manual');
                    setRegistrationEmail('');
                    setOtpType('register');
                    setShowOtpModal(true);
                  }}
                  style={{ marginTop: 16 }}
                >
                  <Text style={[styles.linkText, { fontSize: 13, color: COLORS.primary }]}>
                    ✉️ Verify Email with OTP
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* OTP Modal */}
        <Modal visible={showOtpModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                  <MaterialIcons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>Verification</Text>
                <View style={{ width: 24 }} />
              </View>
              
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.modalIconContainer}>
                  <MaterialIcons name="mail-lock" size={60} color={COLORS.primary} />
                </View>
                
                <Text style={[styles.modalSubtitle, { color: themeColors.text }]}>Enter Verification Code</Text>
                
                {otpModalSource === 'manual' && (
                  <View style={[styles.inputBox, { marginVertical: 16, backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="your.email@example.com"
                      placeholderTextColor={themeColors.textMuted}
                      value={registrationEmail}
                      onChangeText={setRegistrationEmail}
                    />
                  </View>
                )}
                
                <TextInput
                  style={[styles.otpInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
                
                {otpError && <Text style={{ color: '#EF4444', textAlign: 'center', marginTop: 8 }}>{otpError}</Text>}
                
                <TouchableOpacity
                  style={[styles.verifyButton, (otpLoading || otp.length !== 6) && styles.buttonDisabled]}
                  onPress={handleOtpVerification}
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.verifyButtonText}>Verify</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleResendOtp} disabled={otpLoading}>
                  <Text style={{ color: COLORS.primary, textAlign: 'center', marginTop: 16 }}>Resend OTP</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: { marginBottom: 16 },
  appName: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  formContainer: { paddingHorizontal: 24, marginBottom: 20 },
  inputWrapper: { marginBottom: 16 },
  mainButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  buttonDisabled: { opacity: 0.6 },
  mainButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  forgotPasswordLink: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
  modalScrollContent: { paddingBottom: 24 },
  modalIconContainer: { alignItems: 'center', marginBottom: 20 },
  modalSubtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  otpInput: { borderWidth: 2, borderRadius: 12, fontSize: 24, fontWeight: '700', padding: 16, textAlign: 'center', letterSpacing: 10, marginTop: 16 },
  verifyButton: { backgroundColor: COLORS.primary, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  verifyButtonText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  inputBox: { borderHorizontal: 12, borderWidth: 1, borderRadius: 12, height: 50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 14 }
});

export default AuthScreen;