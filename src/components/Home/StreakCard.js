import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { getStreakMessage } from '../../utils/helpers';

export const StreakCard = ({ streak, themeColors = {} }) => {
  const streakBgColor = themeColors.surface || COLORS.cardLight;
  const borderColor = themeColors.border || COLORS.borderLight;
  const textColor = themeColors.text || COLORS.textPrimary;
  const textSecondaryColor = themeColors.textSecondary || COLORS.textSecondary;
  
  const message = getStreakMessage(streak);

  return (
    <View style={[styles.container, { paddingHorizontal: 16 }]}>
      <View style={[
        styles.streakCard, 
        { 
          backgroundColor: streakBgColor,
          borderColor: borderColor
        }
      ]}>
        <View style={styles.streakInfo}>
          <Text style={styles.streakLabel}>CURRENT STREAK</Text>
          <Text style={[styles.streakValue, { color: textColor }]}>
            {streak} Day{streak !== 1 ? 's' : ''} Streak
          </Text>
          <Text style={[styles.streakSub, { color: textSecondaryColor }]}>
            {message}
          </Text>
        </View>
        <View style={styles.streakIconContainer}>
          <MaterialIcons 
            name={streak > 0 ? "local-fire-department" : "schedule"} 
            size={40} 
            color={streak > 0 ? COLORS.primary : '#D1D5DB'} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  streakInfo: {
    flex: 1,
    gap: 4,
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textGray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Manrope_700Bold',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
  },
  streakSub: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
  },
  streakIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(25, 230, 25, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default StreakCard;
