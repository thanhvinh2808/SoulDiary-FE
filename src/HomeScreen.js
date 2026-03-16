import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Text,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { getThemeColors, COLORS, FONTS } from './theme';
import { diaryService } from './services/diaryService';
import { authService } from './services/authService';
import { getDailyQuote, calculateStreak } from './utils/helpers';
import { PAGINATION } from './utils/constants';

// Components
import {
  HomeHeader,
  DailyQuoteCard,
  StreakCard,
  EntryCard,
  PaginationControls,
  BottomNav,
} from './components/Home';
import { LoadingSpinner, EmptyState } from './components/Shared';

// Modals
import SideMenu from './SideMenu';
import SearchScreen from './SearchScreen';
import SettingsScreen from './SettingsScreen';
import ExportScreen from './ExportScreen';

const HomeScreen = ({ onNavigate }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);

  // State
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuScreen, setActiveMenuScreen] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const dailyQuote = getDailyQuote();
  const streakValue = calculateStreak(entries);
  const totalPages = Math.ceil(entries.length / PAGINATION.ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * PAGINATION.ENTRIES_PER_PAGE;
  const paginatedEntries = entries.slice(startIndex, startIndex + PAGINATION.ENTRIES_PER_PAGE);

  // Fetch diary data
  const fetchData = useCallback(async () => {
    try {
      if (!refreshing) setLoading(true);
      
      const diaryEntries = await diaryService.getEntries({ limit: 100 });
      const entriesArray = Array.isArray(diaryEntries) ? diaryEntries : [];
      setEntries(entriesArray);
      
    } catch (error) {
      console.error('Failed to fetch data', error);
      setEntries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleSelectEntry = (entry) => {
    setActiveMenuScreen(null);
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('NewEntry', {
          entryId: entry.id || entry._id,
          returnTo: 'Home'
        });
      }
    }, 300);
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
              await authService.removeTokens();
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

  // Render conditional screens
  if (activeMenuScreen === 'search') {
    return (
      <SearchScreen
        onClose={() => setActiveMenuScreen(null)}
        onSelectEntry={handleSelectEntry}
      />
    );
  }

  if (activeMenuScreen === 'settings') {
    return <SettingsScreen onClose={() => setActiveMenuScreen(null)} />;
  }

  if (activeMenuScreen === 'export') {
    return <ExportScreen onClose={() => setActiveMenuScreen(null)} />;
  }

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={themeColors.statusBarStyle} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
        {/* Header */}
        <HomeHeader
          onMenuPress={() => setMenuOpen(true)}
          onProfilePress={() => onNavigate('Profile')}
          themeColors={themeColors}
        />

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              colors={[COLORS.primary]} 
            />
          }
        >
          {/* Daily Quote */}
          <DailyQuoteCard quote={dailyQuote} themeColors={themeColors} />

          {/* Streak Card */}
          <StreakCard streak={streakValue} themeColors={themeColors} />

          {/* Write Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.writeButton, loading && { opacity: 0.5 }]}
              onPress={() => onNavigate('NewEntry', { returnTo: 'Home' })}
              disabled={loading}
            >
              <MaterialIcons name="edit-note" size={24} color="#111811" />
              <Text style={styles.writeButtonText}>
                {loading ? 'Loading...' : "Write Today's Story"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Recent Entries */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Recent Entries</Text>
            <TouchableOpacity
              onPress={() => onNavigate('History')}
            >
              <Text style={[styles.viewAllText]}>
                VIEW ALL
              </Text>
            </TouchableOpacity>
          </View>

          {/* Entries List */}
          <View style={styles.entriesList}>
            {loading && !refreshing ? (
              <LoadingSpinner />
            ) : paginatedEntries.length > 0 ? (
              paginatedEntries.map((entry) => (
                <EntryCard
                  key={entry.id || entry._id}
                  entry={entry}
                  onPress={() => handleSelectEntry(entry)}
                  themeColors={themeColors}
                />
              ))
            ) : (
              <EmptyState
                icon="note"
                title="No Entries Yet"
                message="Start writing your first entry!"
              />
            )}
          </View>

          {/* Pagination */}
          {!loading && entries.length > PAGINATION.ENTRIES_PER_PAGE && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              totalItems={entries.length}
              itemsPerPage={PAGINATION.ENTRIES_PER_PAGE}
              onPreviousPress={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
              onNextPress={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
              themeColors={themeColors}
            />
          )}

          {/* Padding for Bottom Nav */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav
          activeScreen="Home"
          onNavigate={onNavigate}
        />
      </SafeAreaView>

      {/* Side Menu */}
      <SideMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onSearch={() => {
          setMenuOpen(false);
          setActiveMenuScreen('search');
        }}
        onSettings={() => {
          setMenuOpen(false);
          setActiveMenuScreen('settings');
        }}
        onExport={() => {
          setMenuOpen(false);
          setActiveMenuScreen('export');
        }}
        onLogout={handleLogout}
      />
    </View>
  );
};

// Minimal styles - all component styling is in component files
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    fontFamily: FONTS.ui.bold,
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
    fontFamily: FONTS.ui.bold,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    fontFamily: FONTS.ui.bold,
  },
  entriesList: {
    paddingHorizontal: 16,
    gap: 12,
  },
});

export default HomeScreen;