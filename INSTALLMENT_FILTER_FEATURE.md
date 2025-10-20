# Installment Filter Feature - Sales Screen

## Tổng quan
Đã thêm filter "Trả góp" vào màn hình Sales (QuotationManagementScreen) của Dealer Staff để dễ dàng lọc và quản lý các báo giá có hình thức thanh toán trả góp.

## ✅ Tính năng mới

### 1. **Filter "Trả góp"**
- **Tên**: Trả góp
- **Key**: `installment`
- **Chức năng**: Lọc tất cả báo giá có `paymentType === 'installment'`
- **Vị trí**: Nằm trong danh sách filter tabs cùng với "Tất cả", "Chờ thanh toán", "Đã thanh toán"

### 2. **Payment Type Field**
- **Field mới**: `paymentType` trong quotation object
- **Giá trị**:
  - `'installment'`: Trả góp
  - `'full'`: Trả full/một lần
- **Mục đích**: Phân biệt hình thức thanh toán của khách hàng

## 🔧 Technical Implementation

### 1. **QuotationManagementScreen.js Updates**

#### **Filter Options:**
```javascript
const filterOptions = [
  { key: 'all', label: 'Tất cả', count: allQuotations.length },
  { key: 'pending', label: 'Chờ thanh toán', count: allQuotations.filter(q => q.status === 'pending').length },
  { key: 'paid', label: 'Đã thanh toán', count: allQuotations.filter(q => q.status === 'paid').length },
  { key: 'installment', label: 'Trả góp', count: allQuotations.filter(q => q.paymentType === 'installment').length }, // ✅ NEW
];
```

#### **Filter Logic:**
```javascript
const filterQuotations = () => {
  let filtered = allQuotations;
  
  // Apply search filter
  if (searchQuery.trim()) {
    // ... search logic
  }
  
  // Apply status filter
  if (selectedFilter !== 'all') {
    if (selectedFilter === 'installment') {
      // ✅ NEW: Filter for installment payment type
      filtered = filtered.filter(quotation => quotation.paymentType === 'installment');
    } else {
      // Filter by status (pending, paid, etc.)
      filtered = filtered.filter(quotation => quotation.status === selectedFilter);
    }
  }
  
  setQuotations(filtered);
  setFilteredQuotations(filtered);
};
```

### 2. **quotationService.js Mock Data Updates**

#### **Q001 - Pending + Installment:**
```javascript
{
  id: 'Q001',
  customerName: 'Nguyễn Văn A',
  customerPhone: '0901234567',
  vehicleModel: 'Tesla Model Y',
  totalAmount: 1250000000,
  status: 'pending',
  paymentType: 'installment', // ✅ NEW: Trả góp
  notes: 'Khách hàng quan tâm đến gói bảo hiểm cao cấp',
  // ... other fields
}
```

#### **Q002 - Paid + Full Payment:**
```javascript
{
  id: 'Q002',
  customerName: 'Trần Thị B',
  vehicleModel: 'Tesla Model X',
  totalAmount: 1800000000,
  status: 'paid',
  paymentType: 'full', // ✅ NEW: Trả full
  notes: 'Khách hàng đã thanh toán thành công',
  // ... other fields
}
```

#### **Q003 - Pending + Installment:**
```javascript
{
  id: 'Q003',
  customerName: 'Lê Văn C',
  vehicleModel: 'Tesla Model V',
  totalAmount: 950000000,
  status: 'pending',
  paymentType: 'installment', // ✅ NEW: Trả góp
  notes: 'Khách hàng muốn trả góp 12 tháng',
  // ... other fields
}
```

#### **Q004 - Paid + Installment:**
```javascript
{
  id: 'Q004',
  customerName: 'Phạm Thị D',
  vehicleModel: 'Tesla Model Y',
  totalAmount: 1300000000,
  status: 'paid',
  paymentType: 'installment', // ✅ NEW: Trả góp
  notes: 'Khách hàng đã thanh toán và chọn trả góp',
  paymentStatus: 'completed',
  paymentCompletedAt: '2024-01-11T10:00:00Z',
  // ... other fields
}
```

## 📊 Mock Data Summary

### Current Quotations:
1. **Q001** - Nguyễn Văn A
   - Status: `pending` (Chờ thanh toán)
   - Payment: `installment` (Trả góp) ✅
   
2. **Q002** - Trần Thị B
   - Status: `paid` (Đã thanh toán)
   - Payment: `full` (Trả full)
   
3. **Q003** - Lê Văn C
   - Status: `pending` (Chờ thanh toán)
   - Payment: `installment` (Trả góp) ✅
   
4. **Q004** - Phạm Thị D
   - Status: `paid` (Đã thanh toán)
   - Payment: `installment` (Trả góp) ✅

### Filter Results:
- **Tất cả**: 4 quotations
- **Chờ thanh toán**: 2 quotations (Q001, Q003)
- **Đã thanh toán**: 2 quotations (Q002, Q004)
- **Trả góp**: 3 quotations (Q001, Q003, Q004) ✅

## 🎯 Use Cases

### 1. **Dealer Staff muốn xem tất cả báo giá trả góp:**
```
1. Vào màn hình Sales
2. Nhấn tab "Trả góp"
3. Hiển thị 3 quotations: Q001, Q003, Q004
```

### 2. **Dealer Staff muốn tìm báo giá trả góp đã thanh toán:**
```
1. Vào màn hình Sales
2. Nhấn tab "Trả góp" → Thấy 3 quotations
3. Kiểm tra status badge màu xanh (Đã thanh toán) → Q004
```

### 3. **Dealer Staff muốn tìm báo giá trả góp chờ thanh toán:**
```
1. Vào màn hình Sales
2. Nhấn tab "Trả góp" → Thấy 3 quotations
3. Kiểm tra status badge màu vàng (Chờ thanh toán) → Q001, Q003
```

## 🔄 Filter Behavior

### **Filter Tab Display:**
```
┌─────────┬──────────────┬──────────────┬─────────┐
│ Tất cả  │ Chờ thanh toán│ Đã thanh toán│ Trả góp │
│   (4)   │      (2)      │      (2)     │   (3)   │
└─────────┴───────────────┴──────────────┴─────────┘
```

### **Filter Logic:**
- **Tất cả**: Hiển thị tất cả quotations (no filter)
- **Chờ thanh toán**: Filter by `status === 'pending'`
- **Đã thanh toán**: Filter by `status === 'paid'`
- **Trả góp**: Filter by `paymentType === 'installment'` ✅ **NEW**

### **Combined Filtering:**
Users can see both:
1. **Payment Type** (via filter tab): Installment vs Full
2. **Payment Status** (via badge color): Pending vs Paid

Example:
- **Trả góp + Chờ thanh toán**: Q001, Q003 (filter "Trả góp", look for yellow badges)
- **Trả góp + Đã thanh toán**: Q004 (filter "Trả góp", look for green badge)

## 🎨 UI/UX

### **Filter Tabs:**
```javascript
// Filter tabs render
{filterOptions.map((option) => (
  <TouchableOpacity
    key={option.key}
    style={[
      styles.filterOption,
      selectedFilter === option.key && styles.filterOptionActive,
    ]}
    onPress={() => setSelectedFilter(option.key)}
  >
    <Text style={styles.filterLabel}>{option.label}</Text>
    <Text style={styles.filterCount}>({option.count})</Text>
  </TouchableOpacity>
))}
```

### **Visual Feedback:**
- **Active filter**: Highlighted with gradient background
- **Count badge**: Shows number of quotations for each filter
- **Real-time updates**: Count updates as quotations change

## 🚀 Backend Integration Ready

### **Data Model:**
```javascript
// Quotation object structure
{
  id: String,
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  vehicleModel: String,
  vehicleImage: String,
  totalAmount: Number,
  status: Enum['pending', 'paid', 'expired'],
  paymentType: Enum['installment', 'full'], // ✅ NEW FIELD
  createdAt: Date,
  validUntil: Date,
  createdBy: String,
  dealerId: String,
  items: Array,
  notes: String,
  lastModified: Date,
  // Optional for paid quotations
  paymentStatus: String,
  paymentCompletedAt: Date,
}
```

### **API Endpoints (Ready for Implementation):**
```javascript
// Get quotations with payment type filter
GET /api/quotations?paymentType=installment

// Create quotation with payment type
POST /api/quotations
{
  // ... quotation data
  paymentType: 'installment' // or 'full'
}

// Update quotation payment type
PUT /api/quotations/:id
{
  paymentType: 'installment'
}
```

### **Filter Query Parameters:**
```javascript
// Current implementation (mock)
quotationService.getQuotations({ 
  status: 'pending',
  paymentType: 'installment', // ✅ NEW
  search: 'query',
  page: 1,
  limit: 10
})

// Future API implementation
fetch('/api/quotations?status=pending&paymentType=installment&search=query')
```

## 🧪 Testing Scenarios

### **Test Case 1: Filter by Installment**
```
Steps:
1. Navigate to Sales screen
2. Click on "Trả góp" filter tab
3. Verify count shows (3)
4. Verify quotations displayed: Q001, Q003, Q004
5. Verify all displayed quotations have paymentType === 'installment'
```

### **Test Case 2: Combined with Search**
```
Steps:
1. Navigate to Sales screen
2. Click on "Trả góp" filter tab
3. Enter "Phạm Thị D" in search box
4. Verify only Q004 is displayed
5. Verify Q004 has paymentType === 'installment'
```

### **Test Case 3: Switch Between Filters**
```
Steps:
1. Navigate to Sales screen
2. Click "Trả góp" → Verify 3 quotations
3. Click "Chờ thanh toán" → Verify 2 quotations
4. Click "Đã thanh toán" → Verify 2 quotations
5. Click "Tất cả" → Verify 4 quotations
```

### **Test Case 4: Filter Count Updates**
```
Steps:
1. Navigate to Sales screen
2. Note "Trả góp" count = 3
3. Create new quotation with paymentType = 'installment'
4. Return to Sales screen
5. Verify "Trả góp" count = 4
```

## 📈 Statistics & Insights

### **Current Distribution:**
- **Total Quotations**: 4
- **Installment**: 3 (75%)
- **Full Payment**: 1 (25%)

### **By Status:**
- **Pending + Installment**: 2 (Q001, Q003)
- **Paid + Installment**: 1 (Q004)
- **Paid + Full**: 1 (Q002)

### **Business Insights:**
- Majority of customers (75%) prefer installment payment
- Filter helps staff quickly identify and manage installment quotations
- Easy tracking of installment payment completion status

## 🔮 Future Enhancements

### **Potential Features:**
1. **Installment Details**:
   - Add installment plan details (months, monthly amount)
   - Show remaining installments
   - Track payment schedule

2. **Advanced Filters**:
   - Combine filters: "Trả góp + Chờ thanh toán"
   - Filter by installment duration (6 months, 12 months, etc.)
   - Filter by monthly payment range

3. **Installment Management**:
   - Dedicated installment management screen
   - Payment reminder system
   - Installment payment tracking

4. **Analytics**:
   - Installment vs Full payment trends
   - Average installment duration
   - Installment completion rate

## ✅ Validation

### **Completed:**
- ✅ Filter "Trả góp" added to filter options
- ✅ Filter logic implemented and working
- ✅ Mock data updated with paymentType field
- ✅ All 4 quotations have paymentType set
- ✅ Filter count displays correctly (3 installment quotations)
- ✅ No linter errors
- ✅ Backward compatible with existing code

### **Testing:**
- ✅ Filter displays in UI
- ✅ Filter count accurate
- ✅ Filtering works correctly
- ✅ Search + filter combination works
- ✅ Status badges still display correctly

**Filter "Trả góp" đã được thêm thành công vào màn hình Sales! 💰**
