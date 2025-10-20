// EVM Promotion Service - Service for managing B2B promotions (Hãng xe cho Dealer)
// This service handles B2B promotions created by EVM Admin for dealers

import { API_BASE_URL } from '../config/api';

// Mock B2B promotion data - will be replaced with API calls
const MOCK_B2B_PROMOTIONS = [
  {
    id: '1',
    code: 'B2B_SUMMER2024',
    name: 'Summer Wholesale Discount 2024',
    description: 'Giảm giá 15% cho đại lý nhập xe Tesla Model Y',
    type: 'percentage',
    value: 15,
    minOrderValue: 1000000000, // 1 tỷ VND minimum order
    maxDiscount: 50000000, // 50 triệu VND max discount
    startDate: '2024-06-01',
    endDate: '2024-08-31',
    status: 'active',
    usageLimit: 1000,
    usedCount: 234,
    applicableDealers: ['Dealer A', 'Dealer B', 'Dealer C'],
    targetAudience: 'dealers', // B2B specific
    promotionType: 'wholesale_discount', // B2B specific
    minQuantity: 5, // Minimum 5 vehicles
    vehicleModels: ['Model Y', 'Model 3'],
    createdAt: '2024-05-15',
    createdBy: 'EVM Admin'
  },
  {
    id: '2',
    code: 'B2B_NEWDEALER',
    name: 'New Dealer Welcome Program',
    description: 'Ưu đãi đặc biệt cho đại lý mới gia nhập',
    type: 'fixed',
    value: 50000000, // 50 triệu VND fixed discount
    minOrderValue: 2000000000, // 2 tỷ VND minimum
    maxDiscount: 50000000,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    usageLimit: 50,
    usedCount: 12,
    applicableDealers: ['All New Dealers'],
    targetAudience: 'dealers',
    promotionType: 'new_dealer_bonus',
    minQuantity: 10,
    vehicleModels: ['All Models'],
    createdAt: '2024-01-01',
    createdBy: 'EVM Admin'
  },
  {
    id: '3',
    code: 'B2B_BULK2024',
    name: 'Bulk Purchase Incentive',
    description: 'Khuyến mãi cho đại lý mua số lượng lớn',
    type: 'percentage',
    value: 20,
    minOrderValue: 5000000000, // 5 tỷ VND
    maxDiscount: 200000000, // 200 triệu VND
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'active',
    usageLimit: 100,
    usedCount: 45,
    applicableDealers: ['All Dealers'],
    targetAudience: 'dealers',
    promotionType: 'bulk_purchase',
    minQuantity: 20,
    vehicleModels: ['All Models'],
    createdAt: '2024-01-01',
    createdBy: 'EVM Admin'
  },
  {
    id: '4',
    code: 'B2B_Q4_TARGET',
    name: 'Q4 Sales Target Achievement',
    description: 'Khuyến mãi đạt mục tiêu Q4',
    type: 'percentage',
    value: 12,
    minOrderValue: 3000000000, // 3 tỷ VND
    maxDiscount: 150000000, // 150 triệu VND
    startDate: '2024-10-01',
    endDate: '2024-12-31',
    status: 'scheduled',
    usageLimit: 200,
    usedCount: 0,
    applicableDealers: ['All Dealers'],
    targetAudience: 'dealers',
    promotionType: 'quarterly_target',
    minQuantity: 15,
    vehicleModels: ['Model S', 'Model X'],
    createdAt: '2024-09-15',
    createdBy: 'EVM Admin'
  }
];

// EVM Promotion Service for B2B promotions
export const evmPromotionService = {
  // Get all B2B promotions (for EVM Admin management)
  async getB2BPromotions() {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b`);
      // const data = await response.json();
      // return data;
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: MOCK_B2B_PROMOTIONS,
        total: MOCK_B2B_PROMOTIONS.length,
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error fetching B2B promotions:', error);
      return {
        success: false,
        error: 'Failed to fetch B2B promotions',
        data: [],
        total: 0,
        type: 'b2b'
      };
    }
  },

  // Get active B2B promotions (for dealers to view)
  async getActiveB2BPromotions() {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b/active`);
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      const activePromotions = MOCK_B2B_PROMOTIONS.filter(promo => promo.status === 'active');
      
      return {
        success: true,
        data: activePromotions,
        total: activePromotions.length,
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error fetching active B2B promotions:', error);
      return {
        success: false,
        error: 'Failed to fetch active B2B promotions',
        data: [],
        total: 0,
        type: 'b2b'
      };
    }
  },

  // Get B2B promotion by code
  async getB2BPromotionByCode(code) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const promotion = MOCK_B2B_PROMOTIONS.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (!promotion) {
      return {
        success: false,
        error: 'B2B Promotion not found',
        type: 'b2b'
      };
    }

    return {
      success: true,
      data: promotion,
      type: 'b2b'
    };
  },

  // Validate B2B promotion code for dealer orders
  async validateB2BPromotionCode(code, orderAmount = 0, quantity = 0) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b/validate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ code, orderAmount, quantity }),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const promotion = MOCK_B2B_PROMOTIONS.find(p => 
        p.code.toLowerCase() === code.toLowerCase() && p.status === 'active'
      );
      
      if (!promotion) {
        return {
          success: false,
          error: 'Mã khuyến mãi B2B không tồn tại hoặc đã hết hạn',
          type: 'b2b'
        };
      }

      // Check if promotion is still valid
      const now = new Date();
      const validFrom = new Date(promotion.startDate);
      const validTo = new Date(promotion.endDate);
      
      if (now < validFrom || now > validTo) {
        return {
          success: false,
          error: 'Mã khuyến mãi B2B đã hết hạn',
          type: 'b2b'
        };
      }

      // Check usage limit
      if (promotion.usedCount >= promotion.usageLimit) {
        return {
          success: false,
          error: 'Mã khuyến mãi B2B đã hết lượt sử dụng',
          type: 'b2b'
        };
      }

      // Check minimum order amount
      if (orderAmount < promotion.minOrderValue) {
        return {
          success: false,
          error: `Đơn hàng tối thiểu ${formatPrice(promotion.minOrderValue)} để sử dụng mã này`,
          type: 'b2b'
        };
      }

      // Check minimum quantity for B2B promotions
      if (quantity < promotion.minQuantity) {
        return {
          success: false,
          error: `Số lượng tối thiểu ${promotion.minQuantity} xe để sử dụng mã này`,
          type: 'b2b'
        };
      }

      return {
        success: true,
        data: promotion,
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error validating B2B promotion code:', error);
      return {
        success: false,
        error: 'Lỗi khi kiểm tra mã khuyến mãi B2B',
        type: 'b2b'
      };
    }
  },

  // Calculate B2B discount amount
  calculateB2BDiscount(promotion, orderAmount) {
    if (!promotion || !promotion.status === 'active') {
      return 0;
    }

    let discountAmount = 0;

    if (promotion.type === 'percentage') {
      discountAmount = (orderAmount * promotion.value) / 100;
    } else if (promotion.type === 'fixed') {
      discountAmount = promotion.value;
    }

    // Apply maximum discount limit
    if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
      discountAmount = promotion.maxDiscount;
    }

    return Math.round(discountAmount);
  },

  // Create new B2B promotion (for EVM Admin)
  async createB2BPromotion(promotionData) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(promotionData),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newPromotion = {
        ...promotionData,
        id: Date.now().toString(),
        usedCount: 0,
        createdAt: new Date().toISOString().split('T')[0],
        createdBy: 'EVM Admin',
        targetAudience: 'dealers',
        type: 'b2b'
      };
      
      MOCK_B2B_PROMOTIONS.unshift(newPromotion);
      
      return {
        success: true,
        data: newPromotion,
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error creating B2B promotion:', error);
      return {
        success: false,
        error: 'Failed to create B2B promotion',
        type: 'b2b'
      };
    }
  },

  // Update B2B promotion (for EVM Admin)
  async updateB2BPromotion(promotionId, promotionData) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b/${promotionId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(promotionData),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const promotionIndex = MOCK_B2B_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'B2B Promotion not found',
          type: 'b2b'
        };
      }

      MOCK_B2B_PROMOTIONS[promotionIndex] = {
        ...MOCK_B2B_PROMOTIONS[promotionIndex],
        ...promotionData,
        id: promotionId, // Keep original ID
        targetAudience: 'dealers',
        type: 'b2b'
      };
      
      return {
        success: true,
        data: MOCK_B2B_PROMOTIONS[promotionIndex],
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error updating B2B promotion:', error);
      return {
        success: false,
        error: 'Failed to update B2B promotion',
        type: 'b2b'
      };
    }
  },

  // Delete B2B promotion (for EVM Admin)
  async deleteB2BPromotion(promotionId) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b/${promotionId}`, {
      //   method: 'DELETE',
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const promotionIndex = MOCK_B2B_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'B2B Promotion not found',
          type: 'b2b'
        };
      }

      MOCK_B2B_PROMOTIONS.splice(promotionIndex, 1);
      
      return {
        success: true,
        message: 'B2B Promotion deleted successfully',
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error deleting B2B promotion:', error);
      return {
        success: false,
        error: 'Failed to delete B2B promotion',
        type: 'b2b'
      };
    }
  },

  // Use B2B promotion (increment usage count) - for dealer orders
  async useB2BPromotion(promotionId, orderId) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/b2b/${promotionId}/use`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ orderId }),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const promotionIndex = MOCK_B2B_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'B2B Promotion not found',
          type: 'b2b'
        };
      }

      MOCK_B2B_PROMOTIONS[promotionIndex].usedCount += 1;

      return {
        success: true,
        data: MOCK_B2B_PROMOTIONS[promotionIndex],
        type: 'b2b'
      };
    } catch (error) {
      console.error('Error using B2B promotion:', error);
      return {
        success: false,
        error: 'Failed to use B2B promotion',
        type: 'b2b'
      };
    }
  },

  // Search B2B promotions
  async searchB2BPromotions(query) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const filteredPromotions = MOCK_B2B_PROMOTIONS.filter(promo => 
      promo.code.toLowerCase().includes(query.toLowerCase()) ||
      promo.name.toLowerCase().includes(query.toLowerCase()) ||
      promo.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filteredPromotions,
      total: filteredPromotions.length,
      query,
      type: 'b2b'
    };
  },
};

// Helper functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const formatB2BDiscountValue = (promotion) => {
  if (promotion.type === 'percentage') {
    return `${promotion.value}%`;
  } else {
    return formatPrice(promotion.value);
  }
};

export const isB2BPromotionValid = (promotion) => {
  if (!promotion || promotion.status !== 'active') return false;
  
  const now = new Date();
  const validFrom = new Date(promotion.startDate);
  const validTo = new Date(promotion.endDate);
  
  return now >= validFrom && now <= validTo && promotion.usedCount < promotion.usageLimit;
};

export default evmPromotionService;
