import { useState, useCallback } from 'react';
import PaymentService from '../services/paymentService';
import { getPaymentStatusText, getPaymentStatusColor, isPaymentExpired } from '../utils/paymentUtils';

const paymentService = new PaymentService();

const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Create payment for quotation
   * @param {Object} quotation - Quotation object
   * @returns {Promise<Object>} Payment data
   */
  const createPayment = useCallback(async (quotation) => {
    setLoading(true);
    setError(null);

    try {
      const paymentData = paymentService.generatePaymentData(quotation);
      const payment = await paymentService.createPayment(paymentData);
      
      return payment;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Check payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status
   */
  const checkPaymentStatus = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);

    try {
      const status = await paymentService.checkPaymentStatus(paymentId);
      return status;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update quotation payment status
   * @param {string} quotationId - Quotation ID
   * @param {string} status - Payment status
   * @returns {Promise<Object>} Updated quotation
   */
  const updateQuotationPaymentStatus = useCallback(async (quotationId, status) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.updateQuotationPaymentStatus(quotationId, status);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Process payment completion
   * @param {string} quotationId - Quotation ID
   * @returns {Promise<Object>} Processing result
   */
  const processPaymentCompletion = useCallback(async (quotationId) => {
    setLoading(true);
    setError(null);

    try {
      // Update quotation status to paid
      const result = await paymentService.updateQuotationPaymentStatus(quotationId, 'completed');
      
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Process VNPay callback
   * @param {Object} callbackData - VNPay callback data
   * @returns {Promise<Object>} Processing result
   */
  const processVNPayCallback = useCallback(async (callbackData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.processVNPayCallback(callbackData);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Validate payment data
   * @param {Object} paymentData - Payment data
   * @returns {boolean} Is valid
   */
  const validatePaymentData = useCallback((paymentData) => {
    const requiredFields = ['quotationId', 'amount'];
    return requiredFields.every(field => paymentData[field] !== undefined && paymentData[field] !== null);
  }, []);

  /**
   * Get payment status info
   * @param {string} status - Payment status
   * @returns {Object} Status info
   */
  const getPaymentStatusInfo = useCallback((status) => {
    return {
      text: getPaymentStatusText(status),
      color: getPaymentStatusColor(status),
      isCompleted: status === 'completed' || status === 'success',
      isFailed: status === 'failed' || status === 'cancelled',
      isExpired: status === 'expired',
    };
  }, []);

  /**
   * Check if payment is expired
   * @param {string} expiresAt - Expiration timestamp
   * @returns {boolean} Is expired
   */
  const checkPaymentExpiry = useCallback((expiresAt) => {
    return isPaymentExpired(expiresAt);
  }, []);

  return {
    loading,
    error,
    createPayment,
    checkPaymentStatus,
    updateQuotationPaymentStatus,
    processPaymentCompletion,
    processVNPayCallback,
    validatePaymentData,
    getPaymentStatusInfo,
    checkPaymentExpiry,
  };
};

export default usePayment;
