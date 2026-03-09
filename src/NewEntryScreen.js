import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
];

const NewEntryScreen = ({ onClose, route, ...props }) => {
  const insets = useSafeAreaInsets();
  // Handle diaryId and entryId from both route params and direct props
  const initialDiaryId = props.diaryId || route?.params?.diaryId;
  const entryId = props.entryId || route?.params?.entryId;
  
  console.log('📱 NewEntryScreen mounted with:', { initialDiaryId, entryId, propsKeys: Object.keys(props) });
  
  const [diaryId, setDiaryId] = useState(initialDiaryId);
  const [selectedMood, setSelectedMood] = useState('happy');
  const [entryText, setEntryText] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  
  // Tags state - organized by category
  const [selectedTags, setSelectedTags] = useState([]);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [expandedTagCategories, setExpandedTagCategories] = useState({
    development: false,
    wellness: false,
    relationships: false,
    work: false,
    creative: false,
    time: false,
  });
  
  const tagCategories = {
    development: {
      label: 'Personal Development',
      tags: ['personal', 'growth', 'achievement', 'challenge', 'success', 'reflection']
    },
    wellness: {
      label: 'Emotional & Wellness',
      tags: ['healing', 'health', 'self-care', 'gratitude']
    },
    relationships: {
      label: 'Relationships',
      tags: ['relationships', 'family']
    },
    work: {
      label: 'Work & Career',
      tags: ['work', 'career']
    },
    creative: {
      label: 'Creative',
      tags: ['creative']
    },
    time: {
      label: 'Time of Day',
      tags: ['morning', 'evening']
    }
  };

  const getAllAvailableTags = () => {
    return Object.values(tagCategories).flatMap(cat => cat.tags);
  };

  // Initialize diaryId if not provided
  useEffect(() => {
    if (!diaryId) {
      const initializeDiary = async () => {
        try {
          console.log('⚠️ No diaryId provided, initializing diary...');
          const diaries = await diaryService.getDiaries();
          
          if (diaries && diaries.length > 0) {
            console.log('✅ Using existing diary:', diaries[0]._id);
            setDiaryId(diaries[0]._id || diaries[0].id);
          } else {
            console.log('📝 Creating new default diary...');
            const newDiary = await diaryService.createDiary(
              "My Journal", 
              "Your journey begins here"
            );
            const diary = newDiary?.data || newDiary;
            const createdId = diary?._id || diary?.id;
            console.log('✅ New diary created:', createdId);
            setDiaryId(createdId);
          }
        } catch (error) {
          console.error('❌ Failed to initialize diary:', error);
          Alert.alert('Error', 'Could not initialize diary: ' + error.message);
        }
      };
      initializeDiary();
    }
  }, []);

  // Load entry data if diaryId and entryId are provided
  useEffect(() => {
    if (diaryId && entryId) {
      const loadEntry = async () => {
        setLoadingEntry(true);
        try {
          console.log('📋 Loading entry:', { diaryId, entryId });
          const entry = await diaryService.getEntryById(diaryId, entryId);
          console.log('✅ Entry loaded:', entry);
          if (entry) {
            setTitle(entry.title || '');
            setEntryText(entry.content || '');
            setSelectedMood(entry.mood || 'neutral');
            setSelectedTags(entry.tags || []);
          }
        } catch (error) {
          console.error('⚠️ Failed to load entry:', error.message);
          // Don't show alert - just continue with empty editor
          // This allows editing entries even if they can't be loaded
          console.warn('📝 Opening empty editor instead');
        } finally {
          setLoadingEntry(false);
        }
      };
      loadEntry();
    }
  }, [diaryId, entryId]);
  
  const handleSave = async () => {
    if (!diaryId) {
      console.error('❌ No diary selected');
      Alert.alert("Error", "No Diary Selected");
      return;
    }
    if (!entryText.trim()) {
      Alert.alert("Empty Entry", "Please write something!");
      return;
    }

    setLoading(true);
    try {
      // Auto-generate title from first line if not provided
      const finalTitle = title.trim() || entryText.split('\n')[0].substring(0, 50);
      
      console.log('💾 Saving entry:', { diaryId, entryId, title: finalTitle, mood: selectedMood, tags: selectedTags });
      
      if (entryId) {
        // Update existing entry
        const result = await diaryService.updateEntry(diaryId, entryId, {
          title: finalTitle,
          content: entryText,
          mood: selectedMood,
          tags: selectedTags
        });
        console.log('✅ Entry updated:', result);
        Alert.alert("Success", "Entry updated successfully!");
      } else {
        // Create new entry
        const result = await diaryService.createEntry(diaryId, finalTitle, entryText, selectedMood, selectedTags);
        console.log('✅ Entry created:', result);
        Alert.alert("Success", "Entry saved successfully!");
      }
      onClose();
    } catch (error) {
      console.error('❌ Save failed:', error);
      Alert.alert("Error", "Failed to save entry: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Tag management handlers
  const toggleTag = (tag) => {
    console.log(`🏷️ Toggle tag: ${tag}`);
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddNewTag = () => {
    if (!newTagInput.trim()) {
      Alert.alert('Empty Tag', 'Please enter a tag name');
      return;
    }

    const tagName = newTagInput.trim().toLowerCase();
    
    // Check if tag already exists
    if (availableTags.includes(tagName)) {
      Alert.alert('Tag Exists', 'This tag already exists');
      setNewTagInput('');
      return;
    }

    // Add new tag to available tags
    console.log(`➕ Adding new tag: ${tagName}`);
    setAvailableTags(prev => [...prev, tagName]);
    setSelectedTags(prev => [...prev, tagName]);
    setNewTagInput('');
    setShowAddTagModal(false);
  };

  const removeSelectedTag = (tag) => {
    console.log(`❌ Remove tag: ${tag}`);
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  // Styles động (dù hiện tại chỉ dùng Light Mode, giữ cấu trúc này để dễ mở rộng)
  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: COLORS.textMain },
    textSecondary: { color: COLORS.textGray },
    moodBg: '#FFFFFF',
    tagBg: '#F3F4F6',
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading || loadingEntry}>
            <MaterialIcons name="close" size={24} color={COLORS.textGray} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: COLORS.textMain }]}>
              {loadingEntry ? 'Loading...' : entryId ? 'Edit Entry' : 'New Entry'}
            </Text>
            <Text style={styles.headerDate}>{new Date().toDateString()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.doneButton, (loading || loadingEntry) && styles.doneButtonDisabled]} 
            onPress={handleSave} 
            disabled={loading || loadingEntry}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.doneButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
        >
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                
            {loadingEntry ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : (
              <>
                {/* Mood Picker */}
                <View style={styles.moodSection}>
                  <Text style={styles.moodTitle}>HOW ARE YOU FEELING?</Text>
                  <View style={styles.moodContainer}>
                    {MOODS.map((mood) => {
                      const isSelected = selectedMood === mood.id;
                      return (
                        <TouchableOpacity 
                          key={mood.id} 
                          style={styles.moodItem}
                          onPress={() => setSelectedMood(mood.id)}
                          disabled={loading}
                          activeOpacity={0.7}
                        >
                          <View style={[
                            styles.moodIconContainer,
                            { backgroundColor: themeStyles.moodBg },
                            isSelected && styles.moodIconSelected
                          ]}>
                            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                          </View>
                          <Text style={[
                            styles.moodLabel, 
                            isSelected && { color: COLORS.primary }
                          ]}>
                            {mood.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Title Input */}
                <TextInput
                  style={[styles.titleInput, { color: COLORS.textMain }]}
                  placeholder="Entry title (optional)"
                  placeholderTextColor="#9CA3AF"
                  value={title}
                  onChangeText={setTitle}
                  editable={!loading}
                />

                {/* Editor */}
                <View style={styles.editorContainer}>
                  <TextInput
                    style={[styles.editor, { color: COLORS.textMain }]}
                    placeholder="Dear Diary, how was your day?"
                    placeholderTextColor="#D1D5DB"
                    multiline
                    textAlignVertical="top"
                    value={entryText}
                    onChangeText={setEntryText}
                    editable={!loading}
                    scrollEnabled={true}
                  />
                </View>
              </>
            )}

                {/* Footer / Tags */}
                <View style={styles.footer}>
                    <Text style={styles.tagsLabel}>TAGS</Text>
                    <View style={styles.selectedTagsContainer}>
                      {selectedTags.length > 0 ? (
                        selectedTags.map(tag => (
                          <TouchableOpacity 
                            key={tag}
                            style={styles.selectedTag}
                            onPress={() => removeSelectedTag(tag)}
                          >
                            <Text style={styles.selectedTagText}>#{tag}</Text>
                            <MaterialIcons name="close" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noTagsText}>No tags selected</Text>
                      )}
                    </View>

                    <Text style={styles.availableTagsLabel}>AVAILABLE TAGS</Text>
                    <View style={styles.tagsContainer}>
                      {Object.entries(tagCategories).map(([categoryKey, category]) => (
                        <View key={categoryKey} style={styles.tagCategory}>
                          <TouchableOpacity 
                            style={styles.tagCategoryHeader}
                            onPress={() => setExpandedTagCategories(prev => ({
                              ...prev,
                              [categoryKey]: !prev[categoryKey]
                            }))}
                          >
                            <MaterialIcons 
                              name={expandedTagCategories[categoryKey] ? 'expand-less' : 'expand-more'} 
                              size={20} 
                              color={COLORS.primary} 
                            />
                            <Text style={styles.tagCategoryTitle}>{category.label}</Text>
                          </TouchableOpacity>
                          {expandedTagCategories[categoryKey] && (
                            <View style={styles.tagCategoryContent}>
                              {category.tags.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                return (
                                  <TouchableOpacity 
                                    key={tag}
                                    style={[
                                      styles.tag,
                                      isSelected && styles.tagSelected,
                                      { backgroundColor: isSelected ? 'rgba(25, 230, 25, 0.1)' : themeStyles.tagBg }
                                    ]}
                                    onPress={() => toggleTag(tag)}
                                  >
                                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>#{tag}</Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      ))}
                      <TouchableOpacity 
                        style={styles.tagAddButton}
                        onPress={() => setShowAddTagModal(true)}
                      >
                        <MaterialIcons name="add" size={18} color={COLORS.primary} />
                        <Text style={styles.tagAddButtonText}>Add Custom Tag</Text>
                      </TouchableOpacity>
                    </View>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>

        {/* Add Tag Modal */}
        <Modal
          visible={showAddTagModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAddTagModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Tag</Text>
                <TouchableOpacity onPress={() => setShowAddTagModal(false)}>
                  <MaterialIcons name="close" size={24} color={COLORS.textGray} />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.modalInput}
                placeholder="Enter tag name (e.g., motivation)"
                placeholderTextColor="#9CA3AF"
                value={newTagInput}
                onChangeText={setNewTagInput}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddTagModal(false);
                    setNewTagInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddNewTag}
                >
                  <Text style={styles.confirmButtonText}>Add Tag</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'transparent',
    gap: 12,
  },
  closeButton: {
    minWidth: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
  },
  headerDate: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Manrope_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  doneButton: {
    minWidth: 50,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: 'Manrope_700Bold',
  },
  titleInput: {
    fontSize: 18,
    fontFamily: 'Manrope_700Bold',
    paddingHorizontal: 0,
    paddingVertical: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  moodSection: {
    marginBottom: 16,
  },
  moodTitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  moodItem: {
    alignItems: 'center',
    gap: 8,
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  moodIconSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
  },
  moodEmoji: {
    fontSize: 24,
  },
  moodLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Manrope_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  editorContainer: {
    flex: 1,
    minHeight: 300, // Đảm bảo chiều cao tối thiểu cho Web
  },
  editor: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Manrope_400Regular',
    lineHeight: 28,
    textAlignVertical: 'top',
    padding: 0,
    minHeight: 200,
  },
  footer: {
    marginTop: 24,
  },
  tagsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    minHeight: 40,
    alignContent: 'center',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 25, 0.3)',
  },
  selectedTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  noTagsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Manrope_400Regular',
  },
  availableTagsLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Manrope_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'column',
    marginBottom: 16,
    gap: 0,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagSelected: {
    borderColor: 'rgba(25, 230, 25, 0.3)',
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'Manrope_500Medium',
  },
  tagTextSelected: {
    color: COLORS.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  tagAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    gap: 4,
  },
  tagCategory: {
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 8,
    backgroundColor: '#F3F4F6',
  },
  tagCategoryTitle: {
    fontSize: 13,
    fontFamily: 'Manrope_600SemiBold',
    color: COLORS.textMain,
    flex: 1,
  },
  tagCategoryContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 8,
  },
  tagAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    gap: 4,
    marginTop: 8,
  },
  tagAddButtonText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: 'Manrope_600SemiBold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
    fontFamily: 'Manrope_700Bold',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: COLORS.textMain,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textGray,
    fontFamily: 'Manrope_600SemiBold',
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111811',
    fontFamily: 'Manrope_700Bold',
  },
  autosaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 16,
  },
  autosaveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(25, 230, 25, 0.4)',
  },
  autosaveText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'Manrope_500Medium',
    letterSpacing: 0.5,
  },
});

export default NewEntryScreen;