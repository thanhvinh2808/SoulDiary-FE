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

  // Legacy support for single token
  async saveToken(token) {
    return this.saveTokens(token, null);
  },

  async removeToken() {
    return this.removeTokens();
  },
  
  async login(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);
      
      const response = await fetchWithRetry(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await this._handleResponse(response);
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
      
      const response = await fetchWithRetry(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await this._handleResponse(response);
      // Registration might not return tokens immediately if OTP is required
      if (data.status === 'success' && data.token) {
        await this._handleAuthResponse(data);
      }
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
          accessToken: token,
          token: token
        }),
      });
      const data = await this._handleResponse(response);
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
      if (!refreshToken) throw new Error('No refresh token available');

      const response = await fetch(`${API_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Refresh token invalid');

      const data = await response.json();
      await this._handleAuthResponse(data);
      return data.access_token || data.token?.access_token || data.token;
    } catch (error) {
      await this.logout();
      throw error;
    }
  },

  async logout() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        try {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
        } catch (e) { console.warn('Logout server-side failed'); }
      }
      await this.removeTokens();
    } catch (error) {
      console.error('❌ Logout Error:', error);
    }
  },

  async getCurrentUser() {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No token found');

      const response = await fetchWithRetry(`${API_URL}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await this._handleResponse(response);
      const user = data.data?.user || data.user;
      return {
        ...user,
        profileImage: user?.photo || user?.profileImage,
      };
    } catch (error) {
      console.error('❌ Get User Error:', error.message);
      throw error;
    }
  },

  async updateProfile(updateData) {
    try {
      const token = await this.getToken();
      if (!token) throw new Error('No token found');

      const mappedData = {};
      const allowedFields = ['name', 'phone', 'dateOfBirth', 'address', 'bio', 'photo'];
      allowedFields.forEach(f => { if (updateData[f] !== undefined) mappedData[f] = updateData[f]; });
      if (updateData.profileImage !== undefined) mappedData.photo = updateData.profileImage;

      const response = await fetchWithRetry(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
      });

      const data = await this._handleResponse(response);
      const user = data.data?.user || data.user;
      return { ...user, profileImage: user?.photo || user?.profileImage };
    } catch (error) {
      console.error('❌ Update Profile Error:', error.message);
      throw error;
    }
  },

  // --- OTP & VERIFICATION ---
  
  async verifyOtp(email, otp, type) {
    try {
      console.log('🔐 Verifying OTP:', email, type);
      // Backend handles both /otp/verify and /otp?action=verify depending on version
      // We'll use the query param version as preferred by the new UI
      const response = await fetchWithRetry(`${API_URL}/otp?action=verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, code: otp, type }),
      });

      return await this._handleResponse(response);
    } catch (error) {
      console.error('❌ OTP Verification Error:', error.message);
      throw error;
    }
  },

  async resendOtp(email, type) {
    try {
      console.log('📧 Resending OTP:', email, type);
      const response = await fetchWithRetry(`${API_URL}/otp?action=resend`, {
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

  // Helper: Xử lý response chung
  async _handleResponse(response) {
    if (!response) throw new Error('No response from server');

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`Invalid response format: ${text.substring(0, 100)}`);
    }

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  },

  async _handleAuthResponse(data) {
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
    }
  }
};