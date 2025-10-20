# Customer Auto-Addition Flow

## Tổng quan
Khi báo giá được thanh toán thành công, khách hàng sẽ tự động được thêm vào tab "Khách hàng" trong màn hình quản lý khách hàng của Dealer Staff.

## Luồng hoạt động

### 1. Quotation Detail Screen
- Dealer Staff nhấn nút "Thanh toán" cho báo giá ở trạng thái "Chờ thanh toán"
- Hiển thị modal thanh toán với QR code
- Khách hàng quét QR và thanh toán

### 2. Payment Processing
- Khi nhấn "Xác nhận thanh toán", gọi `processPaymentCompletion(quotationId)`
- Function này sẽ:
  - Cập nhật trạng thái báo giá thành "Đã thanh toán" trong `quotationStorageService`
  - **Tự động thêm khách hàng vào CustomerManagement**

### 3. Customer Addition Process
- `PaymentService.simulateQuotationStatusUpdate()` được gọi với status = 'completed'
- Khi status = 'completed', function sẽ:
  - Tạo instance của `CustomerManagementService`
  - Gọi `addCustomerFromQuotation(updatedQuotation)`
  - Convert dữ liệu quotation thành format customer
  - Lưu customer vào `AsyncStorage` với key `customers_data`

### 4. Customer Data Conversion
Quotation data được convert thành customer format:
```javascript
{
  name: quotation.customerName,
  phone: quotation.customerPhone,
  email: quotation.customerEmail,
  purchaseDate: quotation.paymentCompletedAt,
  orderValue: quotation.pricing.totalPrice,
  vehicleModel: quotation.vehicleModel,
  vehicleColor: quotation.vehicle.selectedColor,
  quotationId: quotation.id, // Link back to original quotation
  dealerId: quotation.dealerId,
  staffId: quotation.createdBy,
}
```

### 5. Storage Integration
- Customer được lưu vào `AsyncStorage` với key `customers_data`
- `CustomerManagementService.getCustomers()` sẽ ưu tiên load từ storage trước
- Nếu không có data trong storage, sẽ fallback về mock data

### 6. Customer Management Screen
- Tab "Khách hàng" hiển thị danh sách customers từ storage
- Customer mới được thêm sẽ xuất hiện ở đầu danh sách
- Thông tin hiển thị: tên, phone, xe đã mua, ngày mua, giá trị đơn

## Files liên quan

### Core Services
- `src/services/paymentService.js` - Xử lý payment và trigger customer addition
- `src/services/customerManagementService.js` - Quản lý customers và storage
- `src/services/storage/quotationStorageService.js` - Quản lý quotation storage

### Screens
- `src/screens/quotation/QuotationDetailScreen.js` - UI thanh toán
- `src/screens/customer/CustomerManagementScreen.js` - Hiển thị customers

### Hooks & Utils
- `src/hooks/usePayment.js` - Payment logic
- `src/hooks/useCustomerManagement.js` - Customer management logic
- `src/utils/customerTestUtils.js` - Test utilities

## Error Handling

### Payment Success, Customer Addition Fails
- Payment vẫn được xử lý thành công
- Customer addition failure được log nhưng không ảnh hưởng payment flow
- User vẫn nhận được thông báo thanh toán thành công

### Storage Issues
- Nếu AsyncStorage fail, system fallback về mock data
- Customer addition vẫn được thực hiện nhưng không persist
- Không ảnh hưởng đến payment process

## Testing

### Manual Testing
1. Tạo báo giá mới
2. Thanh toán thành công
3. Kiểm tra tab "Khách hàng" trong Customer Management
4. Verify customer xuất hiện với đúng thông tin

### Automated Testing
Sử dụng `customerTestUtils.js`:
```javascript
import { testCustomerAddition, clearTestData } from '../utils/customerTestUtils';

// Test customer addition
const result = await testCustomerAddition();
console.log(result);

// Clean up test data
await clearTestData();
```

## Backend Integration Notes

### API Endpoints (Future)
- `POST /api/customers` - Add customer from quotation
- `GET /api/customers` - Get customer list
- `PUT /api/quotations/{id}/payment-status` - Update payment status

### Database Schema (Future)
```sql
CREATE TABLE customers (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  purchase_date DATETIME,
  order_value DECIMAL(15,2),
  vehicle_model VARCHAR(255),
  vehicle_color VARCHAR(50),
  quotation_id VARCHAR(50),
  dealer_id VARCHAR(50),
  staff_id VARCHAR(50),
  created_at DATETIME,
  updated_at DATETIME
);
```

## Configuration

### AsyncStorage Keys
- `customers_data` - Customer list storage
- `quotations_data` - Quotation list storage

### Environment Variables
- `API_BASE_URL` - Backend API base URL
- `STORAGE_VERSION` - Storage version for data migration

## Future Enhancements

1. **Duplicate Prevention** - Check if customer already exists before adding
2. **Customer Update** - Update existing customer if quotation changes
3. **Notification System** - Notify staff when new customer is added
4. **Analytics** - Track customer conversion from quotations
5. **Export/Import** - Export customer data for reporting
