import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { authService } from './services/authService';

const ForgotPasswordScreen = ({ onBack, onLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown logic for Resend OTP
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await authService.resendOtp(email);
      setStep(2);
      setCountdown(60); // 60s cooldown
      Alert.alert('OTP Sent', 'Please check your email for the verification code.');
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) {
      Alert.alert('Error', 'Please enter a valid OTP code');
      return;
    }

    setLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      Alert.alert(
        'Success', 
        'OTP Verified! You can now reset your password.',
        [{ text: 'Back to Login', onPress: onLogin }]
      );
      // TODO: Navigate to ResetPasswordScreen if API exists
    } catch (error) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    await handleSendOtp();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.content}>
            
            {/* Header */}
            <TouchableOpacity style={styles.backButton} onPress={step === 1 ? onBack : () => setStep(1)}>
              <MaterialIcons name="arrow-back" size={24} color={COLORS.textMain} />
            </TouchableOpacity>

            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>
                {step === 1 ? 'Forgot Password?' : 'Enter OTP'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 1 
                  ? "Don't worry! It happens. Please enter the email associated with your account." 
                  : `We sent a code to ${email}. Enter it below to verify your identity.`}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              
              {step === 1 ? (
                // Step 1: Email Input
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="mail-outline" size={20} color="#A8A29E" />
                    <TextInput 
                      style={styles.input}
                      placeholder="name@example.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>
              ) : (
                // Step 2: OTP Input
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Verification Code</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="lock-clock" size={20} color="#A8A29E" />
                    <TextInput 
                      style={[styles.input, { letterSpacing: 4, fontSize: 18 }]}
                      placeholder="Enter Code"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={setOtp}
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity 
                    onPress={handleResend}
                    disabled={countdown > 0 || loading}
                    style={{ alignSelf: 'flex-end', marginTop: 8 }}
                  >
                    <Text style={[styles.linkText, countdown > 0 && { color: '#A8A29E' }]}>
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity 
                style={[styles.mainButton, loading && styles.buttonDisabled]} 
                onPress={step === 1 ? handleSendOtp : handleVerifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.mainButtonText}>
                    {step === 1 ? 'Send Code' : 'Verify'}
                  </Text>
                )}
              </TouchableOpacity>

            </View>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    marginBottom: 24,
  },
  headerTextContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 14,
    color: '#A8A29E',
    lineHeight: 22,
  },
  form: {
    gap: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  inputBox: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF',
    height: 56, 
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
    color: COLORS.textMain,
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
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default ForgotPasswordScreen;
