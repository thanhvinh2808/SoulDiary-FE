import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { COLORS } from './theme';

const AuthScreen = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Toggle giữa Login và Register
  const toggleMode = () => setIsRegister(!isRegister);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header / Logo Area */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="edit-note" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>SoulDiary</Text>
              <Text style={styles.title}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </Text>
              <Text style={styles.subtitle}>
                {isRegister 
                  ? 'Start your journey of self-reflection today.' 
                  : 'Sign in to continue your daily journal.'}
              </Text>
            </View>

            {/* Input Forms */}
            <View style={styles.formContainer}>
              {/* Name Input (Only for Register) */}
              {isRegister && (
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputBox}>
                    <MaterialIcons name="person-outline" size={20} color="#A8A29E" />
                    <TextInput 
                      style={styles.input}
                      placeholder="e.g. John Doe"
                      placeholderTextColor="#D6D3D1"
                    />
                  </View>
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="mail-outline" size={20} color="#A8A29E" />
                  <TextInput 
                    style={styles.input}
                    placeholder="name@example.com"
                    placeholderTextColor="#D6D3D1"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputBox}>
                  <MaterialIcons name="lock-outline" size={20} color="#A8A29E" />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#D6D3D1"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons 
                      name={showPassword ? "visibility" : "visibility-off"} 
                      size={20} 
                      color="#A8A29E" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {!isRegister && (
                <TouchableOpacity style={styles.forgotPass}>
                  <Text style={styles.forgotPassText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Primary Button */}
              <TouchableOpacity style={styles.mainButton} onPress={onLoginSuccess}>
                <Text style={styles.mainButtonText}>
                  {isRegister ? 'Sign Up' : 'Log In'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Logins */}
            <View style={styles.socialRow}>
              {/* Facebook */}
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              {/* Apple */}
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="apple" size={24} color="#000000" />
              </TouchableOpacity>

              {/* Phone */}
              <TouchableOpacity style={styles.socialBtn}>
                <FontAwesome name="phone" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Footer Toggle */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {isRegister ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <TouchableOpacity onPress={toggleMode}>
                <Text style={styles.linkText}>
                  {isRegister ? ' Log In' : ' Sign Up'}
                </Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  appName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Manrope_700Bold',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textMain,
    fontFamily: 'Manrope_800ExtraBold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: 'center',
    fontFamily: 'Manrope_500Medium',
    maxWidth: '80%',
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMain,
    fontFamily: 'Manrope_600SemiBold',
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
    gap: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: COLORS.textMain,
    fontFamily: 'Manrope_500Medium',
  },
  forgotPass: {
    alignSelf: 'flex-end',
  },
  forgotPassText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: 'Manrope_600SemiBold',
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
    elevation: 4,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 12,
    color: '#A8A29E',
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 32,
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
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontFamily: 'Manrope_500Medium',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Manrope_700Bold',
  },
});

export default AuthScreen;
