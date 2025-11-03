import api from './api/axiosInstance';
import { quotationStorageService } from './storage/quotationStorageService';

/**
 * Quotation Service
 * Handles all quotation-related API calls
 * Backend integration for Dealer Staff Quotation API
 */

// API Endpoints - Backend integration
const QUOTATION_ENDPOINTS = {
  CREATE: '/quotation',
  LIST_BY_AGENCY: (agencyId) => `/quotation/list/${agencyId}`,
  DETAIL: (quotationId) => `/quotation/detail/${quotationId}`,
  UPDATE: (quotationId) => `/quotation/${quotationId}`,
  DELETE: (quotationId) => `/quotation/${quotationId}`,
};

/**
 * Get all quotations for an agency (Dealer Staff)
 * @param {number} agencyId - Agency ID
 * @param {Object} params - Query parameters (page, limit, type, status, quoteCode)
 * @returns {Promise<Object>} Quotations data with pagination
 */
export const getQuotationsByAgency = async (agencyId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.type) queryParams.append('type', params.type);
    if (params.status) queryParams.append('status', params.status);
    if (params.quoteCode) queryParams.append('quoteCode', params.quoteCode);

    const response = await api.get(QUOTATION_ENDPOINTS.LIST_BY_AGENCY(agencyId) + (queryParams.toString() ? `?${queryParams.toString()}` : ''));
    
    // Return data array and pagination info matching expected format
    return {
      success: true,
      data: response.data?.data || [],
      pagination: response.data?.paginationInfo || {},
    };
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return {
      success: false,
      data: [],
      pagination: {},
      error: error.response?.data?.message || 'Failed to fetch quotations'
    };
  }
};

/**
 * Get quotation by ID
 * @param {number} quotationId - Quotation ID
 * @returns {Promise<Object>} Quotation details
 */
export const getQuotationById = async (quotationId) => {
  try {
    const response = await api.get(QUOTATION_ENDPOINTS.DETAIL(quotationId));
    return {
      success: true,
      data: response.data?.data || null,
    };
  } catch (error) {
    console.error('Error fetching quotation:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch quotation'
    };
  }
};

/**
 * Create new quotation
 * @param {Object} quotationData - Quotation data
 * @returns {Promise<Object>} Created quotation
 */
export const createQuotation = async (quotationData) => {
  try {
    const response = await api.post(QUOTATION_ENDPOINTS.CREATE, quotationData);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Error creating quotation:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to create quotation'
    };
  }
};

/**
 * Update quotation
 * @param {number} quotationId - Quotation ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated quotation
 */
export const updateQuotation = async (quotationId, updateData) => {
  try {
    const response = await api.patch(QUOTATION_ENDPOINTS.UPDATE(quotationId), updateData);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Error updating quotation:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to update quotation'
    };
  }
};

/**
 * Delete quotation
 * @param {number} quotationId - Quotation ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteQuotation = async (quotationId) => {
  try {
    const response = await api.delete(QUOTATION_ENDPOINTS.DELETE(quotationId));
    return {
      success: true,
      data: response.data?.data || {},
    };
  } catch (error) {
    console.error('Error deleting quotation:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to delete quotation'
    };
  }
};

// Legacy compatibility functions
export const getQuotations = async (params = {}) => {
  // For backward compatibility, return empty for now
  // The actual implementation should use getQuotationsByAgency
  return {
    success: true,
    data: [],
    pagination: {},
  };
};

export const approveQuotation = async (quotationId, approvalData) => {
  return updateQuotation(quotationId, { status: 'ACCEPTED' });
};

export const rejectQuotation = async (quotationId, rejectionData) => {
  return updateQuotation(quotationId, { status: 'REJECTED' });
};

export const getQuotationsByDealer = async (dealerId, params = {}) => {
  return getQuotations(params);
};

export const getQuotationsByStatus = async (status, params = {}) => {
  return getQuotations({ ...params, status });
};

export const searchQuotations = async (searchParams) => {
  return getQuotations({ search: searchParams?.query || '' });
};

export const getQuotationStatistics = async () => {
  return {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
  };
};

export const exportQuotations = async () => {
  return { success: false };
};

export const sendQuotationEmail = async () => {
  return { success: false };
};

// Main service object for backward compatibility
export const quotationService = {
  getQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  approveQuotation,
  rejectQuotation,
  getQuotationsByDealer,
  getQuotationsByStatus,
  searchQuotations,
  getQuotationStatistics,
  exportQuotations,
  sendQuotationEmail,
  // New methods
  getQuotationsByAgency,
};

export default quotationService;
