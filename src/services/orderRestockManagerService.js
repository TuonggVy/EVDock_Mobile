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


