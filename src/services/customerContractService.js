import api from './api/axiosInstance';
import { Platform } from 'react-native';

const ENDPOINTS = {
  BASE: '/customer-contract',
  LIST_BY_AGENCY: (agencyId) => `/customer-contract/list/${agencyId}`,
  DETAIL: (customerContractId) => `/customer-contract/detail/${customerContractId}`,
  UPDATE: (customerContractId) => `/customer-contract/${customerContractId}`,
  DELETE: (customerContractId) => `/customer-contract/${customerContractId}`,
  UPLOAD_DOCUMENT: (contractId) => `/images/customer-contract-document/${contractId}`,
};

class CustomerContractService {
  /**
   * Get all customer contracts for an agency
   * @param {number} agencyId - Agency ID (required, path parameter)
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {number} params.staffId - Filter by staff ID
   * @param {number} params.customerId - Filter by customer ID
   * @param {string} params.status - Filter by status (PENDING, CONFIRMED, PROCESSING, DELIVERED, COMPLETED)
   * @param {string} params.contractType - Filter by contract type (FULL, DEBT)
   * @returns {Promise<Object>} Response with data and paginationInfo
   */
  async getCustomerContracts(agencyId, params = {}) {
    try {
      const queryParams = {};
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      if (params.staffId !== undefined && params.staffId !== null) queryParams.staffId = params.staffId;
      if (params.customerId !== undefined && params.customerId !== null) queryParams.customerId = params.customerId;
      if (params.status !== undefined && params.status !== null && params.status !== 'all') queryParams.status = params.status;
      if (params.contractType !== undefined && params.contractType !== null && params.contractType !== 'all') queryParams.contractType = params.contractType;

      const response = await api.get(ENDPOINTS.LIST_BY_AGENCY(agencyId), { params: queryParams });
      const contracts = response.data?.data || [];
      const pagination = response.data?.paginationInfo || {};
      return { success: true, data: contracts, pagination: pagination };
    } catch (error) {
      console.error('Error fetching customer contracts:', error);
      return { success: false, data: [], pagination: {}, error: error.response?.data?.message || 'Failed to fetch customer contracts' };
    }
  }

  /**
   * Get customer contract detail by ID
   * @param {number} customerContractId - Contract ID
   * @returns {Promise<Object>} Contract detail
   */
  async getCustomerContractDetail(customerContractId) {
    try {
      const response = await api.get(ENDPOINTS.DETAIL(customerContractId));
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.error('Error fetching customer contract detail:', error);
      return { success: false, data: null, error: error.response?.data?.message || 'Failed to fetch customer contract detail' };
    }
  }

  /**
   * Create a new customer contract
   * @param {Object} contractData - Contract data
   * @returns {Promise<Object>} Created contract
   */
  async createCustomerContract(contractData) {
    try {
      const response = await api.post(ENDPOINTS.BASE, contractData);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.error('Error creating customer contract:', error);
      return { success: false, data: null, error: error.response?.data?.message || 'Failed to create customer contract' };
    }
  }

  /**
   * Update a customer contract
   * @param {number} customerContractId - Contract ID
   * @param {Object} contractData - Updated contract data
   * @returns {Promise<Object>} Updated contract
   */
  async updateCustomerContract(customerContractId, contractData) {
    try {
      const response = await api.patch(ENDPOINTS.UPDATE(customerContractId), contractData);
      return { success: true, data: response.data?.data || response.data };
    } catch (error) {
      console.error('Error updating customer contract:', error);
      return { success: false, data: null, error: error.response?.data?.message || 'Failed to update customer contract' };
    }
  }

  /**
   * Delete a customer contract
   * @param {number} customerContractId - Contract ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteCustomerContract(customerContractId) {
    try {
      const response = await api.delete(ENDPOINTS.DELETE(customerContractId));
      // Response structure: { statusCode: 200, message: "Delete customer contract success", data: {} }
      // Axios wraps the response, so the actual data is in response.data
      const responseData = response.data;
      
      // If we got here without an exception, the HTTP request was successful
      // Check if the API response indicates success (statusCode 200 or message exists)
      if (responseData && (responseData.statusCode === 200 || responseData.message)) {
        return {
          success: true,
          data: responseData.data || {},
          message: responseData.message || 'Contract deleted successfully'
        };
      }
      
      // If response exists but no statusCode/message, still consider success (HTTP was successful)
      return {
        success: true,
        data: responseData?.data || responseData || {},
        message: responseData?.message || 'Contract deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting customer contract:', error);
      // Extract error message from various possible locations
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || 
                          errorData?.error || 
                          error.message || 
                          'Failed to delete customer contract';
      return {
        success: false,
        error: errorMessage,
        message: errorMessage
      };
    }
  }

  /**
   * Upload contract document images
   * @param {number} contractId - Contract ID
   * @param {string} documentType - Document type (e.g., "ID_CARD", "PASSPORT", etc.)
   * @param {Array} images - Array of image objects with { uri, type, name }
   * @returns {Promise<Object>} Upload result with image URLs
   */
  async uploadContractDocument(contractId, documentType, images) {
    try {
      const formData = new FormData();
      
      // Append documentType
      formData.append('documentType', documentType);
      
      // Append images
      images.forEach((image, index) => {
        // Get the correct URI format for the platform
        let imageUri = image.uri;
        if (Platform.OS === 'ios' && imageUri.startsWith('file://')) {
          imageUri = imageUri.replace('file://', '');
        } else if (Platform.OS === 'android' && !imageUri.startsWith('file://')) {
          imageUri = `file://${imageUri}`;
        }
        
        const fileData = {
          uri: imageUri,
          type: image.type || 'image/jpeg',
          name: image.name || `document_${index}_${Date.now()}.jpg`,
        };
        
        formData.append('documentImages', fileData);
      });

      const response = await api.post(
        ENDPOINTS.UPLOAD_DOCUMENT(contractId),
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return {
        success: true,
        data: response.data?.data || [],
        message: response.data?.message || 'Document images uploaded successfully',
      };
    } catch (error) {
      console.error('Error uploading contract document:', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload document images',
        message: 'Failed to upload document images',
      };
    }
  }
}

export default new CustomerContractService();
