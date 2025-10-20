import { useState, useCallback } from 'react';
import depositStorageService from '../services/storage/depositStorageService';
import depositPaymentService from '../services/depositPaymentService';

/**
 * Custom hook for deposit management
 * Centralizes deposit-related state and logic
 * Easy to integrate with backend API
 */
export const useDepositManagement = () => {
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load all deposits
   */
  const loadDeposits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with API call
      // const response = await fetch(`${API_URL}/deposits`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      // });
      // const data = await response.json();
      // setDeposits(data);

      // Mock implementation
      let allDeposits = await depositStorageService.getDeposits();
      
      // Initialize with mock data if empty
      if (allDeposits.length === 0) {
        allDeposits = await depositStorageService.initializeWithMockData();
      }
      
      setDeposits(allDeposits);
      setLoading(false);
    } catch (err) {
      console.error('Error loading deposits:', err);
      setError('Không thể tải danh sách đặt cọc');
      setLoading(false);
    }
  }, []);

  /**
   * Get deposit by ID
   */
  const getDepositById = useCallback(async (depositId) => {
    try {
      // TODO: Replace with API call
      // const response = await fetch(`${API_URL}/deposits/${depositId}`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      // });
      // const data = await response.json();
      // return data;

      // Mock implementation
      return await depositStorageService.getDepositById(depositId);
    } catch (err) {
      console.error('Error getting deposit:', err);
      throw new Error('Không thể lấy thông tin đặt cọc');
    }
  }, []);

  /**
   * Confirm deposit
   */
  const confirmDeposit = useCallback(async (depositId) => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with API call
      // const response = await fetch(`${API_URL}/deposits/${depositId}/confirm`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     confirmedBy: 'staff_user_id',
      //     confirmedAt: new Date().toISOString(),
      //   }),
      // });
      // const data = await response.json();
      // return data;

      // Mock implementation
      const updatedDeposit = await depositStorageService.updateDeposit(depositId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'Dealer Staff',
      });

      setLoading(false);
      return updatedDeposit;
    } catch (err) {
      console.error('Error confirming deposit:', err);
      setError('Không thể xác nhận đặt cọc');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Process final payment (full or installment)
   */
  const processFinalPayment = useCallback(async (deposit, paymentType, installmentMonths = null) => {
    try {
      setLoading(true);
      setError(null);

      let result;

      if (paymentType === 'full') {
        // Process full payment
        result = await depositPaymentService.processFullPayment(deposit);
      } else if (paymentType === 'installment') {
        // Process installment payment
        result = await depositPaymentService.processInstallmentPayment(deposit, installmentMonths);
      }

      setLoading(false);
      return result;
    } catch (err) {
      console.error('Error processing final payment:', err);
      setError(err.message || 'Không thể xử lý thanh toán');
      setLoading(false);
      throw err;
    }
  }, []);

  /**
   * Filter deposits by type
   */
  const getDepositsByType = useCallback((type) => {
    return deposits.filter(d => d.type === type);
  }, [deposits]);

  /**
   * Filter deposits by status
   */
  const getDepositsByStatus = useCallback((status) => {
    return deposits.filter(d => d.status === status);
  }, [deposits]);

  /**
   * Search deposits
   */
  const searchDeposits = useCallback((query) => {
    if (!query.trim()) return deposits;

    const lowercaseQuery = query.toLowerCase();
    return deposits.filter(d =>
      d.customerName.toLowerCase().includes(lowercaseQuery) ||
      d.customerPhone.includes(query) ||
      d.vehicleModel.toLowerCase().includes(lowercaseQuery) ||
      d.id.toLowerCase().includes(lowercaseQuery)
    );
  }, [deposits]);

  /**
   * Get deposit statistics
   */
  const getDepositStats = useCallback(() => {
    return {
      total: deposits.length,
      available: deposits.filter(d => d.type === 'available').length,
      preOrder: deposits.filter(d => d.type === 'pre_order').length,
      pending: deposits.filter(d => d.status === 'pending').length,
      confirmed: deposits.filter(d => d.status === 'confirmed').length,
      completed: deposits.filter(d => d.status === 'completed').length,
      totalDepositAmount: deposits.reduce((sum, d) => sum + d.depositAmount, 0),
      totalRemainingAmount: deposits.filter(d => d.status !== 'completed').reduce((sum, d) => sum + d.remainingAmount, 0),
    };
  }, [deposits]);

  return {
    // State
    deposits,
    loading,
    error,

    // Actions
    loadDeposits,
    getDepositById,
    confirmDeposit,
    processFinalPayment,

    // Filters
    getDepositsByType,
    getDepositsByStatus,
    searchDeposits,

    // Stats
    getDepositStats,
  };
};

export default useDepositManagement;

