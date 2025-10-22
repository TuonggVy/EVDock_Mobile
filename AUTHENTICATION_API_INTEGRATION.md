# Authentication API Integration

## Tổng quan

Project đã được tích hợp đầy đủ với Authentication API theo documentation được cung cấp. Hệ thống hỗ trợ:

- **Login** (`POST /auth/signin`) - Đăng nhập với email và password
- **Token Refresh** (`GET /auth/token`) - Lấy access token mới khi token hết hạn  
- **Logout** (`POST /auth/logout`) - Đăng xuất tài khoản

## Cấu trúc Files

### 1. API Services
- `src/services/api/authApi.js` - Các function gọi API authentication
- `src/services/api/axiosInstance.js` - Cấu hình axios với interceptors
- `src/services/api/authApi.test.js` - File test cho API integration

### 2. Context & State Management  
- `src/contexts/AuthContext.js` - Context quản lý authentication state

### 3. Configuration
- `src/constants/api.js` - Cấu hình API endpoints

## Tính năng chính

### 🔐 Authentication Flow
1. **Login**: Gửi email/password → Nhận accessToken + refreshToken
2. **Auto Token Refresh**: Tự động refresh token khi hết hạn
3. **Logout**: Gọi API logout → Xóa tokens khỏi storage

### 🎯 Role Management
Hệ thống hỗ trợ 4 roles chính:
- `Admin` → `EVM_ADMIN`
- `Staff` → `EVM_STAFF` 
- `DealerManager` → `DEALER_MANAGER`
- `DealerStaff` → `DEALER_STAFF`

### 🔄 Token Management
- **Access Token**: Lưu trong AsyncStorage, tự động thêm vào headers
- **Refresh Token**: Lưu riêng biệt, dùng để refresh access token
- **Auto Refresh**: Interceptor tự động refresh khi nhận 401 error

## Cách sử dụng

### 1. Sử dụng AuthContext trong Component

```javascript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { 
    user, 
    token, 
    isLoading, 
    error, 
    login, 
    logout, 
    refreshAccessToken,
    clearError 
  } = useAuth();

  const handleLogin = async () => {
    const result = await login('email@example.com', 'password');
    if (result.success) {
      console.log('Login successful!');
    }
  };

  return (
    // Your component JSX
  );
};
```

### 2. Test API Integration

```javascript
import { testLoginIntegration, testCompleteAuthFlow } from './authApi.test';

// Test login với tất cả roles
await testLoginIntegration();

// Test complete flow (login → refresh → logout)
await testCompleteAuthFlow();
```

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signin` | Login account | ❌ |
| GET | `/auth/token` | Get new access token | 🔄 Refresh Token |
| POST | `/auth/logout` | Logout account | ✅ Access Token |

## Error Handling

Hệ thống có xử lý lỗi toàn diện:
- **Network errors**: Timeout, connection issues
- **Authentication errors**: Invalid credentials, expired tokens
- **Authorization errors**: Insufficient permissions
- **Server errors**: 5xx responses

## Security Features

- ✅ Secure token storage (AsyncStorage)
- ✅ Automatic token refresh
- ✅ Request/Response interceptors
- ✅ Error boundary handling
- ✅ Role-based access control

## Test Accounts

Để test, sử dụng các tài khoản sau:

| Role | Email | Password |
|------|-------|----------|
| EVM Admin | evmadmin@evdock.com | evmadmin123 |
| EVM Staff | evmstaff@evdock.com | evmstaff123 |
| Dealer Manager | dealermanager@evdock.com | dealermanager123 |
| Dealer Staff | dealerstaff@evdock.com | dealerstaff123 |

## Troubleshooting

### Common Issues

1. **Token refresh fails**: Kiểm tra refresh token có hợp lệ không
2. **Login fails**: Kiểm tra email/password và network connection
3. **Role mapping issues**: Kiểm tra API response format

### Debug Mode

Để debug, thêm console.log vào các function trong AuthContext:

```javascript
console.log('Login response:', res);
console.log('Token refresh response:', response);
```

## Next Steps

- [ ] Implement biometric authentication
- [ ] Add remember me functionality  
- [ ] Implement session timeout
- [ ] Add multi-device login management
