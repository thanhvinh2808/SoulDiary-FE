import { API_URL } from '../config';
import { authService } from './authService';

// Biến cờ để tránh gọi refresh token nhiều lần cùng lúc
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Hàm fetch wrapper để tự động thêm Authorization header và xử lý Refresh Token
 */
export const api = async (endpoint, options = {}) => {
  let token = await authService.getToken();
  
  const getHeaders = (t) => ({
    'Content-Type': 'application/json',
    ...options.headers,
    ...(t ? { 'Authorization': `Bearer ${t}` } : {})
  });

  const config = {
    ...options,
    headers: getHeaders(token),
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Xử lý 401 Unauthorized (Token hết hạn)
    if (response.status === 401) {
      console.warn('⚠️ Unauthorized access - Attempting to refresh token...');
      
      if (isRefreshing) {
        // Nếu đang refresh, đợi và retry request sau khi refresh xong
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          // Retry request với token mới
          return api(endpoint, {
            ...options,
            headers: getHeaders(newToken)
          });
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      try {
        // Gọi refresh token
        const newToken = await authService.refreshToken();
        isRefreshing = false;
        
        // Xử lý hàng đợi các request bị pending
        processQueue(null, newToken);

        // Retry request hiện tại
        return api(endpoint, {
          ...options,
          headers: getHeaders(newToken)
        });

      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        // Nếu refresh fail, logout đã được xử lý bên trong authService
        throw refreshError;
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
       const data = await response.json();
       if (!response.ok) {
          throw new Error(data.message || `Error ${response.status}`);
       }
       return data;
    } else {
       // Nếu không phải JSON, đọc text để debug
       const text = await response.text();
       console.error(`❌ API Error [${endpoint}] - Status: ${response.status}`);
       console.error(`❌ Raw Response: ${text.substring(0, 200)}`); // Log 200 ký tự đầu
       throw new Error(`Server returned non-JSON response (${response.status})`);
    }

  } catch (error) {
    console.error(`API Request Error [${endpoint}]:`, error);
    throw error;
  }
};
