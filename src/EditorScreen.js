import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  ScrollView // Thêm ScrollView để input body có thể cuộn được tốt hơn
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';

const EditorScreen = ({ onClose }) => {
  // FORCE LIGHT MODE
  const isDark = false; 

  const themeStyles = {
    container: { backgroundColor: COLORS.backgroundLight },
    textPrimary: { color: '#333333' },
    textSecondary: { color: '#6B7280' }, // Gray-500
    placeholder: '#D1D5DB', // Gray-300
    toolbarBg: 'rgba(255, 255, 255, 0.9)', // Tăng opacity cho dễ nhìn
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* Main Content Constraint Container */}
        <View style={styles.contentContainer}>
            
            {/* Header / Auto-save Status */}
            <View style={styles.header}>
                <View style={styles.statusContainer}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>LAST SAVED: 2 MINS AGO</Text>
                </View>
            </View>

            {/* Editor Area */}
            <View style={styles.editorWrapper}>
                <TextInput
                    style={styles.titleInput}
                    placeholder="Title of your entry..."
                    placeholderTextColor={themeStyles.placeholder}
                    multiline={false}
                />
                <TextInput
                    style={styles.bodyInput}
                    placeholder="Start writing..."
                    placeholderTextColor={themeStyles.placeholder}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={true} // Cho phép cuộn nội dung
                />
            </View>

        </View>

        {/* Floating Toolbar */}
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.toolbarWrapper}
            keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
        >
            <View style={[styles.toolbar, { backgroundColor: themeStyles.toolbarBg }]}>
                {/* Format Group */}
                <View style={styles.toolGroup}>
                    <TouchableOpacity style={styles.toolButton}>
                        <MaterialIcons name="format-bold" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <MaterialIcons name="format-italic" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                {/* Insert Group */}
                <View style={styles.toolGroup}>
                    <TouchableOpacity style={styles.toolButton}>
                        <MaterialIcons name="mood" size={24} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.toolButton}>
                        <MaterialIcons name="label" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                <View style={styles.separator} />

                {/* Action */}
                <TouchableOpacity style={styles.doneButton} onPress={onClose}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 672, // max-w-2xl equivalent
    paddingHorizontal: 32, // px-8
    alignSelf: 'center', // Căn giữa nội dung trên màn hình lớn
  },
  header: {
    paddingTop: 48, // pt-12
    paddingBottom: 16, // pb-4
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF', // Gray-400
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280', // Gray-500
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Manrope_500Medium' : 'sans-serif',
    textTransform: 'uppercase',
  },
  editorWrapper: {
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Lora_400Regular' : 'serif', // Fallback font
    color: '#111811',
    marginBottom: 16,
    padding: 0,
  },
  bodyInput: {
    flex: 1,
    fontSize: 18, // text-lg
    lineHeight: 28, // leading-relaxed
    fontFamily: Platform.OS === 'ios' ? 'Lora_400Regular' : 'serif', // Fallback font
    color: '#374151', // Gray-700
    padding: 0,
    marginBottom: 100, // Space for toolbar
  },
  toolbarWrapper: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999, // full
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)', // border-gray-200/50
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, // shadow-2xl equivalent ish
    shadowRadius: 20,
    elevation: 10,
    gap: 16,
    // Backdrop Blur workaround for native (Web handles styling differently)
    ...Platform.select({
        web: {
            backdropFilter: 'blur(12px)',
        },
    })
  },
  toolGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB', // Gray-200
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  doneText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Manrope_700Bold' : 'sans-serif',
    letterSpacing: 0.5,
  },
});

export default EditorScreen;