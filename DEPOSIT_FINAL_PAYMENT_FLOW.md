# Deposit Final Payment Flow

## ✅ Đã Hoàn Thành

Đã triển khai chức năng thanh toán phần còn lại cho deposits với QR code và auto-save vào các màn hình tương ứng.

---

## 🎯 Complete Flow

### **Flow 1: Trả Full**
```
Deposit (Đã xác nhận) → Thanh toán phần còn lại
  ↓
Chọn "Trả full"
  ↓
QR Payment Modal
  • Hiển thị số tiền: 1.000.000.000 ₫
  • QR Code (VNPay Demo)
  • Instructions
  ↓
Khách hàng quét QR → Thanh toán
  ↓
Staff nhấn "Xác nhận thanh toán"
  ↓
Processing (2 seconds)
  ↓
✅ Actions:
  1. Create Quotation → Save to Sales (QuotationManagement)
     • Status: 'paid'
     • PaymentType: 'full'
     • Filter: "Đã thanh toán"
  
  2. Add Customer → Save to Customers (CustomerManagement)
     • Tab: "Khách hàng"
     • purchaseDate: today
     • orderValue: vehicle price
  
  3. Update Deposit → Status: 'completed'
     • finalPaymentType: 'full'
     • quotationId: linked
  ↓
Success Alert:
  "✅ Đã thanh toán full!
   📋 Báo giá [ID] đã được tạo
   👤 Khách hàng đã được thêm vào danh sách
   
   ➡️ Xem tại màn hình 'Sales' và 'Customers'"
  ↓
Navigate back
  ↓
✅ Deposit appears in "Hoàn thành" filter
```

### **Flow 2: Trả Góp**
```
Deposit (Đã xác nhận) → Thanh toán phần còn lại
  ↓
Chọn "Trả góp" → Chọn kỳ hạn (12 tháng)
  ↓
Nhấn "Xác nhận trả góp 12 tháng"
  ↓
QR Payment Modal
  • Hiển thị số tiền: 1.000.000.000 ₫
  • Note: "Trả góp 12 tháng • 88.000.000 ₫/tháng"
  • QR Code (VNPay Demo)
  ↓
Khách hàng quét QR → Thanh toán kỳ đầu
  ↓
Staff nhấn "Xác nhận thanh toán"
  ↓
Processing (2 seconds)
  ↓
✅ Actions:
  1. Create Installment Plan → Save to Installments
     • quotationId: Q-[DepositID]
     • totalAmount: 1.000.000.000 ₫
     • months: 12
     • monthlyPayment: calculated
     • paymentSchedule: generated
  
  2. Update Deposit → Status: 'completed'
     • finalPaymentType: 'installment'
     • installmentMonths: 12
     • installmentId: linked
  ↓
Success Alert:
  "✅ Kế hoạch trả góp 12 tháng đã được tạo!
   📅 Mã trả góp: [ID]
   💰 Trả hàng tháng: 88.000.000 ₫
   
   ➡️ Xem tại màn hình 'Quản lý trả góp'"
  ↓
Navigate back
  ↓
✅ Deposit appears in "Hoàn thành" filter
✅ Installment appears in InstallmentManagement
```

---

## 🔧 Technical Implementation

### **1. Payment Type Selection:**

```javascript
const handlePaymentTypeSelect = (paymentType) => {
  if (paymentType === 'full') {
    // Direct to QR payment for full payment
    setSelectedPaymentType('full');
    setShowPaymentTypeModal(false);
    setTimeout(() => setShowQRPaymentModal(true), 300);
  }
  // For installment, just select it (user will click confirm button)
};

const handleConfirmInstallmentPayment = () => {
  setShowPaymentTypeModal(false);
  setTimeout(() => setShowQRPaymentModal(true), 300);
};
```

### **2. Process Full Payment:**

```javascript
const processFullPayment = async () => {
  try {
    // 1. Create quotation from deposit
    const quotationData = {
      customerId: deposit.customerId,
      customerName: deposit.customerName,
      customerPhone: deposit.customerPhone,
      vehicleModel: deposit.vehicleModel,
      vehicleColor: deposit.vehicleColor,
      items: [{
        vehicleId: deposit.vehicleId,
        model: deposit.vehicleModel,
        color: deposit.vehicleColor,
        price: deposit.vehiclePrice,
        quantity: 1,
      }],
      pricing: {
        basePrice: deposit.vehiclePrice,
        totalPrice: deposit.vehiclePrice,
      },
      totalAmount: deposit.vehiclePrice,
      status: 'paid',           // ✅ Status: paid
      paymentType: 'full',      // ✅ Payment type: full
      paymentStatus: 'completed',
      paymentCompletedAt: new Date().toISOString(),
      notes: `Từ đặt cọc ${deposit.id}`,
      depositId: deposit.id,    // ✅ Link to deposit
    };

    const newQuotation = await quotationStorageService.addQuotation(quotationData);
    console.log('✅ Quotation created:', newQuotation.id);

    // 2. Add customer to management
    await CustomerManagementService.addCustomerFromQuotation({
      ...newQuotation,
      customerName: deposit.customerName,
      customerPhone: deposit.customerPhone,
      vehicleModel: deposit.vehicleModel,
      vehicleColor: deposit.vehicleColor,
      totalAmount: deposit.vehiclePrice,
    });
    console.log('✅ Customer added to management');

    // 3. Update deposit status
    await depositStorageService.updateDeposit(deposit.id, {
      status: 'completed',
      finalPaymentType: 'full',
      finalPaymentDate: new Date().toISOString(),
      quotationId: newQuotation.id,
    });

    // Success alert
    Alert.alert(
      'Thanh toán thành công',
      `✅ Đã thanh toán full!\n\n📋 Báo giá ${newQuotation.id} đã được tạo\n👤 Khách hàng đã được thêm vào danh sách\n\n➡️ Xem tại màn hình "Sales" và "Customers"`
    );
  } catch (error) {
    console.error('Error processing full payment:', error);
    throw error;
  }
};
```

### **3. Process Installment Payment:**

```javascript
const processInstallmentPayment = async () => {
  try {
    // 1. Create installment plan
    const installment = await installmentStorageService.createInstallment({
      quotationId: `Q-${deposit.id}`,  // ✅ Link to deposit
      customerId: deposit.customerId,
      customerName: deposit.customerName,
      customerPhone: deposit.customerPhone,
      vehicleModel: deposit.vehicleModel,
      vehicleColor: deposit.vehicleColor,
      totalAmount: deposit.remainingAmount,
      installmentMonths: installmentMonths,
      interestRate: 6.0,
      startDate: new Date().toISOString(),
      depositId: deposit.id,            // ✅ Link to deposit
    });
    console.log('✅ Installment created:', installment.id);

    // 2. Update deposit status
    await depositStorageService.updateDeposit(deposit.id, {
      status: 'completed',
      finalPaymentType: 'installment',
      installmentMonths: installmentMonths,
      installmentId: installment.id,    // ✅ Link to installment
      finalPaymentDate: new Date().toISOString(),
    });

    // Success alert
    Alert.alert(
      'Thanh toán thành công',
      `✅ Kế hoạch trả góp ${installmentMonths} tháng đã được tạo!\n\n📅 Mã trả góp: ${installment.id}\n💰 Trả hàng tháng: ${formatCurrency(installment.monthlyPayment)}\n\n➡️ Xem tại màn hình "Quản lý trả góp"`
    );
  } catch (error) {
    console.error('Error processing installment payment:', error);
    throw error;
  }
};
```

### **4. QR Payment Modal:**

```javascript
<Modal visible={showQRPaymentModal} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.qrPaymentModalContent}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Thanh toán phần còn lại</Text>
        {!processingPayment && (
          <TouchableOpacity onPress={() => setShowQRPaymentModal(false)}>
            <Text style={styles.closeIcon}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView>
        {/* Payment Info */}
        <View style={styles.qrPaymentInfo}>
          <Text style={styles.qrPaymentLabel}>Số tiền thanh toán:</Text>
          <Text style={styles.qrPaymentAmount}>
            {formatCurrency(deposit.remainingAmount)}
          </Text>
          {selectedPaymentType === 'installment' && (
            <Text style={styles.qrPaymentNote}>
              Trả góp {installmentMonths} tháng • {formatCurrency(monthlyPayment)}/tháng
            </Text>
          )}
          {selectedPaymentType === 'full' && (
            <Text style={styles.qrPaymentNote}>Thanh toán full</Text>
          )}
        </View>

        {/* QR Code */}
        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Quét mã QR để thanh toán</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrIcon}>📱</Text>
              <Text style={styles.qrText}>VNPay QR Code</Text>
              <Text style={styles.qrData}>Demo Mode</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.paymentInstructions}>
          <Text style={styles.instructionsTitle}>Hướng dẫn thanh toán:</Text>
          <Text style={styles.instructionText}>1. Mở ứng dụng VNPay hoặc app ngân hàng</Text>
          <Text style={styles.instructionText}>2. Quét mã QR phía trên</Text>
          <Text style={styles.instructionText}>3. Xác nhận thông tin thanh toán</Text>
          <Text style={styles.instructionText}>4. Nhấn "Xác nhận thanh toán" bên dưới</Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmPaymentButton, processingPayment && styles.disabledButton]}
          onPress={processDepositPayment}
          disabled={processingPayment}
        >
          <LinearGradient
            colors={processingPayment ? ['#CCCCCC', '#999999'] : COLORS.GRADIENT.GREEN}
            style={styles.confirmPaymentButtonGradient}
          >
            {processingPayment ? (
              <>
                <ActivityIndicator color={COLORS.TEXT.WHITE} style={{ marginRight: 10 }} />
                <Text style={styles.confirmPaymentButtonText}>Đang xử lý...</Text>
              </>
            ) : (
              <Text style={styles.confirmPaymentButtonText}>✓ Xác nhận thanh toán</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>
```

---

## 📊 Data Relationships

### **Full Payment:**
```
Deposit (DEP001)
  ↓
Payment (Full)
  ↓
Creates:
  ├─ Quotation (Q123456)
  │   ├─ status: 'paid'
  │   ├─ paymentType: 'full'
  │   ├─ depositId: 'DEP001'
  │   └─ totalAmount: 1.250.000.000 ₫
  │
  └─ Customer (C789012)
      ├─ purchaseDate: today
      ├─ orderValue: 1.250.000.000 ₫
      ├─ vehicleModel: 'Tesla Model Y'
      └─ vehicleColor: 'Đen'

Deposit updated:
  ├─ status: 'completed'
  ├─ finalPaymentType: 'full'
  └─ quotationId: 'Q123456'
```

### **Installment Payment:**
```
Deposit (DEP001)
  ↓
Payment (Installment - 12 months)
  ↓
Creates:
  └─ Installment (INST345678)
      ├─ quotationId: 'Q-DEP001'
      ├─ depositId: 'DEP001'
      ├─ totalAmount: 1.000.000.000 ₫
      ├─ installmentMonths: 12
      ├─ monthlyPayment: 88.000.000 ₫
      └─ paymentSchedule: [12 payments]

Deposit updated:
  ├─ status: 'completed'
  ├─ finalPaymentType: 'installment'
  ├─ installmentMonths: 12
  └─ installmentId: 'INST345678'
```

---

## 📱 UI Preview

### **Payment Type Modal (Unselected State):**
```
┌─────────────────────────────────────┐
│ Chọn hình thức thanh toán         × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (White bg, black text)
│ │ 💰 Trả full                      │ │
│ │    Thanh toán một lần            │ │
│ │ ──────────────────────────────  │ │
│ │ Tổng: 1.000.000.000 ₫           │ │ (Gray box)
│ │ Lãi suất: 0%                     │ │
│ │ ✓ Không phát sinh lãi            │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │ (White bg, black text)
│ │ 📅 Trả góp                       │ │
│ │    Thanh toán theo tháng         │ │
│ │ ──────────────────────────────  │ │
│ │ Trả/tháng: 88.000.000 ₫         │ │ (Gray box)
│ │ Tổng: 1.056.000.000 ₫           │ │
│ │ ✓ Thanh toán linh hoạt           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Payment Type Modal (Full Selected):**
```
┌─────────────────────────────────────┐
│ Chọn hình thức thanh toán         × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (Blue gradient, white text)
│ │ 💰 Trả full                      │ │
│ │    Thanh toán một lần            │ │
│ │ ──────────────────────────────  │ │
│ │ Tổng: 1.000.000.000 ₫           │ │ (Semi-transparent white)
│ │ Lãi suất: 0%                     │ │
│ │ ✓ Không phát sinh lãi            │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [Automatically opens QR modal]       │
└─────────────────────────────────────┘
```

### **Payment Type Modal (Installment Selected):**
```
┌─────────────────────────────────────┐
│ Chọn hình thức thanh toán         × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (Purple gradient, white text)
│ │ 📅 Trả góp                       │ │
│ │    Thanh toán theo tháng         │ │
│ │                                  │ │
│ │ Chọn kỳ hạn:                    │ │
│ │ [6] [12✓] [24] [36] tháng       │ │
│ │ ──────────────────────────────  │ │
│ │ Trả/tháng: 88.000.000 ₫         │ │ (Semi-transparent white)
│ │ Tổng: 1.056.000.000 ₫           │ │
│ │ Lãi: 6%/năm                     │ │
│ │ ✓ Thanh toán linh hoạt           │ │
│ │                                  │ │
│ │ [Xác nhận trả góp 12 tháng]     │ │ (Blue button)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **QR Payment Modal:**
```
┌─────────────────────────────────────┐
│ Thanh toán phần còn lại           × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (Blue info card)
│ │  Số tiền thanh toán:            │ │
│ │  1.000.000.000 ₫                │ │ (Big, bold)
│ │  Trả full / Trả góp 12 tháng    │ │ (Note)
│ └─────────────────────────────────┘ │
│                                      │
│ Quét mã QR để thanh toán            │
│ ┌─────────────────────────────────┐ │
│ │┌───────────────────────────────┐│ │
│ ││                               ││ │
│ ││       📱                      ││ │
│ ││   VNPay QR Code               ││ │
│ ││   Demo Mode                   ││ │
│ ││                               ││ │
│ │└───────────────────────────────┘│ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │ (Yellow box)
│ │ Hướng dẫn thanh toán:           │ │
│ │ 1. Mở ứng dụng VNPay            │ │
│ │ 2. Quét mã QR phía trên         │ │
│ │ 3. Xác nhận thông tin           │ │
│ │ 4. Nhấn "Xác nhận" bên dưới     │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │  ✓ Xác nhận thanh toán          │ │ (Green gradient)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Processing State:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │  ⏳ Đang xử lý...                │ │ (Gray, disabled)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 Backend Integration Ready

### **API Endpoints:**

```javascript
// Full payment
POST /api/deposits/:depositId/final-payment/full
{
  depositId: 'DEP001',
  customerId: 'C123',
  remainingAmount: 1000000000,
  paymentMethod: 'vnpay_qr',
}

Response:
{
  success: true,
  quotation: {
    id: 'Q123456',
    status: 'paid',
    paymentType: 'full',
  },
  customer: {
    id: 'C123',
    addedToManagement: true,
  },
  deposit: {
    id: 'DEP001',
    status: 'completed',
    finalPaymentType: 'full',
  },
}

// Installment payment
POST /api/deposits/:depositId/final-payment/installment
{
  depositId: 'DEP001',
  customerId: 'C123',
  remainingAmount: 1000000000,
  installmentMonths: 12,
  interestRate: 6.0,
  paymentMethod: 'vnpay_qr',
}

Response:
{
  success: true,
  installment: {
    id: 'INST345678',
    quotationId: 'Q-DEP001',
    monthlyPayment: 88000000,
    paymentSchedule: [...],
  },
  deposit: {
    id: 'DEP001',
    status: 'completed',
    finalPaymentType: 'installment',
    installmentId: 'INST345678',
  },
}

// VNPay QR Code
POST /api/payments/vnpay/create-qr
{
  amount: 1000000000,
  orderId: 'DEP001',
  orderInfo: 'Thanh toán phần còn lại đặt cọc',
}

Response:
{
  qrCode: 'data:image/png;base64,...',
  paymentUrl: 'https://sandbox.vnpayment.vn/...',
  transactionId: 'VNP123456789',
}
```

---

## ✅ Features Summary

### **Completed:**
```
✅ Payment type selection modal (white bg default)
✅ Conditional gradient (selected state only)
✅ QR payment modal for both full & installment
✅ Full payment flow:
   ✅ Create quotation → Sales (status: paid)
   ✅ Add customer → Customers tab
   ✅ Update deposit → completed
✅ Installment payment flow:
   ✅ Create installment plan → Installments
   ✅ Update deposit → completed
✅ Processing state with loading indicator
✅ Success alerts with navigation hints
✅ Auto-link related records (quotationId, installmentId)
✅ Error handling
✅ Console logging for debugging
✅ No linter errors
```

---

## 🧪 Testing

### **Test Full Payment:**
```
1. Deposit với status 'confirmed' (Đã xác nhận)
2. Click "Thanh toán phần còn lại"
3. ✅ Payment type modal opens (both cards white)
4. Click "Trả full"
5. ✅ Card turns blue with white text
6. ✅ QR modal auto-opens
7. ✅ See amount: 1.000.000.000 ₫
8. ✅ See note: "Thanh toán full"
9. Click "Xác nhận thanh toán"
10. ✅ Button shows loading: "Đang xử lý..."
11. ✅ After 2s, success alert
12. ✅ Navigate back
13. Verify:
   ✅ Sales screen → New quotation (paid)
   ✅ Customers screen → New customer
   ✅ Deposit → Status: completed
```

### **Test Installment Payment:**
```
1. Deposit với status 'confirmed'
2. Click "Thanh toán phần còn lại"
3. ✅ Payment type modal opens (both cards white)
4. Click "Trả góp"
5. ✅ Card turns purple with white text
6. ✅ Month options appear
7. Select "12 tháng"
8. ✅ See calculations update
9. Click "Xác nhận trả góp 12 tháng"
10. ✅ QR modal auto-opens
11. ✅ See amount with installment note
12. Click "Xác nhận thanh toán"
13. ✅ Button shows loading
14. ✅ After 2s, success alert
15. ✅ Navigate back
16. Verify:
   ✅ Installments screen → New plan
   ✅ Deposit → Status: completed
```

---

## ✨ Summary

**Deposit final payment flow hoàn chỉnh!** 🎯

- ✅ **Trả full**: QR → Quotation (Sales) + Customer (Customers)
- ✅ **Trả góp**: QR → Installment plan (Installments)
- ✅ **Both**: Update deposit to completed
- ✅ Auto-link records with IDs
- ✅ Beautiful QR modal UI
- ✅ Processing state with loading
- ✅ Clear success messages
- ✅ Ready for VNPay integration

**Ready for backend! 🚀**
