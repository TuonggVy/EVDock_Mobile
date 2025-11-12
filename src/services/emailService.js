import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api/axiosInstance';

// Create a separate axios instance for email requests with longer timeout
// Email sending can take longer due to PDF generation and email delivery
const emailApi = axios.create({
  baseURL: api.defaults.baseURL,
  timeout: 120000, // 120 seconds (2 minutes) timeout for email operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Request interceptor to add auth token for email API
emailApi.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error getting token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Endpoints for Email Service
const ENDPOINTS = {
  SEND_CUSTOMER_CONTRACT: (customerContractId) => `/email/customer-contract/${customerContractId}`,
  SEND_INSTALLMENT_SCHEDULE: (installmentContractId) => `/email/customer/installment-schedule/${installmentContractId}`,
};

class EmailService {
  /**
   * Send customer contract to customer email
   * @param {number} customerContractId - Customer contract ID
   * @returns {Promise<Object>} Response with success status and message
   */
  async sendCustomerContractEmail(customerContractId) {
    try {
      const response = await emailApi.post(ENDPOINTS.SEND_CUSTOMER_CONTRACT(customerContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Email sent successfully',
      };
    } catch (error) {
      console.error('Error sending customer contract email:', error);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout. The email may still be processing. Please check with the customer or try again later.',
          data: null,
        };
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.',
          data: null,
        };
      }
      
      // Handle other errors
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send customer contract email',
        data: null,
      };
    }
  }

  /**
   * Send installment schedule to customer email
   * @param {number} installmentContractId - Installment contract ID
   * @returns {Promise<Object>} Response with success status and message
   */
  async sendInstallmentScheduleEmail(installmentContractId) {
    try {
      const response = await emailApi.post(ENDPOINTS.SEND_INSTALLMENT_SCHEDULE(installmentContractId));
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || 'Email sent successfully',
      };
    } catch (error) {
      console.error('Error sending installment schedule email:', error);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          success: false,
          error: 'Request timeout. The email may still be processing. Please check with the customer or try again later.',
          data: null,
        };
      }
      
      // Handle network errors
      if (error.code === 'ERR_NETWORK' || !error.response) {
        return {
          success: false,
          error: 'Network error. Please check your internet connection and try again.',
          data: null,
        };
      }
      
      // Handle other errors
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to send installment schedule email',
        data: null,
      };
    }
  }
}

const emailService = new EmailService();
export default emailService;

