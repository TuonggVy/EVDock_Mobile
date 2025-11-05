import api from './api/axiosInstance';

/**
 * Order Restock Service
 * Handles all order restock management API calls
 */
const ORDER_RESTOCK_ENDPOINTS = {
  LIST: '/order-restock-management/list',
  DETAIL: (orderId) => `/order-restock-management/detail/${orderId}`,
  ORDER_ITEM_DETAIL: (orderItemId) => `/order-restock-management/detail/order-item/${orderItemId}`,
  UPDATE_STATUS: (orderId) => `/order-restock-management/status/${orderId}`,
  CHECK_CREDIT: (orderId) => `/order-restock-management/checked/${orderId}`,
  DELETE: (orderId) => `/order-restock-management/${orderId}`,
};

/**
 * Get list of orders with pagination
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @param {string} params.status - Filter by status (optional)
 * @param {number} params.agencyId - Filter by agency ID (optional)
 * @returns {Promise<Object>} Orders data with pagination
 */
export const getOrderRestockList = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.agencyId) queryParams.append('agencyId', params.agencyId);

    const response = await api.get(`${ORDER_RESTOCK_ENDPOINTS.LIST}?${queryParams}`);
    return {
      success: true,
      data: response.data.data || [],
      paginationInfo: response.data.paginationInfo || {}
    };
  } catch (error) {
    console.error('Error fetching order restock list:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng',
      data: [],
      paginationInfo: {}
    };
  }
};

/**
 * Get order detail by ID
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
export const getOrderRestockDetail = async (orderId) => {
  try {
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.DETAIL(orderId));
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error fetching order restock detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải chi tiết đơn hàng'
    };
  }
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status (DRAFT, PENDING, APPROVED, DELIVERED, PAID, CANCELED)
 * @returns {Promise<Object>} Updated order data
 */
export const updateOrderRestockStatus = async (orderId, status) => {
  try {
    const response = await api.patch(ORDER_RESTOCK_ENDPOINTS.UPDATE_STATUS(orderId), {
      status
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Cập nhật trạng thái thành công'
    };
  } catch (error) {
    console.error('Error updating order restock status:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng'
    };
  }
};

/**
 * Get order item detail by ID
 * @param {number} orderItemId - Order Item ID
 * @returns {Promise<Object>} Order item details
 */
export const getOrderItemDetail = async (orderItemId) => {
  try {
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.ORDER_ITEM_DETAIL(orderItemId));
    return {
      success: true,
      data: response.data.data
    };
  } catch (error) {
    console.error('Error fetching order item detail:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải chi tiết order item'
    };
  }
};

/**
 * Check credit for order
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Updated order data
 */
export const checkOrderCredit = async (orderId) => {
  try {
    const response = await api.patch(ORDER_RESTOCK_ENDPOINTS.CHECK_CREDIT(orderId));
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || 'Check credit thành công'
    };
  } catch (error) {
    console.error('Error checking order credit:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể check credit đơn hàng'
    };
  }
};

/**
 * Delete order
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Delete response
 */
export const deleteOrderRestock = async (orderId) => {
  try {
    const response = await api.delete(ORDER_RESTOCK_ENDPOINTS.DELETE(orderId));
    return {
      success: true,
      message: response.data.message || 'Xóa đơn hàng thành công'
    };
  } catch (error) {
    console.error('Error deleting order restock:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể xóa đơn hàng'
    };
  }
};

const orderRestockService = {
  getOrderRestockList,
  getOrderRestockDetail,
  getOrderItemDetail,
  updateOrderRestockStatus,
  checkOrderCredit,
  deleteOrderRestock,
};

export default orderRestockService;
