import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

/**
 * Batch Management Service
 * Handles all batch (AP Batches) management API calls for EVM Staff
 */
class BatchManagementService {
  /**
   * Get list of batches
   * @param {Object} params - Query parameters (page, limit, status)
   * @returns {Promise<Object>} List of batches with pagination
   */
  async getBatchList(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);

      const url = `${API_BASE_URL}/batches-management/list${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔄 [BatchManagementService] Fetching batches:', { params, url });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ [BatchManagementService] Batches fetched:', response.data);
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.paginationInfo || {},
        message: response.data?.message || 'Get list batches success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error fetching batches:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch batches',
        data: [],
        pagination: {},
      };
    }
  }

  /**
   * Get list of batches for a specific agency
   * @param {number} agencyId - Agency ID
   * @param {Object} params - Query parameters (page, limit, status)
   * @returns {Promise<Object>} List of batches with pagination
   */
  async getBatchListByAgency(agencyId, params = {}) {
    try {
      if (!agencyId) {
        return { success: false, error: 'agencyId is required', data: [] };
      }

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);

      const url = `${API_BASE_URL}/batches-management/list/agency/${agencyId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔄 [BatchManagementService] Fetching batches by agency:', { agencyId, params, url });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ [BatchManagementService] Batches by agency fetched:', response.data);
      
      return {
        success: true,
        data: response.data?.data || [],
        pagination: response.data?.paginationInfo || {},
        message: response.data?.message || 'Get list batches for agency success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error fetching batches by agency:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch batches by agency',
        data: [],
        pagination: {},
      };
    }
  }

  /**
   * Get batch detail by ID
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Batch detail
   */
  async getBatchDetail(batchId) {
    try {
      if (!batchId) {
        return { success: false, error: 'batchId is required', data: null };
      }

      const url = `${API_BASE_URL}/batches-management/detail/${batchId}`;
      
      console.log('🔄 [BatchManagementService] Fetching batch detail:', { batchId, url });
      
      const response = await axiosInstance.get(url);
      
      console.log('✅ [BatchManagementService] Batch detail fetched:', response.data);
      
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'Get batch detail success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error fetching batch detail:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch batch detail',
        data: null,
      };
    }
  }

  /**
   * Create a new batch
   * @param {Object} batchData - Batch data
   * @param {number} batchData.invoiceNumber - Invoice number
   * @param {number} batchData.amount - Amount
   * @param {string} batchData.dueDate - Due date (ISO string)
   * @param {number} batchData.agencyId - Agency ID
   * @param {number} batchData.agencyOrderId - Agency Order ID
   * @returns {Promise<Object>} Created batch data
   */
  async createBatch(batchData) {
    try {
      console.log('🔄 [BatchManagementService] Creating batch:', batchData);
      
      const url = `${API_BASE_URL}/batches-management`;
      
      const response = await axiosInstance.post(url, batchData);
      
      console.log('✅ [BatchManagementService] Batch created:', response.data);
      
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'Create batch success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error creating batch:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to create batch',
        data: null,
      };
    }
  }

  /**
   * Update batch
   * @param {number} batchId - Batch ID
   * @param {Object} batchData - Batch data to update
   * @param {number} batchData.invoiceNumber - Invoice number
   * @param {number} batchData.amount - Amount
   * @param {string} batchData.dueDate - Due date (ISO string)
   * @returns {Promise<Object>} Updated batch data
   */
  async updateBatch(batchId, batchData) {
    try {
      if (!batchId) {
        return { success: false, error: 'batchId is required', data: null };
      }

      console.log('🔄 [BatchManagementService] Updating batch:', { batchId, batchData });
      
      const url = `${API_BASE_URL}/batches-management/${batchId}`;
      
      const response = await axiosInstance.patch(url, batchData);
      
      console.log('✅ [BatchManagementService] Batch updated:', response.data);
      
      return {
        success: true,
        data: response.data?.data || null,
        message: response.data?.message || 'Update batch success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error updating batch:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to update batch',
        data: null,
      };
    }
  }

  /**
   * Delete batch
   * @param {number} batchId - Batch ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteBatch(batchId) {
    try {
      if (!batchId) {
        return { success: false, error: 'batchId is required' };
      }

      console.log('🔄 [BatchManagementService] Deleting batch:', { batchId });
      
      const url = `${API_BASE_URL}/batches-management/${batchId}`;
      
      const response = await axiosInstance.delete(url);
      
      console.log('✅ [BatchManagementService] Batch deleted:', response.data);
      
      return {
        success: true,
        message: response.data?.message || 'Delete batch success',
      };
    } catch (error) {
      console.error('❌ [BatchManagementService] Error deleting batch:', error);
      console.error('❌ [BatchManagementService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || error.response?.data?.error || 'Failed to delete batch',
      };
    }
  }
}

export default new BatchManagementService();
