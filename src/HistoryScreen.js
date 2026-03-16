import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput, SectionList, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from './context/ThemeContext';
import { getThemeColors, COLORS, FONTS } from './theme';
import { diaryService } from './services/diaryService';
import { HistoryEntryItem } from './components/History';
import { LoadingSpinner, EmptyState } from './components/Shared';
import { BottomNav } from './components/Home';

const HistoryScreen = ({ onNavigate }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [groupedSections, setGroupedSections] = useState([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // 1. GỌI API (Phân tách rõ includeDeleted)
  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await diaryService.getEntries({ 
        includeDeleted: showDeleted ? 'true' : 'false' 
      });
      setEntries(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // 2. NHÓM DỮ LIỆU & TÌM KIẾM
  useEffect(() => {
    const grouped = {};
    const searchLower = searchText.toLowerCase();
    
    entries.filter(e => {
      if (!searchLower) return true;
      return e.title?.toLowerCase().includes(searchLower) || e.content?.toLowerCase().includes(searchLower);
    }).forEach(entry => {
      const date = new Date(entry.date || entry.createdAt);
      const monthKey = date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'long' });
      if (!grouped[monthKey]) grouped[monthKey] = [];
      grouped[monthKey].push(entry);
    });

    const sections = Object.keys(grouped).map(month => ({ title: month, data: grouped[month] }));
    setGroupedSections(sections);
  }, [entries, searchText]);

  // 3. XỬ LÝ XÓA / XÓA VĨNH VIỄN
  const handleDelete = (entry) => {
    const id = entry._id || entry.id;
    const title = showDeleted ? 'Xóa vĩnh viễn?' : 'Xóa bài viết?';
    const msg = showDeleted ? 'Dữ liệu sẽ bị mất hoàn toàn.' : 'Bài viết sẽ được chuyển vào thùng rác.';

    Alert.alert(title, msg, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: showDeleted ? 'Xóa hẳn' : 'Xóa',
        style: 'destructive',
        onPress: async () => {
          await diaryService.deleteEntry(id);
          fetchEntries();
        }
      }
    ]);
  };

  // 4. KHÔI PHỤC
  const handleRestore = async (entry) => {
    await diaryService.restoreEntry(entry._id || entry.id);
    fetchEntries();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, paddingBottom: 60 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity onPress={() => onNavigate('Home')} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={28} color={themeColors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {showDeleted ? 'Thùng rác' : 'Nhật ký của tôi'}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowDeleted(!showDeleted)} 
            style={[styles.trashButton, showDeleted && { backgroundColor: COLORS.primary + '20' }]}
          >
            <MaterialIcons 
              name={showDeleted ? 'history' : 'delete-sweep'} 
              size={24} 
              color={showDeleted ? COLORS.primary : themeColors.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBoxContainer}>
          <View style={[styles.searchBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <MaterialIcons name="search" size={20} color={themeColors.textSecondary} />
            <TextInput 
              placeholder="Tìm kiếm..." 
              value={searchText} 
              onChangeText={setSearchText} 
              style={[styles.searchInput, { color: themeColors.text }]} 
              placeholderTextColor={themeColors.textMuted}
            />
          </View>
        </View>

        {loading ? <LoadingSpinner /> : (
          <SectionList
            sections={groupedSections}
            keyExtractor={item => item._id || item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <HistoryEntryItem
                entry={item}
                onPress={() => !showDeleted && onNavigate('NewEntry', { entryId: item._id || item.id, returnTo: 'History' })}
                themeColors={themeColors}
                isDeleted={showDeleted}
                onDelete={() => handleDelete(item)}
                onRestore={() => handleRestore(item)}
              />
            )}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={[styles.sectionHeader, { color: themeColors.text }]}>{title}</Text>
            )}
            ListEmptyComponent={
              <EmptyState icon={showDeleted ? "delete-outline" : "history"} title={showDeleted ? "Thùng rác trống" : "Không có dữ liệu"} />
            }
          />
        )}
      </SafeAreaView>
      <BottomNav activeScreen="History" onNavigate={onNavigate} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  backButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', textAlign: 'center', fontFamily: FONTS.ui.bold },
  trashButton: { padding: 8, borderRadius: 12 },
  searchBoxContainer: { padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 12, borderWidth: 1, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FONTS.ui.regular },
  list: { padding: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', opacity: 0.5, marginVertical: 8, fontFamily: FONTS.ui.bold }
});

export default HistoryScreen;
