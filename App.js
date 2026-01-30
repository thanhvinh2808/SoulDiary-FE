import React, { useCallback, useState, useRef } from 'react';
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
import { COLORS } from './src/theme';

import HistoryScreen from './src/HistoryScreen';
import CalendarScreen from './src/CalendarScreen';
import AnalyticsScreen from './src/AnalyticsScreen';
import AuthScreen from './src/AuthScreen';
import NewEntryScreen from './src/NewEntryScreen'; // Import lại
import HomeScreen from './src/HomeScreen';
import OnboardingScreen from './src/OnboardingScreen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  // FORCE LIGHT MODE: Luôn luôn là false để giữ nền Beige
  const isDark = false; 
  const [navState, setNavState] = useState({ screen: 'Onboarding', params: {} });
  
  // Toast state & animation
  const [toast, setToast] = useState({ visible: false, message: '' });
  const slideAnim = useRef(new Animated.Value(-100)).current;

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

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  const navigateTo = (screen, params = {}) => setNavState({ screen, params });

  const handleLoginSuccess = (userData) => {
    const name = userData?.name || 'Friend';
    showToast(`Welcome back, ${name}! ✨`);
    navigateTo('Home');
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
        return <NewEntryScreen onClose={() => navigateTo('Home')} {...params} />;
      case 'History':
        return <HistoryScreen onNavigate={navigateTo} {...params} />;
      case 'Calendar':
        return <CalendarScreen onNavigate={navigateTo} {...params} />;
      case 'Analytics':
        return <AnalyticsScreen onNavigate={navigateTo} {...params} />;
      default:
        return <OnboardingScreen onGetStarted={() => navigateTo('Auth')} />;
    }
  };

  return (
    <SafeAreaProvider>
      {/* Outer Container: Căn giữa trên Web */}
      <View style={styles.outerContainer} onLayout={onLayoutRootView}>
        
        {/* App Frame: Giới hạn chiều rộng trên Web */}
        <View style={styles.appFrame}>
          <StatusBar barStyle="dark-content" />
          {renderScreen()}
          
          {/* Toast Notification */}
          <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.toastContent}>
              <MaterialIcons name="stars" size={20} color={COLORS.primary} />
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          </Animated.View>
        </View>

      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: Platform.OS === 'web' ? '#E5E5E5' : COLORS.backgroundLight,
    alignItems: 'center', // Căn giữa ngang
    justifyContent: 'center', // Căn giữa dọc (nếu muốn app lơ lửng)
  },
  appFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.backgroundLight,
    // Web Specific Styles
    ...Platform.select({
      web: {
        maxWidth: 480, // Giới hạn chiều rộng giống điện thoại
        height: '100%',
        maxHeight: '100%', // Full chiều cao cửa sổ
        // Nếu bạn muốn nó lơ lửng như frame điện thoại thật thì dùng maxHeight cố định (vd: 850) và border radius
        // Nhưng thường web app thì nên full height để trải nghiệm tốt hơn.
        boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)', // Đổ bóng nhẹ
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
    backgroundColor: '#FFFFFF',
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
    borderColor: COLORS.borderLight,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMain,
    fontFamily: 'Manrope_700Bold',
  }
});
