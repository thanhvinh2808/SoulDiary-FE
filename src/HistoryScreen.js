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
  RefreshControl,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const HistoryScreen = ({ onNavigate }) => {
  // FORCE LIGHT MODE
  const isDark = false;
  const insets = useSafeAreaInsets(); 

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    cardBg: { backgroundColor: '#FFFFFF' },
    navBg: { backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  };

  const fetchData = useCallback(async () => {
    try {
      // Lấy toàn bộ journals (entries)
      const data = await diaryService.getEntries({ limit: 100 }); // Lấy nhiều hơn cho history
      
      if (Array.isArray(data)) {
        // Group data by Month Year
        const grouped = data.reduce((acc, entry) => {
          // Backend field: entryDate
          const date = new Date(entry.entryDate || entry.createdAt);
          const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(entry);
          return acc;
        }, {});

        const sectionsData = Object.keys(grouped).map(key => ({
          title: key,
          data: grouped[key].sort((a, b) => new Date(b.entryDate || b.createdAt) - new Date(a.entryDate || a.createdAt))
        })).sort((a, b) => {
           // Sort sections by date of first item
           const dateA = new Date(a.data[0].entryDate || a.data[0].createdAt);
           const dateB = new Date(b.data[0].entryDate || b.data[0].createdAt);
           return dateB - dateA;
        });

        setSections(sectionsData);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getMoodConfig = (mood) => {
    switch (mood?.toLowerCase()) {
      case 'happy': return { icon: 'sentiment-very-satisfied', color: '#19e619', bg: 'rgba(25, 230, 25, 0.1)' };
      case 'sad': return { icon: 'sentiment-very-dissatisfied', color: '#4B5563', bg: '#F3F4F6' };
      case 'angry': return { icon: 'sentiment-dissatisfied', color: '#EF4444', bg: '#FEE2E2' };
      case 'anxious': return { icon: 'help-outline', color: '#F59E0B', bg: '#FEF3C7' };
      default: return { icon: 'sentiment-neutral', color: '#9CA3AF', bg: '#F3F4F6' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const renderEntry = ({ item }) => {
    const { icon, color, bg } = getMoodConfig(item.mood);
    const { day, time } = formatDate(item.entryDate || item.createdAt);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => onNavigate('NewEntry', { entryId: item.id || item._id })}
        activeOpacity={0.7}
      >
        {item.image && (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        )}
        <View style={styles.cardContent}>
          <View style={styles.moodContainer}>
             <View style={[styles.moodCircle, { backgroundColor: bg }]}>
               <MaterialIcons name={icon} size={28} color={color} />
             </View>
          </View>
          
          <View style={{ flex: 1 }}>
              <View style={styles.cardHeader}>
                  <Text style={styles.cardDay}>{day}</Text>
                  <Text style={styles.cardTime}>{time}</Text>
              </View>
              <Text style={[styles.cardTitle, { color: COLORS.textMain }]}>{item.title || 'Untitled'}</Text>
              <Text style={styles.cardText} numberOfLines={2}>
                  {item.content || 'No content'}
              </Text>
              {/* Tags from backend */}
              <View style={styles.tagsRow}>
                  {item.tags && item.tags.map((tag, idx) => (
                      <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                      </View>
                  ))}
                  {(!item.tags || item.tags.length === 0) && (
                      <View style={[styles.tag, { backgroundColor: 'transparent', paddingLeft: 0 }]}>
                          <Text style={[styles.tagText, { color: '#A8A29E', fontWeight: '500' }]}>No tags</Text>
                      </View>
                  )}
              </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
                <TouchableOpacity style={styles.iconButton} onPress={fetchData}>
                    <MaterialIcons name="refresh" size={24} color="#57534E" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialIcons name="search" size={24} color="#A8A29E" style={{ marginLeft: 12 }} />
                    <TextInput 
                        style={styles.searchInput}
                        placeholder="Search entries..."
                        placeholderTextColor="#A8A29E"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>
        </View>

        {/* List */}
        {loading && !refreshing ? (
           <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
             <ActivityIndicator size="large" color={COLORS.primary} />
           </View>
        ) : (
          <SectionList
              sections={sections}
              keyExtractor={(item) => item.id || item._id}
              renderItem={renderEntry}
              renderSectionHeader={({ section: { title } }) => (
                  <View style={styles.sectionHeader}>
                      <Text style={styles.sectionHeaderText}>{title}</Text>
                  </View>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
              }
              ListEmptyComponent={
                <View style={{ alignItems: 'center', marginTop: 50 }}>
                  <Text style={{ color: COLORS.textGray, fontFamily: 'Manrope_500Medium' }}>No entries found.</Text>
                </View>
              }
          />
        )}

        {/* FAB */}
        <TouchableOpacity 
            style={styles.fab}
            onPress={() => onNavigate('NewEntry')}
        >
            <MaterialIcons name="add" size={32} color="#112111" />
        </TouchableOpacity>

        {/* Bottom Navigation */}
        <View style={[styles.bottomNav, themeStyles.navBg]}>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('Home')}>
                  <MaterialIcons name="home" size={28} color="#A8A29E" />
                  <Text style={[styles.navLabel, { color: "#A8A29E" }]}>Home</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.navItem} onPress={() => onNavigate('History')}>
                  <MaterialIcons name="menu-book" size={28} color={COLORS.primary} />
                  <Text style={[styles.navLabel, { color: COLORS.primary }]}>Diary</Text>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
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
    backgroundColor: '#F5F5F4',
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingVertical: 16,
    paddingTop: 8,
    backgroundColor: COLORS.backgroundLight,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#78716C',
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
    fontSize: 14, // Reduced from 18 to fit better
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#1C1917',
  },
  cardTime: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Manrope_500Medium',
    color: '#A8A29E',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#78716C',
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
    color: '#57534E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 90,
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
