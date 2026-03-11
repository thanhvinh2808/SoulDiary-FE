import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from '../../theme';
import { formatDate, getMoodIcon, getMoodColor } from '../../utils/helpers';

export const HistoryEntryItem = ({ 
  entry, 
  onPress,
  themeColors = {},
  isDeleted = false,
  onDelete
}) => {
  const dateToUse = entry.entryDate || entry.createdAt || entry.date;
  const { month, day } = formatDate(dateToUse);
  const moodIcon = getMoodIcon(entry.mood);
  const moodColor = getMoodColor(entry.mood);
  
  // Dynamic mood background colors based on theme
  const isDark = !themeColors.text || themeColors.text === '#FFFFFF';
  const MOOD_BG_COLORS = isDark ? {
    happy: '#78350F20',      // Brown-900 with alpha
    neutral: '#374151',      // Gray-700
    sad: '#1E3A5F',          // Blue-900
    angry: '#7F1D1D',        // Red-900
    anxious: '#5B21B6',      // Purple-900
  } : {
    happy: '#FEF3C7',        // Amber-100
    neutral: '#E5E7EB',      // Gray-200
    sad: '#DBEAFE',          // Blue-100
    angry: '#FEE2E2',        // Red-100
    anxious: '#F3E8FF',      // Purple-100
  };
  
  const moodBgColor = MOOD_BG_COLORS[entry.mood] || MOOD_BG_COLORS.neutral;
  
  const cardBgColor = themeColors.surface || COLORS.cardLight;
  const textColor = themeColors.text || COLORS.textPrimary;
  const textSecondaryColor = themeColors.textSecondary || COLORS.textSecondary;
  const borderColor = themeColors.border || COLORS.borderLight;

  return (
    <TouchableOpacity 
      style={[
        styles.entryItem,
        { 
          backgroundColor: cardBgColor,
          borderColor,
          opacity: isDeleted ? 0.6 : 1,
        },
        isDeleted && styles.deletedEntry,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Optional Image at Top */}
      {entry.image && (
        <Image
          source={{ uri: entry.image }}
          style={styles.entryImage}
          resizeMode="cover"
        />
      )}

      {/* Main Content Row */}
      <View style={styles.contentRow}>
        {/* Mood Circle - Fixed Left Column */}
        <View style={[
          styles.moodCircle,
          { backgroundColor: moodBgColor }
        ]}>
          <MaterialIcons name={moodIcon} size={28} color={moodColor} />
        </View>

        {/* Text Content - Flexible Right Column */}
        <View style={styles.textContent}>
          {/* Date and Time Header */}
          <View style={styles.dateTimeRow}>
            <Text style={[styles.dateText, { color: textColor }]}>
              {month} {day}
            </Text>
            {entry.time && (
              <Text style={[styles.timeText, { color: textSecondaryColor }]}>
                {entry.time}
              </Text>
            )}
          </View>

          {/* Title/First Line */}
          <Text 
            style={[styles.entryTitle, { color: textColor }]}
            numberOfLines={1}
          >
            {entry.title || entry.content?.split('\n')[0] || 'Untitled'}
          </Text>

          {/* Content Preview */}
          <Text 
            style={[styles.entryContent, { color: textSecondaryColor }]}
            numberOfLines={2}
          >
            {entry.content || 'No content'}
          </Text>

          {/* Tags */}
          {entry.tags && entry.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {entry.tags.map((tag, idx) => (
                <View 
                  key={idx} 
                  style={[styles.tag, { backgroundColor: moodColor + '25' }]}
                >
                  <Text style={[styles.tagText, { color: moodColor }]}>
                    {tag.toUpperCase()}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Delete Button - Top Right */}
        {onDelete && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onDelete}
          >
            <MaterialIcons 
              name={isDeleted ? 'restore' : 'delete-outline'} 
              size={20} 
              color={isDeleted ? COLORS.primary : '#EF4444'} 
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  entryItem: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  deletedEntry: {
    borderStyle: 'dashed',
  },
  entryImage: {
    width: '100%',
    height: 128,
  },
  contentRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: 8,
    flexShrink: 0,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    marginBottom: 4,
  },
  entryContent: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 18,
    marginBottom: 6,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
  },
});

export default HistoryEntryItem;
