import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const { width } = Dimensions.get('window');
const MOOD_COLORS = {
    happy: '#FCD34D', // Amber-300
    sad: '#93C5FD', // Blue-300
    neutral: '#6EE7B7', // Emerald-300
    angry: '#FCA5A1', // Red-300
    anxious: '#E879F9', // Purple-300
};

const MOOD_ICONS = {
    happy: 'sentiment-satisfied',
    sad: 'sentiment-dissatisfied',
    neutral: 'sentiment-neutral',
    angry: 'sentiment-very-dissatisfied',
    anxious: 'mood-bad',
};

const CalendarScreen = ({ navigation, onNavigate, diaryId: passedDiaryId, ...props }) => {
  const isDark = false;
  const insets = useSafeAreaInsets();
  // Handle diaryId from both route.params and direct props
  const [diaryId, setDiaryId] = useState(props.route?.params?.diaryId || passedDiaryId);

  // State Management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedDayEntries, setSelectedDayEntries] = useState([]); // All entries for selected day
  const [entryIndex, setEntryIndex] = useState(0); // Which entry to display if multiple

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  // Helper function to normalize date to local YYYY-MM-DD
  const getLocalDateString = (dateObj) => {
    if (!dateObj) return null;
    
    let d = dateObj;
    if (typeof dateObj === 'string') {
      d = new Date(dateObj);
    }
    
    if (!(d instanceof Date) || isNaN(d.getTime())) {
      return null;
    }
    
    // Use local time, not UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  // Get month dates with mood mapping (now stores multiple entries per day)
  const getMonthDates = useCallback((date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    console.log(`\n📅 Building calendar for ${monthNames[month]} ${year}`);
    console.log(`   Entries available: ${entries.length}`);
    
    // Create a map of date string to array of entries
    const dateToEntries = {};
    let successCount = 0;
    let failCount = 0;
    
    entries.forEach((entry, idx) => {
      // Try multiple date field names in order of preference
      let dateField = entry.entryDate || entry.date || entry.createdAt;
      
      if (!dateField) {
        if (idx < 3) {
          console.warn(`   ⚠️ Entry ${idx}: No date field found (all null/undefined)`);
        }
        failCount++;
        return;
      }
      
      try {
        // Use helper to parse and normalize date
        const dateStr = getLocalDateString(dateField);
        
        if (!dateStr) {
          console.warn(`   ⚠️ Entry ${idx}: Could not parse date from "${dateField}"`);
          failCount++;
          return;
        }
        
        // Initialize array if first entry for this date
        if (!dateToEntries[dateStr]) {
          dateToEntries[dateStr] = [];
        }
        
        // Add entry to the array for this date
        dateToEntries[dateStr].push(entry);
        
        // Log first few successful mappings
        if (successCount < 5) {
          console.log(`   ✅ Entry ${idx}: "${entry.title?.substring(0, 20)}" → ${dateStr} (${entry.mood})`);
        }
        
        successCount++;
        
      } catch (e) {
        console.error(`   ❌ Entry ${idx}: Error processing - ${e.message}`);
        failCount++;
      }
    });
    
    console.log(`   📊 Mapping summary: ${successCount} mapped, ${failCount} failed`);
    console.log(`   🗓️ Unique dates with entries: ${Object.keys(dateToEntries).length}`);
    
    // Log sample of mapped dates with entry counts
    const sampleDates = Object.keys(dateToEntries).slice(0, 5);
    if (sampleDates.length > 0) {
      console.log(`   Sample mapped dates:`);
      sampleDates.forEach(dateStr => {
        console.log(`      ${dateStr}: ${dateToEntries[dateStr].length} entry/entries`);
      });
    }

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks = [];
    let week = Array(startingDayOfWeek).fill(null);
    let daysWithEntries = 0;

    // Debug: collect calendar dates to compare
    const calendarDates = [];

    for (let day = 1; day <= daysInMonth; day++) {
      // Use consistent date string generation
      const dateStr = getLocalDateString(new Date(year, month, day));
      const dayEntries = dateToEntries[dateStr] || [];
      
      if (day <= 3) {
        calendarDates.push(dateStr);
      }
      
      if (dayEntries.length > 0) {
        daysWithEntries++;
      }
      
      // Use the most recent (last) entry for mood indicator
      const latestEntry = dayEntries.length > 0 ? dayEntries[dayEntries.length - 1] : null;
      
      week.push({
        day,
        mood: latestEntry?.mood || null,
        hasEntry: dayEntries.length > 0,
        entries: dayEntries, // All entries for this day
        date: new Date(year, month, day),
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Fill remaining cells
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    // Debug output showing calendar date format and matches
    if (calendarDates.length > 0) {
      console.log(`   Calendar dates generated: ${calendarDates.join(', ')}`);
    }
    console.log(`   🎯 Calendar ready with ${daysWithEntries} days showing entries\n`);
    return weeks;
  }, [entries]);

  // Load entries
  const loadEntries = useCallback(async (targetDiaryId) => {
    try {
      setLoading(true);
      const finalDiaryId = targetDiaryId || diaryId;
      
      console.log('📥 CalendarScreen loadEntries called with diaryId:', finalDiaryId);
      
      // If still no diaryId, fetch default diary
      if (!finalDiaryId) {
        console.log('⚠️ No diaryId provided in CalendarScreen, fetching default diary...');
        const diaries = await diaryService.getDiaries();
        console.log('📚 Fetched diaries:', diaries?.length || 0);
        
        if (diaries && diaries.length > 0) {
          const defaultId = diaries[0].id || diaries[0]._id;
          console.log('✅ Using default diary ID:', defaultId);
          setDiaryId(defaultId);
          
          const data = await diaryService.getEntries(defaultId);
          console.log('📝 Fetched entries for default diary:', data?.length || 0, 'entries');
          
          if (data && data.length > 0) {
            console.log('🔍 Detailed entry analysis:');
            data.slice(0, 5).forEach((entry, idx) => {
              console.log(`   Entry ${idx}:`);
              console.log(`      Title: ${entry.title?.substring(0, 30)}`);
              console.log(`      Mood: ${entry.mood}`);
              console.log(`      entryDate: ${entry.entryDate}`);
              console.log(`      date: ${entry.date}`);
              console.log(`      createdAt: ${entry.createdAt}`);
            });
          }
          
          setEntries(data || []);
          return;
        } else {
          console.error('❌ No diaries found');
          setEntries([]);
          return;
        }
      }
      
      // Fetch entries for the specified diary
      console.log('🔄 Fetching entries for diary:', finalDiaryId);
      const data = await diaryService.getEntries(finalDiaryId);
      
      console.log('✅ Entries fetched successfully:');
      console.log('   Total count:', data?.length || 0);
      console.log('   Array type:', Array.isArray(data) ? 'Array' : typeof data);
      
      if (data && data.length > 0) {
        console.log('🔍 Detailed entry analysis (first 5):');
        data.slice(0, 5).forEach((entry, idx) => {
          const dateField = entry.entryDate || entry.date || entry.createdAt;
          console.log(`   [${idx}] "${entry.title?.substring(0, 25)}" → ${dateField} (Mood: ${entry.mood})`);
        });
        console.log(`   ... and ${Math.max(0, data.length - 5)} more entries`);
      } else {
        console.warn('⚠️ No entries returned from API');
      }
      
      setEntries(data || []);
    } catch (error) {
      console.error('📥 Error loading entries:', error);
      console.error('   Error details:', error.message);
      Alert.alert('Error', 'Failed to load calendar entries');
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useEffect(() => {
    loadEntries(diaryId);
  }, [diaryId, loadEntries]);

  // Auto-select today's entries when calendar loads
  useEffect(() => {
    if (entries.length > 0 && !selectedEntry) {
      const today = new Date();
      const todayStr = getLocalDateString(today);
      
      // Find today in the month dates
      const monthDates = getMonthDates(currentDate);
      
      for (const week of monthDates) {
        for (const dayObj of week) {
          if (dayObj && dayObj.day === today.getDate() && 
              dayObj.date.getMonth() === today.getMonth() &&
              dayObj.date.getFullYear() === today.getFullYear()) {
            
            if (dayObj.entries && dayObj.entries.length > 0) {
              console.log(`📌 Auto-selecting today (${todayStr}) with ${dayObj.entries.length} entry/entries`);
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
  const selectedEntryData = selectedEntry;

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDayPress = (dayObj) => {
    if (dayObj) {
      setSelectedDate(dayObj.date);
      setEntryIndex(0); // Reset to first entry
      
      if (dayObj.entries && dayObj.entries.length > 0) {
        setSelectedDayEntries(dayObj.entries);
        setSelectedEntry(dayObj.entries[0]); // Show first entry
      } else {
        setSelectedDayEntries([]);
        setSelectedEntry(null); // Clear previous entry if day has no entry
      }
    }
  };

  // Navigation helpers for multiple entries
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
        diaryId 
      });
    }
  };

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    cardBg: { backgroundColor: '#FFFFFF' },
    navBg: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  };

  const renderDay = (dayObj, index) => {
    if (!dayObj) return <View key={index} style={styles.dayCell} />;

    const isSelected = selectedDate.getDate() === dayObj.day && 
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear();

    return (
      <TouchableOpacity 
        key={index}
        style={[
          styles.dayCell,
          isSelected && styles.dayCellSelected
        ]}
        onPress={() => handleDayPress(dayObj)}
      >
        <Text style={[
          styles.dayText,
          isSelected && styles.dayTextSelected
        ]}>
          {dayObj.day}
        </Text>
        {dayObj.hasEntry && dayObj.mood && (
          <View style={[styles.moodDot, { backgroundColor: MOOD_COLORS[dayObj.mood] || MOOD_COLORS.neutral }]} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity style={styles.iconButton} onPress={handlePreviousMonth}>
            <MaterialIcons name="chevron-left" size={28} color={COLORS.textMain} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity style={styles.todayButton} onPress={handleToday}>
            <Text style={styles.todayText}>Today</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
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
                {monthDates.map((week, weekIndex) => (
                  week.map((day, dayIndex) => renderDay(day, `${weekIndex}-${dayIndex}`))
                ))}
              </View>
            </View>

            {/* Selected Date Header */}
            <View style={styles.dateHeader}>
              <Text style={styles.dateTitle}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
              </Text>
            </View>

            {/* Entry Summary Card */}
            {selectedEntryData ? (
              <View style={styles.entrySummaryContainer}>
                <View style={styles.entryCard}>
                  {/* Entry counter if multiple entries */}
                  {selectedDayEntries.length > 1 && (
                    <View style={styles.entryCounter}>
                      <Text style={styles.entryCounterText}>
                        Entry {entryIndex + 1} of {selectedDayEntries.length}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.entryHeader}>
                    <View style={[
                      styles.moodIconBg, 
                      { backgroundColor: `${MOOD_COLORS[selectedEntryData.mood] || MOOD_COLORS.neutral}30` }
                    ]}>
                      <MaterialIcons 
                        name={MOOD_ICONS[selectedEntryData.mood] || 'sentiment-satisfied'} 
                        size={24} 
                        color={MOOD_COLORS[selectedEntryData.mood] || MOOD_COLORS.neutral} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.moodLabel}>MOOD: {selectedEntryData.mood?.toUpperCase() || 'NEUTRAL'}</Text>
                      <Text style={styles.timeLabel}>
                        {new Date(selectedEntryData.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.entryTitle}>{selectedEntryData.title || 'Untitled'}</Text>
                  <Text style={styles.entrySnippet} numberOfLines={3}>
                    {selectedEntryData.content || 'No content'}
                  </Text>

                  <View style={styles.entryFooter}>
                    <TouchableOpacity 
                      style={[styles.navButton, selectedDayEntries.length <= 1 || entryIndex === 0 ? { opacity: 0.3 } : {}]}
                      onPress={handlePreviousEntry}
                      disabled={entryIndex === 0}
                    >
                      <MaterialIcons name="chevron-left" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.readMoreButton} onPress={handleEditEntry}>
                      <Text style={styles.readMoreText}>Edit entry</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.navButton, selectedDayEntries.length <= 1 || entryIndex === selectedDayEntries.length - 1 ? { opacity: 0.3 } : {}]}
                      onPress={handleNextEntry}
                      disabled={entryIndex === selectedDayEntries.length - 1}
                    >
                      <MaterialIcons name="chevron-right" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.entrySummaryContainer}>
                <View style={[styles.entryCard, { alignItems: 'center', paddingVertical: 40 }]}>
                  <MaterialIcons name="calendar-today" size={40} color="#D1D5DB" />
                  <Text style={[styles.entryTitle, { marginTop: 16, color: '#9CA3AF' }]}>
                    No entry found
                  </Text>
                  <Text style={[styles.entrySnippet, { color: '#9CA3AF', marginBottom: 0 }]}>
                    Select a date with an entry or create a new one
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* FAB */}
        <TouchableOpacity 
          style={[styles.fab, !diaryId && { opacity: 0.5 }]}
          onPress={() => onNavigate('NewEntry', { diaryId })}
          disabled={!diaryId}
        >
          <MaterialIcons name="add" size={32} color="#112111" />
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, themeStyles.navBg]}>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
            <MaterialIcons name="home" size={28} color="#A8A29E" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History', { diaryId })}>
            <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
            <Text style={styles.navLabel}>Diary</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar')}>
            <MaterialIcons name="calendar-today" size={28} color={COLORS.primary} />
            <Text style={[styles.navLabel, { color: COLORS.primary }]}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics', { diaryId })}>
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
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
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
  entryCounter: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  entryCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Manrope_600SemiBold',
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
    justifyContent: 'center',
    gap: 12,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
