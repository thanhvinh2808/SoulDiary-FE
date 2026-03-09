import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  SectionList,
  Image,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

// Mapping for mood icons and colors
const MOOD_MAP = {
  happy: { icon: 'sentiment-very-satisfied', color: '#22c55e', bg: '#dcfce7' },
  sad: { icon: 'sentiment-very-dissatisfied', color: '#3b82f6', bg: '#dbeafe' },
  neutral: { icon: 'sentiment-neutral', color: '#f59e0b', bg: '#fef3c7' },
  angry: { icon: 'sentiment-very-dissatisfied', color: '#ef4444', bg: '#fee2e2' },
  anxious: { icon: 'sentiment-worried', color: '#d946ef', bg: '#f3e8ff' },
};

// Dummy fallback data (in case API fails)
const FALLBACK_DATA = [
  {
    title: 'October 2023',
    data: [
      {
        id: '1',
        day: 'Mon, 24 Oct',
        time: '10:30 AM',
        content: 'Today I felt a lot of peace while walking in the park. I noticed the leaves are starting to change color and it felt like...',
        moodIcon: 'sentiment-satisfied',
        moodColor: '#CA8A04', // Yellow-600
        moodBg: '#FEF9C3', // Yellow-100
        tags: ['Nature', 'Peaceful'],
      },
      {
        id: '2',
        day: 'Sun, 23 Oct',
        time: '08:15 AM',
        content: 'Morning routine felt so grounded today. Made a fresh cup of coffee and just sat with my thoughts for twenty minutes.',
        moodIcon: 'self-improvement', // self_care alternative
        moodColor: '#2563EB', // Blue-600
        moodBg: '#DBEAFE', // Blue-100
        tags: ['Morning', 'Self-Care'],
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBSWCz6VJCT33vV9dm9_9ZnxdaRYm6yvmyVYQIPNtzSPcEEkE5rB5My7MYONrf7AHGUE-XGAX8zONsf-rGc9Y8Ag6-6z6NrRJiOx6nFmC0v_SHJTVIr7nbZPdbUM9e8im5--upTwpwwDXZ7dPJHcjTeVVP3xxGv_IpF1s6bNQomBCL_J7r307g_fIsFshW1FIHlntpTedPkypfVs0dUx72O4HLcR3Z_M47go9jv4y9B9R6ejzcvlane4BdAq7L9ykgniOjo6-oiSqHM',
      },
      {
        id: '3',
        day: 'Fri, 21 Oct',
        time: '09:45 PM',
        content: 'Gratitude list for tonight: 1. The warm sun 2. A good talk with Sarah 3. Finishing that difficult project at work.',
        moodIcon: 'auto-awesome',
        moodColor: '#9333EA', // Purple-600
        moodBg: '#F3E8FF', // Purple-100
        tags: ['Gratitude'],
      },
    ],
  },
  {
    title: 'September 2023',
    data: [
      {
        id: '4',
        day: 'Wed, 28 Sep',
        time: '02:20 PM',
        content: 'Felt a burst of creative energy this afternoon. Sketched out some ideas for the new living room layout.',
        moodIcon: 'bolt',
        moodColor: '#EA580C', // Orange-600
        moodBg: '#FFEDD5', // Orange-100
        tags: ['Creative', 'Home'],
      },
    ],
  },
];

const HistoryScreen = ({ onNavigate, params }) => {
  // FORCE LIGHT MODE
  const isDark = false;
  const insets = useSafeAreaInsets();
  const [diaryId, setDiaryId] = useState(params?.diaryId);
  
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [groupedSections, setGroupedSections] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false); // Toggle for deleted entries

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    cardBg: { backgroundColor: '#FFFFFF' },
    navBg: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  };

  // Helper function to convert mood to icon/color
  const getMoodStyle = (mood) => {
    return MOOD_MAP[mood?.toLowerCase()] || MOOD_MAP.neutral;
  };

  // Helper function to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return { day: 'Unknown', time: 'Unknown' };
    const date = new Date(dateStr);
    const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return { day: dayStr, time: timeStr };
  };

  // Helper function to group entries by month
  const groupEntriesByMonth = (entriesArray) => {
    const groups = {};
    
    entriesArray.forEach(entry => {
      const date = new Date(entry.date || entry.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      
      groups[monthKey].push({
        id: entry.id || entry._id,
        entryId: entry.id || entry._id,
        diaryId: diaryId,
        ...formatDate(entry.date || entry.createdAt),
        title: entry.title || 'Untitled',
        content: entry.content || '',
        mood: entry.mood || 'neutral',
        moodIcon: getMoodStyle(entry.mood).icon,
        moodColor: getMoodStyle(entry.mood).color,
        moodBg: getMoodStyle(entry.mood).bg,
        tags: [],
        date: entry.date || entry.createdAt,
        isDeleted: entry.isDeleted === true, // Ensure boolean, default to false if not present
      });
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(month => ({
        title: month,
        data: groups[month]
      }));
  };

  // Fetch entries from API
  const loadEntries = useCallback(async (targetDiaryId, isShowingDeleted = false) => {
    try {
      setLoading(true);
      let finalDiaryId = targetDiaryId || diaryId;
      
      // If no diaryId, fetch default diary
      if (!finalDiaryId) {
        console.log('⚠️ No diaryId provided, fetching default diary...');
        const diaries = await diaryService.getDiaries();
        if (diaries && diaries.length > 0) {
          finalDiaryId = diaries[0].id || diaries[0]._id;
          setDiaryId(finalDiaryId);
        } else {
          console.error('❌ No diaries found');
          setEntries([]);
          setGroupedSections([]);
          return;
        }
      }
      
      console.log(`🔄 Loading entries (showDeleted=${isShowingDeleted})...`);
      const fetchedEntries = await diaryService.getEntries(finalDiaryId, isShowingDeleted);
      
      // Debug: Log entry structure to see if isDeleted field exists
      if (fetchedEntries && fetchedEntries.length > 0) {
        console.log('📋 First entry structure:', {
          hasIsDeleted: 'isDeleted' in fetchedEntries[0],
          isDeletedValue: fetchedEntries[0].isDeleted,
          entry: fetchedEntries[0]
        });
        console.log(`✅ Loaded ${fetchedEntries.length} entries`);
      } else {
        console.warn('⚠️ No entries returned');
      }
      
      setEntries(Array.isArray(fetchedEntries) ? fetchedEntries : []);
      const sections = groupEntriesByMonth(Array.isArray(fetchedEntries) ? fetchedEntries : []);
      setGroupedSections(sections);
    } catch (error) {
      console.error('❌ Failed to load entries:', error);
      Alert.alert('Error', 'Failed to load entries: ' + error.message);
      setEntries([]);
      setGroupedSections([]);
    } finally {
      setLoading(false);
    }
  }, [diaryId]);

  useEffect(() => {
    loadEntries(diaryId);
  }, [diaryId, loadEntries]);

  // Filter entries based on search (backend has already filtered by deleted status)
  const filteredSections = groupedSections.map(section => ({
    ...section,
    data: section.data.filter(item => 
      item.title.toLowerCase().includes(searchText.toLowerCase()) ||
      item.content.toLowerCase().includes(searchText.toLowerCase())
    )
  })).filter(section => section.data.length > 0);

  // Handle delete entry (soft delete)
  const handleDeleteEntry = (entryId) => {
    if (!diaryId) return;
    
    Alert.alert('Delete Entry', 'Move this entry to trash? You can restore it later.', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            // Soft delete - set isDeleted flag
            await diaryService.deleteEntry(diaryId, entryId);
            console.log('✅ Entry soft deleted:', entryId);
            loadEntries(); // Refresh list
          } catch (error) {
            Alert.alert('Error', 'Failed to delete entry');
          }
        },
        style: 'destructive'
      }
    ]);
  };

  // Handle restore deleted entry
  const handleRestoreEntry = (entryId) => {
    if (!diaryId) return;
    
    Alert.alert('Restore Entry', 'Restore this entry to your journal?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Restore',
        onPress: async () => {
          try {
            // Call restore endpoint (you may need to implement this in diaryService)
            // For now, we'll assume it's available
            if (diaryService.restoreEntry) {
              await diaryService.restoreEntry(diaryId, entryId);
            } else {
              Alert.alert('Info', 'Restore functionality coming soon');
              return;
            }
            console.log('✅ Entry restored:', entryId);
            loadEntries(); // Refresh list
          } catch (error) {
            Alert.alert('Error', 'Failed to restore entry');
          }
        }
      }
    ]);
  };

  // Handle edit entry
  const handleEditEntry = (entryId) => {
    onNavigate('NewEntry', { diaryId, entryId });
  };

  const renderEntry = ({ item }) => (
    <View style={[styles.card, item.isDeleted && styles.cardDeleted]}>
      <View style={styles.cardContent}>
        <View style={styles.moodContainer}>
          <View style={[styles.moodCircle, { backgroundColor: item.moodBg }, item.isDeleted && { opacity: 0.5 }]}>
            <MaterialIcons name={item.moodIcon} size={28} color={item.moodColor} />
          </View>
        </View>
        
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardDay, item.isDeleted && styles.textDeleted]}>{item.title}</Text>
              <Text style={[styles.cardDayLabel, item.isDeleted && { opacity: 0.5 }]}>{item.day} • {item.time}</Text>
              {item.isDeleted && (
                <Text style={styles.deletedLabel}>Moved to trash</Text>
              )}
            </View>
          </View>
          <Text style={[styles.cardText, item.isDeleted && { opacity: 0.5 }]} numberOfLines={2}>
            {item.content}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {item.isDeleted ? (
            <>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.restoreBtn]}
                onPress={() => handleRestoreEntry(item.entryId)}
              >
                <MaterialIcons name="restore" size={20} color="#22c55e" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDeleteEntry(item.entryId)}
              >
                <MaterialIcons name="delete-forever" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleEditEntry(item.entryId)}
              >
                <MaterialIcons name="edit" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => handleDeleteEntry(item.entryId)}
              >
                <MaterialIcons name="delete" size={20} color="#EF4444" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <View style={styles.headerTop}>
                <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Home')}>
                    <MaterialIcons name="arrow-back" size={24} color="#57534E" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Journal History</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Calendar', { diaryId })}>
                    <MaterialIcons name="calendar-month" size={24} color="#57534E" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialIcons name="search" size={24} color="#A8A29E" style={{ marginLeft: 12 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search reflections..."
                        placeholderTextColor="#A8A29E"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
                <TouchableOpacity style={styles.filterButton} onPress={() => loadEntries(diaryId, showDeleted)}>
                    <MaterialIcons name="refresh" size={24} color="#57534E" />
                </TouchableOpacity>
            </View>

            {/* Trash Toggle */}
            <View style={styles.trashToggleContainer}>
              <TouchableOpacity 
                style={[styles.trashToggleBtn, showDeleted && styles.trashToggleBtnActive]}
                onPress={() => {
                  const newState = !showDeleted;
                  setShowDeleted(newState);
                  console.log(`🗑️ Trash toggle: ${newState ? 'ON (showing deleted)' : 'OFF (showing active)'}`);
                  // Reload entries with the new filter state
                  loadEntries(diaryId, newState);
                }}
              >
                <MaterialIcons 
                  name={showDeleted ? "delete" : "delete-outline"} 
                  size={18} 
                  color={showDeleted ? "#EF4444" : "#A8A29E"}
                />
                <Text style={[styles.trashToggleText, showDeleted && styles.trashToggleTextActive]}>
                  {showDeleted ? 'Trash' : 'View Trash'}
                </Text>
              </TouchableOpacity>
            </View>
        </View>

        {/* Section List */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <SectionList
            sections={filteredSections}
            keyExtractor={(item) => item.id}
            renderItem={renderEntry}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40 }}>
                <MaterialIcons name="book" size={48} color={COLORS.textGray} />
                <Text style={{ color: COLORS.textGray, marginTop: 16, fontSize: 16 }}>
                  {searchText ? 'No entries found' : 'No entries yet'}
                </Text>
              </View>
            }
          />
        )}

        {/* FAB */}
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => onNavigate('NewEntry', { diaryId })}
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
                  <MaterialIcons name="menu-book" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar', { diaryId })}>
                  <MaterialIcons name="calendar-today" size={28} color="#A8A29E" />
                  <Text style={styles.navLabel}>Calendar</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(253, 251, 247, 0.95)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F4', // Stone-100
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Manrope_800ExtraBold',
    color: '#1C1917',
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F4',
    borderRadius: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: 'Manrope_400Regular',
    color: '#1C1917',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashToggleContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  trashToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
  },
  trashToggleBtnActive: {
    backgroundColor: '#FEE2E2', // Red-100
    borderWidth: 1,
    borderColor: '#FCA5A5', // Red-300
  },
  trashToggleText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#A8A29E',
  },
  trashToggleTextActive: {
    color: '#EF4444',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(25, 230, 25, 0.2)', // Primary/20
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 25, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#1C1917',
  },
  chipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#1C1917',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for Bottom Nav + FAB
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingTop: 8,
    backgroundColor: COLORS.backgroundLight, // Sticky header bg
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#78716C', // Stone-500
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F5F5F4',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardDeleted: {
    backgroundColor: '#FFFBFA',
    borderColor: '#FCA5A5',
    opacity: 0.85,
  },
  cardImage: {
    width: '100%',
    height: 128,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  moodContainer: {
    flexShrink: 0,
  },
  moodCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardDay: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#1C1917',
  },
  textDeleted: {
    textDecorationLine: 'line-through',
    color: '#A8A29E',
  },
  deletedLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#EF4444',
    marginTop: 4,
  },
  cardDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#A8A29E', // Stone-400
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#A8A29E', // Stone-400
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#78716C', // Stone-500
    lineHeight: 22,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F5F5F4',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#57534E', // Stone-600
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'center',
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreBtn: {
    backgroundColor: '#DCFCE7', // Green-100
    borderWidth: 1,
    borderColor: '#86EFAC', // Green-300
  },
  fab: {
    position: 'absolute',
    bottom: 90, // Above bottom nav
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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

export default HistoryScreen;
