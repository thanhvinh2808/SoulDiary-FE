import { api } from './api';

// Helper để giải nén dữ liệu từ response
const unwrapData = (response) => {
  // Backend trả về: { status: "success", data: { journals: [...] } } hoặc { data: { journal: ... } }
  if (response && response.data) {
    return response.data.journals || response.data.journal || response.data;
  }
  return response;
};

export const diaryService = {
  // --- JOURNALS (Tương đương Bài viết/Entries) ---

  // Lấy danh sách bài viết (Journals)
  // Hỗ trợ params filter: page, limit, mood, tag, from, to, q
  async getEntries(params = {}) {
    // Chuyển params object thành query string
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/journals?${query}` : '/journals';
    
    const res = await api(endpoint);
    return unwrapData(res);
  },

  // Tạo bài viết mới (Create Journal)
  async createEntry(title, content, mood = 'neutral', date = new Date(), tags = []) {
    const res = await api('/journals', {
      method: 'POST',
      body: JSON.stringify({ 
        title, 
        content, 
        mood, 
        entryDate: date.toISOString(), // Backend dùng entryDate
        tags 
      }),
    });
    return unwrapData(res);
  },

  // Lấy chi tiết 1 bài viết
  async getEntryById(id) {
    const res = await api(`/journals/${id}`);
    return unwrapData(res);
  },

  // Cập nhật bài viết
  async updateEntry(id, data) {
    // data có thể chứa: title, content, mood, tags, entryDate
    const res = await api(`/journals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return unwrapData(res);
  },

  // Xóa bài viết (Soft delete)
  async deleteEntry(id) {
    const res = await api(`/journals/${id}`, {
      method: 'DELETE',
    });
    // DELETE thường trả về 204 No Content -> res có thể null hoặc empty
    return res;
  }
};