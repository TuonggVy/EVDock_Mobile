// API Configuration for EVDock Mobile App
// This file contains all API endpoints and configuration for backend integration

// Base API URL - Update this when backend is ready
export const API_BASE_URL = __DEV__ 
  ? 'https://evm-project.onrender.com' // Development - Use actual backend URL
  : 'https://evm-project.onrender.com';   // Production

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },

  // Promotions
  PROMOTIONS: {
    BASE: '/promotions',
    ACTIVE: '/promotions/active',
    VALIDATE: '/promotions/validate',
    USE: (id) => `/promotions/${id}/use`,
    BY_ID: (id) => `/promotions/${id}`,
  },

  // Vehicles
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id) => `/vehicles/${id}`,
    SEARCH: '/vehicles/search',
    FILTER: '/vehicles/filter',
    VERSIONS: '/vehicles/versions',
  },

  // Quotations
  QUOTATIONS: {
    BASE: '/quotations',
    BY_ID: (id) => `/quotations/${id}`,
    CREATE: '/quotations',
    UPDATE: (id) => `/quotations/${id}`,
    DELETE: (id) => `/quotations/${id}`,
  },

  // Customers
  CUSTOMERS: {
    BASE: '/customers',
    BY_ID: (id) => `/customers/${id}`,
    SEARCH: '/customers/search',
  },

  // Orders
  ORDERS: {
    BASE: '/orders',
    BY_ID: (id) => `/orders/${id}`,
    CREATE: '/orders',
    UPDATE: (id) => `/orders/${id}`,
  },

  // Agency
  AGENCY: {
    LIST: '/agency/list',
    BASE: '/agency',
    BY_ID: (id) => `/agency/${id}`,
    DETAIL: (id) => `/agency/detail/${id}`,
  },

  // Drive Trial
  DRIVE_TRIAL: {
    PUBLIC_BOOKING: '/drive-trial/public/booking',
    LIST: (agencyId) => `/drive-trial/list/${agencyId}`,
    DETAIL: (bookingId) => `/drive-trial/detail/${bookingId}`,
    UPDATE: (bookingId) => `/drive-trial/${bookingId}`,
    DELETE: (bookingId) => `/drive-trial/${bookingId}`,
  },
};

// HTTP Headers
export const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// API Response Handler
export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// API Request Helper
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: getHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    return await handleApiResponse(response);
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
  NOT_FOUND: 'Không tìm thấy dữ liệu.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định.',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getHeaders,
  handleApiResponse,
  apiRequest,
  ERROR_MESSAGES,
};