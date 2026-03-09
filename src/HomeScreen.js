import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';
import { authService } from './services/authService';
import SideMenu from './SideMenu';
import SearchScreen from './SearchScreen';
import SettingsScreen from './SettingsScreen';
import ExportScreen from './ExportScreen';

// Daily inspiration quotes - one for each day
const DAILY_QUOTES = [
  "Small steps lead to big changes.",
  "Your story matters.",
  "Every day is a fresh start.",
  "Write the truth you know.",
  "Growth happens in stillness.",
  "Your voice deserves to be heard.",
  "Reflection is the path to clarity.",
  "Progress over perfection.",
  "Document your journey, celebrate your growth.",
  "In writing, you find yourself.",
  "Let your pages hold your secrets.",
  "Today is full of possibility.",
  "Your feelings are valid and important.",
  "Write boldly, live fully.",
  "Gratitude transforms everything.",
  "You are stronger than you think.",
  "Every entry is a step forward.",
  "Your perspective is unique and valuable.",
  "Healing happens when we honor our truth.",
  "Dreams written down become plans.",
  "Be honest, be brave, be you.",
  "Your past shaped you, your future awaits.",
  "In moments of doubt, read your progress.",
  "Emotions are meant to be felt, understood, and written.",
  "You are becoming who you're meant to be.",
  "Give yourself the same compassion you give others.",
  "Your story is still being written.",
  "Each entry is a conversation with yourself.",
  "Vulnerability is your greatest strength.",
  "Keep going, you're doing better than you think.",
];

// Get daily quote based on current date (same quote all day, changes at midnight)
const getDailyQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today - new Date(today.getFullYear(), 0, 0)) / 86400000
  );
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
};

const HomeScreen = ({ onNavigate }) => {
  const isDark = false; // Luôn dùng Light Mode
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDiaryId, setCurrentDiaryId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuScreen, setActiveMenuScreen] = useState(null); // null, 'search', 'settings', 'export'
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 5;
  const dailyQuote = getDailyQuote();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Lấy danh sách Diary
      let diaries = await diaryService.getDiaries();
      
      // Tự động tạo Diary mặc định nếu chưa có (dành cho User mới)
      if (!diaries || diaries.length === 0) {
        try {
           const newDiary = await diaryService.createDiary("My Journal", "Your journey begins here", "Personal diary created automatically");
           diaries = [newDiary];
        } catch (createError) {
           console.error("Failed to create default diary", createError);
        }
      }

      if (diaries && Array.isArray(diaries) && diaries.length > 0) {
        // Mặc định lấy diary đầu tiên
        const firstDiary = diaries[0];
        setCurrentDiaryId(firstDiary.id || firstDiary._id);

        // 2. Lấy Entries của Diary đó
        const diaryEntries = await diaryService.getEntries(firstDiary.id || firstDiary._id);
        const entriesArray = Array.isArray(diaryEntries) ? diaryEntries : [];
        
        console.log(`📊 Fetched ${entriesArray.length} entries from diary`, firstDiary._id);
        setEntries(entriesArray);
      } else {
        // Trường hợp lỗi tạo diary hoặc ko có diary
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      setEntries([]); // Đảm bảo entries không bị undefined
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 🔧 Menu Handlers
  const handleSearch = () => {
    console.log('🔍 Navigate to Search Entries');
    setMenuOpen(false);
    setActiveMenuScreen('search');
  };

  const handleSelectEntry = (entry) => {
    console.log('✏️ Opening entry for editing:', entry.id || entry._id);
    setActiveMenuScreen(null);
    // Open NewEntryScreen with the entry for editing
    setTimeout(() => {
      // Use onNavigate if available, otherwise navigate in same screen
      if (onNavigate) {
        onNavigate('NewEntry', { 
          entryId: entry.id || entry._id, 
          diaryId: currentDiaryId,
          returnTo: 'Home'
        });
      }
    }, 300);
  };

  const handleSettings = () => {
    console.log('⚙️ Navigate to Settings');
    setMenuOpen(false);
    setActiveMenuScreen('settings');
  };

  const handleExport = () => {
    console.log('💾 Export diary');
    setMenuOpen(false);
    setActiveMenuScreen('export');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await authService.removeToken();
              console.log('✅ Logged out successfully');
              onNavigate('Auth');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  // Format Date: "2023-10-25..." -> Month: "OCT", Date: "25"
  const formatDate = (dateString) => {
    if (!dateString) {
      const today = new Date();
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return {
        month: months[today.getMonth()],
        day: today.getDate().toString()
      };
    }
    const date = new Date(dateString);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      month: months[date.getMonth()],
      day: date.getDate().toString()
    };
  };

  // Calculate stats from current entries
  const getStatsFromEntries = () => {
    const count = entries.length;
    
    let streak = 0;
    if (count > 0) {
      console.log(`\n🔥 STREAK CALCULATION DEBUG - Total entries: ${count}`);
      
      // Create a Set of normalized date strings (YYYY-MM-DD) to avoid timezone issues
      const entryDateStrings = new Set();
      entries.forEach((entry, idx) => {
        const dateStr = entry.entryDate || entry.createdAt || entry.date;
        if (dateStr) {
          const date = new Date(dateStr);
          // Format as YYYY-MM-DD to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          entryDateStrings.add(dateString);
          console.log(`  [${idx}] ${entry.title || 'Untitled'} → ${dateString}`);
        }
      });
      
      console.log(`🗓️ Unique entry dates (${entryDateStrings.size}):`, Array.from(entryDateStrings).sort());
      
      // Start from today and count backwards
      const today = new Date();
      console.log(`📅 Today: ${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
      console.log(`⏰ Time: ${today.toLocaleTimeString()}`);
      
      let checkDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      // Count consecutive days backwards from today
      while (true) {
        const year = checkDate.getFullYear();
        const month = String(checkDate.getMonth() + 1).padStart(2, '0');
        const day = String(checkDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        
        if (entryDateStrings.has(dateString)) {
          streak++;
          console.log(`  ✅ ${dateString} - HAS ENTRY (streak: ${streak})`);
          // Move to previous day
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          console.log(`  ❌ ${dateString} - NO ENTRY (streak broken)`);
          break;
        }
      }
    }
    
    console.log(`\n📊 FINAL: ${count} entries, ${streak} day streak\n`);
    return { count, streak };
  };

  const { count: totalCount, streak: currentStreak } = getStatsFromEntries();

  // Get motivational message based on streak
  const getStreakMessage = (streak) => {
    if (streak === 0) {
      return "Start writing to build your streak!";
    } else if (streak === 1) {
      return "Great start! Write again tomorrow.";
    } else if (streak === 2) {
      return "Nice momentum! Keep going! 💪";
    } else if (streak === 3) {
      return "Three days strong! You're unstoppable!";
    } else if (streak >= 4 && streak <= 6) {
      return "Amazing consistency! You're on fire! 🔥";
    } else if (streak >= 7 && streak <= 13) {
      return "Two weeks of greatness! You're a journaling champion!";
    } else if (streak >= 14 && streak <= 30) {
      return "One month+ streak! Absolutely incredible! 🌟";
    } else if (streak > 30) {
      return `${streak} days of pure dedication! You're a legend! 👑`;
    }
  };

  // Pagination logic for Recent Entries
  const totalPages = Math.ceil(entries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const paginatedEntries = entries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getMoodIcon = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'sentiment-very-satisfied';
      case 'sad': return 'sentiment-very-dissatisfied';
      case 'neutral': return 'sentiment-neutral';
      case 'excited': return 'sentiment-very-satisfied';
      case 'angry': return 'sentiment-very-dissatisfied';
      case 'anxious': return 'sentiment-dissatisfied';
      case 'tired': return 'bedtime';
      default: return 'sentiment-neutral'; // default
    }
  };

  const getMoodColor = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return '#22c55e'; // Green
      case 'sad': return '#3b82f6'; // Blue
      case 'neutral': return '#f59e0b'; // Orange
      case 'excited': return '#ec4899'; // Pink
      case 'angry': return '#ef4444'; // Red
      case 'anxious': return '#d946ef'; // Purple
      case 'tired': return '#6366f1'; // Indigo
      default: return COLORS.primary;
    }
  };

  const themeStyles = {
    container: {
      backgroundColor: COLORS.backgroundLight,
    },
    textPrimary: {
      color: COLORS.textMain,
    },
    textQuote: {
      color: COLORS.textMain,
    },
    textSecondary: {
      color: COLORS.textGray,
    },
    cardBg: {
      backgroundColor: '#FFFFFF',
    },
    entryBg: {
      backgroundColor: COLORS.beigeAccent,
    },
    border: {
      borderColor: COLORS.borderLight,
    },
    bottomNavBg: {
       backgroundColor: 'rgba(255, 255, 255, 0.95)',
       borderTopColor: COLORS.borderLight,
    }
  };

  const renderEntryItem = (item) => {
    // Use entryDate, createdAt, or date field
    const dateToUse = item.entryDate || item.createdAt || item.date;
    const { month, day } = formatDate(dateToUse);
    const moodIcon = getMoodIcon(item.mood);
    const moodColor = getMoodColor(item.mood);

    return (
      <TouchableOpacity 
        key={item.id || item._id} 
        style={[styles.entryCard, themeStyles.entryBg, { borderColor: 'transparent' }]}
        onPress={() => onNavigate('NewEntry', { entryId: item.id || item._id, diaryId: currentDiaryId, returnTo: 'Home' })}
      >
        <View style={[styles.dateBox, isDark ? { backgroundColor: COLORS.backgroundDark } : { backgroundColor: '#FFFFFF' }]}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={[styles.dateDay, isDark && { color: '#FFF' }]}>{day}</Text>
        </View>
        <View style={styles.entryContent}>
          <Text style={[styles.entryTitle, themeStyles.textPrimary]} numberOfLines={1}>{item.title || 'Untitled'}</Text>
          <Text style={[styles.entrySubtitle, { color: COLORS.textGray }]} numberOfLines={1}>
            {item.content || 'No content preview'}
          </Text>
        </View>
        <MaterialIcons name={moodIcon} size={28} color={moodColor} />
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Show menu screens based on active selection */}
      {activeMenuScreen === 'search' && (
        <SearchScreen 
          onClose={() => {
            setActiveMenuScreen(null);
          }}
          diaryId={currentDiaryId}
          onSelectEntry={handleSelectEntry}
        />
      )}
      {activeMenuScreen === 'settings' && (
        <SettingsScreen onClose={() => setActiveMenuScreen(null)} />
      )}
      {activeMenuScreen === 'export' && (
        <ExportScreen onClose={() => setActiveMenuScreen(null)} />
      )}

      {/* Main Home Screen */}
      {!activeMenuScreen && (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingTop: 0 }} edges={['left', 'right', 'bottom']}>
        
        {/* Top App Bar */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => setMenuOpen(true)}>
                 <MaterialIcons name="menu" size={28} color={isDark ? '#FFF' : '#111811'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, themeStyles.textPrimary]}>SoulDiary</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={styles.iconButton} onPress={fetchData}>
                   <MaterialIcons name="refresh" size={28} color={isDark ? '#FFF' : '#111811'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => onNavigate('Profile')}>
                   <MaterialIcons name="person" size={28} color={isDark ? '#FFF' : '#111811'} />
              </TouchableOpacity>
            </View>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Daily Inspiration */}
            <View style={styles.inspirationContainer}>
                <Text style={[styles.quoteText, themeStyles.textQuote]}>
                    "{dailyQuote}"
                </Text>
                <Text style={styles.quoteLabel}>Daily Inspiration</Text>
            </View>

            {/* Streak Card */}
            <View style={styles.sectionPadding}>
                <View style={[styles.streakCard, themeStyles.cardBg, themeStyles.border]}>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                        <Text style={[styles.streakValue, themeStyles.textPrimary]}>
                          {currentStreak} Day{currentStreak !== 1 ? 's' : ''} Streak
                        </Text>
                        <Text style={[styles.streakSub, themeStyles.textSecondary]}>
                          {getStreakMessage(currentStreak)}
                        </Text>
                    </View>
                    <View style={styles.streakIconContainer}>
                         <MaterialIcons name={currentStreak > 0 ? "local-fire-department" : "schedule"} size={40} color={currentStreak > 0 ? COLORS.primary : '#D1D5DB'} />
                    </View>
                </View>
            </View>

            {/* Write Button */}
            <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={[styles.writeButton, (loading || !currentDiaryId) && { opacity: 0.5 }]} 
                  onPress={() => onNavigate('NewEntry', { diaryId: currentDiaryId, returnTo: 'Home' })}
                  disabled={loading || !currentDiaryId}
                >
                    <MaterialIcons name="edit-note" size={24} color="#111811" />
                    <Text style={styles.writeButtonText}>{loading ? 'Loading Diary...' : "Write Today's Story"}</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Entries Header */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>Recent Entries</Text>
                <TouchableOpacity 
                  onPress={() => onNavigate('History', { diaryId: currentDiaryId })}
                  disabled={!currentDiaryId}
                >
                    <Text style={[styles.viewAllText, !currentDiaryId && { opacity: 0.5 }]}>VIEW ALL</Text>
                </TouchableOpacity>
            </View>

            {/* Entries List */}
            <View style={styles.entriesList}>
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (Array.isArray(entries) && entries.length > 0) ? (
                  paginatedEntries.map(renderEntryItem)
                ) : (
                  <Text style={{ textAlign: 'center', color: COLORS.textGray, marginTop: 20 }}>
                    No entries yet. Start writing!
                  </Text>
                )}
            </View>

            {/* Pagination Controls */}
            {!loading && entries.length > ENTRIES_PER_PAGE && totalPages > 1 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                  onPress={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? '#D1D5DB' : COLORS.primary} />
                  <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageIndicatorText}>
                    Page {currentPage} of {totalPages}
                  </Text>
                  <Text style={styles.pageCountText}>
                    ({startIndex + 1}-{Math.min(startIndex + ENTRIES_PER_PAGE, entries.length)} of {entries.length})
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
                  onPress={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <Text style={[styles.paginationButtonText, currentPage === totalPages && styles.paginationButtonTextDisabled]}>
                    Next
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? '#D1D5DB' : COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Padding for Bottom Nav */}
            <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomNav, themeStyles.bottomNavBg]}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History', { diaryId: currentDiaryId })}>
                  <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar', { diaryId: currentDiaryId })}>
                  <MaterialIcons name="calendar-today" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Calendar</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics', { diaryId: currentDiaryId })}>
                  <MaterialIcons name="analytics" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Insights</Text>
             </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* Side Menu */}
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={handleSearch}
        onSettings={handleSettings}
        onExport={handleExport}
        onLogout={handleLogout}
      />
    </View>
      )}
    </>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  inspirationContainer: {
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
  sectionPadding: {
    paddingHorizontal: 16,
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
  actionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  writeButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  writeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111811',
    fontFamily: 'Manrope_700Bold',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontFamily: 'Manrope_700Bold',
  },
  entriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
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
    color: '#111811',
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
    marginTop: 0,
  },
  paginationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E7E5E4',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F4',
    flex: 1,
    justifyContent: 'center',
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: COLORS.primary,
  },
  paginationButtonTextDisabled: {
    color: '#D1D5DB',
  },
  pageIndicator: {
    alignItems: 'center',
    flex: 1,
  },
  pageIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  pageCountText: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 2,
  }
});

export default HomeScreen;