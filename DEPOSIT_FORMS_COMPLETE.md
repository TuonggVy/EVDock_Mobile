# Deposit Forms - Complete Implementation

## ✅ Đã Hoàn Thành

### **Files Created/Updated:**
1. ✅ `depositStorageService.js` - Storage service với AsyncStorage
2. ✅ `CreateDepositAvailableScreen.js` - Form tạo đặt cọc xe có sẵn (with storage)
3. ✅ `CreatePreOrderScreen.js` - Form tạo pre-order (with storage)
4. ✅ `DepositManagementScreen.js` - Load data từ storage
5. ✅ `DepositDetailScreen.js` - View & manage deposits
6. ✅ `AppNavigator.js` - All routes added

---

## 🎯 Complete Workflow

### **1. Tạo đặt cọc xe có sẵn:**

```
CreateDepositAvailableScreen
  ↓
Staff nhập form:
  ├─ Thông tin khách hàng (Tên, SĐT, Email)
  ├─ Thông tin xe (Model, Màu, Giá)
  └─ Thông tin đặt cọc (Tỷ lệ 20%)
  ↓
Real-time calculation:
  • Đặt cọc: 250,000,000 VND (20%)
  • Còn lại: 1,000,000,000 VND (80%)
  ↓
Nhấn "Tạo đặt cọc"
  ↓
Confirm alert → Xác nhận
  ↓
✅ Deposit created:
  ├─ Save to AsyncStorage (@EVDock:Deposits)
  ├─ Generate ID: DEP + timestamp
  ├─ Status: 'pending'
  ├─ Expected delivery: +7 days
  ├─ Payment due: +14 days
  └─ Log: console.log('✅ Deposit created')
  ↓
Success alert:
  "Đã tạo đặt cọc xe có sẵn!
   Mã đặt cọc: DEP123456
   Số tiền đặt cọc: 250,000,000 VND"
  ↓
Navigate back → DepositManagementScreen
  ↓
✅ New deposit appears in list (useFocusEffect refresh)
```

### **2. Tạo Pre-order:**

```
CreatePreOrderScreen
  ↓
Info banner: "Thời gian chờ 1-3 tháng"
  ↓
Staff nhập form:
  ├─ Thông tin khách hàng
  ├─ Thông tin xe (Model, Màu tùy chọn, Giá)
  ├─ Đặt cọc 20-30%
  └─ Thời gian dự kiến: "1-3 tháng"
  ↓
Real-time calculation:
  • Đặt cọc: 360,000,000 VND
  • Còn lại: 1,440,000,000 VND
  ↓
Nhấn "Tạo Pre-order"
  ↓
Confirm alert → Xác nhận
  ↓
✅ Pre-order created:
  ├─ Save to AsyncStorage
  ├─ Generate deposit ID: DEP + timestamp
  ├─ Generate manufacturer order ID: MFG-PO-timestamp
  ├─ Status: 'pending'
  ├─ Expected delivery: +90 days
  ├─ Payment due: +97 days (7 days after delivery)
  ├─ Manufacturer status: 'ordered'
  └─ Log: console.log('✅ Pre-order created')
  ↓
Success alert:
  "Pre-order đã được tạo!
   Mã đặt cọc: DEP789012
   Mã đơn hãng: MFG-PO-1760441234567
   Số tiền đặt cọc: 360,000,000 VND
   
   Khách hàng sẽ được thông báo khi xe về."
  ↓
Navigate back → DepositManagementScreen
  ↓
✅ New pre-order appears in list
```

---

## 🔧 Technical Implementation

### **1. depositStorageService.js:**

```javascript
class DepositStorageService {
  STORAGE_KEY = '@EVDock:Deposits';

  // Generate unique ID
  generateDepositId() {
    return `DEP${Date.now()}${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
  }

  // Create deposit with full data structure
  async createDeposit(depositData) {
    const deposits = await this.getDeposits();
    
    const newDeposit = {
      id: this.generateDepositId(),
      type: depositData.type, // 'available' or 'pre_order'
      
      // Customer & Vehicle info
      customerId: depositData.customerId || `C${Date.now()}`,
      customerName: depositData.customerName,
      // ... all fields
      
      // Deposit amounts
      depositAmount: depositData.depositAmount,
      remainingAmount: depositData.remainingAmount,
      
      // Status & dates
      status: 'pending',
      depositDate: new Date().toISOString(),
      expectedDeliveryDate: depositData.expectedDeliveryDate,
      
      // Pre-order specific
      manufacturerOrderId: depositData.manufacturerOrderId,
      
      // Metadata
      createdAt: new Date().toISOString(),
      createdBy: 'Dealer Staff',
    };
    
    deposits.push(newDeposit);
    await this.saveDeposits(deposits);
    
    return newDeposit;
  }

  // Get, update, delete methods
  async getDeposits() { ... }
  async updateDeposit(id, data) { ... }
  async deleteDeposit(id) { ... }
  
  // Filter methods
  async getDepositsByType(type) { ... }
  async getDepositsByStatus(status) { ... }
  
  // Initialize with mock data
  async initializeWithMockData() { ... }
}

export default new DepositStorageService();
```

### **2. CreateDepositAvailableScreen.js:**

```javascript
import depositStorageService from '../../services/storage/depositStorageService';

const handleSubmit = async () => {
  // Validation
  if (!validateForm()) return;

  // Calculate amounts
  const { depositAmount, remainingAmount } = calculateAmounts();

  // Confirm
  Alert.alert('Xác nhận', ..., [
    {
      text: 'Xác nhận',
      onPress: async () => {
        try {
          // Calculate dates
          const expectedDeliveryDate = new Date();
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7); // +7 days

          const finalPaymentDueDate = new Date();
          finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 14); // +14 days

          // Create deposit data
          const depositData = {
            type: 'available',
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            vehicleModel: formData.vehicleModel,
            vehicleColor: formData.vehicleColor,
            vehiclePrice: parseFloat(formData.vehiclePrice),
            depositAmount: depositAmount,
            depositPercentage: parseFloat(formData.depositPercentage),
            remainingAmount: remainingAmount,
            expectedDeliveryDate: expectedDeliveryDate.toISOString(),
            finalPaymentDueDate: finalPaymentDueDate.toISOString(),
            notes: formData.notes,
          };

          // ✅ Save to AsyncStorage
          const newDeposit = await depositStorageService.createDeposit(depositData);
          
          console.log('✅ Deposit created:', newDeposit);

          // Success alert
          Alert.alert('Thành công', `Đã tạo đặt cọc!\nMã: ${newDeposit.id}`);
          
          // Navigate back
          navigation.goBack();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể tạo đặt cọc');
        }
      }
    }
  ]);
};
```

### **3. CreatePreOrderScreen.js:**

```javascript
import depositStorageService from '../../services/storage/depositStorageService';

const handleSubmit = async () => {
  // Validation
  if (!validateForm()) return;

  // Calculate amounts
  const { depositAmount, remainingAmount } = calculateAmounts();

  // Confirm
  Alert.alert('Xác nhận', ..., [
    {
      text: 'Xác nhận',
      onPress: async () => {
        try {
          // Generate manufacturer order ID
          const manufacturerOrderId = `MFG-PO-${Date.now()}`;
          
          // Calculate dates
          const expectedDeliveryDate = new Date();
          expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 90); // +90 days (3 months)

          const finalPaymentDueDate = new Date(expectedDeliveryDate);
          finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 7); // +7 days after delivery

          // Create deposit data
          const depositData = {
            type: 'pre_order',
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            vehicleModel: formData.vehicleModel,
            vehicleColor: formData.vehicleColor,
            vehiclePrice: parseFloat(formData.vehiclePrice),
            depositAmount: depositAmount,
            depositPercentage: parseFloat(formData.depositPercentage),
            remainingAmount: remainingAmount,
            expectedDeliveryDate: expectedDeliveryDate.toISOString(),
            finalPaymentDueDate: finalPaymentDueDate.toISOString(),
            manufacturerOrderId: manufacturerOrderId,
            manufacturerStatus: 'ordered',
            estimatedArrival: formData.expectedArrival || '1-3 tháng',
            notes: formData.notes,
          };

          // ✅ Save to AsyncStorage
          const newDeposit = await depositStorageService.createDeposit(depositData);
          
          console.log('✅ Pre-order created:', newDeposit);

          // Success alert
          Alert.alert(
            'Thành công',
            `Pre-order đã được tạo!\n\nMã đặt cọc: ${newDeposit.id}\nMã đơn hãng: ${manufacturerOrderId}`
          );
          
          // Navigate back
          navigation.goBack();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể tạo pre-order');
        }
      }
    }
  ]);
};
```

### **4. DepositManagementScreen.js:**

```javascript
import depositStorageService from '../../services/storage/depositStorageService';

// Load deposits from storage
const loadDeposits = async () => {
  // ✅ Load from AsyncStorage
  let allDeposits = await depositStorageService.getDeposits();
  
  // Initialize with mock data if empty
  if (allDeposits.length === 0) {
    allDeposits = await depositStorageService.initializeWithMockData();
  }
  
  setDeposits(allDeposits);
};

// Auto refresh when screen focuses
useFocusEffect(
  React.useCallback(() => {
    loadDeposits(); // ✅ Reload after creating deposit
  }, [])
);
```

---

## 📊 Data Flow

### **Create → Save → Load → Display:**

```
CreateDepositAvailableScreen
  ↓
User fills form & submits
  ↓
depositStorageService.createDeposit(data)
  ↓
AsyncStorage.setItem('@EVDock:Deposits', JSON.stringify([...deposits, newDeposit]))
  ↓
navigation.goBack()
  ↓
DepositManagementScreen (useFocusEffect triggers)
  ↓
depositStorageService.getDeposits()
  ↓
AsyncStorage.getItem('@EVDock:Deposits')
  ↓
setDeposits(loadedDeposits)
  ↓
✅ New deposit appears in list!
```

---

## 🔧 Features Implemented

### **1. Real-time Calculation:**
```javascript
const calculateAmounts = () => {
  const price = parseFloat(formData.vehiclePrice) || 0;
  const percentage = parseFloat(formData.depositPercentage) || 0;
  const depositAmount = (price * percentage) / 100;
  const remainingAmount = price - depositAmount;
  
  return { depositAmount, remainingAmount };
};

// Display in UI
{formData.vehiclePrice && (
  <View style={styles.calculationCard}>
    <Text>Đặt cọc: {formatCurrency(depositAmount)}</Text>
    <Text>Còn lại: {formatCurrency(remainingAmount)}</Text>
  </View>
)}
```

### **2. Form Validation:**
```javascript
const validateForm = () => {
  const newErrors = {};
  
  if (!formData.customerName.trim()) {
    newErrors.customerName = 'Vui lòng nhập tên khách hàng';
  }
  if (!formData.customerPhone.trim()) {
    newErrors.customerPhone = 'Vui lòng nhập số điện thoại';
  }
  if (!formData.vehicleModel.trim()) {
    newErrors.vehicleModel = 'Vui lòng chọn xe';
  }
  if (!formData.vehiclePrice.trim()) {
    newErrors.vehiclePrice = 'Vui lòng nhập giá xe';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Error display
{errors.customerName && <Text style={styles.errorText}>{errors.customerName}</Text>}
```

### **3. Auto-calculate Dates:**

#### **Available Deposit:**
```javascript
// Expected delivery: 7 days from now
const expectedDeliveryDate = new Date();
expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 7);

// Final payment due: 14 days from now
const finalPaymentDueDate = new Date();
finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 14);
```

#### **Pre-order:**
```javascript
// Expected delivery: 90 days from now (3 months)
const expectedDeliveryDate = new Date();
expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + 90);

// Final payment due: 7 days after delivery
const finalPaymentDueDate = new Date(expectedDeliveryDate);
finalPaymentDueDate.setDate(finalPaymentDueDate.getDate() + 7);
```

### **4. Manufacturer Order ID Generation:**
```javascript
// Pre-order specific
const manufacturerOrderId = `MFG-PO-${Date.now()}`;
// Example: MFG-PO-1760441234567
```

### **5. Data Persistence:**
```javascript
// Save to AsyncStorage
const newDeposit = await depositStorageService.createDeposit({
  type: 'available', // or 'pre_order'
  customerName: formData.customerName,
  customerPhone: formData.customerPhone,
  vehicleModel: formData.vehicleModel,
  vehiclePrice: parseFloat(formData.vehiclePrice),
  depositAmount: depositAmount,
  depositPercentage: parseFloat(formData.depositPercentage),
  remainingAmount: remainingAmount,
  // ... all other fields
});

// Auto-generate fields
newDeposit.id = 'DEP123456789';
newDeposit.customerId = 'C1760441234567';
newDeposit.status = 'pending';
newDeposit.createdAt = new Date().toISOString();
newDeposit.createdBy = 'Dealer Staff';
```

---

## 📱 UI Features

### **1. Input Styling:**
```javascript
// Gray background for better visibility
input: {
  backgroundColor: '#F5F5F5', // ✅ Light gray
  borderColor: '#E0E0E0',     // ✅ Gray border
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
}

// Error state
inputError: {
  borderColor: COLORS.ERROR, // Red border on error
}
```

### **2. Calculation Display:**

#### **Available Deposit (Blue):**
```javascript
calculationCard: {
  backgroundColor: '#E3F2FD', // Light blue
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
}
```

#### **Pre-order (Purple):**
```javascript
calculationCard: {
  backgroundColor: '#F3E5F5', // Light purple
  borderLeftWidth: 4,
  borderLeftColor: COLORS.SECONDARY,
}
```

### **3. Helper Texts:**
```javascript
// Pre-order specific helpers
<Text style={styles.helperText}>
  💡 Khách hàng có thể chọn bất kỳ màu nào từ catalog hãng
</Text>

<Text style={styles.helperText}>
  💡 Thường 20-30% cho pre-order
</Text>

<Text style={styles.helperText}>
  ⏱️ Thời gian từ khi đặt hàng đến khi xe về
</Text>
```

---

## 🚀 Backend Integration Ready

### **API Endpoints:**

```javascript
// Available Deposit
POST /api/deposits/available
{
  customerName: String,
  customerPhone: String,
  customerEmail: String,
  vehicleId: String, // Select from inventory
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
  vehicleReserved: true,
  // ... all deposit data
}

// Pre-order
POST /api/deposits/pre-order
{
  customerName: String,
  customerPhone: String,
  vehicleModel: String,
  vehicleColor: String, // Custom color
  vehiclePrice: Number,
  depositAmount: Number,
  depositPercentage: Number,
  remainingAmount: Number,
  estimatedArrival: String,
  notes: String,
}

Response:
{
  id: 'DEP002',
  manufacturerOrderId: 'MFG-PO-2024-001',
  manufacturerStatus: 'ordered',
  status: 'pending',
  // ... all deposit data
}

// Manufacturer Integration
POST /api/manufacturer/orders
{
  dealerId: String,
  vehicleModel: String,
  vehicleColor: String,
  quantity: 1,
  customerId: String,
  depositId: String,
}

Response:
{
  orderId: 'MFG-PO-2024-001',
  status: 'ordered',
  estimatedDelivery: Date,
  trackingUrl: String,
}
```

---

## ✅ Validation Summary

### **Required Fields:**
- ✅ Tên khách hàng *
- ✅ Số điện thoại *
- ✅ Model xe *
- ✅ Giá xe *

### **Optional Fields:**
- Email
- Màu xe
- Tỷ lệ đặt cọc (default 20%)
- Ghi chú

### **Auto-generated:**
- ✅ Deposit ID (DEP + timestamp)
- ✅ Customer ID (C + timestamp)
- ✅ Manufacturer Order ID (for pre-order)
- ✅ Expected delivery date
- ✅ Final payment due date
- ✅ Created at timestamp

---

## 🧪 Testing Scenarios

### **Test 1: Create Available Deposit**
```
1. Navigate to Deposits → "Xe có sẵn" tab → "+" button
2. Choose "Xe có sẵn" from modal
3. Fill form:
   - Name: "Test Customer"
   - Phone: "0901234567"
   - Vehicle: "Tesla Model Y"
   - Price: "1250000000"
4. Verify calculation: Deposit 250M, Remaining 1000M
5. Submit → Confirm
6. ✅ Verify success alert with deposit ID
7. ✅ Verify navigation back
8. ✅ Verify new deposit appears in list
```

### **Test 2: Create Pre-order**
```
1. Navigate to Deposits → "Pre-order" tab → "+" button
2. Choose "Pre-order" from modal
3. Fill form:
   - Name: "Test Customer 2"
   - Phone: "0907654321"
   - Vehicle: "Tesla Model X"
   - Color: "Trắng"
   - Price: "1800000000"
4. Verify calculation: Deposit 360M, Remaining 1440M
5. Submit → Confirm
6. ✅ Verify success alert with deposit ID + manufacturer order ID
7. ✅ Verify navigation back
8. ✅ Verify new pre-order appears in "Pre-order" tab
```

### **Test 3: Data Persistence**
```
1. Create a deposit
2. Close app completely
3. Reopen app
4. Navigate to Deposits
5. ✅ Verify deposit still appears (loaded from AsyncStorage)
```

---

## ✨ Summary

### **Completed:**
- ✅ **depositStorageService**: Full CRUD operations
- ✅ **CreateDepositAvailableScreen**: Working form with storage
- ✅ **CreatePreOrderScreen**: Working form with storage
- ✅ **DepositManagementScreen**: Load from storage
- ✅ **Auto-refresh**: useFocusEffect
- ✅ **Validation**: Required fields checked
- ✅ **Calculations**: Real-time deposit/remaining amounts
- ✅ **Dates**: Auto-calculated delivery/payment dates
- ✅ **IDs**: Auto-generated unique IDs
- ✅ **Persistence**: AsyncStorage integration
- ✅ **No linter errors**: Clean code

**Forms hoàn chỉnh! Có thể tạo deposit và pre-order thực sự với data persistence! 🎯**
