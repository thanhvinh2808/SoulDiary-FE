import { API_URL } from '../config';
import { authService } from './authService';

/**
 * Hàm fetch wrapper để tự động thêm Authorization header
 */
export const api = async (endpoint, options = {}) => {
  const token = await authService.getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Xử lý 401 Unauthorized (Token hết hạn) - Tùy chọn: có thể logout tại đây
    if (response.status === 401) {
      console.warn('Unauthorized access - Token might be invalid');
      // await authService.logout(); // Cân nhắc tự động logout
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};
