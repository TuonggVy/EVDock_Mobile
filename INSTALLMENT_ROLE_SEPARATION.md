# Installment Role Separation - Staff vs Manager

## Tổng quan
Hệ thống quản lý trả góp với phân quyền rõ ràng:
- **Dealer Staff**: Chọn trả góp, ghi nhận thanh toán hàng tháng
- **Dealer Manager**: Theo dõi (view-only) quá trình trả góp của tất cả khách hàng

## 🎯 Luồng hoàn chỉnh

### **Flow 1: Dealer Staff tạo khoản trả góp**

```
┌─────────────────────────────────────────────────────────────┐
│ DEALER STAFF                                                │
├─────────────────────────────────────────────────────────────┤
│ 1. Tạo quotation cho khách hàng                            │
│ 2. Khách hàng xem quotation và quyết định mua             │
│ 3. Staff nhấn "Thanh toán"                                 │
│ 4. Modal "Chọn hình thức thanh toán" hiện ra              │
│    ├─ 💰 Trả full                                          │
│    └─ 📅 Trả góp ✓                                         │
│        ├─ Chọn kỳ hạn: [6] [12] [24] [36] tháng           │
│        ├─ Xem tính toán:                                   │
│        │  • Hàng tháng: 105,729,167 VND                    │
│        │  • Tổng: 1,268,750,000 VND                        │
│        │  • Lãi: 6%/năm                                    │
│        └─ Nhấn "Xác nhận trả góp 12 tháng"                │
│ 5. Scan QR → Thanh toán (first payment/deposit)           │
│ 6. ✅ Installment plan được tạo và lưu vào Storage        │
│    ├─ quotation.status = 'paid'                           │
│    ├─ quotation.paymentType = 'installment'               │
│    ├─ quotation.installmentId = 'INST123456'              │
│    └─ Installment object lưu vào AsyncStorage             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ SHARED STORAGE (@EVDock:Installments)                      │
├─────────────────────────────────────────────────────────────┤
│ {                                                           │
│   id: 'INST123456',                                        │
│   quotationId: 'Q001',                                     │
│   customerName: 'Nguyễn Văn A',                            │
│   totalAmount: 1,250,000,000,                              │
│   installmentMonths: 12,                                   │
│   monthlyPayment: 105,729,167,                             │
│   paidMonths: 0,                                           │
│   remainingMonths: 12,                                     │
│   nextPaymentDate: '2024-02-01',                           │
│   paymentSchedule: [                                       │
│     { month: 1, dueDate: '2024-02-01', status: 'pending' },│
│     { month: 2, dueDate: '2024-03-01', status: 'pending' },│
│     // ... 12 months                                       │
│   ]                                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
┌──────────────────────────┐  ┌────────────────────────────┐
│ DEALER STAFF             │  │ DEALER MANAGER             │
│ (Ghi nhận thanh toán)    │  │ (Theo dõi)                 │
└──────────────────────────┘  └────────────────────────────┘
```

### **Flow 2: Dealer Staff ghi nhận thanh toán hàng tháng**

```
┌─────────────────────────────────────────────────────────────┐
│ DEALER STAFF - Quản lý trả góp                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Vào "Installments" category từ home                     │
│ 2. InstallmentManagementScreen hiển thị:                   │
│    ├─ 🚨 Quá hạn: Nguyễn Văn A (quá 5 ngày)               │
│    ├─ ⏰ Sắp tới: Trần Thị B (còn 3 ngày)                 │
│    └─ 📅 Danh sách: Tất cả khoản trả góp                  │
│ 3. Nhấn vào card installment                              │
│ 4. InstallmentDetailScreen hiển thị:                       │
│    ├─ Summary: Progress, tổng quan                         │
│    └─ Payment Schedule: 12 tháng chi tiết                  │
│        ├─ Tháng 1: ✓ Đã trả (01/02/2024)                  │
│        ├─ Tháng 2: [✓ Ghi nhận thanh toán] ← ACTION       │
│        └─ Tháng 3-12: Chờ trả                              │
│ 5. Khách hàng đến trả tiền tháng 2                        │
│ 6. Staff nhấn "Ghi nhận thanh toán tháng 2"               │
│ 7. Confirm → ✅ Payment recorded                           │
│    ├─ paymentSchedule[1].status = 'paid'                  │
│    ├─ paidMonths = 2                                       │
│    ├─ remainingMonths = 10                                 │
│    ├─ nextPaymentDate = '2024-04-01' (tháng 3)            │
│    └─ Save to AsyncStorage                                 │
│ 8. Screen refresh với data mới                            │
└─────────────────────────────────────────────────────────────┘
```

### **Flow 3: Dealer Manager theo dõi trả góp**

```
┌─────────────────────────────────────────────────────────────┐
│ DEALER MANAGER - Theo dõi công nợ khách hàng               │
├─────────────────────────────────────────────────────────────┤
│ 1. Vào "Customer Debt" category từ home                    │
│ 2. CustomerDebtManagementScreen hiển thị:                  │
│    ├─ Tab "Trả góp"                                        │
│    ├─ Load data từ installmentStorageService               │
│    └─ Hiển thị tất cả khoản trả góp (do Staff tạo)        │
│ 3. Xem overview:                                           │
│    ├─ Filter: [Tất cả] [Đang trả] [Quá hạn] [Hoàn thành] │
│    ├─ Search: Tìm theo tên, SĐT, xe                       │
│    └─ Cards hiển thị:                                      │
│        • Khách hàng, SĐT                                   │
│        • Xe, tổng giá                                      │
│        • Progress: Đã trả X/Y tháng                        │
│        • Hàng tháng, còn lại, kỳ tiếp                     │
│        • Badge: 👁️ Chế độ xem (Manager)                  │
│ 4. Nhấn vào card để xem chi tiết                          │
│ 5. InstallmentDetailScreen (viewOnly=true):                │
│    ├─ Summary: Progress, tổng quan                         │
│    └─ Payment Schedule: 12 tháng chi tiết                  │
│        ├─ Tháng 1: ✓ Đã trả (01/02/2024)                  │
│        ├─ Tháng 2: 👁️ Dealer Staff ghi nhận thanh toán   │
│        └─ Tháng 3-12: Chờ trả                              │
│ 6. ❌ KHÔNG CÓ button "Ghi nhận thanh toán"               │
│ 7. ✅ CHỈ XEM, không thể ghi nhận thanh toán              │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Phân quyền rõ ràng

### **DEALER STAFF:**
- ✅ **Home Screen**: Category "Installments" 📅
- ✅ **InstallmentManagementScreen**: 
  - View all installments
  - Record monthly payments ✍️
  - See upcoming/overdue alerts
- ✅ **InstallmentDetailScreen**: 
  - View payment schedule
  - Record payments (buttons enabled) ✍️
  - Full control

### **DEALER MANAGER:**
- ✅ **Home Screen**: Category "Customer Debt" 💰
- ✅ **CustomerDebtManagementScreen**: 
  - View all customer installments 👁️
  - Filter & search
  - Monitor progress
  - **NO payment recording**
- ✅ **InstallmentDetailScreen** (viewOnly=true):
  - View payment schedule 👁️
  - See payment status
  - **NO payment buttons** (replaced with view-only badge)
  - **NO editing capabilities**

## 📊 Data Synchronization

### **Single Source of Truth:**
```javascript
// Both Staff and Manager read from same storage
AsyncStorage → @EVDock:Installments

// Staff writes to storage
Dealer Staff → installmentStorageService.recordPayment()
             → Update AsyncStorage
             → Auto-sync to Manager view

// Manager reads from storage (real-time)
Dealer Manager → installmentStorageService.getInstallments()
               → View latest data
               → No write permissions
```

### **Real-time Updates:**
```javascript
// When Staff records payment
Staff: recordPayment() → AsyncStorage updated

// Manager screen auto-refreshes
Manager: useFocusEffect(() => {
  loadInstallments(); // Reload latest data
})

// Result: Manager sees updated data immediately
```

## 🎨 UI Differences

### **Dealer Staff - InstallmentManagementScreen:**
```
┌──────────────────────────────────────────────┐
│  ← Quản lý trả góp                           │
├──────────────────────────────────────────────┤
│  🚨 Quá hạn thanh toán (2)                   │
│  ⏰ Sắp tới hạn (5)                          │
├──────────────────────────────────────────────┤
│  #INST001         [Quá hạn] [Đang trả]      │
│  Nguyễn Văn A                                │
│  Progress: 1/12 (8%)                         │
│  Kỳ tiếp: 01/03/2024                        │
│  [✓ Ghi nhận thanh toán tháng 2] ← ACTION   │
└──────────────────────────────────────────────┘
```

### **Dealer Manager - CustomerDebtManagementScreen:**
```
┌──────────────────────────────────────────────┐
│  ← Trả góp khách hàng                        │
│     Theo dõi quá trình trả góp               │
├──────────────────────────────────────────────┤
│  [Tất cả] [Đang trả] [Quá hạn] [Hoàn thành] │
├──────────────────────────────────────────────┤
│  #INST001         [Quá hạn] [Đang trả]      │
│  Nguyễn Văn A                                │
│  Progress: 1/12 (8%)                         │
│  Kỳ tiếp: 01/03/2024 (Quá hạn)             │
│  [👁️ Chế độ xem (Manager)] ← VIEW ONLY     │
└──────────────────────────────────────────────┘
```

### **Detail Screen Comparison:**

#### **Staff Mode (viewOnly=false):**
```
Payment Schedule:
┌──────────────────────────────────────────────┐
│ Tháng 1                            [Đã trả]  │
│ Hạn trả: 01/02/2024                         │
│ Số tiền: 105,729,167 VND                    │
│ Ngày trả: 01/02/2024                        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Tháng 2         [Kỳ tiếp]        [Chờ trả]  │
│ Hạn trả: 01/03/2024                         │
│ Số tiền: 105,729,167 VND                    │
│ [✓ Ghi nhận thanh toán] ← CAN RECORD       │
└──────────────────────────────────────────────┘
```

#### **Manager Mode (viewOnly=true):**
```
Payment Schedule:
┌──────────────────────────────────────────────┐
│ Tháng 1                            [Đã trả]  │
│ Hạn trả: 01/02/2024                         │
│ Số tiền: 105,729,167 VND                    │
│ Ngày trả: 01/02/2024                        │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│ Tháng 2         [Kỳ tiếp]        [Chờ trả]  │
│ Hạn trả: 01/03/2024                         │
│ Số tiền: 105,729,167 VND                    │
│ [👁️ Dealer Staff ghi nhận thanh toán]      │ ← VIEW ONLY
└──────────────────────────────────────────────┘
```

## 🔧 Technical Implementation

### **1. Shared Storage Service:**

```javascript
// installmentStorageService.js (Singleton)
class InstallmentStorageService {
  constructor() {
    this.STORAGE_KEY = '@EVDock:Installments'; // Single storage key
  }

  // Staff creates installment
  async createInstallment(data) { ... }
  
  // Staff records payment
  async recordPayment(installmentId, month, paymentData) { ... }
  
  // Both Staff and Manager read
  async getInstallments() { ... }
  async getInstallmentById(id) { ... }
  async getUpcomingPayments(days) { ... }
  async getOverduePayments() { ... }
}

export default new InstallmentStorageService(); // Singleton
```

### **2. Dealer Staff Screens:**

#### **A. InstallmentManagementScreen (Staff):**
```javascript
// Full permissions - can record payments
const InstallmentManagementScreen = ({ navigation }) => {
  const [installments, setInstallments] = useState([]);
  
  // Load all installments
  const loadData = async () => {
    const allInstallments = await installmentStorageService.getInstallments();
    const upcoming = await installmentStorageService.getUpcomingPayments(7);
    const overdue = await installmentStorageService.getOverduePayments();
    
    setInstallments(allInstallments);
    setUpcomingPayments(upcoming);
    setOverduePayments(overdue);
  };
  
  // Can record payments
  const handleRecordPayment = async (installment) => {
    await installmentStorageService.recordPayment(...);
    await loadData(); // Refresh
  };
  
  // Navigate to detail (with edit permissions)
  const handleViewDetails = (installment) => {
    navigation.navigate('InstallmentDetail', { 
      installment,
      viewOnly: false // ✅ Staff can edit
    });
  };
};
```

#### **B. InstallmentDetailScreen (Staff):**
```javascript
const InstallmentDetailScreen = ({ route }) => {
  const { installment, viewOnly = false } = route.params;
  
  return (
    <View>
      {installment.paymentSchedule.map(payment => (
        <View>
          {/* Payment info */}
          
          {/* Conditional button based on viewOnly */}
          {!isPaid && !viewOnly && (
            <TouchableOpacity onPress={() => handleRecordPayment(payment)}>
              <Text>✓ Ghi nhận thanh toán</Text> {/* ✅ Staff can record */}
            </TouchableOpacity>
          )}
          
          {!isPaid && viewOnly && (
            <View>
              <Text>👁️ Dealer Staff ghi nhận thanh toán</Text> {/* Manager view-only */}
            </View>
          )}
        </View>
      ))}
    </View>
  );
};
```

### **3. Dealer Manager Screens:**

#### **A. CustomerDebtManagementScreen (Manager):**
```javascript
// View-only permissions - can only monitor
const CustomerDebtManagementScreen = ({ navigation }) => {
  const [installments, setInstallments] = useState([]);
  
  // Load installments (same data as Staff)
  const loadInstallments = async () => {
    const allInstallments = await installmentStorageService.getInstallments();
    setInstallments(allInstallments);
  };
  
  // Auto refresh when screen focuses (real-time updates)
  useFocusEffect(
    React.useCallback(() => {
      loadInstallments();
    }, [])
  );
  
  // Navigate to detail (view-only mode)
  const handleViewInstallment = (installment) => {
    navigation.navigate('InstallmentDetail', { 
      installment,
      viewOnly: true // ✅ Manager view-only
    });
  };
  
  // NO recordPayment function - Manager cannot record
};
```

#### **B. Cards Display:**
```javascript
// Manager sees same data but with view-only indicator
renderInstallmentCard = ({ item }) => (
  <TouchableOpacity onPress={() => handleViewInstallment(item)}>
    <View>
      {/* Customer info, progress, payment details */}
      
      {/* Manager View Badge */}
      <View style={styles.managerViewBadge}>
        <Text>👁️ Chế độ xem (Manager)</Text>
      </View>
    </View>
  </TouchableOpacity>
);
```

## 📂 File Structure

### **New/Updated Files:**

```
src/
├── services/
│   └── storage/
│       └── installmentStorageService.js ✨ NEW
│           ├─ createInstallment()
│           ├─ recordPayment()
│           ├─ getInstallments()
│           ├─ getUpcomingPayments()
│           └─ getOverduePayments()
│
├── screens/
│   ├── installment/
│   │   ├── InstallmentManagementScreen.js ✨ NEW (Staff)
│   │   │   ├─ View all installments
│   │   │   ├─ Record payments
│   │   │   └─ Alerts (upcoming/overdue)
│   │   │
│   │   └── InstallmentDetailScreen.js ✨ NEW (Both)
│   │       ├─ viewOnly prop
│   │       ├─ Staff: Can record payments
│   │       └─ Manager: View-only
│   │
│   ├── debt/
│   │   └── CustomerDebtManagementScreen.js ✨ UPDATED (Manager)
│   │       ├─ Load from installmentStorageService
│   │       ├─ View-only mode
│   │       └─ Navigate with viewOnly=true
│   │
│   ├── quotation/
│   │   └── QuotationDetailScreen.js ✨ UPDATED
│   │       ├─ Payment type selection modal
│   │       └─ Create installment on payment
│   │
│   └── home/
│       ├── EmployeeHomeScreen.js ✨ UPDATED
│       │   └─ Category: "Installments"
│       └── ManagerHomeScreen.js ✨ UPDATED
│           └─ Category: "Customer Debt"
│
└── navigation/
    └── AppNavigator.js ✨ UPDATED
        ├─ InstallmentManagement route
        └─ InstallmentDetail route
```

## 🚀 Backend Integration

### **API Endpoints:**

```javascript
// Installment Management (Staff can write, Manager can read)
POST   /api/installments              // Staff: Create installment
GET    /api/installments              // Both: Get all
GET    /api/installments/:id          // Both: Get details
POST   /api/installments/:id/payments // Staff: Record payment
GET    /api/installments/upcoming     // Both: Get upcoming
GET    /api/installments/overdue      // Both: Get overdue

// Role-based permissions
POST   /api/installments/:id/payments
Headers: {
  'Authorization': 'Bearer <staff_token>',
  'X-User-Role': 'dealer_staff' // Required for write operations
}

GET    /api/installments
Headers: {
  'Authorization': 'Bearer <manager_token>',
  'X-User-Role': 'dealer_manager' // Read-only
}
```

### **Database Structure:**

```sql
-- Installments Table (với role tracking)
CREATE TABLE installments (
  id VARCHAR(50) PRIMARY KEY,
  quotation_id VARCHAR(50),
  customer_id VARCHAR(50),
  
  -- Installment details
  total_amount DECIMAL(15, 2),
  installment_months INT,
  monthly_payment DECIMAL(15, 2),
  
  -- Status tracking
  status ENUM('active', 'completed', 'defaulted'),
  paid_months INT,
  remaining_months INT,
  next_payment_date DATETIME,
  
  -- Role tracking
  created_by VARCHAR(50), -- Staff ID who created
  managed_by VARCHAR(50), -- Staff ID managing payments
  dealer_id VARCHAR(50),  -- For Manager filtering
  
  created_at DATETIME,
  updated_at DATETIME
);

-- Payment Schedule Table
CREATE TABLE installment_payments (
  id VARCHAR(50) PRIMARY KEY,
  installment_id VARCHAR(50),
  month_number INT,
  due_date DATETIME,
  amount DECIMAL(15, 2),
  status ENUM('pending', 'paid', 'overdue'),
  
  -- Payment tracking
  paid_date DATETIME,
  paid_amount DECIMAL(15, 2),
  recorded_by VARCHAR(50), -- Staff ID who recorded payment
  
  created_at DATETIME,
  updated_at DATETIME
);

-- Role-based Views
CREATE VIEW manager_installment_view AS
SELECT i.*, 
       COUNT(CASE WHEN ip.status = 'overdue' THEN 1 END) as overdue_count
FROM installments i
LEFT JOIN installment_payments ip ON i.id = ip.installment_id
WHERE i.dealer_id = :manager_dealer_id
GROUP BY i.id;
```

## 🔄 Data Flow Diagram

```
┌─────────────┐
│ Dealer Staff│
│  Creates    │
│ Installment │
└──────┬──────┘
       ↓
┌─────────────────────────────┐
│  installmentStorageService  │
│  @EVDock:Installments       │
│                             │
│  createInstallment()        │ ← Staff WRITE
│  recordPayment()            │ ← Staff WRITE
│  getInstallments()          │ ← Both READ
│  getUpcomingPayments()      │ ← Both READ
│  getOverduePayments()       │ ← Both READ
└─────┬───────────────────┬───┘
      ↓                   ↓
┌─────────────┐    ┌──────────────┐
│Dealer Staff │    │Dealer Manager│
│             │    │              │
│ Installment │    │ Customer Debt│
│ Management  │    │ Management   │
│             │    │              │
│ ✍️ Record   │    │ 👁️ View Only│
│  Payments   │    │  Monitor     │
└─────────────┘    └──────────────┘
```

## ✅ Benefits

### **1. Clear Separation of Concerns:**
- ✅ **Staff**: Operations (create, record payments)
- ✅ **Manager**: Monitoring (view, track, analyze)
- ✅ **No overlap**: Each role has distinct responsibilities

### **2. Single Source of Truth:**
- ✅ **One storage**: `installmentStorageService`
- ✅ **Real-time sync**: Manager sees Staff updates immediately
- ✅ **No data duplication**: Same data, different views

### **3. Role-based UI:**
- ✅ **Staff**: Action buttons, edit capabilities
- ✅ **Manager**: View badges, no edit capabilities
- ✅ **Visual indicators**: Clear role identification

### **4. Backend Ready:**
- ✅ **API endpoints**: Defined with role permissions
- ✅ **Database schema**: Role tracking columns
- ✅ **Easy migration**: Mock → API switch

## 🧪 Testing Scenarios

### **Test 1: Staff creates installment → Manager sees it**
```
1. Login as Dealer Staff
2. Create quotation → Choose installment payment (12 months)
3. Complete payment
4. ✅ Installment created in storage
5. Logout → Login as Dealer Manager
6. Navigate to "Customer Debt"
7. ✅ Verify installment appears in Manager view
8. ✅ Verify "👁️ Chế độ xem (Manager)" badge shows
```

### **Test 2: Staff records payment → Manager sees update**
```
1. Login as Dealer Staff
2. Navigate to "Installments"
3. Record payment for month 2
4. ✅ Payment recorded, progress updates to 2/12
5. Logout → Login as Dealer Manager
6. Navigate to "Customer Debt"
7. ✅ Verify progress shows 2/12
8. ✅ Verify next payment date updated to month 3
```

### **Test 3: Manager cannot record payments**
```
1. Login as Dealer Manager
2. Navigate to "Customer Debt"
3. Click on installment card
4. ✅ Detail screen opens with viewOnly=true
5. ✅ Verify NO "Ghi nhận thanh toán" buttons
6. ✅ Verify "👁️ Dealer Staff ghi nhận thanh toán" badge shows
7. ❌ Manager cannot edit or record payments
```

### **Test 4: Real-time synchronization**
```
1. Open 2 devices/simulators
   Device 1: Login as Dealer Staff
   Device 2: Login as Dealer Manager
2. Device 1: Record payment for month 2
3. Device 2: Pull to refresh on Customer Debt screen
4. ✅ Verify Device 2 shows updated data
5. ✅ Verify progress bar updates
6. ✅ Verify next payment date updates
```

## 🎯 User Stories

### **Story 1: Dealer Staff**
```
As a Dealer Staff,
I want to record customer installment payments,
So that I can track payment completion and remind customers.

Acceptance Criteria:
✅ Can view all installments with upcoming/overdue alerts
✅ Can record payments with one-tap confirmation
✅ Can see real-time progress updates
✅ Can filter by status (active, overdue, completed)
```

### **Story 2: Dealer Manager**
```
As a Dealer Manager,
I want to monitor all customer installments,
So that I can oversee the installment business and identify risks.

Acceptance Criteria:
✅ Can view all customer installments
✅ Can see which payments are overdue
✅ Can filter and search installments
✅ CANNOT record payments (view-only)
✅ Can see real-time updates from Staff actions
```

**Hệ thống phân quyền rõ ràng: Staff quản lý thanh toán, Manager theo dõi! ✍️👁️**
