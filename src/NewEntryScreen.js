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
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const NewEntryScreen = ({ onClose, diaryId, entryId }) => {
  const insets = useSafeAreaInsets();
  const [selectedMood, setSelectedMood] = useState('happy');
  const [title, setTitle] = useState('');
  const [entryText, setEntryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [visibility, setVisibility] = useState('private');

  // Load entry data if entryId is provided
  useEffect(() => {
    if (entryId) {
      const loadEntry = async () => {
        setLoading(true);
        try {
          // Pass only entryId
          const entry = await diaryService.getEntryById(entryId); 
          if (entry) {
            setTitle(entry.title || '');
            setEntryText(entry.content || '');
            setSelectedMood(entry.mood || 'neutral');
            setVisibility(entry.visibility || 'private');
          }
        } catch (error) {
          console.error('Failed to load entry:', error);
          Alert.alert('Error', 'Failed to load the entry for editing.');
        } finally {
          setLoading(false);
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
       const tags = []; // Logic tags có thể thêm sau

       if (entryId) {
         // Update existing entry (Journal)
         await diaryService.updateEntry(entryId, {
           title: finalTitle,
           content: entryText,
           mood: selectedMood,
           // visibility // Backend chưa hỗ trợ trong swagger
         });
         Alert.alert("Success", "Journal updated successfully!");
       } else {
         // Create new entry (Journal)
         // Signature: (title, content, mood, date, tags)
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

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight }, // #FDFBF7
    textPrimary: { color: '#111811' }, // Dark text
    textSecondary: { color: '#9CA3AF' }, // Gray text
    moodBg: '#FFFFFF',
    tagBg: '#F3F4F6',
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={[styles.safeArea, { paddingTop: 0 }]} edges={['left', 'right', 'bottom']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top, paddingLeft: insets.left, paddingRight: insets.right }]}>
            <TouchableOpacity style={styles.iconButton} onPress={onClose} disabled={loading}>
                <MaterialIcons name="close" size={24} color="#4B5563" />
            </TouchableOpacity>
            
            <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>New Diary</Text>
                <Text style={styles.headerDate}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
            </View>
            
            <TouchableOpacity style={styles.doneButton} onPress={handleSave} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <Text style={styles.doneButtonText}>Done</Text>
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
                
                {/* Mood Picker */}
                <View style={styles.moodSection}>
                    <Text style={styles.sectionLabel}>How are you feeling?</Text>
                    <View style={styles.moodContainer}>
                        {MOODS.map((mood) => {
                            const isSelected = selectedMood === mood.id;
                            return (
                                <TouchableOpacity 
                                    key={mood.id} 
                                    style={styles.moodItem}
                                    onPress={() => setSelectedMood(mood.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.moodIconContainer,
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

                {/* Editor Inputs */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.titleInput}
                        placeholder="Title of your entry..."
                        placeholderTextColor="#D1D5DB" // Gray-300
                        value={title}
                        onChangeText={setTitle}
                    />
                    
                    <TextInput
                        style={styles.contentInput}
                        placeholder="Dear Diary, how was your day?"
                        placeholderTextColor="#D1D5DB" // Gray-300
                        multiline
                        textAlignVertical="top"
                        value={entryText}
                        onChangeText={setEntryText}
                        scrollEnabled={false} // Allow ScrollView to handle scrolling
                    />
                </View>

                {/* Footer Section */}
                <View style={styles.footer}>
                    
                    {/* Tags */}
                    <View style={styles.tagsRow}>
                        <MaterialIcons name="local-offer" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <TouchableOpacity style={styles.tagActive}>
                                <Text style={styles.tagTextActive}>#reflection</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tag}>
                                <Text style={styles.tagText}>#morning</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tagAdd}>
                                <MaterialIcons name="add" size={16} color="#4B5563" />
                                <Text style={styles.tagText}>Add tag</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>

                    {/* Saving Status */}
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Saving...</Text>
                    </View>

                    {/* Visibility Section */}
                    <View style={styles.visibilitySection}>
                        <Text style={styles.sectionLabel}>ENTRY VISIBILITY</Text>
                        <View style={styles.visibilityOptions}>
                            <TouchableOpacity 
                                style={[
                                    styles.visibilityBtn, 
                                    visibility === 'private' && styles.visibilityBtnActive
                                ]}
                                onPress={() => setVisibility('private')}
                            >
                                <MaterialIcons 
                                    name="lock" 
                                    size={18} 
                                    color={visibility === 'private' ? '#FFFFFF' : '#4B5563'} 
                                />
                                <Text style={[
                                    styles.visibilityText,
                                    visibility === 'private' && { color: '#FFFFFF' }
                                ]}>Private</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={[
                                    styles.visibilityBtn, 
                                    visibility === 'public' && styles.visibilityBtnActive
                                ]}
                                onPress={() => setVisibility('public')}
                            >
                                <MaterialIcons 
                                    name="public" 
                                    size={18} 
                                    color={visibility === 'public' ? '#FFFFFF' : '#4B5563'} 
                                />
                                <Text style={[
                                    styles.visibilityText,
                                    visibility === 'public' && { color: '#FFFFFF' }
                                ]}>Public</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </View>

            </ScrollView>
        </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(229, 231, 235, 0.5)', // Gray-200/50
    backgroundColor: 'rgba(253, 251, 247, 0.8)', // bg-light/80
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111811',
    fontFamily: 'Manrope_700Bold',
  },
  headerDate: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF', // Gray-400
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Manrope_500Medium',
  },
  doneButton: {
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF', // Gray-400
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Manrope_700Bold',
  },
  moodSection: {
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'center', // Changed to center for better spacing with max-w
    gap: 12, // Space between items
  },
  moodItem: {
    alignItems: 'center',
    width: 56, // Fixed width for alignment
  },
  moodIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
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
    fontWeight: '600',
    color: '#9CA3AF',
    fontFamily: 'Manrope_600SemiBold',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6', // Gray-100
    marginVertical: 16,
  },
  inputContainer: {
    flex: 1,
    minHeight: 300,
  },
  titleInput: {
    fontSize: 30, // text-3xl
    fontWeight: '600',
    color: '#1F2937', // Gray-800
    fontFamily: 'Lora_600SemiBold', // Serif Font for Title
    marginBottom: 16,
    padding: 0,
  },
  contentInput: {
    fontSize: 18, // text-lg
    color: '#1F2937', // Gray-800
    fontFamily: 'Manrope_400Regular',
    lineHeight: 28,
    padding: 0,
    minHeight: 200,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 16,
    gap: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagActive: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(25, 230, 25, 0.1)', // primary/10
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 25, 0.2)',
  },
  tagTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: 'Manrope_700Bold',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6', // Gray-100
  },
  tagAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB', // Gray-300
    borderStyle: 'dashed',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563', // Gray-600
    fontFamily: 'Manrope_500Medium',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(25, 230, 25, 0.4)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    fontFamily: 'Manrope_500Medium',
  },
  visibilitySection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(243, 244, 246, 0.5)', // Gray-100/50
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB', // Gray-200
  },
  visibilityBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563', // Gray-600
    fontFamily: 'Manrope_700Bold',
  }
});

export default NewEntryScreen;