import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Agency Service
 * Handles all agency-related API calls
 */
const agencyService = {
  /**
   * Get auth token from storage
   */
  async getAuthTokenAsync() {
    try {
      const token = await AsyncStorage.getItem('token');
      return token;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  /**
   * Get list of agencies
   * @param {Object} params - Query parameters (limit, page, location, address)
   * @returns {Promise<Array>} List of agencies
   */
  async getAgencies(params = {}) {
    try {
      // Use GET /agency/list endpoint as specified
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/agency/list`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.agencies && Array.isArray(data.agencies)) {
        return data.agencies;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching agencies:', error);
      throw error;
    }
  },

  /**
   * Get agency by ID
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Agency details
   */
  async getAgencyById(agencyId) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BY_ID(agencyId)}`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching agency:', error);
      throw error;
    }
  },
};

export default agencyService;
