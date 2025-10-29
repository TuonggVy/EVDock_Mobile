import api from './api/axiosInstance';

/**
 * Order Restock Service
 * Handles all order restock management API calls
 */
const ORDER_RESTOCK_ENDPOINTS = {
  LIST: '/order-restock-management/list',
  LIST_BY_AGENCY: (agencyId) => `/order-restock/list/${agencyId}`,
  DETAIL: (orderId) => `/order-restock/detail/${orderId}`,
  UPDATE_STATUS: (orderId) => `/order-restock-management/status/${orderId}`,
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
 * Get list of orders by agency ID
 * @param {number} agencyId - Agency ID
 * @returns {Promise<Object>} Orders data
 */
export const getOrderRestockListByAgency = async (agencyId) => {
  try {
    if (!agencyId) {
      return {
        success: false,
        error: 'Agency ID is required',
        data: []
      };
    }

    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.LIST_BY_AGENCY(agencyId));
    
    // Log response structure to debug
    console.log('📋 [OrderRestockService] List API Response:', {
      hasData: !!response.data,
      hasNestedData: !!response.data?.data,
      dataType: Array.isArray(response.data?.data) ? 'array' : typeof response.data?.data,
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : Array.isArray(response.data) ? response.data.length : 0,
      firstItem: response.data?.data?.[0] || response.data?.[0] || null,
      fullResponseKeys: Object.keys(response.data || {})
    });
    
    const ordersList = response.data?.data || response.data || [];
    
    // Log if orders have id field
    if (ordersList.length > 0) {
      const firstOrder = ordersList[0];
      console.log('🆔 [OrderRestockService] Sample order structure:', {
        hasId: 'id' in firstOrder,
        id: firstOrder?.id,
        keys: Object.keys(firstOrder || {})
      });
    }
    
    return {
      success: true,
      data: ordersList
    };
  } catch (error) {
    console.error('Error fetching order restock list by agency:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng',
      data: []
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
    console.log('📋 [OrderRestockService] Fetching detail for orderId:', orderId);
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.DETAIL(orderId));
    
    // Response format: { statusCode: 200, message: "...", data: { id, ... } }
    console.log('📋 [OrderRestockService] Detail API Response:', {
      statusCode: response.data?.statusCode,
      message: response.data?.message,
      hasData: !!response.data?.data,
      orderIdFromData: response.data?.data?.id
    });
    
    const detailData = response.data?.data || response.data;
    
    if (!detailData) {
      console.error('❌ [OrderRestockService] No data in detail response');
      return {
        success: false,
        error: 'Không tìm thấy dữ liệu đơn hàng'
      };
    }
    
    console.log('✅ [OrderRestockService] Detail data extracted:', {
      id: detailData.id,
      status: detailData.status,
      quantity: detailData.quantity
    });
    
    return {
      success: true,
      data: detailData
    };
  } catch (error) {
    console.error('❌ [OrderRestockService] Error fetching order restock detail:', error);
    console.error('❌ [OrderRestockService] Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Không thể tải chi tiết đơn hàng'
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
  getOrderRestockListByAgency,
  getOrderRestockDetail,
  updateOrderRestockStatus,
  deleteOrderRestock,
};

export default orderRestockService;

