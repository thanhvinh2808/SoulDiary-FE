import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, REQUEST_TIMEOUT, MAX_RETRIES } from '../config';

// Helper function để handle Render.com cold start
const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - Server might be waking up. Please try again.');
    }
    throw error;
  }
};

// Helper function để retry request (cho cold start)
const fetchWithRetry = async (url, options = {}, retries = MAX_RETRIES) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`📡 API Request (attempt ${i + 1}/${retries}):`, url);
      const response = await fetchWithTimeout(url, options);
      return response;
    } catch (error) {
      console.warn(`⚠️ Attempt ${i + 1} failed:`, error.message);
      
      if (i === retries - 1) {
        // Last attempt failed
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(2, i), 5000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

export const authService = {
  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (e) {
      console.error('❌ Failed to load token:', e);
      return null;
    }
  },

  async saveToken(token) {
    try {
      await AsyncStorage.setItem('userToken', token);
      console.log('✅ Token saved successfully');
    } catch (e) {
      console.error('❌ Failed to save token:', e);
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem('userToken');
      console.log('✅ Token removed successfully');
    } catch (e) {
      console.error('❌ Failed to remove token:', e);
    }
  },
  
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      console.log('📍 API URL:', `${API_URL}/auth/login`);
      
      const response = await fetchWithRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Kiểm tra response có tồn tại không
      if (!response) {
        throw new Error('No response from server. Please check your connection.');
      }

      console.log('📥 Response status:', response.status);
      
      // Kiểm tra content type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Please check if the backend is running correctly');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Login failed (${response.status})`);
      }

      // Lưu token nếu có
      if (data.token) {
        // Backend trả về { access_token, refresh_token }
        // Chúng ta cần access_token để gọi API
        const accessToken = data.token.access_token || data.token;
        if (typeof accessToken === 'string') {
           await this.saveToken(accessToken);
           console.log('✅ Login successful, token saved');
        } else {
           console.warn('⚠️ Token is not a string:', accessToken);
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Login Error:', error.message);
      throw error;
    }
  },

  async register(name, email, password) {
    try {
      console.log('📝 Attempting registration for:', email);
      console.log('📍 API URL:', `${API_URL}/auth/register`);
      
      const response = await fetchWithRetry(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      // Kiểm tra response có tồn tại không
      if (!response) {
        throw new Error('No response from server. Please check your connection.');
      }

      console.log('📥 Response status:', response.status);
      
      // Kiểm tra content type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Please check if the backend is running correctly');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Registration failed (${response.status})`);
      }

      console.log('✅ Registration successful');
      return data;
    } catch (error) {
      console.error('❌ Register Error:', error.message);
      throw error;
    }
  },

  async loginGoogle(token) {
    try {
      console.log('🔵 Google Login - Sending token to server');
      console.log('📍 API URL:', `${API_URL}/auth/google`);
      console.log('🔑 Token preview:', token.substring(0, 20) + '...');
      
      const response = await fetchWithRetry(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Backend có thể nhận các field name khác nhau
        // Gửi cả 3 để chắc chắn
        body: JSON.stringify({ 
          idToken: token,
          accessToken: token,
          token: token
        }),
      });

      // Kiểm tra response có tồn tại không
      if (!response) {
        throw new Error('No response from server. Please check your connection.');
      }

      console.log('📥 Response status:', response.status);
      
      // Kiểm tra content type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Please check if the backend is running correctly');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Google Server Error:', data);
        throw new Error(data.message || `Google login failed (${response.status})`);
      }

      if (data.token) {
        const accessToken = data.token.access_token || data.token;
        if (typeof accessToken === 'string') {
          await this.saveToken(accessToken);
          console.log('✅ Google Login successful, token saved');
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Google Login Error:', error.message);
      throw error;
    }
  },

  async loginFacebook(accessToken) {
    try {
      console.log('🔵 Facebook Login - Sending token to server');
      console.log('📍 API URL:', `${API_URL}/auth/facebook`);
      console.log('🔑 Token preview:', accessToken.substring(0, 20) + '...');
      
      const response = await fetchWithRetry(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Backend có thể nhận các field name khác nhau
        // Gửi cả 2 để chắc chắn
        body: JSON.stringify({ 
          accessToken: accessToken,
          token: accessToken
        }),
      });

      // Kiểm tra response có tồn tại không
      if (!response) {
        throw new Error('No response from server. Please check your connection.');
      }

      console.log('📥 Response status:', response.status);
      
      // Kiểm tra content type trước khi parse JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error: Please check if the backend is running correctly');
      }

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Facebook Server Error:', data);
        throw new Error(data.message || `Facebook login failed (${response.status})`);
      }

      if (data.token) {
        const accessToken = data.token.access_token || data.token;
        if (typeof accessToken === 'string') {
          await this.saveToken(accessToken);
          console.log('✅ Facebook Login successful, token saved');
        }
      }

      return data;
    } catch (error) {
      console.error('❌ Facebook Login Error:', error.message);
      throw error;
    }
  },

  async logout() {
    try {
      await this.removeToken();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout Error:', error);
    }
  },

  async getCurrentUser() {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No token found. Please login first.');
      }

      const response = await fetchWithRetry(`${API_URL}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error while fetching profile');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to fetch user profile:', data);
        throw new Error(data.message || 'Failed to fetch user profile');
      }

      console.log('✅ User profile fetched successfully');
      return data.data || data;
    } catch (error) {
      console.error('❌ Get Current User Error:', error.message);
      throw error;
    }
  },

  async updateProfile(updateData) {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('No token found. Please login first.');
      }

      console.log('📝 Updating profile with:', updateData);

      const response = await fetchWithRetry(`${API_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
        throw new Error('Server error while updating profile');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to update profile:', data);
        throw new Error(data.message || 'Failed to update profile');
      }

      console.log('✅ Profile updated successfully');
      return data.data || data;
    } catch (error) {
      console.error('❌ Update Profile Error:', error.message);
      throw error;
    }
  },

  // Helper function để test connection
  async testConnection() {
    try {
      console.log('🔍 Testing API connection...');
      console.log('📍 API URL:', API_URL);
      
      const response = await fetchWithTimeout(`${API_URL}/health`, {
        method: 'GET',
      }, 10000);

      if (response.ok) {
        console.log('✅ API is reachable');
        return true;
      } else {
        console.warn('⚠️ API returned non-OK status:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection test failed:', error.message);
      return false;
    }
  }
};