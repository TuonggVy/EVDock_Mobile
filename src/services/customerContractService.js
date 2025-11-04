import api from './api/axiosInstance';

const ENDPOINTS = {
  BASE: '/customer-contract',
  LIST_BY_AGENCY: (agencyId) => `/customer-contract/list/${agencyId}`,
  DETAIL: (customerContractId) => `/customer-contract/detail/${customerContractId}`,
  UPDATE: (customerContractId) => `/customer-contract/${customerContractId}`,
  DELETE: (customerContractId) => `/customer-contract/${customerContractId}`,
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
      return { success: true, data: response.data?.data || {} };
    } catch (error) {
      console.error('Error deleting customer contract:', error);
      return { success: false, error: error.response?.data?.message || 'Failed to delete customer contract' };
    }
  }
}

export default new CustomerContractService();
