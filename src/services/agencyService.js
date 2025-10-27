import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';

/**
 * Agency Service
 * Handles all agency-related API calls
 */

// Helper function to get auth token from storage
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

const agencyService = {
  /**
   * Get list of agencies
   * @returns {Promise<Object>} Response with agency list
   */
  async getAgencies() {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.LIST}`;
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return { success: true, data };
      } else if (data.data && Array.isArray(data.data)) {
        return { success: true, data: data.data };
      } else if (data.agencies && Array.isArray(data.agencies)) {
        return { success: true, data: data.agencies };
      }
      
      return { success: true, data: [] };
    } catch (error) {
      console.error('Error fetching agencies:', error);
      return { success: false, error: error.message || 'Không thể tải danh sách đại lý' };
    }
  },

  /**
   * Update agency status
   * @param {string|number} agencyId - Agency ID
   * @param {string} status - Status (Active, Inactive)
   * @returns {Promise<Object>} Updated agency
   */
  async updateAgencyStatus(agencyId, status) {
    return this.updateAgency(agencyId, { status });
  },

  /**
   * Get agency by ID
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Agency details
   */
  async getAgencyById(agencyId) {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BY_ID(agencyId)}`;
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching agency:', error);
      return { success: false, error: error.message || 'Không thể tải thông tin đại lý' };
    }
  },

  /**
   * Create a new agency
   * @param {Object} agencyData - Agency data (name, location, address, contactInfo)
   * @returns {Promise<Object>} Created agency
   */
  async createAgency(agencyData) {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BASE}`;
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...getHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(agencyData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error creating agency:', error);
      return { success: false, error: error.message || 'Không thể tạo đại lý' };
    }
  },

  /**
   * Update an agency
   * @param {string|number} agencyId - Agency ID
   * @param {Object} updateData - Agency data to update
   * @returns {Promise<Object>} Updated agency
   */
  async updateAgency(agencyId, updateData) {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BY_ID(agencyId)}`;
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          ...getHeaders(token),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error updating agency:', error);
      return { success: false, error: error.message || 'Không thể cập nhật đại lý' };
    }
  },

  /**
   * Delete an agency
   * @param {string|number} agencyId - Agency ID
   * @returns {Promise<Object>} Result of deletion
   */
  async deleteAgency(agencyId) {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BY_ID(agencyId)}`;
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: getHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting agency:', error);
      return { success: false, error: error.message || 'Không thể xóa đại lý' };
    }
  },
};

export default agencyService;
