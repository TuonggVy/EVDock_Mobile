import api from './api/axiosInstance';

// Endpoints for Installment Contract
const ENDPOINTS = {
  BASE: '/installment-contract',
  CREATE: '/installment-contract',
  GET_BY_CUSTOMER_CONTRACT: (customerContractId) => `/installment-contract/customer-contract/${customerContractId}`,
  GET_INSTALLMENT_CONTRACT_BY_CUSTOMER_CONTRACT: (customerContractId) => `/installment-contract/installment-contract/customer-contract/${customerContractId}`,
  GET_DETAIL: (installmentContractId) => `/installment-contract/installment-contract/detail/${installmentContractId}`,
  UPDATE: (installmentContractId) => `/installment-contract/installment-contract/update/${installmentContractId}`,
  DELETE: (installmentContractId) => `/installment-contract/installment-contract/delete/${installmentContractId}`,
  // Installment Payment endpoints
  GENERATE_INTEREST_PAYMENTS: (installmentContractId) => `/installment-contract/generate/interest-payments/${installmentContractId}`,
  GET_PAYMENT_DETAIL: (installmentPaymentId) => `/installment-contract/installlment-payment/detail/${installmentPaymentId}`,
  UPDATE_PAYMENT: (installmentPaymentId) => `/installment-contract/installment-payment/update/${installmentPaymentId}`,
  DELETE_PAYMENT: (installmentPaymentId) => `/installment-contract/installment-payment/delete/${installmentPaymentId}`,
};

class InstallmentContractService {
  /**
   * Create installment contract
   * @param {Object} payload - Contract data
   * @param {string} payload.startDate - Start date in ISO format
   * @param {number} payload.penaltyValue - Penalty value
   * @param {string} payload.penaltyType - Penalty type (FIXED/PERCENT)
   * @param {string} payload.status - Status (ACTIVE/INACTIVE)
   * @param {number} payload.customerContractId - Customer contract ID
   * @param {number} payload.installmentPlanId - Installment plan ID
   * @returns {Promise<Object>} Created contract data
   */
  async createInstallmentContract(payload) {
    try {
      const response = await api.post(ENDPOINTS.CREATE, payload);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Installment contract created successfully',
      };
    } catch (error) {
      console.error('Error creating installment contract:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create installment contract',
        data: null,
      };
    }
  }

  /**
   * Get installment contracts by customer contract ID
   * @param {number} customerContractId - Customer contract ID
   * @returns {Promise<Object>} Installment contracts data
   */
  async getInstallmentContractsByCustomerContract(customerContractId) {
    try {
      const response = await api.get(ENDPOINTS.GET_BY_CUSTOMER_CONTRACT(customerContractId));
      // Handle both array and single object response
      const data = response.data?.data || response.data;
      const contracts = Array.isArray(data) ? data : [data].filter(item => item);
      return {
        success: true,
        data: contracts,
        message: response.data?.message || 'Get installment contracts success',
      };
    } catch (error) {
      console.error('Error fetching installment contracts:', error);
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || 'Failed to fetch installment contracts',
      };
    }
  }

  /**
   * Get installment contract by customer contract ID (single contract)
   * @param {number} customerContractId - Customer contract ID
   * @returns {Promise<Object>} Installment contract data
   */
  async getInstallmentContractByCustomerContract(customerContractId) {
    try {
      const response = await api.get(ENDPOINTS.GET_INSTALLMENT_CONTRACT_BY_CUSTOMER_CONTRACT(customerContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Get installment contract success',
      };
    } catch (error) {
      // 404 is expected when no installment contract exists, don't log as error
      if (error.response?.status === 404) {
        return {
          success: false,
          data: null,
          error: null, // No error message for 404
        };
      }
      console.error('Error fetching installment contract:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch installment contract',
      };
    }
  }

  /**
   * Get installment contract detail by ID
   * @param {number} installmentContractId - Installment contract ID
   * @returns {Promise<Object>} Installment contract detail data
   */
  async getInstallmentContractDetail(installmentContractId) {
    try {
      const response = await api.get(ENDPOINTS.GET_DETAIL(installmentContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Get installment contract detail success',
      };
    } catch (error) {
      console.error('Error fetching installment contract detail:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch installment contract detail',
      };
    }
  }

  /**
   * Update installment contract
   * @param {number} installmentContractId - Installment contract ID
   * @param {Object} payload - Update data
   * @param {number} payload.penaltyValue - Penalty value
   * @param {string} payload.penaltyType - Penalty type (FIXED/PERCENT)
   * @param {string} payload.status - Status (ACTIVE/INACTIVE)
   * @returns {Promise<Object>} Updated contract data
   */
  async updateInstallmentContract(installmentContractId, payload) {
    try {
      const response = await api.patch(ENDPOINTS.UPDATE(installmentContractId), payload);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Update installment contract success',
      };
    } catch (error) {
      console.error('Error updating installment contract:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update installment contract',
        data: null,
      };
    }
  }

  /**
   * Delete installment contract
   * @param {number} installmentContractId - Installment contract ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteInstallmentContract(installmentContractId) {
    try {
      const response = await api.delete(ENDPOINTS.DELETE(installmentContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Delete installment contract success',
      };
    } catch (error) {
      console.error('Error deleting installment contract:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete installment contract',
        data: null,
      };
    }
  }

  /**
   * Generate interest payments for an installment contract
   * @param {number} installmentContractId - Installment contract ID
   * @returns {Promise<Object>} Generate result
   */
  async generateInterestPayments(installmentContractId) {
    try {
      const response = await api.post(ENDPOINTS.GENERATE_INTEREST_PAYMENTS(installmentContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Create interest payments success',
      };
    } catch (error) {
      console.error('Error generating interest payments:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to generate interest payments',
        data: null,
      };
    }
  }

  /**
   * Get installment payment detail by ID
   * @param {number} installmentPaymentId - Installment payment ID
   * @returns {Promise<Object>} Payment detail data
   */
  async getInstallmentPaymentDetail(installmentPaymentId) {
    try {
      const response = await api.get(ENDPOINTS.GET_PAYMENT_DETAIL(installmentPaymentId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Get installment payment detail success',
      };
    } catch (error) {
      console.error('Error fetching installment payment detail:', error);
      return {
        success: false,
        data: null,
        error: error.response?.data?.message || 'Failed to fetch installment payment detail',
      };
    }
  }

  /**
   * Update installment payment
   * @param {number} installmentPaymentId - Installment payment ID
   * @param {Object} payload - Update data
   * @returns {Promise<Object>} Updated payment data
   */
  async updateInstallmentPayment(installmentPaymentId, payload) {
    try {
      const response = await api.patch(ENDPOINTS.UPDATE_PAYMENT(installmentPaymentId), payload);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Update installment contract success',
      };
    } catch (error) {
      console.error('Error updating installment payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update installment payment',
        data: null,
      };
    }
  }

  /**
   * Delete installment payment
   * @param {number} installmentPaymentId - Installment payment ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteInstallmentPayment(installmentPaymentId) {
    try {
      const response = await api.delete(ENDPOINTS.DELETE_PAYMENT(installmentPaymentId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Delete installment payment success',
      };
    } catch (error) {
      console.error('Error deleting installment payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete installment payment',
        data: null,
      };
    }
  }
}

const installmentContractService = new InstallmentContractService();
export default installmentContractService;
