import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export const DailyQuoteCard = ({ quote, themeColors = {} }) => {
  const textColor = themeColors.text || COLORS.textPrimary;
  
  return (
    <View style={styles.container}>
      <Text style={[styles.quoteText, { color: textColor }]}>
        "{quote}"
      </Text>
      <Text style={styles.quoteLabel}>Daily Inspiration</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 26,
    fontFamily: 'Lora_400Regular_Italic',
    textAlign: 'center',
    marginBottom: 12,
  },
  quoteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontFamily: 'Manrope_600SemiBold',
  },
});

export default DailyQuoteCard;
