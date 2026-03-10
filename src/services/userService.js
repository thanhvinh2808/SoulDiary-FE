import { api } from './api';

// Helper to unwrap data
const unwrap = (response) => response.data || response;

export const userService = {
  // Lấy thông tin người dùng hiện tại
  async getProfile() {
    const res = await api('/users/me');
    return unwrap(res);
  },

  // Cập nhật thông tin (Avatar, Tên...)
  async updateProfile(data) {
    const res = await api('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return unwrap(res);
  },

  // Đổi mật khẩu
  async changePassword(currentPassword, newPassword) {
    const res = await api('/users/me/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return unwrap(res);
  },

  // Xóa tài khoản vĩnh viễn
  async deleteAccount() {
    const res = await api('/users/me', {
      method: 'DELETE',
    });
    return unwrap(res);
  }
};
