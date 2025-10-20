import { useState, useEffect, useCallback } from 'react';
import promotionStorageService from '../services/storage/promotionStorageService';
// TODO: Replace with actual API service when backend is ready
// import dealerPromotionService from '../services/dealerPromotionService';

/**
 * Custom hook for dealer promotion management (view-only for Dealer Staff)
 */
export const useDealerPromotions = () => {
  // State for data
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState({
    promotions: false,
    stats: false,
    search: false,
  });
  
  // Error states
  const [errors, setErrors] = useState({
    promotions: null,
    stats: null,
    search: null,
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: 'all', // all, active, upcoming, expired
    priority: 'all', // all, high, medium, low
    model: 'all', // all, Model Y, Model V, Model X
    timeStatus: 'all', // all, active, upcoming (based on current date)
  });

  /**
   * Load all promotions (Staff can only see active promotions created by Manager)
   */
  const loadPromotions = useCallback(async () => {
    setLoading(prev => ({ ...prev, promotions: true }));
    setErrors(prev => ({ ...prev, promotions: null }));
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // const data = await dealerPromotionService.getActivePromotions();
      
      // For development, load promotions created by Manager that Staff can use
      const data = await promotionStorageService.getPromotionsForStaff();
      setPromotions(data);
      setFilteredPromotions(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, promotions: error.message }));
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(prev => ({ ...prev, promotions: false }));
    }
  }, []);

  /**
   * Load promotion statistics (Staff stats - only active promotions)
   */
  const loadStats = useCallback(async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    setErrors(prev => ({ ...prev, stats: null }));
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // const data = await dealerPromotionService.getPromotionStats();
      
      // For development, load stats for Staff (only active promotions)
      const data = await promotionStorageService.getPromotionStatsForStaff();
      setStats(data);
    } catch (error) {
      setErrors(prev => ({ ...prev, stats: error.message }));
      console.error('Error loading stats:', error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  /**
   * Load all data
   */
  const loadAllData = useCallback(async () => {
    await Promise.all([
      loadPromotions(),
      loadStats(),
    ]);
  }, [loadPromotions, loadStats]);

  /**
   * Search promotions (Staff can only search within available promotions)
   */
  const searchPromotions = useCallback(async (keyword) => {
    if (!keyword.trim()) {
      setFilteredPromotions(promotions);
      return;
    }

    setLoading(prev => ({ ...prev, search: true }));
    setErrors(prev => ({ ...prev, search: null }));
    
    try {
      // TODO: Replace with actual API call when backend is ready
      // const data = await dealerPromotionService.searchPromotions(keyword);
      
      // For development, search within Staff-available promotions
      const data = await promotionStorageService.searchPromotions(keyword);
      // Filter to only show active promotions for customers
      const staffPromotions = data.filter(promotion => 
        promotion.status === 'active' && 
        promotion.targetAudience === 'customers'
      );
      setFilteredPromotions(staffPromotions);
    } catch (error) {
      setErrors(prev => ({ ...prev, search: error.message }));
      console.error('Error searching promotions:', error);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  }, [promotions]);

  /**
   * Get time status of promotion based on current date
   */
  const getPromotionTimeStatus = useCallback((promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    if (now >= startDate && now <= endDate) {
      return 'active'; // Đang diễn ra
    } else if (now < startDate) {
      return 'upcoming'; // Sắp diễn ra
    } else {
      return 'expired'; // Đã hết hạn
    }
  }, []);

  /**
   * Apply filters to promotions
   */
  const applyFilters = useCallback(() => {
    let filtered = [...promotions];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }

    // Filter by time status (based on current date)
    if (filters.timeStatus !== 'all') {
      filtered = filtered.filter(p => {
        const timeStatus = getPromotionTimeStatus(p);
        return timeStatus === filters.timeStatus;
      });
    }

    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(p => p.priority === filters.priority);
    }

    // Filter by model
    if (filters.model !== 'all') {
      filtered = filtered.filter(p => {
        const models = p.vehicleModels || p.applicableModels || [];
        return models.includes(filters.model);
      });
    }

    setFilteredPromotions(filtered);
  }, [promotions, filters, getPromotionTimeStatus]);

  /**
   * Update filter
   */
  const updateFilter = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      status: 'all',
      priority: 'all',
      model: 'all',
      timeStatus: 'all',
    });
  }, []);

  /**
   * Get promotion by ID (Staff can only access active promotions)
   */
  const getPromotionById = useCallback(async (promotionId) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // return await dealerPromotionService.getPromotionById(promotionId);
      
      // For development, get from storage and verify Staff can access it
      const promotion = await promotionStorageService.getPromotionById(promotionId);
      
      // Only return if promotion is active and for customers
      if (promotion && promotion.status === 'active' && promotion.targetAudience === 'customers') {
        return promotion;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting promotion by ID:', error);
      return null;
    }
  }, []);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    loadAllData();
  }, [loadAllData]);

  /**
   * Get available filter options
   */
  const getFilterOptions = useCallback(() => {
    const statusOptions = [
      { key: 'all', label: 'Tất cả trạng thái' },
      { key: 'active', label: 'Đang áp dụng' },
      { key: 'upcoming', label: 'Sắp diễn ra' },
      { key: 'expired', label: 'Đã hết hạn' },
    ];

    const timeStatusOptions = [
      { key: 'all', label: 'Tất cả thời gian' },
      { key: 'active', label: 'Đang diễn ra' },
      { key: 'upcoming', label: 'Sắp diễn ra' },
    ];

    const priorityOptions = [
      { key: 'all', label: 'Tất cả mức độ' },
      { key: 'high', label: 'Ưu tiên cao' },
      { key: 'medium', label: 'Ưu tiên trung bình' },
      { key: 'low', label: 'Ưu tiên thấp' },
    ];

    const modelOptions = [
      { key: 'all', label: 'Tất cả model' },
      { key: 'Model Y', label: 'Model Y' },
      { key: 'Model V', label: 'Model V' },
      { key: 'Model X', label: 'Model X' },
    ];

    return {
      status: statusOptions,
      timeStatus: timeStatusOptions,
      priority: priorityOptions,
      model: modelOptions,
    };
  }, []);

  // Apply filters when filters or promotions change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // Data
    promotions,
    filteredPromotions,
    stats,
    
    // Loading states
    loading,
    
    // Error states
    errors,
    
    // Filters
    filters,
    
    // Actions
    searchPromotions,
    updateFilter,
    clearFilters,
    getPromotionById,
    refresh,
    
    // Utilities
    getFilterOptions,
    getPromotionTimeStatus,
  };
};

export default useDealerPromotions;
