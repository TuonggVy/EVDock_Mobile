# Promotion Management System

Hệ thống quản lý khuyến mãi được chia thành 2 luồng chính dựa trên vai trò người dùng:

## 🔄 **Hai Luồng Promotions**

### 1. **EVM Admin Promotions** (Hãng → Đại lý)
- **Người tạo**: EVM Admin (Hãng)
- **Mục đích**: Hãng tạo và phân phối mã khuyến mãi cho các đại lý
- **Phạm vi**: Có thể áp dụng cho nhiều đại lý
- **Quyền hạn**: Quyết định đại lý nào được áp dụng promotion

### 2. **Dealer Manager Promotions** (Đại lý → Khách hàng)
- **Người tạo**: Dealer Manager (Đại lý)
- **Mục đích**: Đại lý tự tạo mã khuyến mãi cho khách hàng của mình
- **Phạm vi**: Chỉ áp dụng cho khách hàng của đại lý đó
- **Quyền hạn**: Quản lý promotions nội bộ của đại lý

## 📁 **Cấu trúc File**

```
src/screens/promotion/
├── EVM Admin Promotions (Hãng → Đại lý)
│   ├── PromotionManagementScreen.js      # Danh sách promotions của hãng
│   ├── AddPromotionScreen.js            # Tạo promotion mới (hãng)
│   ├── EditPromotionScreen.js           # Chỉnh sửa promotion (hãng)
│   └── PromotionDetailScreen.js         # Chi tiết promotion (hãng)
│
├── Dealer Manager Promotions (Đại lý → Khách hàng)
│   ├── DealerPromotionManagementScreen.js    # Danh sách promotions của đại lý
│   ├── AddDealerPromotionScreen.js          # Tạo promotion mới (đại lý)
│   ├── EditDealerPromotionScreen.js         # Chỉnh sửa promotion (đại lý)
│   └── DealerPromotionDetailScreen.js       # Chi tiết promotion (đại lý)
│
└── README.md                           # Tài liệu này
```

## 🔧 **Services**

```
src/services/
├── promotionService.js                 # API cho EVM Admin promotions
└── dealerPromotionService.js          # API cho Dealer Manager promotions
```

## 🎯 **Tính năng theo vai trò**

### **EVM Admin Promotions**
- ✅ Tạo promotion mới
- ✅ Chỉnh sửa promotion
- ✅ Xóa promotion
- ✅ Xem chi tiết promotion
- ✅ **Phân phối cho đại lý** (chọn đại lý áp dụng)
- ✅ Quản lý tất cả promotions của hãng
- ✅ Theo dõi usage across dealers

### **Dealer Manager Promotions**
- ✅ Tạo promotion mới cho đại lý
- ✅ Chỉnh sửa promotion của đại lý
- ✅ Xóa promotion của đại lý
- ✅ Xem chi tiết promotion của đại lý
- ✅ **Chọn target customers** (VIP, New, All, etc.)
- ✅ Quản lý promotions nội bộ
- ✅ Theo dõi usage trong đại lý

## 📊 **Data Structure**

### **EVM Admin Promotion Object**
```javascript
{
  id: 'string',
  code: 'string',
  name: 'string',
  description: 'string',
  type: 'percentage' | 'fixed',
  value: 'number',
  minOrderValue: 'number',
  maxDiscount: 'number',
  startDate: 'string',
  endDate: 'string',
  status: 'active' | 'scheduled' | 'expired' | 'paused',
  usageLimit: 'number',
  usedCount: 'number',
  applicableDealers: ['dealerId1', 'dealerId2'], // Quan trọng!
  createdAt: 'string',
  createdBy: 'EVM Admin'
}
```

### **Dealer Manager Promotion Object**
```javascript
{
  id: 'string',
  code: 'string',
  name: 'string',
  description: 'string',
  type: 'percentage' | 'fixed',
  value: 'number',
  minOrderValue: 'number',
  maxDiscount: 'number',
  startDate: 'string',
  endDate: 'string',
  status: 'active' | 'scheduled' | 'expired' | 'paused',
  usageLimit: 'number',
  usedCount: 'number',
  targetCustomers: 'All Customers' | 'VIP Customers' | 'New Customers', // Quan trọng!
  dealerId: 'string', // ID của đại lý tạo promotion
  createdAt: 'string',
  createdBy: 'Dealer Manager'
}
```

## 🌐 **API Endpoints**

### **EVM Admin Promotions**
- `GET /api/admin/promotions` - Lấy tất cả promotions của hãng
- `POST /api/admin/promotions` - Tạo promotion mới
- `PUT /api/admin/promotions/:id` - Cập nhật promotion
- `DELETE /api/admin/promotions/:id` - Xóa promotion
- `GET /api/admin/promotions/:id/dealers` - Lấy danh sách đại lý áp dụng
- `POST /api/admin/promotions/:id/assign-dealers` - Phân phối cho đại lý

### **Dealer Manager Promotions**
- `GET /api/dealer/promotions` - Lấy promotions của đại lý
- `POST /api/dealer/promotions` - Tạo promotion mới cho đại lý
- `PUT /api/dealer/promotions/:id` - Cập nhật promotion của đại lý
- `DELETE /api/dealer/promotions/:id` - Xóa promotion của đại lý
- `GET /api/dealer/promotions/:id/usage` - Thống kê usage trong đại lý

## 🔐 **Permissions & Access Control**

### **EVM Admin**
- ✅ Full access to all EVM Admin promotions
- ✅ Can assign promotions to any dealer
- ✅ Can view usage statistics across all dealers
- ❌ Cannot access dealer-specific promotions

### **Dealer Manager**
- ✅ Full access to own dealer promotions
- ✅ Can create promotions for own customers
- ✅ Can view usage statistics for own promotions
- ❌ Cannot access EVM Admin promotions
- ❌ Cannot create promotions for other dealers

### **Dealer Staff**
- ✅ Can view active promotions assigned to their dealer
- ✅ Can use promotions for customer orders
- ❌ Cannot create or modify promotions

## 🎨 **UI/UX Differences**

### **EVM Admin Interface**
- Focus on **dealer assignment** and **distribution**
- Show **cross-dealer statistics**
- Emphasize **brand-wide campaigns**
- Color scheme: Blue/Purple gradients

### **Dealer Manager Interface**
- Focus on **target customers** and **local campaigns**
- Show **dealer-specific statistics**
- Emphasize **customer engagement**
- Color scheme: Green/Orange gradients

## 🚀 **Future Enhancements**

1. **Promotion Templates**: Pre-defined templates for common campaigns
2. **A/B Testing**: Test different promotion strategies
3. **Analytics Dashboard**: Advanced reporting and insights
4. **Auto-expiry**: Automatic promotion management
5. **Integration**: Connect with CRM and marketing tools
6. **Mobile Notifications**: Real-time promotion updates
7. **QR Code Generation**: Easy promotion sharing

## 📱 **Navigation Flow**

### **EVM Admin Flow**
```
EVMAdminHomeScreen
└── Promotions Card
    └── PromotionManagementScreen
        ├── + Button → AddPromotionScreen
        ├── Card Tap → PromotionDetailScreen
        └── Edit Button → EditPromotionScreen
```

### **Dealer Manager Flow**
```
DealerManagerHomeScreen
└── Promotions Card
    └── DealerPromotionManagementScreen
        ├── + Button → AddDealerPromotionScreen
        ├── Card Tap → DealerPromotionDetailScreen
        └── Edit Button → EditDealerPromotionScreen
```

## 🔄 **Integration Points**

1. **Order System**: Apply promotions during checkout
2. **Customer Management**: Track promotion usage per customer
3. **Inventory System**: Ensure stock availability for promotions
4. **Reporting System**: Generate promotion performance reports
5. **Notification System**: Alert users about new/expiring promotions

## 📋 **Testing Checklist**

### **EVM Admin Promotions**
- [ ] Create promotion with dealer assignment
- [ ] Edit promotion and update dealer list
- [ ] View cross-dealer usage statistics
- [ ] Delete promotion and verify cleanup

### **Dealer Manager Promotions**
- [ ] Create promotion with target customers
- [ ] Edit promotion and update target group
- [ ] View dealer-specific usage statistics
- [ ] Delete promotion and verify cleanup

### **Integration Tests**
- [ ] Promotion application in order flow
- [ ] Usage tracking and limits
- [ ] Permission-based access control
- [ ] Data consistency across systems
