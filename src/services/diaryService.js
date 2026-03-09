import { api } from './api';

export const diaryService = {
  // Lấy danh sách nhật ký
  async getDiaries() {
    const response = await api('/journals');
    console.log('📚 getDiaries response:', response);
    // API returns { data: { journals: [], pagination: {} }, status: "success" }
    return response?.data?.journals || [];
  },

  // Tạo nhật ký mới
  async createDiary(title, content = '', description = '', coverImage = '') {
    const response = await api('/journals', {
      method: 'POST',
      body: JSON.stringify({ title, content, description, coverImage }),
    });
    return response?.data || response;
  },

  // Lấy chi tiết một nhật ký
  async getDiaryById(id) {
    const response = await api(`/journals?id=${id}`);
    return response?.data || response;
  },

  // Xóa nhật ký
  async deleteDiary(id) {
    const response = await api(`/journals?id=${id}`, {
      method: 'DELETE',
    });
    return response?.data || response;
  },

  // --- ENTRIES ---

  // Lấy danh sách bài viết trong một nhật ký
  async getEntries(diaryId, includeDeleted = false) {
    const deletedParam = includeDeleted ? '?includeDeleted=true' : '';
    const response = await api(`/journals${deletedParam}`);
    console.log(`📝 getEntries response (includeDeleted=${includeDeleted}):`, response);
    // API returns { data: { journals: [...], pagination: {} }, status: "success" }
    // Note: diaryId parameter is ignored since backend returns all entries for user
    return response?.data?.journals || [];
  },

  // Tạo bài viết mới
  async createEntry(diaryId, title, content, mood = 'neutral', tags = [], date = new Date()) {
    const response = await api(`/journals`, {
      method: 'POST',
      body: JSON.stringify({ 
        title, 
        content, 
        mood,
        tags: Array.isArray(tags) ? tags : [],
        entryDate: date.toISOString() 
      }),
    });
    return response?.data || response;
  },

  // Lấy chi tiết bài viết
  async getEntryById(diaryId, entryId) {
    // Use entryId directly for journal lookup
    const journalId = entryId || diaryId;
    
    const response = await api(`/journals?id=${journalId}`);
    console.log('📖 getEntryById response for journal', journalId, ':', response);
    
    // The journal might be nested in response?.data?.journal
    const data = response?.data?.journal || response?.data;
    
    if (!data) {
      console.log('⚠️ No data returned from getEntryById');
      return null;
    }
    
    // The data should be the journal object directly
    if (typeof data === 'object' && (data.title !== undefined || data.content !== undefined)) {
      console.log('✅ Journal/entry loaded:', data);
      return data;
    }
    
    console.log('⚠️ Unexpected response format for getEntryById, data:', data);
    return null;
  },

  // Cập nhật bài viết
  async updateEntry(diaryId, entryId, data) {
    // Use the entry ID for update with query parameter
    const journalId = entryId || diaryId;
    const response = await api(`/journals?id=${journalId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    console.log('✏️ updateEntry response:', response);
    return response?.data || response;
  },

  // Xóa bài viết
  async deleteEntry(diaryId, entryId) {
    // Use the entry ID for deletion with query parameter
    const journalId = entryId || diaryId;
    const response = await api(`/journals?id=${journalId}`, {
      method: 'DELETE',
    });
    console.log('🗑️ deleteEntry response:', response);
    return response?.data || response;
  },

  // Restore a soft-deleted entry
  async restoreEntry(diaryId, entryId) {
    // Use the entry ID for the restore endpoint via query parameter
    const journalIdToRestore = entryId || diaryId;
    const response = await api(`/journals?id=${journalIdToRestore}&action=restore`, {
      method: 'PATCH',
    });
    console.log('♻️ restoreEntry response:', response);
    return response?.data || response;
  }
};
