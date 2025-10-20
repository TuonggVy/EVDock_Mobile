# Pre-order Vehicle Selector Implementation

## ✅ Đã Hoàn Thành

Đã triển khai chức năng chọn xe từ catalog hãng cho Pre-order với 2-step selection: Model → Color.

---

## 🎯 Features

### **1. Two-Step Selection Process:**
```javascript
✅ Step 1: Select Vehicle Model from manufacturer catalog
✅ Step 2: Select Color (auto-opens after model selection)
✅ Price varies by color
✅ Auto-fill all form fields
✅ Disabled inputs for auto-filled data
✅ Visual feedback for selections
```

### **2. Manufacturer Catalog:**
```javascript
✅ 3 vehicle models (Model Y, Model X, Model V)
✅ Each with 5 color options
✅ Base price + color surcharge
✅ Estimated delivery time per model
✅ Vehicle description
```

### **3. Color Selection:**
```javascript
✅ Different prices per color
✅ Display price difference (e.g., +30M VND)
✅ Auto-calculate final price
✅ Disabled until model is selected
```

---

## 📊 Complete Workflow

```
Staff clicks "Chọn xe từ catalog hãng"
  ↓
Modal 1: Select Model
  • Tesla Model Y - 1.250.000.000 ₫
  • Tesla Model X - 1.800.000.000 ₫
  • Tesla Model V - 1.500.000.000 ₫
  ↓
Select "Tesla Model X"
  ↓
✅ Auto-fill:
  • Model: "Tesla Model X"
  • Expected arrival: "2-3 tháng"
  ↓
Modal 1 closes
  ↓
Modal 2: Select Color (auto-opens)
  • Trắng Pearl - 1.800.000.000 ₫
  • Đen - 1.800.000.000 ₫
  • Xám - 1.800.000.000 ₫
  • Xanh Deep Blue - 1.850.000.000 ₫ (+50M)
  • Đỏ Multi-Coat - 1.900.000.000 ₫ (+100M)
  ↓
Select "Đỏ Multi-Coat"
  ↓
✅ Auto-fill:
  • Color: "Đỏ Multi-Coat"
  • Price: "1.900.000.000 ₫" (formatted, disabled)
  ↓
Modal 2 closes
  ↓
Real-time calculation:
  • Đặt cọc: 380.000.000 ₫ (20%)
  • Còn lại: 1.520.000.000 ₫ (80%)
  ↓
Staff fills customer info
  ↓
Submit
  ↓
✅ Pre-order created:
{
  vehicleModel: 'Tesla Model X',
  vehicleColor: 'Đỏ Multi-Coat',
  vehiclePrice: 1900000000,
  manufacturerOrderId: 'MFG-PO-...',
  estimatedArrival: '2-3 tháng',
  ...
}
```

---

## 🔧 Technical Implementation

### **1. State Management:**

```javascript
const [showVehicleSelector, setShowVehicleSelector] = useState(false);
const [showColorSelector, setShowColorSelector] = useState(false);
const [selectedVehicle, setSelectedVehicle] = useState(null);

// Manufacturer catalog data
const manufacturerCatalog = [
  {
    id: 'MODEL_Y',
    model: 'Tesla Model Y',
    basePrice: 1250000000,
    availableColors: [
      { name: 'Trắng Pearl', price: 1250000000 },
      { name: 'Đen', price: 1250000000 },
      { name: 'Xám', price: 1250000000 },
      { name: 'Xanh Deep Blue', price: 1280000000 }, // +30M
      { name: 'Đỏ Multi-Coat', price: 1300000000 },   // +50M
    ],
    estimatedDelivery: '1-2 tháng',
    description: 'SUV điện 7 chỗ, hiệu suất cao',
  },
  // ... MODEL_X, MODEL_V
];
```

### **2. Select Vehicle Model:**

```javascript
const handleSelectVehicleModel = (catalogItem) => {
  // Save selected vehicle
  setSelectedVehicle(catalogItem);
  
  // Auto-fill model and expected arrival
  setFormData(prev => ({
    ...prev,
    vehicleModel: catalogItem.model,
    vehicleColor: '',     // Reset color
    vehiclePrice: '',     // Reset price
    expectedArrival: catalogItem.estimatedDelivery,
  }));
  
  // Close model selector
  setShowVehicleSelector(false);
  
  // Auto-open color selector after 300ms
  setTimeout(() => setShowColorSelector(true), 300);
};
```

### **3. Select Color:**

```javascript
const handleSelectColor = (color) => {
  // Auto-fill color and final price
  setFormData(prev => ({
    ...prev,
    vehicleColor: color.name,
    vehiclePrice: color.price.toString(),
  }));
  
  // Close color selector
  setShowColorSelector(false);
};
```

### **4. Vehicle Model Selector UI:**

```javascript
<TouchableOpacity
  style={[styles.selectInput, errors.vehicleModel && styles.inputError]}
  onPress={() => setShowVehicleSelector(true)}
>
  <View style={styles.selectInputContent}>
    <Text style={[styles.selectInputText, !formData.vehicleModel && styles.placeholderText]}>
      {formData.vehicleModel || 'Chọn xe từ catalog hãng'}
    </Text>
    {selectedVehicle && (
      <Text style={styles.selectInputSubtext}>
        {selectedVehicle.description} • Giao hàng: {selectedVehicle.estimatedDelivery}
      </Text>
    )}
  </View>
  <Text style={styles.selectIcon}>›</Text>
</TouchableOpacity>
```

### **5. Color Selector UI:**

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
  disabled={!formData.vehicleModel} // ✅ Disabled until model is selected
>
  <Text style={[styles.selectInputText, !formData.vehicleColor && styles.placeholderText]}>
    {formData.vehicleColor || 'Chọn màu từ catalog hãng'}
  </Text>
  <Text style={styles.selectIcon}>›</Text>
</TouchableOpacity>
```

### **6. Price Field - Disabled & Formatted:**

```javascript
<TextInput
  style={[styles.input, styles.inputDisabled]}
  placeholder="Giá sẽ tự động điền khi chọn màu"
  placeholderTextColor={COLORS.TEXT.SECONDARY}
  value={formData.vehiclePrice ? formatCurrency(parseFloat(formData.vehiclePrice)) : ''}
  editable={false} // ✅ Disabled
/>
```

### **7. Model Selector Modal:**

```javascript
<Modal visible={showVehicleSelector} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.vehicleSelectorModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn xe từ catalog hãng</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => setShowVehicleSelector(false)}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {manufacturerCatalog.map((catalogItem) => (
          <TouchableOpacity
            key={catalogItem.id}
            style={[
              styles.catalogCard,
              selectedVehicle?.id === catalogItem.id && styles.catalogCardSelected
            ]}
            onPress={() => handleSelectVehicleModel(catalogItem)}
          >
            {/* Model info */}
            <Text style={styles.catalogCardModel}>{catalogItem.model}</Text>
            <Text style={styles.catalogCardDescription}>{catalogItem.description}</Text>
            <Text style={styles.catalogCardDelivery}>⏱️ Giao hàng: {catalogItem.estimatedDelivery}</Text>
            
            {/* Price & Badge */}
            <Text style={styles.catalogCardPrice}>{formatCurrency(catalogItem.basePrice)}</Text>
            <View style={styles.catalogBadge}>
              <Text style={styles.catalogBadgeText}>Catalog hãng</Text>
            </View>
            
            {/* Selected indicator */}
            {selectedVehicle?.id === catalogItem.id && (
              <Text style={styles.selectedIndicatorText}>✓ Đã chọn</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  </View>
</Modal>
```

### **8. Color Selector Modal:**

```javascript
<Modal visible={showColorSelector} animationType="slide" transparent={true}>
  <View style={styles.modalOverlay}>
    <View style={styles.colorSelectorModal}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Chọn màu xe</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => setShowColorSelector(false)}>
          <Text style={styles.closeIcon}>×</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.modalBody}>
        {selectedVehicle?.availableColors.map((color, index) => {
          const isSelected = formData.vehicleColor === color.name;
          const priceDiff = color.price - selectedVehicle.basePrice;
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorCard,
                isSelected && styles.colorCardSelected
              ]}
              onPress={() => handleSelectColor(color)}
            >
              {/* Color name & pricing */}
              <View style={styles.colorCardContent}>
                <Text style={styles.colorCardName}>{color.name}</Text>
                <View style={styles.colorCardPricing}>
                  <Text style={styles.colorCardPrice}>{formatCurrency(color.price)}</Text>
                  {priceDiff > 0 && (
                    <Text style={styles.colorCardPriceDiff}>
                      +{formatCurrency(priceDiff)}
                    </Text>
                  )}
                </View>
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

## 🎨 Styling Highlights

### **1. Catalog Card:**
```javascript
catalogCard: {
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
  borderWidth: 1,
  borderColor: '#E9ECEF',
}

catalogCardSelected: {
  borderColor: COLORS.SECONDARY,  // ✅ Purple border
  borderWidth: 2,
  backgroundColor: '#F3E5F5',     // ✅ Light purple bg
}

catalogBadge: {
  backgroundColor: COLORS.SECONDARY, // ✅ Purple badge
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: SIZES.RADIUS.SMALL,
}
```

### **2. Color Card:**
```javascript
colorCard: {
  borderRadius: SIZES.RADIUS.MEDIUM,
  padding: SIZES.PADDING.MEDIUM,
  borderWidth: 1,
  borderColor: '#E9ECEF',
  flexDirection: 'row',            // ✅ Horizontal layout
  justifyContent: 'space-between',
}

colorCardSelected: {
  borderColor: COLORS.SECONDARY,
  borderWidth: 2,
  backgroundColor: '#F3E5F5',
}

colorCardPriceDiff: {
  fontSize: SIZES.FONT.XSMALL,
  color: '#FF6B6B',               // ✅ Red for surcharge
  marginLeft: 8,
}

colorSelectedIcon: {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: COLORS.SECONDARY, // ✅ Purple circle
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
│ │ Chọn xe từ catalog hãng       › │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Chọn màu từ catalog hãng      › │ │ (Disabled, gray)
│ └─────────────────────────────────┘ │
│ 💡 Giá có thể khác nhau tùy theo màu│
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
│ │ Tesla Model X                  › │ │
│ │ SUV cao cấp • Giao: 2-3 tháng   │ │ (Subtext)
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Chọn màu từ catalog hãng      › │ │ (Now enabled)
│ └─────────────────────────────────┘ │
│ 💡 Giá có thể khác nhau tùy theo màu│
└─────────────────────────────────────┘
```

### **After Full Selection:**
```
┌─────────────────────────────────────┐
│ Model xe *                           │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model X                  › │ │
│ │ SUV cao cấp • Giao: 2-3 tháng   │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Màu xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ Đỏ Multi-Coat                  › │ │
│ └─────────────────────────────────┘ │
│                                      │
│ Giá xe *                             │
│ ┌─────────────────────────────────┐ │
│ │ 1.900.000.000 ₫                  │ │ (Auto-filled, formatted)
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Đặt cọc: 380.000.000 ₫          │ │ (Real-time calc)
│ │ Còn lại: 1.520.000.000 ₫        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Model Selector Modal:**
```
┌─────────────────────────────────────┐
│ Chọn xe từ catalog hãng           × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model Y  1.250.000.000 ₫  │ │
│ │ SUV điện 7 chỗ   [Catalog hãng] │ │ (Purple badge)
│ │ ⏱️ Giao hàng: 1-2 tháng          │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │ (Selected - Purple)
│ │ Tesla Model X  1.800.000.000 ₫  │ │
│ │ SUV cao cấp      [Catalog hãng] │ │
│ │ ⏱️ Giao hàng: 2-3 tháng          │ │
│ │ ─────────────────────────────── │ │
│ │         ✓ Đã chọn               │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Tesla Model V  1.500.000.000 ₫  │ │
│ │ Sedan sang trọng [Catalog hãng] │ │
│ │ ⏱️ Giao hàng: 1-3 tháng          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Color Selector Modal:**
```
┌─────────────────────────────────────┐
│ Chọn màu xe                       × │
├─────────────────────────────────────┤
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Trắng Pearl                      │ │
│ │ 1.800.000.000 ₫                  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Xanh Deep Blue                   │ │
│ │ 1.850.000.000 ₫  +50.000.000 ₫  │ │ (Red surcharge)
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │ (Selected - Purple)
│ │ Đỏ Multi-Coat                  ✓ │ │ (Purple checkmark)
│ │ 1.900.000.000 ₫  +100.000.000 ₫ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🚀 Backend Integration Ready

### **API Endpoints:**

```javascript
// Get manufacturer catalog
GET /api/manufacturer/catalog
Response:
[
  {
    id: 'MODEL_Y',
    model: 'Tesla Model Y',
    basePrice: 1250000000,
    availableColors: [
      { colorId: 'WHITE_PEARL', name: 'Trắng Pearl', price: 1250000000 },
      { colorId: 'DEEP_BLUE', name: 'Xanh Deep Blue', price: 1280000000 },
      // ... more colors
    ],
    estimatedDelivery: '1-2 tháng',
    description: 'SUV điện 7 chỗ',
  },
  // ... more models
]

// Create pre-order
POST /api/deposits/pre-order
{
  modelId: 'MODEL_X',
  colorId: 'RED_MULTICOAT',
  vehicleModel: 'Tesla Model X',
  vehicleColor: 'Đỏ Multi-Coat',
  vehiclePrice: 1900000000,
  customerId: 'C123',
  depositAmount: 380000000,
  // ... other fields
}

Response:
{
  id: 'DEP001',
  manufacturerOrderId: 'MFG-PO-2024-001',
  status: 'pending',
  manufacturerStatus: 'ordered',
  estimatedDelivery: '2025-02-01',
  // ... deposit details
}

// Send order to manufacturer
POST /api/manufacturer/orders
{
  dealerId: 'D001',
  modelId: 'MODEL_X',
  colorId: 'RED_MULTICOAT',
  quantity: 1,
  depositId: 'DEP001',
  customerId: 'C123',
}

Response:
{
  orderId: 'MFG-PO-2024-001',
  status: 'ordered',
  estimatedProduction: '2025-01-15',
  estimatedDelivery: '2025-02-01',
  trackingUrl: 'https://manufacturer.com/track/...',
}
```

---

## ✅ Features Summary

### **Completed:**
```
✅ Two-step selection (Model → Color)
✅ Auto-open color selector after model selection
✅ 3 vehicle models in catalog
✅ 5 color options per model
✅ Variable pricing by color
✅ Display price difference for premium colors
✅ Auto-fill form fields
✅ Disabled inputs for auto-filled data
✅ Gray background for disabled fields
✅ Currency formatting
✅ Visual selection indicators
✅ Purple theme for pre-order
✅ Manufacturer catalog badge
✅ Estimated delivery time per model
✅ Helper text for color pricing
✅ Modal animations
✅ No linter errors
```

---

## 🧪 Testing

### **Test Scenario:**
```
1. Navigate to: Home → Deposits → + → Pre-order
2. Click "Chọn xe từ catalog hãng"
3. ✅ Modal slides up with 3 models
4. Click "Tesla Model X"
5. ✅ Card highlights purple
6. ✅ "✓ Đã chọn" appears
7. ✅ Modal closes
8. ✅ Color selector auto-opens (300ms delay)
9. ✅ See 5 color options with prices
10. Click "Đỏ Multi-Coat"
11. ✅ See "+100.000.000 ₫" surcharge
12. ✅ Purple checkmark appears
13. ✅ Modal closes
14. ✅ Form auto-filled:
   • Model: "Tesla Model X"
   • Color: "Đỏ Multi-Coat"
   • Price: "1.900.000.000 ₫" (formatted, disabled)
   • Expected arrival: "2-3 tháng"
15. ✅ Calculation updates:
   • Đặt cọc: 380.000.000 ₫
   • Còn lại: 1.520.000.000 ₫
16. Fill customer info & submit
17. ✅ Pre-order created successfully
```

---

## 📝 Key Differences from Available Deposit

### **Available Deposit:**
- Select from **inventory** (limited stock)
- Fixed price per vehicle
- Shows VIN number
- 1-step selection (vehicle only)
- Green "Có sẵn" badge
- Blue theme

### **Pre-order:**
- Select from **manufacturer catalog** (unlimited)
- Variable price by color
- No VIN (not yet manufactured)
- 2-step selection (model → color)
- Purple "Catalog hãng" badge
- Purple theme
- Shows estimated delivery time
- Price surcharge for premium colors

---

## ✨ Summary

**Chức năng chọn xe Pre-order đã hoàn thành!** 🎯

Staff có thể:
- ✅ Chọn model từ catalog hãng (3 options)
- ✅ Chọn màu với giá khác nhau (5 colors)
- ✅ Xem giá chênh lệch cho màu premium
- ✅ Auto-fill form với thông tin đầy đủ
- ✅ Tạo pre-order với manufacturer order ID
- ✅ 2-step workflow mượt mà

**Ready for backend integration!** 🚀
