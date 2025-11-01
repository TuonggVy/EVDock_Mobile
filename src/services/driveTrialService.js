import { API_BASE_URL, getHeaders } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Drive Trial Service
 * Handles all drive trial booking API calls
 */
const driveTrialService = {
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
   * Create a new drive trial booking (public endpoint)
   * @param {Object} bookingData - Booking data (fullname, email, phone, driveDate, driveTime)
   * @returns {Promise<Object>} Response with booking data
   */
  async createBooking(bookingData) {
    try {
      const url = `${API_BASE_URL}/drive-trial/public/booking`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || null,
        message: data.message || 'Booking created successfully',
      };
    } catch (error) {
      console.error('Error creating drive trial booking:', error);
      return {
        success: false,
        error: error.message || 'Failed to create booking',
        data: null,
      };
    }
  },

  /**
   * Get list of drive trials for an agency
   * @param {number} agencyId - Agency ID
   * @param {Object} params - Query parameters (page, limit)
   * @returns {Promise<Object>} Response with list of bookings and pagination info
   */
  async getDriveTrials(agencyId, params = {}) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/drive-trial/list/${agencyId}`;
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      
      const queryString = queryParams.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: [],
          paginationInfo: null,
        };
      }

      const bookingsData = data.data || [];
      const paginationInfo = data.paginationInfo || null;

      return {
        success: true,
        data: bookingsData,
        paginationInfo: paginationInfo,
        message: data.message || 'Drive trials loaded successfully',
      };
    } catch (error) {
      console.error('Error fetching drive trials:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch drive trials',
        data: [],
        paginationInfo: null,
      };
    }
  },

  /**
   * Get detail of a specific drive trial booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Response with booking detail
   */
  async getDriveTrialDetail(bookingId) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/drive-trial/detail/${bookingId}`;
      
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
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || null,
        message: data.message || 'Drive trial detail loaded successfully',
      };
    } catch (error) {
      console.error('Error fetching drive trial detail:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch drive trial detail',
        data: null,
      };
    }
  },

  /**
   * Update a drive trial booking
   * @param {number} bookingId - Booking ID
   * @param {Object} updateData - Update data (status, driveDate, driveTime, etc.)
   * @returns {Promise<Object>} Response with updated booking data
   */
  async updateDriveTrial(bookingId, updateData) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/drive-trial/${bookingId}`;
      
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
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
          data: null,
        };
      }

      return {
        success: true,
        data: data.data || null,
        message: data.message || 'Drive trial updated successfully',
      };
    } catch (error) {
      console.error('Error updating drive trial:', error);
      return {
        success: false,
        error: error.message || 'Failed to update drive trial',
        data: null,
      };
    }
  },

  /**
   * Delete a drive trial booking
   * @param {number} bookingId - Booking ID
   * @returns {Promise<Object>} Response with success status
   */
  async deleteDriveTrial(bookingId) {
    try {
      const token = await this.getAuthTokenAsync();
      const url = `${API_BASE_URL}/drive-trial/${bookingId}`;
      
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
        };
      }

      return {
        success: true,
        message: data.message || 'Drive trial deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting drive trial:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete drive trial',
      };
    }
  },
};

export default driveTrialService;

