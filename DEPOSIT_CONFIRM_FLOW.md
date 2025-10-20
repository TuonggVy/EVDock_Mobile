# Deposit Confirmation Flow

## ✅ Đã Hoàn Thành

Đã triển khai chức năng xác nhận đặt cọc với tự động chuyển trạng thái và filter.

---

## 🎯 Features

### **1. Confirm Deposit:**
```javascript
✅ Button "Xác nhận đặt cọc" in DepositDetailScreen
✅ Update deposit status from 'pending' to 'confirmed'
✅ Save to AsyncStorage via depositStorageService
✅ Save confirmation timestamp & confirmedBy
```

### **2. Auto Filter Switch:**
```javascript
✅ After confirmation, auto-reload deposits
✅ Auto-switch to "Đã xác nhận" filter
✅ Show confirmed deposit in the list
✅ Callback mechanism from detail screen to management screen
```

### **3. Status Management:**
```javascript
✅ pending → confirmed (via button)
✅ confirmed → completed (via final payment)
✅ Color indicators: Yellow → Green → Gray
```

---

## 📊 Complete Workflow

```
Staff views deposit (status: pending)
  ↓
DepositDetailScreen shows:
  • Customer info
  • Vehicle info
  • Deposit amount
  • Status badge: "Chờ xác nhận" (Yellow)
  • Button: "Xác nhận đặt cọc"
  ↓
Staff clicks "Xác nhận đặt cọc"
  ↓
Confirmation alert:
  "Xác nhận đặt cọc cho khách hàng [Name]?
   Số tiền đặt cọc: 250.000.000 ₫"
  ↓
Staff clicks "Xác nhận"
  ↓
✅ Update in AsyncStorage:
  • status: 'confirmed'
  • confirmedAt: current timestamp
  • confirmedBy: 'Dealer Staff'
  ↓
✅ Call onDepositUpdate(updatedDeposit)
  ↓
Success alert:
  "Đã xác nhận đặt cọc!
   Trạng thái đã chuyển sang 'Đã xác nhận'."
  ↓
navigation.goBack()
  ↓
DepositManagementScreen:
  • useFocusEffect → loadDeposits()
  • handleDepositUpdate() triggered
  • setSelectedStatus('confirmed')
  ↓
✅ Filter automatically switches to "Đã xác nhận"
✅ Confirmed deposit appears in list
✅ Status badge now shows: "Đã xác nhận" (Green)
```

---

## 🔧 Technical Implementation

### **1. DepositDetailScreen.js:**

#### **Import Storage Service:**
```javascript
import depositStorageService from '../../services/storage/depositStorageService';
```

#### **Get Callback from Route:**
```javascript
const DepositDetailScreen = ({ navigation, route }) => {
  const { deposit: initialDeposit, onDepositUpdate } = route.params;
  const [deposit, setDeposit] = useState(initialDeposit);
  // ...
};
```

#### **Confirm Deposit Handler:**
```javascript
const handleConfirmDeposit = async () => {
  Alert.alert(
    'Xác nhận đặt cọc',
    `Xác nhận đặt cọc cho khách hàng ${deposit.customerName}?\n\nSố tiền đặt cọc: ${formatCurrency(deposit.depositAmount)}`,
    [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xác nhận',
        onPress: async () => {
          try {
            // 1. Update status in AsyncStorage
            await depositStorageService.updateDeposit(deposit.id, {
              status: 'confirmed',
              confirmedAt: new Date().toISOString(),
              confirmedBy: 'Dealer Staff',
            });
            
            // 2. Update local state
            const updatedDeposit = { 
              ...deposit, 
              status: 'confirmed',
              confirmedAt: new Date().toISOString(),
            };
            setDeposit(updatedDeposit);
            
            console.log('✅ Deposit confirmed:', deposit.id);
            
            // 3. Call callback to parent screen
            if (onDepositUpdate) {
              onDepositUpdate(updatedDeposit);
            }
            
            // 4. Show success message
            Alert.alert(
              'Thành công', 
              'Đã xác nhận đặt cọc!\n\nTrạng thái đã chuyển sang "Đã xác nhận".',
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to management screen
                    navigation.goBack();
                  }
                }
              ]
            );
          } catch (error) {
            console.error('Error confirming deposit:', error);
            Alert.alert('Lỗi', 'Không thể xác nhận đặt cọc. Vui lòng thử lại.');
          }
        }
      }
    ]
  );
};
```

### **2. DepositManagementScreen.js:**

#### **Pass Callback to Detail Screen:**
```javascript
const handleViewDeposit = (deposit) => {
  navigation.navigate('DepositDetail', { 
    deposit,
    onDepositUpdate: handleDepositUpdate, // ✅ Pass callback
  });
};
```

#### **Handle Deposit Update:**
```javascript
const handleDepositUpdate = async (updatedDeposit) => {
  // 1. Reload deposits to get latest data from storage
  await loadDeposits();
  
  // 2. If deposit was confirmed, auto-switch to 'confirmed' filter
  if (updatedDeposit && updatedDeposit.status === 'confirmed') {
    setSelectedStatus('confirmed'); // ✅ Auto switch filter
  }
};
```

#### **useFocusEffect (Already Exists):**
```javascript
useFocusEffect(
  React.useCallback(() => {
    loadDeposits(); // ✅ Auto-reload when screen focuses
  }, [])
);
```

### **3. depositStorageService.js (Already Exists):**

```javascript
// Update deposit in AsyncStorage
async updateDeposit(depositId, updateData) {
  const deposits = await this.getDeposits();
  const depositIndex = deposits.findIndex(d => d.id === depositId);
  
  if (depositIndex === -1) {
    throw new Error('Deposit not found');
  }
  
  // Merge update data
  deposits[depositIndex] = {
    ...deposits[depositIndex],
    ...updateData,
    lastModified: new Date().toISOString(),
  };
  
  await this.saveDeposits(deposits);
  
  console.log('✅ Deposit updated:', depositId);
  return deposits[depositIndex];
}
```

---

## 🎨 UI Updates

### **Status Badge Colors:**

```javascript
const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return COLORS.WARNING;     // ⚠️ Yellow
    case 'confirmed': return COLORS.SUCCESS;    // ✅ Green
    case 'completed': return COLORS.TEXT.SECONDARY; // ✓ Gray
    case 'cancelled': return COLORS.ERROR;      // ❌ Red
    default: return COLORS.TEXT.SECONDARY;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Chờ xác nhận';
    case 'confirmed': return 'Đã xác nhận';
    case 'completed': return 'Hoàn thành';
    case 'cancelled': return 'Đã hủy';
    default: return 'Unknown';
  }
};
```

### **Filter Options:**

```javascript
const statusOptions = [
  { key: 'all', label: 'Tất cả', count: ... },
  { key: 'pending', label: 'Chờ xác nhận', count: ... },
  { key: 'confirmed', label: 'Đã xác nhận', count: ... }, // ✅ Auto-selected after confirm
  { key: 'completed', label: 'Hoàn thành', count: ... },
];
```

### **Action Indicator Text:**

```javascript
{!isCompleted && (
  <View style={styles.actionIndicator}>
    <Text style={styles.actionText}>
      {item.status === 'pending' 
        ? '⏳ Chờ xác nhận đặt cọc'          // Before confirm
        : isPreOrder
        ? '📦 Chờ xe về từ hãng'             // After confirm (pre-order)
        : '🚗 Xe sẵn sàng - Chờ thanh toán'} // After confirm (available)
    </Text>
  </View>
)}
```

---

## 📱 UI Preview

### **Before Confirmation:**

#### **DepositDetailScreen:**
```
┌─────────────────────────────────────┐
│ ← Chi tiết đặt cọc                   │
├─────────────────────────────────────┤
│ Status: [Chờ xác nhận] (Yellow)      │
│                                      │
│ Khách hàng: Nguyễn Văn A            │
│ SĐT: 0901234567                      │
│                                      │
│ Xe: Tesla Model Y - Đen             │
│ Giá: 1.250.000.000 ₫                │
│                                      │
│ Đã đặt cọc: 250.000.000 ₫ (20%)     │
│ Còn lại: 1.000.000.000 ₫            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │   Xác nhận đặt cọc              │ │ (Button)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### **DepositManagementScreen (Filter: Chờ xác nhận):**
```
┌─────────────────────────────────────┐
│ [Chờ xác nhận] [Đã xác nhận] [...]  │
│     ↑ Current                        │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ #DEP001                          │ │
│ │ Nguyễn Văn A [Chờ xác nhận]     │ │
│ │ Tesla Model Y                    │ │
│ │ ⏳ Chờ xác nhận đặt cọc           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Confirmation Alert:**
```
┌─────────────────────────────────────┐
│       Xác nhận đặt cọc              │
│                                      │
│ Xác nhận đặt cọc cho khách hàng     │
│ Nguyễn Văn A?                       │
│                                      │
│ Số tiền đặt cọc: 250.000.000 ₫     │
│                                      │
│    [Hủy]           [Xác nhận]       │
└─────────────────────────────────────┘
```

### **After Confirmation:**

#### **Success Alert:**
```
┌─────────────────────────────────────┐
│           Thành công                 │
│                                      │
│ Đã xác nhận đặt cọc!                │
│                                      │
│ Trạng thái đã chuyển sang           │
│ "Đã xác nhận".                      │
│                                      │
│               [OK]                   │
└─────────────────────────────────────┘
```

#### **DepositManagementScreen (Filter: AUTO-SWITCHED to Đã xác nhận):**
```
┌─────────────────────────────────────┐
│ [Chờ xác nhận] [Đã xác nhận] [...]  │
│                    ↑ Auto-switched   │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ #DEP001                          │ │
│ │ Nguyễn Văn A [Đã xác nhận]      │ │ (Green badge)
│ │ Tesla Model Y                    │ │
│ │ 📦 Chờ xe về từ hãng             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 Backend Integration Ready

### **API Endpoints:**

```javascript
// Confirm deposit
PUT /api/deposits/:depositId/confirm
Request:
{
  confirmedBy: 'staff001',
  confirmedAt: '2024-10-14T10:30:00Z',
}

Response:
{
  id: 'DEP001',
  status: 'confirmed',
  confirmedAt: '2024-10-14T10:30:00Z',
  confirmedBy: 'staff001',
  // ... other fields
}

// Get deposits with filter
GET /api/deposits?type=available&status=confirmed
Response:
[
  {
    id: 'DEP001',
    type: 'available',
    status: 'confirmed',
    // ...
  },
  // ...
]
```

---

## ✅ Data Flow

### **1. Confirmation:**
```
DepositDetailScreen
  ↓
handleConfirmDeposit()
  ↓
depositStorageService.updateDeposit(id, { status: 'confirmed', ... })
  ↓
AsyncStorage updated
  ↓
setDeposit(updatedDeposit)
  ↓
onDepositUpdate(updatedDeposit) callback
  ↓
DepositManagementScreen.handleDepositUpdate()
```

### **2. Filter Switch:**
```
handleDepositUpdate(updatedDeposit)
  ↓
if (updatedDeposit.status === 'confirmed')
  ↓
setSelectedStatus('confirmed')
  ↓
filterDeposits() useEffect triggered
  ↓
filtered = deposits.filter(d => d.status === 'confirmed')
  ↓
✅ Display only confirmed deposits
```

### **3. Screen Refresh:**
```
navigation.goBack()
  ↓
DepositManagementScreen focused
  ↓
useFocusEffect triggered
  ↓
loadDeposits()
  ↓
depositStorageService.getDeposits()
  ↓
AsyncStorage.getItem('@EVDock:Deposits')
  ↓
✅ Latest data loaded (including confirmed status)
```

---

## 🧪 Testing

### **Test Scenario 1: Available Deposit:**
```
1. Navigate to: Deposits → Xe có sẵn → Chờ xác nhận
2. ✅ See deposit with yellow "Chờ xác nhận" badge
3. Tap on deposit card
4. ✅ DepositDetailScreen opens
5. ✅ See "Xác nhận đặt cọc" button
6. Tap "Xác nhận đặt cọc"
7. ✅ Confirmation alert appears
8. Tap "Xác nhận"
9. ✅ Success alert appears
10. Tap "OK"
11. ✅ Navigate back to DepositManagementScreen
12. ✅ Filter auto-switches to "Đã xác nhận"
13. ✅ Deposit appears with green "Đã xác nhận" badge
14. ✅ Action text shows: "🚗 Xe sẵn sàng - Chờ thanh toán"
```

### **Test Scenario 2: Pre-order:**
```
1. Navigate to: Deposits → Pre-order → Chờ xác nhận
2. ✅ See pre-order with yellow "Chờ xác nhận" badge
3. Tap on pre-order card
4. ✅ DepositDetailScreen opens
5. ✅ See "Xác nhận đặt cọc" button
6. Tap "Xác nhận đặt cọc"
7. ✅ Confirmation alert with customer name & amount
8. Tap "Xác nhận"
9. ✅ Success alert appears
10. Tap "OK"
11. ✅ Navigate back to DepositManagementScreen
12. ✅ Filter auto-switches to "Đã xác nhận"
13. ✅ Pre-order appears with green "Đã xác nhận" badge
14. ✅ Purple "Pre-order" badge still visible
15. ✅ Action text shows: "📦 Chờ xe về từ hãng"
```

### **Test Scenario 3: Data Persistence:**
```
1. Confirm a deposit
2. Close app completely
3. Reopen app
4. Navigate to: Deposits → Đã xác nhận
5. ✅ Confirmed deposit still appears
6. ✅ Status remains "Đã xác nhận"
7. ✅ Data loaded from AsyncStorage
```

---

## ✨ Summary

**Deposit confirmation flow hoàn chỉnh!** 🎯

Features:
- ✅ Button "Xác nhận đặt cọc" in detail screen
- ✅ Update status: pending → confirmed
- ✅ Save to AsyncStorage with timestamp
- ✅ Auto-reload deposits in management screen
- ✅ Auto-switch to "Đã xác nhận" filter
- ✅ Callback mechanism parent ↔ child
- ✅ Visual feedback (yellow → green badge)
- ✅ Action text updates
- ✅ Works for both Available & Pre-order
- ✅ Data persistence
- ✅ No linter errors

**Ready for backend integration! 🚀**
