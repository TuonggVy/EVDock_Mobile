import axiosInstance from './api/axiosInstance';

/**
 * Agency Stock Service
 * Handles all agency stock-related API calls
 */
class AgencyStockService {
  /**
   * Create agency stock
   * @param {Object} stockData - Stock data (motorbikeId, colorId, quantity, price, agencyId)
   * @returns {Promise<Object>} Created stock data
   */
  async createAgencyStock(stockData) {
    try {
      const response = await axiosInstance.post('/agency-stock', stockData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Create agency stock success!',
      };
    } catch (error) {
      console.error('Error creating agency stock:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create agency stock',
        message: 'Failed to create agency stock',
      };
    }
  }

  /**
   * Get list of agency stocks
   * @param {number} agencyId - Agency ID
   * @param {Object} params - Query parameters (page, limit, motorbikeId, colorId)
   * @returns {Promise<Object>} List of stocks with pagination
   */
  async getAgencyStocks(agencyId, params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.motorbikeId !== undefined && params.motorbikeId !== null) {
        queryParams.append('motorbikeId', params.motorbikeId);
      }
      if (params.colorId !== undefined && params.colorId !== null) {
        queryParams.append('colorId', params.colorId);
      }

      const url = `/agency-stock/list/${agencyId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axiosInstance.get(url);
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo,
        message: response.data.message || 'Get list agency stocks success',
      };
    } catch (error) {
      console.error('Error fetching agency stocks:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch agency stocks',
        message: 'Failed to fetch agency stocks',
        data: [],
      };
    }
  }

  /**
   * Get agency stock detail by ID
   * @param {number} stockId - Stock ID
   * @returns {Promise<Object>} Stock detail with motorbike, color, and promotions
   */
  async getAgencyStockDetail(stockId) {
    try {
      const response = await axiosInstance.get(`/agency-stock/detail/${stockId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Get agency stock detail success!',
      };
    } catch (error) {
      console.error('Error fetching agency stock detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch agency stock detail',
        message: 'Failed to fetch agency stock detail',
      };
    }
  }

  /**
   * Update agency stock
   * @param {number} stockId - Stock ID
   * @param {Object} stockData - Updated stock data (quantity, price)
   * @returns {Promise<Object>} Updated stock data
   */
  async updateAgencyStock(stockId, stockData) {
    try {
      const response = await axiosInstance.patch(`/agency-stock/${stockId}`, stockData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Update agency stock success',
      };
    } catch (error) {
      console.error('Error updating agency stock:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update agency stock',
        message: 'Failed to update agency stock',
      };
    }
  }

  /**
   * Delete agency stock
   * @param {number} stockId - Stock ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteAgencyStock(stockId) {
    try {
      const response = await axiosInstance.delete(`/agency-stock/${stockId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Delete agency stock success',
      };
    } catch (error) {
      console.error('Error deleting agency stock:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete agency stock',
        message: 'Failed to delete agency stock',
      };
    }
  }
}

const agencyStockService = new AgencyStockService();
export default agencyStockService;

