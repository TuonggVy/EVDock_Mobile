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
      console.log('🔄 [DiscountService] Fetching discount detail:', { discountId });
      
      const response = await axiosInstance.get(`/discount/detail/${discountId}`);
      
      console.log('✅ [DiscountService] Discount detail fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error fetching discount detail:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền truy cập chi tiết giảm giá. Vui lòng kiểm tra quyền của tài khoản.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải chi tiết discount'
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
      console.log('🔄 [DiscountService] Fetching motorbike discounts:', { motorbikeId, page, limit });
      
      const response = await axiosInstance.get(`/discount/agency/motorbike/list/${motorbikeId}`, {
        params: { page, limit }
      });
      
      console.log('✅ [DiscountService] Motorbike discounts fetched:', response.data);
      
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.paginationInfo || {}
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error fetching motorbike discounts:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền truy cập discount theo xe máy.',
          data: []
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tải danh sách discount theo xe máy',
        data: []
      };
    }
  },

  // Create a new discount
  createDiscount: async (discountData) => {
    try {
      await delay(500);
      console.log('🔄 [DiscountService] Creating discount:', discountData);
      
      const response = await axiosInstance.post('/discount', discountData);
      
      console.log('✅ [DiscountService] Discount created:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error creating discount:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền tạo discount mới. Vui lòng kiểm tra quyền của tài khoản.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tạo discount mới'
      };
    }
  },

  // Update discount
  updateDiscount: async (discountId, updateData) => {
    try {
      await delay(500);
      console.log('🔄 [DiscountService] Updating discount:', { discountId, updateData });
      
      const response = await axiosInstance.patch(`/discount/${discountId}`, updateData);
      
      console.log('✅ [DiscountService] Discount updated:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error updating discount:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền cập nhật discount. Vui lòng kiểm tra quyền của tài khoản.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể cập nhật discount'
      };
    }
  },

  // Delete discount
  deleteDiscount: async (discountId) => {
    try {
      await delay(300);
      console.log('🔄 [DiscountService] Deleting discount:', { discountId });
      
      const response = await axiosInstance.delete(`/discount/${discountId}`);
      
      console.log('✅ [DiscountService] Discount deleted:', response.data);
      
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('❌ [DiscountService] Error deleting discount:', error);
      console.error('❌ [DiscountService] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      if (error.response?.status === 403) {
        return {
          success: false,
          error: 'Không có quyền xóa discount. Vui lòng kiểm tra quyền của tài khoản.'
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể xóa discount'
      };
    }
  }
};

export default discountService;

