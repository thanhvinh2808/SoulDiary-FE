import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS } from './theme';
import { diaryService } from './services/diaryService';

const { width } = Dimensions.get('window');

const ManageDiariesScreen = ({ onClose, onSelectDiary }) => {
  const insets = useSafeAreaInsets();
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiaryName, setNewDiaryName] = useState('');
  const [newDiaryDesc, setNewDiaryDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchDiaries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await diaryService.getDiaries();
      setDiaries(Array.isArray(data) ? data : []);
      console.log('📚 Diaries fetched:', data);
    } catch (error) {
      console.error('Failed to fetch diaries:', error);
      Alert.alert('Error', 'Failed to load diaries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiaries();
  }, [fetchDiaries]);

  const handleCreateDiary = async () => {
    if (!newDiaryName.trim()) {
      Alert.alert('Error', 'Please enter a diary name');
      return;
    }

    setCreating(true);
    try {
      const newDiary = await diaryService.createDiary(
        newDiaryName.trim(),
        newDiaryDesc.trim() || 'New journal',
        'Diary created'
      );
      console.log('✅ Diary created:', newDiary);
      setDiaries([...diaries, newDiary]);
      setNewDiaryName('');
      setNewDiaryDesc('');
      setShowCreateModal(false);
      Alert.alert('Success', 'Diary created successfully!');
    } catch (error) {
      console.error('Failed to create diary:', error);
      Alert.alert('Error', error.message || 'Failed to create diary');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateDiary = async (id) => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Please enter a diary name');
      return;
    }

    try {
      await diaryService.updateDiary(id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      
      setDiaries(diaries.map(d => 
        (d.id === id || d._id === id) 
          ? { ...d, name: editName.trim(), description: editDesc.trim() }
          : d
      ));
      setEditingId(null);
      Alert.alert('Success', 'Diary updated successfully!');
    } catch (error) {
      console.error('Failed to update diary:', error);
      Alert.alert('Error', error.message || 'Failed to update diary');
    }
  };

  const handleDeleteDiary = (id, name) => {
    Alert.alert(
      'Delete Diary',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await diaryService.deleteDiary(id);
              setDiaries(diaries.filter(d => (d.id !== id && d._id !== id)));
              Alert.alert('Success', 'Diary deleted successfully!');
            } catch (error) {
              console.error('Failed to delete diary:', error);
              Alert.alert('Error', error.message || 'Failed to delete diary');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSelectDiary = (diary) => {
    if (onSelectDiary) {
      onSelectDiary(diary);
    }
    onClose();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'top']}>
        
        {/* Header */}
        <View style={[styles.header, { paddingLeft: insets.left, paddingRight: insets.right }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <MaterialIcons name="arrow-back" size={28} color="#111811" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Diaries</Text>
          <TouchableOpacity onPress={() => setShowCreateModal(true)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <MaterialIcons name="add" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Diaries List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : diaries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="library-books" size={64} color="#D4A574" />
              <Text style={styles.emptyText}>No diaries yet</Text>
              <Text style={styles.emptySubtext}>Create your first diary to get started</Text>
            </View>
          ) : (
            diaries.map((diary) => (
              <TouchableOpacity
                key={diary.id || diary._id}
                style={styles.diaryCard}
                onPress={() => handleSelectDiary(diary)}
                activeOpacity={0.7}
              >
                {editingId === (diary.id || diary._id) ? (
                  <View style={styles.editForm}>
                    <TextInput
                      style={styles.editInput}
                      placeholder="Diary name"
                      value={editName}
                      onChangeText={setEditName}
                      placeholderTextColor="#A8A29E"
                    />
                    <TextInput
                      style={[styles.editInput, { marginTop: 8 }]}
                      placeholder="Description"
                      value={editDesc}
                      onChangeText={setEditDesc}
                      placeholderTextColor="#A8A29E"
                      multiline
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: COLORS.primary }]}
                        onPress={() => handleUpdateDiary(diary.id || diary._id)}
                      >
                        <Text style={styles.editButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editButton, { backgroundColor: '#E5E5E5' }]}
                        onPress={() => setEditingId(null)}
                      >
                        <Text style={[styles.editButtonText, { color: '#111811' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <View style={styles.diaryInfo}>
                      <MaterialIcons name="library-books" size={32} color={COLORS.primary} />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.diaryName}>{diary.name || 'Untitled'}</Text>
                        <Text style={styles.diaryDesc} numberOfLines={1}>
                          {diary.description || 'No description'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.diaryActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingId(diary.id || diary._id);
                          setEditName(diary.name || '');
                          setEditDesc(diary.description || '');
                        }}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <MaterialIcons name="edit" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteDiary(diary.id || diary._id, diary.name)}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                      >
                        <MaterialIcons name="delete" size={20} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Create Diary Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Diary</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Diary name"
                value={newDiaryName}
                onChangeText={setNewDiaryName}
                placeholderTextColor="#A8A29E"
              />
              
              <TextInput
                style={[styles.modalInput, { marginTop: 12, minHeight: 80 }]}
                placeholder="Description (optional)"
                value={newDiaryDesc}
                onChangeText={setNewDiaryDesc}
                placeholderTextColor="#A8A29E"
                multiline
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#E5E5E5' }]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: '#111811' }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleCreateDiary}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Create</Text>
                  )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 8,
  },
  diaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diaryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  diaryName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#111811',
  },
  diaryDesc: {
    fontSize: 12,
    fontFamily: 'Manrope_400Regular',
    color: '#A8A29E',
    marginTop: 4,
  },
  diaryActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 12,
  },
  editForm: {
    flex: 1,
  },
  editInput: {
    backgroundColor: '#F5F3F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#111811',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Manrope_700Bold',
    color: '#111811',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#F5F3F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Manrope_400Regular',
    color: '#111811',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Manrope_600SemiBold',
    color: '#FFF',
  },
});

export default ManageDiariesScreen;
