# Promotion Flow Architecture

## Tổng quan

Hệ thống đã được tách biệt thành hai luồng promotions riêng biệt để phù hợp với mô hình kinh doanh:

### 1. B2B Promotions (EVM Admin → Dealers)
**Mục đích**: Hãng xe tung khuyến mãi cho đại lý nhập xe
**Người tạo**: EVM Admin
**Người sử dụng**: Dealer Manager (để nhập xe từ hãng)

### 2. B2C Promotions (Dealer Manager → Customers)
**Mục đích**: Đại lý tung khuyến mãi cho khách hàng cuối
**Người tạo**: Dealer Manager
**Người sử dụng**: Dealer Staff (áp dụng cho khách hàng)

## Cấu trúc Files

### Screens
```
src/screens/promotion/
├── PromotionManagementScreen.js          # B2B Promotions (EVM Admin)
├── AddPromotionScreen.js                 # Add B2B Promotion
├── EditPromotionScreen.js                # Edit B2B Promotion
├── PromotionDetailScreen.js              # B2B Promotion Detail
├── DealerPromotionManagementScreen.js    # B2C Promotions (Dealer Manager)
├── AddDealerPromotionScreen.js           # Add B2C Promotion
├── EditDealerPromotionScreen.js          # Edit B2C Promotion
└── DealerPromotionDetailScreen.js        # B2C Promotion Detail
```

### Services
```
src/services/
├── evmPromotionService.js                # B2B Promotion Service
├── dealerPromotionService.js             # B2C Promotion Service
└── promotionService.js                   # Legacy service (có thể deprecated)
```

### Navigation Routes
```
B2B Promotions:
- B2BPromotionManagement
- AddB2BPromotion
- EditB2BPromotion
- B2BPromotionDetail

B2C Promotions:
- B2CPromotionManagement
- AddB2CPromotion
- EditB2CPromotion
- B2CPromotionDetail
```

## Data Models

### B2B Promotion Model
```javascript
{
  id: string,
  code: string,                    // B2B_SUMMER2024
  name: string,
  description: string,
  type: 'percentage' | 'fixed',
  value: number,
  minOrderValue: number,           // Minimum order amount
  maxDiscount: number,
  startDate: string,
  endDate: string,
  status: 'active' | 'scheduled' | 'expired',
  usageLimit: number,
  usedCount: number,
  applicableDealers: string[],     // Target dealers
  targetAudience: 'dealers',       // B2B specific
  promotionType: string,           // wholesale_discount, bulk_purchase, etc.
  minQuantity: number,             // Minimum vehicle quantity
  vehicleModels: string[],         // Applicable vehicle models
  createdAt: string,
  createdBy: 'EVM Admin'
}
```

### B2C Promotion Model
```javascript
{
  id: string,
  code: string,                    // B2C_VIP_WEEKEND
  name: string,
  description: string,
  type: 'percentage' | 'fixed',
  value: number,
  minOrderValue: number,           // Minimum order amount
  maxDiscount: number,
  startDate: string,
  endDate: string,
  status: 'active' | 'scheduled' | 'expired',
  usageLimit: number,
  usedCount: number,
  targetCustomers: string,         // Target customer description
  targetAudience: 'customers',     // B2C specific
  promotionType: string,           // vip_discount, seasonal_promotion, etc.
  customerSegments: string[],      // VIP, Premium, All, etc.
  vehicleModels: string[],         // Applicable vehicle models
  createdAt: string,
  createdBy: 'Dealer Manager'
}
```

## API Endpoints (Backend Integration)

### B2B Promotions API
```
GET    /api/promotions/b2b                    # Get all B2B promotions
GET    /api/promotions/b2b/active             # Get active B2B promotions
GET    /api/promotions/b2b/:id                # Get B2B promotion by ID
POST   /api/promotions/b2b                    # Create B2B promotion
PUT    /api/promotions/b2b/:id                # Update B2B promotion
DELETE /api/promotions/b2b/:id                # Delete B2B promotion
POST   /api/promotions/b2b/validate           # Validate B2B promotion code
POST   /api/promotions/b2b/:id/use            # Use B2B promotion
```

### B2C Promotions API
```
GET    /api/promotions/b2c                    # Get all B2C promotions
GET    /api/promotions/b2c/active             # Get active B2C promotions
GET    /api/promotions/b2c/:id                # Get B2C promotion by ID
POST   /api/promotions/b2c                    # Create B2C promotion
PUT    /api/promotions/b2c/:id                # Update B2C promotion
DELETE /api/promotions/b2c/:id                # Delete B2C promotion
POST   /api/promotions/b2c/validate           # Validate B2C promotion code
POST   /api/promotions/b2c/:id/use            # Use B2C promotion
```

## User Roles & Permissions

### EVM Admin
- **Có thể**: Tạo, sửa, xóa B2B promotions
- **Mục đích**: Khuyến khích dealer nhập xe
- **Không liên quan**: B2C promotions (không ảnh hưởng đến khách hàng cuối)

### Dealer Manager
- **Có thể**: Tạo, sửa, xóa B2C promotions
- **Mục đích**: Khuyến khích khách hàng mua xe
- **Có thể xem**: B2B promotions để sử dụng khi nhập xe

### Dealer Staff
- **Có thể**: Xem và sử dụng B2C promotions cho khách hàng
- **Mục đích**: Áp dụng khuyến mãi cho khách hàng

### Customer
- **Có thể**: Xem B2C promotions (thông qua dealer staff)
- **Không liên quan**: B2B promotions

## Luồng hoạt động

### B2B Flow (EVM Admin → Dealer)
1. EVM Admin tạo B2B promotion (giảm giá cho dealer nhập xe)
2. Dealer Manager xem B2B promotions
3. Dealer Manager sử dụng B2B promotion khi đặt hàng nhập xe
4. Hệ thống validate và apply discount

### B2C Flow (Dealer Manager → Customer)
1. Dealer Manager tạo B2C promotion (giảm giá cho khách hàng)
2. Dealer Staff xem B2C promotions
3. Dealer Staff áp dụng B2C promotion khi tạo quotation cho khách hàng
4. Hệ thống validate và apply discount

## Benefits của cấu trúc mới

1. **Tách biệt rõ ràng**: B2B và B2C promotions hoàn toàn độc lập
2. **Dễ tích hợp Backend**: API endpoints riêng biệt cho từng loại
3. **Phù hợp business model**: Phản ánh đúng luồng kinh doanh thực tế
4. **Bảo mật tốt hơn**: EVM Admin không can thiệp vào B2C promotions
5. **Dễ maintain**: Code được tổ chức rõ ràng theo chức năng

## Migration Notes

- Các screen và service cũ vẫn hoạt động với mock data
- Khi tích hợp backend, chỉ cần uncomment các import và thay thế mock calls
- Navigation routes đã được cập nhật để tránh conflict
- Data models đã được mở rộng với các field mới cho B2B/B2C specific
