import { API_BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  try {
    const token = await getAuthToken();
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Discount Service
export const discountService = {
  // Get all discounts with pagination
  getDiscounts: async (page = 1, limit = 10) => {
    try {
      await delay(300);
      const data = await apiRequest(`/discount/list?page=${page}&limit=${limit}`, 'GET');
      
      return {
        success: true,
        data: data.data || [],
        pagination: data.paginationInfo || {}
      };
    } catch (error) {
      console.error('Error fetching discounts:', error);
      return {
        success: false,
        error: 'Không thể tải danh sách discount'
      };
    }
  },

  // Get discount detail by ID
  getDiscountDetail: async (discountId) => {
    try {
      await delay(300);
      const data = await apiRequest(`/discount/detail/${discountId}`, 'GET');
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching discount detail:', error);
      return {
        success: false,
        error: 'Không thể tải chi tiết discount'
      };
    }
  },

  // Get discounts for a specific agency
  getAgencyDiscounts: async (agencyId, page = 1, limit = 10) => {
    try {
      await delay(300);
      const data = await apiRequest(`/discount/agency/list/${agencyId}?page=${page}&limit=${limit}`, 'GET');
      
      return {
        success: true,
        data: data.data || [],
        pagination: data.paginationInfo || {}
      };
    } catch (error) {
      console.error('Error fetching agency discounts:', error);
      return {
        success: false,
        error: 'Không thể tải danh sách discount của đại lý'
      };
    }
  },

  // Get motorbike discounts for agency
  getMotorbikeDiscounts: async (motorbikeId, page = 1, limit = 10) => {
    try {
      await delay(300);
      const data = await apiRequest(`/discount/agency/motorbike/list/${motorbikeId}?page=${page}&limit=${limit}`, 'GET');
      
      return {
        success: true,
        data: data.data || [],
        pagination: data.paginationInfo || {}
      };
    } catch (error) {
      console.error('Error fetching motorbike discounts:', error);
      return {
        success: false,
        error: 'Không thể tải danh sách discount theo xe máy'
      };
    }
  },

  // Create a new discount
  createDiscount: async (discountData) => {
    try {
      await delay(500);
      const data = await apiRequest('/discount', 'POST', discountData);
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error creating discount:', error);
      return {
        success: false,
        error: 'Không thể tạo discount mới'
      };
    }
  },

  // Update discount
  updateDiscount: async (discountId, updateData) => {
    try {
      await delay(500);
      const data = await apiRequest(`/discount/${discountId}`, 'PATCH', updateData);
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error updating discount:', error);
      return {
        success: false,
        error: 'Không thể cập nhật discount'
      };
    }
  },

  // Delete discount
  deleteDiscount: async (discountId) => {
    try {
      await delay(300);
      const data = await apiRequest(`/discount/${discountId}`, 'DELETE');
      
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error deleting discount:', error);
      return {
        success: false,
        error: 'Không thể xóa discount'
      };
    }
  }
};

export default discountService;

