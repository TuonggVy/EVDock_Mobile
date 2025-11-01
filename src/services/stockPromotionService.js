import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

/**
 * Stock Promotion Service
 * Handles all stock promotion-related API calls for Dealer Manager
 */
class StockPromotionService {
  /**
   * Get stock promotion list by agency
   * @param {number} agencyId - Agency ID
   * @param {Object} params - Query parameters (page, limit, status, valueType)
   * @returns {Promise<Object>} List of stock promotions with pagination
   */
  async getStockPromotionList(agencyId, params = {}) {
    try {
      if (!agencyId) {
        return { success: false, error: 'agencyId is required', data: [] };
      }

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.valueType) queryParams.append('valueType', params.valueType);

      const url = `${API_BASE_URL}/stock-promotion/list/${agencyId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔄 [StockPromotionService] Fetching stock promotions:', { agencyId, params, url });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ [StockPromotionService] Stock promotions fetched:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data || [],
        pagination: response.data?.paginationInfo || {},
        message: response.data?.message || 'Get stock promotion list successfully!',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error fetching stock promotions:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stock promotions',
        data: [],
        pagination: {},
      };
    }
  }

  /**
   * Get stock promotion detail by ID
   * @param {number} stockPromotionId - Stock Promotion ID
   * @returns {Promise<Object>} Stock promotion detail
   */
  async getStockPromotionDetail(stockPromotionId) {
    try {
      if (!stockPromotionId) {
        return { success: false, error: 'stockPromotionId is required', data: null };
      }

      const url = `${API_BASE_URL}/stock-promotion/detail/${stockPromotionId}`;
      
      console.log('🔄 [StockPromotionService] Fetching stock promotion detail:', { stockPromotionId, url });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ [StockPromotionService] Stock promotion detail fetched:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data || null,
        message: response.data?.message || 'Get stock promotion detail successfully!',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error fetching stock promotion detail:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stock promotion detail',
        data: null,
      };
    }
  }

  /**
   * Create a new stock promotion
   * @param {Object} promotionData - Promotion data
   * @param {string} promotionData.name - Promotion name
   * @param {string} promotionData.description - Promotion description
   * @param {string} promotionData.valueType - Value type (PERCENT or FIXED)
   * @param {number} promotionData.value - Value
   * @param {string} promotionData.startAt - Start date (ISO string)
   * @param {string} promotionData.endAt - End date (ISO string)
   * @param {string} promotionData.status - Status (ACTIVE or INACTIVE)
   * @param {number} promotionData.agencyId - Agency ID
   * @returns {Promise<Object>} Created promotion data
   */
  async createStockPromotion(promotionData) {
    try {
      console.log('🔄 [StockPromotionService] Creating stock promotion:', promotionData);
      
      const url = `${API_BASE_URL}/stock-promotion`;
      
      const response = await axiosInstance.post(url, promotionData);
      
      console.log('✅ [StockPromotionService] Stock promotion created:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data || null,
        message: response.data?.message || 'Create stock promotion successfully!',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error creating stock promotion:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to create stock promotion',
        data: null,
      };
    }
  }

  /**
   * Update stock promotion
   * @param {number} stockPromotionId - Stock Promotion ID
   * @param {Object} promotionData - Promotion data to update
   * @param {string} promotionData.name - Promotion name
   * @param {string} promotionData.description - Promotion description
   * @param {string} promotionData.valueType - Value type (PERCENT or FIXED)
   * @param {number} promotionData.value - Value
   * @param {string} promotionData.startAt - Start date (ISO string)
   * @param {string} promotionData.endAt - End date (ISO string)
   * @param {string} promotionData.status - Status (ACTIVE or INACTIVE)
   * @returns {Promise<Object>} Updated promotion data
   */
  async updateStockPromotion(stockPromotionId, promotionData) {
    try {
      if (!stockPromotionId) {
        return { success: false, error: 'stockPromotionId is required', data: null };
      }

      console.log('🔄 [StockPromotionService] Updating stock promotion:', { stockPromotionId, promotionData });
      
      const url = `${API_BASE_URL}/stock-promotion/${stockPromotionId}`;
      
      const response = await axiosInstance.patch(url, promotionData);
      
      console.log('✅ [StockPromotionService] Stock promotion updated:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data || null,
        message: response.data?.message || 'Update stock promotion successfully!',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error updating stock promotion:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to update stock promotion',
        data: null,
      };
    }
  }

  /**
   * Delete stock promotion
   * @param {number} stockPromotionId - Stock Promotion ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteStockPromotion(stockPromotionId) {
    try {
      if (!stockPromotionId) {
        return { success: false, error: 'stockPromotionId is required' };
      }

      console.log('🔄 [StockPromotionService] Deleting stock promotion:', { stockPromotionId });
      
      const url = `${API_BASE_URL}/stock-promotion/${stockPromotionId}`;
      
      const response = await axiosInstance.delete(url);
      
      console.log('✅ [StockPromotionService] Stock promotion deleted:', response.data);
      
      return {
        success: true,
        message: response.data?.message || 'Delete stock promotion successfully!',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error deleting stock promotion:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to delete stock promotion',
      };
    }
  }

  /**
   * Apply promotion to stocks
   * @param {number} stockPromotionId - Stock Promotion ID
   * @param {number[]} listStockId - Array of stock IDs
   * @returns {Promise<Object>} Assignment result
   */
  async applyPromotionToStocks(stockPromotionId, listStockId) {
    try {
      if (!stockPromotionId) {
        return { success: false, error: 'stockPromotionId is required' };
      }

      if (!listStockId || !Array.isArray(listStockId) || listStockId.length === 0) {
        return { success: false, error: 'listStockId must be a non-empty array' };
      }

      console.log('🔄 [StockPromotionService] Applying promotion to stocks:', { stockPromotionId, listStockId });
      
      const url = `${API_BASE_URL}/stock-promotion/assignment`;
      
      const response = await axiosInstance.post(url, {
        stockPromotionId,
        listStockId,
      });
      
      console.log('✅ [StockPromotionService] Promotion applied to stocks:', response.data);
      
      return {
        success: true,
        message: response.data?.message || 'Apply promotion to stock',
      };
    } catch (error) {
      console.error('❌ [StockPromotionService] Error applying promotion to stocks:', error);
      console.error('❌ [StockPromotionService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to apply promotion to stocks',
      };
    }
  }
}

export default new StockPromotionService();

