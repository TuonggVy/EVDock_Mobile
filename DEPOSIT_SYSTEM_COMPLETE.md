# Complete Deposit System - Available & Pre-order

## ✅ **Đã Sửa Lỗi Navigation**

### **Files Created:**
1. ✅ `CreateDepositAvailableScreen.js` - Tạo đặt cọc xe có sẵn
2. ✅ `CreatePreOrderScreen.js` - Tạo pre-order
3. ✅ Added navigation routes

---

## 🎨 **Tab Design - Compact Version**

### **Before (Large):**
```
┌───────────────────────────┬───────────────────────────┐
│ 🚗                        │ 📦                        │
│ Xe có sẵn          (8)    │ Pre-order          (4)    │
│ Đặt cọc giành slot        │ Đặt xe từ hãng            │
└───────────────────────────┴───────────────────────────┘
Height: ~80px
```

### **After (Compact):**
```
┌─────────────────┬─────────────────┐
│ 🚗 Xe có sẵn (8)│ 📦 Pre-order (4)│
└─────────────────┴─────────────────┘
Height: ~40px ✅ (50% smaller)
```

### **Design Changes:**
- ✅ **Horizontal layout**: Icon + Text + Count in one row
- ✅ **Removed subtitle**: No "Đặt cọc giành slot" / "Đặt xe từ hãng"
- ✅ **Smaller icon**: 18px (was 24px)
- ✅ **Smaller text**: SMALL (was MEDIUM)
- ✅ **Tighter padding**: SMALL (was MEDIUM)
- ✅ **Compact count badge**: Minimal padding

---

## 🎯 **Complete Flow**

### **Flow 1: Đặt cọc xe có sẵn**

```
EmployeeHomeScreen
  ↓
Category: "Deposits" 💎
  ↓
DepositManagementScreen
  ├─ Tab: 🚗 Xe có sẵn (8)  ✓
  └─ Tab: 📦 Pre-order (4)
  ↓
"+" button
  ↓
Modal: Chọn loại đặt cọc
  ├─ 🚗 Xe có sẵn ✓
  │  • Đặt cọc để giành slot
  │  • Xe sẵn sàng giao ngay
  │  • Chọn màu có sẵn
  └─ 📦 Pre-order
  ↓
CreateDepositAvailableScreen
  ├─ Thông tin khách hàng
  ├─ Chọn xe từ inventory
  ├─ Đặt cọc 20% (default)
  ├─ Tính toán: Deposit + Remaining
  └─ Tạo đặt cọc
  ↓
✅ Deposit created
  ├─ Status: "Chờ xác nhận"
  ├─ Vehicle reserved
  └─ Back to DepositManagement
```

### **Flow 2: Tạo Pre-order**

```
DepositManagementScreen
  ↓
"+" button
  ↓
Modal: Chọn loại đặt cọc
  ├─ 🚗 Xe có sẵn
  └─ 📦 Pre-order ✓
     • Đặt xe mới từ hãng
     • Chọn màu theo ý muốn
     • Xe mới 100%
  ↓
CreatePreOrderScreen
  ├─ Info banner: "Thời gian chờ 1-3 tháng"
  ├─ Thông tin khách hàng
  ├─ Chọn xe từ catalog hãng
  ├─ Chọn màu tùy ý
  ├─ Đặt cọc 20-30%
  ├─ Thời gian dự kiến
  └─ Tạo pre-order
  ↓
✅ Pre-order created
  ├─ Status: "Chờ xác nhận"
  ├─ Send order to manufacturer
  ├─ Receive manufacturer order ID
  └─ Back to DepositManagement
```

---

## 📱 **Screen Designs**

### **1. DepositManagementScreen (Updated):**

```
┌──────────────────────────────────────────────┐
│  ← Quản lý đặt cọc              12 khoản  +  │
├──────────────────────────────────────────────┤
│  ┌─────────────────┬─────────────────┐       │
│  │ 🚗 Xe có sẵn (8)│ 📦 Pre-order (4)│       │ ✅ Compact!
│  └─────────────────┴─────────────────┘       │
├──────────────────────────────────────────────┤
│  🔍 Tìm kiếm...                              │
│  [Tất cả] [Chờ xác nhận] [Đã xác nhận]      │
├──────────────────────────────────────────────┤
│  [Deposit Cards...]                          │
└──────────────────────────────────────────────┘
```

### **2. CreateDepositAvailableScreen:**

```
┌──────────────────────────────────────────────┐
│  ← Đặt cọc xe có sẵn                         │
│     Tạo đặt cọc mới                          │
├──────────────────────────────────────────────┤
│  Thông tin khách hàng                        │
│  • Tên khách hàng *                          │
│  • Số điện thoại *                           │
│  • Email (tùy chọn)                          │
├──────────────────────────────────────────────┤
│  Thông tin xe                                │
│  • Model xe * [Chọn từ kho có sẵn]           │
│  • Màu xe                                    │
│  • Giá xe *                                  │
├──────────────────────────────────────────────┤
│  Thông tin đặt cọc                           │
│  • Tỷ lệ đặt cọc (%): 20                    │
│  ┌────────────────────────────────────┐     │
│  │ Đặt cọc: 250,000,000 VND           │     │
│  │ Còn lại: 1,000,000,000 VND         │     │
│  └────────────────────────────────────┘     │
│  • Ghi chú                                   │
├──────────────────────────────────────────────┤
│  [Tạo đặt cọc]                               │
└──────────────────────────────────────────────┘
```

### **3. CreatePreOrderScreen:**

```
┌──────────────────────────────────────────────┐
│  ← Tạo Pre-order                             │
│     Đặt xe từ hãng                           │
├──────────────────────────────────────────────┤
│  📦 Pre-order từ hãng                        │
│  Đơn hàng sẽ được gửi đến hãng sản xuất.    │
│  Thời gian chờ dự kiến: 1-3 tháng.          │
├──────────────────────────────────────────────┤
│  Thông tin khách hàng                        │
│  • Tên, SĐT, Email                           │
├──────────────────────────────────────────────┤
│  Thông tin xe                                │
│  • Model * [Chọn từ catalog hãng]            │
│  • Màu * (chọn màu theo ý muốn)             │
│    💡 Khách hàng có thể chọn bất kỳ màu nào │
│  • Giá xe *                                  │
├──────────────────────────────────────────────┤
│  Thông tin đặt cọc                           │
│  • Tỷ lệ đặt cọc: 20%                       │
│    💡 Thường 20-30% cho pre-order           │
│  ┌────────────────────────────────────┐     │
│  │ Đặt cọc: 360,000,000 VND           │     │
│  │ Còn lại: 1,440,000,000 VND         │     │
│  └────────────────────────────────────┘     │
│  • Thời gian dự kiến: 1-3 tháng             │
│    ⏱️ Từ khi đặt đến khi xe về              │
│  • Ghi chú                                   │
├──────────────────────────────────────────────┤
│  [Tạo Pre-order]                             │
└──────────────────────────────────────────────┘
```

---

## 🔧 **Features**

### **CreateDepositAvailableScreen:**
- ✅ Customer info inputs (Name, Phone, Email)
- ✅ Vehicle selection from available inventory
- ✅ Auto-calculate deposit (20% default)
- ✅ Real-time calculation display
- ✅ Form validation
- ✅ Confirmation alert

### **CreatePreOrderScreen:**
- ✅ Info banner about pre-order process
- ✅ Customer info inputs
- ✅ Vehicle selection from manufacturer catalog
- ✅ Custom color selection (any color)
- ✅ Auto-calculate deposit (20-30%)
- ✅ Estimated arrival time input
- ✅ Helper texts (💡 tips)
- ✅ Form validation
- ✅ Generate manufacturer order ID

---

## 📊 **Data Flow**

### **When Deposit is Created:**

```javascript
// CreateDepositAvailable/CreatePreOrder
const handleSubmit = () => {
  const depositData = {
    id: `DEP${Date.now()}`,
    type: 'available', // or 'pre_order'
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    vehicleModel: formData.vehicleModel,
    vehicleColor: formData.vehicleColor,
    vehiclePrice: parseFloat(formData.vehiclePrice),
    depositAmount: calculateDepositAmount(),
    depositPercentage: parseFloat(formData.depositPercentage),
    remainingAmount: calculateRemainingAmount(),
    status: 'pending',
    depositDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    createdBy: 'Dealer Staff',
  };
  
  // TODO: API call
  await depositService.createDeposit(depositData);
  
  navigation.goBack(); // Back to DepositManagement
};
```

### **Backend Integration:**

```javascript
// API call structure
POST /api/deposits/available
{
  customerName: String,
  customerPhone: String,
  vehicleId: String, // Selected from inventory
  vehicleModel: String,
  vehicleColor: String,
  vehiclePrice: Number,
  depositAmount: Number,
  depositPercentage: Number,
  remainingAmount: Number,
  expectedDeliveryDate: Date,
  notes: String,
}

Response:
{
  id: 'DEP001',
  status: 'pending',
  // ... all deposit data
  vehicleReserved: true, // Vehicle marked as reserved
  reservationExpiry: Date, // Auto-cancel if not paid
}
```

---

## ✨ **Summary**

### **Completed Features:**

1. ✅ **DepositManagementScreen** - Compact tabs design
2. ✅ **CreateDepositAvailableScreen** - Form để tạo đặt cọc xe có sẵn
3. ✅ **CreatePreOrderScreen** - Form để tạo pre-order
4. ✅ **Navigation routes** - All screens connected
5. ✅ **Modal selection** - Choose deposit type
6. ✅ **Real-time calculations** - Deposit + Remaining amounts
7. ✅ **Form validation** - Required fields checked
8. ✅ **Helper texts** - User guidance
9. ✅ **No linter errors** - Clean code

### **Tab Redesign:**
- ✅ **50% smaller**: Height reduced from ~80px to ~40px
- ✅ **Cleaner**: One-line layout
- ✅ **Clear**: Still easy to understand
- ✅ **More space**: For deposit cards

**Hệ thống đặt cọc hoàn chỉnh với tabs nhỏ gọn và navigation working! 🚗📦💎**
