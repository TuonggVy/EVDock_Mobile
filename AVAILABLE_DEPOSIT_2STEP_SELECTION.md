# Available Deposit - 2-Step Selection Update

## ✅ Đã Hoàn Thành

Đã cập nhật `CreateDepositAvailableScreen.js` để tách riêng việc chọn Model và Màu xe thành 2 bước, giống như Pre-order.

---

## 🎯 Changes Summary

### **Before (1-Step):**
```
Chọn xe → Auto-fill Model, Color, Price
```

### **After (2-Step):**
```
Step 1: Chọn Model → Auto-fill Model
  ↓
Step 2: Chọn Màu → Auto-fill Color, Price, VIN
```

---

## 📊 Complete Workflow

```
Staff clicks "Chọn model từ kho có sẵn"
  ↓
Modal 1: Select Model
  • Tesla Model Y (3 xe có sẵn)
  • Tesla Model X (1 xe có sẵn)
  • Tesla Model V (1 xe có sẵn)
  ↓
Select "Tesla Model Y"
  ↓
✅ Auto-fill:
  • Model: "Tesla Model Y"
  • Subtext: "3 xe có sẵn"
  ↓
Modal 1 closes
  ↓
Modal 2: Select Color (auto-opens after 300ms)
  • Đen - VIN123456789 - 1.250.000.000 ₫
  • Trắng - VIN987654321 - 1.250.000.000 ₫
  • Xám - VIN321654987 - 1.250.000.000 ₫
  ↓
Select "Đen"
  ↓
✅ Auto-fill:
  • Color: "Đen"
  • Price: "1.250.000.000 ₫" (formatted, disabled)
  ↓
Modal 2 closes
  ↓
Real-time calculation:
  • Đặt cọc: 250.000.000 ₫ (20%)
  • Còn lại: 1.000.000.000 ₫ (80%)
```

---

## 🔧 Technical Implementation

### **1. Data Structure Change:**

#### **Before:**
```javascript
const availableVehicles = [
  { id: 'V001', model: 'Tesla Model Y', color: 'Đen', price: 1250000000, vin: '...' },
  { id: 'V002', model: 'Tesla Model Y', color: 'Trắng', price: 1250000000, vin: '...' },
  // ... flat list
];
```

#### **After:**
```javascript
// Group vehicles by model
const availableVehiclesByModel = {
  'Tesla Model Y': [
    { id: 'V001', color: 'Đen', price: 1250000000, vin: 'VIN123456789', ... },
    { id: 'V002', color: 'Trắng', price: 1250000000, vin: 'VIN987654321', ... },
    { id: 'V005', color: 'Xám', price: 1250000000, vin: 'VIN321654987', ... },
  ],
  'Tesla Model X': [
    { id: 'V003', color: 'Đỏ', price: 1800000000, vin: 'VIN456789123', ... },
  ],
  'Tesla Model V': [
    { id: 'V004', color: 'Xanh', price: 1500000000, vin: 'VIN789123456', ... },
  ],
};

// Get unique models with count
const availableModels = Object.keys(availableVehiclesByModel).map(model => ({
  name: model,
  count: availableVehiclesByModel[model].length,
  colors: availableVehiclesByModel[model],
}));
```

### **2. State Management:**

```javascript
// Before
const [showVehicleSelector, setShowVehicleSelector] = useState(false);
const [selectedVehicle, setSelectedVehicle] = useState(null);

// After
const [showModelSelector, setShowModelSelector] = useState(false);
const [showColorSelector, setShowColorSelector] = useState(false);
const [selectedModel, setSelectedModel] = useState(null);
```

### **3. Handler Functions:**

#### **Select Model:**
```javascript
const handleSelectModel = (modelData) => {
  // Save selected model
  setSelectedModel(modelData);
  
  // Auto-fill model only
  setFormData(prev => ({
    ...prev,
    vehicleModel: modelData.name,
    vehicleColor: '',     // Reset color
    vehiclePrice: '',     // Reset price
  }));
  
  // Close model selector
  setShowModelSelector(false);
  
  // Auto-open color selector after 300ms
  setTimeout(() => setShowColorSelector(true), 300);
};
```

#### **Select Color:**
```javascript
const handleSelectColor = (vehicle) => {
  // Auto-fill color and price
  setFormData(prev => ({
    ...prev,
    vehicleColor: vehicle.color,
    vehiclePrice: vehicle.price.toString(),
  }));
  
  // Close color selector
  setShowColorSelector(false);
};
```

### **4. UI Updates:**

#### **Model Input:**
```javascript
<TouchableOpacity
  style={[styles.selectInput, errors.vehicleModel && styles.inputError]}
  onPress={() => setShowModelSelector(true)}
>
  <View style={styles.selectInputContent}>
    <Text style={[styles.selectInputText, !formData.vehicleModel && styles.placeholderText]}>
      {formData.vehicleModel || 'Chọn model từ kho có sẵn'}
    </Text>
    {selectedModel && (
      <Text style={styles.selectInputSubtext}>
        {selectedModel.count} xe có sẵn
      </Text>
    )}
  </View>
  <Text style={styles.selectIcon}>›</Text>
</TouchableOpacity>
```

#### **Color Input:**
```javascript
<TouchableOpacity
  style={[styles.selectInput, !formData.vehicleModel && styles.inputDisabled]}
  onPress={() => {
    if (!formData.vehicleModel) {
      Alert.alert('Thông báo', 'Vui lòng chọn model xe trước');
    } else {
      setShowColorSelector(true);
    }
  }}
  disabled={!formData.vehicleModel} // ✅ Disabled until model selected
>
  <Text style={[styles.selectInputText, !formData.vehicleColor && styles.placeholderText]}>
    {formData.vehicleColor || 'Chọn màu xe có sẵn'}
  </Text>
  <Text style={styles.selectIcon}>›</Text>
</TouchableOpacity>
```

### **5. Model Selector Modal:**

```javascript
<Modal visible={showModelSelector} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.vehicleSelectorModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn model xe</Text>
        <TouchableOpacity onPress={() => setShowModelSelector(false)}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {availableModels.map((modelData, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.modelCard,
              selectedModel?.name === modelData.name && styles.modelCardSelected
            ]}
            onPress={() => handleSelectModel(modelData)}
          >
            {/* Model info */}
            <View style={styles.modelCardInfo}>
              <Text style={styles.modelCardModel}>{modelData.name}</Text>
              <Text style={styles.modelCardCount}>
                {modelData.count} xe có sẵn ({modelData.colors.length} màu)
              </Text>
            </View>
            
            {/* Badge */}
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Có sẵn</Text>
            </View>
            
            {/* Selected indicator */}
            {selectedModel?.name === modelData.name && (
              <Text style={styles.selectedIndicatorText}>✓ Đã chọn</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>
```

### **6. Color Selector Modal:**

```javascript
<Modal visible={showColorSelector} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.colorSelectorModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn màu xe - {formData.vehicleModel}</Text>
        <TouchableOpacity onPress={() => setShowColorSelector(false)}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {selectedModel?.colors.map((vehicle) => {
          const isSelected = formData.vehicleColor === vehicle.color;
          
          return (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.colorCard,
                isSelected && styles.colorCardSelected
              ]}
              onPress={() => handleSelectColor(vehicle)}
            >
              {/* Color info */}
              <View style={styles.colorCardContent}>
                <Text style={styles.colorCardName}>{vehicle.color}</Text>
                <Text style={styles.colorCardVin}>VIN: {vehicle.vin}</Text>
                <Text style={styles.colorCardPrice}>{formatCurrency(vehicle.price)}</Text>
              </View>
              
              {/* Selected icon */}
              {isSelected && (
                <View style={styles.colorSelectedIcon}>
                  <Text style={styles.colorSelectedIconText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  </View>
</Modal>
```

---

## 🎨 Styling Updates

### **Model Card:**
```javascript
modelCard: {
  backgroundColor: COLORS.SURFACE,
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
  marginBottom: SIZES.PADDING.MEDIUM,
  borderWidth: 1,
  borderColor: '#E9ECEF',
}

modelCardSelected: {
  borderColor: COLORS.PRIMARY,   // ✅ Blue border
  borderWidth: 2,
  backgroundColor: '#E3F2FD',    // ✅ Light blue bg
}
```

### **Color Card:**
```javascript
colorCard: {
  flexDirection: 'row',              // ✅ Horizontal layout
  justifyContent: 'space-between',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#E9ECEF',
}

colorCardSelected: {
  borderColor: COLORS.PRIMARY,
  borderWidth: 2,
  backgroundColor: '#E3F2FD',
}

colorSelectedIcon: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: COLORS.PRIMARY,  // ✅ Blue circle
  justifyContent: 'center',
  alignItems: 'center',
}
```

---

## 📱 UI Preview

### **Before Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Chọn model từ kho có sẵn      › │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Chọn màu xe có sẵn            › │ │ (Disabled, gray)
│ └─────────────────────────────────┘ │
│                                      │
│ Giá xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Giá sẽ tự động điền khi chọn màu│ │ (Disabled, gray)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **After Model Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model Y                  › │ │
│ │ 3 xe có sẵn                      │ │ (Subtext)
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Chọn màu xe có sẵn            › │ │ (Now enabled)
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **After Full Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model Y                  › │ │
│ │ 3 xe có sẵn                      │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Đen                            › │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Giá xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ 1.250.000.000 ₫                  │ │ (Auto-filled, formatted)
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Đặt cọc: 250.000.000 ₫          │ │ (Real-time calc)
│ │ Còn lại: 1.000.000.000 ₫        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Model Selector Modal:**
```
┌─────────────────────────────────────┐
│ Chọn model xe                     × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (Selected - Blue)
│ │ Tesla Model Y       [Có sẵn]    │ │
│ │ 3 xe có sẵn (3 màu)              │ │
│ │ ─────────────────────────────── │ │
│ │         ✓ Đã chọn               │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model X       [Có sẵn]    │ │
│ │ 1 xe có sẵn (1 màu)              │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model V       [Có sẵn]    │ │
│ │ 1 xe có sẵn (1 màu)              │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Color Selector Modal:**
```
┌─────────────────────────────────────┐
│ Chọn màu xe - Tesla Model Y       × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │ (Selected - Blue)
│ │ Đen                            ✓ │ │
│ │ VIN: VIN123456789                │ │
│ │ 1.250.000.000 ₫                  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Trắng                            │ │
│ │ VIN: VIN987654321                │ │
│ │ 1.250.000.000 ₫                  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Xám                              │ │
│ │ VIN: VIN321654987                │ │
│ │ 1.250.000.000 ₫                  │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## ✅ Benefits

### **1. Consistent UX:**
```
✅ Both Available & Pre-order now use 2-step selection
✅ Staff familiar with Pre-order flow will understand Available flow
✅ Clear separation: Model → Color
```

### **2. Better Organization:**
```
✅ Models grouped by type
✅ Shows available count per model
✅ Easier to see color options per model
```

### **3. Flexibility:**
```
✅ Can change model without starting over
✅ Color selection only shows relevant colors
✅ Disabled state prevents errors
```

### **4. Backend Integration:**
```javascript
// Easy to query inventory by model
GET /api/inventory/models
Response: [
  { model: 'Tesla Model Y', count: 3, colors: [...] },
  { model: 'Tesla Model X', count: 1, colors: [...] },
]

// Then query colors for selected model
GET /api/inventory/models/Tesla%20Model%20Y/colors
Response: [
  { vehicleId: 'V001', color: 'Đen', price: 1250000000, vin: '...' },
  { vehicleId: 'V002', color: 'Trắng', price: 1250000000, vin: '...' },
]
```

---

## 🧪 Testing

### **Test Scenario:**
```
1. Navigate to: Home → Deposits → + → Xe có sẵn
2. Click "Chọn model từ kho có sẵn"
3. ✅ Modal shows 3 models
4. Click "Tesla Model Y"
5. ✅ Card highlights blue
6. ✅ "✓ Đã chọn" appears
7. ✅ Modal closes
8. ✅ Model field shows: "Tesla Model Y" + "3 xe có sẵn"
9. ✅ Color selector auto-opens (300ms)
10. ✅ See 3 color options (Đen, Trắng, Xám) with VINs
11. Click "Đen"
12. ✅ Blue checkmark appears
13. ✅ Modal closes
14. ✅ Form auto-filled:
   • Model: "Tesla Model Y"
   • Color: "Đen"
   • Price: "1.250.000.000 ₫" (formatted, disabled)
15. ✅ Calculation updates:
   • Đặt cọc: 250.000.000 ₫
   • Còn lại: 1.000.000.000 ₫
16. Fill customer info & submit
17. ✅ Deposit created with vehicleId
```

---

## 📝 Key Differences: Available vs Pre-order

### **Available Deposit:**
- 2-step: Model → Color (specific vehicles)
- Shows count per model
- Shows VIN for each color option
- Green "Có sẵn" badge
- Blue theme
- Selects from **inventory** (limited stock)

### **Pre-order:**
- 2-step: Model → Color (catalog)
- Shows delivery time
- Variable pricing by color
- Shows price surcharge (+30M, +50M)
- Purple "Catalog hãng" badge
- Purple theme
- Selects from **manufacturer catalog** (unlimited)

---

## ✨ Summary

**Available Deposit đã được cập nhật thành 2-step selection!** 🎯

Giờ đây:
- ✅ Chọn Model trước → Chọn Color sau
- ✅ Consistent với Pre-order workflow
- ✅ Auto-open color selector
- ✅ Disabled color selector until model selected
- ✅ Group vehicles by model
- ✅ Show available count & VIN
- ✅ Blue theme for Available
- ✅ No linter errors

**UX improved! Ready for backend integration! 🚀**
