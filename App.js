import React, { useCallback, useState } from 'react';
import { View, StyleSheet, Platform, StatusBar, Dimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  const [currentScreen, setCurrentScreen] = useState('Onboarding'); 

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

  const navigateTo = (screen) => setCurrentScreen(screen);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Onboarding':
        return <OnboardingScreen onGetStarted={() => navigateTo('Auth')} />;
      case 'Auth':
        return <AuthScreen onLoginSuccess={() => navigateTo('Home')} />;
      case 'Home':
        return <HomeScreen onNavigate={navigateTo} />;
      case 'NewEntry':
        return <NewEntryScreen onClose={() => navigateTo('Home')} />;
      case 'History':
        return <HistoryScreen onNavigate={navigateTo} />;
      case 'Calendar':
        return <CalendarScreen onNavigate={navigateTo} />;
      case 'Analytics':
        return <AnalyticsScreen onNavigate={navigateTo} />;
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
});
