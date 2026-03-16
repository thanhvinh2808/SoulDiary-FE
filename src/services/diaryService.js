import { api } from './api';

const unwrapData = (response) => {
  if (response && response.data) {
    if (response.data.journals) return response.data.journals;
    if (response.data.journal) return response.data.journal;
    return response.data;
  }
  return response;
};

export const diaryService = {
  // Lấy danh sách bài viết
  async getEntries(params = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        queryParams.append(key, params[key]);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/journals?${queryString}` : '/journals';
    
    const res = await api(endpoint);
    return unwrapData(res);
  },

  async createEntry(title, content, mood = 'neutral', date = new Date(), tags = []) {
    const res = await api('/journals', {
      method: 'POST',
      body: JSON.stringify({ 
        title, 
        content, 
        mood, 
        entryDate: date instanceof Date ? date.toISOString() : date, 
        tags 
      }),
    });
    return unwrapData(res);
  },

  async getEntryById(id) {
    const res = await api(`/journals/${id}`);
    return unwrapData(res);
  },

  async updateEntry(id, data) {
    const res = await api(`/journals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData(res);
  },

  // Chuyển bài viết vào thùng rác (Soft delete)
  async deleteEntry(id) {
    const res = await api(`/journals/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  // Xóa vĩnh viễn khỏi DB (Hard delete) - Giả định backend dùng DELETE /permanent hoặc query param
  async permanentDeleteEntry(id) {
    // Tùy theo backend, ta có thể dùng param permanent=true
    const res = await api(`/journals/${id}?permanent=true`, {
      method: 'DELETE',
    });
    return res;
  },

  // Khôi phục bài viết
  async restoreEntry(id) {
    const res = await api(`/journals/${id}/restore`, {
      method: 'PATCH',
      body: JSON.stringify({ isDeleted: false }),
    });
    return unwrapData(res);
  }
};
