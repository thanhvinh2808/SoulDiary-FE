import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

export const authService = {
  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (e) {
      console.error('Failed to load token', e);
      return null;
    }
  },

  async saveToken(token) {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (e) {
      console.error('Failed to save token', e);
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (e) {
      console.error('Failed to remove token', e);
    }
  },
  
  async login(email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Lưu token nếu có
      if (data.token) {
        await this.saveToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  async register(name, email, password) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      return data;
    } catch (error) {
      console.error('Register Error:', error);
      throw error;
    }
  },

  async loginGoogle(idToken) {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Google login failed');
      }

      if (data.token) {
        await this.saveToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  },

  async loginFacebook(accessToken) {
    try {
      console.log('Sending Facebook Access Token to Server:', accessToken.substring(0, 10) + '...');
      const response = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server Error Response:', data);
        throw new Error(data.message || 'Facebook login failed');
      }

      if (data.token) {
        await this.saveToken(data.token);
      }

      return data;
    } catch (error) {
      console.error('Facebook Login Error Details:', error);
      throw error;
    }
  },

  async logout() {
    await this.removeToken();
  }
};