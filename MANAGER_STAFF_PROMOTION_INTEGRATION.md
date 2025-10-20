# Manager-Staff Promotion Integration

## Tổng quan
Đã tích hợp thành công giữa Dealer Manager và Dealer Staff để Staff có thể thấy và sử dụng promotions do Manager tạo. System được thiết kế để dễ dàng chuyển sang backend integration.

## Workflow Integration

### 1. Manager Creates Promotion
```
Dealer Manager → Create Promotion → Save to Storage → Success
```

### 2. Staff Sees Promotion
```
Dealer Staff → View Promotions → Load from Storage → See Manager's Promotions
```

### 3. Real-time Updates
```
Manager creates → Staff screen auto-refreshes → New promotion appears
```

## Role-Based Access Control

### Dealer Manager (Full Access)
- ✅ **Create** new promotions
- ✅ **View** all promotions (active, scheduled, expired, paused)
- ✅ **Edit** existing promotions
- ✅ **Delete** promotions
- ✅ **Manage** promotion lifecycle

### Dealer Staff (Limited Access)
- ✅ **View** only active promotions created by Manager
- ✅ **Use** promotions for customers
- ❌ **Cannot create** new promotions
- ❌ **Cannot edit** existing promotions
- ❌ **Cannot delete** promotions
- ❌ **Cannot see** scheduled/expired/paused promotions

## Technical Implementation

### 1. PromotionStorageService Enhancements

#### New Methods:
```javascript
// Get promotions for Staff (filtered for active + customers)
async getPromotionsForStaff() {
  const allPromotions = await this.getPromotions();
  return allPromotions.filter(promotion => 
    promotion.status === 'active' && 
    promotion.targetAudience === 'customers'
  );
}

// Get promotions for Manager (all promotions)
async getPromotionsForManager() {
  return await this.getPromotions();
}

// Get stats for Staff (only active promotions)
async getPromotionStatsForStaff() {
  const staffPromotions = await this.getPromotionsForStaff();
  return {
    total: staffPromotions.length,
    active: staffPromotions.length, // Staff only sees active
    scheduled: 0,
    expired: 0,
    paused: 0,
  };
}
```

### 2. DealerPromotionManagementScreen (Manager)

#### Updated Data Loading:
```javascript
const loadPromotions = async () => {
  // Load all promotions for Manager
  const storedPromotions = await promotionStorageService.getPromotionsForManager();
  
  if (storedPromotions.length === 0) {
    await promotionStorageService.initializeWithMockData();
    const initializedPromotions = await promotionStorageService.getPromotionsForManager();
    setPromotions(initializedPromotions);
  } else {
    setPromotions(storedPromotions);
  }
};
```

#### Features:
- **Full CRUD**: Create, read, update, delete promotions
- **All Statuses**: See active, scheduled, expired, paused promotions
- **Complete Data**: Full promotion details and management
- **Auto Refresh**: Refresh when returning from add screen

### 3. PromotionManagementScreen (Staff)

#### Updated Data Loading via useDealerPromotions Hook:
```javascript
const loadPromotions = useCallback(async () => {
  // Load only active promotions for Staff
  const data = await promotionStorageService.getPromotionsForStaff();
  setPromotions(data);
  setFilteredPromotions(data);
}, []);

const loadStats = useCallback(async () => {
  // Load stats for Staff (only active promotions)
  const data = await promotionStorageService.getPromotionStatsForStaff();
  setStats(data);
}, []);
```

#### Features:
- **Read-only**: Can only view promotions
- **Active Only**: Only see active promotions
- **Customer Focus**: Only promotions for customers
- **Auto Refresh**: Refresh when screen comes into focus
- **Search & Filter**: Within available promotions

### 4. useDealerPromotions Hook Updates

#### Enhanced Functions:
```javascript
// Load promotions for Staff
const loadPromotions = async () => {
  const data = await promotionStorageService.getPromotionsForStaff();
  setPromotions(data);
};

// Search within Staff-available promotions
const searchPromotions = async (keyword) => {
  const data = await promotionStorageService.searchPromotions(keyword);
  const staffPromotions = data.filter(promotion => 
    promotion.status === 'active' && 
    promotion.targetAudience === 'customers'
  );
  setFilteredPromotions(staffPromotions);
};

// Get promotion by ID (with access control)
const getPromotionById = async (promotionId) => {
  const promotion = await promotionStorageService.getPromotionById(promotionId);
  
  // Only return if Staff can access it
  if (promotion && promotion.status === 'active' && promotion.targetAudience === 'customers') {
    return promotion;
  }
  
  return null;
};
```

## Data Flow

### 1. Manager Creates Promotion
```javascript
// AddDealerPromotionScreen.js
const promotionData = {
  code: formData.code,
  name: formData.name,
  // ... all form fields
  targetAudience: 'customers', // Key field for Staff access
  status: 'active', // Key field for Staff visibility
  createdBy: 'Dealer Manager',
};

// Save to shared storage
const newPromotion = await promotionStorageService.addPromotion(promotionData);
```

### 2. Staff Views Promotions
```javascript
// useDealerPromotions.js
const loadPromotions = async () => {
  // Only get active promotions for customers
  const data = await promotionStorageService.getPromotionsForStaff();
  setPromotions(data);
};
```

### 3. Auto Refresh Integration
```javascript
// PromotionManagementScreen.js
useFocusEffect(
  React.useCallback(() => {
    refresh(); // Refresh when screen comes into focus
  }, [refresh])
);
```

## Filtering Logic

### Staff Promotion Filter:
```javascript
promotion.status === 'active' && 
promotion.targetAudience === 'customers'
```

### Manager Promotion Filter:
```javascript
// No filtering - see all promotions
allPromotions
```

## Data Structure Consistency

### Promotion Object (Manager & Staff):
```javascript
{
  id: "PROMO_1704067200000_abc123def",
  code: "B2C_VIP_WEEKEND",
  name: "VIP Weekend Special",
  description: "Giảm giá đặc biệt cuối tuần cho khách hàng VIP",
  type: "percentage",
  value: 10,
  minOrderValue: 2000000000,
  maxDiscount: 50000000,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  status: "active", // Key field for Staff filtering
  usageLimit: 100,
  usedCount: 23,
  targetCustomers: "VIP Customers",
  targetAudience: "customers", // Key field for Staff filtering
  promotionType: "custom_promotion",
  customerSegments: ["VIP", "Premium"],
  vehicleModels: ["All Models"],
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  createdBy: "Dealer Manager" // Key field for tracking
}
```

## User Experience

### Manager Experience:
1. **Create Promotion** → Fill form → Submit
2. **Success Message** → Navigate back
3. **See in List** → New promotion appears in management screen
4. **Full Control** → Can edit, delete, manage all promotions

### Staff Experience:
1. **View Promotions** → Only see active promotions from Manager
2. **Auto Refresh** → New promotions appear when Manager creates them
3. **Use for Customers** → Can apply promotions to customer orders
4. **Read-only Access** → Cannot modify promotions

## Testing Scenarios

### 1. Manager Creates → Staff Sees
1. **Manager**: Go to Promotion Management → Add Promotion
2. **Manager**: Create new promotion → Submit → Success
3. **Staff**: Go to Promotions screen → Should see new promotion
4. **Result**: ✅ Staff sees Manager's promotion immediately

### 2. Role-based Access
1. **Manager**: Create promotion with status 'scheduled'
2. **Staff**: View promotions → Should NOT see scheduled promotion
3. **Manager**: Change status to 'active'
4. **Staff**: Refresh screen → Should now see the promotion
5. **Result**: ✅ Staff only sees active promotions

### 3. Auto Refresh
1. **Staff**: Open Promotions screen
2. **Manager**: Create new promotion (in another session/screen)
3. **Staff**: Navigate away and back to Promotions screen
4. **Result**: ✅ New promotion appears automatically

### 4. Search & Filter
1. **Manager**: Create multiple promotions with different names
2. **Staff**: Search for specific promotion name
3. **Staff**: Filter by status (should only show active)
4. **Result**: ✅ Search and filter work within Staff's accessible promotions

## Backend Integration Ready

### Current Implementation (Development):
```javascript
// Manager side
const storedPromotions = await promotionStorageService.getPromotionsForManager();
const newPromotion = await promotionStorageService.addPromotion(promotionData);

// Staff side
const staffPromotions = await promotionStorageService.getPromotionsForStaff();
const staffStats = await promotionStorageService.getPromotionStatsForStaff();
```

### Future Backend Integration:
```javascript
// Manager side
// TODO: Replace with actual API calls
// const response = await dealerPromotionService.getB2CPromotions();
// const response = await dealerPromotionService.createPromotion(promotionData);

// Staff side
// TODO: Replace with actual API calls
// const response = await dealerPromotionService.getActivePromotionsForStaff();
// const response = await dealerPromotionService.getPromotionStatsForStaff();
```

### Migration Strategy:
1. **Keep Storage Service**: Use as fallback when API fails
2. **Add API Service**: Create API endpoints for Manager/Staff
3. **Update Components**: Replace storage calls with API calls
4. **Role-based API**: Different endpoints for Manager vs Staff
5. **Error Handling**: Fall back to storage if API fails

## API Endpoints (Future)

### Manager Endpoints:
```javascript
GET /api/promotions/manager          // Get all promotions for Manager
POST /api/promotions                 // Create new promotion
PUT /api/promotions/:id              // Update promotion
DELETE /api/promotions/:id           // Delete promotion
GET /api/promotions/manager/stats    // Get promotion stats for Manager
```

### Staff Endpoints:
```javascript
GET /api/promotions/staff            // Get active promotions for Staff
GET /api/promotions/staff/stats      // Get promotion stats for Staff
GET /api/promotions/:id/staff        // Get promotion details (if accessible)
```

## Security Considerations

### Role-based Access:
- **Manager**: Full CRUD access to all promotions
- **Staff**: Read-only access to active customer promotions
- **API Security**: Different endpoints for different roles
- **Data Filtering**: Server-side filtering based on user role

### Data Validation:
- **Manager**: Can set any status, any target audience
- **Staff**: Can only see promotions with specific criteria
- **Access Control**: Verify user role before data access

## Performance Optimizations

### 1. Caching:
- **Manager**: Cache all promotions
- **Staff**: Cache only active promotions
- **Refresh Strategy**: Smart refresh based on role

### 2. Data Loading:
- **Lazy Loading**: Load data only when needed
- **Background Sync**: Sync in background when app is active
- **Incremental Updates**: Only load changed data

### 3. UI Optimizations:
- **Virtual Lists**: For large promotion lists
- **Search Debouncing**: Optimize search performance
- **Filter Caching**: Cache filter results

## Monitoring & Analytics

### Manager Analytics:
- **Promotion Performance**: Track usage, effectiveness
- **Creation Trends**: Monitor promotion creation patterns
- **Staff Usage**: See which promotions Staff use most

### Staff Analytics:
- **Available Promotions**: Track active promotions count
- **Usage Patterns**: Monitor which promotions are used
- **Customer Impact**: Track customer satisfaction

## Future Enhancements

### 1. Advanced Features:
- **Promotion Templates**: Pre-defined promotion templates
- **Bulk Operations**: Create multiple promotions at once
- **Approval Workflow**: Manager approval for Staff-created promotions
- **Expiration Alerts**: Notify when promotions are expiring

### 2. Integration Features:
- **Customer Database**: Link promotions to customer segments
- **Order Integration**: Apply promotions to orders
- **Analytics Dashboard**: Detailed promotion analytics
- **A/B Testing**: Test different promotion strategies

### 3. Mobile Features:
- **Offline Support**: Work offline with cached promotions
- **Push Notifications**: Notify Staff of new promotions
- **QR Code Generation**: Generate QR codes for promotions
- **Barcode Scanning**: Scan customer codes for promotion eligibility

**Manager-Staff Promotion Integration hoàn thành! Bây giờ Dealer Manager có thể tạo promotions và Dealer Staff sẽ thấy chúng ngay lập tức với role-based access control! 🎯**
