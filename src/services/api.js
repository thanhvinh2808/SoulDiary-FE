import { API_URL } from '../config';
import { authService } from './authService';

/**
 * Hàm fetch wrapper để tự động thêm Authorization header
 */
export const api = async (endpoint, options = {}) => {
  const token = await authService.getToken();
  console.log(`📡 API Call [${endpoint}] - Token available:`, !!token);
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('✅ Authorization header added');
  } else {
    console.warn('⚠️ No token available for Authorization header');
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

    // Get response text first
    const text = await response.text();
    console.log(`📥 Raw response [${endpoint}]:`, text.substring(0, 200));
    
    // Handle non-JSON responses (error pages, etc)
    if (!text || text.includes('Could not be found') || text.includes('NOT_FOUND')) {
      console.error(`❌ Server returned error page for [${endpoint}]`);
      throw new Error(`Endpoint not found or resource doesn't exist: ${endpoint}`);
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error(`❌ JSON Parse Error [${endpoint}]:`, parseError.message);
      console.log('📄 Response content:', text.substring(0, 500));
      throw new Error(`Invalid response from server: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};
