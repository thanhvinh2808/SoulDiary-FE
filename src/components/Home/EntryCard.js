import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { formatDate, getMoodIcon, getMoodColor } from '../../utils/helpers';

export const EntryCard = ({ 
  entry, 
  onPress,
  themeColors = {}
}) => {
  const dateToUse = entry.entryDate || entry.createdAt || entry.date;
  const { month, day } = formatDate(dateToUse);
  const moodIcon = getMoodIcon(entry.mood);
  const moodColor = getMoodColor(entry.mood);
  
  const surfaceColor = themeColors.surface || COLORS.cardLight;
  const accentColor = themeColors.accent || COLORS.accentBeige;
  const textColor = themeColors.text || COLORS.textPrimary;
  const textSecondaryColor = themeColors.textSecondary || COLORS.textSecondary;

  return (
    <TouchableOpacity 
      style={[styles.entryCard, { backgroundColor: accentColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.dateBox, { backgroundColor: surfaceColor }]}>
        <Text style={styles.dateMonth}>{month}</Text>
        <Text style={[styles.dateDay, { color: textColor }]}>{day}</Text>
      </View>
      
      <View style={styles.entryContent}>
        <Text style={[styles.entryTitle, { color: textColor }]} numberOfLines={1}>
          {entry.title || 'Untitled'}
        </Text>
        <Text 
          style={[styles.entrySubtitle, { color: textSecondaryColor }]} 
          numberOfLines={1}
        >
          {entry.content || 'No content preview'}
        </Text>
      </View>
      
      <MaterialIcons name={moodIcon} size={28} color={moodColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  dateBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textGray,
    fontFamily: 'Manrope_700Bold',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    lineHeight: 18,
  },
  entryContent: {
    flex: 1,
    justifyContent: 'center',
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    marginBottom: 4,
  },
  entrySubtitle: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
  },
});

export default EntryCard;
