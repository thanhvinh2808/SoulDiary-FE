import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  Linking
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { COLORS } from './theme';
import { authService } from './services/authService';

// 🔧 Complete the OAuth session
WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLoginSuccess }) => {
  // State quản lý UI
  const insets = useSafeAreaInsets();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthInProgress, setOauthInProgress] = useState(false);
  
  // OTP Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpModalSource, setOtpModalSource] = useState('auto'); // 'auto' for after register, 'manual' for manual verify
  
  // Forgot Password State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStep, setForgotPasswordStep] = useState('email'); // 'email', 'otp', 'reset'
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordToken, setForgotPasswordToken] = useState(''); // Temporary token from OTP
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // State Form
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // 🔧 CUSTOM OAUTH FLOW - Backend-driven OAuth for reliability
  // Instead of expo-auth-session, use direct browser + deep link listener
  
  // Listen for OAuth callback redirects
  useEffect(() => {
    const handleDeepLink = ({ url }) => {
      console.log('🔗 Deep link received:', url);
      
      if (!url) return;
      
      try {
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get('token');
        const error = urlObj.searchParams.get('error');
        const provider = urlObj.searchParams.get('provider');
        
        if (error) {
          console.error(`❌ OAuth error from ${provider}:`, error);
          Alert.alert('Login Failed', decodeURIComponent(error));
          return;
        }
        
        if (token) {
          console.log(`✅ OAuth token received from ${provider}`);
          handleSocialLogin(provider, token);
        }
      } catch (error) {
        console.error('⚠️ Error parsing OAuth callback:', error.message);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // 🔧 GOOGLE LOGIN - Opens browser to backend OAuth endpoint
  const handleGoogleLogin = async () => {
    try {
      setOauthInProgress(true);
      setLoading(true);
      
      const { API_URL } = require('./config');
      const oauthUrl = `${API_URL}/auth?action=google-oauth&redirect=souldiary://oauth-callback`;
      
      console.log('🔵 Opening Google OAuth browser:', oauthUrl);
      
      // Open browser to OAuth endpoint
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      console.log('📱 Browser result:', result);
    } catch (error) {
      console.error('❌ Google OAuth error:', error);
      Alert.alert('Google Login Failed', error.message);
    } finally {
      setOauthInProgress(false);
      setLoading(false);
    }
  };

  // 🔧 FACEBOOK LOGIN - Opens browser to backend OAuth endpoint
  const handleFacebookLogin = async () => {
    try {
      setOauthInProgress(true);
      setLoading(true);
      
      const { API_URL } = require('./config');
      const oauthUrl = `${API_URL}/auth?action=facebook-oauth&redirect=souldiary://oauth-callback`;
      
      console.log('🔵 Opening Facebook OAuth browser:', oauthUrl);
      
      // Open browser to OAuth endpoint
      const result = await WebBrowser.openBrowserAsync(oauthUrl);
      
      console.log('📱 Browser result:', result);
    } catch (error) {
      console.error('❌ Facebook OAuth error:', error);
      Alert.alert('Facebook Login Failed', error.message);
    } finally {
      setOauthInProgress(false);
      setLoading(false);
    }
  };

  // 🔧 XỬ LÝ SOCIAL LOGIN - Gửi token lên backend
  const handleSocialLogin = async (provider, token) => {
    setLoading(true);
    try {
      // Save the token received from OAuth callback
      await authService.saveToken(token);
      
      console.log(`✅ ${provider} login successful, token saved`);
      
      // Fetch actual user data from backend using the token
      let currentUser;
      try {
        currentUser = await authService.getCurrentUser();
        console.log(`✅ ${provider} user data fetched:`, currentUser);
        
        if (!currentUser) {
          throw new Error('Failed to retrieve user data');
        }
        
        // Ensure user has a name
        if (!currentUser.name || currentUser.name.trim() === '') {
          console.warn('⚠️ User has no name, extracting from email');
          const nameFromEmail = currentUser.email?.split('@')[0] || 'User';
          currentUser.name = nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);
        }
      } catch (error) {
        console.error(`⚠️ Failed to fetch user data after ${provider} OAuth:`, error);
        // As fallback, create minimal user object with email from OAuth
        // This prevents the app from getting stuck
        currentUser = {
          email: 'user@example.com',
          name: 'User',
          provider: provider
        };
        
        Alert.alert('Note', `You've been logged in. Please refresh your profile if needed.`);
      }
      
      // Call onLoginSuccess with user data (should never be null now)
      onLoginSuccess(currentUser);
    } catch (error) {
      console.error(`❌ ${provider} login critical error:`, error);
      Alert.alert('Login Failed', error.message || 'Could not complete login');
      setLoading(false);
    }
  };

  // 🔧 XỬ LÝ EMAIL/PASSWORD AUTH
  const handleAuth = async () => {
    // Validation
    if (!emailInput || !passwordInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    if (isRegister && !fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Password length check
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
        setOtpModalSource('auto');
        setShowOtpModal(true);
      } else {
        const responseData = await authService.login(emailInput, passwordInput);
        onLoginSuccess(responseData.data?.user || responseData.user);
      }
    } catch (error) {
      Alert.alert(
        'Authentication Failed', 
        error.message || 'Please check your credentials and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 🔧 XỬ LÝ OTP VERIFICATION
  const handleOtpVerification = async () => {
    // Validate email
    if (!registrationEmail || !registrationEmail.trim()) {
      setOtpError('⚠️ Please enter your email address');
      return;
    }

    // Validate OTP
    if (!otp || otp.trim().length !== 6) {
      setOtpError('⚠️ Please enter a valid 6-digit OTP code');
      return;
    }

    setOtpLoading(true);
    setOtpError('');
    try {
      console.log('🔐 Verifying OTP for:', registrationEmail);
      
      // Call OTP verification API
      const response = await authService.verifyOtp(registrationEmail, otp);
      
      console.log('✅ OTP verified:', response);
      
      // Close modal and show success
      setShowOtpModal(false);
      setOtp('');
      
      // Reset form
      setIsRegister(false);
      setFullName('');
      setEmailInput('');
      setPasswordInput('');
      setRegistrationEmail('');
      
      // OTP screen provides success feedback, so we don't show a separate notification
      // Just close the modal to return to login form
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      const errorMsg = error.message || 'Invalid OTP. Please try again.';
      setOtpError(`⚠️ ${errorMsg}`);
    } finally {
      setOtpLoading(false);
    }
  };

  // 🔧 RESEND OTP
  const handleResendOtp = async () => {
    if (!registrationEmail || !registrationEmail.trim()) {
      setOtpError('⚠️ Please enter your email address');
      Alert.alert('Email Required', 'Please enter your email address before resending OTP');
      return;
    }

    try {
      setOtpLoading(true);
      setOtpError('');
      console.log('📧 Resending OTP to:', registrationEmail);
      
      // Call resend OTP API
      await authService.resendOtp(registrationEmail);
      
      Alert.alert('Success', 'OTP has been resent to your email. Check your inbox.');
    } catch (error) {
      console.error('❌ Resend OTP failed:', error);
      const errorMsg = error.message || 'Failed to resend OTP';
      setOtpError(`⚠️ ${errorMsg}`);
      Alert.alert('Resend Failed', errorMsg);
    } finally {
      setOtpLoading(false);
    }
  };

  // 🔧 MANUALLY OPEN OTP VERIFICATION
  const handleOpenOtpModal = () => {
    // Just open the modal directly - user can enter email in the modal
    setOtpModalSource('manual');
    setRegistrationEmail(''); // Clear email so user can enter one
    setShowOtpModal(true);
    setOtp('');
    setOtpError('');
  };

  // 🔧 FORGOT PASSWORD - Step 1: Request OTP
  const handleForgotPasswordRequest = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('⚠️ Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError('⚠️ Please enter a valid email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      console.log('🔐 Requesting password reset OTP for:', forgotPasswordEmail);
      await authService.forgotPassword(forgotPasswordEmail);
      
      console.log('✅ OTP sent to email');
      setForgotPasswordStep('otp');
      setForgotPasswordError('');
    } catch (error) {
      console.error('❌ Forgot password request failed:', error);
      setForgotPasswordError(`⚠️ ${error.message || 'Failed to send OTP'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // 🔧 FORGOT PASSWORD - Step 2: Verify OTP
  const handleForgotPasswordOtpVerify = async () => {
    if (!forgotPasswordOtp.trim() || forgotPasswordOtp.length !== 6) {
      setForgotPasswordError('⚠️ Please enter a valid 6-digit OTP');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      console.log('🔐 Verifying OTP for password reset');
      const response = await authService.verifyOtp(forgotPasswordEmail, forgotPasswordOtp);
      
      console.log('✅ OTP verified, extracting temporary token');
      
      // Extract temporary token from response
      const tempToken = response.token || response.data?.token;
      if (tempToken) {
        console.log(`🔑 Temporary token received: ${tempToken.substring(0, 20)}...`);
        setForgotPasswordToken(tempToken);
      }
      
      setForgotPasswordStep('reset');
      setForgotPasswordOtp('');
      setForgotPasswordError('');
    } catch (error) {
      console.error('❌ OTP verification failed:', error);
      setForgotPasswordError(`⚠️ ${error.message || 'Invalid OTP'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // 🔧 FORGOT PASSWORD - Step 3: Reset Password
  const handleResetPassword = async () => {
    if (!resetNewPassword.trim()) {
      setForgotPasswordError('⚠️ Please enter a new password');
      return;
    }
    if (resetNewPassword.length < 8) {
      setForgotPasswordError('⚠️ Password must be at least 8 characters');
      return;
    }
    if (!resetConfirmPassword.trim()) {
      setForgotPasswordError('⚠️ Please confirm your password');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setForgotPasswordError('⚠️ Passwords do not match');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      console.log('🔐 Resetting password with temporary token');
      await authService.resetPassword(resetNewPassword, resetConfirmPassword, forgotPasswordToken);
      
      console.log('✅ Password reset successfully');
      Alert.alert('Success', 'Your password has been reset successfully. Please log in with your new password.', [
        {
          text: 'OK',
          onPress: () => {
            setShowForgotPasswordModal(false);
            // Reset forgot password state
            setForgotPasswordEmail('');
            setForgotPasswordOtp('');
            setResetNewPassword('');
            setResetConfirmPassword('');
            setForgotPasswordToken('');
            setForgotPasswordStep('email');
            setForgotPasswordError('');
          }
        }
      ]);
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      setForgotPasswordError(`⚠️ ${error.message || 'Failed to reset password'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  // 🔧 RESEND OTP (for forgot password)
  const handleForgotPasswordResendOtp = async () => {
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('⚠️ Please enter your email address');
      return;
    }

    setForgotPasswordLoading(true);
    setForgotPasswordError('');
    try {
      console.log('📧 Resending OTP to:', forgotPasswordEmail);
      await authService.resendOtp(forgotPasswordEmail);
      
      Alert.alert('Success', 'OTP has been resent to your email');
      setForgotPasswordError('');
    } catch (error) {
      console.error('❌ Resend OTP failed:', error);
      setForgotPasswordError(`⚠️ ${error.message || 'Failed to resend OTP'}`);
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="edit-note" size={95} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>SoulDiary</Text>
              <Text style={styles.title}>
                {isRegister ? 'Create Account' : 'Hi, My Friend!'}
              </Text>
              <Text style={styles.subtitle}>
                {isRegister 
                  ? 'Sign up to start your journaling journey' 
                  : 'Log in to continue your story'}
              </Text>
            </View>

            {/* FORM */}
            <View style={styles.formContainer}>
              {isRegister && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="person-outline" size={20} color="#A8A29E" />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="mail-outline" size={20} color="#A8A29E" />
                  <TextInput 
                    style={styles.input}
                    placeholder="name@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    value={emailInput}
                    onChangeText={setEmailInput}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="lock-outline" size={20} color="#A8A29E" />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter password"
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    autoCorrect={false}
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color="#A8A29E" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.mainButton, loading && styles.buttonDisabled]} 
                onPress={handleAuth}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainButtonText}>
                    {isRegister ? 'Sign Up' : 'Log In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Forgot Password Link */}
              {!isRegister && (
                <TouchableOpacity 
                  onPress={() => {
                    setShowForgotPasswordModal(true);
                    setForgotPasswordStep('email');
                    setForgotPasswordEmail('');
                    setForgotPasswordOtp('');
                    setResetNewPassword('');
                    setResetConfirmPassword('');
                    setForgotPasswordToken('');
                    setForgotPasswordError('');
                  }}
                  style={{ marginTop: 12 }}
                >
                  <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* DIVIDER */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* SOCIAL BUTTONS */}
            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={[styles.socialBtn, loading && styles.buttonDisabled]} 
                onPress={() => {
                  handleFacebookLogin();
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialBtn, loading && styles.buttonDisabled]}
                onPress={() => {
                  handleGoogleLogin();
                }}
                disabled={loading}
                activeOpacity={0.7}
              >
                <FontAwesome name="google" size={24} color="#DB4437" />
              </TouchableOpacity>
            </View>

            {/* FOOTER */}
            <View style={styles.footer}>
              <TouchableOpacity 
                onPress={() => {
                  setIsRegister(!isRegister);
                  setFullName('');
                  setEmailInput('');
                  setPasswordInput('');
                }}
              >
                <Text style={styles.linkText}>
                  {isRegister 
                    ? 'Already have an account? Log In' 
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
              
              {/* Verify Email Option */}
              <TouchableOpacity 
                onPress={handleOpenOtpModal}
                style={{ marginTop: 16 }}
              >
                <Text style={[styles.linkText, { fontSize: 13 }]}>
                  📧 Verify Email with OTP
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        visible={showForgotPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowForgotPasswordModal(false);
          setForgotPasswordStep('email');
          setForgotPasswordEmail('');
          setForgotPasswordOtp('');
          setResetNewPassword('');
          setResetConfirmPassword('');
          setForgotPasswordToken('');
          setForgotPasswordError('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowForgotPasswordModal(false);
                  setForgotPasswordStep('email');
                  setForgotPasswordEmail('');
                  setForgotPasswordOtp('');
                  setResetNewPassword('');
                  setResetConfirmPassword('');
                  setForgotPasswordToken('');
                  setForgotPasswordError('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Modal Body */}
            <ScrollView 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* STEP 1: EMAIL INPUT */}
              {forgotPasswordStep === 'email' && (
                <>
                  <View style={styles.modalIconContainer}>
                    <MaterialIcons name="lock-reset" size={60} color={COLORS.primary} />
                  </View>

                  <Text style={styles.modalSubtitle}>Reset Your Password</Text>
                  <Text style={styles.modalInstruction}>
                    Enter your email address and we'll send you a verification code to reset your password.
                  </Text>

                  <View style={[styles.inputBox, { marginVertical: 16 }]}>
                    <MaterialIcons name="mail-outline" size={20} color="#A8A29E" />
                    <TextInput 
                      style={styles.input}
                      placeholder="your.email@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={forgotPasswordEmail}
                      onChangeText={(text) => {
                        setForgotPasswordEmail(text);
                        if (forgotPasswordError) setForgotPasswordError('');
                      }}
                      editable={!forgotPasswordLoading}
                    />
                  </View>

                  {forgotPasswordError && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error" size={18} color="#EF4444" />
                      <Text style={styles.errorText}>{forgotPasswordError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.verifyButton, forgotPasswordLoading && styles.buttonDisabled]}
                    onPress={handleForgotPasswordRequest}
                    disabled={forgotPasswordLoading}
                    activeOpacity={0.8}
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="send" size={20} color="#FFFFFF" />
                        <Text style={styles.verifyButtonText}>Send OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}

              {/* STEP 2: OTP VERIFICATION */}
              {forgotPasswordStep === 'otp' && (
                <>
                  <View style={styles.modalIconContainer}>
                    <MaterialIcons name="mail-lock" size={60} color={COLORS.primary} />
                  </View>

                  <Text style={styles.modalSubtitle}>Verify Your Email</Text>
                  <Text style={styles.modalEmail}>{forgotPasswordEmail}</Text>
                  
                  <Text style={styles.modalInstruction}>
                    We sent a 6-digit verification code to your email. Enter it below to continue.
                  </Text>

                  <View style={styles.otpInputContainer}>
                    <TextInput
                      style={[styles.otpInput, forgotPasswordError && styles.otpInputError]}
                      placeholder="000000"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={forgotPasswordOtp}
                      onChangeText={(text) => {
                        setForgotPasswordOtp(text);
                        if (forgotPasswordError) setForgotPasswordError('');
                      }}
                      placeholderTextColor="#D4CCCC"
                      editable={!forgotPasswordLoading}
                    />
                  </View>

                  {forgotPasswordError && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error" size={18} color="#EF4444" />
                      <Text style={styles.errorText}>{forgotPasswordError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.verifyButton, (forgotPasswordLoading || forgotPasswordOtp.length !== 6) && styles.buttonDisabled]}
                    onPress={handleForgotPasswordOtpVerify}
                    disabled={forgotPasswordLoading || forgotPasswordOtp.length !== 6}
                    activeOpacity={0.8}
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                        <Text style={styles.verifyButtonText}>Verify OTP</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn't receive the code? </Text>
                    <TouchableOpacity 
                      onPress={handleForgotPasswordResendOtp}
                      disabled={forgotPasswordLoading}
                    >
                      <Text style={[styles.resendLink, forgotPasswordLoading && { opacity: 0.5 }]}>
                        Resend OTP
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              {/* STEP 3: PASSWORD RESET */}
              {forgotPasswordStep === 'reset' && (
                <>
                  <View style={styles.modalIconContainer}>
                    <MaterialIcons name="shield" size={60} color={COLORS.primary} />
                  </View>

                  <Text style={styles.modalSubtitle}>Create New Password</Text>
                  <Text style={styles.modalInstruction}>
                    Enter a strong new password to secure your account.
                  </Text>

                  {/* New Password */}
                  <View style={[styles.formGroup, { marginTop: 16 }]}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter new password (min. 8 characters)"
                        placeholderTextColor="#D1D5DB"
                        secureTextEntry={!showNewPassword}
                        value={resetNewPassword}
                        onChangeText={(text) => {
                          setResetNewPassword(text);
                          if (forgotPasswordError) setForgotPasswordError('');
                        }}
                        editable={!forgotPasswordLoading}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowNewPassword(!showNewPassword)}
                        disabled={forgotPasswordLoading}
                      >
                        <MaterialIcons 
                          name={showNewPassword ? 'visibility' : 'visibility-off'} 
                          size={20} 
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm Password */}
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordInputContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your new password"
                        placeholderTextColor="#D1D5DB"
                        secureTextEntry={!showConfirmPassword}
                        value={resetConfirmPassword}
                        onChangeText={(text) => {
                          setResetConfirmPassword(text);
                          if (forgotPasswordError) setForgotPasswordError('');
                        }}
                        editable={!forgotPasswordLoading}
                      />
                      <TouchableOpacity 
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={forgotPasswordLoading}
                      >
                        <MaterialIcons 
                          name={showConfirmPassword ? 'visibility' : 'visibility-off'} 
                          size={20} 
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Password Requirements */}
                  <View style={styles.requirementsBox}>
                    <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                    <Text style={styles.requirementItem}>✓ At least 8 characters long</Text>
                    <Text style={styles.requirementItem}>✓ Passwords must match</Text>
                  </View>

                  {forgotPasswordError && (
                    <View style={styles.errorContainer}>
                      <MaterialIcons name="error" size={18} color="#EF4444" />
                      <Text style={styles.errorText}>{forgotPasswordError}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.verifyButton, forgotPasswordLoading && styles.buttonDisabled]}
                    onPress={handleResetPassword}
                    disabled={forgotPasswordLoading}
                    activeOpacity={0.8}
                  >
                    {forgotPasswordLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialIcons name="lock" size={20} color="#FFFFFF" />
                        <Text style={styles.verifyButtonText}>Reset Password</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* OTP VERIFICATION MODAL */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpModalSource('auto');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textMain} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
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

              <Text style={styles.modalSubtitle}>
                {otpModalSource === 'auto' 
                  ? "We've sent a verification code to"
                  : "Enter your email to verify"}
              </Text>
              
              {otpModalSource === 'auto' ? (
                <Text style={styles.modalEmail}>{registrationEmail}</Text>
              ) : (
                <View style={[styles.inputBox, { marginVertical: 8 }]}>
                  <MaterialIcons name="mail-outline" size={20} color="#A8A29E" />
                  <TextInput 
                    style={styles.input}
                    placeholder="your.email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={registrationEmail}
                    onChangeText={setRegistrationEmail}
                    editable={!otpLoading}
                  />
                </View>
              )}

              <Text style={styles.modalInstruction}>
                {otpModalSource === 'auto'
                  ? "Enter the 6-digit code sent to your email below to complete your registration."
                  : "Enter the 6-digit verification code you received via email."}
              </Text>

              {/* OTP Input */}
              <View style={styles.otpInputContainer}>
                <TextInput
                  style={[styles.otpInput, otpError && styles.otpInputError]}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text);
                    if (otpError) setOtpError('');
                  }}
                  placeholderTextColor="#D4CCCC"
                  editable={!otpLoading}
                />
              </View>

              {otpError && (
                <View style={styles.errorContainer}>
                  <MaterialIcons name="error" size={18} color="#EF4444" />
                  <Text style={styles.errorText}>{otpError}</Text>
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
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity 
                  onPress={handleResendOtp}
                  disabled={otpLoading}
                >
                  <Text style={[styles.resendLink, otpLoading && { opacity: 0.5 }]}>
                    Resend OTP
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.backgroundLight 
  },
  scrollContent: { 
    flexGrow: 1, 
    padding: 24, 
    justifyContent: 'center' 
  },
  header: { 
    alignItems: 'center', 
    marginBottom: 32 
  },
  iconContainer: {
    width:200, 
    height: 200, 
    borderRadius: 100, 
    backgroundColor: '#FFFFFF',
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5
  },
  appName: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: COLORS.primary, 
    marginBottom: 8 
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: COLORS.textMain, 
    marginBottom: 8 
  },
  subtitle: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center'
  },
  formContainer: { 
    gap: 16 
  },
  inputWrapper: { 
    gap: 6 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.textMain 
  },
  inputBox: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    height: 52, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    borderWidth: 1,
    borderColor: COLORS.borderLight, 
    gap: 12
  },
  input: { 
    flex: 1, 
    height: '100%', 
    fontSize: 16,
    color: COLORS.textMain
  },
  mainButton: {
    backgroundColor: COLORS.primary, 
    height: 56, 
    borderRadius: 14,
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  mainButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: '800' 
  },
  buttonDisabled: { 
    opacity: 0.5 
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A29E'
  },
  socialRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 20, 
    marginBottom: 24 
  },
  socialBtn: {
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    backgroundColor: '#FFFFFF',
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  footer: { 
    alignItems: 'center' 
  },
  linkText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.primary 
  },
  forgotPasswordLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  // OTP Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.backgroundLight,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: Dimensions.get('window').height * 0.85,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 16,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8F0',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#A8A29E',
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalInstruction: {
    fontSize: 13,
    color: '#A8A29E',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  otpInputContainer: {
    marginVertical: 16,
  },
  otpInput: {
    height: 64,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.textMain,
    letterSpacing: 8,
    backgroundColor: '#FFFFFF',
  },
  otpInputError: {
    borderColor: '#EF4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  verifyButton: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  resendText: {
    fontSize: 13,
    color: '#A8A29E',
  },
  resendLink: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  // Forgot Password Modal Styles
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
    fontFamily: 'Manrope_600SemiBold',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  requirementsBox: {
    backgroundColor: 'rgba(25, 230, 25, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111811',
    marginBottom: 8,
    fontFamily: 'Manrope_600SemiBold',
  },
  requirementItem: {
    fontSize: 12,
    color: '#A8A29E',
    lineHeight: 18,
    fontFamily: 'Manrope_400Regular',
  },
});

export default AuthScreen;