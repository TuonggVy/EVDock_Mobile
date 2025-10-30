import api from './api/axiosInstance';

// Dealer Manager specific service (copied from orderRestockService with same endpoints)
const ORDER_RESTOCK_ENDPOINTS = {
  LIST: '/order-restock-management/list',
  LIST_BY_AGENCY: (agencyId) => `/order-restock/list/${agencyId}`,
  DETAIL: (orderId) => `/order-restock/detail/${orderId}`,
  UPDATE_STATUS: (orderId) => `/order-restock-management/status/${orderId}`,
  DELETE: (orderId) => `/order-restock-management/${orderId}`,
  ACCEPT: (orderId) => `/order-restock/accept/${orderId}`,
};

export const getOrderRestockList = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.agencyId) queryParams.append('agencyId', params.agencyId);
    const response = await api.get(`${ORDER_RESTOCK_ENDPOINTS.LIST}?${queryParams}`);
    return { success: true, data: response.data.data || [], paginationInfo: response.data.paginationInfo || {} };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng', data: [], paginationInfo: {} };
  }
};

export const getOrderRestockListByAgency = async (agencyId) => {
  try {
    if (!agencyId) return { success: false, error: 'Agency ID is required', data: [] };
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.LIST_BY_AGENCY(agencyId));
    const ordersList = response.data?.data || response.data || [];
    return { success: true, data: ordersList };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể tải danh sách đơn hàng', data: [] };
  }
};

export const getOrderRestockDetail = async (orderId) => {
  try {
    const response = await api.get(ORDER_RESTOCK_ENDPOINTS.DETAIL(orderId));
    const detailData = response.data?.data || response.data;
    return { success: true, data: detailData };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể tải chi tiết đơn hàng' };
  }
};

export const updateOrderRestockStatus = async (orderId, status) => {
  try {
    const response = await api.patch(ORDER_RESTOCK_ENDPOINTS.UPDATE_STATUS(orderId), { status });
    return { success: true, data: response.data.data, message: response.data.message || 'Cập nhật trạng thái thành công' };
  } catch (error) {
    return { success: false, error: error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng' };
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

const orderRestockManagerService = {
  getOrderRestockList,
  getOrderRestockListByAgency,
  getOrderRestockDetail,
  updateOrderRestockStatus,
  deleteOrderRestock,
  acceptOrderRestock,
};

export default orderRestockManagerService;


