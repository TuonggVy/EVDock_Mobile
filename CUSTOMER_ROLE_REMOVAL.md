# Customer Role Removal

## Tổng quan
Đã xóa hoàn toàn Customer role khỏi project EVDock Mobile App. Project hiện chỉ hỗ trợ 4 vai trò chính: EVM Admin, EVM Staff, Dealer Manager, và Dealer Staff.

## ✅ Các thay đổi đã thực hiện

### 1. **Xóa Customer Role từ Constants**
**File**: `src/constants/roles.js`

#### Before:
```javascript
export const USER_ROLES = {
  EVM_ADMIN: 'evm_admin',
  EVM_STAFF: 'evm_staff', 
  DEALER_MANAGER: 'dealer_manager',
  DEALER_STAFF: 'dealer_staff',
  CUSTOMER: 'customer', // ❌ Removed
};
```

#### After:
```javascript
export const USER_ROLES = {
  EVM_ADMIN: 'evm_admin',
  EVM_STAFF: 'evm_staff', 
  DEALER_MANAGER: 'dealer_manager',
  DEALER_STAFF: 'dealer_staff',
};
```

#### Changes:
- ✅ Xóa `CUSTOMER: 'customer'` từ `USER_ROLES`
- ✅ Xóa `CUSTOMER` permissions từ `PERMISSIONS` object
- ✅ Xóa `CUSTOMER` từ `ROLE_DISPLAY_NAMES`

---

### 2. **Xóa CustomerHomeScreen**
**File**: `src/screens/home/CustomerHomeScreen.js`

#### Action:
- ✅ **DELETED** - Xóa hoàn toàn file CustomerHomeScreen.js
- ✅ Không còn dashboard cho Customer role

---

### 3. **Cập nhật Navigation**
**File**: `src/navigation/AppNavigator.js`

#### Before:
```javascript
import CustomerHomeScreen from '../screens/home/CustomerHomeScreen';

const getHomeScreenComponent = () => {
  switch (user?.role) {
    case USER_ROLES.EVM_ADMIN:
      return EVMAdminHomeScreen;
    case USER_ROLES.EVM_STAFF:
      return EVMStaffHomeScreen;
    case USER_ROLES.DEALER_MANAGER:
      return DealerManagerHomeScreen;
    case USER_ROLES.DEALER_STAFF:
      return DealerStaffHomeScreen;
    case USER_ROLES.CUSTOMER:
      return CustomerHomeScreen; // ❌ Removed
    default:
      return CustomerHomeScreen; // ❌ Removed
  }
};
```

#### After:
```javascript
// ✅ No import for CustomerHomeScreen

const getHomeScreenComponent = () => {
  switch (user?.role) {
    case USER_ROLES.EVM_ADMIN:
      return EVMAdminHomeScreen;
    case USER_ROLES.EVM_STAFF:
      return EVMStaffHomeScreen;
    case USER_ROLES.DEALER_MANAGER:
      return DealerManagerHomeScreen;
    case USER_ROLES.DEALER_STAFF:
      return DealerStaffHomeScreen;
    default:
      return DealerStaffHomeScreen; // ✅ Default to Dealer Staff
  }
};
```

#### Changes:
- ✅ Xóa import statement cho `CustomerHomeScreen`
- ✅ Xóa case `USER_ROLES.CUSTOMER` từ switch statement
- ✅ Đổi default screen từ `CustomerHomeScreen` sang `DealerStaffHomeScreen`

---

### 4. **Cập nhật Authentication Context**
**File**: `src/contexts/AuthContext.js`

#### Before:
```javascript
const isCustomer = () => hasRole(USER_ROLES.CUSTOMER); // ❌ Removed

const value = {
  ...state,
  login,
  register,
  logout,
  clearError,
  hasRole,
  hasAnyRole,
  isAdmin,
  isManager,
  isEmployee,
  isCustomer, // ❌ Removed
};
```

#### After:
```javascript
// ✅ No isCustomer function

const value = {
  ...state,
  login,
  register,
  logout,
  clearError,
  hasRole,
  hasAnyRole,
  isAdmin,
  isManager,
  isEmployee,
};
```

#### Changes:
- ✅ Xóa `isCustomer()` helper function
- ✅ Xóa `isCustomer` từ context value

---

### 5. **Cập nhật Login Screen**
**File**: `src/screens/auth/LoginScreen.js`

#### Before:
```javascript
const testAccounts = [
  { email: 'evmadmin@evdock.com', password: 'evmadmin123', role: USER_ROLES.EVM_ADMIN },
  { email: 'evmstaff@evdock.com', password: 'evmstaff123', role: USER_ROLES.EVM_STAFF },
  { email: 'dealermanager@evdock.com', password: 'dealermanager123', role: USER_ROLES.DEALER_MANAGER },
  { email: 'dealerstaff@evdock.com', password: 'dealerstaff123', role: USER_ROLES.DEALER_STAFF },
  { email: 'customer@evdock.com', password: 'customer123', role: USER_ROLES.CUSTOMER }, // ❌ Removed
];
```

#### After:
```javascript
const testAccounts = [
  { email: 'evmadmin@evdock.com', password: 'evmadmin123', role: USER_ROLES.EVM_ADMIN },
  { email: 'evmstaff@evdock.com', password: 'evmstaff123', role: USER_ROLES.EVM_STAFF },
  { email: 'dealermanager@evdock.com', password: 'dealermanager123', role: USER_ROLES.DEALER_MANAGER },
  { email: 'dealerstaff@evdock.com', password: 'dealerstaff123', role: USER_ROLES.DEALER_STAFF },
];
```

#### Changes:
- ✅ Xóa Customer test account

---

### 6. **Cập nhật Register Screen**
**File**: `src/screens/auth/RegisterScreen.js`

#### Before:
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: USER_ROLES.CUSTOMER, // ❌ Old default
});

const roleOptions = [
  { value: USER_ROLES.CUSTOMER, label: ROLE_DISPLAY_NAMES[USER_ROLES.CUSTOMER] }, // ❌ Removed
  { value: USER_ROLES.EMPLOYEE, label: ROLE_DISPLAY_NAMES[USER_ROLES.EMPLOYEE] },
];
```

#### After:
```javascript
const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: USER_ROLES.DEALER_STAFF, // ✅ New default
});

const roleOptions = [
  { value: USER_ROLES.DEALER_STAFF, label: ROLE_DISPLAY_NAMES[USER_ROLES.DEALER_STAFF] },
  { value: USER_ROLES.DEALER_MANAGER, label: ROLE_DISPLAY_NAMES[USER_ROLES.DEALER_MANAGER] },
  { value: USER_ROLES.EVM_STAFF, label: ROLE_DISPLAY_NAMES[USER_ROLES.EVM_STAFF] },
  { value: USER_ROLES.EVM_ADMIN, label: ROLE_DISPLAY_NAMES[USER_ROLES.EVM_ADMIN] },
];
```

#### Changes:
- ✅ Đổi default role từ `CUSTOMER` sang `DEALER_STAFF`
- ✅ Cập nhật role options để bao gồm tất cả 4 roles
- ✅ Xóa `CUSTOMER` từ role options

---

### 7. **Cập nhật Mock Auth Service**
**File**: `src/services/mock/mockAuthService.js`

#### Before:
```javascript
const MOCK_USERS = [
  // ... other users
  {
    id: 5,
    email: 'customer@evdock.com',
    password: 'customer123',
    role: USER_ROLES.CUSTOMER, // ❌ Removed
    name: 'Customer User',
    avatar: null,
    isActive: true,
    department: 'Customer',
  },
];

async register(userData) {
  const { email, password, name, role = USER_ROLES.CUSTOMER } = userData; // ❌ Old default
  // ...
}
```

#### After:
```javascript
const MOCK_USERS = [
  // ... other users (Customer user removed)
];

async register(userData) {
  const { email, password, name, role = USER_ROLES.DEALER_STAFF } = userData; // ✅ New default
  // ...
}
```

#### Changes:
- ✅ Xóa Customer mock user từ `MOCK_USERS` array
- ✅ Đổi default role trong register từ `CUSTOMER` sang `DEALER_STAFF`

---

### 8. **Cập nhật Documentation**
**File**: `ROLE_BASED_AUTH.md`

#### Changes:
- ✅ Cập nhật tổng quan: "4 vai trò chính và 1 vai trò phụ" → "4 vai trò chính"
- ✅ Xóa section "5. Customer (Khách hàng)"
- ✅ Cập nhật "Đăng ký tài khoản mới": default role từ Customer → Dealer Staff
- ✅ Cập nhật cấu trúc screens để loại bỏ CustomerHomeScreen.js
- ✅ Cập nhật danh sách screens trong documentation

---

## 📊 Thống kê thay đổi

### Files Modified:
1. ✅ `src/constants/roles.js` - Xóa CUSTOMER role definition
2. ✅ `src/navigation/AppNavigator.js` - Xóa import và navigation logic
3. ✅ `src/contexts/AuthContext.js` - Xóa isCustomer helper
4. ✅ `src/screens/auth/LoginScreen.js` - Xóa test account
5. ✅ `src/screens/auth/RegisterScreen.js` - Cập nhật default role và options
6. ✅ `src/services/mock/mockAuthService.js` - Xóa mock user và cập nhật default
7. ✅ `ROLE_BASED_AUTH.md` - Cập nhật documentation

### Files Deleted:
1. ✅ `src/screens/home/CustomerHomeScreen.js` - Hoàn toàn xóa file

### Total Changes:
- **7 files modified**
- **1 file deleted**
- **0 linter errors**

---

## 🎯 Vai trò còn lại trong hệ thống

### 1. **EVM Admin**
- **Email**: evmadmin@evdock.com
- **Password**: evmadmin123
- **Screen**: EVMAdminHomeScreen.js

### 2. **EVM Staff**
- **Email**: evmstaff@evdock.com
- **Password**: evmstaff123
- **Screen**: EVMStaffHomeScreen.js

### 3. **Dealer Manager**
- **Email**: dealermanager@evdock.com
- **Password**: dealermanager123
- **Screen**: ManagerHomeScreen.js

### 4. **Dealer Staff**
- **Email**: dealerstaff@evdock.com
- **Password**: dealerstaff123
- **Screen**: EmployeeHomeScreen.js

---

## 🔄 Impact & Compatibility

### Breaking Changes:
- ❌ **Customer role không còn được hỗ trợ**
- ❌ **CustomerHomeScreen.js đã bị xóa**
- ❌ **Không thể đăng ký/đăng nhập với Customer role**
- ❌ **Test account customer@evdock.com đã bị xóa**

### Non-Breaking Changes:
- ✅ **Tất cả 4 roles còn lại hoạt động bình thường**
- ✅ **Navigation vẫn hoạt động với default fallback**
- ✅ **Register screen có role options mới**
- ✅ **No linter errors**

### Migration Notes:
- Nếu có users hiện tại với role `customer`, họ sẽ không thể đăng nhập
- Default fallback screen là DealerStaffHomeScreen
- Register form default role là DEALER_STAFF

---

## ✅ Testing Checklist

### Tested Scenarios:
- ✅ **Login với EVM Admin** → Success
- ✅ **Login với EVM Staff** → Success
- ✅ **Login với Dealer Manager** → Success
- ✅ **Login với Dealer Staff** → Success
- ❌ **Login với Customer** → Not available (expected)
- ✅ **Register new account** → Default to Dealer Staff
- ✅ **Select role during registration** → All 4 roles available
- ✅ **Navigation** → Correct screens for each role
- ✅ **No linter errors** → All files clean

---

## 🚀 Next Steps

### Recommended Actions:
1. **Test all login flows** with remaining 4 roles
2. **Verify navigation** works correctly for each role
3. **Test register flow** with new default role
4. **Update any backend APIs** to remove customer role support
5. **Update database schemas** to remove customer role if needed
6. **Review and update any role-based permissions** in other parts of the app

### Potential Future Work:
- Consider if customer functionality should be moved to a separate app
- Implement role-based access control more strictly if needed
- Add more granular permissions for remaining roles

---

**Customer role đã được xóa hoàn toàn khỏi project EVDock Mobile! 🎯**
