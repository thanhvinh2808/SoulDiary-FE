import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export const SocialButtons = ({ 
  onFacebookPress, 
  onGooglePress,
  disabled = false,
  themeColors = {}
}) => {
  const btnBgColor = themeColors.surface || '#F3F4F6';
  
  return (
    <View style={styles.socialRow}>
      <TouchableOpacity 
        style={[styles.socialBtn, { backgroundColor: btnBgColor }, disabled && styles.buttonDisabled]} 
        onPress={onFacebookPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <FontAwesome name="facebook" size={24} color="#1877F2" />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.socialBtn, { backgroundColor: btnBgColor }, disabled && styles.buttonDisabled]}
        onPress={onGooglePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <FontAwesome name="google" size={24} color="#DB4437" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 20,
  },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default SocialButtons;
