import { COLORS } from '../constants';

/**
 * Format payment amount for display
 * @param {number} amount - Amount in VND
 * @returns {string} Formatted amount
 */
export const formatPaymentAmount = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Get payment status color
 * @param {string} status - Payment status
 * @returns {string} Color code
 */
export const getPaymentStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return COLORS.WARNING;
    case 'completed':
    case 'success':
      return COLORS.SUCCESS;
    case 'failed':
    case 'cancelled':
      return COLORS.ERROR;
    case 'expired':
      return COLORS.TEXT.SECONDARY;
    default:
      return COLORS.TEXT.SECONDARY;
  }
};

/**
 * Get payment status text in Vietnamese
 * @param {string} status - Payment status
 * @returns {string} Status text
 */
export const getPaymentStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'Chờ thanh toán';
    case 'completed':
    case 'success':
      return 'Đã thanh toán';
    case 'failed':
      return 'Thanh toán thất bại';
    case 'cancelled':
      return 'Đã hủy';
    case 'expired':
      return 'Hết hạn';
    default:
      return 'Không xác định';
  }
};

/**
 * Get quotation status based on payment status
 * @param {string} paymentStatus - Payment status
 * @returns {string} Quotation status
 */
export const getQuotationStatusFromPayment = (paymentStatus) => {
  switch (paymentStatus) {
    case 'completed':
    case 'success':
      return 'paid';
    case 'failed':
    case 'cancelled':
      return 'pending';
    case 'expired':
      return 'expired';
    default:
      return 'pending';
  }
};

/**
 * Check if payment is expired
 * @param {string} expiresAt - Expiration timestamp
 * @returns {boolean} Is expired
 */
export const isPaymentExpired = (expiresAt) => {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
};

/**
 * Get time remaining until payment expires
 * @param {string} expiresAt - Expiration timestamp
 * @returns {number} Minutes remaining
 */
export const getPaymentTimeRemaining = (expiresAt) => {
  if (!expiresAt) return 0;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry - now;
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

/**
 * Generate VNPay payment URL
 * @param {Object} paymentData - Payment data
 * @returns {string} Payment URL
 */
export const generateVNPayUrl = (paymentData) => {
  const baseUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const params = new URLSearchParams({
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: 'EVDOCK01', // Merchant code
    vnp_Amount: paymentData.amount * 100, // VNPay requires amount in cents
    vnp_CurrCode: 'VND',
    vnp_TxnRef: paymentData.quotationId,
    vnp_OrderInfo: paymentData.orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: paymentData.returnUrl,
    vnp_IpAddr: '127.0.0.1',
    vnp_CreateDate: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
  });

  return `${baseUrl}?${params.toString()}`;
};

/**
 * Validate payment callback data
 * @param {Object} callbackData - VNPay callback data
 * @returns {boolean} Is valid
 */
export const validatePaymentCallback = (callbackData) => {
  const requiredFields = ['vnp_TxnRef', 'vnp_Amount', 'vnp_ResponseCode'];
  return requiredFields.every(field => callbackData[field] !== undefined);
};

/**
 * Format payment method for display
 * @param {string} method - Payment method
 * @returns {string} Formatted method
 */
export const formatPaymentMethod = (method) => {
  switch (method) {
    case 'vnpay':
      return 'VNPay';
    case 'bank_transfer':
      return 'Chuyển khoản ngân hàng';
    case 'cash':
      return 'Tiền mặt';
    case 'credit_card':
      return 'Thẻ tín dụng';
    default:
      return method;
  }
};

/**
 * Generate payment reference number
 * @param {string} quotationId - Quotation ID
 * @returns {string} Payment reference
 */
export const generatePaymentReference = (quotationId) => {
  const timestamp = Date.now().toString().slice(-6);
  return `PAY_${quotationId}_${timestamp}`;
};

/**
 * Calculate payment fee
 * @param {number} amount - Payment amount
 * @param {string} method - Payment method
 * @returns {number} Fee amount
 */
export const calculatePaymentFee = (amount, method = 'vnpay') => {
  const feeRates = {
    vnpay: 0.015, // 1.5%
    bank_transfer: 0.01, // 1%
    credit_card: 0.02, // 2%
    cash: 0, // No fee
  };

  const rate = feeRates[method] || 0.015;
  return Math.round(amount * rate);
};

/**
 * Format payment instructions
 * @param {string} method - Payment method
 * @returns {Array} Instruction steps
 */
export const getPaymentInstructions = (method = 'vnpay') => {
  const instructions = {
    vnpay: [
      'Mở ứng dụng VNPay trên điện thoại',
      'Quét mã QR trên màn hình',
      'Xác nhận thông tin thanh toán',
      'Nhập mã OTP để hoàn tất giao dịch',
    ],
    bank_transfer: [
      'Chuyển khoản đến tài khoản ngân hàng',
      'Nội dung: THANH TOAN [Mã báo giá]',
      'Số tiền: [Số tiền cần thanh toán]',
      'Gửi biên lai chuyển khoản cho nhân viên',
    ],
    credit_card: [
      'Cung cấp thông tin thẻ tín dụng',
      'Xác nhận thông tin thanh toán',
      'Nhập mã CVV và OTP',
      'Hoàn tất giao dịch',
    ],
    cash: [
      'Thanh toán trực tiếp tại showroom',
      'Nhận biên lai thanh toán',
      'Hoàn tất thủ tục mua xe',
    ],
  };

  return instructions[method] || instructions.vnpay;
};
