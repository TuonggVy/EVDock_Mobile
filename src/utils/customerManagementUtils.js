import { COLORS } from '../constants';

/**
 * Utility functions for customer management
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
 * Get status color for customer status
 * @param {string} status - Customer status
 * @returns {string} Color hex code
 */
export const getCustomerStatusColor = (status) => {
  switch (status) {
    case 'active': return COLORS.SUCCESS;
    case 'potential': return COLORS.WARNING;
    case 'purchased': return COLORS.PRIMARY;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get status text for customer status
 * @param {string} status - Customer status
 * @returns {string} Status text
 */
export const getCustomerStatusText = (status) => {
  switch (status) {
    case 'active': return 'Đang quan tâm';
    case 'potential': return 'Tiềm năng';
    case 'purchased': return 'Đã mua';
    default: return 'Không xác định';
  }
};

/**
 * Get status color for request status
 * @param {string} status - Request status
 * @returns {string} Color hex code
 */
export const getRequestStatusColor = (status) => {
  switch (status) {
    case 'pending': return COLORS.WARNING;
    case 'scheduled': return COLORS.PRIMARY;
    case 'completed': return COLORS.SUCCESS;
    case 'cancelled': return COLORS.ERROR;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get status text for request status
 * @param {string} status - Request status
 * @returns {string} Status text
 */
export const getRequestStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Chờ hẹn lịch';
    case 'scheduled': return 'Đã hẹn lịch';
    case 'completed': return 'Đã hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return 'Không xác định';
  }
};

/**
 * Get status color for viewing status
 * @param {string} status - Viewing status
 * @returns {string} Color hex code
 */
export const getViewingStatusColor = (status) => {
  switch (status) {
    case 'pending': return COLORS.WARNING;
    case 'scheduled': return COLORS.PRIMARY;
    case 'completed': return COLORS.SUCCESS;
    case 'cancelled': return COLORS.ERROR;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get status text for viewing status
 * @param {string} status - Viewing status
 * @returns {string} Status text
 */
export const getViewingStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'scheduled': return 'Đã hẹn lịch';
    case 'completed': return 'Đã xem xe';
    case 'cancelled': return 'Đã hủy';
    default: return 'Không xác định';
  }
};

/**
 * Get urgency color
 * @param {string} urgency - Urgency level
 * @returns {string} Color hex code
 */
export const getUrgencyColor = (urgency) => {
  switch (urgency) {
    case 'high': return COLORS.ERROR;
    case 'medium': return COLORS.WARNING;
    case 'low': return COLORS.SUCCESS;
    default: return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get urgency text
 * @param {string} urgency - Urgency level
 * @returns {string} Urgency text
 */
export const getUrgencyText = (urgency) => {
  switch (urgency) {
    case 'high': return 'Cao';
    case 'medium': return 'Trung bình';
    case 'low': return 'Thấp';
    default: return 'N/A';
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Vietnamese)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Is valid phone
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^(0|\+84)[3-9][0-9]{8}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate required field
 * @param {string} value - Value to validate
 * @returns {boolean} Is not empty
 */
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Get customer statistics
 * @param {Array} customers - List of customers
 * @returns {Object} Statistics object
 */
export const getCustomerStatistics = (customers) => {
  const totalCustomers = customers.length;
  const totalValue = customers.reduce((sum, customer) => sum + (customer.orderValue || 0), 0);
  
  // Group by vehicle model
  const modelStats = customers.reduce((acc, customer) => {
    const model = customer.vehicleModel || 'Unknown';
    acc[model] = (acc[model] || 0) + 1;
    return acc;
  }, {});
  
  // Group by color
  const colorStats = customers.reduce((acc, customer) => {
    const color = customer.vehicleColor || 'Unknown';
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalCustomers,
    totalValue,
    averageValue: totalCustomers > 0 ? totalValue / totalCustomers : 0,
    modelStats,
    colorStats,
  };
};

/**
 * Get request statistics
 * @param {Array} requests - List of requests
 * @returns {Object} Statistics object
 */
export const getRequestStatistics = (requests) => {
  const totalRequests = requests.length;
  const statusStats = requests.reduce((acc, request) => {
    const status = request.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalRequests,
    statusStats,
    pendingCount: statusStats.pending || 0,
    scheduledCount: statusStats.scheduled || 0,
    completedCount: statusStats.completed || 0,
    cancelledCount: statusStats.cancelled || 0,
  };
};

export default {
  formatPrice,
  formatDate,
  getCustomerStatusColor,
  getCustomerStatusText,
  getRequestStatusColor,
  getRequestStatusText,
  getViewingStatusColor,
  getViewingStatusText,
  getUrgencyColor,
  getUrgencyText,
  validateEmail,
  validatePhone,
  validateRequired,
  getCustomerStatistics,
  getRequestStatistics,
};
