import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export const FormLabel = ({ label, themeColors = {} }) => {
  const textColor = themeColors.text || COLORS.textPrimary;
  return (
    <Text style={[styles.label, { color: textColor }]}>{label}</Text>
  );
};

export const ErrorMessage = ({ message, themeColors = {} }) => {
  if (!message) return null;
  
  const borderColor = themeColors.border || COLORS.borderLight;
  return (
    <View style={[styles.errorContainer, { borderColor }]}>
      <MaterialIcons name="error" size={18} color="#EF4444" />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
};

export const Divider = ({ text, themeColors = {} }) => {
  const borderColor = themeColors.border || COLORS.borderLight;
  const textColor = themeColors.textMuted || COLORS.textMuted;
  return (
    <View style={styles.divider}>
      <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
      <Text style={[styles.dividerText, { color: textColor }]}>{text}</Text>
      <View style={[styles.dividerLine, { backgroundColor: borderColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'Manrope_600SemiBold',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 12,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontFamily: 'Manrope_400Regular',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_600SemiBold',
  },
});

export default { FormLabel, ErrorMessage, Divider };
