import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, getThemeColors } from './theme';
import { diaryService } from './services/diaryService';
import { useTheme } from './context/ThemeContext';

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
];

const NewEntryScreen = ({ onClose, params }) => {
  const { isDark } = useTheme();
  const themeColors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();
  
  const entryId = params?.entryId;
  const diaryId = params?.diaryId;

  // State
  const [selectedMood, setSelectedMood] = useState('happy');
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Load entry data if editing
  useEffect(() => {
    if (entryId) {
      const loadEntry = async () => {
        setLoadingEntry(true);
        try {
          const entry = await diaryService.getEntryById(entryId); 
          if (entry) {
            setTitle(entry.title || '');
            setEntryText(entry.content || '');
            setSelectedMood(entry.mood || 'neutral');
            setVisibility(entry.visibility || 'private');
            setTags(entry.tags || []);
          }
        } catch (error) {
          console.error('Failed to load entry:', error);
          Alert.alert('Error', 'Failed to load the entry.');
        } finally {
          setLoadingEntry(false);
        }
      };
      loadEntry();
    }
  }, [entryId]);
  
  const handleSave = async () => {
    if (!title.trim() && !entryText.trim()) {
      Alert.alert("Empty Entry", "Please write something!");
      return;
    }

    setLoading(true);
    try {
       const finalTitle = title || "Untitled Entry";
       if (entryId) {
         await diaryService.updateEntry(entryId, {
           title: finalTitle,
           content: entryText,
           mood: selectedMood,
           tags: tags,
           visibility: visibility
         });
         Alert.alert("Success", "Journal updated!");
       } else {
         await diaryService.createEntry(finalTitle, entryText, selectedMood, new Date(), tags);
         Alert.alert("Success", "New Journal created!");
       }
       onClose(); 
    } catch (error) {
       Alert.alert("Error", "Failed to save: " + error.message);
    } finally {
       setLoading(false);
    }
  };

  const handleAddNewTag = () => {
    if (newTagInput.trim()) {
      const cleanTag = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleanTag)) {
        setTags([...tags, cleanTag]);
      }
      setNewTagInput('');
      setShowAddTagModal(false);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose} disabled={loading || loadingEntry}>
            <MaterialIcons name="close" size={24} color={themeColors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              {loadingEntry ? 'Loading...' : entryId ? 'Edit Entry' : 'New Entry'}
            </Text>
            <Text style={[styles.headerDate, { color: themeColors.textMuted }]}>{new Date().toDateString()}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.doneButton]} 
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
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Mood Picker */}
                <View style={styles.moodSection}>
                    <Text style={[styles.sectionLabel, { color: themeColors.textMuted }]}>How are you feeling?</Text>
                    <View style={styles.moodContainer}>
                        {MOODS.map((mood) => {
                            const isSelected = selectedMood === mood.id;
                            return (
                                <TouchableOpacity 
                                    key={mood.id} 
                                    style={styles.moodItem}
                                    onPress={() => setSelectedMood(mood.id)}
                                >
                                    <View style={[
                                        styles.moodIconContainer,
                                        { backgroundColor: themeColors.surface },
                                        isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '15' }
                                    ]}>
                                        <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                                    </View>
                                    <Text style={[styles.moodLabel, isSelected && { color: COLORS.primary }]}>
                                        {mood.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: themeColors.border }]} />

                {/* Title Input */}
                <TextInput
                  style={[styles.titleInput, { color: themeColors.text }]}
                  placeholder="Entry title (optional)"
                  placeholderTextColor={themeColors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  editable={!loading}
                />

                {/* Editor */}
                <View style={styles.editorContainer}>
                  <TextInput
                    style={[styles.editor, { color: themeColors.text }]}
                    placeholder="Dear Diary, how was your day?"
                    placeholderTextColor={themeColors.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={entryText}
                    onChangeText={setEntryText}
                    editable={!loading}
                  />
                </View>

                {/* Tags */}
                <View style={styles.tagsSection}>
                    <View style={styles.tagsHeader}>
                        <MaterialIcons name="local-offer" size={20} color={themeColors.textMuted} />
                        <Text style={[styles.tagsTitle, { color: themeColors.textSecondary }]}>Tags</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsList}>
                        {tags.map((tag, index) => (
                            <TouchableOpacity key={index} style={[styles.tag, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]} onPress={() => removeTag(tag)}>
                                <Text style={[styles.tagText, { color: themeColors.textSecondary }]}>#{tag}</Text>
                                <MaterialIcons name="close" size={14} color={themeColors.textMuted} />
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity style={[styles.tagAdd, { borderColor: themeColors.border }]} onPress={() => setShowAddTagModal(true)}>
                            <MaterialIcons name="add" size={16} color={themeColors.textSecondary} />
                            <Text style={[styles.tagText, { color: themeColors.textSecondary }]}>Add Tag</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>

        {/* Add Tag Modal */}
        <Modal visible={showAddTagModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>Add New Tag</Text>
              <TextInput
                style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border }]}
                placeholder="Enter tag name"
                placeholderTextColor={themeColors.textMuted}
                value={newTagInput}
                onChangeText={setNewTagInput}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={() => setShowAddTagModal(false)} style={styles.modalButton}><Text style={{ color: themeColors.textMuted }}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity onPress={handleAddNewTag} style={[styles.modalButton, { backgroundColor: COLORS.primary, borderRadius: 8 }]}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Add</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerDate: { fontSize: 10, textTransform: 'uppercase' },
  doneButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', textAlign: 'center', marginBottom: 16 },
  moodSection: { marginBottom: 16 },
  moodContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  moodItem: { alignItems: 'center', width: 56 },
  moodIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  moodEmoji: { fontSize: 24 },
  moodLabel: { fontSize: 10, fontWeight: '600', marginTop: 4 },
  divider: { height: 1, marginVertical: 16 },
  titleInput: { fontSize: 24, fontWeight: '700', marginBottom: 12, padding: 0 },
  editorContainer: { minHeight: 200 },
  editor: { fontSize: 16, lineHeight: 24, padding: 0, textAlignVertical: 'top' },
  tagsSection: { marginTop: 24 },
  tagsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  tagsTitle: { fontSize: 14, fontWeight: '600' },
  tagsList: { flexDirection: 'row', gap: 8 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 4 },
  tagAdd: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', gap: 4 },
  tagText: { fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '80%', padding: 24, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 20 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
  modalButton: { padding: 8 }
});

export default NewEntryScreen;