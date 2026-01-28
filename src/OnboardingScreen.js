import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ onGetStarted }) => {
  // FORCE LIGHT MODE
  const isDark = false; 

  const themeStyles = {
    container: {
      backgroundColor: COLORS.backgroundLight,
    },
    textPrimary: {
      color: COLORS.textMain,
    },
    textSecondary: {
      color: 'rgba(45, 52, 45, 0.7)',
    },
    skipText: {
      color: 'rgba(45, 52, 45, 0.6)',
    },
  };

  const featherImageUri = "https://lh3.googleusercontent.com/aida-public/AB6AXuD1BxV_wcU0eVTJNdgz9r-V9n25VdEpKbT9NADtWv0GScLuivQCTPVvZuFEkqbFSCFuwSnwzN_papwydtzharkDy8twMKk4r-aRUmy4NU1TZ_58xDB5nlisvtsXqSfN_ANK4u9YXEPV6MEVKEfz8BRE5AbH_PDroVWDpZ8RcLVDaz-uoycD9C8CQE6N7XxgIadhbGKlZwQvNAyypPOD2Nhs1X27BzSNZiUmn8FS4CfykEt5fkvOPHsf4HcIsPYzAGN_e9Iyj1DJgvmL";

  return (
    <SafeAreaView style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={[styles.headerTitle, themeStyles.textPrimary]}>SoulDiary</Text>
        <TouchableOpacity onPress={onGetStarted}>
          <Text style={[styles.skipButton, themeStyles.skipText]}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        
        {/* Illustration Section */}
        <View style={styles.illustrationWrapper}>
          {/* Decorative soft glow behind */}
          <View style={styles.glowEffect} />
          
          {/* Feather Image Background with Icon Inside */}
          <ImageBackground 
            source={{ uri: featherImageUri }}
            style={styles.imageBackground}
            imageStyle={{ resizeMode: 'contain' }}
          >
            <MaterialIcons 
              name="edit-note" 
              size={120} 
              color={COLORS.primary} 
              style={styles.iconStyle}
            />
          </ImageBackground>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text style={[styles.title, themeStyles.textPrimary]}>
            Write your soul
          </Text>
          <Text style={[styles.description, themeStyles.textSecondary]}>
            Find peace in your daily reflections. Your private sanctuary for mental well-being and growth.
          </Text>
        </View>

        {/* Page Indicators */}
        <View style={styles.indicatorContainer}>
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={[styles.indicatorDot]} />
          <View style={[styles.indicatorDot]} />
        </View>
      </View>

      {/* Bottom Action Area */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
            <TouchableOpacity style={styles.button} onPress={onGetStarted}>
            <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>
            <Text style={[styles.legalText, { color: 'rgba(45, 52, 45, 0.4)' }]}>
            By continuing, you agree to our Terms and Privacy Policy
            </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    letterSpacing: -0.3,
  },
  skipButton: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  illustrationWrapper: {
    width: 280,
    height: 280,
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
    transform: [{ scale: 0.9 }],
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconStyle: {
    opacity: 0.8,
    // Note: React Native MaterialIcons don't support custom font-variation-settings natively,
    // but the weight is simulated by the default font weight.
  },
  textContent: {
    alignItems: 'center',
    maxWidth: 384,
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 38,
    fontFamily: 'Manrope_700Bold',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Manrope_400Regular',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
    width: '100%',
  },
  indicator: {
    height: 6,
    borderRadius: 999,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(25, 230, 25, 0.2)',
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  footerContent: {
    gap: 16,
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  legalText: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
  },
});

export default OnboardingScreen;