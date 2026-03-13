import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';

export const EmptyState = ({ 
  icon = 'inbox', 
  title = 'No data', 
  message = 'Start creating content',
  style = {}
}) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons name={icon} size={48} color={COLORS.textMuted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    fontFamily: 'Manrope_700Bold',
  },
  message: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: 'Manrope_400Regular',
  },
});

export default EmptyState;
