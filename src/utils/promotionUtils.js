import { COLORS } from '../constants';

/**
 * Utility functions for promotion management
 */

/**
 * Format price to Vietnamese currency
 * @param {number} price - Price to format
 * @returns {string} Formatted price
 */
export const formatPrice = (price) => {
  if (!price && price !== 0) return 'N/A';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Format date to Vietnamese format
 * @param {string} dateString - Date string to format
 * @returns {string} Formatted date
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('vi-VN');
  } catch (error) {
    return 'N/A';
  }
};

/**
 * Calculate days until expiry
 * @param {string} endDate - End date string
 * @returns {number} Days until expiry
 */
export const getDaysUntilExpiry = (endDate) => {
  if (!endDate) return 0;
  
  try {
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
};

/**
 * Get status color for promotion
 * @param {string} status - Promotion status
 * @returns {string} Color hex code
 */
export const getPromotionStatusColor = (status) => {
  switch (status) {
    case 'active': return COLORS.SUCCESS;
    case 'upcoming': return COLORS.PRIMARY;
    case 'expired': return COLORS.ERROR;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get status text for promotion
 * @param {string} status - Promotion status
 * @returns {string} Status text
 */
export const getPromotionStatusText = (status) => {
  switch (status) {
    case 'active': return 'Đang áp dụng';
    case 'upcoming': return 'Sắp diễn ra';
    case 'expired': return 'Đã hết hạn';
    default: return 'Không xác định';
  }
};

/**
 * Get priority color for promotion
 * @param {string} priority - Promotion priority
 * @returns {string} Color hex code
 */
export const getPromotionPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return COLORS.ERROR;
    case 'medium': return COLORS.WARNING;
    case 'low': return COLORS.SUCCESS;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get priority text for promotion
 * @param {string} priority - Promotion priority
 * @returns {string} Priority text
 */
export const getPromotionPriorityText = (priority) => {
  switch (priority) {
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return 'N/A';
  }
};

/**
 * Get priority icon for promotion
 * @param {string} priority - Promotion priority
 * @returns {string} Priority icon
 */
export const getPromotionPriorityIcon = (priority) => {
  switch (priority) {
    case 'high': return '🔥';
    case 'medium': return '⭐';
    case 'low': return '💡';
    default: return '📌';
  }
};

/**
 * Format discount value
 * @param {Object} promotion - Promotion object
 * @returns {string} Formatted discount
 */
export const formatDiscount = (promotion) => {
  if (!promotion) return 'N/A';
  
  const { discountType, discountValue } = promotion;
  
  if (discountType === 'percentage') {
    return `${discountValue}%`;
  } else if (discountType === 'fixed') {
    return formatPrice(discountValue);
  }
  
  return 'N/A';
};

/**
 * Calculate actual discount amount
 * @param {Object} promotion - Promotion object
 * @param {number} orderValue - Order value
 * @returns {number} Actual discount amount
 */
export const calculateActualDiscount = (promotion, orderValue) => {
  if (!promotion || !orderValue) return 0;
  
  const { discountType, discountValue, maxDiscount, minOrderValue } = promotion;
  
  // Check minimum order value
  if (orderValue < minOrderValue) return 0;
  
  let discount = 0;
  
  if (discountType === 'percentage') {
    discount = (orderValue * discountValue) / 100;
  } else if (discountType === 'fixed') {
    discount = discountValue;
  }
  
  // Apply maximum discount limit
  if (maxDiscount && discount > maxDiscount) {
    discount = maxDiscount;
  }
  
  return discount;
};

/**
 * Check if promotion is expiring soon
 * @param {string} endDate - End date string
 * @param {number} daysThreshold - Days threshold (default: 7)
 * @returns {boolean} Is expiring soon
 */
export const isExpiringSoon = (endDate, daysThreshold = 7) => {
  const daysLeft = getDaysUntilExpiry(endDate);
  return daysLeft <= daysThreshold && daysLeft > 0;
};

/**
 * Get usage percentage
 * @param {number} usedCount - Used count
 * @param {number} usageLimit - Usage limit
 * @returns {number} Usage percentage
 */
export const getUsagePercentage = (usedCount, usageLimit) => {
  if (!usageLimit || usageLimit === 0) return 0;
  return Math.min(100, Math.round((usedCount / usageLimit) * 100));
};

/**
 * Get usage status color
 * @param {number} percentage - Usage percentage
 * @returns {string} Color hex code
 */
export const getUsageStatusColor = (percentage) => {
  if (percentage >= 90) return COLORS.ERROR;
  if (percentage >= 70) return COLORS.WARNING;
  return COLORS.SUCCESS;
};

/**
 * Get usage status text
 * @param {number} percentage - Usage percentage
 * @returns {string} Status text
 */
export const getUsageStatusText = (percentage) => {
  if (percentage >= 90) return 'Gần hết';
  if (percentage >= 70) return 'Sắp hết';
  return 'Còn nhiều';
};

/**
 * Validate promotion code
 * @param {string} code - Promotion code
 * @returns {boolean} Is valid code
 */
export const validatePromotionCode = (code) => {
  if (!code) return false;
  const codeRegex = /^[A-Z0-9]{6,20}$/;
  return codeRegex.test(code);
};

/**
 * Get model color for display
 * @param {string} model - Model name
 * @returns {string} Color hex code
 */
export const getModelColor = (model) => {
  switch (model) {
    case 'Model Y': return '#FF6B6B';
    case 'Model V': return '#4ECDC4';
    case 'Model X': return '#45B7D1';
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get promotion badge color based on status and priority
 * @param {Object} promotion - Promotion object
 * @returns {string} Badge color
 */
export const getPromotionBadgeColor = (promotion) => {
  if (!promotion) return COLORS.TEXT.SECONDARY;
  
  const { status, priority } = promotion;
  
  // High priority always gets special color
  if (priority === 'high') return COLORS.ERROR;
  
  // Status-based colors
  switch (status) {
    case 'active':
      if (isExpiringSoon(promotion.endDate)) return COLORS.WARNING;
      return COLORS.SUCCESS;
    case 'upcoming': return COLORS.PRIMARY;
    case 'expired': return COLORS.TEXT.SECONDARY;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get promotion badge text
 * @param {Object} promotion - Promotion object
 * @returns {string} Badge text
 */
export const getPromotionBadgeText = (promotion) => {
  if (!promotion) return 'N/A';
  
  const { status } = promotion;
  
  if (status === 'active' && isExpiringSoon(promotion.endDate)) {
    const daysLeft = getDaysUntilExpiry(promotion.endDate);
    return `Còn ${daysLeft} ngày`;
  }
  
  return getPromotionStatusText(status);
};

export default {
  formatPrice,
  formatDate,
  getDaysUntilExpiry,
  getPromotionStatusColor,
  getPromotionStatusText,
  getPromotionPriorityColor,
  getPromotionPriorityText,
  getPromotionPriorityIcon,
  formatDiscount,
  calculateActualDiscount,
  isExpiringSoon,
  getUsagePercentage,
  getUsageStatusColor,
  getUsageStatusText,
  validatePromotionCode,
  getModelColor,
  getPromotionBadgeColor,
  getPromotionBadgeText,
};
