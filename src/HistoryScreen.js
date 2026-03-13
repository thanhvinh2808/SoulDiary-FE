import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  SectionList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { getThemeColors, COLORS } from './theme';
import { diaryService } from './services/diaryService';

// Components
import { HistoryEntryItem } from './components/History';
import { LoadingSpinner, EmptyState } from './components/Shared';

const HistoryScreen = ({ onNavigate, params }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const [diaryId, setDiaryId] = useState(params?.diaryId);

  // State
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [groupedSections, setGroupedSections] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // Fetch entries from API
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const diaryEntries = await diaryService.getEntries(diaryId, showDeleted);
      const entriesArray = Array.isArray(diaryEntries) ? diaryEntries : [];
      setEntries(entriesArray);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    } finally {
      setLoading(false);
    }
  }, [diaryId, showDeleted]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Group entries by month
  useEffect(() => {
    const grouped = {};
    const entriesToProcess = showDeleted 
      ? entries.filter(e => e.isDeleted || e.deleted)
      : entries.filter(e => !e.isDeleted && !e.deleted);

    entriesToProcess.forEach((entry) => {
      const dateStr = entry.entryDate || entry.createdAt || entry.date;
      if (dateStr) {
        const date = new Date(dateStr);
        const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

        if (!grouped[monthKey]) {
          grouped[monthKey] = [];
        }
        grouped[monthKey].push(entry);
      }
    });

    const sections = Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map((month) => ({
        title: month,
        data: grouped[month].filter((entry) => {
          const searchLower = searchText.toLowerCase();
          return (
            (entry.title?.toLowerCase().includes(searchLower) || false) ||
            (entry.content?.toLowerCase().includes(searchLower) || false)
          );
        }),
      }))
      .filter((section) => section.data.length > 0);

    setGroupedSections(sections);
  }, [entries, searchText, showDeleted]);

  const handleSelectEntry = (entry) => {
    if (onNavigate) {
      onNavigate('NewEntry', {
        entryId: entry.id || entry._id,
        diaryId: diaryId,
        returnTo: 'History',
      });
    }
  };

  const handleDeleteEntry = (entry) => {
    const isDeleted = entry.isDeleted || entry.deleted;
    
    if (isDeleted) {
      Alert.alert('Restore Entry', 'Do you want to restore this entry?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'default',
          onPress: async () => {
            try {
              await diaryService.restoreEntry(diaryId, entry.id || entry._id);
              fetchEntries();
            } catch (error) {
              Alert.alert('Error', 'Failed to restore entry');
            }
          },
        },
      ]);
    } else {
      Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await diaryService.deleteEntry(diaryId, entry.id || entry._id);
              fetchEntries();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => onNavigate('Home')}>
            <MaterialIcons name="arrow-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {showDeleted ? 'Deleted Entries' : 'Diary Entries'}
          </Text>
          <TouchableOpacity
            style={[styles.trashButton, showDeleted && { backgroundColor: COLORS.primary + '15' }]}
            onPress={() => setShowDeleted(!showDeleted)}
          >
            <MaterialIcons 
              name={showDeleted ? 'restore' : 'delete-outline'} 
              size={24} 
              color={showDeleted ? COLORS.primary : themeColors.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { borderBottomColor: themeColors.border }]}>
          <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <MaterialIcons name="search" size={20} color={themeColors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search entries..."
              placeholderTextColor={themeColors.textMuted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : groupedSections.length === 0 ? (
          <EmptyState
            icon="calendar-today"
            title={entries.length === 0 ? 'No Entries' : 'No Results'}
            message="Start writing or try different search"
          />
        ) : (
          <SectionList
            sections={groupedSections}
            keyExtractor={(item) => item.id || item._id}
            renderItem={({ item }) => (
              <HistoryEntryItem
                entry={item}
                onPress={() => handleSelectEntry(item)}
                themeColors={themeColors}
                isDeleted={item.isDeleted || item.deleted}
                onDelete={() => handleDeleteEntry(item)}
              />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={[styles.sectionHeader, { color: themeColors.text, backgroundColor: themeColors.background }]}>
                {title}
              </Text>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backButton: { padding: 8 },
  trashButton: { padding: 8, borderRadius: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  sectionHeader: { fontSize: 14, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 }
});

export default HistoryScreen;