import { API_BASE_URL, API_ENDPOINTS, getHeaders } from '../config/api';

/**
 * Agency Service
 * Handles all agency-related API calls
 */
const agencyService = {
  /**
   * Get list of agencies
   * @param {Object} params - Query parameters (limit, page, location, address)
   * @returns {Promise<Array>} List of agencies
   */
  async getAgencies(params = {}) {
    try {
      const { limit = 10, page = 1, location, address } = params;
      
      // Build query string
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit.toString());
      queryParams.append('page', page.toString());
      if (location) queryParams.append('location', location);
      if (address) queryParams.append('address', address);

      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.LIST}?${queryParams.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
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
      const url = `${API_BASE_URL}${API_ENDPOINTS.AGENCY.BY_ID(agencyId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(),
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
