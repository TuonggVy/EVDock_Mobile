import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Promotion Storage Service
 * Handles local storage of promotion data for development
 * Will be replaced with API calls when backend is ready
 */

const PROMOTIONS_STORAGE_KEY = 'dealer_promotions_data';

class PromotionStorageService {
  /**
   * Get all stored promotions
   * @returns {Promise<Array>} Array of promotions
   */
  async getPromotions() {
    try {
      const stored = await AsyncStorage.getItem(PROMOTIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading promotions from storage:', error);
      return [];
    }
  }

  /**
   * Save all promotions to storage
   * @param {Array} promotions - Array of promotions to save
   */
  async savePromotions(promotions) {
    try {
      await AsyncStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(promotions));
    } catch (error) {
      console.error('Error saving promotions to storage:', error);
    }
  }

  /**
   * Add a new promotion
   * @param {Object} promotionData - Promotion data to add
   * @returns {Promise<Object>} Created promotion with ID
   */
  async addPromotion(promotionData) {
    try {
      const promotions = await this.getPromotions();
      const newPromotion = {
        id: this.generatePromotionId(),
        ...promotionData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Add to beginning of array (newest first)
      const updatedPromotions = [newPromotion, ...promotions];
      await this.savePromotions(updatedPromotions);
      
      return newPromotion;
    } catch (error) {
      console.error('Error adding promotion:', error);
      throw error;
    }
  }

  /**
   * Update an existing promotion
   * @param {string} promotionId - ID of promotion to update
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated promotion
   */
  async updatePromotion(promotionId, updateData) {
    try {
      const promotions = await this.getPromotions();
      const updatedPromotions = promotions.map(promotion => 
        promotion.id === promotionId 
          ? { ...promotion, ...updateData, updatedAt: new Date().toISOString() }
          : promotion
      );
      
      await this.savePromotions(updatedPromotions);
      
      // Return updated promotion
      return updatedPromotions.find(p => p.id === promotionId);
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  }

  /**
   * Delete a promotion
   * @param {string} promotionId - ID of promotion to delete
   * @returns {Promise<boolean>} Success status
   */
  async deletePromotion(promotionId) {
    try {
      const promotions = await this.getPromotions();
      const updatedPromotions = promotions.filter(promotion => promotion.id !== promotionId);
      await this.savePromotions(updatedPromotions);
      return true;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      return false;
    }
  }

  /**
   * Get promotion by ID
   * @param {string} promotionId - ID of promotion to get
   * @returns {Promise<Object|null>} Promotion or null if not found
   */
  async getPromotionById(promotionId) {
    try {
      const promotions = await this.getPromotions();
      return promotions.find(promotion => promotion.id === promotionId) || null;
    } catch (error) {
      console.error('Error getting promotion by ID:', error);
      return null;
    }
  }

  /**
   * Search promotions
   * @param {string} query - Search query
   * @returns {Promise<Array>} Filtered promotions
   */
  async searchPromotions(query) {
    try {
      const promotions = await this.getPromotions();
      const lowercaseQuery = query.toLowerCase();
      
      return promotions.filter(promotion =>
        promotion.name.toLowerCase().includes(lowercaseQuery) ||
        promotion.code.toLowerCase().includes(lowercaseQuery) ||
        promotion.description.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error('Error searching promotions:', error);
      return [];
    }
  }

  /**
   * Filter promotions by status
   * @param {string} status - Status to filter by
   * @returns {Promise<Array>} Filtered promotions
   */
  async getPromotionsByStatus(status) {
    try {
      const promotions = await this.getPromotions();
      return promotions.filter(promotion => promotion.status === status);
    } catch (error) {
      console.error('Error filtering promotions by status:', error);
      return [];
    }
  }

  /**
   * Get promotions for Dealer Staff (filtered for active/published promotions)
   * @returns {Promise<Array>} Promotions available for Staff use
   */
  async getPromotionsForStaff() {
    try {
      const allPromotions = await this.getPromotions();
      // Staff can only see active promotions that are published for customers
      return allPromotions.filter(promotion => 
        promotion.status === 'active' && 
        promotion.targetAudience === 'customers'
      );
    } catch (error) {
      console.error('Error getting promotions for staff:', error);
      return [];
    }
  }

  /**
   * Get promotions for Dealer Manager (all promotions including drafts, scheduled, etc.)
   * @returns {Promise<Array>} All promotions for Manager
   */
  async getPromotionsForManager() {
    try {
      return await this.getPromotions();
    } catch (error) {
      console.error('Error getting promotions for manager:', error);
      return [];
    }
  }

  /**
   * Get promotion statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getPromotionStats() {
    try {
      const promotions = await this.getPromotions();
      const stats = {
        total: promotions.length,
        active: promotions.filter(p => p.status === 'active').length,
        scheduled: promotions.filter(p => p.status === 'scheduled').length,
        expired: promotions.filter(p => p.status === 'expired').length,
        paused: promotions.filter(p => p.status === 'paused').length,
      };
      return stats;
    } catch (error) {
      console.error('Error getting promotion stats:', error);
      return { total: 0, active: 0, scheduled: 0, expired: 0, paused: 0 };
    }
  }

  /**
   * Get promotion statistics for Staff (only active promotions)
   * @returns {Promise<Object>} Statistics object for Staff
   */
  async getPromotionStatsForStaff() {
    try {
      const staffPromotions = await this.getPromotionsForStaff();
      const stats = {
        total: staffPromotions.length,
        active: staffPromotions.filter(p => p.status === 'active').length,
        scheduled: 0, // Staff doesn't see scheduled
        expired: 0,   // Staff doesn't see expired
        paused: 0,    // Staff doesn't see paused
      };
      return stats;
    } catch (error) {
      console.error('Error getting promotion stats for staff:', error);
      return { total: 0, active: 0, scheduled: 0, expired: 0, paused: 0 };
    }
  }

  /**
   * Initialize with mock data if storage is empty
   * @returns {Promise<Array>} Initial promotions
   */
  async initializeWithMockData() {
    try {
      const existingPromotions = await this.getPromotions();
      if (existingPromotions.length > 0) {
        return existingPromotions;
      }

      // Initialize with mock data
      const mockPromotions = [
        {
          id: '1',
          code: 'B2C_VIP_WEEKEND',
          name: 'VIP Weekend Special',
          description: 'Giảm giá đặc biệt cuối tuần cho khách hàng VIP',
          type: 'percentage',
          value: 10,
          minOrderValue: 2000000000,
          maxDiscount: 50000000,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          status: 'active',
          usageLimit: 100,
          usedCount: 23,
          targetCustomers: 'VIP Customers',
          targetAudience: 'customers',
          promotionType: 'vip_discount',
          customerSegments: ['VIP', 'Premium'],
          vehicleModels: ['All Models'],
          createdAt: '2024-01-01',
          createdBy: 'Dealer Manager'
        },
        {
          id: '2',
          code: 'B2C_NEWYEAR2024',
          name: 'New Year Customer Promotion',
          description: 'Chào mừng năm mới với ưu đãi hấp dẫn cho khách hàng',
          type: 'fixed',
          value: 30000000,
          minOrderValue: 1500000000,
          maxDiscount: 30000000,
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          status: 'expired',
          usageLimit: 50,
          usedCount: 50,
          targetCustomers: 'All Customers',
          targetAudience: 'customers',
          promotionType: 'seasonal_promotion',
          customerSegments: ['All'],
          vehicleModels: ['Model 3', 'Model Y'],
          createdAt: '2023-12-15',
          createdBy: 'Dealer Manager'
        },
        {
          id: '3',
          code: 'B2C_SUMMER2024',
          name: 'Summer Customer Campaign',
          description: 'Chiến dịch hè với nhiều ưu đãi hấp dẫn cho khách hàng',
          type: 'percentage',
          value: 15,
          minOrderValue: 1800000000,
          maxDiscount: 80000000,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          status: 'active',
          usageLimit: 200,
          usedCount: 45,
          targetCustomers: 'All Customers',
          targetAudience: 'customers',
          promotionType: 'seasonal_campaign',
          customerSegments: ['All'],
          vehicleModels: ['All Models'],
          createdAt: '2024-05-15',
          createdBy: 'Dealer Manager'
        },
        {
          id: '4',
          code: 'B2C_BLACKFRIDAY',
          name: 'Black Friday Customer Event',
          description: 'Sự kiện mua sắm lớn nhất năm cho khách hàng',
          type: 'percentage',
          value: 20,
          minOrderValue: 2500000000,
          maxDiscount: 150000000,
          startDate: '2024-12-01', // Future date for testing "Sắp diễn ra"
          endDate: '2024-12-31',
          status: 'active',
          usageLimit: 100,
          usedCount: 0,
          targetCustomers: 'All Customers',
          targetAudience: 'customers',
          promotionType: 'flash_sale',
          customerSegments: ['All'],
          vehicleModels: ['Model S', 'Model X'],
          createdAt: '2024-10-01',
          createdBy: 'Dealer Manager'
        },
        {
          id: '5',
          code: 'B2C_NEWYEAR2025',
          name: 'New Year 2025 Promotion',
          description: 'Chào mừng năm mới 2025 với ưu đãi đặc biệt',
          type: 'fixed',
          value: 40000000,
          minOrderValue: 2000000000,
          maxDiscount: 40000000,
          startDate: '2025-01-01', // Future date for testing "Sắp diễn ra"
          endDate: '2025-01-31',
          status: 'active',
          usageLimit: 150,
          usedCount: 0,
          targetCustomers: 'VIP Customers',
          targetAudience: 'customers',
          promotionType: 'new_year_promotion',
          customerSegments: ['VIP'],
          vehicleModels: ['All Models'],
          createdAt: '2024-11-15',
          createdBy: 'Dealer Manager'
        }
      ];

      await this.savePromotions(mockPromotions);
      return mockPromotions;
    } catch (error) {
      console.error('Error initializing with mock data:', error);
      return [];
    }
  }

  /**
   * Generate unique promotion ID
   * @returns {string} Unique promotion ID
   */
  generatePromotionId() {
    return `PROMO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all promotions from storage
   * @returns {Promise<boolean>} Success status
   */
  async clearAllPromotions() {
    try {
      await AsyncStorage.removeItem(PROMOTIONS_STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing all promotions:', error);
      return false;
    }
  }
}

// Export singleton instance
const promotionStorageService = new PromotionStorageService();
export default promotionStorageService;
