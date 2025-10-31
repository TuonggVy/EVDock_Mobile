// Promotion Service - Real API integration for promotion management
// Used by EVM Admin to manage promotions for motorbikes

import axiosInstance from './api/axiosInstance';

const API_BASE_URL = '';

class PromotionService {
  // Get all promotions
  async getAllPromotions(page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/promotion/list`, {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo,
        message: response.data.message || 'Get promotion list successfully!'
      };
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch promotions',
        data: [],
        message: 'Failed to fetch promotions'
      };
    }
  }

  // Get promotion detail by ID
  async getPromotionDetail(promotionId) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/promotion/detail/${promotionId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Get promotion detail successfully!'
      };
    } catch (error) {
      console.error('Error fetching promotion detail:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch promotion detail',
        message: 'Failed to fetch promotion detail'
      };
    }
  }

  // Create new promotion
  async createPromotion(promotionData) {
    try {
      // Use valueType as returned by the API (camelCase)
      const requestData = {
        name: promotionData.name,
        description: promotionData.description,
        valueType: promotionData.valueType, // PERCENT or FIXED
        value: promotionData.value,
        startAt: promotionData.startAt,
        endAt: promotionData.endAt,
        status: promotionData.status, // ACTIVE or INACTIVE
      };

      // Only add motorbikeId if it's not null/undefined (for specific motorbike promotions)
      if (promotionData.motorbikeId) {
        requestData.motorbikeId = promotionData.motorbikeId;
      }

      console.log('Creating promotion with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.post(`${API_BASE_URL}/promotion`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Create promotion successfully!'
      };
    } catch (error) {
      console.error('Error creating promotion:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to create promotion',
        errorDetails: error.response?.data,
        message: 'Failed to create promotion'
      };
    }
  }

  // Update promotion
  async updatePromotion(promotionId, promotionData) {
    try {
      // Use valueType as returned by the API (camelCase)
      const requestData = {
        name: promotionData.name,
        description: promotionData.description,
        valueType: promotionData.valueType,
        value: promotionData.value,
        startAt: promotionData.startAt,
        endAt: promotionData.endAt,
        status: promotionData.status,
      };

      // Only add motorbikeId if it's not null/undefined (for specific motorbike promotions)
      if (promotionData.motorbikeId) {
        requestData.motorbikeId = promotionData.motorbikeId;
      }

      console.log('Updating promotion with data:', JSON.stringify(requestData, null, 2));

      const response = await axiosInstance.patch(`${API_BASE_URL}/promotion/${promotionId}`, requestData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Update promotion successfully!'
      };
    } catch (error) {
      console.error('Error updating promotion:', error);
      console.error('Error details:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update promotion',
        errorDetails: error.response?.data,
        message: 'Failed to update promotion'
      };
    }
  }

  // Delete promotion
  async deletePromotion(promotionId) {
    try {
      const response = await axiosInstance.delete(`${API_BASE_URL}/promotion/${promotionId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Delete promotion successfully!'
      };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete promotion',
        message: 'Failed to delete promotion'
      };
    }
  }

  // Get promotions for agency (dealer view)
  async getAgencyPromotions(page = 1, limit = 10) {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/promotion/agency/list`, {
        params: { page, limit }
      });
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo,
        message: response.data.message || 'Get promotion list for agency successfully!'
      };
    } catch (error) {
      console.error('Error fetching agency promotions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch agency promotions',
        data: [],
        message: 'Failed to fetch agency promotions'
      };
    }
  }

  // Get stock promotions by agency with status filter (ACTIVE required to use)
  async getStockPromotionsByAgency(agencyId, { page = 1, limit = 10, status = 'ACTIVE', valueType } = {}) {
    try {
      if (!agencyId) {
        return { success: false, error: 'agencyId is required', data: [] };
      }
      const params = { page, limit, status };
      if (valueType) params.valueType = valueType;
      const response = await axiosInstance.get(`${API_BASE_URL}/stock-promotion/list/${agencyId}`, { params });
      return {
        success: true,
        data: response.data?.data || response.data || [],
        pagination: response.data?.paginationInfo,
        message: response.data?.message || 'Get stock promotion list successfully!',
      };
    } catch (error) {
      console.error('Error fetching stock promotions:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch stock promotions',
        data: [],
      };
    }
  }

  // Format value display based on type
  formatValue(value, valueType) {
    if (valueType === 'PERCENT') {
      return `${value}%`;
    } else if (valueType === 'FIXED') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(value);
    }
    return value;
  }

  // Validate promotion data before submission
  validatePromotion(promotionData) {
    const errors = {};
    
    if (!promotionData.name || promotionData.name.trim().length === 0) {
      errors.name = 'Promotion name is required';
    }
    
    if (!promotionData.description || promotionData.description.trim().length === 0) {
      errors.description = 'Description is required';
    }
    
    if (!promotionData.valueType || !['PERCENT', 'FIXED'].includes(promotionData.valueType)) {
      errors.valueType = 'Value type must be PERCENT or FIXED';
    }
    
    if (!promotionData.value || promotionData.value <= 0) {
      errors.value = 'Value must be greater than 0';
    }
    
    if (promotionData.valueType === 'PERCENT' && promotionData.value > 100) {
      errors.value = 'Percentage cannot exceed 100%';
    }
    
    if (!promotionData.startAt) {
      errors.startAt = 'Start date is required';
    }
    
    if (!promotionData.endAt) {
      errors.endAt = 'End date is required';
    }
    
    if (promotionData.startAt && promotionData.endAt && new Date(promotionData.startAt) >= new Date(promotionData.endAt)) {
      errors.endAt = 'End date must be after start date';
    }
    
    if (!promotionData.status || !['ACTIVE', 'INACTIVE'].includes(promotionData.status)) {
      errors.status = 'Status must be ACTIVE or INACTIVE';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new PromotionService();
