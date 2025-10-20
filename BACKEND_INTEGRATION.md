# Backend Integration Guide

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp ứng dụng EVDock Mobile với Backend API. Ứng dụng đã được thiết kế với cấu trúc service layer để dễ dàng chuyển đổi từ mock data sang real API calls.

## Cấu trúc Service Layer

### 1. Order Service (`src/services/orderService.js`)

**Chức năng**: Quản lý đơn hàng từ Dealer Manager

**API Endpoints**:
```javascript
// Tạo đơn hàng mới
POST /api/orders
{
  "dealerId": "DEALER001",
  "dealerName": "AutoWorld Hanoi",
  "vehicleModel": "Model X",
  "quantity": 5,
  "color": "Black",
  "orderDate": "2024-01-15",
  "expectedDelivery": "2024-02-15",
  "totalValue": 600000000,
  "priority": "high",
  "specialRequests": "Urgent delivery needed"
}

// Lấy đơn hàng theo dealer
GET /api/orders/dealer/{dealerId}

// Lấy đơn hàng theo ID
GET /api/orders/{orderId}

// Cập nhật đơn hàng
PUT /api/orders/{orderId}

// Xóa đơn hàng
DELETE /api/orders/{orderId}
```

### 2. Allocation Service (`src/services/orderService.js`)

**Chức năng**: Quản lý phân phối xe từ EVM Staff

**API Endpoints**:
```javascript
// Lấy đơn hàng chờ phân phối
GET /api/orders/pending-allocation

// Tạo phân phối xe
POST /api/allocations
{
  "orderId": "ORD001",
  "dealerId": "DEALER001",
  "dealerName": "AutoWorld Hanoi",
  "vehicleModel": "Model X",
  "quantity": 5,
  "color": "Black",
  "vehicleVIN": "VIN123456789",
  "warehouseLocation": "Warehouse A - Hanoi",
  "estimatedDelivery": "2024-02-05",
  "notes": "Ready for shipment",
  "priority": "high"
}

// Lấy tất cả phân phối
GET /api/allocations

// Cập nhật trạng thái phân phối
PUT /api/allocations/{allocationId}/status
{
  "status": "shipped" // or "delivered"
}

// Lấy phân phối theo đơn hàng
GET /api/allocations/order/{orderId}
```

### 3. Warehouse Service (`src/services/orderService.js`)

**Chức năng**: Quản lý thông tin kho

**API Endpoints**:
```javascript
// Lấy danh sách kho
GET /api/warehouses

// Lấy kho theo ID
GET /api/warehouses/{warehouseId}
```

## Luồng hoạt động

### 1. Dealer Manager tạo đơn hàng
```
Dealer Manager → OrderManagementScreen → orderService.createOrder() → Backend API
```

### 2. EVM Staff xem đơn hàng chờ phân phối
```
EVM Staff → AllocationManagementScreen → allocationService.getPendingOrders() → Backend API
```

### 3. EVM Staff phân phối xe
```
EVM Staff → AllocationManagementScreen → allocationService.createAllocation() → Backend API
```

### 4. Cập nhật trạng thái phân phối
```
EVM Staff → AllocationManagementScreen → allocationService.updateAllocationStatus() → Backend API
```

## Cách tích hợp với Backend

### Bước 1: Cập nhật API Configuration

Trong file `src/config/api.js`:
```javascript
export const API_BASE_URL = 'https://your-backend-api.com';
```

### Bước 2: Uncomment API calls trong Service

Trong file `src/services/orderService.js`, uncomment các API calls và comment mock implementations:

```javascript
// Thay vì:
// Mock implementation
await delay(500);
const newOrder = { ... };

// Sử dụng:
const response = await fetch(API_ENDPOINTS.ORDERS.CREATE, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  },
  body: JSON.stringify(orderData),
});
return await response.json();
```

### Bước 3: Implement Authentication

Cập nhật function `getAuthToken()` trong `src/services/orderService.js`:

```javascript
const getAuthToken = async () => {
  // Lấy token từ AsyncStorage hoặc Redux store
  const token = await AsyncStorage.getItem('auth_token');
  return token;
};
```

### Bước 4: Error Handling

Thêm error handling cho network requests:

```javascript
const handleApiError = (error) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return { success: false, error: 'Không thể kết nối đến server' };
  }
  return { success: false, error: 'Có lỗi xảy ra' };
};
```

## Database Schema (Tham khảo)

### Orders Table
```sql
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  dealer_id VARCHAR(50) NOT NULL,
  dealer_name VARCHAR(255) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  special_requests TEXT,
  status ENUM('pending_allocation', 'allocated', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending_allocation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Allocations Table
```sql
CREATE TABLE allocations (
  id VARCHAR(50) PRIMARY KEY,
  order_id VARCHAR(50) NOT NULL,
  dealer_id VARCHAR(50) NOT NULL,
  dealer_name VARCHAR(255) NOT NULL,
  vehicle_model VARCHAR(100) NOT NULL,
  quantity INT NOT NULL,
  color VARCHAR(50) NOT NULL,
  vehicle_vin VARCHAR(100) NOT NULL,
  warehouse_location VARCHAR(255) NOT NULL,
  allocated_date DATE NOT NULL,
  estimated_delivery DATE NOT NULL,
  status ENUM('allocated', 'shipped', 'delivered') DEFAULT 'allocated',
  notes TEXT,
  priority ENUM('low', 'normal', 'high') DEFAULT 'normal',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Warehouses Table
```sql
CREATE TABLE warehouses (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Testing

### 1. Unit Tests
```javascript
// Test order creation
describe('OrderService', () => {
  it('should create order successfully', async () => {
    const orderData = {
      dealerId: 'DEALER001',
      vehicleModel: 'Model X',
      quantity: 5,
      color: 'Black'
    };
    
    const result = await orderService.createOrder(orderData);
    expect(result.success).toBe(true);
    expect(result.data.id).toBeDefined();
  });
});
```

### 2. Integration Tests
```javascript
// Test full flow
describe('Order to Allocation Flow', () => {
  it('should create order and then allocate vehicle', async () => {
    // 1. Create order
    const order = await orderService.createOrder(orderData);
    
    // 2. Get pending orders
    const pendingOrders = await allocationService.getPendingOrders();
    expect(pendingOrders.data).toContainEqual(expect.objectContaining({id: order.data.id}));
    
    // 3. Create allocation
    const allocation = await allocationService.createAllocation(allocationData);
    expect(allocation.success).toBe(true);
  });
});
```

## Monitoring & Logging

### 1. API Call Logging
```javascript
const logApiCall = (endpoint, method, data, response) => {
  console.log(`API Call: ${method} ${endpoint}`, {
    request: data,
    response: response,
    timestamp: new Date().toISOString()
  });
};
```

### 2. Error Tracking
```javascript
const trackError = (error, context) => {
  // Send to error tracking service (Sentry, Bugsnag, etc.)
  console.error('API Error:', {
    error: error.message,
    context: context,
    stack: error.stack
  });
};
```

## Performance Optimization

### 1. Caching
```javascript
// Cache warehouse data
const cacheWarehouses = async () => {
  const warehouses = await warehouseService.getWarehouses();
  await AsyncStorage.setItem('warehouses', JSON.stringify(warehouses.data));
};
```

### 2. Pagination
```javascript
// Add pagination to API calls
const getOrdersWithPagination = async (page = 1, limit = 20) => {
  const response = await fetch(`${API_ENDPOINTS.ORDERS.GET_ALL}?page=${page}&limit=${limit}`);
  return await response.json();
};
```

## Security Considerations

### 1. API Key Management
```javascript
// Store API keys securely
const getApiKey = async () => {
  return await SecureStore.getItemAsync('api_key');
};
```

### 2. Request Validation
```javascript
// Validate request data before sending
const validateOrderData = (orderData) => {
  const required = ['dealerId', 'vehicleModel', 'quantity', 'color'];
  return required.every(field => orderData[field]);
};
```

## Deployment Checklist

- [ ] Update API_BASE_URL to production endpoint
- [ ] Implement proper authentication
- [ ] Add error handling for network failures
- [ ] Test all API endpoints
- [ ] Configure logging and monitoring
- [ ] Set up error tracking
- [ ] Test offline scenarios
- [ ] Performance testing
- [ ] Security audit

## Support

Nếu có vấn đề trong quá trình tích hợp, vui lòng liên hệ team backend hoặc tham khảo documentation của API endpoints.
