import { api } from '../config/api';
import { quotationStorageService } from './storage/quotationStorageService';

/**
 * Quotation Service
 * Handles all quotation-related API calls
 * Ready for backend integration
 */

// API Endpoints - Update these when backend is ready
const QUOTATION_ENDPOINTS = {
  GET_QUOTATIONS: '/quotations',
  GET_QUOTATION_BY_ID: '/quotations/:id',
  CREATE_QUOTATION: '/quotations',
  UPDATE_QUOTATION: '/quotations/:id',
  DELETE_QUOTATION: '/quotations/:id',
  APPROVE_QUOTATION: '/quotations/:id/approve',
  REJECT_QUOTATION: '/quotations/:id/reject',
  GET_QUOTATIONS_BY_DEALER: '/quotations/dealer/:dealerId',
  GET_QUOTATIONS_BY_STATUS: '/quotations/status/:status',
  SEARCH_QUOTATIONS: '/quotations/search',
};

/**
 * Get all quotations for the current dealer staff
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by status (pending, approved, rejected, expired)
 * @param {string} params.search - Search query
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Quotations data with pagination
 */
export const getQuotations = async (params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api.get(`${QUOTATION_ENDPOINTS.GET_QUOTATIONS}?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quotations:', error);
    throw error;
  }
};

/**
 * Get quotation by ID
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Quotation details
 */
export const getQuotationById = async (quotationId) => {
  try {
    const response = await api.get(
      QUOTATION_ENDPOINTS.GET_QUOTATION_BY_ID.replace(':id', quotationId)
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching quotation:', error);
    throw error;
  }
};

/**
 * Create new quotation
 * @param {Object} quotationData - Quotation data
 * @param {string} quotationData.customerId - Customer ID
 * @param {string} quotationData.vehicleId - Vehicle ID
 * @param {Array} quotationData.items - Quotation items
 * @param {string} quotationData.validUntil - Valid until date
 * @param {string} quotationData.notes - Additional notes
 * @returns {Promise<Object>} Created quotation
 */
export const createQuotation = async (quotationData) => {
  try {
    const response = await api.post(QUOTATION_ENDPOINTS.CREATE_QUOTATION, quotationData);
    return response.data;
  } catch (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
};

/**
 * Update quotation
 * @param {string} quotationId - Quotation ID
 * @param {Object} updateData - Update data
 * @returns {Promise<Object>} Updated quotation
 */
export const updateQuotation = async (quotationId, updateData) => {
  try {
    const response = await api.put(
      QUOTATION_ENDPOINTS.UPDATE_QUOTATION.replace(':id', quotationId),
      updateData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating quotation:', error);
    throw error;
  }
};

/**
 * Delete quotation
 * @param {string} quotationId - Quotation ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteQuotation = async (quotationId) => {
  try {
    const response = await api.delete(
      QUOTATION_ENDPOINTS.DELETE_QUOTATION.replace(':id', quotationId)
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting quotation:', error);
    throw error;
  }
};

/**
 * Approve quotation
 * @param {string} quotationId - Quotation ID
 * @param {Object} approvalData - Approval data
 * @param {string} approvalData.approvedBy - Approver ID
 * @param {string} approvalData.notes - Approval notes
 * @returns {Promise<Object>} Approved quotation
 */
export const approveQuotation = async (quotationId, approvalData) => {
  try {
    const response = await api.post(
      QUOTATION_ENDPOINTS.APPROVE_QUOTATION.replace(':id', quotationId),
      approvalData
    );
    return response.data;
  } catch (error) {
    console.error('Error approving quotation:', error);
    throw error;
  }
};

/**
 * Reject quotation
 * @param {string} quotationId - Quotation ID
 * @param {Object} rejectionData - Rejection data
 * @param {string} rejectionData.rejectedBy - Rejector ID
 * @param {string} rejectionData.reason - Rejection reason
 * @returns {Promise<Object>} Rejected quotation
 */
export const rejectQuotation = async (quotationId, rejectionData) => {
  try {
    const response = await api.post(
      QUOTATION_ENDPOINTS.REJECT_QUOTATION.replace(':id', quotationId),
      rejectionData
    );
    return response.data;
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    throw error;
  }
};

/**
 * Get quotations by dealer
 * @param {string} dealerId - Dealer ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Quotations data
 */
export const getQuotationsByDealer = async (dealerId, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.status) queryParams.append('status', params.status);
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api.get(
      `${QUOTATION_ENDPOINTS.GET_QUOTATIONS_BY_DEALER.replace(':dealerId', dealerId)}?${queryParams}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching dealer quotations:', error);
    throw error;
  }
};

/**
 * Get quotations by status
 * @param {string} status - Status filter
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Quotations data
 */
export const getQuotationsByStatus = async (status, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);

    const response = await api.get(
      `${QUOTATION_ENDPOINTS.GET_QUOTATIONS_BY_STATUS.replace(':status', status)}?${queryParams}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching quotations by status:', error);
    throw error;
  }
};

/**
 * Search quotations
 * @param {Object} searchParams - Search parameters
 * @param {string} searchParams.query - Search query
 * @param {string} searchParams.customerName - Customer name filter
 * @param {string} searchParams.vehicleModel - Vehicle model filter
 * @param {string} searchParams.status - Status filter
 * @param {string} searchParams.dateFrom - Date from filter
 * @param {string} searchParams.dateTo - Date to filter
 * @returns {Promise<Object>} Search results
 */
export const searchQuotations = async (searchParams) => {
  try {
    const response = await api.post(QUOTATION_ENDPOINTS.SEARCH_QUOTATIONS, searchParams);
    return response.data;
  } catch (error) {
    console.error('Error searching quotations:', error);
    throw error;
  }
};

/**
 * Get quotation statistics
 * @param {string} dealerId - Dealer ID (optional)
 * @param {Object} params - Date range parameters
 * @param {string} params.dateFrom - Start date
 * @param {string} params.dateTo - End date
 * @returns {Promise<Object>} Statistics data
 */
export const getQuotationStatistics = async (dealerId = null, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    if (dealerId) queryParams.append('dealerId', dealerId);
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);

    const response = await api.get(`/quotations/statistics?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching quotation statistics:', error);
    throw error;
  }
};

/**
 * Export quotations to PDF
 * @param {Array} quotationIds - Array of quotation IDs
 * @param {string} format - Export format (pdf, excel)
 * @returns {Promise<Blob>} Exported file
 */
export const exportQuotations = async (quotationIds, format = 'pdf') => {
  try {
    const response = await api.post('/quotations/export', {
      quotationIds,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error exporting quotations:', error);
    throw error;
  }
};

/**
 * Send quotation to customer via email
 * @param {string} quotationId - Quotation ID
 * @param {Object} emailData - Email data
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.message - Email message
 * @returns {Promise<Object>} Send result
 */
export const sendQuotationEmail = async (quotationId, emailData) => {
  try {
    const response = await api.post(
      `/quotations/${quotationId}/send-email`,
      emailData
    );
    return response.data;
  } catch (error) {
    console.error('Error sending quotation email:', error);
    throw error;
  }
};

// Local storage key for quotations
const QUOTATIONS_STORAGE_KEY = 'quotations_data';

// Helper functions for local storage
const getStoredQuotations = () => {
  try {
    const stored = localStorage.getItem(QUOTATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading quotations from storage:', error);
    return [];
  }
};

const saveQuotationsToStorage = (quotations) => {
  try {
    localStorage.setItem(QUOTATIONS_STORAGE_KEY, JSON.stringify(quotations));
  } catch (error) {
    console.error('Error saving quotations to storage:', error);
  }
};

// Mock data for development - Remove when backend is ready
export const mockQuotationService = {
  getQuotations: async (params = {}) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get stored quotations from storage service
    const storedQuotations = await quotationStorageService.getQuotations();
    
    // If no stored quotations, initialize with mock data and store them
    let mockData = storedQuotations;
    
    if (storedQuotations.length === 0) {
      mockData = [
      {
        id: 'Q001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        customerEmail: 'nguyenvana@email.com',
        vehicleModel: 'Tesla Model Y',
        vehicleImage: 'banner-modely.png',
        totalAmount: 1250000000,
        status: 'pending',
        paymentType: 'installment', // Trả góp
        createdAt: '2024-01-15T10:30:00Z',
        validUntil: '2024-01-22T23:59:59Z',
        createdBy: 'staff001',
        dealerId: 'dealer001',
        items: [
          { name: 'Tesla Model Y', quantity: 1, price: 1200000000, type: 'vehicle' },
          { name: 'Premium Package', quantity: 1, price: 50000000, type: 'accessory' },
        ],
        notes: 'Khách hàng quan tâm đến gói bảo hiểm cao cấp',
        lastModified: '2024-01-15T10:30:00Z',
      },
      {
        id: 'Q002',
        customerName: 'Trần Thị B',
        customerPhone: '0907654321',
        customerEmail: 'tranthib@email.com',
        vehicleModel: 'Tesla Model X',
        vehicleImage: 'banner-modelx.png',
        totalAmount: 1800000000,
        status: 'paid',
        paymentType: 'full', // Trả full
        createdAt: '2024-01-14T14:20:00Z',
        validUntil: '2024-01-21T23:59:59Z',
        createdBy: 'staff001',
        dealerId: 'dealer001',
        items: [
          { name: 'Tesla Model X', quantity: 1, price: 1750000000, type: 'vehicle' },
          { name: 'Luxury Package', quantity: 1, price: 50000000, type: 'accessory' },
        ],
        notes: 'Khách hàng đã thanh toán thành công',
        lastModified: '2024-01-16T09:15:00Z',
        approvedBy: 'manager001',
        approvedAt: '2024-01-16T09:15:00Z',
        paymentStatus: 'completed',
        paymentCompletedAt: '2024-01-16T16:30:00Z',
      },
      {
        id: 'Q003',
        customerName: 'Lê Văn C',
        customerPhone: '0909876543',
        customerEmail: 'levanc@email.com',
        vehicleModel: 'Tesla Model V',
        vehicleImage: 'banner-modelv.png',
        totalAmount: 950000000,
        status: 'pending',
        paymentType: 'installment', // Trả góp
        createdAt: '2024-01-13T16:45:00Z',
        validUntil: '2024-01-20T23:59:59Z',
        createdBy: 'staff001',
        dealerId: 'dealer001',
        items: [
          { name: 'Tesla Model V', quantity: 1, price: 950000000, type: 'vehicle' },
        ],
        notes: 'Khách hàng muốn trả góp 12 tháng',
        lastModified: '2024-01-14T11:30:00Z',
      },
      {
        id: 'Q004',
        customerName: 'Phạm Thị D',
        customerPhone: '0904567890',
        customerEmail: 'phamthid@email.com',
        vehicleModel: 'Tesla Model Y',
        vehicleImage: 'banner-modely.png',
        totalAmount: 1300000000,
        status: 'paid',
        paymentType: 'installment', // Trả góp
        createdAt: '2024-01-10T08:00:00Z',
        validUntil: '2024-01-17T23:59:59Z',
        createdBy: 'staff001',
        dealerId: 'dealer001',
        items: [
          { name: 'Tesla Model Y', quantity: 1, price: 1200000000, type: 'vehicle' },
          { name: 'Performance Package', quantity: 1, price: 100000000, type: 'accessory' },
        ],
        notes: 'Khách hàng đã thanh toán và chọn trả góp',
        lastModified: '2024-01-10T08:00:00Z',
        paymentStatus: 'completed',
        paymentCompletedAt: '2024-01-11T10:00:00Z',
      },
    ];
    
    // Store mock data in storage for future use
    await quotationStorageService.saveQuotations(mockData);
    }

    // Apply filters
    let filteredData = mockData;
    
    if (params.status && params.status !== 'all') {
      filteredData = filteredData.filter(item => item.status === params.status);
    }
    
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.customerName.toLowerCase().includes(searchLower) ||
        item.customerPhone.includes(searchLower) ||
        item.vehicleModel.toLowerCase().includes(searchLower) ||
        item.id.toLowerCase().includes(searchLower)
      );
    }

    // Pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(filteredData.length / limit),
        totalItems: filteredData.length,
        itemsPerPage: limit,
      },
      statistics: {
        total: mockData.length,
        pending: mockData.filter(item => item.status === 'pending').length,
        approved: mockData.filter(item => item.status === 'approved').length,
        rejected: mockData.filter(item => item.status === 'rejected').length,
        expired: mockData.filter(item => item.status === 'expired').length,
      }
    };
  },

  getQuotationById: async (quotationId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = [
      {
        id: 'Q001',
        customerName: 'Nguyễn Văn A',
        customerPhone: '0901234567',
        customerEmail: 'nguyenvana@email.com',
        customerAddress: '123 Đường ABC, Quận 1, TP.HCM',
        vehicleModel: 'Tesla Model Y',
        vehicleImage: 'banner-modely.png',
        totalAmount: 1250000000,
        status: 'pending',
        createdAt: '2024-01-15T10:30:00Z',
        validUntil: '2024-01-22T23:59:59Z',
        createdBy: 'staff001',
        dealerId: 'dealer001',
        items: [
          { name: 'Tesla Model Y', quantity: 1, price: 1200000000, type: 'vehicle' },
          { name: 'Premium Package', quantity: 1, price: 50000000, type: 'accessory' },
        ],
        notes: 'Khách hàng quan tâm đến gói bảo hiểm cao cấp',
        lastModified: '2024-01-15T10:30:00Z',
      }
    ];

    return mockData.find(item => item.id === quotationId) || null;
  },

  createQuotation: async (quotationData) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use storage service for local storage
    const newQuotation = await quotationStorageService.addQuotation({
      ...quotationData,
      status: 'pending',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: 'staff001', // This should come from auth context
      dealerId: 'dealer001', // This should come from auth context
    });
    
    return newQuotation;
  },

  updateQuotation: async (quotationId, updateData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: quotationId,
      ...updateData,
      lastModified: new Date().toISOString(),
    };
  },

  deleteQuotation: async (quotationId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Quotation deleted successfully',
    };
  },

  approveQuotation: async (quotationId, approvalData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: quotationId,
      status: 'approved',
      approvedBy: approvalData.approvedBy,
      approvedAt: new Date().toISOString(),
      approvalNotes: approvalData.notes,
    };
  },

  rejectQuotation: async (quotationId, rejectionData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: quotationId,
      status: 'rejected',
      rejectedBy: rejectionData.rejectedBy,
      rejectedAt: new Date().toISOString(),
      rejectionReason: rejectionData.reason,
    };
  },
};

// Storage-backed service (no hardcoded seeding)
const storageQuotationService = {
  getQuotations: async (params = {}) => {
    const all = await quotationStorageService.getQuotations();
    let filtered = Array.isArray(all) ? [...all] : [];
    if (params.status && params.status !== 'all') {
      filtered = filtered.filter(q => q.status === params.status);
    }
    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(q =>
        q.customerName?.toLowerCase().includes(s) ||
        q.customerPhone?.includes(params.search) ||
        q.customerEmail?.toLowerCase().includes(s) ||
        q.vehicleModel?.toLowerCase().includes(s) ||
        q.id?.toLowerCase().includes(s)
      );
    }
    const page = params.page || 1;
    const limit = params.limit || filtered.length || 10;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);
    return { data, pagination: { currentPage: page, totalItems: filtered.length, itemsPerPage: limit } };
  },
  getQuotationById: async (quotationId) => {
    const all = await quotationStorageService.getQuotations();
    return (all || []).find(q => q.id === quotationId) || null;
  },
  createQuotation: async (quotationData) => {
    return quotationStorageService.addQuotation({
      ...quotationData,
      status: quotationData.status || 'pending',
    });
  },
  updateQuotation: async (quotationId, updateData) => {
    return quotationStorageService.updateQuotation(quotationId, updateData);
  },
  deleteQuotation: async (quotationId) => {
    await quotationStorageService.deleteQuotation(quotationId);
    return { success: true };
  },
  approveQuotation: async (quotationId, approvalData) => {
    return quotationStorageService.updateQuotation(quotationId, {
      status: 'approved',
      approvedBy: approvalData?.approvedBy || 'manager',
      approvedAt: new Date().toISOString(),
    });
  },
  rejectQuotation: async (quotationId, rejectionData) => {
    return quotationStorageService.updateQuotation(quotationId, {
      status: 'rejected',
      rejectedBy: rejectionData?.rejectedBy || 'manager',
      rejectionReason: rejectionData?.reason || '',
      rejectedAt: new Date().toISOString(),
    });
  },
  getQuotationsByDealer: async (dealerId, params = {}) => {
    const all = await quotationStorageService.getQuotations();
    const own = (all || []).filter(q => q.dealerId === dealerId);
    return storageQuotationService.getQuotations({ ...params, search: params.search, page: params.page, limit: params.limit, status: params.status, _data: own });
  },
  getQuotationsByStatus: async (status, params = {}) => {
    return storageQuotationService.getQuotations({ ...params, status });
  },
  searchQuotations: async (searchParams) => {
    return storageQuotationService.getQuotations({ search: searchParams?.query || '' });
  },
  getQuotationStatistics: async () => {
    const all = await quotationStorageService.getQuotations();
    const list = Array.isArray(all) ? all : [];
    return {
      total: list.length,
      pending: list.filter(q => q.status === 'pending').length,
      paid: list.filter(q => q.status === 'paid').length,
      approved: list.filter(q => q.status === 'approved').length,
      rejected: list.filter(q => q.status === 'rejected').length,
    };
  },
  exportQuotations: async () => ({ success: false }),
  sendQuotationEmail: async () => ({ success: false }),
};

export const quotationService = storageQuotationService;
