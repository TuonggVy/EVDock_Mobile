import { API_BASE_URL } from '../config/api';

/**
 * Dealer Promotion Service
 * Handles API calls for dealer promotions (view-only for Dealer Staff)
 */
class DealerPromotionService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/dealer-promotions`;
  }

  /**
   * Get all active promotions from Dealer Manager
   * @returns {Promise<Array>} List of active promotions
   */
  async getActivePromotions() {
    // For development, use mock data directly
    // TODO: Replace with actual API call when backend is ready
    return this.getMockPromotions();
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header when available
          // 'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return this.getMockPromotions();
    }
    */
  }

  /**
   * Get promotion details by ID
   * @param {number} promotionId - Promotion ID
   * @returns {Promise<Object>} Promotion details
   */
  async getPromotionById(promotionId) {
    // For development, simulate API call
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const promotions = this.getMockPromotions();
        const promotion = promotions.find(p => p.id === promotionId);
        resolve(promotion || null);
      }, 300);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/${promotionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promotion details:', error);
      throw error;
    }
    */
  }

  /**
   * Search promotions by keyword
   * @param {string} keyword - Search keyword
   * @returns {Promise<Array>} Filtered promotions
   */
  async searchPromotions(keyword) {
    // For development, simulate search
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const promotions = this.getMockPromotions();
        const filtered = promotions.filter(p => 
          p.name.toLowerCase().includes(keyword.toLowerCase()) ||
          p.code.toLowerCase().includes(keyword.toLowerCase()) ||
          p.description.toLowerCase().includes(keyword.toLowerCase())
        );
        resolve(filtered);
      }, 300);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/search?q=${encodeURIComponent(keyword)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching promotions:', error);
      throw error;
    }
    */
  }

  /**
   * Get promotion statistics
   * @returns {Promise<Object>} Promotion statistics
   */
  async getPromotionStats() {
    // For development, simulate API call
    // TODO: Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        const promotions = this.getMockPromotions();
        const stats = {
          totalPromotions: promotions.length,
          activePromotions: promotions.filter(p => p.status === 'active').length,
          expiringSoon: promotions.filter(p => {
            const daysLeft = this.getDaysUntilExpiry(p.endDate);
            return daysLeft <= 7 && daysLeft > 0;
          }).length,
          totalDiscount: promotions.reduce((sum, p) => sum + (p.discountValue || 0), 0),
        };
        resolve(stats);
      }, 300);
    });
    
    // Uncomment below when backend is ready:
    /*
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching promotion stats:', error);
      throw error;
    }
    */
  }

  // Mock data methods for development
  getMockPromotions() {
    return [
      {
        id: 1,
        name: 'Khuyến mãi Model Y Tết',
        code: 'MODELY2024',
        description: 'Giảm giá đặc biệt cho Model Y nhân dịp Tết Nguyên Đán',
        discountType: 'percentage', // percentage or fixed
        discountValue: 15, // 15% hoặc 15,000,000 VND
        minOrderValue: 1000000000, // 1 tỷ VND
        maxDiscount: 50000000, // 50 triệu VND
        applicableModels: ['Model Y'],
        startDate: '2024-01-01',
        endDate: '2024-02-15',
        status: 'active',
        usageLimit: 100,
        usedCount: 23,
        createdBy: 'Dealer Manager',
        createdAt: '2023-12-20',
        terms: [
          'Áp dụng cho khách hàng mới',
          'Không áp dụng cùng các khuyến mãi khác',
          'Có hiệu lực từ 01/01/2024 đến 15/02/2024'
        ],
        priority: 'high',
      },
      {
        id: 2,
        name: 'Ưu đãi Model V Premium',
        code: 'MODELVPREMIUM',
        description: 'Giảm giá cho Model V phiên bản Premium',
        discountType: 'fixed',
        discountValue: 25000000, // 25 triệu VND
        minOrderValue: 800000000, // 800 triệu VND
        maxDiscount: 25000000,
        applicableModels: ['Model V'],
        startDate: '2024-01-15',
        endDate: '2024-03-31',
        status: 'active',
        usageLimit: 50,
        usedCount: 8,
        createdBy: 'Dealer Manager',
        createdAt: '2024-01-10',
        terms: [
          'Áp dụng cho Model V phiên bản Premium',
          'Tối đa 1 khuyến mãi mỗi khách hàng',
          'Không hoàn lại tiền mặt'
        ],
        priority: 'medium',
      },
      {
        id: 3,
        name: 'Combo Model X + Phụ kiện',
        code: 'COMBOX2024',
        description: 'Mua Model X kèm phụ kiện được giảm giá',
        discountType: 'percentage',
        discountValue: 12,
        minOrderValue: 1500000000, // 1.5 tỷ VND
        maxDiscount: 80000000, // 80 triệu VND
        applicableModels: ['Model X'],
        startDate: '2024-02-01',
        endDate: '2024-04-30',
        status: 'active',
        usageLimit: 30,
        usedCount: 5,
        createdBy: 'Dealer Manager',
        createdAt: '2024-01-25',
        terms: [
          'Bao gồm phụ kiện chính hãng',
          'Áp dụng cho đơn hàng từ 1.5 tỷ VND',
          'Giao hàng trong 30 ngày'
        ],
        priority: 'high',
      },
      {
        id: 4,
        name: 'Khuyến mãi cuối năm',
        code: 'YEAREND2024',
        description: 'Chương trình khuyến mãi cuối năm cho tất cả model',
        discountType: 'percentage',
        discountValue: 8,
        minOrderValue: 700000000, // 700 triệu VND
        maxDiscount: 30000000, // 30 triệu VND
        applicableModels: ['Model Y', 'Model V', 'Model X'],
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        status: 'upcoming',
        usageLimit: 200,
        usedCount: 0,
        createdBy: 'Dealer Manager',
        createdAt: '2024-11-15',
        terms: [
          'Áp dụng cho tất cả model',
          'Khuyến mãi cuối năm',
          'Số lượng có hạn'
        ],
        priority: 'medium',
      },
      {
        id: 5,
        name: 'Giảm giá Model Y cũ',
        code: 'MODELYOLD',
        description: 'Giảm giá cho Model Y đời cũ',
        discountType: 'fixed',
        discountValue: 15000000, // 15 triệu VND
        minOrderValue: 600000000, // 600 triệu VND
        maxDiscount: 15000000,
        applicableModels: ['Model Y'],
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        status: 'expired',
        usageLimit: 25,
        usedCount: 25,
        createdBy: 'Dealer Manager',
        createdAt: '2023-12-20',
        terms: [
          'Chỉ áp dụng cho Model Y đời cũ',
          'Đã hết hạn sử dụng',
          'Số lượng đã sử dụng hết'
        ],
        priority: 'low',
      },
    ];
  }

  /**
   * Helper method to calculate days until expiry
   * @param {string} endDate - End date string
   * @returns {number} Days until expiry
   */
  getDaysUntilExpiry(endDate) {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export default new DealerPromotionService();