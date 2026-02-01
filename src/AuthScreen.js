import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';

import { COLORS } from './theme';
import { authService } from './services/authService';

// 🔧 BẮT BUỘC: Hoàn thành auth session
WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLoginSuccess }) => {
  // State quản lý UI
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // 🔧 REDIRECT URI - Để Expo tự quyết định URI tốt nhất cho môi trường Native
  const redirectUri = makeRedirectUri({
    scheme: 'souldiary',
     úseProxy: false,
  });

  // Log để bạn copy chính xác vào Google Console
  useEffect(() => {
    console.log('--- COPY LINK NÀY VÀO GOOGLE CONSOLE ---');
    console.log(redirectUri);
    console.log('---------------------------------------');
  }, [redirectUri]);

  // ✅ GOOGLE AUTH CONFIG
  const [gRequest, gResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: '41247382516-hedjbqieuige5lfkolt3flctolms69ta.apps.googleusercontent.com',
    webClientId: '41247382516-1nbdp00km72e261hcipuqcamb9dttu8d.apps.googleusercontent.com',
    iosClientId: '41247382516-hbui90gsqmtbdagni8sho68ffhfisv4p.apps.googleusercontent.com',

  });

  // Gọi hàm prompt trực tiếp
  const handleGoogleLogin = () => {
    promptGoogleAsync();
  };

  // ✅ FACEBOOK AUTH CONFIG
  const [fRequest, fResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: '913094248341605',
  });

  // 🔧 XỬ LÝ GOOGLE RESPONSE
  useEffect(() => {
    if (gResponse?.type === 'success') {
      const { authentication } = gResponse;
      
      // ID Token là JWT chứa đầy đủ thông tin user và an toàn hơn để verify ở Backend
      // Access Token chỉ là chuỗi ngẫu nhiên để gọi API Google
      const token = authentication?.idToken || authentication?.accessToken;
      
      if (token) {
        handleSocialLogin('google', token);
      } else {
        Alert.alert('Error', 'Failed to get Google token');
      }
    } else if (gResponse?.type === 'error') {
      Alert.alert(
        'Google Login Failed', 
        gResponse.error?.message || 'An error occurred'
      );
    }
  }, [gResponse]);

  // 🔧 XỬ LÝ FACEBOOK RESPONSE
  useEffect(() => {
    if (fResponse?.type === 'success') {
      const { authentication } = fResponse;
      
      if (authentication?.accessToken) {
        handleSocialLogin('facebook', authentication.accessToken);
      } else {
        Alert.alert('Error', 'Failed to get Facebook token');
      }
    } else if (fResponse?.type === 'error') {
      Alert.alert(
        'Facebook Login Failed', 
        fResponse.error?.message || 'An error occurred'
      );
    }
  }, [fResponse]);

  // 🔧 XỬ LÝ SOCIAL LOGIN - Gửi token lên backend
  const handleSocialLogin = async (provider, token) => {
    setLoading(true);
    try {
      let data;
      if (provider === 'google') {
        data = await authService.loginGoogle(token);
      } else if (provider === 'facebook') {
        data = await authService.loginFacebook(token);
      }
      
      console.log(`✅ ${provider} login response:`, JSON.stringify(data, null, 2));

      // Kiểm tra thành công dựa trên cấu trúc trả về từ backend controller
      // Backend: { status: "success", token: { ... }, data: { user: ... } }
      if (data && (data.status === 'success' || data.token)) {
        const user = data.data?.user || data.user;
        if (user) {
          onLoginSuccess(user);
        } else {
           console.warn('⚠️ Login success but no user data found in response');
           // Vẫn gọi onLoginSuccess để bypass nếu cần thiết, hoặc báo lỗi
           onLoginSuccess({ name: 'User', email: 'user@example.com' }); 
        }
      } else {
        throw new Error(data?.message || 'Cấu trúc dữ liệu từ server không hợp lệ');
      }
    } catch (error) {
      console.error(`❌ ${provider} login failed:`, error);
      Alert.alert('Đăng nhập thất bại', error.message || 'Không thể kết nối tới máy chủ');
    } finally {
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
        Alert.alert(
          'Success', 
          'Account created successfully! Please log in.',
          [{ text: 'OK', onPress: () => {
            setIsRegister(false);
            setFullName('');
            setPasswordInput('');
          }}]
        );
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
                style={[styles.socialBtn, (!fRequest || loading) && styles.buttonDisabled]} 
                onPress={() => {
                  promptFacebookAsync();
                }}
                disabled={!fRequest || loading}
                activeOpacity={0.7}
              >
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.socialBtn, (!gRequest || loading) && styles.buttonDisabled]}
                onPress={() => {
                  handleGoogleLogin();
                }}
                disabled={!gRequest || loading}
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
  }
});

export default AuthScreen;