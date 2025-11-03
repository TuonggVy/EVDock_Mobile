import api from './api/axiosInstance';

/**
 * Deposit Service
 * Handles all deposit-related API calls
 * Backend integration for Dealer Staff Deposit API
 */

// API Endpoints - Backend integration
const DEPOSIT_ENDPOINTS = {
  CREATE: '/deposit',
  GET_BY_ID: (depositId) => `/deposit/${depositId}`,
  UPDATE: (depositId) => `/deposit/${depositId}`,
  DELETE: (depositId) => `/deposit/${depositId}`,
};

/**
 * Create new deposit
 * @param {Object} depositData - Deposit data (quotationId, depositPercent, depositAmount, holdDay)
 * @returns {Promise<Object>} Created deposit
 */
export const createDeposit = async (depositData) => {
  try {
    const response = await api.post(DEPOSIT_ENDPOINTS.CREATE, depositData);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Error creating deposit:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to create deposit'
    };
  }
};

/**
 * Get deposit by ID
 * @param {number} depositId - Deposit ID
 * @returns {Promise<Object>} Deposit details
 */
export const getDepositById = async (depositId) => {
  try {
    const response = await api.get(DEPOSIT_ENDPOINTS.GET_BY_ID(depositId));
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Error fetching deposit:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to fetch deposit'
    };
  }
};

/**
 * Update deposit status
 * @param {number} depositId - Deposit ID
 * @param {Object} updateData - Update data (status, etc.)
 * @returns {Promise<Object>} Updated deposit
 */
export const updateDepositStatus = async (depositId, updateData) => {
  try {
    const response = await api.patch(DEPOSIT_ENDPOINTS.UPDATE(depositId), updateData);
    return {
      success: true,
      data: response.data?.data || response.data,
    };
  } catch (error) {
    console.error('Error updating deposit:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to update deposit'
    };
  }
};

/**
 * Delete deposit by ID
 * @param {number} depositId - Deposit ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteDeposit = async (depositId) => {
  try {
    const response = await api.delete(DEPOSIT_ENDPOINTS.DELETE(depositId));
    return {
      success: true,
      data: response.data?.data || {},
    };
  } catch (error) {
    console.error('Error deleting deposit:', error);
    return {
      success: false,
      data: null,
      error: error.response?.data?.message || 'Failed to delete deposit'
    };
  }
};

// Main service object
export const depositService = {
  createDeposit,
  getDepositById,
  updateDepositStatus,
  deleteDeposit,
};

export default depositService;

