// Promotion Service - Service for managing promotions
// This service handles both mock data and real API calls for backend integration

import { API_BASE_URL } from '../config/api';

// Mock promotion data - will be replaced with API calls
const MOCK_PROMOTIONS = [
  {
    id: '1',
    code: 'SUMMER2024',
    name: 'Summer Sale 2024',
    description: 'Giảm giá mùa hè cho tất cả xe điện',
    discountType: 'percentage', // 'percentage' or 'fixed'
    discountValue: 15,
    minOrderAmount: 1000000,
    maxDiscount: 5000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 100,
    usedCount: 23,
    isActive: true,
    createdAt: '2024-05-15',
  },
  {
    id: '2',
    code: 'NEWCUSTOMER',
    name: 'Khách hàng mới',
    description: 'Ưu đãi đặc biệt cho khách hàng lần đầu',
    discountType: 'fixed',
    discountValue: 2000000,
    minOrderAmount: 2000000,
    maxDiscount: 2000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 50,
    usedCount: 12,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: '3',
    code: 'VIP2024',
    name: 'VIP Customer',
    description: 'Dành cho khách hàng VIP',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 5000000,
    maxDiscount: 10000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 20,
    usedCount: 8,
    isActive: true,
    createdAt: '2024-02-15',
  },
  {
    id: '4',
    code: 'BULK2024',
    name: 'Mua số lượng lớn',
    description: 'Giảm giá cho đơn hàng từ 5 xe trở lên',
    discountType: 'percentage',
    discountValue: 12,
    minOrderAmount: 10000000,
    maxDiscount: 8000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 30,
    usedCount: 5,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: '5',
    code: 'EARLYBIRD',
    name: 'Đặt hàng sớm',
    description: 'Giảm giá cho khách hàng đặt hàng trước 30 ngày',
    discountType: 'fixed',
    discountValue: 1500000,
    minOrderAmount: 3000000,
    maxDiscount: 1500000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 100,
    usedCount: 15,
    isActive: true,
    createdAt: '2024-01-01',
  },
  {
    id: '6',
    code: 'TEST50',
    name: 'Test 50%',
    description: 'Mã test giảm 50%',
    discountType: 'percentage',
    discountValue: 50,
    minOrderAmount: 0,
    maxDiscount: 100000000,
    validFrom: '2024-01-01',
    validTo: '2024-12-31',
    usageLimit: 1000,
    usedCount: 0,
    isActive: true,
    createdAt: '2024-01-01',
  },
];

// Service functions - designed for easy backend integration
export const promotionService = {
  // Get all active promotions
  async getActivePromotions() {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/active`);
      // const data = await response.json();
      // return data;
      
      // Mock implementation for now
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: MOCK_PROMOTIONS.filter(promo => promo.isActive),
        total: MOCK_PROMOTIONS.filter(promo => promo.isActive).length,
      };
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      return {
        success: false,
        error: 'Failed to fetch promotions',
        data: [],
        total: 0,
      };
    }
  },

  // Get all promotions (for management)
  async getAllPromotions() {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions`);
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        success: true,
        data: MOCK_PROMOTIONS,
        total: MOCK_PROMOTIONS.length,
      };
    } catch (error) {
      console.error('Error fetching all promotions:', error);
      return {
        success: false,
        error: 'Failed to fetch promotions',
        data: [],
        total: 0,
      };
    }
  },

  // Get promotion by code
  async getPromotionByCode(code) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const promotion = MOCK_PROMOTIONS.find(p => p.code.toLowerCase() === code.toLowerCase());
    if (!promotion) {
      return {
        success: false,
        error: 'Promotion not found',
      };
    }

    return {
      success: true,
      data: promotion,
    };
  },

  // Validate promotion code
  async validatePromotionCode(code, orderAmount = 0) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/validate`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ code, orderAmount }),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const safeCode = String(code || '').trim();
      const amount = Number(orderAmount) || 0;

      const promotion = MOCK_PROMOTIONS.find(p => 
        p.code.toLowerCase() === safeCode.toLowerCase() && p.isActive
      );
      
      if (!promotion) {
        return {
          success: false,
          error: 'Mã khuyến mãi không tồn tại hoặc đã hết hạn',
        };
      }

      // Check if promotion is still valid
      const now = new Date();
      const validFrom = new Date(promotion.validFrom);
      const validTo = new Date(promotion.validTo);
      
      if (now < validFrom || now > validTo) {
        return {
          success: false,
          error: 'Mã khuyến mãi đã hết hạn',
        };
      }

      // Check usage limit
      if (promotion.usedCount >= promotion.usageLimit) {
        return {
          success: false,
          error: 'Mã khuyến mãi đã hết lượt sử dụng',
        };
      }

      // Check minimum order amount
      if (amount < promotion.minOrderAmount) {
        return {
          success: false,
          error: `Đơn hàng tối thiểu ${formatPrice(promotion.minOrderAmount)} để sử dụng mã này`,
        };
      }

      return {
        success: true,
        data: promotion,
      };
    } catch (error) {
      console.error('Error validating promotion code:', error);
      return {
        success: false,
        error: 'Lỗi khi kiểm tra mã khuyến mãi',
      };
    }
  },

  // Calculate discount amount
  calculateDiscount(promotion, orderAmount) {
    if (!promotion || !promotion.isActive) {
      return 0;
    }

    let discountAmount = 0;

    if (promotion.discountType === 'percentage') {
      discountAmount = (orderAmount * promotion.discountValue) / 100;
    } else if (promotion.discountType === 'fixed') {
      discountAmount = promotion.discountValue;
    }

    // Apply maximum discount limit
    if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
      discountAmount = promotion.maxDiscount;
    }

    return Math.round(discountAmount);
  },

  // Use promotion (increment usage count) - for quotation creation
  async usePromotion(promotionId, quotationId) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}/use`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ quotationId }),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const promotionIndex = MOCK_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'Promotion not found',
        };
      }

      MOCK_PROMOTIONS[promotionIndex].usedCount += 1;

      return {
        success: true,
        data: MOCK_PROMOTIONS[promotionIndex],
      };
    } catch (error) {
      console.error('Error using promotion:', error);
      return {
        success: false,
        error: 'Failed to use promotion',
      };
    }
  },

  // Create new promotion (for Dealer Manager)
  async createPromotion(promotionData) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions`, {
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
      };
      
      MOCK_PROMOTIONS.unshift(newPromotion);
      
      return {
        success: true,
        data: newPromotion,
      };
    } catch (error) {
      console.error('Error creating promotion:', error);
      return {
        success: false,
        error: 'Failed to create promotion',
      };
    }
  },

  // Update promotion (for Dealer Manager)
  async updatePromotion(promotionId, promotionData) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(promotionData),
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const promotionIndex = MOCK_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'Promotion not found',
        };
      }

      MOCK_PROMOTIONS[promotionIndex] = {
        ...MOCK_PROMOTIONS[promotionIndex],
        ...promotionData,
        id: promotionId, // Keep original ID
      };
      
      return {
        success: true,
        data: MOCK_PROMOTIONS[promotionIndex],
      };
    } catch (error) {
      console.error('Error updating promotion:', error);
      return {
        success: false,
        error: 'Failed to update promotion',
      };
    }
  },

  // Delete promotion (for Dealer Manager)
  async deletePromotion(promotionId) {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/promotions/${promotionId}`, {
      //   method: 'DELETE',
      // });
      // const data = await response.json();
      // return data;
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const promotionIndex = MOCK_PROMOTIONS.findIndex(p => p.id === promotionId);
      if (promotionIndex === -1) {
        return {
          success: false,
          error: 'Promotion not found',
        };
      }

      MOCK_PROMOTIONS.splice(promotionIndex, 1);
      
      return {
        success: true,
        message: 'Promotion deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return {
        success: false,
        error: 'Failed to delete promotion',
      };
    }
  },

  // Search promotions
  async searchPromotions(query) {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const filteredPromotions = MOCK_PROMOTIONS.filter(promo => 
      promo.code.toLowerCase().includes(query.toLowerCase()) ||
      promo.name.toLowerCase().includes(query.toLowerCase()) ||
      promo.description.toLowerCase().includes(query.toLowerCase())
    );

    return {
      success: true,
      data: filteredPromotions,
      total: filteredPromotions.length,
      query,
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

export const formatDiscountValue = (promotion) => {
  if (promotion.discountType === 'percentage') {
    return `${promotion.discountValue}%`;
  } else {
    return formatPrice(promotion.discountValue);
  }
};

export const isPromotionValid = (promotion) => {
  if (!promotion || !promotion.isActive) return false;
  
  const now = new Date();
  const validFrom = new Date(promotion.validFrom);
  const validTo = new Date(promotion.validTo);
  
  return now >= validFrom && now <= validTo && promotion.usedCount < promotion.usageLimit;
};

export default promotionService;
