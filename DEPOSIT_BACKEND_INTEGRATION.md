# Deposit System - Backend Integration Guide

## 📋 Overview

Hệ thống quản lý đặt cọc đã được thiết kế với architecture sẵn sàng cho backend integration.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  - CreateDepositAvailableScreen.js                          │
│  - CreatePreOrderScreen.js                                  │
│  - DepositDetailScreen.js                                   │
│  - DepositManagementScreen.js                               │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                       Hook Layer                             │
│  - useDepositManagement.js                                  │
│    • Centralized state & logic                              │
│    • Easy to swap storage → API                             │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  - depositPaymentService.js                                 │
│    • Payment processing logic                               │
│    • QR code generation                                     │
│    • Full/Installment flows                                 │
│                                                              │
│  - depositStorageService.js                                 │
│    • CRUD operations                                        │
│    • Currently: AsyncStorage                                │
│    • Future: API calls                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    Storage/API Layer                         │
│  - AsyncStorage (Current - Development)                     │
│  - REST API (Future - Production)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Service Layer - Ready for Backend

### **1. depositPaymentService.js**

#### **Current (Mock):**
```javascript
class DepositPaymentService {
  async processFullPayment(depositData) {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newQuotation = await quotationStorageService.addQuotation(quotationData);
    await CustomerManagementService.addCustomerFromQuotation(customerData);
    await depositStorageService.updateDeposit(depositId, updateData);
    
    return { success: true, quotation: newQuotation };
  }
}
```

#### **Future (API):**
```javascript
class DepositPaymentService {
  async processFullPayment(depositData) {
    // ✅ Just replace with API call
    const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        depositId: depositData.id,
        customerId: depositData.customerId,
        remainingAmount: depositData.remainingAmount,
        vehicleId: depositData.vehicleId,
        paymentMethod: 'vnpay_qr',
      }),
    });

    if (!response.ok) {
      throw new Error('Payment processing failed');
    }

    const result = await response.json();
    
    // Backend handles:
    // - Create quotation
    // - Add customer
    // - Update deposit
    // - Update vehicle status
    
    return result; // Same structure as mock
  }

  async processInstallmentPayment(depositData, installmentMonths) {
    const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/installment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        depositId: depositData.id,
        customerId: depositData.customerId,
        remainingAmount: depositData.remainingAmount,
        installmentMonths: installmentMonths,
        interestRate: 6.0,
        paymentMethod: 'vnpay_qr',
      }),
    });

    const result = await response.json();
    return result;
  }

  async createPaymentRequest(paymentData) {
    const response = await fetch(`${API_URL}/payments/vnpay/create-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        orderId: paymentData.depositId,
        orderInfo: `Thanh toán đặt cọc ${paymentData.depositId}`,
        paymentType: paymentData.paymentType,
      }),
    });

    const result = await response.json();
    
    return {
      paymentId: result.paymentId,
      qrCode: result.qrCodeData,
      qrCodeImage: result.qrCodeImage, // Base64 or URL
      paymentUrl: result.paymentUrl,
      transactionId: result.transactionId,
    };
  }
}
```

---

## 🔌 API Endpoints Specification

### **1. Create Deposit (Available)**

```javascript
POST /api/deposits/available
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  // Customer info
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  
  // Vehicle info (from inventory)
  vehicleId: String,        // Selected from available inventory
  vehicleModel: String,
  vehicleColor: String,
  vehiclePrice: Number,
  
  // Deposit details
  depositAmount: Number,
  depositPercentage: Number,
  remainingAmount: Number,
  
  // Dates
  depositDate: Date,
  expectedDeliveryDate: Date,
  finalPaymentDueDate: Date,
  
  // Metadata
  notes: String,
  createdBy: String,        // Staff user ID
  dealerId: String,
}

Response:
{
  success: true,
  deposit: {
    id: 'DEP001',
    type: 'available',
    status: 'pending',
    vehicleReserved: true,  // Vehicle marked as reserved
    // ... all deposit data
  },
  vehicle: {
    id: 'V001',
    status: 'reserved',     // Updated in inventory
    reservedBy: 'DEP001',
    reservedAt: '2024-10-14...',
  }
}
```

### **2. Create Pre-order**

```javascript
POST /api/deposits/pre-order
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  // Customer info
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  
  // Vehicle info (from manufacturer catalog)
  vehicleModel: String,     // Model name
  vehicleColor: String,     // Custom color from catalog
  vehiclePrice: Number,
  
  // Deposit details
  depositAmount: Number,
  depositPercentage: Number,
  remainingAmount: Number,
  
  // Pre-order specific
  estimatedArrival: String, // "1-3 tháng"
  
  // Dates
  depositDate: Date,
  expectedDeliveryDate: Date,
  finalPaymentDueDate: Date,
  
  // Metadata
  notes: String,
  createdBy: String,
  dealerId: String,
}

Response:
{
  success: true,
  deposit: {
    id: 'DEP002',
    type: 'pre_order',
    status: 'pending',
    manufacturerOrderId: 'MFG-PO-2024-001',
    manufacturerStatus: 'ordered',
    // ... all deposit data
  },
  manufacturerOrder: {
    orderId: 'MFG-PO-2024-001',
    status: 'ordered',
    estimatedDelivery: Date,
    trackingUrl: String,
  }
}
```

### **3. Confirm Deposit**

```javascript
PUT /api/deposits/:depositId/confirm
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  confirmedBy: String,      // Staff user ID
  confirmedAt: Date,
}

Response:
{
  success: true,
  deposit: {
    id: 'DEP001',
    status: 'confirmed',
    confirmedAt: '2024-10-14...',
    confirmedBy: 'staff001',
    // ... all deposit data
  }
}
```

### **4. Process Full Payment**

```javascript
POST /api/deposits/:depositId/payment/full
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  depositId: String,
  customerId: String,
  remainingAmount: Number,
  vehicleId: String,        // For available deposits
  paymentMethod: String,    // 'vnpay_qr', 'bank_transfer', etc.
  transactionId: String,    // VNPay transaction ID
}

Response:
{
  success: true,
  
  // Created quotation
  quotation: {
    id: 'Q123456',
    customerId: String,
    vehicleModel: String,
    totalAmount: Number,
    status: 'paid',
    paymentType: 'full',
    paymentCompletedAt: Date,
    depositId: 'DEP001',
  },
  
  // Customer record
  customer: {
    id: 'C123',
    name: String,
    phone: String,
    purchaseDate: Date,
    orderValue: Number,
    addedToManagement: true,
  },
  
  // Updated deposit
  deposit: {
    id: 'DEP001',
    status: 'completed',
    finalPaymentType: 'full',
    finalPaymentDate: Date,
    quotationId: 'Q123456',
  },
  
  // Vehicle status (if available)
  vehicle: {
    id: 'V001',
    status: 'sold',
    soldTo: 'C123',
    soldAt: Date,
  }
}
```

### **5. Process Installment Payment**

```javascript
POST /api/deposits/:depositId/payment/installment
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  depositId: String,
  customerId: String,
  remainingAmount: Number,
  installmentMonths: Number,    // 6, 12, 24, 36
  interestRate: Number,         // 6.0
  paymentMethod: String,
  transactionId: String,        // VNPay transaction for first payment
}

Response:
{
  success: true,
  
  // Created installment plan
  installment: {
    id: 'INST345678',
    quotationId: 'Q-DEP001',
    customerId: String,
    totalAmount: Number,
    installmentMonths: Number,
    monthlyPayment: Number,
    interestRate: Number,
    paymentSchedule: [
      {
        month: 1,
        dueDate: Date,
        amount: Number,
        status: 'paid',        // First payment completed
      },
      {
        month: 2,
        dueDate: Date,
        amount: Number,
        status: 'pending',
      },
      // ... 10 more months
    ],
  },
  
  // Updated deposit
  deposit: {
    id: 'DEP001',
    status: 'completed',
    finalPaymentType: 'installment',
    installmentMonths: 12,
    installmentId: 'INST345678',
    finalPaymentDate: Date,
  }
}
```

### **6. Create VNPay QR Code**

```javascript
POST /api/payments/vnpay/create-qr
Headers:
  Content-Type: application/json
  Authorization: Bearer {token}

Request Body:
{
  amount: Number,           // Amount in VND
  orderId: String,          // Deposit ID
  orderInfo: String,        // Payment description
  paymentType: String,      // 'full' or 'installment'
  customerId: String,
  returnUrl: String,        // App deep link for callback
}

Response:
{
  success: true,
  paymentId: 'PAY123456',
  qrCode: String,           // QR code data string
  qrCodeImage: String,      // Base64 image or URL
  paymentUrl: String,       // VNPay payment URL
  transactionId: String,
  expiresAt: Date,          // QR expires in 15 minutes
}
```

### **7. Verify Payment**

```javascript
GET /api/payments/:paymentId/verify
Headers:
  Authorization: Bearer {token}

Response:
{
  success: true,
  payment: {
    id: 'PAY123456',
    status: 'completed',    // or 'pending', 'failed'
    transactionId: String,
    amount: Number,
    paidAt: Date,
    vnpayResponse: {
      // VNPay callback data
    }
  }
}
```

### **8. Get Deposits**

```javascript
GET /api/deposits?type={type}&status={status}&search={query}
Headers:
  Authorization: Bearer {token}

Query Parameters:
  - type: 'available' | 'pre_order' | 'all'
  - status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'all'
  - search: String (search by customer name, phone, vehicle, etc.)
  - page: Number
  - limit: Number

Response:
{
  success: true,
  deposits: [
    {
      id: String,
      type: String,
      status: String,
      customerName: String,
      // ... all deposit fields
    }
  ],
  pagination: {
    page: Number,
    limit: Number,
    total: Number,
    totalPages: Number,
  }
}
```

---

## 🔄 Integration Steps

### **Step 1: Update depositPaymentService.js**

Replace mock implementations with API calls:

```javascript
// src/services/depositPaymentService.js

import { API_URL } from '../config/api';
import { getAuthToken } from './auth/authService';

class DepositPaymentService {
  async processFullPayment(depositData) {
    try {
      const token = await getAuthToken();
      
      // ✅ Replace mock with API call
      const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/full`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId: depositData.id,
          customerId: depositData.customerId,
          remainingAmount: depositData.remainingAmount,
          vehicleId: depositData.vehicleId,
          paymentMethod: 'vnpay_qr',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment processing failed');
      }

      const result = await response.json();
      
      // ✅ Backend returns same structure
      return {
        success: result.success,
        quotation: result.quotation,
        customer: result.customer,
        deposit: result.deposit,
      };
    } catch (error) {
      console.error('❌ Error processing full payment:', error);
      throw error;
    }
  }

  async processInstallmentPayment(depositData, installmentMonths) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/installment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          depositId: depositData.id,
          customerId: depositData.customerId,
          remainingAmount: depositData.remainingAmount,
          installmentMonths: installmentMonths,
          interestRate: 6.0,
          paymentMethod: 'vnpay_qr',
        }),
      });

      const result = await response.json();
      
      return {
        success: result.success,
        installment: result.installment,
        deposit: result.deposit,
      };
    } catch (error) {
      console.error('❌ Error processing installment payment:', error);
      throw error;
    }
  }

  async createPaymentRequest(paymentData) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/payments/vnpay/create-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          orderId: paymentData.depositId,
          orderInfo: `Thanh toán đặt cọc ${paymentData.depositId}`,
          paymentType: paymentData.paymentType,
          customerId: paymentData.customerId,
        }),
      });

      const result = await response.json();
      
      return {
        paymentId: result.paymentId,
        qrCode: result.qrCode,
        qrCodeImage: result.qrCodeImage,
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
        expiresAt: result.expiresAt,
      };
    } catch (error) {
      console.error('❌ Error creating payment request:', error);
      throw error;
    }
  }
}
```

### **Step 2: Update depositStorageService.js**

Replace AsyncStorage with API calls:

```javascript
// src/services/storage/depositStorageService.js

class DepositStorageService {
  async getDeposits() {
    try {
      // ✅ Replace AsyncStorage with API
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/deposits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data.deposits;
    } catch (error) {
      console.error('Error getting deposits:', error);
      return [];
    }
  }

  async createDeposit(depositData) {
    try {
      const token = await getAuthToken();
      
      const endpoint = depositData.type === 'available' 
        ? `${API_URL}/deposits/available`
        : `${API_URL}/deposits/pre-order`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(depositData),
      });

      const result = await response.json();
      return result.deposit;
    } catch (error) {
      console.error('Error creating deposit:', error);
      throw error;
    }
  }

  async updateDeposit(depositId, updateData) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_URL}/deposits/${depositId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      return result.deposit;
    } catch (error) {
      console.error('Error updating deposit:', error);
      throw error;
    }
  }
}
```

### **Step 3: Update useDepositManagement.js**

Hook already structured for API integration:

```javascript
// src/hooks/useDepositManagement.js

export const useDepositManagement = () => {
  const loadDeposits = useCallback(async () => {
    try {
      setLoading(true);
      
      // ✅ Service call remains the same
      // Just update depositStorageService to use API
      const allDeposits = await depositStorageService.getDeposits();
      
      setDeposits(allDeposits);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách đặt cọc');
      setLoading(false);
    }
  }, []);

  const confirmDeposit = useCallback(async (depositId) => {
    try {
      // ✅ Service call remains the same
      const updatedDeposit = await depositStorageService.updateDeposit(depositId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
        confirmedBy: 'Dealer Staff',
      });
      
      return updatedDeposit;
    } catch (err) {
      throw err;
    }
  }, []);

  const processFinalPayment = useCallback(async (deposit, paymentType, installmentMonths) => {
    try {
      // ✅ Service call remains the same
      if (paymentType === 'full') {
        return await depositPaymentService.processFullPayment(deposit);
      } else {
        return await depositPaymentService.processInstallmentPayment(deposit, installmentMonths);
      }
    } catch (err) {
      throw err;
    }
  }, []);

  // ✅ No changes needed in UI components!
  return { loadDeposits, confirmDeposit, processFinalPayment, ... };
};
```

---

## 📱 UI Components - Zero Changes Needed

### **DepositDetailScreen.js**

```javascript
// ✅ Component code remains exactly the same
// Only service layer changes

const processDepositPayment = async () => {
  try {
    setProcessingPayment(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (selectedPaymentType === 'full') {
      // ✅ Same service call - backend does the work
      const result = await depositPaymentService.processFullPayment(deposit);
      
      Alert.alert(
        'Thanh toán thành công',
        `✅ Đã thanh toán full!\n\n📋 Báo giá ${result.quotation.id} đã được tạo\n👤 Khách hàng đã được thêm vào danh sách`
      );
    } else if (selectedPaymentType === 'installment') {
      // ✅ Same service call
      const result = await depositPaymentService.processInstallmentPayment(deposit, installmentMonths);
      
      Alert.alert(
        'Thanh toán thành công',
        `✅ Kế hoạch trả góp ${installmentMonths} tháng đã được tạo!`
      );
    }
  } catch (error) {
    Alert.alert('Lỗi', error.message);
    setProcessingPayment(false);
  }
};
```

---

## 🔐 Authentication & Config

### **Create config/api.js:**

```javascript
// src/config/api.js

export const API_CONFIG = {
  // Development
  DEV_URL: 'http://localhost:3000/api',
  
  // Production
  PROD_URL: 'https://api.evdock.com/api',
  
  // Current
  BASE_URL: __DEV__ 
    ? 'http://localhost:3000/api' 
    : 'https://api.evdock.com/api',
};

export const API_URL = API_CONFIG.BASE_URL;

// VNPay Config
export const VNPAY_CONFIG = {
  SANDBOX_URL: 'https://sandbox.vnpayment.vn',
  PROD_URL: 'https://vnpayment.vn',
  TMN_CODE: 'YOUR_TMN_CODE',
  HASH_SECRET: 'YOUR_HASH_SECRET',
};
```

### **Update AuthContext:**

```javascript
// src/contexts/AuthContext.js

export const getAuthToken = async () => {
  const userData = await AsyncStorage.getItem('@EVDock:User');
  if (userData) {
    const user = JSON.parse(userData);
    return user.token;
  }
  return null;
};
```

---

## 📊 Data Flow (Backend Integration)

### **Current (Mock):**
```
UI Component
  ↓
depositPaymentService.processFullPayment()
  ↓
quotationStorageService.addQuotation() → AsyncStorage
  ↓
CustomerManagementService.addCustomer() → AsyncStorage
  ↓
depositStorageService.updateDeposit() → AsyncStorage
  ↓
Return result to UI
```

### **Future (API):**
```
UI Component
  ↓
depositPaymentService.processFullPayment()
  ↓
POST /api/deposits/{id}/payment/full
  ↓
Backend handles ALL operations:
  • Create quotation in DB
  • Add customer to DB
  • Update deposit in DB
  • Update vehicle status in DB
  • Send notification to customer
  • Generate invoice
  ↓
Return result to UI
  ↓
UI updates (same code!)
```

---

## ✅ Migration Checklist

### **Phase 1: API Setup**
```
☐ Set up backend API server
☐ Create database tables (deposits, quotations, customers, installments)
☐ Implement authentication endpoints
☐ Configure VNPay merchant account
☐ Set up API base URL in config
```

### **Phase 2: Service Layer**
```
☐ Update depositPaymentService.js
  ☐ Replace processFullPayment mock → API call
  ☐ Replace processInstallmentPayment mock → API call
  ☐ Replace createPaymentRequest mock → VNPay API

☐ Update depositStorageService.js
  ☐ Replace getDeposits AsyncStorage → API
  ☐ Replace createDeposit AsyncStorage → API
  ☐ Replace updateDeposit AsyncStorage → API

☐ Update quotationStorageService.js
  ☐ Keep for local cache or remove completely

☐ Update installmentStorageService.js
  ☐ Keep for local cache or remove completely
```

### **Phase 3: Testing**
```
☐ Test create available deposit
☐ Test create pre-order
☐ Test confirm deposit
☐ Test full payment
  ☐ Quotation created in Sales
  ☐ Customer added to Customers
  ☐ Deposit completed
☐ Test installment payment
  ☐ Installment plan created
  ☐ Deposit completed
☐ Test VNPay QR code
☐ Test payment verification
```

### **Phase 4: Error Handling**
```
☐ Network errors
☐ Timeout errors
☐ Payment failed scenarios
☐ Duplicate payment prevention
☐ Offline mode fallback
```

---

## 🎯 Key Benefits

### **1. Separation of Concerns:**
```
✅ UI: Only handles presentation & user interaction
✅ Hook: Manages state & orchestration
✅ Service: Handles business logic & API calls
✅ Storage: Data persistence layer
```

### **2. Easy API Integration:**
```
✅ Just update service layer methods
✅ UI components unchanged
✅ All TODO comments marked for API calls
✅ Request/Response structures documented
```

### **3. Maintainability:**
```
✅ Single source of truth for API endpoints
✅ Centralized error handling
✅ Consistent response format
✅ Easy to add new features
```

### **4. Testing:**
```
✅ Can test services independently
✅ Mock data for UI development
✅ Can switch between mock/API via config
✅ Easy to debug
```

---

## 🚀 Quick Start - Backend Integration

### **Minimal Changes Needed:**

```javascript
// 1. Create config file
// src/config/api.js
export const API_URL = 'https://your-backend.com/api';

// 2. Update depositPaymentService.js
// Replace this:
await new Promise(resolve => setTimeout(resolve, 1000));
const newQuotation = await quotationStorageService.addQuotation(quotationData);

// With this:
const response = await fetch(`${API_URL}/deposits/${depositData.id}/payment/full`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(depositData),
});
const result = await response.json();
return result;

// 3. Update depositStorageService.js
// Replace AsyncStorage.getItem() with API calls

// ✅ DONE! UI components work without changes
```

---

## 📝 Backend Requirements

### **Database Tables:**

```sql
-- Deposits
CREATE TABLE deposits (
  id VARCHAR PRIMARY KEY,
  type VARCHAR, -- 'available' or 'pre_order'
  status VARCHAR, -- 'pending', 'confirmed', 'completed', 'cancelled'
  
  -- Customer
  customer_id VARCHAR,
  customer_name VARCHAR,
  customer_phone VARCHAR,
  customer_email VARCHAR,
  
  -- Vehicle
  vehicle_id VARCHAR, -- For available
  vehicle_model VARCHAR,
  vehicle_color VARCHAR,
  vehicle_price DECIMAL,
  
  -- Amounts
  deposit_amount DECIMAL,
  deposit_percentage DECIMAL,
  remaining_amount DECIMAL,
  
  -- Dates
  deposit_date TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  final_payment_due_date TIMESTAMP,
  
  -- Payment
  final_payment_type VARCHAR, -- 'full' or 'installment'
  final_payment_date TIMESTAMP,
  quotation_id VARCHAR,
  installment_id VARCHAR,
  
  -- Pre-order
  manufacturer_order_id VARCHAR,
  
  -- Metadata
  created_at TIMESTAMP,
  created_by VARCHAR,
  dealer_id VARCHAR
);

-- Link tables
-- quotations: Already exists
-- installments: Already exists
-- customers: Already exists
```

### **Backend Logic:**

```javascript
// POST /api/deposits/:id/payment/full
async function processFullPayment(req, res) {
  const { depositId } = req.params;
  const { customerId, remainingAmount, vehicleId } = req.body;
  
  try {
    // Start transaction
    await db.beginTransaction();
    
    // 1. Create quotation
    const quotation = await db.quotations.create({
      customerId,
      vehicleModel: deposit.vehicleModel,
      totalAmount: deposit.vehiclePrice,
      status: 'paid',
      paymentType: 'full',
      depositId: depositId,
    });
    
    // 2. Add customer
    const customer = await db.customers.upsert({
      id: customerId,
      name: deposit.customerName,
      phone: deposit.customerPhone,
      purchaseDate: new Date(),
      orderValue: deposit.vehiclePrice,
    });
    
    // 3. Update deposit
    await db.deposits.update({
      where: { id: depositId },
      data: {
        status: 'completed',
        finalPaymentType: 'full',
        quotationId: quotation.id,
      }
    });
    
    // 4. Update vehicle (if available)
    if (vehicleId) {
      await db.vehicles.update({
        where: { id: vehicleId },
        data: {
          status: 'sold',
          soldTo: customerId,
        }
      });
    }
    
    // Commit transaction
    await db.commit();
    
    res.json({
      success: true,
      quotation,
      customer,
      deposit: { id: depositId, status: 'completed' },
    });
  } catch (error) {
    await db.rollback();
    res.status(500).json({ error: error.message });
  }
}
```

---

## ✨ Summary

**Code đã được refactor để dễ kết hợp với Backend!** 🎯

### **Changes Made:**
```
✅ Created depositPaymentService.js
   • Centralized payment processing logic
   • All TODO comments for API integration
   • Clear request/response structures

✅ Created useDepositManagement.js
   • Custom hook for state management
   • Easy to swap storage → API
   • Reusable across screens

✅ Updated DepositDetailScreen.js
   • Uses service layer
   • Simplified component code
   • No business logic in UI

✅ Documentation complete:
   • API endpoints specification
   • Request/Response examples
   • Migration checklist
   • Backend requirements
```

### **To Integrate with Backend:**
```
1. Update API_URL in config
2. Replace service methods with fetch() calls
3. Add authentication headers
4. Test endpoints
✅ UI components work without changes!
```

**Sẵn sàng cho Backend integration! 🚀**
