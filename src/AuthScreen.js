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

const AuthScreen = ({ onLoginSuccess }) => {
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
      
      // Set timeout to reset loading if OAuth takes too long or is cancelled
      oauthTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        Alert.alert('Login Cancelled', 'OAuth flow was not completed. Please try again.');
        oauthTimeoutRef.current = null;
      }, 120000); // 2 minute timeout
      
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      // If user explicitly closes browser without completing OAuth
      if (result.type === 'cancel' || result.type === 'dismiss') {
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current);
          oauthTimeoutRef.current = null;
        }
        setLoading(false);
        console.log('ℹ️ User dismissed Google OAuth browser');
      }
    } catch (error) {
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
      setLoading(false);
      console.error('❌ Google OAuth error:', error);
      Alert.alert('Google Login Failed', error.message);
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const { API_URL } = require('./config');
      const oauthUrl = `${API_URL}/auth?action=facebook-oauth&redirect=souldiary://oauth-callback`;
      
      // Set timeout to reset loading if OAuth takes too long or is cancelled
      oauthTimeoutRef.current = setTimeout(() => {
        setLoading(false);
        Alert.alert('Login Cancelled', 'OAuth flow was not completed. Please try again.');
        oauthTimeoutRef.current = null;
      }, 120000); // 2 minute timeout
      
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      // If user explicitly closes browser without completing OAuth
      if (result.type === 'cancel' || result.type === 'dismiss') {
        if (oauthTimeoutRef.current) {
          clearTimeout(oauthTimeoutRef.current);
          oauthTimeoutRef.current = null;
        }
        setLoading(false);
        console.log('ℹ️ User dismissed Facebook OAuth browser');
      }
    } catch (error) {
      if (oauthTimeoutRef.current) {
        clearTimeout(oauthTimeoutRef.current);
        oauthTimeoutRef.current = null;
      }
      setLoading(false);
      console.error('❌ Facebook OAuth error:', error);
      Alert.alert('Facebook Login Failed', error.message);
    }
  };

  const handleSocialLogin = async (provider, token) => {
    // Clear timeout on successful callback
    if (oauthTimeoutRef.current) {
      clearTimeout(oauthTimeoutRef.current);
      oauthTimeoutRef.current = null;
    }
    
    setLoading(true);
    try {
      await authService.saveToken(token);
      let currentUser;

      try {
        currentUser = await authService.getCurrentUser();
        if (!currentUser) throw new Error('Failed to retrieve user data');

        if (!currentUser.name || currentUser.name.trim() === '') {
          const nameFromEmail = currentUser.email?.split('@')[0] || 'User';
          currentUser.name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        }
      } catch (error) {
        console.error(`⚠️ Failed to fetch user data after ${provider} OAuth:`, error);
        currentUser = {
          email: 'user@example.com',
          name: 'User',
          provider: provider
        };
        Alert.alert('Note', `You've been logged in. Please refresh your profile if needed.`);
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
        // Show OTP modal for verification
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

  // OTP Verification Handler
  const handleOtpVerification = async () => {
    // Validate email
    if (!registrationEmail || !registrationEmail.trim()) {
      setOtpError('Please enter your email address');
      return;
    }

    // Validate OTP
    if (!otp || otp.trim().length !== 6) {
      setOtpError('Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      console.log('🔐 Verifying OTP for:', registrationEmail);

      // Call OTP verification API
      const response = await authService.verifyOtp(registrationEmail, otp, otpType);

      console.log('✅ OTP verified:', response);

      // Close modal and show success
      setShowOtpModal(false);
      setOtp('');

      // Reset form
      if (otpType === 'register') {
        setIsRegister(false);
        setFullName('');
        setEmailInput('');
        setPasswordInput('');
        setRegistrationEmail('');

        Alert.alert(
          'Email Verified!',
          'Your email has been verified successfully. You can now log in.'
        );
      } else if (otpType === 'forgotPassword') {
        setEmailInput(registrationEmail);
        setPasswordInput('');
        setRegistrationEmail('');

        Alert.alert(
          'Email Verified!',
          'A new password has been sent to your email. Please check your inbox.'
        );
      }
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      const errorMsg = error.message || 'Invalid OTP. Please try again.';
      setOtpError(errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle "Forgot Password?" - Show OTP Modal
  const handleForgotPassword = () => {
    setRegistrationEmail(emailInput);
    setOtpType('forgotPassword');
    setOtpModalSource('manual');
    setOtp('');
    setOtpError('');
    setShowOtpModal(true);
  };

  // Resend OTP Handler
  const handleResendOtp = async () => {
    if (!registrationEmail || !registrationEmail.trim()) {
      setOtpError('Please enter your email address');
      Alert.alert('Email Required', 'Please enter your email address before resending OTP');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');
      console.log('🔄 Resending OTP to:', registrationEmail);

      // Call resend OTP API
      await authService.resendOtp(registrationEmail, otpType);

      Alert.alert('Success', 'OTP has been resent to your email. Check your inbox.');
    } catch (error) {
      console.error('❌ Resend OTP failed:', error);
      const errorMsg = error.message || 'Failed to resend OTP';
      setOtpError(errorMsg);
      Alert.alert('Resend Failed', errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // Manually open OTP verification modal - for "Verify Email with OTP" link
  const handleOpenOtpModal = () => {
    setOtpModalSource('manual');
    setRegistrationEmail(''); // Clear email so user can enter one
    setOtpType('register');
    setShowOtpModal(true);
    setOtp('');
    setOtpError('');
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

            {/* Divider */}
            <Divider text="OR CONTINUE WITH" themeColors={themeColors} />

            {/* Social Buttons */}
            <SocialButtons
              onFacebookPress={handleFacebookLogin}
              onGooglePress={handleGoogleLogin}
              disabled={loading}
              themeColors={themeColors}
            />

            {/* Footer */}
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

              {/* Verify Email Option */}
              {!isRegister && (
                <TouchableOpacity
                  onPress={handleOpenOtpModal}
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

        {/* OTP Verification Modal */}
        <Modal
          visible={showOtpModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowOtpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  onPress={() => setShowOtpModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="close" size={24} color={themeColors.text} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                  {otpModalSource === 'auto' ? 'Verify Your Email' : 'Verify Email with OTP'}
                </Text>
                <View style={{ width: 24 }} />
              </View>

              {/* Modal Body */}
              <ScrollView
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalIconContainer}>
                  <MaterialIcons name="mail-lock" size={60} color={COLORS.primary} />
                </View>

                <Text style={[styles.modalSubtitle, { color: themeColors.text }]}>
                  {otpModalSource === 'auto'
                    ? "We've sent a verification code to"
                    : "Enter your email to verify"}
                </Text>

                {otpModalSource === 'auto' ? (
                  <Text style={[styles.modalEmail, { color: themeColors.textSecondary }]}>{registrationEmail}</Text>
                ) : (
                  <View style={[styles.inputBox, { marginVertical: 16, backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
                    <MaterialIcons name="mail-outline" size={20} color={themeColors.textMuted} />
                    <TextInput
                      style={[styles.input, { color: themeColors.text }]}
                      placeholder="your.email@example.com"
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={registrationEmail}
                      onChangeText={setRegistrationEmail}
                      editable={!otpLoading}
                    />
                  </View>
                )}

                <Text style={[styles.modalInstruction, { color: themeColors.textSecondary }]}>
                  {otpModalSource === 'auto'
                    ? "Enter the 6-digit code sent to your email below to complete your registration."
                    : "Enter the 6-digit verification code you received via email."}
                </Text>

                {/* OTP Input */}
                <View style={styles.otpInputContainer}>
                  <TextInput
                    style={[
                      styles.otpInput,
                      { color: themeColors.text, borderColor: themeColors.border, backgroundColor: themeColors.background },
                      otpError && styles.otpInputError
                    ]}
                    placeholder="000000"
                    placeholderTextColor={themeColors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (otpError) setOtpError('');
                    }}
                    editable={!otpLoading}
                  />
                </View>

                {otpError && (
                  <View style={[styles.errorContainer, { borderColor: '#EF4444' }]}>
                    <MaterialIcons name="error" size={18} color="#EF4444" />
                    <Text style={[styles.errorText, { color: '#EF4444' }]}>{otpError}</Text>
                  </View>
                )}

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.verifyButton, (otpLoading || otp.length !== 6) && styles.buttonDisabled]}
                  onPress={handleOtpVerification}
                  disabled={otpLoading || otp.length !== 6}
                  activeOpacity={0.8}
                >
                  {otpLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.verifyButtonText}>
                        {otpModalSource === 'auto' ? 'Verify & Complete' : 'Verify Email'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                  <Text style={[styles.resendText, { color: themeColors.textSecondary }]}>Didn't receive the code? </Text>
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={otpLoading}
                  >
                    <Text style={[styles.resendLink, otpLoading && { opacity: 0.5 }, { color: COLORS.primary }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  mainButton: {
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  mainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.5,
  },
  forgotPasswordLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'center',
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 24,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalInstruction: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  otpInputContainer: {
    marginBottom: 16,
  },
  otpInput: {
    borderWidth: 2,
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    padding: 16,
    textAlign: 'center',
    letterSpacing: 12,
  },
  otpInputError: {
    borderColor: '#EF4444 !important',
    backgroundColor: '#FEE2E2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    marginLeft: 8,
    flex: 1,
  },
  verifyButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Manrope_700Bold',
    marginLeft: 8,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    fontFamily: 'Manrope_400Regular',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
  },
});

export default AuthScreen;
