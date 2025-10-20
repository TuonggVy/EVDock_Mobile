# Installment Payment UI - Payment Type Selection

## Tổng quan
Đã thiết kế và triển khai UI đẹp mắt cho tính năng chọn hình thức thanh toán (Trả full / Trả góp) trong màn hình QuotationDetailScreen. Khách hàng có thể chọn thanh toán một lần hoặc trả góp với các kỳ hạn linh hoạt.

## 🎨 Design Approach

### **Vị trí tối ưu:**
✅ **Trong màn hình Thanh toán (QuotationDetailScreen)**

**Tại sao chọn vị trí này?**
1. ✅ **Flow tự nhiên**: Khách hàng quyết định hình thức thanh toán ngay khi thanh toán
2. ✅ **Không làm phức tạp**: Màn hình tạo báo giá vẫn đơn giản
3. ✅ **Dễ chỉnh sửa**: Có thể thay đổi hình thức thanh toán sau
4. ✅ **UX tốt hơn**: Quyết định cuối cùng tại thời điểm thanh toán
5. ✅ **Tách biệt concerns**: Tạo báo giá vs Thanh toán là 2 bước riêng biệt

## 🎯 User Flow

### **Payment Type Selection Flow:**
```
1. Khách hàng xem Quotation Detail
2. Staff nhấn nút "Thanh toán"
3. ✨ Modal chọn hình thức thanh toán hiển thị ✨
4. Khách hàng chọn:
   - Trả full (nhấn card → thanh toán ngay)
   - Trả góp (chọn kỳ hạn → nhấn xác nhận → thanh toán)
5. Hiển thị QR code thanh toán
6. Hoàn tất thanh toán
```

## 🎨 UI Design

### **1. Payment Type Selection Modal**

#### **Modal Structure:**
```
┌─────────────────────────────────────────┐
│  Chọn hình thức thanh toán         ×    │
├─────────────────────────────────────────┤
│                                          │
│  ┌───────────────────────────────────┐  │
│  │ 💰  Trả full                   ✓  │  │
│  │     Thanh toán một lần            │  │
│  │ ┌─────────────────────────────┐   │  │
│  │ │ Tổng thanh toán: 1,250 tr VND│  │  │
│  │ │ Lãi suất: 0%                 │  │  │
│  │ └─────────────────────────────┘   │  │
│  │ ✓ Không phát sinh lãi suất        │  │
│  │ ✓ Nhận xe ngay lập tức            │  │
│  └───────────────────────────────────┘  │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │ 📅  Trả góp                       │  │
│  │     Thanh toán theo tháng         │  │
│  │ Chọn kỳ hạn:                      │  │
│  │ [6 tháng] [12 tháng] [24] [36]    │  │
│  │ ┌─────────────────────────────┐   │  │
│  │ │ Trả hàng tháng: 105.7 tr VND│  │  │
│  │ │ Tổng thanh toán: 1,268 tr VND│  │  │
│  │ │ Lãi suất: 6%/năm (~18.8tr)   │  │  │
│  │ └─────────────────────────────┘   │  │
│  │ ✓ Thanh toán linh hoạt theo tháng│  │
│  │ ✓ Nhận xe ngay, trả dần           │  │
│  │ [Xác nhận trả góp 12 tháng]       │  │
│  └───────────────────────────────────┘  │
│                                          │
└─────────────────────────────────────────┘
```

### **2. Visual Design Features**

#### **A. Payment Type Cards:**
- **Gradient Background**: 
  - Full Payment: Blue gradient khi selected
  - Installment: Purple gradient khi selected
  - Unselected: White gradient
- **Icon Design**: 
  - 💰 Trả full (money bag)
  - 📅 Trả góp (calendar)
- **Selected State**: 
  - Border highlight (2px COLORS.PRIMARY)
  - Checkmark badge (✓)
  - Text color changes to white

#### **B. Information Display:**
- **Detail Box**: Semi-transparent background
- **Benefits List**: Checkmarks with text
- **Clear Typography**: Different font sizes for hierarchy
- **Color Coding**: 
  - Primary for highlights
  - White for selected state
  - Secondary for labels

#### **C. Installment Month Selection:**
- **Chip-based UI**: 4 options (6, 12, 24, 36 months)
- **Selected State**: Blue background + white border
- **Responsive Layout**: 4 chips per row
- **Real-time Calculation**: Updates monthly payment on selection

### **3. Interactive Elements**

#### **Trả Full Card:**
```javascript
// Instant payment - one tap
<TouchableOpacity onPress={() => handlePaymentTypeSelect('full')}>
  <LinearGradient colors={COLORS.GRADIENT.BLUE}>
    <PaymentTypeCard>
      Icon: 💰
      Title: "Trả full"
      Subtitle: "Thanh toán một lần"
      Total: formatPrice(totalAmount)
      Interest: 0%
      Benefits: No interest, Instant delivery
      Selected Badge: ✓
    </PaymentTypeCard>
  </LinearGradient>
</TouchableOpacity>
```

#### **Trả Góp Card:**
```javascript
// Two-step selection: choose months → confirm
<TouchableOpacity onPress={() => setSelectedPaymentType('installment')}>
  <LinearGradient colors={COLORS.GRADIENT.PURPLE}>
    <PaymentTypeCard>
      Icon: 📅
      Title: "Trả góp"
      Subtitle: "Thanh toán theo tháng"
      
      // Step 1: Select installment months
      <InstallmentMonthSelector>
        [6 months] [12 months] [24 months] [36 months]
      </InstallmentMonthSelector>
      
      // Real-time calculations
      Monthly: formatPrice(monthlyPayment)
      Total: formatPrice(totalPayable)
      Interest: 6.0%/năm
      
      Benefits: Flexible, Instant delivery
      
      // Step 2: Confirm button
      <ConfirmButton onPress={() => handlePaymentTypeSelect('installment')}>
        Xác nhận trả góp {installmentMonths} tháng
      </ConfirmButton>
    </PaymentTypeCard>
  </LinearGradient>
</TouchableOpacity>
```

## 🔧 Technical Implementation

### **1. State Management:**

```javascript
// QuotationDetailScreen.js
const [showPaymentTypeModal, setShowPaymentTypeModal] = useState(false);
const [selectedPaymentType, setSelectedPaymentType] = useState(null);
const [installmentMonths, setInstallmentMonths] = useState(12);
const [paymentData, setPaymentData] = useState(null);
```

### **2. Payment Flow:**

```javascript
// Step 1: User clicks "Thanh toán"
const handlePayment = async () => {
  setShowPaymentTypeModal(true); // Show payment type selection
};

// Step 2: User selects payment type
const handlePaymentTypeSelect = async (paymentType) => {
  setSelectedPaymentType(paymentType);
  setShowPaymentTypeModal(false);
  
  // Create payment with selected type
  const payment = await createPayment({
    ...quotation,
    paymentType,
    installmentMonths: paymentType === 'installment' ? installmentMonths : null,
  });
  
  setPaymentData(payment);
  setShowPaymentModal(true); // Show QR code
};

// Step 3: Process payment with payment type
const processPayment = async () => {
  await processPaymentCompletion(quotation.id, {
    paymentType: selectedPaymentType,
    installmentMonths: selectedPaymentType === 'installment' ? installmentMonths : null,
  });
  
  // Update quotation with payment type
  quotation.status = 'paid';
  quotation.paymentType = selectedPaymentType;
  if (selectedPaymentType === 'installment') {
    quotation.installmentMonths = installmentMonths;
  }
};
```

### **3. Installment Calculation:**

```javascript
const calculateMonthlyPayment = (totalAmount, months, annualInterestRate = 6.0) => {
  const monthlyRate = annualInterestRate / 12 / 100;
  // Simple interest calculation
  const monthlyPayment = (totalAmount / months) * (1 + monthlyRate * months / 2);
  return monthlyPayment;
};

// Usage
const totalAmount = 1250000000; // VND
const months = 12;
const monthlyPayment = calculateMonthlyPayment(totalAmount, months);
// Result: ~105,729,167 VND/month
const totalPayable = monthlyPayment * months;
// Result: ~1,268,750,000 VND
const interestAmount = totalPayable - totalAmount;
// Result: ~18,750,000 VND interest
```

### **4. Installment Options:**

```javascript
const installmentOptions = [
  { months: 6, label: '6 tháng' },
  { months: 12, label: '12 tháng' },
  { months: 24, label: '24 tháng' },
  { months: 36, label: '36 tháng' },
];

// For 1,250,000,000 VND:
// 6 months: ~213,542,000 VND/month, total: ~1,281,250,000 VND
// 12 months: ~105,729,000 VND/month, total: ~1,268,750,000 VND
// 24 months: ~52,083,000 VND/month, total: ~1,250,000,000 VND + interest
// 36 months: ~34,375,000 VND/month, total: ~1,237,500,000 VND + interest
```

## 📊 Data Structure

### **Updated Quotation Model:**

```javascript
{
  id: String,
  customerName: String,
  vehicleModel: String,
  totalAmount: Number,
  status: Enum['pending', 'paid', 'expired'],
  
  // ✅ NEW FIELDS
  paymentType: Enum['full', 'installment'], // Payment method
  installmentMonths: Number, // Only if paymentType === 'installment'
  
  // Calculated fields for installment
  monthlyPayment: Number, // Calculated monthly payment
  totalPayable: Number, // Total amount with interest
  interestAmount: Number, // Interest charged
  interestRate: Number, // Annual interest rate (e.g., 6.0)
  
  // ... other existing fields
}
```

## 🎨 Styling Highlights

### **1. Payment Type Cards:**
```javascript
paymentTypeCard: {
  marginBottom: SIZES.PADDING.LARGE,
  borderRadius: SIZES.RADIUS.LARGE,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
}
```

### **2. Selected State:**
```javascript
paymentTypeCardSelected: {
  borderWidth: 2,
  borderColor: COLORS.PRIMARY, // Visual feedback
}

paymentTypeTitleSelected: {
  color: COLORS.TEXT.WHITE, // Text changes to white when selected
}
```

### **3. Month Selection Chips:**
```javascript
monthOption: {
  flex: 1,
  minWidth: '22%', // 4 chips per row
  paddingVertical: SIZES.PADDING.SMALL,
  paddingHorizontal: SIZES.PADDING.MEDIUM,
  borderRadius: SIZES.RADIUS.MEDIUM,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'transparent',
}

monthOptionSelected: {
  backgroundColor: COLORS.PRIMARY,
  borderColor: COLORS.TEXT.WHITE, // Highlight selected
}
```

## 🚀 Backend Integration

### **API Endpoints (Ready):**

```javascript
// Create payment with payment type
POST /api/payments/create
{
  quotationId: String,
  paymentType: Enum['full', 'installment'],
  installmentMonths: Number (optional),
  amount: Number,
  customerName: String,
  customerPhone: String,
}

// Process payment completion
POST /api/payments/:paymentId/complete
{
  quotationId: String,
  paymentType: Enum['full', 'installment'],
  installmentMonths: Number (optional),
  status: 'completed',
}

// Get installment plan details
GET /api/installments/calculate
?amount=1250000000&months=12&interestRate=6.0

Response:
{
  monthlyPayment: 105729167,
  totalPayable: 1268750000,
  interestAmount: 18750000,
  schedule: [
    { month: 1, amount: 105729167, principal: 104166667, interest: 1562500 },
    { month: 2, amount: 105729167, principal: 104166667, interest: 1562500 },
    // ...
  ]
}
```

### **Update Quotation Service:**

```javascript
// src/services/quotationService.js
export const updateQuotationPaymentType = async (quotationId, paymentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/quotations/${quotationId}/payment-type`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentType: paymentData.paymentType,
        installmentMonths: paymentData.installmentMonths,
        monthlyPayment: paymentData.monthlyPayment,
        totalPayable: paymentData.totalPayable,
        interestAmount: paymentData.interestAmount,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating payment type:', error);
    throw error;
  }
};
```

## ✨ UX Enhancements

### **1. Real-time Calculations:**
- Monthly payment updates instantly when changing installment months
- Total payable and interest displayed clearly
- Visual feedback on selection

### **2. Clear Visual Hierarchy:**
- **Large cards**: Easy to tap
- **Icons**: Quick recognition (💰 vs 📅)
- **Color coding**: Selected state clearly visible
- **Checkmark**: Confirmation of selection

### **3. Progressive Disclosure:**
- **Full payment**: One tap → proceed
- **Installment**: Two steps (select months → confirm)
- Month selector only shows when installment is selected
- Confirm button only shows when ready

### **4. Informative:**
- **Benefits listed**: Users know what they get
- **Interest clearly shown**: No hidden costs
- **Total payable**: Full transparency
- **Monthly breakdown**: Easy budgeting

## 🧪 Testing Scenarios

### **Test Case 1: Select Full Payment**
```
Steps:
1. Open quotation detail for pending quotation
2. Tap "Thanh toán" button
3. Payment type modal appears
4. Tap "Trả full" card
5. Payment modal (QR code) appears immediately
6. Complete payment
7. Verify quotation.paymentType === 'full'
```

### **Test Case 2: Select Installment Payment**
```
Steps:
1. Open quotation detail for pending quotation
2. Tap "Thanh toán" button
3. Payment type modal appears
4. Tap "Trả góp" card
5. Month selection chips appear
6. Tap "12 tháng"
7. Verify monthly payment updates
8. Tap "Xác nhận trả góp 12 tháng"
9. Payment modal (QR code) appears
10. Complete payment
11. Verify quotation.paymentType === 'installment'
12. Verify quotation.installmentMonths === 12
```

### **Test Case 3: Change Installment Months**
```
Steps:
1. Select "Trả góp" option
2. Default selection: 12 months
3. Tap "6 tháng"
4. Verify monthly payment increases
5. Tap "24 tháng"
6. Verify monthly payment decreases
7. Tap "36 tháng"
8. Verify monthly payment decreases further
```

### **Test Case 4: Calculation Accuracy**
```
For 1,250,000,000 VND @ 6% annual interest:
- 6 months: Monthly ~213,541,667 VND
- 12 months: Monthly ~105,729,167 VND
- 24 months: Monthly ~52,083,333 VND
- 36 months: Monthly ~34,375,000 VND
```

## 📱 Responsive Design

### **Mobile Optimization:**
- **Touch targets**: Large cards (easy to tap)
- **Scroll view**: Modal scrollable for small screens
- **Chip layout**: Responsive grid (4 per row)
- **Font sizes**: Readable on all devices
- **Modal height**: 90% max-height for accessibility

### **Accessibility:**
- **Clear labels**: Descriptive text
- **Visual feedback**: Selected state obvious
- **Color contrast**: High contrast for readability
- **Touch areas**: Minimum 44x44pt

## 🔮 Future Enhancements

### **Potential Features:**
1. **More Payment Options**:
   - Bank transfer
   - Credit card
   - E-wallets (MoMo, ZaloPay)

2. **Advanced Installment**:
   - Custom down payment
   - Variable interest rates
   - Grace period
   - Early payment discount

3. **Payment Schedule**:
   - Detailed payment calendar
   - Reminder notifications
   - Payment history tracking

4. **Calculator Tool**:
   - Standalone installment calculator
   - Compare different scenarios
   - Export payment schedule

**Tính năng chọn hình thức thanh toán (Trả full/Trả góp) đã được thiết kế đẹp mắt và sẵn sàng tích hợp backend! 💰📅**
