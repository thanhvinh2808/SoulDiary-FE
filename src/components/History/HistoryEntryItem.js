import React, { useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity as RNReactNative, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS } from '../../theme';
import { formatDate, getMoodIcon, getMoodColor } from '../../utils/helpers';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const HistoryEntryItem = ({ 
  entry, 
  onPress,
  themeColors = {},
  isDeleted = false,
  onDelete,
  onRestore
}) => {
  const swipeableRef = useRef(null);
  const dateToUse = entry.date || entry.createdAt;
  const { month, day } = formatDate(dateToUse);
  const moodIcon = getMoodIcon(entry.mood);
  const moodColor = getMoodColor(entry.mood);
  
  const isDark = !themeColors.text || themeColors.text === '#FFFFFF';
  const MOOD_BG_COLORS = isDark ? {
    happy: '#78350F20', neutral: '#374151', sad: '#1E3A5F', angry: '#7F1D1D', anxious: '#5B21B6',
  } : {
    happy: '#FEF3C7', neutral: '#E5E7EB', sad: '#DBEAFE', angry: '#FEE2E2', anxious: '#F3E8FF',
  };
  
  const moodBgColor = MOOD_BG_COLORS[entry.mood] || MOOD_BG_COLORS.neutral;
  const cardBgColor = themeColors.surface || COLORS.cardLight;
  const textColor = themeColors.text || COLORS.textPrimary;
  const textSecondaryColor = themeColors.textSecondary || COLORS.textSecondary;
  const borderColor = themeColors.border || COLORS.borderLight;

  // Gmail Style: Render nền Đỏ khi vuốt sang trái (Để Xóa)
  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-100, -50],
      outputRange: [1, 0.7],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.gmailActionBack, { backgroundColor: '#EF4444', alignItems: 'flex-end' }]}>
        <Animated.View style={[styles.actionIconContainer, { transform: [{ scale }] }]}>
          <MaterialIcons name={isDeleted ? "delete-forever" : "delete"} size={28} color="white" />
          <Text style={styles.actionText}>{isDeleted ? "Xóa hẳn" : "Xóa"}</Text>
        </Animated.View>
      </View>
    );
  };

  // Gmail Style: Render nền Xanh khi vuốt sang phải (Để Khôi phục - Chỉ trong thùng rác)
  const renderLeftActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [50, 100],
      outputRange: [0.7, 1],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.gmailActionBack, { backgroundColor: COLORS.primary, alignItems: 'flex-start' }]}>
        <Animated.View style={[styles.actionIconContainer, { transform: [{ scale }] }]}>
          <MaterialIcons name="restore" size={28} color="white" />
          <Text style={styles.actionText}>Mở lại</Text>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onDelete ? renderRightActions : null}
      renderLeftActions={(isDeleted && onRestore) ? renderLeftActions : null}
      friction={1.5}
      rightThreshold={SCREEN_WIDTH * 0.4}
      leftThreshold={SCREEN_WIDTH * 0.4}
      onSwipeableRightOpen={() => {
        onDelete();
        setTimeout(() => swipeableRef.current?.close(), 500);
      }}
      onSwipeableLeftOpen={() => {
        if (isDeleted && onRestore) {
          onRestore();
          setTimeout(() => swipeableRef.current?.close(), 500);
        }
      }}
    >
      <RNReactNative 
        style={[
          styles.entryItem,
          { backgroundColor: cardBgColor, borderColor, opacity: isDeleted ? 0.8 : 1 },
          isDeleted && styles.deletedEntry,
        ]}
        onPress={onPress}
        activeOpacity={1}
      >
        {entry.images && entry.images.length > 0 && (
          <Image source={{ uri: entry.images[0] }} style={styles.entryImage} resizeMode="cover" />
        )}

        <View style={styles.contentRow}>
          <View style={[styles.moodCircle, { backgroundColor: moodBgColor }]}>
            <MaterialIcons name={moodIcon} size={28} color={moodColor} />
          </View>

          <View style={styles.textContent}>
            <View style={styles.dateTimeRow}>
              <Text style={[styles.dateText, { color: textColor }]}>{month} {day}</Text>
              {entry.time && (
                <Text style={[styles.timeText, { color: textSecondaryColor }]}>{entry.time}</Text>
              )}
            </View>

            <Text style={[styles.entryTitle, { color: textColor }]} numberOfLines={1}>
              {entry.title || entry.content?.split('\n')[0] || 'Chưa đặt tiêu đề'}
            </Text>

            <Text style={[styles.entryContent, { color: textSecondaryColor }]} numberOfLines={2}>
              {entry.content || 'Không có nội dung'}
            </Text>
          </View>
        </View>
      </RNReactNative>
    </Swipeable>
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
  deletedEntry: { borderStyle: 'dashed' },
  entryImage: { width: '100%', height: 120 },
  contentRow: { flexDirection: 'row', padding: 12, gap: 12, alignItems: 'center' },
  moodCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  textContent: { flex: 1 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  dateText: { fontSize: 13, fontWeight: '700', fontFamily: 'Manrope_700Bold' },
  timeText: { fontSize: 11, opacity: 0.6 },
  entryTitle: { fontSize: 15, fontWeight: '800', fontFamily: 'Manrope_800ExtraBold', marginBottom: 2 },
  entryContent: { fontSize: 13, opacity: 0.7, lineHeight: 18 },
  gmailActionBack: {
    flex: 1,
    marginBottom: 12,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 25,
  },
  actionIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'uppercase',
  }
});

export default HistoryEntryItem;
