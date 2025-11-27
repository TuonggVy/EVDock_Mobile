// Price Policy Service - Real API integration for price policy management
// Used by EVM Admin to manage wholesale prices for agencies with different motorbikes

import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

class PricePolicyService {
  // Get all price policies with pagination
  async getAllPricePolicies(page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/price/list`, {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {},
        message: response.data.message || 'Get list price policies success'
      };
    } catch (error) {
      console.error('Error fetching price policies:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch price policies',
        data: [],
        message: 'Failed to fetch price policies'
      };
    }
  }

  // Get price policy detail by ID
  async getPricePolicyDetail(pricePolicyId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/price/detail/${pricePolicyId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Get price policy detail success'
      };
    } catch (error) {
      console.error('Error fetching price policy detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch price policy detail',
        message: 'Failed to fetch price policy detail'
      };
    }
  }

  // Create new price policy
  async createPricePolicy(pricePolicyData) {
    try {
      const requestData = {
        title: pricePolicyData.title,
        content: pricePolicyData.content,
        policy: pricePolicyData.policy,
        wholesalePrice: parseFloat(pricePolicyData.wholesalePrice),
        agencyId: parseInt(pricePolicyData.agencyId),
        motorbikeId: parseInt(pricePolicyData.motorbikeId),
      };

      console.log('Creating price policy with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post(`${API_BASE_URL}/price`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Create price policy success'
      };
    } catch (error) {
      console.error('Error creating price policy:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create price policy',
        errorDetails: error.response?.data,
        message: 'Failed to create price policy'
      };
    }
  }

  // Update price policy
  async updatePricePolicy(pricePolicyId, pricePolicyData) {
    try {
      const requestData = {
        title: pricePolicyData.title,
        content: pricePolicyData.content,
        policy: pricePolicyData.policy,
        wholesalePrice: parseFloat(pricePolicyData.wholesalePrice),
        agencyId: parseInt(pricePolicyData.agencyId),
        motorbikeId: parseInt(pricePolicyData.motorbikeId),
      };

      console.log('Updating price policy with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.patch(`${API_BASE_URL}/price/${pricePolicyId}`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Update price policy success!'
      };
    } catch (error) {
      console.error('Error updating price policy:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update price policy',
        errorDetails: error.response?.data,
        message: 'Failed to update price policy'
      };
    }
  }

  // Delete price policy
  async deletePricePolicy(pricePolicyId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/price/${pricePolicyId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Delete price policy success!'
      };
    } catch (error) {
      console.error('Error deleting price policy:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete price policy',
        message: 'Failed to delete price policy'
      };
    }
  }

  // Format price display
  formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  }

  // Validate price policy data before submission
  validatePricePolicy(pricePolicyData) {
    const errors = {};
    
    if (!pricePolicyData.title || pricePolicyData.title.trim().length === 0) {
      errors.title = 'Title is required';
    }
    
    if (!pricePolicyData.content || pricePolicyData.content.trim().length === 0) {
      errors.content = 'Content is required';
    }
    
    if (!pricePolicyData.policy || pricePolicyData.policy.trim().length === 0) {
      errors.policy = 'Policy is required';
    }
    
    if (!pricePolicyData.wholesalePrice || parseFloat(pricePolicyData.wholesalePrice) <= 0) {
      errors.wholesalePrice = 'Wholesale price must be greater than 0';
    }
    
    if (!pricePolicyData.agencyId) {
      errors.agencyId = 'Agency is required';
    }
    
    if (!pricePolicyData.motorbikeId) {
      errors.motorbikeId = 'Motorbike is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new PricePolicyService();

