# Debt Management System

## Tổng quan
Hệ thống quản lý công nợ được thiết kế cho Dealer Manager để quản lý hai loại công nợ chính:
1. **Công nợ với khách hàng** (Customer Debt)
2. **Công nợ với nhà sản xuất** (Manufacturer Debt)

## 🏗️ Kiến trúc hệ thống

### 1. Customer Debt Management
Quản lý công nợ của khách hàng với đại lý, bao gồm 3 loại:

#### **a) Công nợ trả góp (Installment)**
- **Mô tả**: Khách hàng mua xe và trả góp theo kỳ hạn
- **Tính năng**:
  - Số tiền còn nợ
  - Trả hàng tháng
  - Số tháng còn lại
  - Lãi suất
  - Ngày thanh toán tiếp theo

#### **b) Công nợ đặt cọc - Xe có sẵn (Deposit Available)**
- **Mô tả**: Khách hàng đặt cọc để giành slot xe đang có sẵn
- **Tính năng**:
  - Số tiền đặt cọc
  - Số tiền còn lại phải trả
  - Loại: Xe có sẵn
  - Có thể chuyển sang trả góp hoặc trả full

#### **c) Pre-order (Pre-order)**
- **Mô tả**: Khách hàng đặt cọc để lấy xe từ hãng về
- **Tính năng**:
  - Số tiền đặt cọc
  - Tổng giá xe
  - Loại: Pre-order từ hãng
  - Ngày đặt hàng
  - Có thể chuyển sang trả góp hoặc trả full

### 2. Manufacturer Debt Management
Quản lý công nợ của đại lý với nhà sản xuất, bao gồm 2 loại:

#### **a) Trả một lần (Lump Sum)**
- **Mô tả**: Đại lý mua xe và trả tiền một lần
- **Tính năng**:
  - Tổng nợ
  - Số tiền còn nợ
  - Số tiền đã trả
  - Hạn thanh toán
  - Thống kê xe: Đã đặt, Đã giao, Chờ giao

#### **b) Gối đầu (Rolling Credit)**
- **Mô tả**: Đại lý có hạn mức tín dụng, mua xe mà chưa trả ngay
- **Tính năng**:
  - Hạn mức tín dụng
  - Số tiền đang nợ
  - Số tiền còn có thể vay
  - Tỷ lệ sử dụng tín dụng (với cảnh báo khi > 80%)
  - Thống kê xe: Đã đặt, Đã giao, Chờ giao
  - Cảnh báo khi vượt hạn mức

## 🎨 Thiết kế UI/UX

### 1. ManagerHomeScreen - Category Cards
```javascript
// Thêm 2 category cards mới
{
  title: 'Customer Debt',
  gradient: COLORS.GRADIENT.ORANGE,
  icon: '💰',
  onPress: () => navigation.navigate('CustomerDebtManagement'),
},
{
  title: 'Manufacturer Debt',
  gradient: COLORS.GRADIENT.GREEN,
  icon: '🏭',
  onPress: () => navigation.navigate('ManufacturerDebtManagement'),
}
```

### 2. Customer Debt Management Screen

#### **Header Features:**
- **Back Button**: Quay lại màn hình chính
- **Title**: "Customer Debt"
- **Subtitle**: "Manage customer debts"
- **Add Button**: Thêm công nợ mới

#### **Search & Filter:**
- **Search Bar**: Tìm kiếm theo tên, SĐT, model xe, ID
- **Type Filter Chips**:
  - 🟦 **Trả góp**: Installment debts
  - 🟢 **Đặt cọc (có sẵn)**: Deposit for available vehicles
  - 🟡 **Pre-order**: Pre-order deposits

#### **Debt Cards Design:**
```javascript
// Card Structure
{
  // Header
  debtId: "CD001",
  customerName: "Nguyễn Văn A",
  customerPhone: "0901234567",
  
  // Badges
  typeBadge: "Trả góp",
  statusBadge: "Active",
  
  // Vehicle Info
  vehicleModel: "Tesla Model Y",
  vehiclePrice: "1,250,000,000 VND",
  
  // Debt Details (dynamic based on type)
  debtAmount: "1,250,000,000 VND",
  monthlyPayment: "125,000,000 VND",
  remainingMonths: "8 tháng",
  interestRate: "5.5%/năm",
  nextPaymentDate: "01/12/2024"
}
```

### 3. Manufacturer Debt Management Screen

#### **Header Features:**
- **Back Button**: Quay lại màn hình chính
- **Title**: "Manufacturer Debt"
- **Subtitle**: "Manage manufacturer debts"
- **Add Button**: Thêm công nợ mới

#### **Search & Filter:**
- **Search Bar**: Tìm kiếm theo tên nhà sản xuất, mã, ID
- **Type Filter Chips**:
  - 🟦 **Trả một lần**: Lump sum payments
  - 🟡 **Gối đầu**: Rolling credit

#### **Debt Cards Design:**
```javascript
// Card Structure
{
  // Header
  debtId: "MD001",
  manufacturerName: "Tesla Inc.",
  manufacturerCode: "TSLA",
  
  // Badges
  typeBadge: "Trả một lần",
  statusBadge: "Active",
  blockedBadge: "BLOCKED" (if applicable),
  
  // Vehicle Statistics
  vehiclesOrdered: 25,
  vehiclesDelivered: 15,
  vehiclesPending: 10,
  
  // Debt Details (dynamic based on type)
  totalDebtAmount: "50,000,000,000 VND",
  remainingDebtAmount: "35,000,000,000 VND",
  paidAmount: "15,000,000,000 VND",
  dueDate: "31/12/2024",
  
  // For Rolling Credit
  creditLimit: "50,000,000,000 VND",
  availableCredit: "30,000,000,000 VND",
  creditUtilization: "40%",
  
  // Blocked Warning
  blockedReason: "Credit limit exceeded"
}
```

## 🔧 Technical Implementation

### 1. Service Layer - debtManagementService.js

#### **Customer Debt Methods:**
```javascript
// Get all customer debts
async getCustomerDebts(filters = {}) {
  // Mock data with filtering
  return this.getMockCustomerDebts(filters);
}

// Get customer debt by ID
async getCustomerDebtById(debtId) {
  // Mock implementation
}

// Create new customer debt
async createCustomerDebt(debtData) {
  // Mock implementation
}

// Update customer debt
async updateCustomerDebt(debtId, updateData) {
  // Mock implementation
}

// Record payment
async recordCustomerDebtPayment(debtId, paymentData) {
  // Mock implementation with payment tracking
}
```

#### **Manufacturer Debt Methods:**
```javascript
// Get all manufacturer debts
async getManufacturerDebts(filters = {}) {
  // Mock data with filtering
  return this.getMockManufacturerDebts(filters);
}

// Get manufacturer debt by ID
async getManufacturerDebtById(debtId) {
  // Mock implementation
}

// Create new manufacturer debt
async createManufacturerDebt(debtData) {
  // Mock implementation
}

// Update manufacturer debt
async updateManufacturerDebt(debtId, updateData) {
  // Mock implementation
}

// Record payment
async recordManufacturerDebtPayment(debtId, paymentData) {
  // Mock implementation with payment tracking
}
```

### 2. Mock Data Structure

#### **Customer Debt Mock Data:**
```javascript
{
  id: 'CD001',
  customerName: 'Nguyễn Văn A',
  customerPhone: '0901234567',
  customerEmail: 'nguyenvana@email.com',
  debtType: 'installment', // installment, deposit_available, pre_order
  vehicleModel: 'Tesla Model Y',
  vehiclePrice: 1250000000,
  debtAmount: 1250000000,
  monthlyPayment: 125000000,
  totalMonths: 12,
  remainingMonths: 8,
  interestRate: 5.5,
  depositAmount: 0,
  depositType: null, // available, pre_order
  status: 'active', // active, completed, overdue
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  lastPaymentDate: '2024-11-01',
  nextPaymentDate: '2024-12-01',
  createdAt: '2024-01-01',
  createdBy: 'Dealer Manager'
}
```

#### **Manufacturer Debt Mock Data:**
```javascript
{
  id: 'MD001',
  manufacturerName: 'Tesla Inc.',
  manufacturerCode: 'TSLA',
  debtType: 'lump_sum', // lump_sum, rolling_credit
  totalDebtAmount: 50000000000,
  remainingDebtAmount: 35000000000,
  paidAmount: 15000000000,
  paymentType: 'full_payment', // full_payment, rolling_credit
  creditLimit: null,
  availableCredit: null,
  vehiclesOrdered: 25,
  vehiclesDelivered: 15,
  vehiclesPending: 10,
  orderDate: '2024-01-15',
  dueDate: '2024-12-31',
  lastPaymentDate: '2024-11-01',
  nextPaymentDate: '2024-12-01',
  interestRate: 0,
  status: 'active', // active, completed, overdue, blocked
  blocked: false,
  blockedReason: null,
  createdAt: '2024-01-15',
  createdBy: 'Dealer Manager'
}
```

### 3. Navigation Integration

#### **AppNavigator.js Updates:**
```javascript
// Import debt management screens
import CustomerDebtManagementScreen from '../screens/debt/CustomerDebtManagementScreen';
import ManufacturerDebtManagementScreen from '../screens/debt/ManufacturerDebtManagementScreen';

// Add to Stack Navigator
<Stack.Screen
  name="CustomerDebtManagement"
  component={CustomerDebtManagementScreen}
  options={{ headerShown: false }}
/>
<Stack.Screen
  name="ManufacturerDebtManagement"
  component={ManufacturerDebtManagementScreen}
  options={{ headerShown: false }}
/>
```

## 🎯 Key Features

### 1. Smart Filtering System
- **Type-based filtering**: Filter by debt type (installment, deposit, pre-order, etc.)
- **Status filtering**: Active, Pending, Overdue, Completed, Blocked
- **Search functionality**: Real-time search across multiple fields
- **Visual filter chips**: Easy-to-use filter interface

### 2. Comprehensive Debt Information
- **Customer Debt**: Detailed payment schedules, interest rates, remaining amounts
- **Manufacturer Debt**: Credit utilization, vehicle statistics, payment tracking
- **Status indicators**: Color-coded badges for quick status identification
- **Warning systems**: Credit limit alerts, overdue notifications

### 3. Payment Tracking
- **Payment history**: Track all payments made
- **Payment recording**: Easy payment entry system
- **Automatic calculations**: Remaining amounts, utilization percentages
- **Payment reminders**: Next payment dates and due dates

### 4. Visual Design Elements
- **Color-coded badges**: Different colors for different debt types and statuses
- **Progress indicators**: Credit utilization bars, payment progress
- **Vehicle statistics**: Quick overview of ordered/delivered/pending vehicles
- **Warning alerts**: Visual alerts for blocked accounts or exceeded limits

## 📊 Business Logic

### 1. Customer Debt Calculations
```javascript
// Installment calculations
monthlyPayment = (vehiclePrice / totalMonths) + interest
remainingAmount = totalAmount - paidAmount
remainingMonths = totalMonths - completedPayments

// Deposit calculations
remainingAfterDeposit = vehiclePrice - depositAmount
```

### 2. Manufacturer Debt Calculations
```javascript
// Lump sum calculations
remainingDebt = totalDebtAmount - paidAmount
completionPercentage = (paidAmount / totalDebtAmount) * 100

// Rolling credit calculations
availableCredit = creditLimit - remainingDebtAmount
utilizationPercentage = (remainingDebtAmount / creditLimit) * 100
blockedStatus = remainingDebtAmount > creditLimit
```

### 3. Status Management
```javascript
// Customer debt statuses
active: debt is ongoing and payments are current
pending: debt is set up but not yet active
overdue: payments are past due
completed: debt is fully paid

// Manufacturer debt statuses
active: debt is ongoing and within limits
pending: debt is set up but not yet active
overdue: payments are past due
blocked: credit limit exceeded or other restrictions
completed: debt is fully paid
```

## 🚀 Backend Integration Ready

### 1. API Endpoints (Ready for Implementation)
```javascript
// Customer Debt APIs
GET    /api/debt-management/customer-debts
GET    /api/debt-management/customer-debts/:id
POST   /api/debt-management/customer-debts
PUT    /api/debt-management/customer-debts/:id
POST   /api/debt-management/customer-debts/:id/payments

// Manufacturer Debt APIs
GET    /api/debt-management/manufacturer-debts
GET    /api/debt-management/manufacturer-debts/:id
POST   /api/debt-management/manufacturer-debts
PUT    /api/debt-management/manufacturer-debts/:id
POST   /api/debt-management/manufacturer-debts/:id/payments
```

### 2. Data Models (Backend Ready)
```javascript
// Customer Debt Model
{
  id: String,
  customerId: String,
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  debtType: Enum['installment', 'deposit_available', 'pre_order'],
  vehicleId: String,
  vehicleModel: String,
  vehiclePrice: Number,
  debtAmount: Number,
  monthlyPayment: Number,
  totalMonths: Number,
  remainingMonths: Number,
  interestRate: Number,
  depositAmount: Number,
  depositType: Enum['available', 'pre_order'],
  status: Enum['active', 'pending', 'overdue', 'completed'],
  startDate: Date,
  endDate: Date,
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  payments: [PaymentSchema],
  createdAt: Date,
  createdBy: String,
  updatedAt: Date,
  updatedBy: String
}

// Manufacturer Debt Model
{
  id: String,
  manufacturerId: String,
  manufacturerName: String,
  manufacturerCode: String,
  debtType: Enum['lump_sum', 'rolling_credit'],
  totalDebtAmount: Number,
  remainingDebtAmount: Number,
  paidAmount: Number,
  paymentType: Enum['full_payment', 'rolling_credit'],
  creditLimit: Number,
  availableCredit: Number,
  vehiclesOrdered: Number,
  vehiclesDelivered: Number,
  vehiclesPending: Number,
  orderDate: Date,
  dueDate: Date,
  lastPaymentDate: Date,
  nextPaymentDate: Date,
  interestRate: Number,
  status: Enum['active', 'pending', 'overdue', 'blocked', 'completed'],
  blocked: Boolean,
  blockedReason: String,
  payments: [PaymentSchema],
  createdAt: Date,
  createdBy: String,
  updatedAt: Date,
  updatedBy: String
}
```

### 3. Service Integration Points
```javascript
// Ready for backend integration
class DebtManagementService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/debt-management`;
  }

  // All methods are ready to switch from mock to real API calls
  // Just uncomment the fetch calls and comment out mock implementations
}
```

## 🧪 Testing Scenarios

### 1. Customer Debt Testing
1. **Installment Debt**: Create, view, update, record payments
2. **Deposit Available**: Create deposit, view details, convert to installment
3. **Pre-order**: Create pre-order, track status, manage delivery
4. **Payment Recording**: Record payments, update remaining amounts
5. **Status Updates**: Test status changes (active → completed, overdue)

### 2. Manufacturer Debt Testing
1. **Lump Sum**: Create, view, update, record payments
2. **Rolling Credit**: Create credit line, test utilization, handle limits
3. **Credit Management**: Test credit limit enforcement, blocking logic
4. **Vehicle Tracking**: Update vehicle statistics (ordered/delivered/pending)
5. **Payment Processing**: Record payments, update credit availability

### 3. UI/UX Testing
1. **Navigation**: Test navigation from home screen to debt management
2. **Filtering**: Test all filter combinations and search functionality
3. **Responsive Design**: Test on different screen sizes
4. **Loading States**: Test loading and error states
5. **Empty States**: Test empty state displays

## 🔮 Future Enhancements

### 1. Advanced Features
- **Payment Scheduling**: Automated payment reminders and scheduling
- **Interest Calculations**: Complex interest calculation engines
- **Reporting**: Comprehensive debt reports and analytics
- **Notifications**: Push notifications for payment due dates
- **Integration**: Integration with accounting and CRM systems

### 2. Mobile Optimizations
- **Offline Support**: Cache debt data for offline viewing
- **Quick Actions**: Swipe actions for common operations
- **Barcode Scanning**: Scan vehicle VINs for quick data entry
- **Biometric Authentication**: Secure access to sensitive debt information

### 3. Analytics & Insights
- **Debt Analytics**: Track debt trends and patterns
- **Customer Insights**: Analyze customer payment behaviors
- **Credit Risk Assessment**: Automated risk scoring
- **Performance Metrics**: Track collection rates and efficiency

**Hệ thống quản lý công nợ hoàn thành! Dealer Manager giờ có thể quản lý đầy đủ cả công nợ khách hàng và nhà sản xuất với giao diện đẹp mắt và dễ sử dụng! 💰🏭**
