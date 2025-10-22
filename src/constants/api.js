// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' // Development URL
    : 'https://evm-project.onrender.com', // Production URL
  
  TIMEOUT: 10000, // 10 seconds
  
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/signin',
      LOGOUT: '/auth/logout',
      REFRESH_TOKEN: '/auth/token',
    },
    USER: {
      PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/profile',
    },
    // Add more endpoints as needed
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// API Response Messages
export const API_MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'An error occurred',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
};
