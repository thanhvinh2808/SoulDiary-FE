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

  async getRefreshToken() {
    try {
      return await AsyncStorage.getItem('refreshToken');
    } catch (e) {
      console.error('❌ Failed to load refresh token:', e);
      return null;
    }
  },

  async saveTokens(accessToken, refreshToken) {
    try {
      await AsyncStorage.setItem('userToken', accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      console.log('✅ Tokens saved successfully');
    } catch (e) {
      console.error('❌ Failed to save tokens:', e);
    }
  },

  async removeTokens() {
    try {
      await AsyncStorage.multiRemove(['userToken', 'refreshToken']);
      console.log('✅ Tokens removed successfully');
    } catch (e) {
      console.error('❌ Failed to remove tokens:', e);
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

      const data = await this._handleResponse(response);

      // Xử lý lưu token (Backend có thể trả về cấu trúc khác nhau)
      await this._handleAuthResponse(data);

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

      const data = await this._handleResponse(response);
      
      // Đăng ký xong thường tự động login hoặc trả về token
      await this._handleAuthResponse(data);

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
      
      const response = await fetchWithRetry(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken: token,
          accessToken: token, // Fallback
          token: token        // Fallback
        }),
      });

      if (!response) {
         throw new Error('No response received from server');
      }

      console.log('📥 Google Login Response Status:', response.status);

      // Đọc response dưới dạng text trước để debug nếu lỗi
      const textResponse = await response.text();
      console.log('📥 Google Login Raw Response:', textResponse.substring(0, 500)); // Log 500 ký tự đầu

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Server returned non-JSON response: ${textResponse.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(data.message || `Google login failed (${response.status})`);
      }
      
      await this._handleAuthResponse(data);

      return data;
    } catch (error) {
      console.error('❌ Google Login Error:', error.message);
      throw error;
    }
  },

  async loginFacebook(accessToken) {
    try {
      console.log('🔵 Facebook Login - Sending token to server');
      
      const response = await fetchWithRetry(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken: accessToken,
          token: accessToken
        }),
      });

      const data = await this._handleResponse(response);
      await this._handleAuthResponse(data);

      return data;
    } catch (error) {
      console.error('❌ Facebook Login Error:', error.message);
      throw error;
    }
  },

  async refreshToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Refreshing Access Token...');
      
      // Gọi API refresh token
      // Lưu ý: Backend dùng POST /auth/refresh-token
      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Nếu refresh thất bại (hết hạn), cần logout
        throw new Error('Refresh token invalid or expired');
      }

      const data = await response.json();
      
      // Backend trả về bộ token mới
      await this._handleAuthResponse(data);
      
      // Trả về access token mới để API retry request
      return data.access_token || data.token?.access_token || data.token;

    } catch (error) {
      console.error('❌ Refresh Token Error:', error.message);
      await this.logout(); // Logout nếu không refresh được
      throw error;
    }
  },

  async logout() {
    try {
      // 1. Gọi API Logout (Best effort - không throw lỗi nếu mạng lỗi)
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          console.log('✅ Server logout called');
        } catch (serverError) {
          console.warn('⚠️ Server logout failed, proceeding with local logout:', serverError.message);
        }
      }

      // 2. Xóa token local
      await this.removeTokens();
      console.log('✅ Local logout successful');
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

      const response = await fetchWithRetry(`${API_URL}/users/me`, {
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
      // Backend returns { status, data: { user: {...} } }
      const user = data.data?.user || data.user;
      return {
        ...user,
        // Map 'photo' to 'profileImage' for frontend consistency
        profileImage: user?.photo || user?.profileImage,
      };
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

      // Map frontend field names to backend field names
      const mappedData = {};
      const allowedFields = ['name', 'phone', 'dateOfBirth', 'address', 'bio', 'photo'];
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          mappedData[field] = updateData[field];
        }
      }
      
      // Map 'profileImage' to 'photo' for backend
      if (updateData.profileImage !== undefined) {
        mappedData.photo = updateData.profileImage;
      }

      console.log('📝 Updating profile with:', mappedData);

      const response = await fetchWithRetry(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
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
      const user = data.data?.user || data.user;
      return {
        ...user,
        profileImage: user?.photo || user?.profileImage,
      };
    } catch (error) {
      console.error('❌ Update Profile Error:', error.message);
      throw error;
    }
  },

  // --- OTP & PASSWORD RECOVERY ---

  // Gửi lại mã OTP
  async resendOtp(email, type = 'forgotPassword') {
    try {
      console.log('📧 Resending OTP to:', email);
      const response = await fetch(`${API_URL}/otp/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type }),
      });
      return await this._handleResponse(response);
    } catch (error) {
      console.error('❌ Resend OTP Error:', error.message);
      throw error;
    }
  },

  // Xác thực mã OTP
  async verifyOtp(email, code, type = 'forgotPassword') {
    try {
      console.log('🔐 Verifying OTP for:', email);
      const response = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, type }),
      });
      return await this._handleResponse(response);
    } catch (error) {
      console.error('❌ Verify OTP Error:', error.message);
      throw error;
    }
  },

  // Helper: Xử lý response chung
  async _handleResponse(response) {
    // Kiểm tra connection/response
    if (!response) {
      throw new Error('No response from server. Please check your connection.');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
      throw new Error('Server error: Backend returned invalid format');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `Request failed (${response.status})`);
    }
    return data;
  },

  // Helper: Lưu token từ response login/register
  async _handleAuthResponse(data) {
    // Cấu trúc response có thể là:
    // 1. { token: "access_token_string" } (Legacy)
    // 2. { token: { access_token: "...", refresh_token: "..." } } (Standard)
    // 3. { access_token: "...", refresh_token: "..." } (Flat)
    
    let accessToken = null;
    let refreshToken = null;

    if (data.token) {
      if (typeof data.token === 'string') {
        accessToken = data.token;
      } else {
        accessToken = data.token.access_token;
        refreshToken = data.token.refresh_token;
      }
    } else {
      accessToken = data.access_token;
      refreshToken = data.refresh_token;
    }

    if (accessToken) {
      await this.saveTokens(accessToken, refreshToken);
      console.log('✅ Tokens extracted and saved');
    } else {
      console.warn('⚠️ No access token found in response:', data);
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