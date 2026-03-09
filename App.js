import React, { useCallback, useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, StatusBar, Dimensions, Animated, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { 
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold 
} from '@expo-google-fonts/manrope';
import {
  Lora_400Regular,
  Lora_500Medium,
  Lora_400Regular_Italic
} from '@expo-google-fonts/lora';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS, getThemeColors } from './src/theme';
import { authService } from './src/services/authService';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

import HistoryScreen from './src/HistoryScreen';
import CalendarScreen from './src/CalendarScreen';
import AnalyticsScreen from './src/AnalyticsScreen';
import AuthScreen from './src/AuthScreen';
import NewEntryScreen from './src/NewEntryScreen';
import HomeScreen from './src/HomeScreen';
import OnboardingScreen from './src/OnboardingScreen';
import ProfileScreen from './src/ProfileScreen';
import EditProfileScreen from './src/EditProfileScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Main App content component with theme support
function AppContent() {
  const { isDark, isLoading: themeLoading } = useTheme();
  const themeColors = getThemeColors(isDark || false);
  const [navState, setNavState] = useState({ screen: 'Onboarding', params: {} });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Toast state & animation
  const [toast, setToast] = useState({ visible: false, message: '' });
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // 🔧 Check if user is already logged in on app startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await authService.getToken();
        console.log('🔐 App startup: checking for existing token...');
        
        if (token) {
          console.log('✅ Token found! User is logged in. Navigating to Home...');
          setNavState({ screen: 'Home', params: {} });
        } else {
          console.log('❌ No token found. Showing Onboarding...');
          setNavState({ screen: 'Onboarding', params: {} });
        }
      } catch (error) {
        console.error('⚠️ Error checking auth:', error);
        setNavState({ screen: 'Onboarding', params: {} });
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const showToast = (message) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 20,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => setToast({ visible: false, message: '' }));
  };

  // Show splash screen while checking authentication or theme loading
  if (isCheckingAuth || themeLoading) {
    return null;
  }

  const navigateTo = (screen, params = {}) => setNavState({ screen, params });

  const handleLoginSuccess = (userData) => {
    console.log('📱 App.js: handleLoginSuccess called with:', userData?.email);
    let name = userData?.name;
    
    // Fallback: extract name from email if not available
    if (!name || name.trim() === '') {
      if (userData?.email) {
        name = userData.email.split('@')[0];
        name = name.charAt(0).toUpperCase() + name.slice(1);
      } else {
        name = 'Friend';
      }
    }
    
    showToast(`Welcome back, ${name}! ✨`);
    
    // Đảm bảo chuyển trang ngay lập tức
    setNavState({ screen: 'Home', params: {} });
  };

  const renderScreen = () => {
    const { screen, params } = navState;
    switch (screen) {
      case 'Onboarding':
        return <OnboardingScreen onGetStarted={() => navigateTo('Auth')} />;
      case 'Auth':
        return <AuthScreen onLoginSuccess={handleLoginSuccess} {...params} />;
      case 'Home':
        return <HomeScreen onNavigate={navigateTo} {...params} />;
      case 'NewEntry':
        return <NewEntryScreen onClose={() => navigateTo(params?.returnTo || 'Home', params)} {...params} />;
      case 'History':
        return <HistoryScreen onNavigate={navigateTo} {...params} />;
      case 'Calendar':
        return <CalendarScreen onNavigate={navigateTo} {...params} />;
      case 'Analytics':
        return <AnalyticsScreen onNavigate={navigateTo} {...params} />;
      case 'Profile':
        return <ProfileScreen onNavigate={navigateTo} {...params} />;
      case 'EditProfile':
        return <EditProfileScreen onNavigate={navigateTo} params={params} {...params} />;
      default:
        return <OnboardingScreen onGetStarted={() => navigateTo('Auth')} />;
    }
  };

  return (
    <SafeAreaProvider>
      {/* Outer Container: Căn giữa trên Web */}
      <View style={[styles.outerContainer, { backgroundColor: themeColors.background }]}>
        
        {/* App Frame: Giới hạn chiều rộng trên Web */}
        <View style={[styles.appFrame, { backgroundColor: themeColors.background }]}>
          <StatusBar barStyle={themeColors.statusBarStyle} backgroundColor={themeColors.background} />
          {renderScreen()}
          
          {/* Toast Notification */}
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={[styles.toastContent, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <MaterialIcons name="stars" size={20} color={COLORS.primary} />
              <Text style={[styles.toastText, { color: themeColors.text }]}>{toast.message}</Text>
            </View>
          </Animated.View>
        </View>

      </View>
    </SafeAreaProvider>
  );
}

// Root App component with ThemeProvider
function AppRoot() {
  let [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Lora_400Regular,
    Lora_500Medium,
    Lora_400Regular_Italic,
  });

  // Hide splash screen when fonts are loaded
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default AppRoot;

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight, // Default light mode background
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backgroundColor: '#E5E5E5',
      }
    }),
  },
  appFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.backgroundLight, // Default light mode background
    ...Platform.select({
      web: {
        maxWidth: 480,
        height: '100%',
        maxHeight: '100%',
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }
    }),
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  }
});
