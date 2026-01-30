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

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = ({ onLoginSuccess }) => {
  // State quản lý UI
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // State Form (Đổi tên để tránh xung đột)
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // --- FACEBOOK MANUAL AUTH (Chắc chắn chạy) ---
  const promptFacebookAsync = async () => {
    try {
      // 1. Link Redirect chuẩn
      const redirectUri = makeRedirectUri({ useProxy: true, scheme: 'souldiary' });
      
      // 2. Tạo URL đăng nhập thủ công
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=913094248341605` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=email,public_profile`;

      console.log('Opening Facebook Auth:', authUrl);

      // 3. Mở trình duyệt xác thực
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      // 4. Xử lý kết quả
      if (result.type === 'success' && result.url) {
        // Parse token từ URL: ...#access_token=...&data_access_expiration_time=...
        const match = result.url.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          const accessToken = match[1];
          handleSocialLogin('facebook', accessToken);
        }
      } else {
        console.log('Facebook Login Cancelled or Failed', result);
      }
    } catch (e) {
      console.error('Manual Facebook Auth Error:', e);
      Alert.alert('Error', 'Failed to open Facebook login');
    }
  };

  // --- GOOGLE CONFIG (Giữ nguyên) ---
  const [gRequest, gResponse, promptGoogleAsync] = Google.useAuthRequest({
    androidClientId: '41247382516-hedjbqieuige5lfkolt3flctolms69ta.apps.googleusercontent.com',
    iosClientId: '41247382516-hbui90gsqmtbdagni8sho68ffhfisv4p.apps.googleusercontent.com',
    webClientId: '41247382516-1nbdp00km72e261hcipuqcamb9dttu8d.apps.googleusercontent.com',
    redirectUri: makeRedirectUri({ useProxy: true }),
  });

  // --- FACEBOOK CONFIG (BỎ HOOK CŨ) ---
  // const [fRequest, fResponse, promptFacebookAsync] = Facebook.useAuthRequest... (Đã thay bằng hàm thủ công ở trên)
  // Biến fRequest giả để nút không bị disable
  const fRequest = true;

  // Xử lý phản hồi Google
  useEffect(() => {
    if (gResponse?.type === 'success') {
      const { id_token } = gResponse.params;
      handleSocialLogin('google', id_token);
    }
  }, [gResponse]);

  // Xử lý phản hồi Facebook (Đã chuyển vào hàm promptFacebookAsync)
  // useEffect(() => { ... }, [fResponse]); -> Đã xóa

  const handleSocialLogin = async (provider, token) => {
    setLoading(true);
    try {
      let data;
      if (provider === 'google') {
        data = await authService.loginGoogle(token);
      } else {
        data = await authService.loginFacebook(token);
      }
      
      console.log('Social Login OK');
      if (data && (data.token || data.status === 'success')) {
         onLoginSuccess();
      } else {
         throw new Error("Login failed (No token)");
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    if (!emailInput || !passwordInput) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (isRegister && !fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await authService.register(fullName, emailInput, passwordInput);
        Alert.alert('Success', 'Account created! Please log in.');
        setIsRegister(false);
      } else {
        await authService.login(emailInput, passwordInput);
        onLoginSuccess();
      }
    } catch (error) {
      Alert.alert('Authentication Failed', error.message);
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
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <MaterialIcons name="edit-note" size={64} color={COLORS.primary} />
              </View>
              <Text style={styles.appName}>SoulDiary</Text>
              <Text style={styles.title}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </Text>
            </View>

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
                    value={passwordInput}
                    onChangeText={setPasswordInput}
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

              <TouchableOpacity 
                style={[styles.mainButton, loading && { opacity: 0.7 }]} 
                onPress={handleAuth}
                disabled={loading}
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

            <View style={styles.socialRow}>
              <TouchableOpacity 
                style={styles.socialBtn} 
                onPress={() => promptFacebookAsync()}
                disabled={!fRequest}
              >
                <FontAwesome name="facebook" size={24} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.socialBtn}
                onPress={() => promptGoogleAsync()}
                disabled={!gRequest}
              >
                <FontAwesome name="google" size={24} color="#DB4437" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
                <Text style={styles.linkText}>
                  {isRegister ? 'Switch to Log In' : 'Switch to Sign Up'}
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
  container: { flex: 1, backgroundColor: COLORS.backgroundLight },
  scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    elevation: 5
  },
  appName: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textMain, marginBottom: 8 },
  formContainer: { gap: 16 },
  inputWrapper: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textMain },
  inputBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    height: 52, borderRadius: 12, paddingHorizontal: 16, borderWidth: 1,
    borderColor: COLORS.borderLight, gap: 12
  },
  input: { flex: 1, height: '100%', fontSize: 16 },
  mainButton: {
    backgroundColor: COLORS.primary, height: 56, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginTop: 8, elevation: 4
  },
  mainButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginVertical: 32 },
  socialBtn: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    borderColor: COLORS.borderLight, elevation: 2
  },
  footer: { alignItems: 'center' },
  linkText: { fontSize: 14, fontWeight: '700', color: COLORS.primary }
});

export default AuthScreen;