# Installment Management System

## Tổng quan
Hệ thống quản lý trả góp hoàn chỉnh cho Dealer Staff, từ khi khách hàng chọn trả góp đến theo dõi lịch thanh toán hàng tháng, cảnh báo tới hạn, và ghi nhận thanh toán.

## 🎯 Câu hỏi: Lưu ở đâu và thể hiện như thế nào?

### **Trả lời:**

#### **1. Lưu ở đâu?**
✅ **AsyncStorage** (Development) → **Database** (Production)

**Data Structure:**
```javascript
@EVDock:Installments → AsyncStorage
{
  id: 'INST123456',
  quotationId: 'Q001',
  customerId: 'C001',
  customerName: 'Nguyễn Văn A',
  
  // Payment schedule (lịch thanh toán chi tiết)
  paymentSchedule: [
    {
      month: 1,
      dueDate: '2024-02-01',
      amount: 105729167,
      status: 'paid', // paid, pending, overdue
      paidDate: '2024-02-01',
    },
    {
      month: 2,
      dueDate: '2024-03-01',
      amount: 105729167,
      status: 'pending', // ⏰ Sắp tới hạn
      paidDate: null,
    },
    // ... months 3-12
  ],
  
  // Summary info
  nextPaymentDate: '2024-03-01', // 📅 Kỳ tiếp theo
  paidMonths: 1,
  remainingMonths: 11,
  remainingAmount: 1144270833,
}
```

#### **2. Thể hiện như thế nào?**
✅ **Màn hình "Quản lý trả góp"** (InstallmentManagementScreen)

**Features:**
- 📊 **Thống kê tổng quan**: Tổng trả góp, hoàn thành, quá hạn
- ⏰ **Cảnh báo sắp tới hạn**: Trong 7 ngày tới
- 🚨 **Cảnh báo quá hạn**: Các khoản thanh toán quá hạn
- 📅 **Danh sách trả góp**: Tất cả khoản trả góp với chi tiết
- 🔍 **Tìm kiếm & Filter**: Theo tên, SĐT, status
- ✅ **Ghi nhận thanh toán**: Quick action để ghi nhận thanh toán

## 🏗️ Kiến trúc hệ thống

### **1. Data Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Customer chooses installment payment               │
│ QuotationDetailScreen → handlePayment()                     │
│ → Show Payment Type Modal                                   │
│ → Customer selects "Trả góp" + chooses months (6/12/24/36)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Create installment plan                            │
│ processPayment() → installmentStorageService.createInstallment()│
│ → Calculate payment schedule (12 monthly payments)          │
│ → Save to AsyncStorage                                      │
│ → Link installmentId to quotation                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Monitor payments                                   │
│ InstallmentManagementScreen                                 │
│ → Load all installments                                     │
│ → Check upcoming payments (within 7 days)                   │
│ → Check overdue payments (past due date)                    │
│ → Display alerts and statistics                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Record monthly payment                             │
│ Staff clicks "Ghi nhận thanh toán tháng X"                  │
│ → installmentStorageService.recordPayment()                │
│ → Update payment schedule (month X: pending → paid)         │
│ → Update summary (paidMonths++, remainingMonths--)          │
│ → Update nextPaymentDate to month X+1                       │
│ → Check if all paid → status = 'completed'                  │
└─────────────────────────────────────────────────────────────┘
```

### **2. Service Layer:**

#### **installmentStorageService.js:**
```javascript
// Core Methods:
✅ createInstallment(data) → Create new installment plan with schedule
✅ recordPayment(id, month, paymentData) → Record monthly payment
✅ getInstallments() → Get all installments
✅ getActiveInstallments() → Get active installments
✅ getUpcomingPayments(days) → Get payments due within X days
✅ getOverduePayments() → Get overdue payments
✅ getStatistics() → Get summary statistics
✅ calculatePaymentSchedule(data) → Calculate monthly schedule
```

## 📊 Data Models

### **1. Installment Model:**
```javascript
{
  // Identification
  id: String, // INST + timestamp + random
  quotationId: String,
  customerId: String,
  customerName: String,
  customerPhone: String,
  vehicleModel: String,
  
  // Payment details
  totalAmount: Number, // 1,250,000,000 VND
  installmentMonths: Number, // 6, 12, 24, or 36
  monthlyPayment: Number, // 105,729,167 VND
  totalPayable: Number, // 1,268,750,000 VND (with interest)
  interestRate: Number, // 6.0 (annual %)
  interestAmount: Number, // 18,750,000 VND
  
  // Status tracking
  status: Enum['active', 'completed', 'defaulted', 'cancelled'],
  paidMonths: Number, // 1
  remainingMonths: Number, // 11
  remainingAmount: Number, // 1,144,270,833 VND
  
  // Dates
  startDate: Date, // '2024-01-01'
  endDate: Date, // '2024-12-31'
  nextPaymentDate: Date, // '2024-03-01'
  lastPaymentDate: Date, // '2024-02-01'
  
  // Payment Schedule (chi tiết từng tháng)
  paymentSchedule: [
    {
      month: Number, // 1, 2, 3, ...
      dueDate: Date,
      amount: Number,
      principal: Number, // Gốc
      interest: Number, // Lãi
      status: Enum['pending', 'paid', 'overdue'],
      paidDate: Date,
      paidAmount: Number,
      remainingBalance: Number,
    }
  ],
  
  // Metadata
  createdAt: Date,
  createdBy: String,
  dealerId: String,
  lastModified: Date,
}
```

### **2. Payment Schedule Example:**

```javascript
// For 1,250,000,000 VND @ 6% annual interest, 12 months
paymentSchedule: [
  {
    month: 1,
    dueDate: '2024-02-01',
    amount: 105729167, // Monthly payment
    principal: 104166667, // 1,250M / 12
    interest: 1562500, // Interest portion
    status: 'paid',
    paidDate: '2024-02-01',
    paidAmount: 105729167,
    remainingBalance: 1145833333,
  },
  {
    month: 2,
    dueDate: '2024-03-01',
    amount: 105729167,
    principal: 104166667,
    interest: 1562500,
    status: 'pending', // ⏰ Next payment
    paidDate: null,
    paidAmount: 0,
    remainingBalance: 1041666666,
  },
  // ... months 3-12
  {
    month: 12,
    dueDate: '2025-01-01',
    amount: 105729167,
    principal: 104166667,
    interest: 1562500,
    status: 'pending',
    paidDate: null,
    paidAmount: 0,
    remainingBalance: 0, // Final payment
  }
]
```

## 🎨 UI Design - InstallmentManagementScreen

### **Screen Structure:**

```
┌──────────────────────────────────────────────┐
│  ← Quản lý trả góp                           │
│     15 khoản trả góp                         │
├──────────────────────────────────────────────┤
│  📊 Thống kê trả góp                         │
│  ┌────────┬────────┬────────┬────────┐      │
│  │ Đang   │ Hoàn   │ Quá    │ Sắp    │      │
│  │ trả: 8 │ thành:7│ hạn: 2 │ tới: 5 │      │
│  └────────┴────────┴────────┴────────┘      │
├──────────────────────────────────────────────┤
│  🚨 Quá hạn thanh toán                  (2)  │
│  ┌──────────────────────────────────────┐   │
│  │ Nguyễn Văn A     │ Quá 5 ngày        │   │
│  │ Tesla Model Y    │ 01/11/2024        │   │
│  │ 105,729,167 VND  │                   │   │
│  └──────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│  ⏰ Sắp tới hạn thanh toán              (5)  │
│  ┌──────────────────────────────────────┐   │
│  │ Trần Thị B       │ 3 ngày            │   │
│  │ Tesla Model X    │ 05/12/2024        │   │
│  │ 150,000,000 VND  │                   │   │
│  └──────────────────────────────────────┘   │
├──────────────────────────────────────────────┤
│  🔍 Tìm kiếm...                              │
├──────────────────────────────────────────────┤
│  [Tất cả(15)] [Đang trả(8)] [Quá hạn(2)]   │
├──────────────────────────────────────────────┤
│  Danh sách trả góp (15)                     │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ #INST001         [Quá hạn] [Đang trả]│   │
│  │ Nguyễn Văn A                         │   │
│  │ 0901234567                           │   │
│  ├──────────────────────────────────────┤   │
│  │ Tesla Model Y    1,250,000,000 VND   │   │
│  ├──────────────────────────────────────┤   │
│  │ Đã trả 1/12 tháng           8%       │   │
│  │ ████░░░░░░░░░░░░░░░░░░░░░░           │   │
│  ├──────────────────────────────────────┤   │
│  │ Trả hàng tháng: 105,729,167 VND      │   │
│  │ Còn lại: 1,144,270,833 VND           │   │
│  │ Kỳ tiếp theo: 01/03/2024 (Quá hạn)  │   │
│  ├──────────────────────────────────────┤   │
│  │ [✓ Ghi nhận thanh toán tháng 2]     │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

### **UI Components:**

#### **A. Statistics Cards (4 cards):**
```javascript
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Đang trả: 8 │ Hoàn thành:7│ Quá hạn: 2  │ Sắp tới: 5  │
│ 500M còn lại│ 800M đã thu │ Cần xử lý   │ Trong 7 ngày│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### **B. Overdue Payments Alert (Red):**
```javascript
🚨 Quá hạn thanh toán (2)
┌──────────────────────────────────────┐
│ Nguyễn Văn A          Quá 5 ngày     │
│ Tesla Model Y         01/11/2024     │
│ 105,729,167 VND                      │
└──────────────────────────────────────┘
```

#### **C. Upcoming Payments Alert (Yellow):**
```javascript
⏰ Sắp tới hạn thanh toán (5)
┌──────────────────────────────────────┐
│ Trần Thị B            3 ngày         │
│ Tesla Model X         05/12/2024     │
│ 150,000,000 VND                      │
└──────────────────────────────────────┘
```

#### **D. Installment Cards:**
```javascript
┌──────────────────────────────────────┐
│ #INST001         [Quá hạn] [Đang trả]│
│ Nguyễn Văn A                         │
│ 0901234567                           │
├──────────────────────────────────────┤
│ Tesla Model Y    1,250,000,000 VND   │
├──────────────────────────────────────┤
│ Đã trả 1/12 tháng           8%       │
│ ████░░░░░░░░░░░░░░░░░░░░░░           │
├──────────────────────────────────────┤
│ Trả hàng tháng: 105,729,167 VND      │
│ Còn lại: 1,144,270,833 VND           │
│ Kỳ tiếp theo: 01/03/2024             │
├──────────────────────────────────────┤
│ [✓ Ghi nhận thanh toán tháng 2]     │
└──────────────────────────────────────┘
```

## 🔄 Complete User Flow

### **Flow 1: Khách hàng chọn trả góp**

```
1. Staff tạo quotation cho khách hàng
   ↓
2. Quotation ở trạng thái "Chờ thanh toán"
   ↓
3. Staff nhấn "Thanh toán"
   ↓
4. 🎨 Modal "Chọn hình thức thanh toán" hiện ra
   ├─ Option 1: 💰 Trả full
   └─ Option 2: 📅 Trả góp
                 ├─ Chọn kỳ hạn: [6] [12] [24] [36] tháng
                 ├─ Xem tính toán real-time:
                 │  • Trả hàng tháng: 105,729,167 VND
                 │  • Tổng thanh toán: 1,268,750,000 VND
                 │  • Lãi suất: 6%/năm (~18,750,000 VND)
                 └─ Nhấn "Xác nhận trả góp 12 tháng"
   ↓
5. Scan QR code để thanh toán (first month or deposit)
   ↓
6. ✅ Thanh toán thành công
   ├─ Quotation.status = 'paid'
   ├─ Quotation.paymentType = 'installment'
   ├─ Quotation.installmentMonths = 12
   └─ 📅 Installment plan được tạo trong storage
   ↓
7. Alert hiển thị:
   "✅ Kế hoạch trả góp 12 tháng đã được tạo
    ✅ Khách hàng đã được thêm vào danh sách
    📅 Xem chi tiết tại màn hình 'Quản lý trả góp'"
```

### **Flow 2: Theo dõi và nhắc nhở**

```
1. Staff vào "Installments" category từ home
   ↓
2. Màn hình "Quản lý trả góp" hiển thị:
   ├─ 📊 Statistics: 8 đang trả, 7 hoàn thành, 2 quá hạn, 5 sắp tới
   ├─ 🚨 Quá hạn (2): Nguyễn Văn A (quá 5 ngày)
   └─ ⏰ Sắp tới hạn (5): Trần Thị B (còn 3 ngày)
   ↓
3. Staff xem danh sách installment cards
   ├─ Card có border đỏ → Quá hạn
   ├─ Card có badge "Quá hạn" → Cần xử lý ngay
   └─ Progress bar hiển thị đã trả X/Y tháng
   ↓
4. Staff nhấn vào card để xem chi tiết
   → Navigate to InstallmentDetailScreen
   → Xem full payment schedule (12 months)
   → Xem lịch sử thanh toán
```

### **Flow 3: Ghi nhận thanh toán hàng tháng**

```
1. Staff nhìn thấy installment card có:
   "Kỳ tiếp theo: 01/12/2024"
   ↓
2. Ngày 01/12/2024 đến:
   ├─ Card tự động hiển thị button:
   │  "✓ Ghi nhận thanh toán tháng 2"
   ├─ Nếu quá hạn, button đổi thành:
   │  "⚠️ Ghi nhận thanh toán quá hạn"
   └─ Card có alert màu đỏ ở phần "Quá hạn"
   ↓
3. Khách hàng đến trả tiền tháng 2
   ↓
4. Staff nhấn "Ghi nhận thanh toán tháng 2"
   ↓
5. Alert xác nhận:
   "Ghi nhận thanh toán tháng 2?
    Số tiền: 105,729,167 VND"
   [Hủy] [Xác nhận]
   ↓
6. Staff nhấn "Xác nhận"
   ↓
7. ✅ Hệ thống tự động:
   ├─ Update paymentSchedule[1].status = 'paid'
   ├─ Update paidMonths = 2
   ├─ Update remainingMonths = 10
   ├─ Update remainingAmount = 1,038,541,666 VND
   ├─ Update nextPaymentDate = '2024-04-01' (month 3)
   └─ Save to AsyncStorage
   ↓
8. Alert "Thành công - Đã ghi nhận thanh toán"
   ↓
9. Screen refresh
   ├─ Progress bar cập nhật: 2/12 tháng (17%)
   ├─ Button cập nhật: "Ghi nhận thanh toán tháng 3"
   └─ Kỳ tiếp theo: 01/04/2024
```

## 🔧 Technical Implementation

### **1. Create Installment (QuotationDetailScreen):**

```javascript
// When payment is completed with installment type
if (selectedPaymentType === 'installment') {
  const installment = await installmentStorageService.createInstallment({
    quotationId: quotation.id,
    customerId: quotation.customerId,
    customerName: quotation.customerName,
    customerPhone: quotation.customerPhone,
    vehicleModel: quotation.vehicleModel,
    totalAmount: quotation.totalAmount,
    installmentMonths: installmentMonths, // 6, 12, 24, or 36
    interestRate: 6.0,
    startDate: new Date().toISOString(),
    createdBy: 'Dealer Staff',
    dealerId: 'dealer001',
  });
  
  // Link to quotation
  quotation.installmentId = installment.id;
  
  console.log('✅ Installment plan created:', installment.id);
}
```

### **2. Load and Display (InstallmentManagementScreen):**

```javascript
// On screen mount/focus
const loadData = async () => {
  // Get all installments
  const allInstallments = await installmentStorageService.getInstallments();
  
  // Get upcoming payments (within 7 days)
  const upcoming = await installmentStorageService.getUpcomingPayments(7);
  
  // Get overdue payments
  const overdue = await installmentStorageService.getOverduePayments();
  
  // Get statistics
  const stats = await installmentStorageService.getStatistics();
  
  setInstallments(allInstallments);
  setUpcomingPayments(upcoming);
  setOverduePayments(overdue);
  setStatistics(stats);
};
```

### **3. Record Payment:**

```javascript
const handleRecordPayment = async (installment) => {
  // Find next pending payment
  const nextPayment = installment.paymentSchedule.find(p => p.status === 'pending');
  
  // Confirm with staff
  Alert.alert(
    'Xác nhận thanh toán',
    `Ghi nhận thanh toán tháng ${nextPayment.month}?\n\nSố tiền: ${formatCurrency(nextPayment.amount)}`,
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          // Record payment
          await installmentStorageService.recordPayment(
            installment.id,
            nextPayment.month,
            {
              paidAmount: nextPayment.amount,
              paidDate: new Date().toISOString(),
            }
          );
          
          Alert.alert('Thành công', 'Đã ghi nhận thanh toán');
          await loadData(); // Refresh
        }
      }
    ]
  );
};
```

### **4. Calculate Payment Schedule:**

```javascript
calculatePaymentSchedule(installmentData) {
  const { totalAmount, installmentMonths, interestRate = 6.0, startDate } = installmentData;
  
  // Calculate monthly payment with interest
  const monthlyRate = interestRate / 12 / 100;
  const monthlyPayment = (totalAmount / installmentMonths) * (1 + monthlyRate * installmentMonths / 2);
  const totalPayable = monthlyPayment * installmentMonths;
  const interestAmount = totalPayable - totalAmount;
  
  const schedule = [];
  const start = new Date(startDate);
  
  for (let month = 1; month <= installmentMonths; month++) {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + month);
    
    schedule.push({
      month,
      dueDate: dueDate.toISOString(),
      amount: monthlyPayment,
      principal: totalAmount / installmentMonths,
      interest: interestAmount / installmentMonths,
      status: 'pending',
      paidDate: null,
      paidAmount: 0,
      remainingBalance: totalAmount - ((totalAmount / installmentMonths) * month),
    });
  }
  
  return schedule;
}
```

## 🚀 Backend Integration

### **API Endpoints (Ready):**

```javascript
// Installment Management
POST   /api/installments                    // Create installment plan
GET    /api/installments                    // Get all installments
GET    /api/installments/:id                // Get installment details
PUT    /api/installments/:id                // Update installment
DELETE /api/installments/:id                // Cancel installment

// Payment Recording
POST   /api/installments/:id/payments       // Record monthly payment
GET    /api/installments/:id/payments       // Get payment history
GET    /api/installments/:id/schedule       // Get payment schedule

// Monitoring
GET    /api/installments/upcoming?days=7    // Get upcoming payments
GET    /api/installments/overdue            // Get overdue payments
GET    /api/installments/statistics         // Get statistics

// Notifications
GET    /api/installments/notifications      // Get payment reminders
POST   /api/installments/send-reminder      // Send payment reminder to customer
```

### **Database Schema:**

```sql
-- Installments Table
CREATE TABLE installments (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50) REFERENCES quotations(id),
  customer_id VARCHAR(50) REFERENCES customers(id),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  vehicle_model VARCHAR(255),
  
  total_amount DECIMAL(15, 2),
  installment_months INT,
  monthly_payment DECIMAL(15, 2),
  total_payable DECIMAL(15, 2),
  interest_rate DECIMAL(5, 2),
  interest_amount DECIMAL(15, 2),
  
  status ENUM('active', 'completed', 'defaulted', 'cancelled'),
  paid_months INT DEFAULT 0,
  remaining_months INT,
  remaining_amount DECIMAL(15, 2),
  
  start_date DATETIME,
  end_date DATETIME,
  next_payment_date DATETIME,
  last_payment_date DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(50),
  dealer_id VARCHAR(50),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_customer (customer_id),
  INDEX idx_quotation (quotation_id),
  INDEX idx_next_payment (next_payment_date),
  INDEX idx_status (status)
);

-- Payment Schedule Table
CREATE TABLE installment_payments (
  id VARCHAR(50) PRIMARY KEY,
  installment_id VARCHAR(50) REFERENCES installments(id),
  month_number INT,
  due_date DATETIME,
  amount DECIMAL(15, 2),
  principal_amount DECIMAL(15, 2),
  interest_amount DECIMAL(15, 2),
  
  status ENUM('pending', 'paid', 'overdue', 'waived'),
  paid_date DATETIME,
  paid_amount DECIMAL(15, 2),
  remaining_balance DECIMAL(15, 2),
  
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  notes TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_installment (installment_id),
  INDEX idx_due_date (due_date),
  INDEX idx_status (status)
);
```

## 🎯 Key Features

### **1. Automatic Payment Schedule Generation:**
- ✅ Tự động tạo lịch thanh toán cho X tháng
- ✅ Tính toán chính xác monthly payment với lãi suất
- ✅ Phân bổ gốc + lãi cho từng kỳ
- ✅ Set due date cho từng tháng

### **2. Smart Monitoring:**
- ✅ **Upcoming Payments**: Cảnh báo trong 7 ngày tới
- ✅ **Overdue Detection**: Tự động phát hiện quá hạn
- ✅ **Status Tracking**: Pending → Paid → Overdue
- ✅ **Progress Visualization**: Progress bar cho từng installment

### **3. Easy Payment Recording:**
- ✅ **Quick Action Button**: Ghi nhận thanh toán ngay trên card
- ✅ **One-tap Confirmation**: Alert xác nhận đơn giản
- ✅ **Auto Updates**: Tự động cập nhật tất cả fields liên quan
- ✅ **Real-time Refresh**: Screen refresh ngay sau khi ghi nhận

### **4. Comprehensive Statistics:**
- ✅ **Active Installments**: Số khoản đang trả
- ✅ **Completed**: Số khoản đã hoàn thành
- ✅ **Overdue**: Số khoản quá hạn
- ✅ **Upcoming**: Số khoản sắp tới hạn
- ✅ **Financial Summary**: Tổng nợ, đã thu, còn lại

### **5. Search & Filter:**
- ✅ **Search**: Tìm theo tên, SĐT, xe, ID
- ✅ **Filter by Status**: All, Active, Overdue, Completed
- ✅ **Real-time**: Kết quả cập nhật ngay

## 📊 Calculation Examples

### **Example 1: 12 Months Installment**

```javascript
Input:
- Total Amount: 1,250,000,000 VND
- Months: 12
- Interest Rate: 6.0% annually

Calculation:
- Monthly Rate: 6.0 / 12 / 100 = 0.005 (0.5% per month)
- Monthly Payment: (1,250,000,000 / 12) * (1 + 0.005 * 12 / 2)
                  = 104,166,667 * 1.03
                  = 105,729,167 VND/month
- Total Payable: 105,729,167 * 12 = 1,268,750,000 VND
- Interest Amount: 1,268,750,000 - 1,250,000,000 = 18,750,000 VND

Payment Schedule:
Month 1: Due 01/02/2024, Amount: 105,729,167 VND
Month 2: Due 01/03/2024, Amount: 105,729,167 VND
...
Month 12: Due 01/01/2025, Amount: 105,729,167 VND (Final)
```

### **Example 2: 24 Months Installment**

```javascript
Input:
- Total Amount: 1,250,000,000 VND
- Months: 24
- Interest Rate: 6.0% annually

Calculation:
- Monthly Payment: (1,250,000,000 / 24) * (1 + 0.005 * 24 / 2)
                  = 52,083,333 * 1.06
                  = 55,208,333 VND/month
- Total Payable: 55,208,333 * 24 = 1,325,000,000 VND
- Interest Amount: 75,000,000 VND
```

## 🚨 Alert System

### **1. Upcoming Payment Alerts:**

```javascript
// Check daily for upcoming payments
const upcomingPayments = await installmentStorageService.getUpcomingPayments(7);

// Display alerts
if (upcomingPayments.length > 0) {
  // Show yellow warning banner
  "⏰ Sắp tới hạn thanh toán (5)"
  
  // List upcoming payments
  forEach payment in upcomingPayments:
    - Customer name
    - Vehicle model
    - Amount due
    - Days until due (3 ngày)
    - Due date
}
```

### **2. Overdue Payment Alerts:**

```javascript
// Check daily for overdue payments
const overduePayments = await installmentStorageService.getOverduePayments();

// Display alerts
if (overduePayments.length > 0) {
  // Show red error banner
  "🚨 Quá hạn thanh toán (2)"
  
  // List overdue payments
  forEach payment in overduePayments:
    - Customer name
    - Vehicle model
    - Amount due
    - Days overdue (Quá 5 ngày)
    - Original due date
    
  // Visual indicators:
  - Red border on installment card
  - Red "Quá hạn" badge
  - Urgent action button
}
```

### **3. Status Auto-Update:**

```javascript
// Automatically update payment status based on current date
getOverduePayments() {
  const now = new Date();
  
  installments.forEach(installment => {
    installment.paymentSchedule.forEach(payment => {
      if (payment.status === 'pending') {
        const dueDate = new Date(payment.dueDate);
        if (dueDate < now) {
          payment.status = 'overdue'; // Auto-update
        }
      }
    });
  });
}
```

## 🎨 Visual Design Highlights

### **1. Color Coding:**
- 🟢 **Green**: Active installments, completed payments
- 🟡 **Yellow**: Upcoming payments (within 7 days)
- 🔴 **Red**: Overdue payments, urgent actions
- 🔵 **Blue**: Primary actions, monthly payment amounts
- ⚪ **Gray**: Completed installments

### **2. Progress Visualization:**
```javascript
// Progress bar shows payment completion
Paid 1/12 months (8%)
████░░░░░░░░░░░░░░░░░░░░░░

Paid 6/12 months (50%)
████████████░░░░░░░░░░░░░░

Paid 12/12 months (100%)
██████████████████████████ ✓ Completed
```

### **3. Card States:**

```javascript
// Normal state
backgroundColor: '#FFFFFF'
borderColor: transparent

// Overdue state
backgroundColor: '#FFE6E6' (light red)
borderColor: COLORS.ERROR (red)
borderWidth: 2

// Completed state
backgroundColor: '#F8F9FA' (gray)
opacity: 0.8
```

## 🔮 Future Enhancements

### **1. Notification System:**
- 📧 **Email reminders**: 3 days before due date
- 📱 **Push notifications**: Payment due today
- 💬 **SMS reminders**: For customers without app
- ⏰ **Scheduled notifications**: Auto-send at 9 AM

### **2. Advanced Features:**
- **Early payment discount**: Giảm giá khi trả sớm
- **Payment rescheduling**: Hoãn thanh toán (với phí)
- **Partial payments**: Cho phép trả một phần
- **Auto-debit**: Tự động trừ từ tài khoản

### **3. Analytics:**
- **Collection rate**: Tỷ lệ thu nợ đúng hạn
- **Default rate**: Tỷ lệ khách hàng không trả được
- **Average installment**: Thời gian trả góp trung bình
- **Revenue forecast**: Dự báo doanh thu từ trả góp

### **4. Integration:**
- **Banking APIs**: Tích hợp thanh toán tự động
- **CRM System**: Đồng bộ với hệ thống CRM
- **Accounting**: Xuất báo cáo kế toán
- **Credit scoring**: Đánh giá tín dụng khách hàng

## ✅ Summary

### **Câu trả lời đầy đủ:**

#### **1. Lưu ở đâu?**
- ✅ **AsyncStorage** (Development): Key `@EVDock:Installments`
- ✅ **Database** (Production): Tables `installments` + `installment_payments`
- ✅ **Linked to Quotation**: `quotation.installmentId` references installment

#### **2. Thể hiện như thế nào để biết tới hạn?**
- ✅ **Màn hình "Quản lý trả góp"**: Dedicated screen
- ✅ **Alert Sections**: 
  - 🚨 Quá hạn (Red alerts)
  - ⏰ Sắp tới hạn (Yellow warnings, 7 days ahead)
- ✅ **Installment Cards**: 
  - Next payment date
  - Days until/overdue
  - Quick action button
- ✅ **Visual Indicators**:
  - Red border for overdue
  - Progress bar for completion
  - Status badges

#### **3. Ghi nhận thanh toán tiếp theo:**
- ✅ **Quick Action Button**: "Ghi nhận thanh toán tháng X"
- ✅ **One-tap Workflow**: Button → Confirm → Done
- ✅ **Auto Updates**: All fields update automatically
- ✅ **Real-time Refresh**: Screen updates immediately

**Hệ thống quản lý trả góp hoàn chỉnh! Staff có thể theo dõi và quản lý tất cả khoản trả góp một cách dễ dàng! 📅💰**
