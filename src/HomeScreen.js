import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Dimensions,
  Platform,
  useColorScheme,
  ActivityIndicator,
  Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const HomeScreen = ({ onNavigate }) => {
  const isDark = false; // Luôn dùng Light Mode
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDiaryId, setCurrentDiaryId] = useState(null);

  const fetchDat = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Lấy danh sách Diary
      let diaries = await diaryService.getDiaries();
      
      // Tự động tạo Diary mặc định nếu chưa có (dành cho User mới)
      if (!diaries || diaries.length === 0) {
        try {
           console.log("No diaries found. Creating default diary...");
           const newDiary = await diaryService.createDiary("My Journal", "Personal diary created automatically");
           diaries = [newDiary];
        } catch (createError) {
           console.error("Failed to create default diary", createError);
        }
      }

      if (diaries && diaries.length > 0) {
        // Mặc định lấy diary đầu tiên
        const firstDiary = diaries[0];
        setCurrentDiaryId(firstDiary.id || firstDiary._id);

        // 2. Lấy Entries của Diary đó
        const diaryEntries = await diaryService.getEntries(firstDiary.id || firstDiary._id);
        setEntries(diaryEntries);
      } else {
        // Trường hợp lỗi tạo diary
        setEntries([]);
      }
    } catch (error) {
      console.error('Failed to fetch data', error);
      // Không alert lỗi chặn người dùng, chỉ log
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDat();
  }, [fetchDat]);

  // Format Date: "2023-10-25..." -> Month: "OCT", Date: "25"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return {
      month: months[date.getMonth()],
      day: date.getDate().toString()
    };
  };

  const getMoodIcon = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return 'sentiment-very-satisfied';
      case 'sad': return 'sentiment-very-dissatisfied';
      case 'neutral': return 'sentiment-neutral';
      default: return 'sentiment-satisfied'; // default
    }
  };

  const getMoodColor = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return COLORS.primary;
      case 'sad': return COLORS.textGray;
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
    const { month, day } = formatDate(item.date);
    const moodIcon = getMoodIcon(item.mood);
    const moodColor = getMoodColor(item.mood);

    return (
      <TouchableOpacity 
        key={item.id || item._id} 
        style={[styles.entryCard, themeStyles.entryBg, { borderColor: 'transparent' }]}
        onPress={() => onNavigate('NewEntry', { entryId: item.id || item._id, diaryId: currentDiaryId })}
      >
        <View style={[styles.dateBox, isDark ? { backgroundColor: COLORS.backgroundDark } : { backgroundColor: '#FFFFFF' }]}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={[styles.dateDay, isDark && { color: '#FFF' }]}>{day}</Text>
        </View>
        <View style={styles.entryContent}>
          <Text style={[styles.entryTitle, themeStyles.textPrimary]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.entrySubtitle, { color: COLORS.textGray }]} numberOfLines={1}>
            {item.content || 'No content preview'}
          </Text>
        </View>
        <MaterialIcons name={moodIcon} size={28} color={moodColor} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Top App Bar */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.iconButton}>
                 <MaterialIcons name="menu" size={28} color={isDark ? '#FFF' : '#111811'} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, themeStyles.textPrimary]}>SoulDiary</Text>
            <TouchableOpacity style={styles.iconButton} onPress={fetchDat}>
                 <MaterialIcons name="refresh" size={28} color={isDark ? '#FFF' : '#111811'} />
            </TouchableOpacity>
        </View>

        <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
        >
            {/* Daily Inspiration */}
            <View style={styles.inspirationContainer}>
                <Text style={[styles.quoteText, themeStyles.textQuote]}>
                    "Small steps lead to big changes."
                </Text>
                <Text style={styles.quoteLabel}>Daily Inspiration</Text>
            </View>

            {/* Streak Card */}
            <View style={styles.sectionPadding}>
                <View style={[styles.streakCard, themeStyles.cardBg, themeStyles.border]}>
                    <View style={styles.streakInfo}>
                        <Text style={styles.streakLabel}>CURRENT STREAK</Text>
                        <Text style={[styles.streakValue, themeStyles.textPrimary]}>5 Day Streak</Text>
                        <Text style={[styles.streakSub, themeStyles.textSecondary]}>You're doing great! Keep it up.</Text>
                    </View>
                    <View style={styles.streakIconContainer}>
                         <MaterialIcons name="local-fire-department" size={40} color={COLORS.primary} />
                    </View>
                </View>
            </View>

            {/* Write Button */}
            <View style={styles.actionContainer}>
                <TouchableOpacity 
                  style={styles.writeButton} 
                  onPress={() => onNavigate('NewEntry', { diaryId: currentDiaryId })}
                >
                    <MaterialIcons name="edit-note" size={24} color="#111811" />
                    <Text style={styles.writeButtonText}>Write Today's Story</Text>
                </TouchableOpacity>
            </View>

            {/* Recent Entries Header */}
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, themeStyles.textPrimary]}>Recent Entries</Text>
                <TouchableOpacity onPress={() => onNavigate('History')}>
                    <Text style={styles.viewAllText}>VIEW ALL</Text>
                </TouchableOpacity>
            </View>

            {/* Entries List */}
            <View style={styles.entriesList}>
                {loading ? (
                  <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : entries.length > 0 ? (
                  entries.map(renderEntryItem)
                ) : (
                  <Text style={{ textAlign: 'center', color: COLORS.textGray, marginTop: 20 }}>
                    No entries yet. Start writing!
                  </Text>
                )}
            </View>

            {/* Padding for Bottom Nav */}
            <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomNav, themeStyles.bottomNavBg]}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History')}>
                  <MaterialIcons name="menu-book" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Diary</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Calendar')}>
                  <MaterialIcons name="calendar-today" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Calendar</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Analytics')}>
                  <MaterialIcons name="analytics" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Insights</Text>
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
  }
});

export default HomeScreen;