import axiosInstance from './api/axiosInstance';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Discount Service
export const discountService = {
  // Get all discounts with pagination
  getDiscounts: async (page = 1, limit = 10) => {
    try {
      await delay(300);
      console.log('🔄 [DiscountService] Fetching discounts:', { page, limit });
      
      const response = await axiosInstance.get('/discount/list', {
        params: { page, limit }
      });
      
      console.log('✅ [DiscountService] Discounts fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo || {}
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error fetching discounts:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Handle 403 specifically
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền truy cập danh sách giảm giá. Vui lòng kiểm tra quyền của tài khoản.',
          data: []
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải danh sách discount',
        data: []
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
  getAgencyDiscounts: async (agencyId, page = 1, limit = 10, type) => {
    try {
      await delay(300);
      if (!agencyId) {
        return { success: false, error: 'Thiếu agencyId', data: [] };
      }
      console.log('🔄 [DiscountService] Fetching agency discounts:', { agencyId, page, limit, type });
      const response = await axiosInstance.get(`/discount/agency/list/${agencyId}`, {
        params: { page, limit, ...(type ? { type } : {}) }
      });
      console.log('✅ [DiscountService] Agency discounts fetched:', response.data);
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo || {}
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error fetching agency discounts:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      if (error.response?.status === 403) {
        return { success: false, error: 'Không có quyền truy cập discount của đại lý.', data: [] };
      }
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải danh sách discount của đại lý',
        data: []
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

