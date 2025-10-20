import apiClient from '../../config/api';
import { API_CONFIG, API_MESSAGES } from '../../constants/api';

class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });

      return {
        success: true,
        data: response.data,
        message: API_MESSAGES.SUCCESS,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REGISTER, userData);

      return {
        success: true,
        data: response.data,
        message: API_MESSAGES.SUCCESS,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Logout user
  async logout() {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.AUTH.REFRESH_TOKEN, {
        refreshToken,
      });

      return {
        success: true,
        data: response.data,
        message: API_MESSAGES.SUCCESS,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Handle API errors
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        message: error.response.data?.message || API_MESSAGES.ERROR,
        status: error.response.status,
      };
    } else if (error.request) {
      // Network error
      return {
        success: false,
        message: API_MESSAGES.NETWORK_ERROR,
      };
    } else {
      // Other error
      return {
        success: false,
        message: API_MESSAGES.ERROR,
      };
    }
  }
}

export default new AuthService();
