import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from './theme';
import { diaryService } from './services/diaryService';
import { useTheme } from './context/ThemeContext';

const ExportScreen = ({ onClose }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  const [diaries, setDiaries] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedDiaryId, setSelectedDiaryId] = useState(null);
  const [selectedEntries, setSelectedEntries] = useState([]); // Multiple entry selection
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ENTRIES_PER_PAGE = 5;

  useEffect(() => {
    fetchDiaries();
  }, []);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const data = await diaryService.getDiaries();
      setDiaries(Array.isArray(data) ? data : []);
      if (data && data.length > 0) {
        setSelectedDiaryId(data[0].id || data[0]._id);
        fetchEntries(data[0].id || data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
      Alert.alert('Error', 'Failed to load diaries');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async (diaryId) => {
    try {
      const data = await diaryService.getEntries(diaryId);
      setEntries(Array.isArray(data) ? data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : []);
      setSelectedEntries([]); // Clear selection when switching diaries
    } catch (error) {
      console.error('Failed to fetch entries:', error);
      Alert.alert('Error', 'Failed to load entries');
    }
  };

  const toggleEntrySelection = (entryId) => {
    setSelectedEntries(prev =>
      prev.includes(entryId)
        ? prev.filter(id => id !== entryId)
        : [...prev, entryId]
    );
  };

  const selectAllEntries = () => {
    const filtered = filterEntries();
    if (selectedEntries.length === filtered.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(filtered.map(e => e.id || e._id));
    }
  };

  const filterEntries = () => {
    if (!searchQuery.trim()) return entries;
    
    const query = searchQuery.toLowerCase();
    return entries.filter(entry =>
      (entry.title?.toLowerCase().includes(query) || false) ||
      (entry.content?.toLowerCase().includes(query) || false) ||
      (new Date(entry.createdAt).toLocaleDateString().includes(query) || false)
    );
  };

  const filteredEntries = filterEntries();
  const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);
  const startIndex = (currentPage - 1) * ENTRIES_PER_PAGE;
  const paginatedEntries = filteredEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleExportPDF = async () => {
    if (selectedEntries.length === 0) {
      Alert.alert('Error', 'Please select at least one entry to export');
      return;
    }

    setExporting(true);
    try {
      const entriesToExport = entries.filter(e => selectedEntries.includes(e.id || e._id));
      const diary = diaries.find(d => (d.id === selectedDiaryId || d._id === selectedDiaryId));

      // Generate PDF content (text-based format)
      let pdfContent = `========================================\n`;
      pdfContent += `📔 ${diary?.name || 'My Diary'}\n`;
      pdfContent += `========================================\n\n`;
      pdfContent += `Generated on: ${new Date().toLocaleDateString()}\n`;
      pdfContent += `Total Entries Exported: ${entriesToExport.length}\n\n`;

      if (entriesToExport.length > 0) {
        entriesToExport.forEach((entry, index) => {
          const entryDate = new Date(entry.entryDate || entry.createdAt || entry.date);
          pdfContent += `\n${index + 1}. ${entry.title || 'Untitled'} - ${entryDate.toLocaleDateString()}\n`;
          pdfContent += `   Mood: ${entry.mood ? entry.mood.toUpperCase() : 'Not specified'}\n`;
          pdfContent += `   Content:\n${entry.content || 'No content'}\n`;
          pdfContent += `----------------------------------------\n`;
        });
      }

      Alert.alert(
        'Export Ready',
        `✅ ${entriesToExport.length} entry/entries ready to export!\n\nIn a full app, this would generate a PDF file.`,
        [{ text: 'OK', onPress: () => {} }]
      );

      console.log('✅ PDF export content generated for', entriesToExport.length, 'entries');
    } catch (error) {
      console.error('Failed to export:', error);
      Alert.alert('Error', error.message || 'Failed to export entries');
    } finally {
      setExporting(false);
    }
  };

  const handleExportJSON = async () => {
    if (selectedEntries.length === 0) {
      Alert.alert('Error', 'Please select at least one entry to export');
      return;
    }

    setExporting(true);
    try {
      const entriesToExport = entries.filter(e => selectedEntries.includes(e.id || e._id));
      const diary = diaries.find(d => (d.id === selectedDiaryId || d._id === selectedDiaryId));

      const exportData = {
        diary: {
          id: diary?.id || diary?._id,
          name: diary?.name,
          description: diary?.description,
          createdAt: diary?.createdAt,
        },
        entries: entriesToExport || [],
        exportDate: new Date().toISOString(),
        totalEntries: entriesToExport.length,
      };

      const jsonString = JSON.stringify(exportData, null, 2);

      Alert.alert(
        'Export Ready',
        `✅ ${entriesToExport.length} entry/entries backup ready!\n\n${diary?.name}\nIn a full app, this would be downloadable as a JSON file.`,
        [{ text: 'OK', onPress: () => {} }]
      );

      console.log('✅ JSON export data generated for', entriesToExport.length, 'entries');
    } catch (error) {
      console.error('Failed to export:', error);
      Alert.alert('Error', error.message || 'Failed to export entries');
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingLeft: insets.left, paddingRight: insets.right, backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <MaterialIcons name="arrow-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>Export & Backup</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView style={[styles.content, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
          
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <MaterialIcons name="cloud-download" size={32} color={COLORS.primary} />
            <Text style={[styles.infoTitle, { color: themeColors.text }]}>Export Your Entries</Text>
            <Text style={[styles.infoText, { color: themeColors.textSecondary }]}>
              Select and export individual journal entries as files to keep backups or share specific memories.
            </Text>
          </View>

          {/* Select Entries */}
          {selectedDiaryId && (
            <View style={styles.section}>
              <View style={styles.entriesHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Select Entries ({selectedEntries.length}/{filteredEntries.length})</Text>
                <TouchableOpacity 
                  style={styles.selectAllButton}
                  onPress={selectAllEntries}
                >
                  <Text style={styles.selectAllText}>
                    {selectedEntries.length === filteredEntries.length && filteredEntries.length > 0 ? 'Clear All' : 'Select All'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              {entries.length > 0 && (
                <View style={styles.searchContainer}>
                  <MaterialIcons name="search" size={20} color="#A8A29E" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title, date, or content..."
                    placeholderTextColor="#A8A29E"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      setCurrentPage(1); // Reset to page 1 on search
                    }}
                  />
                  {searchQuery && (
                    <TouchableOpacity onPress={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}>
                      <MaterialIcons name="close" size={20} color="#A8A29E" />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {entries.length === 0 ? (
                <View style={styles.noEntriesCard}>
                  <MaterialIcons name="event-note" size={40} color="#D4A574" />
                  <Text style={styles.noEntriesText}>No entries yet</Text>
                  <Text style={styles.noEntriesSubtext}>Create entries to export</Text>
                </View>
              ) : filteredEntries.length === 0 ? (
                <View style={styles.noResultsCard}>
                  <MaterialIcons name="search-off" size={40} color="#D4A574" />
                  <Text style={styles.noEntriesText}>No entries found</Text>
                  <Text style={styles.noEntriesSubtext}>Try adjusting your search</Text>
                </View>
              ) : (
                <>
                  <View style={styles.entriesListContainer}>
                    {paginatedEntries.map((entry) => {
                      const isSelected = selectedEntries.includes(entry.id || entry._id);
                      const entryDate = new Date(entry.entryDate || entry.createdAt || entry.date);
                      return (
                        <View key={entry.id || entry._id} style={{ marginBottom: 8 }}>
                          <TouchableOpacity
                            style={[styles.entryItem, isSelected && styles.entryItemSelected]}
                            onPress={() => toggleEntrySelection(entry.id || entry._id)}
                          >
                            <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                              {isSelected && <MaterialIcons name="check" size={16} color="#FFF" />}
                            </View>
                            <View style={styles.entryItemContent}>
                              <Text style={styles.entryItemTitle} numberOfLines={1}>
                                {entry.title || 'Untitled'}
                              </Text>
                              <Text style={styles.entryItemDate}>
                                {entryDate.toLocaleDateString()}
                              </Text>
                              <Text style={styles.entryItemMood}>
                                Mood: {entry.mood ? entry.mood.toUpperCase() : 'Not set'}
                              </Text>
                            </View>
                            <MaterialIcons 
                              name="chevron-right" 
                              size={20} 
                              color={isSelected ? COLORS.primary : '#D1D5DB'} 
                            />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity
                        style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
                        onPress={handlePreviousPage}
                        disabled={currentPage === 1}
                      >
                        <MaterialIcons name="chevron-left" size={20} color={currentPage === 1 ? themeColors.textMuted : COLORS.primary} />
                        <Text style={[styles.paginationButtonText, currentPage === 1 && styles.paginationButtonTextDisabled]}>
                          Previous
                        </Text>
                      </TouchableOpacity>

                      <View style={styles.pageIndicator}>
                        <Text style={styles.pageIndicatorText}>
                          Page {currentPage} of {totalPages}
                        </Text>
                        <Text style={styles.pageCountText}>
                          ({startIndex + 1}-{Math.min(startIndex + ENTRIES_PER_PAGE, filteredEntries.length)} of {filteredEntries.length})
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
                        <MaterialIcons name="chevron-right" size={20} color={currentPage === totalPages ? themeColors.textMuted : COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Format</Text>

            {/* PDF Export */}
            <TouchableOpacity
              style={styles.exportOption}
              onPress={handleExportPDF}
              disabled={exporting || selectedEntries.length === 0}
            >
              <View style={styles.exportLeft}>
                <View style={styles.exportIcon}>
                  <MaterialIcons name="picture-as-pdf" size={24} color="#E74C3C" />
                </View>
                <View>
                  <Text style={styles.exportTitle}>PDF File</Text>
                  <Text style={styles.exportDesc}>{selectedEntries.length > 0 ? `${selectedEntries.length} entry/entries selected` : 'Select entries first'}</Text>
                </View>
              </View>
              {exporting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons name="arrow-forward" size={24} color={selectedEntries.length > 0 ? COLORS.primary : '#D1D5DB'} />
              )}
            </TouchableOpacity>

            {/* JSON Export */}
            <TouchableOpacity
              style={styles.exportOption}
              onPress={handleExportJSON}
              disabled={exporting || selectedEntries.length === 0}
            >
              <View style={styles.exportLeft}>
                <View style={styles.exportIcon}>
                  <MaterialIcons name="storage" size={24} color="#5DADE2" />
                </View>
                <View>
                  <Text style={styles.exportTitle}>JSON Backup</Text>
                  <Text style={styles.exportDesc}>{selectedEntries.length > 0 ? `${selectedEntries.length} entry/entries selected` : 'Select entries first'}</Text>
                </View>
              </View>
              {exporting ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialIcons name="arrow-forward" size={24} color={selectedEntries.length > 0 ? COLORS.primary : '#D1D5DB'} />
              )}
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How It Works</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>1</Text>
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoItemTitle}>Pick a diary</Text>
                <Text style={styles.infoItemDesc}>Choose which diary's entries to export</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>2</Text>
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoItemTitle}>Select entries</Text>
                <Text style={styles.infoItemDesc}>Choose specific entries to export</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoBullet}>
                <Text style={styles.infoBulletText}>3</Text>
              </View>
              <View style={styles.infoItemText}>
                <Text style={styles.infoItemTitle}>Choose format & download</Text>
                <Text style={styles.infoItemDesc}>Pick PDF or JSON, then export</Text>
              </View>
            </View>
          </View>

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
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    textAlign: 'center',
    marginTop: 8,
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
  noDiariesCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  noDiariesText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    marginTop: 12,
  },
  noDiariesSubtext: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  diaryOption: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diaryOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  diaryOptionText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    maxWidth: 120,
  },
  diaryOptionTextSelected: {
    color: '#FFF',
  },
  exportOption: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  exportLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  exportDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  infoItem: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  infoBullet: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBulletText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#FFF',
  },
  infoItemText: {
    flex: 1,
  },
  infoItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  infoItemDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F3F0',
    borderRadius: 6,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: COLORS.primary,
  },
  noEntriesCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  noEntriesText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    marginTop: 12,
  },
  noEntriesSubtext: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  entriesList: {
    gap: 8,
  },
  entryItem: {
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
  entryItemSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  entryItemContent: {
    flex: 1,
  },
  entryItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  entryItemDate: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 2,
  },
  entryItemMood: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: COLORS.primary,
    marginTop: 2,
  },
  searchContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#111811',
    paddingVertical: 6,
  },
  entriesListContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 0,
  },
  noResultsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  paginationContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F3F0',    flex: 1,
    justifyContent: 'center',  },
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
  },
});

export default ExportScreen;
