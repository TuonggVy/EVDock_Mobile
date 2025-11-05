// Credit Line Service - Real API integration for credit line management
// Used by EVM Admin to manage credit lines for agencies

import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

class CreditLineService {
  // Get all credit lines
  async getAllCreditLines(page = 1, limit = 10) {
    try {
      console.log('🔄 [CreditLineService] Fetching credit lines:', { page, limit });
      const response = await axiosInstance.get(`${API_BASE_URL}/credit-line/list`, {
        params: { page, limit }
      });
      console.log('✅ [CreditLineService] Credit lines fetched:', response.data);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo,
        message: response.data.message || 'Get credit line list successfully!'
      };
    } catch (error) {
      console.error('❌ [CreditLineService] Error fetching credit lines:', error);
      console.error('❌ [CreditLineService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch credit lines',
        data: [],
        message: 'Failed to fetch credit lines'
      };
    }
  }

  // Get credit line detail by ID
  async getCreditLineDetail(creditLineId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/credit-line/detail/${creditLineId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Get credit line detail successfully!'
      };
    } catch (error) {
      console.error('Error fetching credit line detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch credit line detail',
        message: 'Failed to fetch credit line detail'
      };
    }
  }

  // Get credit line by agency ID
  async getCreditLineByAgency(agencyId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/credit-line/agency/${agencyId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Get credit line by agency successfully!'
      };
    } catch (error) {
      console.error('Error fetching credit line by agency:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch credit line by agency',
        message: 'Failed to fetch credit line by agency'
      };
    }
  }

  // Create new credit line
  async createCreditLine(creditLineData) {
    try {
      const requestData = {
        creditLimit: parseFloat(creditLineData.creditLimit),
        warningThreshold: parseFloat(creditLineData.warningThreshold),
        overDueThreshHoldDays: parseInt(creditLineData.overDueThreshHoldDays),
        agencyId: parseInt(creditLineData.agencyId),
      };

      console.log('Creating credit line with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post(`${API_BASE_URL}/credit-line`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Create credit line successfully!'
      };
    } catch (error) {
      console.error('Error creating credit line:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create credit line',
        errorDetails: error.response?.data,
        message: 'Failed to create credit line'
      };
    }
  }

  // Update credit line
  async updateCreditLine(creditLineId, creditLineData) {
    try {
      const requestData = {};
      
      if (creditLineData.creditLimit !== undefined) {
        requestData.creditLimit = parseFloat(creditLineData.creditLimit);
      }
      if (creditLineData.warningThreshold !== undefined) {
        requestData.warningThreshold = parseFloat(creditLineData.warningThreshold);
      }
      if (creditLineData.overDueThreshHoldDays !== undefined) {
        requestData.overDueThreshHoldDays = parseInt(creditLineData.overDueThreshHoldDays);
      }
      if (creditLineData.isBlocked !== undefined) {
        requestData.isBlocked = creditLineData.isBlocked;
      }

      console.log('Updating credit line with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.patch(`${API_BASE_URL}/credit-line/${creditLineId}`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Update credit line successfully!'
      };
    } catch (error) {
      console.error('Error updating credit line:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update credit line',
        errorDetails: error.response?.data,
        message: 'Failed to update credit line'
      };
    }
  }

  // Delete credit line
  async deleteCreditLine(creditLineId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/credit-line/${creditLineId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Delete credit line successfully!'
      };
    } catch (error) {
      console.error('Error deleting credit line:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete credit line',
        message: 'Failed to delete credit line'
      };
    }
  }

  // Format credit limit for display
  formatCreditLimit(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }

  // Validate credit line data before submission
  validateCreditLine(creditLineData) {
    const errors = {};
    
    if (!creditLineData.agencyId) {
      errors.agencyId = 'Agency is required';
    }
    
    if (!creditLineData.creditLimit || creditLineData.creditLimit <= 0) {
      errors.creditLimit = 'Credit limit must be greater than 0';
    }
    
    if (!creditLineData.warningThreshold || creditLineData.warningThreshold < 0 || creditLineData.warningThreshold > 100) {
      errors.warningThreshold = 'Warning threshold must be between 0 and 100';
    }
    
    if (!creditLineData.overDueThreshHoldDays || creditLineData.overDueThreshHoldDays < 0) {
      errors.overDueThreshHoldDays = 'Overdue threshold days must be 0 or greater';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new CreditLineService();

