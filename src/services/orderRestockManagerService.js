import api from './api/axiosInstance';

// Dealer Manager specific service for Order Restock APIs
const ORDER_RESTOCK_ENDPOINTS = {
  CREATE: '/order-restock',
  LIST_BY_AGENCY: (agencyId) => `/order-restock/list/${agencyId}`,
  DETAIL_BY_ORDER_ITEM: (orderItemId) => `/order-restock/detail/order-item/${orderItemId}`,
  ACCEPT: (orderId) => `/order-restock/accept/${orderId}`,
  DELETE: (orderId) => `/order-restock/${orderId}`,
};

export const getOrderRestockList = async (params = {}) => {
  const buildUrl = (p = {}) => {
    const qp = new URLSearchParams();
    if (p.page) qp.append('page', p.page);
    if (p.limit) qp.append('limit', p.limit);
    if (p.status) qp.append('status', p.status);
    if (p.agencyId) qp.append('agencyId', p.agencyId);
    const qs = qp.toString();
    return qs ? `${ORDER_RESTOCK_ENDPOINTS.LIST}?${qs}` : ORDER_RESTOCK_ENDPOINTS.LIST;
  };
  try {
    const url = buildUrl(params);
    const response = await api.get(url);
    const data = response.data?.data || response.data || [];
    return { success: true, data, paginationInfo: response.data?.paginationInfo || {} };
  } catch (error) {
    // If server rejects due to params, retry with safe defaults to fetch everything
    const statusCode = error?.response?.status;
    if (statusCode === 400 || statusCode === 422) {
      try {
        const fallbackParams = { page: 1, limit: 1000 };
        const url = buildUrl(fallbackParams);
        const response = await api.get(url);
        const data = response.data?.data || response.data || [];
        return { success: true, data, paginationInfo: response.data?.paginationInfo || {} };
      } catch (_err) {
        return { success: false, error: _err.response?.data?.message || 'Không thể tải danh sách đơn hàng', data: [], paginationInfo: {} };
      }
    }
    return { success: false, error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng', data: [], paginationInfo: {} };
  }
};

export const getOrderRestockListByAgency = async (agencyId, params = {}) => {
  try {
    if (!agencyId) return { success: false, error: 'Agency ID is required', data: [] };
    const qp = new URLSearchParams();
    if (params.page) qp.append('page', params.page);
    if (params.limit) qp.append('limit', params.limit);
    if (params.status) qp.append('status', params.status);
    const qs = qp.toString();
    const url = qs ? `${ORDER_RESTOCK_ENDPOINTS.LIST_BY_AGENCY(agencyId)}?${qs}` : ORDER_RESTOCK_ENDPOINTS.LIST_BY_AGENCY(agencyId);
    const response = await api.get(url);
    const ordersList = response.data?.data || response.data || [];
    return { success: true, data: ordersList, paginationInfo: response.data?.paginationInfo || {} };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng', data: [], paginationInfo: {} };
  }
};

/**
 * Create order restock
 * @param {Object} orderData - Order data with orderType, orderItems, agencyId
 * @returns {Promise<Object>} Created order data
 */
export const createOrderRestock = async (orderData) => {
  try {
    const response = await api.post(ORDER_RESTOCK_ENDPOINTS.CREATE, orderData);
    const orderData_result = response.data?.data || response.data;
    return { 
      success: true, 
      data: orderData_result,
      orderId: orderData_result?.id,
      message: response.data?.message || 'Tạo đơn hàng thành công' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Không thể tạo đơn hàng' 
    };
  }
};

/**
 * Get order restock detail by orderItemId
 * @param {number} orderItemId - Order Item ID
 * @returns {Promise<Object>} Order detail data
 */
export const getOrderRestockDetail = async (orderItemId) => {
  try {
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.DETAIL_BY_ORDER_ITEM(orderItemId));
    const detailData = response.data?.data || response.data;
    return { success: true, data: detailData };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể tải chi tiết đơn hàng' };
  }
};


export const deleteOrderRestock = async (orderId) => {
  try {
    const response = await api.delete(ORDER_RESTOCK_ENDPOINTS.DELETE(orderId));
    return { success: true, message: response.data.message || 'Xóa đơn hàng thành công' };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể xóa đơn hàng' };
  }
};

export const acceptOrderRestock = async (orderId) => {
  try {
    const response = await api.patch(ORDER_RESTOCK_ENDPOINTS.ACCEPT(orderId));
    return { success: true, data: response.data?.data || response.data, message: response.data?.message || 'Xác nhận đơn hàng thành công' };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể xác nhận đơn hàng' };
  }
};

/**
 * Create bill for order restock when order is delivered
 * @param {number} orderId - Order ID
 * @param {string} type - Payment type: 'FULL' or 'DEFERRED'
 * @returns {Promise<Object>} Created bill data
 */
export const createOrderRestockBill = async (orderId, type = 'FULL') => {
  try {
    const response = await api.post(`/order-restock/bill/${orderId}`, { type });
    return { 
      success: true, 
      data: response.data?.data || response.data, 
      message: response.data?.message || 'Tạo hóa đơn thành công' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Không thể tạo hóa đơn' 
    };
  }
};

/**
 * Get VNPay payment URL for agency bill
 * @param {number} agencyBillId - Agency Bill ID
 * @returns {Promise<Object>} Payment URL data
 */
export const getVNPayPaymentUrl = async (agencyBillId) => {
  try {
    const response = await api.post('/vnpay/agency-bill?platform=mobile', {
      agencyBillId
    });
    return { 
      success: true, 
      data: response.data?.data || response.data, 
      paymentUrl: response.data?.data?.paymentUrl || response.data?.paymentUrl,
      message: response.data?.message || 'Lấy URL thanh toán thành công' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Không thể lấy URL thanh toán' 
    };
  }
};

const orderRestockManagerService = {
  getOrderRestockList,
  getOrderRestockListByAgency,
  createOrderRestock,
  getOrderRestockDetail,
  deleteOrderRestock,
  acceptOrderRestock,
  createOrderRestockBill,
  getVNPayPaymentUrl,
};

export default orderRestockManagerService;


