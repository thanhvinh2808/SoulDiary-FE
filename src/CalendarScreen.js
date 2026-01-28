import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

const { width } = Dimensions.get('window');

// Dummy Data for Calendar
const CALENDAR_DATA = [
    { day: 1, mood: 'calm' },
    { day: 2, mood: null },
    { day: 3, mood: 'happy' },
    { day: 4, mood: null },
    { day: 5, mood: 'calm', selected: true }, // Default selected
    { day: 6, mood: 'anxious' },
    { day: 7, mood: null },
    { day: 8, mood: null },
    { day: 9, mood: null },
    { day: 10, mood: 'sad' },
    { day: 11, mood: null },
    { day: 12, mood: 'happy' },
    { day: 13, mood: null },
    { day: 14, mood: null },
    { day: 15, mood: 'calm' },
    { day: 16, mood: null },
    { day: 17, mood: 'happy' },
    { day: 18, mood: null },
    { day: 19, mood: null },
    { day: 20, mood: 'calm' },
    { day: 21, mood: null },
    { day: 22, mood: null },
    { day: 23, mood: null },
    { day: 24, mood: 'happy' },
    { day: 25, mood: null },
    { day: 26, mood: null },
    { day: 27, mood: 'calm' },
    { day: 28, mood: null },
    { day: 29, mood: null },
    { day: 30, mood: null },
    { day: 31, mood: null },
];

const MOOD_COLORS = {
    happy: '#FCD34D', // Amber-300
    sad: '#93C5FD', // Blue-300
    calm: '#6EE7B7', // Emerald-300
    anxious: '#FCA5A1', // Red-300
};

const CalendarScreen = ({ onNavigate }) => {
  // FORCE LIGHT MODE
  const isDark = false; 

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    cardBg: { backgroundColor: '#FFFFFF' },
    navBg: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  };

  const renderDay = (item, index) => {
      // Empty cells for start of month offset (simplified logic for demo)
      if (!item) return <View key={index} style={styles.dayCell} />;

      return (
        <TouchableOpacity 
            key={index} 
            style={[
                styles.dayCell,
                item.selected && styles.dayCellSelected
            ]}
        >
            <Text style={[
                styles.dayText,
                item.selected && styles.dayTextSelected
            ]}>
                {item.day}
            </Text>
            {item.mood && (
                <View style={styles.moodDotsContainer}>
                    <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[item.mood] }]} />
                </View>
            )}
        </TouchableOpacity>
      );
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="chevron-left" size={28} color={COLORS.textMain} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>October 2023</Text>
            <TouchableOpacity style={styles.todayButton}>
                <Text style={styles.todayText}>Today</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
                {/* Weekday Headers */}
                <View style={styles.weekRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <View key={i} style={styles.dayHeaderCell}>
                            <Text style={styles.dayHeaderText}>{day}</Text>
                        </View>
                    ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                    {/* Add 2 empty cells for offset to match design */}
                    {renderDay(null, 'empty1')}
                    {renderDay(null, 'empty2')}
                    {CALENDAR_DATA.map((item, index) => renderDay(item, index))}
                </View>
            </View>

            {/* Selected Date Header */}
            <View style={styles.dateHeader}>
                <Text style={styles.dateTitle}>October 5, 2023</Text>
            </View>

            {/* Entry Summary Card */}
            <View style={styles.entrySummaryContainer}>
                <View style={styles.entryCard}>
                    <View style={styles.entryHeader}>
                        <View style={[styles.moodIconBg, { backgroundColor: 'rgba(110, 231, 183, 0.2)' }]}>
                            <MaterialIcons name="sentiment-satisfied" size={24} color="#059669" />
                        </View>
                        <View>
                            <Text style={styles.moodLabel}>MOOD: CALM</Text>
                            <Text style={styles.timeLabel}>Logged at 8:30 PM</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.entryTitle}>Feeling Peaceful</Text>
                    <Text style={styles.entrySnippet}>
                        Today was a quiet day. I spent some time in the garden and felt a deep sense of gratitude for the little things. The air was crisp and the sun felt warm...
                    </Text>

                    <View style={styles.entryFooter}>
                        <View style={styles.tagsContainer}>
                             <View style={styles.miniTag}>
                                <MaterialIcons name="eco" size={14} color="#57534E" />
                             </View>
                             <View style={styles.miniTag}>
                                <MaterialIcons name="local-florist" size={14} color="#57534E" />
                             </View>
                        </View>
                        <TouchableOpacity style={styles.readMoreButton}>
                            <Text style={styles.readMoreText}>Read full entry</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={{ height: 100 }} />
        </ScrollView>

        {/* FAB */}
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => onNavigate('Editor')}
        >
            <MaterialIcons name="add" size={32} color="#112111" />
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, themeStyles.navBg]}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History')}>
                  <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar')}>
                  <MaterialIcons name="calendar-today" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Calendar</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics')}>
                  <MaterialIcons name="analytics" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Insights</Text>
             </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(253, 251, 247, 0.95)',
  },
  iconButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  todayText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Manrope_700Bold',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  calendarContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF', // Gray-400
    textTransform: 'uppercase',
    fontFamily: 'Manrope_700Bold',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  dayCellSelected: {
    backgroundColor: 'rgba(25, 230, 25, 0.2)', // Primary/20
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#111811',
  },
  dayTextSelected: {
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  moodDotsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  moodDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dateHeader: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
  },
  entrySummaryContainer: {
    paddingHorizontal: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  moodIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280', // Gray-500
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Manrope_700Bold',
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textGray,
    fontFamily: 'Manrope_400Regular',
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111811',
    fontFamily: 'Manrope_700Bold',
    marginBottom: 8,
  },
  entrySnippet: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#4B5563', // Gray-600
    lineHeight: 24,
    marginBottom: 16,
  },
  entryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: -8, // Negative margin for overlap effect
  },
  miniTag: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  readMoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111811',
    fontFamily: 'Manrope_700Bold',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#A8A29E',
  },
});

export default CalendarScreen;
