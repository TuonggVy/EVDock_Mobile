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
}

export default new StockPromotionService();

