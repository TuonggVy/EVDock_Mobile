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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: [],
        };
      }

      // Handle different response formats
      let agenciesData = [];
      if (Array.isArray(data)) {
        agenciesData = data;
      } else if (data.data) {
        // Handle nested data structures
        if (Array.isArray(data.data)) {
          agenciesData = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          agenciesData = data.data.data;
        } else if (data.data.agencies && Array.isArray(data.data.agencies)) {
          agenciesData = data.data.agencies;
        }
      } else if (data.agencies && Array.isArray(data.agencies)) {
        agenciesData = data.agencies;
      }

      return {
        success: true,
        data: agenciesData,
        message: 'Agencies loaded successfully',
      };
    } catch (error) {
      console.error('Error fetching agencies:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch agencies',
        data: [],
      };
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

  /**
   * Create a new agency
   * @param {Object} agencyData - Agency data (name, location, address, contactInfo)
   * @returns {Promise<Object>} Created agency with success status
   */
  async createAgency(agencyData) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BASE}`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(agencyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: data,
        };
      }

      return {
        success: true,
        message: 'Agency created successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error creating agency:', error);
      return {
        success: false,
        error: error.message || 'Failed to create agency',
      };
    }
  },

  /**
   * Update an existing agency
   * @param {string|number} agencyId - Agency ID
   * @param {Object} agencyData - Updated agency data
   * @returns {Promise<Object>} Updated agency with success status
   */
  async updateAgency(agencyId, agencyData) {
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
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(agencyData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: data,
        };
      }

      return {
        success: true,
        message: 'Agency updated successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error updating agency:', error);
      return {
        success: false,
        error: error.message || 'Failed to update agency',
      };
    }
  },

  /**
   * Update agency status
   * @param {string|number} agencyId - Agency ID
   * @param {string} status - New status ('active', 'inactive', etc.)
   * @returns {Promise<Object>} Success status
   */
  async updateAgencyStatus(agencyId, status) {
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
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: data,
        };
      }

      return {
        success: true,
        message: 'Agency status updated successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error updating agency status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update agency status',
      };
    }
  },

  /**
   * Delete an agency
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Success status
   */
  async deleteAgency(agencyId) {
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
        method: 'DELETE',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: data,
        };
      }

      return {
        success: true,
        message: 'Agency deleted successfully',
        data: data,
      };
    } catch (error) {
      console.error('Error deleting agency:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete agency',
      };
    }
  },
};

export default agencyService;
