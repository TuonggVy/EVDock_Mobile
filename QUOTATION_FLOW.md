# Quotation Flow Documentation

## Luồng hoạt động tạo báo giá

### 1. **Tạo báo giá (CreateQuotationScreen)**
- Dealer Staff chọn xe từ catalog
- Điền thông tin khách hàng (Tên, Email, Số điện thoại)
- Chọn màu sắc, số lượng
- Nhập ngày giao hàng và yêu cầu đặc biệt
- Áp dụng mã khuyến mãi (nếu có)
- Xem bảng giá chi tiết
- Nhấn "Tạo Báo Giá"

### 2. **Lưu trữ báo giá**
- Báo giá được lưu vào local storage (AsyncStorage)
- ID được tự động generate: Q0001, Q0002, ...
- Status mặc định: "pending"
- Thời gian hiệu lực: 7 ngày từ ngày tạo
- Tự động thêm thông tin: createdBy, dealerId, timestamps

### 3. **Hiển thị trong Sales category**
- Sau khi tạo thành công, chuyển về QuotationManagementScreen
- Báo giá mới xuất hiện ở đầu danh sách
- Có thể tìm kiếm, lọc theo trạng thái
- Có thể xem chi tiết, chỉnh sửa, xóa

## Cấu trúc dữ liệu báo giá

```javascript
{
  id: "Q0001",                    // ID tự động generate
  customerName: "Nguyễn Văn A",   // Tên khách hàng
  customerEmail: "email@...",     // Email khách hàng
  customerPhone: "0901234567",    // Số điện thoại
  vehicleModel: "Tesla Model Y",  // Tên xe
  vehicleImage: "banner-modely.png", // Hình ảnh xe
  totalAmount: 1200000000,        // Tổng tiền
  status: "pending",              // Trạng thái: pending/approved/rejected
  createdAt: "2024-01-15T10:30:00Z", // Ngày tạo
  validUntil: "2024-01-22T10:30:00Z", // Ngày hết hạn
  createdBy: "staff001",          // ID nhân viên tạo
  dealerId: "dealer001",          // ID đại lý
  items: [                        // Chi tiết sản phẩm
    {
      name: "Tesla Model Y",
      quantity: 1,
      price: 1200000000,
      type: "vehicle"
    }
  ],
  notes: "Ghi chú đặc biệt",      // Ghi chú
  lastModified: "2024-01-15T10:30:00Z", // Lần sửa cuối
  
  // Dữ liệu chi tiết cho màn hình detail
  vehicle: { ... },               // Thông tin xe chi tiết
  customer: { ... },              // Thông tin khách hàng chi tiết
  details: { ... },               // Chi tiết báo giá
  pricing: { ... },               // Bảng giá chi tiết
  promotion: { ... }              // Thông tin khuyến mãi
}
```

## Services được sử dụng

### 1. **quotationService.js**
- API endpoints cho backend integration
- Mock service cho development
- Functions: createQuotation, getQuotations, updateQuotation, deleteQuotation

### 2. **quotationStorageService.js**
- Quản lý local storage (AsyncStorage)
- Functions: addQuotation, getQuotations, updateQuotation, deleteQuotation
- Search và filter quotations
- Generate unique IDs

## Tích hợp Backend

### Khi backend sẵn sàng:
1. Thay thế `mockQuotationService` bằng `quotationService`
2. Cập nhật API endpoints trong `QUOTATION_ENDPOINTS`
3. Thêm authentication headers
4. Xử lý error handling cho API calls
5. Sync local storage với backend data

### Migration strategy:
- Local storage làm cache
- Sync với backend khi có kết nối
- Offline-first approach
- Conflict resolution cho concurrent edits

## Navigation Flow

```
EmployeeHomeScreen (Sales card)
    ↓
QuotationManagementScreen (Danh sách báo giá)
    ↓
CreateQuotationScreen (Tạo báo giá mới)
    ↓ (Sau khi tạo thành công)
QuotationManagementScreen (Hiển thị báo giá mới)
    ↓
QuotationDetailScreen (Xem chi tiết báo giá)
```

## Features

### ✅ Đã implement:
- Tạo báo giá với đầy đủ thông tin
- Lưu trữ local với AsyncStorage
- Hiển thị danh sách báo giá
- Tìm kiếm và lọc báo giá
- Xem chi tiết báo giá
- Refresh data khi focus screen
- Áp dụng mã khuyến mãi
- Tính toán giá tự động

### 🔄 Cần cải thiện:
- Authentication context integration
- Real-time updates
- Offline/online sync
- Error handling nâng cao
- Validation rules
- File upload cho attachments

### 🚀 Tương lai:
- Push notifications
- Email/SMS integration
- Advanced reporting
- Multi-language support
- Dark mode
- Accessibility features
