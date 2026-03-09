import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const SearchScreen = ({ onClose, diaryId, onSelectEntry }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const MOODS = [
    { id: 'happy', label: '😊 Happy', color: '#22c55e' },
    { id: 'sad', label: '😔 Sad', color: '#3b82f6' },
    { id: 'neutral', label: '😐 Neutral', color: '#f59e0b' },
    { id: 'angry', label: '😠 Angry', color: '#ef4444' },
    { id: 'anxious', label: '😰 Anxious', color: '#d946ef' },
    { id: 'excited', label: '🤩 Excited', color: '#ec4899' },
    { id: 'tired', label: '😴 Tired', color: '#6366f1' },
  ];

  // Toggle mood selection
  const toggleMood = (moodId) => {
    setSelectedMoods(prev =>
      prev.includes(moodId)
        ? prev.filter(m => m !== moodId)
        : [...prev, moodId]
    );
  };

  // Perform search
  const handleSearch = async () => {
    try {
      setSearching(true);
      setHasSearched(true);

      // Fetch all entries
      const allEntries = await diaryService.getEntries(diaryId);
      let filtered = Array.isArray(allEntries) ? [...allEntries] : [];

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(entry =>
          (entry.title?.toLowerCase().includes(query) || false) ||
          (entry.content?.toLowerCase().includes(query) || false)
        );
      }

      // Filter by selected moods
      if (selectedMoods.length > 0) {
        filtered = filtered.filter(entry =>
          selectedMoods.includes(entry.mood?.toLowerCase())
        );
      }

      // Filter by date range
      if (startDate) {
        const start = new Date(startDate);
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.entryDate || entry.createdAt || entry.date);
          return entryDate >= start;
        });
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include entire day
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.entryDate || entry.createdAt || entry.date);
          return entryDate <= end;
        });
      }

      setResults(filtered.sort((a, b) => {
        const dateA = new Date(a.entryDate || a.createdAt || a.date);
        const dateB = new Date(b.entryDate || b.createdAt || b.date);
        return dateB - dateA; // Most recent first
      }));

      console.log(`🔍 Search completed: ${filtered.length} results found`);
    } catch (error) {
      console.error('Search failed:', error);
      Alert.alert('Error', 'Failed to search entries');
    } finally {
      setSearching(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchQuery('');
    setSelectedMoods([]);
    setStartDate('');
    setEndDate('');
    setResults([]);
    setHasSearched(false);
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get mood color
  const getMoodColor = (mood) => {
    const found = MOODS.find(m => m.id === mood?.toLowerCase());
    return found?.color || '#94a3b8';
  };

  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={() => {
        if (onSelectEntry) {
          onSelectEntry(item);
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.moodIndicator, { backgroundColor: getMoodColor(item.mood) }]} />
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={styles.resultDate}>
          {formatDate(item.entryDate || item.createdAt || item.date)}
        </Text>
        <Text style={styles.resultPreview} numberOfLines={2}>
          {item.content || 'No content'}
        </Text>
      </View>
      {item.mood && (
        <Text style={styles.moodLabel}>
          {MOODS.find(m => m.id === item.mood?.toLowerCase())?.label.split(' ')[0]}
        </Text>
      )}
      <MaterialIcons name="edit" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <MaterialIcons name="arrow-back" size={28} color="#111811" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Entries</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Search Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keyword Search</Text>
            <View style={styles.searchInputContainer}>
              <MaterialIcons name="search" size={20} color="#A8A29E" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title or content..."
                placeholderTextColor="#A8A29E"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="close" size={20} color="#A8A29E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Mood Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter by Mood</Text>
            <View style={styles.moodGrid}>
              {MOODS.map(mood => (
                <TouchableOpacity
                  key={mood.id}
                  style={[
                    styles.moodChip,
                    selectedMoods.includes(mood.id) && [
                      styles.moodChipSelected,
                      { borderColor: mood.color }
                    ]
                  ]}
                  onPress={() => toggleMood(mood.id)}
                >
                  <Text style={styles.moodChipText}>{mood.label}</Text>
                  {selectedMoods.includes(mood.id) && (
                    <MaterialIcons name="check" size={16} color={mood.color} style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Range Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date Range (Optional)</Text>
            
            <View>
              <Text style={styles.labelText}>From:</Text>
              <View style={styles.dateInputContainer}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A8A29E"
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <Text style={styles.labelText}>To:</Text>
              <View style={styles.dateInputContainer}>
                <MaterialIcons name="calendar-today" size={20} color={COLORS.primary} />
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#A8A29E"
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}
            >
              <MaterialIcons name="refresh" size={20} color="#111811" />
              <Text style={[styles.buttonText, { color: '#111811' }]}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.searchButton]}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <MaterialIcons name="search" size={20} color="#FFF" />
                  <Text style={styles.buttonText}>Search</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Results */}
          {hasSearched && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                {results.length} {results.length === 1 ? 'entry' : 'entries'} found
              </Text>

              {results.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="search-off" size={48} color="#D4A574" />
                  <Text style={styles.emptyText}>No entries found</Text>
                  <Text style={styles.emptySubtext}>Try adjusting your search criteria</Text>
                </View>
              ) : (
                <FlatList
                  data={results}
                  renderItem={renderResultItem}
                  keyExtractor={(item) => item.id || item._id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                />
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#111811',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  moodChipSelected: {
    backgroundColor: '#FFF',
    borderWidth: 2,
  },
  moodChipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    marginBottom: 6,
  },
  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#111811',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#E5E5E5',
  },
  searchButton: {
    backgroundColor: COLORS.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#FFF',
  },
  resultsSection: {
    paddingHorizontal: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  moodIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  resultDate: {
    fontSize: 11,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 2,
  },
  resultPreview: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#78716C',
    marginTop: 4,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#A8A29E',
  },
});

export default SearchScreen;
