import api from './api/axiosInstance';

/**
 * Warehouse Service - Handles all warehouse-related API calls
 */
const warehouseService = {
  /**
   * Create a new warehouse
   * @param {Object} warehouseData - Warehouse data (name, location, address, isActive)
   * @returns {Promise<Object>} Created warehouse data
   */
  async createWarehouse(warehouseData) {
    try {
      const response = await api.post('/warehouses', warehouseData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error creating warehouse:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tạo warehouse',
      };
    }
  },

  /**
   * Get list of all warehouses
   * @returns {Promise<Object>} List of warehouses
   */
  async getWarehousesList() {
    try {
      const response = await api.get('/warehouses/list');
      return {
        success: true,
        data: response.data.data || [],
        paginationInfo: response.data.paginationInfo,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error fetching warehouses:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải danh sách warehouse',
        data: [],
      };
    }
  },

  /**
   * Get warehouse detail by ID
   * @param {string|number} warehouseId - Warehouse ID
   * @returns {Promise<Object>} Warehouse detail data
   */
  async getWarehouseDetail(warehouseId) {
    try {
      const response = await api.get(`/warehouses/detail/${warehouseId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error fetching warehouse detail:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải thông tin warehouse',
      };
    }
  },

  /**
   * Update warehouse details
   * @param {string|number} warehouseId - Warehouse ID
   * @param {Object} updateData - Updated warehouse data
   * @returns {Promise<Object>} Updated warehouse data
   */
  async updateWarehouse(warehouseId, updateData) {
    try {
      const response = await api.patch(`/warehouses/${warehouseId}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error updating warehouse:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể cập nhật warehouse',
      };
    }
  },

  /**
   * Delete warehouse
   * @param {string|number} warehouseId - Warehouse ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteWarehouse(warehouseId) {
    try {
      const response = await api.delete(`/warehouses/${warehouseId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error) {
      console.error('Error deleting warehouse:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể xóa warehouse',
      };
    }
  },
};

export default warehouseService;

