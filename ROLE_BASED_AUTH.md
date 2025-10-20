# EVDock Role-Based Authentication System

## Tổng quan

Hệ thống quản lý người dùng với 4 vai trò chính cho dự án EVDock, mỗi vai trò có giao diện và chức năng riêng biệt phù hợp với quy trình kinh doanh xe điện.

## Các vai trò (Roles)

### 1. **EVM Admin** (Quản trị viên EVM)
- **Email**: evmadmin@evdock.com
- **Password**: evmadmin123
- **Quyền hạn**: 
  - Có toàn quyền quản lý hệ thống
  - Quản lý giá sỉ, chiết khấu, khuyến mãi cho từng đại lý
  - Quản lý hợp đồng, chỉ tiêu doanh số của đại lý
  - Quản lý đại lý
  - Xem báo cáo toàn diện (doanh số, tồn kho, dự báo AI)
- **Giao diện**: Dashboard tổng quan với thống kê toàn hệ thống

### 2. **EVM Staff** (Nhân viên EVM)
- **Email**: evmstaff@evdock.com
- **Password**: evmstaff123
- **Quyền hạn**:
  - Quản lý danh mục xe điện (mẫu, phiên bản, màu sắc)
  - Quản lý tồn kho tổng
  - Điều phối xe cho đại lý
- **Giao diện**: Dashboard quản lý vận hành với thống kê tồn kho

### 3. **Dealer Manager** (Quản lý đại lý)
- **Email**: dealermanager@evdock.com
- **Password**: dealermanager123
- **Quyền hạn**:
  - Có quyền của Staff (quản lý danh mục xe điện ở đại lý)
  - Quản lý khuyến mãi ở đại lý
  - Đặt xe từ hãng, theo dõi giao xe
  - Quản lý thanh toán
  - Xem báo cáo doanh số theo nhân viên
  - Quản lý công nợ với khách hàng & hãng
- **Giao diện**: Dashboard quản lý đại lý với thống kê hiệu suất

### 4. **Dealer Staff** (Nhân viên đại lý)
- **Email**: dealerstaff@evdock.com
- **Password**: dealerstaff123
- **Quyền hạn**:
  - Truy vấn xe, so sánh mẫu, xem giá
  - Tạo báo giá, hợp đồng, đơn hàng
  - Quản lý khách hàng cá nhân (thông tin, lái thử, phản hồi)
- **Giao diện**: Dashboard bán hàng với danh sách công việc

## Cách sử dụng

### 1. **Đăng nhập**
- Mở app và nhấn vào các tài khoản test có sẵn
- Hoặc nhập email/password thủ công
- Hệ thống sẽ tự động chuyển đến giao diện phù hợp với vai trò

### 2. **Đăng ký tài khoản mới**
- Nhấn "Sign Up" trên màn hình đăng nhập
- Điền thông tin và chọn vai trò (mặc định là Dealer Staff)
- Tài khoản mới sẽ được tạo và tự động đăng nhập

### 3. **Chuyển đổi vai trò**
- Đăng xuất và đăng nhập với tài khoản khác
- Mỗi vai trò sẽ có giao diện và chức năng riêng

## Cấu trúc Code

### **Context & State Management**
```
src/contexts/AuthContext.js - Quản lý trạng thái authentication
```

### **Mock Services**
```
src/services/mock/mockAuthService.js - Mock API cho authentication
```

### **Role Management**
```
src/constants/roles.js - Định nghĩa roles và permissions
```

### **Screens**
```
src/screens/
├── auth/
│   ├── LoginScreen.js - Màn hình đăng nhập
│   └── RegisterScreen.js - Màn hình đăng ký
└── home/
    ├── EVMAdminHomeScreen.js - Dashboard EVM Admin
    ├── EVMStaffHomeScreen.js - Dashboard EVM Staff
    ├── ManagerHomeScreen.js - Dashboard Dealer Manager
    └── EmployeeHomeScreen.js - Dashboard Dealer Staff
```

### **Navigation**
```
src/navigation/AppNavigator.js - Điều hướng dựa trên role
```

## Tính năng chính

### ✅ **Authentication Flow**
- Đăng nhập/đăng ký với validation
- Tự động lưu trữ token và user data
- Auto-logout khi token hết hạn

### ✅ **Role-Based UI**
- Giao diện khác nhau cho từng role
- Màu sắc và layout phù hợp với vai trò
- Chức năng riêng biệt cho mỗi role

### ✅ **Mock Data**
- 4 tài khoản test sẵn có
- Dữ liệu giả lập cho testing
- Không cần backend thật

### ✅ **Navigation**
- Tự động chuyển hướng dựa trên role
- Protected routes
- Loading states

## Mở rộng hệ thống

### **Thêm Role mới**
1. Thêm role vào `USER_ROLES` trong `src/constants/roles.js`
2. Thêm permissions cho role mới
3. Tạo màn hình home cho role mới
4. Cập nhật `AppNavigator.js`

### **Thêm chức năng mới**
1. Tạo component trong `src/components/`
2. Thêm vào màn hình phù hợp
3. Cập nhật permissions nếu cần

### **Tích hợp Backend thật**
1. Thay thế `MockAuthService` bằng `AuthService` thật
2. Cập nhật API endpoints trong `src/constants/api.js`
3. Cấu hình environment variables

## Testing

### **Test Cases**
- Đăng nhập với các role khác nhau
- Đăng ký tài khoản mới
- Đăng xuất và đăng nhập lại
- Chuyển đổi giữa các role
- Validation form đăng nhập/đăng ký

### **Test Accounts**
Sử dụng các tài khoản test có sẵn để kiểm tra từng role:
- **EVM Admin**: evmadmin@evdock.com / evmadmin123
- **EVM Staff**: evmstaff@evdock.com / evmstaff123
- **Dealer Manager**: dealermanager@evdock.com / dealermanager123
- **Dealer Staff**: dealerstaff@evdock.com / dealerstaff123
- **Customer**: customer@evdock.com / customer123

## Lưu ý

- Hệ thống hiện tại sử dụng mock data, không cần backend
- Tất cả dữ liệu được lưu trong AsyncStorage
- Có thể dễ dàng tích hợp với backend thật sau này
- Code được tổ chức theo pattern chuẩn, dễ maintain và mở rộng
