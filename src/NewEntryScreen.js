import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

const MOODS = [
  { id: 'happy', emoji: '😊', label: 'Happy' },
  { id: 'neutral', emoji: '😐', label: 'Neutral' },
  { id: 'sad', emoji: '😔', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'anxious', emoji: '😰', label: 'Anxious' },
];

const NewEntryScreen = ({ onClose }) => {
  const [selectedMood, setSelectedMood] = useState('happy');
  const [entryText, setEntryText] = useState('');

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
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <MaterialIcons name="close" size={24} color={COLORS.textGray} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: COLORS.textMain }]}>New Entry</Text>
                <Text style={styles.headerDate}>OCTOBER 24, 2023</Text>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                <Text style={styles.doneButtonText}>Done</Text>
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
                    <Text style={styles.moodTitle}>HOW ARE YOU FEELING?</Text>
                    <View style={styles.moodContainer}>
                        {MOODS.map((mood) => {
                            const isSelected = selectedMood === mood.id;
                            return (
                                <TouchableOpacity 
                                    key={mood.id} 
                                    style={styles.moodItem}
                                    onPress={() => setSelectedMood(mood.id)}
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
                        scrollEnabled={true}
                    />
                </View>

                {/* Footer / Tags */}
                <View style={styles.footer}>
                    <View style={styles.tagsContainer}>
                        <MaterialIcons name="label" size={20} color={COLORS.textGray} style={{ marginRight: 8 }} />
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            <TouchableOpacity style={styles.tagActive}>
                                <Text style={styles.tagTextActive}>#reflection</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.tag, { backgroundColor: themeStyles.tagBg }]}>
                                <Text style={styles.tagText}>#morning</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tagAdd}>
                                <MaterialIcons name="add" size={14} color={COLORS.textGray} />
                                <Text style={styles.tagText}>Add tag</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                    
                    {/* Autosave Indicator */}
                    <View style={styles.autosaveContainer}>
                        <View style={styles.autosaveDot} />
                        <Text style={styles.autosaveText}>Saving...</Text>
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
    borderBottomColor: 'rgba(229, 231, 235, 0.5)',
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
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
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: 'Manrope_700Bold',
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
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  tagActive: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(25, 230, 25, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(25, 230, 25, 0.2)',
  },
  tagAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    gap: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: 'Manrope_500Medium',
  },
  tagTextActive: {
    fontSize: 12,
    color: COLORS.primary,
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