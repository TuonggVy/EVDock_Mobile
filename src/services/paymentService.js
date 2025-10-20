import { API_BASE_URL } from '../config/api';
import { quotationStorageService } from './storage/quotationStorageService';
import CustomerManagementService from './customerManagementService';

class PaymentService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/payments`;
  }

  /**
   * Generate payment QR code data for VNPay
   * @param {Object} quotation - Quotation object
   * @returns {Object} Payment data for QR code
   */
  generatePaymentData(quotation) {
    const paymentData = {
      quotationId: quotation.id,
      amount: quotation.pricing?.totalPrice || quotation.totalAmount || 0,
      merchant: 'EVDock',
      timestamp: new Date().toISOString(),
      orderInfo: `Thanh toan don hang ${quotation.id}`,
      returnUrl: 'evdock://payment/return',
      notifyUrl: `${this.baseURL}/vnpay/notify`,
    };
    
    return paymentData;
  }

  /**
   * Create payment request
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment response
   */
  async createPayment(paymentData) {
    // For development, simulate payment creation
    return this.simulatePaymentCreation(paymentData);

    /*
    // Uncomment below when backend is ready:
    try {
      const response = await fetch(`${this.baseURL}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
    */
  }

  /**
   * Check payment status
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status
   */
  async checkPaymentStatus(paymentId) {
    // For development, simulate payment status check
    return this.simulatePaymentStatusCheck(paymentId);

    /*
    // Uncomment below when backend is ready:
    try {
      const response = await fetch(`${this.baseURL}/${paymentId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
    */
  }

  /**
   * Update quotation payment status
   * @param {string} quotationId - Quotation ID
   * @param {string} status - Payment status
   * @returns {Promise<Object>} Updated quotation
   */
  async updateQuotationPaymentStatus(quotationId, status) {
    // For development, simulate status update
    return this.simulateQuotationStatusUpdate(quotationId, status);

    /*
    // Uncomment below when backend is ready:
    try {
      const response = await fetch(`${API_BASE_URL}/quotations/${quotationId}/payment-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // 'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: status }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating quotation payment status:', error);
      throw error;
    }
    */
  }

  /**
   * Process VNPay payment callback
   * @param {Object} callbackData - VNPay callback data
   * @returns {Promise<Object>} Processing result
   */
  async processVNPayCallback(callbackData) {
    // For development, simulate callback processing
    return this.simulateVNPayCallback(callbackData);

    /*
    // Uncomment below when backend is ready:
    try {
      const response = await fetch(`${this.baseURL}/vnpay/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callbackData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error processing VNPay callback:', error);
      throw error;
    }
    */
  }

  // Mock data and simulation methods for development
  simulatePaymentCreation(paymentData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          paymentId: `PAY_${Date.now()}`,
          qrCode: this.generateQRCodeData(paymentData),
          paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${paymentData.amount}&vnp_TxnRef=${paymentData.quotationId}`,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        });
      }, 500);
    });
  }

  simulatePaymentStatusCheck(paymentId) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const statuses = ['pending', 'completed', 'failed'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        resolve({
          paymentId,
          status: randomStatus,
          completedAt: randomStatus === 'completed' ? new Date().toISOString() : null,
          transactionId: randomStatus === 'completed' ? `TXN_${Date.now()}` : null,
        });
      }, 1000);
    });
  }

  simulateQuotationStatusUpdate(quotationId, status) {
    return new Promise(async (resolve) => {
      try {
        // Update quotation status in storage
        const updatedQuotation = await quotationStorageService.updateQuotation(quotationId, {
          status: status === 'completed' ? 'paid' : 'pending',
          paymentStatus: status,
          paymentCompletedAt: status === 'completed' ? new Date().toISOString() : null,
        });

        // If payment is completed, add customer to CustomerManagement
        if (status === 'completed' && updatedQuotation) {
          try {
            // CustomerManagementService is exported as an instance, not a class
            const newCustomer = await CustomerManagementService.addCustomerFromQuotation(updatedQuotation);
            console.log('✅ Customer added to management after payment:', newCustomer);
          } catch (customerError) {
            console.error('❌ Error adding customer to management:', customerError);
            // Don't fail the payment process if customer addition fails
          }
        }

        setTimeout(() => {
          resolve({
            id: quotationId,
            status: status === 'completed' ? 'paid' : 'pending',
            updatedAt: new Date().toISOString(),
            quotation: updatedQuotation,
          });
        }, 500);
      } catch (error) {
        console.error('Error updating quotation status:', error);
        setTimeout(() => {
          resolve({
            id: quotationId,
            status: status === 'completed' ? 'paid' : 'pending',
            updatedAt: new Date().toISOString(),
          });
        }, 500);
      }
    });
  }

  simulateVNPayCallback(callbackData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: callbackData.vnp_ResponseCode === '00',
          message: callbackData.vnp_ResponseCode === '00' ? 'Thanh toán thành công' : 'Thanh toán thất bại',
          quotationId: callbackData.vnp_TxnRef,
          amount: callbackData.vnp_Amount,
        });
      }, 500);
    });
  }

  generateQRCodeData(paymentData) {
    // Generate QR code data for VNPay
    const qrData = {
      version: '1',
      method: 'QR',
      merchant: paymentData.merchant,
      amount: paymentData.amount,
      orderInfo: paymentData.orderInfo,
      returnUrl: paymentData.returnUrl,
      notifyUrl: paymentData.notifyUrl,
      txnRef: paymentData.quotationId,
      timestamp: paymentData.timestamp,
    };

    return JSON.stringify(qrData);
  }
}

export default PaymentService;
