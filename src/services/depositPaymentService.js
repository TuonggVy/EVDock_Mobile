import depositStorageService from './storage/depositStorageService';
import quotationStorageService from './storage/quotationStorageService';
import installmentStorageService from './storage/installmentStorageService';
import CustomerManagementService from './customerManagementService';

/**
 * Deposit Payment Service
 * Handles final payment processing for deposits
 * Easy to integrate with backend API calls
 */
class DepositPaymentService {
  /**
   * Create payment request (VNPay QR Code)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment data with QR code
   */
  async createPaymentRequest(paymentData) {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/deposits/payment/create`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     depositId: paymentData.depositId,
      //     amount: paymentData.amount,
      //     paymentType: paymentData.paymentType,
      //     installmentMonths: paymentData.installmentMonths,
      //     customerId: paymentData.customerId,
      //   }),
      // });
      // const result = await response.json();
      // return result;

      // Mock response for development
      console.log('📤 Creating payment request:', paymentData);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockPaymentData = {
        paymentId: `PAY${Date.now()}`,
        qrCode: `VNPAY_QR_${paymentData.depositId}_${paymentData.amount}`,
        qrCodeImage: null, // TODO: Generate actual QR code
        paymentUrl: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=${paymentData.amount}`,
        transactionId: `TXN${Date.now()}`,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
        status: 'pending',
      };

      console.log('✅ Payment request created:', mockPaymentData.paymentId);
      return mockPaymentData;
    } catch (error) {
      console.error('❌ Error creating payment request:', error);
      throw new Error('Không thể tạo yêu cầu thanh toán. Vui lòng thử lại.');
    }
  }

  /**
   * Process full payment for deposit
   * @param {Object} depositData - Deposit data
   * @returns {Promise<Object>} Result with quotation and customer
   */
  async processFullPayment(depositData) {
    try {
      console.log('📤 Processing full payment for deposit:', depositData.id);

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/full`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     depositId: depositData.id,
      //     customerId: depositData.customerId,
      //     paymentAmount: depositData.remainingAmount,
      //     paymentMethod: 'vnpay_qr',
      //   }),
      // });
      // const result = await response.json();
      // return result;

      // Mock implementation for development
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Create quotation from deposit
      const quotationData = {
        customerId: depositData.customerId || `C${Date.now()}`,
        customerName: depositData.customerName,
        customerPhone: depositData.customerPhone,
        customerEmail: depositData.customerEmail || '',
        vehicleModel: depositData.vehicleModel,
        vehicleColor: depositData.vehicleColor,
        items: [{
          vehicleId: depositData.vehicleId || null,
          model: depositData.vehicleModel,
          color: depositData.vehicleColor,
          price: depositData.vehiclePrice,
          quantity: 1,
        }],
        pricing: {
          basePrice: depositData.vehiclePrice,
          totalPrice: depositData.vehiclePrice,
          depositAmount: depositData.depositAmount,
          finalAmount: depositData.remainingAmount,
        },
        totalAmount: depositData.vehiclePrice,
        status: 'paid',
        paymentType: 'full',
        paymentStatus: 'completed',
        paymentCompletedAt: new Date().toISOString(),
        notes: `Từ đặt cọc ${depositData.id}`,
        createdBy: 'Dealer Staff',
        depositId: depositData.id,
      };

      const newQuotation = await quotationStorageService.addQuotation(quotationData);
      console.log('✅ Quotation created from deposit:', newQuotation.id);

      // 2. Add customer to management
      const customerData = {
        id: newQuotation.id,
        customerId: depositData.customerId || `C${Date.now()}`,
        customerName: depositData.customerName,
        customerPhone: depositData.customerPhone,
        vehicleModel: depositData.vehicleModel,
        vehicleColor: depositData.vehicleColor,
        totalAmount: depositData.vehiclePrice,
        pricing: quotationData.pricing,
      };

      await CustomerManagementService.addCustomerFromQuotation(customerData);
      console.log('✅ Customer added to management');

      // 3. Update deposit status
      await depositStorageService.updateDeposit(depositData.id, {
        status: 'completed',
        finalPaymentType: 'full',
        finalPaymentDate: new Date().toISOString(),
        finalPaymentAmount: depositData.remainingAmount,
        quotationId: newQuotation.id,
        completedBy: 'Dealer Staff',
      });
      console.log('✅ Deposit updated to completed');

      return {
        success: true,
        quotation: newQuotation,
        customer: customerData,
        deposit: {
          id: depositData.id,
          status: 'completed',
          quotationId: newQuotation.id,
        },
      };
    } catch (error) {
      console.error('❌ Error processing full payment:', error);
      throw new Error('Không thể xử lý thanh toán full. Vui lòng thử lại.');
    }
  }

  /**
   * Process installment payment for deposit
   * @param {Object} depositData - Deposit data
   * @param {Number} installmentMonths - Number of months
   * @returns {Promise<Object>} Result with installment plan
   */
  async processInstallmentPayment(depositData, installmentMonths) {
    try {
      console.log('📤 Processing installment payment for deposit:', depositData.id);

      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/installment`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     depositId: depositData.id,
      //     customerId: depositData.customerId,
      //     remainingAmount: depositData.remainingAmount,
      //     installmentMonths: installmentMonths,
      //     interestRate: 6.0,
      //     paymentMethod: 'vnpay_qr',
      //   }),
      // });
      // const result = await response.json();
      // return result;

      // Mock implementation for development
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 1. Create installment plan
      const installmentData = {
        quotationId: `Q-${depositData.id}`,
        customerId: depositData.customerId || `C${Date.now()}`,
        customerName: depositData.customerName,
        customerPhone: depositData.customerPhone,
        vehicleModel: depositData.vehicleModel,
        vehicleColor: depositData.vehicleColor,
        totalAmount: depositData.remainingAmount,
        installmentMonths: installmentMonths,
        interestRate: 6.0,
        startDate: new Date().toISOString(),
        createdBy: 'Dealer Staff',
        depositId: depositData.id,
      };

      const newInstallment = await installmentStorageService.createInstallment(installmentData);
      console.log('✅ Installment plan created:', newInstallment.id);

      // 2. Update deposit status
      await depositStorageService.updateDeposit(depositData.id, {
        status: 'completed',
        finalPaymentType: 'installment',
        installmentMonths: installmentMonths,
        installmentId: newInstallment.id,
        finalPaymentDate: new Date().toISOString(),
        finalPaymentAmount: depositData.remainingAmount,
        completedBy: 'Dealer Staff',
      });
      console.log('✅ Deposit updated to completed');

      return {
        success: true,
        installment: newInstallment,
        deposit: {
          id: depositData.id,
          status: 'completed',
          installmentId: newInstallment.id,
        },
      };
    } catch (error) {
      console.error('❌ Error processing installment payment:', error);
      throw new Error('Không thể xử lý thanh toán trả góp. Vui lòng thử lại.');
    }
  }

  /**
   * Verify payment status (check with VNPay)
   * @param {String} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status
   */
  async verifyPaymentStatus(paymentId) {
    try {
      // TODO: Replace with actual API call to VNPay
      // const response = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      // });
      // const result = await response.json();
      // return result;

      // Mock implementation
      console.log('📤 Verifying payment status:', paymentId);
      
      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        paymentId: paymentId,
        status: 'completed',
        transactionId: `VNP${Date.now()}`,
        verifiedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      throw new Error('Không thể xác minh trạng thái thanh toán.');
    }
  }

  /**
   * Get deposit payment summary
   * @param {String} depositId - Deposit ID
   * @returns {Promise<Object>} Payment summary
   */
  async getPaymentSummary(depositId) {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch(`${API_URL}/deposits/${depositId}/payment-summary`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      // });
      // const result = await response.json();
      // return result;

      // Mock implementation
      const deposit = await depositStorageService.getDepositById(depositId);
      
      if (!deposit) {
        throw new Error('Deposit not found');
      }

      return {
        depositId: deposit.id,
        depositAmount: deposit.depositAmount,
        remainingAmount: deposit.remainingAmount,
        totalAmount: deposit.vehiclePrice,
        status: deposit.status,
        finalPaymentType: deposit.finalPaymentType,
        quotationId: deposit.quotationId,
        installmentId: deposit.installmentId,
      };
    } catch (error) {
      console.error('❌ Error getting payment summary:', error);
      throw new Error('Không thể lấy thông tin thanh toán.');
    }
  }
}

// Export singleton instance
export default new DepositPaymentService();

