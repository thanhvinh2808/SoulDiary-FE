import { api } from './api';

export const diaryService = {
  // Lấy danh sách nhật ký
  async getDiaries() {
    return await api('/diaries');
  },

  // Tạo nhật ký mới
  async createDiary(title, description = '', coverImage = '') {
    return await api('/diaries', {
      method: 'POST',
      body: JSON.stringify({ title, description, coverImage }),
    });
  },

  // Lấy chi tiết một nhật ký
  async getDiaryById(id) {
    return await api(`/diaries/${id}`);
  },

  // Xóa nhật ký
  async deleteDiary(id) {
    return await api(`/diaries/${id}`, {
      method: 'DELETE',
    });
  },

  // --- ENTRIES ---

  // Lấy danh sách bài viết trong một nhật ký
  async getEntries(diaryId) {
    return await api(`/diaries/${diaryId}/entries`);
  },

  // Tạo bài viết mới
  async createEntry(diaryId, title, content, mood = 'neutral', date = new Date()) {
    return await api(`/diaries/${diaryId}/entries`, {
      method: 'POST',
      body: JSON.stringify({ 
        title, 
        content, 
        mood, 
        date: date.toISOString() 
      }),
    });
  },

  // Lấy chi tiết bài viết
  async getEntryById(diaryId, entryId) {
    return await api(`/diaries/${diaryId}/entries/${entryId}`);
  },

  // Cập nhật bài viết
  async updateEntry(diaryId, entryId, data) {
    return await api(`/diaries/${diaryId}/entries/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Xóa bài viết
  async deleteEntry(diaryId, entryId) {
    return await api(`/diaries/${diaryId}/entries/${entryId}`, {
      method: 'DELETE',
    });
  }
};
