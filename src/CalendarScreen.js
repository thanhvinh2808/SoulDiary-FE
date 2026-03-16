import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors, FONTS } from './theme';
import { diaryService } from './services/diaryService';
import { useTheme } from './context/ThemeContext';
import { BottomNav } from './components/Home';

const MOOD_COLORS = {
    happy: '#FCD34D',
    sad: '#93C5FD',
    neutral: '#6EE7B7',
    angry: '#FCA5A1',
    anxious: '#E879F9',
    excited: '#F472B6',
    tired: '#A5B4FC',
};

const MOOD_ICONS = {
    happy: 'sentiment-very-satisfied',
    sad: 'sentiment-very-dissatisfied',
    neutral: 'sentiment-neutral',
    angry: 'sentiment-very-dissatisfied',
    anxious: 'sentiment-dissatisfied',
    excited: 'sentiment-very-satisfied',
    tired: 'bedtime',
};

const CalendarScreen = ({ onNavigate }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();

  // State Management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedDayEntries, setSelectedDayEntries] = useState([]);
  const [entryIndex, setEntryIndex] = useState(0);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const getLocalDateString = (dateObj) => {
    if (!dateObj) return null;
    let d = typeof dateObj === 'string' ? new Date(dateObj) : dateObj;
    if (!(d instanceof Date) || isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMonthDates = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const dateToEntries = {};
    
    entries.forEach((entry) => {
      let dateField = entry.entryDate || entry.date || entry.createdAt;
      if (dateField) {
        const dateStr = getLocalDateString(dateField);
        if (dateStr) {
          if (!dateToEntries[dateStr]) dateToEntries[dateStr] = [];
          dateToEntries[dateStr].push(entry);
        }
      }
    });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks = [];
    let week = Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = getLocalDateString(new Date(year, month, day));
      const dayEntries = dateToEntries[dateStr] || [];
      const latestEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;
      
      week.push({
        day,
        mood: latestEntry?.mood || null,
        hasEntry: dayEntries.length > 0,
        entries: dayEntries,
        date: new Date(year, month, day),
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }, [entries]);

  const loadEntries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await diaryService.getEntries({ limit: 500 });
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading calendar entries:', error);
      Alert.alert('Error', 'Failed to load calendar entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (entries.length > 0 && !selectedEntry) {
      const today = new Date();
      const monthDates = getMonthDates(currentDate);
      for (const week of monthDates) {
        for (const dayObj of week) {
          if (dayObj && dayObj.day === today.getDate() && 
              dayObj.date.getMonth() === today.getMonth() &&
              dayObj.date.getFullYear() === today.getFullYear()) {
            if (dayObj.entries && dayObj.entries.length > 0) {
              setSelectedDate(dayObj.date);
              setEntryIndex(0);
              setSelectedDayEntries(dayObj.entries);
              setSelectedEntry(dayObj.entries[0]);
              return;
            }
          }
        }
      }
    }
  }, [entries, currentDate]);
  
  const monthDates = getMonthDates(currentDate);

  const handlePreviousMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date()); };

  const handleDayPress = (dayObj) => {
    if (dayObj) {
      setSelectedDate(dayObj.date);
      setEntryIndex(0);
      if (dayObj.entries && dayObj.entries.length > 0) {
        setSelectedDayEntries(dayObj.entries);
        setSelectedEntry(dayObj.entries[0]);
      } else {
        setSelectedDayEntries([]);
        setSelectedEntry(null);
      }
    }
  };

  const handlePreviousEntry = () => {
    if (entryIndex > 0) {
      setEntryIndex(entryIndex - 1);
      setSelectedEntry(selectedDayEntries[entryIndex - 1]);
    }
  };

  const handleNextEntry = () => {
    if (entryIndex < selectedDayEntries.length - 1) {
      setEntryIndex(entryIndex + 1);
      setSelectedEntry(selectedDayEntries[entryIndex + 1]);
    }
  };

  const handleEditEntry = () => {
    if (selectedEntry) {
      onNavigate('NewEntry', { 
        entryId: selectedEntry._id || selectedEntry.id,
        returnTo: 'Calendar'
      });
    }
  };

  const renderDay = (dayObj, index) => {
    if (!dayObj) return <View key={index} style={styles.dayCell} />;
    const isSelected = selectedDate.getDate() === dayObj.day && 
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();
    return (
      <TouchableOpacity 
        key={index}
        style={[styles.dayCell, isSelected && [styles.dayCellSelected, { backgroundColor: COLORS.primary + '20' }]]}
        onPress={() => handleDayPress(dayObj)}
      >
        <Text style={[styles.dayText, { color: themeColors.text }, isSelected && styles.dayTextSelected]}>
          {dayObj.day}
        </Text>
        {dayObj.hasEntry && dayObj.mood && (
          <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[dayObj.mood] || MOOD_COLORS.neutral }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navIconButton}>
            <MaterialIcons name="chevron-left" size={28} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={styles.monthYearButton}>
            <View>
              <Text style={styles.monthText}>{monthNames[currentDate.getMonth()]}</Text>
              <Text style={[styles.yearText, { color: themeColors.textMuted }]}>{currentDate.getFullYear()}</Text>
            </View>
            <MaterialIcons name="expand-more" size={20} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNextMonth} style={styles.navIconButton}>
            <MaterialIcons name="chevron-right" size={28} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleToday} style={styles.todayButton}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.calendarContainer}>
              <View style={styles.weekRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <View key={i} style={styles.dayHeaderCell}><Text style={{ color: themeColors.textMuted, fontSize: 11, fontFamily: FONTS.ui.medium }}>{day}</Text></View>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {monthDates.map((week, wi) => week.map((day, di) => renderDay(day, `${wi}-${di}`)))}
              </View>
            </View>

            <View style={styles.dateHeader}>
              <Text style={[styles.dateTitle, { color: themeColors.text }]}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
              </Text>
            </View>

            {selectedEntry ? (
              <View style={styles.entrySummaryContainer}>
                <View style={[styles.entryCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
                  {selectedDayEntries.length > 1 && (
                    <Text style={{ color: themeColors.textMuted, fontSize: 12, marginBottom: 8, fontFamily: FONTS.ui.medium }}>Entry {entryIndex + 1} of {selectedDayEntries.length}</Text>
                  )}
                  <View style={styles.entryHeader}>
                    <View style={[styles.moodIconBg, { backgroundColor: (MOOD_COLORS[selectedEntry.mood] || MOOD_COLORS.neutral) + '30' }]}>
                      <MaterialIcons name={MOOD_ICONS[selectedEntry.mood] || 'sentiment-satisfied'} size={24} color={MOOD_COLORS[selectedEntry.mood] || MOOD_COLORS.neutral} />
                    </View>
                    <View>
                      <Text style={[styles.moodLabel, { color: themeColors.textSecondary }]}>{selectedEntry.mood?.toUpperCase()}</Text>
                      <Text style={{ color: themeColors.textMuted, fontSize: 12, fontFamily: FONTS.ui.regular }}>{new Date(selectedEntry.createdAt).toLocaleTimeString()}</Text>
                    </View>
                  </View>
                  <Text style={[styles.entryTitle, { color: themeColors.text }]}>{selectedEntry.title || 'Untitled'}</Text>
                  <Text style={[styles.entrySnippet, { color: themeColors.textSecondary }]} numberOfLines={3}>{selectedEntry.content}</Text>
                  <View style={styles.entryFooter}>
                    <TouchableOpacity onPress={handlePreviousEntry} disabled={entryIndex === 0} style={[styles.navButton, entryIndex === 0 && { opacity: 0.3 }]}><MaterialIcons name="chevron-left" size={20} color={COLORS.primary} /></TouchableOpacity>
                    <TouchableOpacity onPress={handleEditEntry} style={styles.readMoreButton}><Text style={styles.readMoreText}>Edit entry</Text></TouchableOpacity>
                    <TouchableOpacity onPress={handleNextEntry} disabled={entryIndex === selectedDayEntries.length - 1} style={[styles.navButton, entryIndex === selectedDayEntries.length - 1 && { opacity: 0.3 }]}><MaterialIcons name="chevron-right" size={20} color={COLORS.primary} /></TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.entrySummaryContainer}>
                <View style={[styles.entryCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border, alignItems: 'center', paddingVertical: 40 }]}>
                  <MaterialIcons name="event-note" size={40} color={themeColors.textMuted} />
                  <Text style={{ color: themeColors.textMuted, marginTop: 12, fontFamily: FONTS.ui.regular }}>No entries for this day</Text>
                </View>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: COLORS.primary }]}
        onPress={() => {
          onNavigate('NewEntry', { 
            initialDate: selectedDate.toISOString(),
            returnTo: 'Calendar'
          });
        }}
      >
        <MaterialIcons name="add" size={32} color="#111811" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <BottomNav
        activeScreen="Calendar"
        onNavigate={onNavigate}
      />

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowMonthPicker(false)}>
          <View style={[styles.monthPickerModal, { backgroundColor: themeColors.surface }]}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Select Month</Text>
            <View style={styles.monthGrid}>
              {monthNames.map((m, i) => (
                <TouchableOpacity key={m} style={[styles.monthChip, currentDate.getMonth() === i && { backgroundColor: COLORS.primary }]} onPress={() => { setCurrentDate(new Date(currentDate.getFullYear(), i, 1)); setShowMonthPicker(false); }}>
                  <Text style={[styles.monthChipText, { color: currentDate.getMonth() === i ? '#FFF' : themeColors.text }]}>{m.substring(0, 3)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  navIconButton: { padding: 4 },
  monthYearButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  monthText: { fontSize: 18, fontWeight: '700', color: COLORS.primary, fontFamily: FONTS.ui.bold },
  yearText: { fontSize: 12, fontFamily: FONTS.ui.medium },
  todayButton: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  todayText: { color: '#FFF', fontWeight: '700', fontSize: 12, fontFamily: FONTS.ui.bold },
  scrollContent: { paddingBottom: 100 },
  calendarContainer: { padding: 16 },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  dayHeaderCell: { width: '14.28%', alignItems: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  dayCellSelected: { },
  dayText: { fontSize: 14, fontFamily: FONTS.ui.regular },
  dayTextSelected: { fontWeight: 'bold', fontFamily: FONTS.ui.bold },
  moodDot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  dateHeader: { padding: 16 },
  dateTitle: { fontSize: 18, fontWeight: '700', fontFamily: FONTS.ui.bold },
  entrySummaryContainer: { paddingHorizontal: 16 },
  entryCard: { padding: 16, borderRadius: 12, borderWidth: 1 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  moodIconBg: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  moodLabel: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.ui.bold },
  entryTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4, fontFamily: FONTS.ui.bold },
  entrySnippet: { fontSize: 14, lineHeight: 20, marginBottom: 16, fontFamily: FONTS.ui.regular },
  entryFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  navButton: { padding: 8, borderWidth: 1, borderRadius: 20, borderColor: COLORS.primary },
  readMoreButton: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  readMoreText: { color: '#111811', fontWeight: '700', fontSize: 12, fontFamily: FONTS.ui.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  monthPickerModal: { width: '80%', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center', fontFamily: FONTS.ui.bold },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  monthChip: { width: '20%', paddingVertical: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.primary },
  monthChipText: { fontSize: 12, fontWeight: '700', fontFamily: FONTS.ui.bold },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 999,
  },
});

export default CalendarScreen;